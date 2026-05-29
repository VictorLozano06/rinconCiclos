import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RecursoDto } from '../dto/recurso.dto';
import { RecursoService } from './recurso.service';

/**
 * Estructura mínima de cada sugerencia mostrada debajo del buscador.
 *
 * Cada fila necesita:
 * - un título visible
 * - un subtítulo de contexto
 * - el tipo de elemento encontrado
 * - la ruta final a la que debe navegar Angular
 */
export interface SugerenciaBusqueda {
  titulo: string;
  subtitulo: string;
  tipo: 'Recurso';
  ruta: string;
}

/**
 * Rol desde el que se ejecuta el buscador.
 *
 * El buscador solo trabaja con recursos, pero la ruta final cambia según
 * estemos navegando como profesor o como coordinador.
 */
type RolBusqueda = 'profesor' | 'coordinador';

/**
 * Servicio compartido del buscador global de recursos.
 *
 * Este servicio centraliza toda la lógica de búsqueda:
 * - guarda el término actual
 * - mantiene la lista de sugerencias visible
 * - informa del estado "Buscando..."
 * - pide todos los recursos una sola vez
 * - filtra en memoria y construye las rutas finales
 *
 * Importante:
 * el buscador no tiene endpoint propio. Reutiliza `RecursoService.getTodos()`
 * y filtra localmente para evitar crear otra API específica.
 */
@Injectable({
  providedIn: 'root'
})
export class BusquedaService {
  /**
   * Guarda el texto actual escrito en el input del buscador.
   */
  private readonly terminoBusquedaInterno = new BehaviorSubject<string>('');

  /**
   * Guarda la lista actual de sugerencias que se pinta bajo el input.
   */
  private readonly sugerenciasInternas = new BehaviorSubject<SugerenciaBusqueda[]>([]);

  /**
   * Indica si el servicio está filtrando o esperando la primera carga.
   */
  private readonly cargandoInterno = new BehaviorSubject<boolean>(false);

  /**
   * Caché simple de recursos.
   *
   * La primera búsqueda pide todos los recursos al backend. Las siguientes ya
   * trabajan contra este array en memoria para que el buscador sea inmediato.
   */
  private recursos: RecursoDto[] | null = null;

  /**
   * Stream público de sugerencias consumido por el componente visual.
   */
  readonly sugerenciasBusqueda$ = this.sugerenciasInternas.asObservable();

  /**
   * Stream público del estado de carga del buscador.
   */
  readonly cargandoBusqueda$ = this.cargandoInterno.asObservable();

  constructor(private servicioRecursos: RecursoService) {}

  /**
   * Guarda el término actual del buscador en memoria compartida.
   *
   * @param termino Texto actual del input.
   *
   * @returns void
   */
  actualizarTerminoBusqueda(termino: string): void {
    this.terminoBusquedaInterno.next(termino.trim());
  }

  /**
   * Devuelve el término actual guardado en el servicio.
   *
   * @returns Texto actual del buscador.
   */
  obtenerTerminoBusquedaActual(): string {
    return this.terminoBusquedaInterno.value;
  }

  /**
   * Borra las sugerencias visibles y apaga el estado de carga.
   *
   * @returns void
   */
  limpiarSugerencias(): void {
    this.sugerenciasInternas.next([]);
    this.cargandoInterno.next(false);
  }

  /**
   * Punto de entrada principal del buscador.
   *
   * Flujo:
   * 1. normaliza y guarda el término
   * 2. si está vacío, limpia y sale
   * 3. si ya existe caché de recursos, filtra en memoria
   * 4. si aún no existe caché, pide todos los recursos al backend
   * 5. construye las sugerencias finales para el rol actual
   *
   * @param termino Texto que acaba de escribir el usuario.
   * @param rol Rol actual para construir la ruta final correcta.
   *
   * @returns void
   */
  buscarSugerencias(termino: string, rol: RolBusqueda): void {
    const texto = termino.trim();
    this.actualizarTerminoBusqueda(texto);

    if (!texto) {
      this.limpiarSugerencias();
      return;
    }

    this.cargandoInterno.next(true);

    if (this.recursos) {
      this.sugerenciasInternas.next(this.buscarEnRecursos(this.recursos, texto, rol));
      this.cargandoInterno.next(false);
      return;
    }

    this.servicioRecursos.getTodos()
      .pipe(catchError(() => of([])))
      .subscribe((recursos) => {
        this.recursos = recursos;
        this.sugerenciasInternas.next(this.buscarEnRecursos(recursos, texto, rol));
        this.cargandoInterno.next(false);
      });
  }

  /**
   * Aplica el filtro real de búsqueda sobre la lista de recursos cargada.
   *
   * Lo que hace:
   * - normaliza el texto buscado
   * - construye un texto "buscable" por cada recurso
   * - se queda solo con coincidencias
   * - ordena por fecha reciente
   * - limita a 8 sugerencias
   * - monta la ruta final según el rol
   *
   * @param recursos Lista completa de recursos ya cargada.
   * @param termino Texto buscado por el usuario.
   * @param rol Rol actual para decidir la ruta.
   *
   * @returns Sugerencias listas para pintar debajo del input.
   */
  private buscarEnRecursos(recursos: RecursoDto[], termino: string, rol: RolBusqueda): SugerenciaBusqueda[] {
    const texto = this.normalizarTexto(termino);

    return recursos
      .filter((recurso) => this.construirTextoRecurso(recurso).includes(texto))
      .sort((a, b) => b.fechaPublicacion.localeCompare(a.fechaPublicacion))
      .slice(0, 8)
      .map((recurso) => ({
        titulo: recurso.nombre,
        subtitulo: `${recurso.categoriaNombre} · ${recurso.anioInicio}/${recurso.anioFin}`,
        tipo: 'Recurso' as const,
        ruta: rol === 'profesor'
          ? `/profesor/recurso/${recurso.idCategoria}/${recurso.numRecurso}`
          : `/coordinador/recursos/${recurso.idCategoria}/${recurso.numRecurso}`
      }));
  }

  /**
   * Une varios campos del recurso en una sola cadena para poder buscar.
   *
   * Se incluyen:
   * - nombre
   * - descripción
   * - nombre de categoría
   * - curso académico
   * - nombres de ciclos
   *
   * @param recurso Recurso individual que se quiere indexar para búsqueda.
   *
   * @returns Texto normalizado donde se hará el `includes(...)`.
   */
  private construirTextoRecurso(recurso: RecursoDto): string {
    const ciclos = (recurso.ciclos || []).map((ciclo) => ciclo.nombre).join(' ');

    return this.normalizarTexto(`
      ${recurso.nombre}
      ${recurso.descripcion}
      ${recurso.categoriaNombre}
      ${recurso.anioInicio}/${recurso.anioFin}
      ${ciclos}
    `);
  }

  /**
   * Normaliza un texto para comparar búsquedas de forma estable.
   *
   * Quita:
   * - mayúsculas/minúsculas
   * - tildes
   * - espacios repetidos
   *
   * @param valor Texto bruto de entrada.
   *
   * @returns Texto listo para comparar con `includes`.
   */
  private normalizarTexto(valor: string | null | undefined): string {
    return (valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
