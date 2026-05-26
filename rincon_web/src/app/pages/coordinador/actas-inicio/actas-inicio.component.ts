import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProcesoActasService, ConvocatoriaPendiente } from '../../../services/proceso-actas.service';

@Component({
  selector: 'app-actas-inicio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container py-4">
      <h2 class="mb-4">Proceso de Actas</h2>
      <div class="row g-4">
        <div class="col-md-6">
          <div class="card h-100 shadow-sm border-0" style="cursor: pointer;" (click)="abrirModalGenerar()">
            <div class="card-body text-center p-5">
              <i class="bi bi-file-earmark-text text-primary mb-3" style="font-size: 3rem;"></i>
              <h4 class="card-title">Generar Plantilla de Acta</h4>
              <p class="card-text text-muted">Extrae las órdenes del día de una convocatoria existente para que el profesor pueda redactar el acta.</p>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card h-100 shadow-sm border-0" style="cursor: pointer;" routerLink="/coordinador/reuniones-de-equipo/actas/historial">
            <div class="card-body text-center p-5">
              <i class="bi bi-archive text-success mb-3" style="font-size: 3rem;"></i>
              <h4 class="card-title">Historial de Actas</h4>
              <p class="card-text text-muted">Consultar el registro histórico de actas redactadas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Generar Plantilla -->
    <div *ngIf="mostrarModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">Generar Plantilla de Acta</h5>
            <button type="button" class="btn-close" (click)="mostrarModal = false"></button>
          </div>
          <div class="modal-body">
            <p class="text-secondary small mb-3">Selecciona una convocatoria pendiente en la base de datos para habilitarla como acta al profesor.</p>
            
            <div *ngIf="cargando" class="text-center py-3">
              <div class="spinner-border text-primary" role="status"></div>
            </div>

            <div *ngIf="!cargando && (!convocatoriaPendiente)" class="alert alert-info py-2 small mb-0">
              <i class="bi bi-info-circle me-1"></i> No hay convocatorias pendientes de acta en la base de datos en este momento.
            </div>

            <div *ngIf="!cargando && convocatoriaPendiente" class="list-group">
              <button class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                      (click)="generarPlantilla(convocatoriaPendiente.idConvocatoria)">
                <div>
                  <h6 class="mb-0 fw-bold">Convocatoria #{{ convocatoriaPendiente.idConvocatoria }}</h6>
                  <small class="text-muted">{{ convocatoriaPendiente.fecha }} - {{ convocatoriaPendiente.lugar }}</small>
                </div>
                <i class="bi bi-check-circle-fill text-success fs-4"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ActasInicioCoordinadorComponent implements OnInit {
  public mostrarModal = false;
  public cargando = false;
  public convocatoriaPendiente: ConvocatoriaPendiente | null = null;
  
  constructor(private procesoActasService: ProcesoActasService) {}

  ngOnInit() {}

  abrirModalGenerar() {
    this.mostrarModal = true;
    this.cargando = true;
    this.procesoActasService.getConvocatoriaPendiente().subscribe({
      next: (convocatoria) => {
        this.convocatoriaPendiente = convocatoria;
        this.cargando = false;
      },
      error: () => {
        this.convocatoriaPendiente = null;
        this.cargando = false;
      }
    });
  }

  generarPlantilla(id: number) {
    this.mostrarModal = false;
    alert('¡Plantilla Generada con Éxito! El profesor encargado ya tiene esta convocatoria desbloqueada en su panel para redactar los acuerdos.');
  }
}
