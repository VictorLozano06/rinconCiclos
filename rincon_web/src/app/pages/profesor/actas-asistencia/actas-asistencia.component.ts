import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
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
  // Flags de UI para manejar el loader y alertas
  estado: 'cargando' | 'error' | 'previo' | 'en-progreso' | 'confirmado' = 'cargando';
  public mensajeError = '';

  public convocatoria: ConvocatoriaPendiente | null = null;
  public fechaObj: Date | null = null;

  private location = inject(Location);

  constructor(private procesoActasService: ProcesoActasService) {}

  volver(): void {
    this.location.back();
  }

  ngOnInit(): void {
    // Rescatamos datos del servicio temporal por si el profe le ha dado atrás
    const convMemoria = this.procesoActasService.getConvocatoriaActiva();
    if (convMemoria) {
      this.asignarConvocatoria(convMemoria);
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
    // Evitar problemas de zona horaria al printarlo
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
      this.estado = 'cargando';
      const asistentes = this.asistentes.map(p => p.idProfesor);
      
      this.procesoActasService.crearBorrador(this.convocatoria.idConvocatoria, asistentes).subscribe({
        next: () => {
          this.estado = 'confirmado';
        },
        error: (err) => {
          console.error(err);
          alert('Hubo un error al guardar la asistencia y crear el borrador.');
          this.estado = 'en-progreso';
        }
      });
    }
  }

  reiniciar(): void {
    this.estado = 'previo';
    if (this.convocatoria) {
      this.convocatoria.profesores.forEach(p => p.asiste = true);
    }
  }
}
