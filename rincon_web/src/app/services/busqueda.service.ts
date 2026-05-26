import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RecursoDto } from '../dto/recurso.dto';
import { RecursoService } from './recurso.service';

// Cada sugerencia representa una fila del desplegable del buscador.
export interface SugerenciaBusqueda {
  titulo: string;
  subtitulo: string;
  tipo: 'Recurso';
  ruta: string;
}

// El rol cambia la ruta final a la que navega el buscador.
type RolBusqueda = 'profesor' | 'coordinador';

@Injectable({
  providedIn: 'root'
})
export class BusquedaService {
  // Guarda el texto actual del input.
  private readonly terminoBusquedaInterno = new BehaviorSubject<string>('');

  // Guarda la lista de sugerencias visibles debajo del buscador.
  private readonly sugerenciasInternas = new BehaviorSubject<SugerenciaBusqueda[]>([]);

  // Sirve para pintar "Buscando..." mientras llega la respuesta.
  private readonly cargandoInterno = new BehaviorSubject<boolean>(false);

  // Cache simple para no pedir todos los recursos en cada pulsacion.
  private recursos: RecursoDto[] | null = null;

  // El componente del buscador se suscribe a estos dos observables.
  readonly sugerenciasBusqueda$ = this.sugerenciasInternas.asObservable();
  readonly cargandoBusqueda$ = this.cargandoInterno.asObservable();

  constructor(private servicioRecursos: RecursoService) {}

  // Guarda el texto escrito en memoria.
  actualizarTerminoBusqueda(termino: string): void {
    this.terminoBusquedaInterno.next(termino.trim());
  }

  // Devuelve el valor actual del input.
  obtenerTerminoBusquedaActual(): string {
    return this.terminoBusquedaInterno.value;
  }

  // Borra sugerencias y estado de carga.
  limpiarSugerencias(): void {
    this.sugerenciasInternas.next([]);
    this.cargandoInterno.next(false);
  }

  // Este es el punto de entrada principal del buscador.
  // Lo llama el componente cada vez que el usuario escribe.
  buscarSugerencias(termino: string, rol: RolBusqueda): void {
    const texto = termino.trim();
    this.actualizarTerminoBusqueda(texto);

    // Si el input queda vacio, no buscamos nada y cerramos la caja.
    if (!texto) {
      this.limpiarSugerencias();
      return;
    }

    this.cargandoInterno.next(true);

    // Si ya tenemos los recursos en memoria, filtramos directamente.
    if (this.recursos) {
      this.sugerenciasInternas.next(this.buscarEnRecursos(this.recursos, texto, rol));
      this.cargandoInterno.next(false);
      return;
    }

    // La primera vez pedimos todos los recursos al backend.
    // Si falla, devolvemos lista vacia para no romper el componente.
    this.servicioRecursos.getTodos()
      .pipe(catchError(() => of([])))
      .subscribe((recursos) => {
        // Guardamos la respuesta para reutilizarla en las siguientes busquedas.
        this.recursos = recursos;
        this.sugerenciasInternas.next(this.buscarEnRecursos(recursos, texto, rol));
        this.cargandoInterno.next(false);
      });
  }

  // Aqui se hace el filtro real:
  // 1. se normaliza el termino
  // 2. se buscan coincidencias en un texto compuesto
  // 3. se ordena por fecha
  // 4. se limita a 8 sugerencias
  // 5. se construye la ruta para navegar
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

  // Une varios campos del recurso en una sola cadena para buscar mas facil:
  // titulo, descripcion, categoria, curso y ciclos.
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

  // Quita tildes, espacios repetidos y mayusculas para comparar mejor.
  private normalizarTexto(valor: string | null | undefined): string {
    return (valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
