import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BusquedaService, SugerenciaBusqueda } from '../../services/busqueda.service';

/**
 * Componente visual del buscador global de recursos.
 *
 * Su responsabilidad es deliberadamente pequeña:
 * - leer lo que escribe el usuario
 * - delegar la búsqueda al servicio compartido
 * - pintar el desplegable de sugerencias
 * - navegar a la ruta elegida
 *
 * Toda la lógica de filtrado real vive en {@see BusquedaService}.
 */
@Component({
  selector: 'app-buscador',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './buscador.component.html',
  styleUrl: './buscador.component.css'
})
export class BuscadorComponent {
  /**
   * Lista de sugerencias visibles debajo del input.
   */
  sugerencias: SugerenciaBusqueda[] = [];

  /**
   * Activa el estado "Buscando..." mientras el servicio procesa datos.
   */
  buscando = false;

  /**
   * Controla si el desplegable debe mostrarse o no.
   */
  mostrarSugerencias = false;

  /**
   * Referencia de destrucción usada para limpiar suscripciones automáticamente.
   */
  private referenciaDestruccion = inject(DestroyRef);

  constructor(
    private servicioBusqueda: BusquedaService,
    private router: Router
  ) {
    // Mantiene la lista local sincronizada con el servicio compartido.
    this.servicioBusqueda.sugerenciasBusqueda$
      .pipe(takeUntilDestroyed(this.referenciaDestruccion))
      .subscribe((sugerencias) => {
        this.sugerencias = sugerencias;
      });

    // Mantiene el estado visual de carga sincronizado con el servicio.
    this.servicioBusqueda.cargandoBusqueda$
      .pipe(takeUntilDestroyed(this.referenciaDestruccion))
      .subscribe((cargando) => {
        this.buscando = cargando;
      });
  }

  /**
   * Devuelve el texto actual guardado por el servicio.
   *
   * Se usa para rellenar el input cuando el componente vuelve a renderizarse.
   */
  get terminoBusquedaActual(): string {
    return this.servicioBusqueda.obtenerTerminoBusquedaActual();
  }

  /**
   * Se ejecuta en cada pulsación de teclado dentro del input.
   *
   * El componente no filtra nada por su cuenta. Solo recoge el texto y se lo
   * pasa al servicio junto al rol actual para que construya rutas correctas.
   *
   * @param evento Evento `input` del navegador.
   *
   * @returns void
   */
  alEscribir(evento: Event): void {
    const entrada = evento.target as HTMLInputElement | null;
    const termino = entrada?.value || '';

    this.servicioBusqueda.buscarSugerencias(termino, this.obtenerRolActual());
    this.mostrarSugerencias = termino.trim().length > 0;
  }

  /**
   * Reabre la caja de sugerencias cuando el usuario vuelve a entrar al input.
   *
   * Si ya había un término escrito, vuelve a pedir sugerencias con ese valor.
   *
   * @returns void
   */
  alEntrarEnElBuscador(): void {
    if (!this.terminoBusquedaActual) {
      return;
    }

    this.mostrarSugerencias = true;
    this.servicioBusqueda.buscarSugerencias(this.terminoBusquedaActual, this.obtenerRolActual());
  }

  /**
   * Navega directamente a la primera sugerencia disponible.
   *
   * Se usa al pulsar Enter o al activar la lupa con el teclado.
   *
   * @returns void
   */
  ejecutarPrimeraSugerencia(): void {
    const primera = this.sugerencias[0];

    if (!primera) {
      return;
    }

    this.irASugerencia(primera);
  }

  /**
   * Navega al recurso seleccionado y limpia el estado del buscador.
   *
   * @param sugerencia Fila elegida en el desplegable.
   *
   * @returns void
   */
  irASugerencia(sugerencia: SugerenciaBusqueda): void {
    this.mostrarSugerencias = false;
    this.servicioBusqueda.actualizarTerminoBusqueda('');
    this.servicioBusqueda.limpiarSugerencias();
    this.router.navigateByUrl(sugerencia.ruta);
  }

  /**
   * Cierra la caja de sugerencias con un pequeño retraso.
   *
   * Ese retraso evita que el `blur` del input cierre el desplegable antes de
   * que el click sobre una sugerencia llegue a ejecutarse.
   *
   * @returns void
   */
  ocultarSugerencias(): void {
    setTimeout(() => {
      this.mostrarSugerencias = false;
    }, 150);
  }

  /**
   * Decide si la navegación final debe construirse como profesor o coordinador.
   *
   * @returns Rol actual inferido a partir de la URL activa.
   */
  private obtenerRolActual(): 'profesor' | 'coordinador' {
    return this.router.url.startsWith('/coordinador') ? 'coordinador' : 'profesor';
  }
}
