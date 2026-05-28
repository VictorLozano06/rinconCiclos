import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-actas-inicio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container py-4 position-relative">
      <h2 class="mb-4">Proceso de Actas</h2>
      <div class="row g-4">
        <div class="col-md-6">
          <div class="card h-100 shadow-sm border-0 bg-light" style="cursor: pointer;" (click)="abrirModal()">
            <div class="card-body text-center p-5 opacity-75 hover-opacity-100 transition-all">
              <i class="bi bi-file-earmark-text text-primary mb-3" style="font-size: 3rem;"></i>
              <h4 class="card-title">Generar Plantilla de Acta</h4>
              <p class="card-text text-muted">Extrae las órdenes del día de una convocatoria pendiente para que el profesor pueda redactar el acta.</p>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card h-100 shadow-sm border-0 bg-light" style="cursor: pointer;" routerLink="/coordinador/reuniones-de-equipo/actas/historial">
            <div class="card-body text-center p-5 opacity-75 hover-opacity-100 transition-all">
              <i class="bi bi-archive text-success mb-3" style="font-size: 3rem;"></i>
              <h4 class="card-title">Historial de Actas</h4>
              <p class="card-text text-muted">Consultar el registro histórico de actas redactadas.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Overlay -->
      <div *ngIf="mostrarModal" class="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style="background: rgba(0,0,0,0.5); z-index: 1050;">
        <div class="card border-0 shadow-lg" style="width: 500px; max-width: 90vw; border-radius: 8px;">
          <!-- Header -->
          <div class="card-header bg-white border-bottom-0 d-flex justify-content-between align-items-center pt-3 pb-0 px-4">
            <h5 class="mb-0 fw-bold">Generar Plantilla de Acta</h5>
            <button class="btn btn-link text-secondary p-0 border-0" (click)="cerrarModal()">
              <i class="bi bi-x-lg fs-5"></i>
            </button>
          </div>
          <!-- Body -->
          <div class="card-body p-4">
            <p class="text-muted small mb-3">Selecciona una convocatoria pendiente en la base de datos para habilitarla como acta al profesor.</p>
            
            <div class="border rounded p-3 d-flex justify-content-between align-items-center mb-2" style="cursor: pointer; transition: all 0.2s;" (click)="seleccionarConvocatoria()">
              <div>
                <h6 class="mb-1 fw-bold">Convocatoria #5</h6>
                <small class="text-muted">2026-05-26T16:28:00 - Aula A-12</small>
              </div>
              <div>
                <i class="bi bi-check-circle-fill text-success fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hover-opacity-100:hover { opacity: 1 !important; }
    .transition-all { transition: all 0.3s ease; }
  `]
})
export class ActasInicioCoordinadorComponent {
  mostrarModal = false;

  abrirModal() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  seleccionarConvocatoria() {
    // Aquí iría la lógica en el futuro. Por ahora solo cerramos el modal simulando éxito.
    this.cerrarModal();
  }
}
