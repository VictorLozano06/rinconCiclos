import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BusquedaService, SugerenciaBusqueda } from '../../services/busqueda.service';

// Este componente solo hace 3 cosas:
// 1. escucha lo que escribe el usuario
// 2. pide sugerencias al servicio
// 3. navega cuando el usuario elige una
@Component({
  selector: 'app-buscador',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './buscador.component.html',
  styleUrl: './buscador.component.css'
})
export class BuscadorComponent {
  // Lista que se pinta debajo del input.
  sugerencias: SugerenciaBusqueda[] = [];

  // Muestra el texto "Buscando..." mientras el servicio consulta o filtra.
  buscando = false;

  // Controla si la caja desplegable debe verse o no.
  mostrarSugerencias = false;

  private referenciaDestruccion = inject(DestroyRef);

  constructor(
    private servicioBusqueda: BusquedaService,
    private router: Router
  ) {
    // Mantiene la caja de sugerencias sincronizada con el servicio compartido.
    this.servicioBusqueda.sugerenciasBusqueda$
      .pipe(takeUntilDestroyed(this.referenciaDestruccion))
      .subscribe((sugerencias) => {
        this.sugerencias = sugerencias;
      });

    this.servicioBusqueda.cargandoBusqueda$
      .pipe(takeUntilDestroyed(this.referenciaDestruccion))
      .subscribe((cargando) => {
        this.buscando = cargando;
      });
  }

  // Recupera el texto actual para rellenar el input.
  get terminoBusquedaActual(): string {
    return this.servicioBusqueda.obtenerTerminoBusquedaActual();
  }

  // Se ejecuta en cada pulsacion del teclado dentro del input.
  alEscribir(evento: Event): void {
    const entrada = evento.target as HTMLInputElement | null;
    const termino = entrada?.value || '';

    // El componente no filtra nada por su cuenta.
    // Solo delega la busqueda al servicio.
    this.servicioBusqueda.buscarSugerencias(termino, this.obtenerRolActual());
    this.mostrarSugerencias = termino.trim().length > 0;
  }

  // Si el usuario vuelve a enfocar el input con texto escrito,
  // reabre la caja y recalcula sugerencias.
  alEntrarEnElBuscador(): void {
    if (!this.terminoBusquedaActual) {
      return;
    }

    this.mostrarSugerencias = true;
    this.servicioBusqueda.buscarSugerencias(this.terminoBusquedaActual, this.obtenerRolActual());
  }

  // Al pulsar Enter o la lupa, vamos a la primera sugerencia disponible.
  ejecutarPrimeraSugerencia(): void {
    const primera = this.sugerencias[0];

    if (!primera) {
      return;
    }

    this.irASugerencia(primera);
  }

  // Cierra el desplegable, limpia el estado del buscador
  // y navega a la pantalla del recurso elegido.
  irASugerencia(sugerencia: SugerenciaBusqueda): void {
    this.mostrarSugerencias = false;
    this.servicioBusqueda.actualizarTerminoBusqueda('');
    this.servicioBusqueda.limpiarSugerencias();
    this.router.navigateByUrl(sugerencia.ruta);
  }

  // Se usa en el blur del input.
  // El pequeño retraso evita que el blur cierre la caja antes de registrar el click.
  ocultarSugerencias(): void {
    setTimeout(() => {
      this.mostrarSugerencias = false;
    }, 150);
  }

  // Decide si la ruta final del recurso debe ser de profesor o de coordinador.
  private obtenerRolActual(): 'profesor' | 'coordinador' {
    return this.router.url.startsWith('/coordinador') ? 'coordinador' : 'profesor';
  }
}
