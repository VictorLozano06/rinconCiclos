import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-actas-inicio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container py-4">
      <h2 class="mb-4">Proceso de Actas</h2>
      <div class="row g-4">
        <div class="col-md-6">
          <div class="card h-100 shadow-sm border-0" style="cursor: pointer;" routerLink="/coordinador/reuniones-de-equipo/actas/plantillas">
            <div class="card-body text-center p-5">
              <i class="bi bi-file-earmark-text text-primary mb-3" style="font-size: 3rem;"></i>
              <h4 class="card-title">Plantillas de Acta</h4>
              <p class="card-text text-muted">Gestionar las plantillas base para la redacción de actas de las diferentes convocatorias.</p>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card h-100 shadow-sm border-0" style="cursor: pointer;" routerLink="/coordinador/reuniones-de-equipo/actas/historial">
            <div class="card-body text-center p-5">
              <i class="bi bi-archive text-success mb-3" style="font-size: 3rem;"></i>
              <h4 class="card-title">Historial de Actas</h4>
              <p class="card-text text-muted">Consultar el registro histórico de actas firmadas y finalizadas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ActasInicioCoordinadorComponent {}
