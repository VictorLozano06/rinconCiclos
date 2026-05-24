import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProcesoActasService, ConvocatoriaPendiente, PuntoOrdenDia, ProfesorAsistente } from '../../../services/proceso-actas.service';

@Component({
  selector: 'app-actas-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './actas-asistencia.component.html',
  styleUrl: './actas-asistencia.component.css'
})
export class ActasAsistenciaComponent implements OnInit {
  // Estados: 'cargando' | 'error' | 'previo' | 'en-progreso' | 'confirmado'
  public estado: 'cargando' | 'error' | 'previo' | 'en-progreso' | 'confirmado' = 'cargando';
  public mensajeError = '';

  public convocatoria: ConvocatoriaPendiente | null = null;
  public fechaObj: Date | null = null;

  constructor(private procesoActasService: ProcesoActasService) {}

  ngOnInit(): void {
    // Si ya hay una en memoria, la usamos, si no la pedimos.
    const memoria = this.procesoActasService.getConvocatoriaActiva();
    if (memoria) {
      this.asignarConvocatoria(memoria);
    } else {
      this.procesoActasService.getConvocatoriaPendiente().subscribe({
        next: (conv) => {
          this.asignarConvocatoria(conv);
        },
        error: (err) => {
          console.error(err);
          this.estado = 'error';
          this.mensajeError = err.error?.error || 'Error al cargar la convocatoria.';
        }
      });
    }
  }

  private asignarConvocatoria(conv: ConvocatoriaPendiente): void {
    this.convocatoria = conv;
    // Convierte la fecha ISO a objeto Date local (solo para mostrar)
    this.fechaObj = new Date(conv.fechaOriginal.replace(' ', 'T'));
    this.estado = 'previo';
  }

  get asistentes(): ProfesorAsistente[] {
    return this.convocatoria?.profesores.filter(p => p.asiste) || [];
  }

  get ausentes(): ProfesorAsistente[] {
    return this.convocatoria?.profesores.filter(p => !p.asiste) || [];
  }

  get cursoAcademico(): string {
    return this.convocatoria ? `${this.convocatoria.anioInicio}/${this.convocatoria.anioFin}` : '';
  }

  get fechaFormateada(): string {
    if (!this.fechaObj) return '';
    return this.fechaObj.toLocaleDateString('es-ES', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  get horaFormateada(): string {
    if (!this.fechaObj) return '';
    return this.fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + ' h';
  }

  iniciarControlAsistencia(): void {
    this.estado = 'en-progreso';
  }

  confirmarAsistencia(): void {
    if (this.convocatoria) {
      // Guardar el estado actual en el servicio
      this.procesoActasService.guardarAsistencia(this.convocatoria.profesores);
      this.estado = 'confirmado';
    }
  }

  reiniciar(): void {
    this.estado = 'previo';
    if (this.convocatoria) {
      this.convocatoria.profesores.forEach(p => p.asiste = true);
    }
  }
}
