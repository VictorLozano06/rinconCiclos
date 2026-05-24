import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-actas-inicio-profesor',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container py-4">
      <h2 class="mb-4">Proceso de Actas</h2>
      <div class="row g-4">
        <div class="col-md-6">
          <div class="card h-100 shadow-sm border-0" style="cursor: pointer;" routerLink="/profesor/reuniones-de-equipo/actas/asistencia">
            <div class="card-body text-center p-5">
              <i class="bi bi-person-check text-primary mb-3" style="font-size: 3rem;"></i>
              <h4 class="card-title">Control de Asistencia</h4>
              <p class="card-text text-muted">Registrar la asistencia de los participantes en la convocatoria actual.</p>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card h-100 shadow-sm border-0" style="cursor: pointer;" routerLink="/profesor/reuniones-de-equipo/actas/redaccion">
            <div class="card-body text-center p-5">
              <i class="bi bi-pencil-square text-success mb-3" style="font-size: 3rem;"></i>
              <h4 class="card-title">Redacción de Actas</h4>
              <p class="card-text text-muted">Redactar los puntos tratados en el orden del día y añadir ruegos y preguntas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ActasInicioProfesorComponent {}
