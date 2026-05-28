import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

/** Refleja la tabla `profesor` + `participantes` */
interface Profesor {
  idProfesor: number;
  nombre: string;     // participantes.nombre
  asiste: boolean;    // se convertirá en fila en profesor_asiste(idActa, idProfesor)
}

/** Refleja ordenDia: objetivo (obligatorio) + descripcion (opcional) */
interface PuntoOrdenDia {
  numOrden: number;
  objetivo: string;
  descripcion: string | null;
  minutos: number | null;
}

@Component({
  selector: 'app-actas-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './actas-asistencia.component.html',
  styleUrl: './actas-asistencia.component.css'
})
export class ActasAsistenciaComponent implements OnInit {
  // Estados: 'previo' | 'en-progreso' | 'confirmado'
  public estado: 'previo' | 'en-progreso' | 'confirmado' = 'previo';

  ngOnInit(): void {
    const savedState = sessionStorage.getItem('asistencia_estado');
    if (savedState) {
      this.estado = savedState as any;
    }
  }
  public convocatoria = {
    idConvocatoria: 1,
    fecha: new Date('2026-05-23T10:00:00'),
    lugar: 'Sala de Reuniones B-04',       // lugar.nombre
    anioInicio: 2025,                       // cursoAcademico.anioInicio
    anioFin: 2026,                          // cursoAcademico.anioFin
    idProfesorRedactaActa: 2,
    idProfesorIniciaReunion: 1
  };

  /** Mock de ordenDia: objetivo (NOT NULL) + descripcion (NULL) */
  public ordenDelDia: PuntoOrdenDia[] = [
    { numOrden: 1, objetivo: 'Lectura y aprobación del acta anterior', descripcion: null, minutos: 10 },
    { numOrden: 2, objetivo: 'Revisión de resultados de evaluación final', descripcion: 'Análisis por módulos y grupos', minutos: 30 },
    { numOrden: 3, objetivo: 'Coordinación de actividades de recuperación', descripcion: null, minutos: 20 },
    { numOrden: 4, objetivo: 'Planificación del próximo curso académico', descripcion: 'Calendario, programaciones y distribución horaria', minutos: 25 },
    { numOrden: 5, objetivo: 'Ruegos y preguntas', descripcion: null, minutos: null }
  ];

  /**
   * Mock de participantes convocados.
   * La asistencia real se guarda en profesor_asiste(idActa, idProfesor).
   * El campo `asiste` aquí determina qué filas se insertarán.
   */
  public participantes: Profesor[] = [
    { idProfesor: 1, nombre: 'Ana García López', asiste: true },
    { idProfesor: 2, nombre: 'Carlos Martínez Ruiz', asiste: true },
    { idProfesor: 3, nombre: 'Laura Sánchez Pérez', asiste: true },
    { idProfesor: 4, nombre: 'Miguel Torres Herrero', asiste: true },
    { idProfesor: 5, nombre: 'Elena Rodríguez Vega', asiste: true },
    { idProfesor: 6, nombre: 'David Fernández Mora', asiste: true },
  ];

  get asistentes(): Profesor[] {
    return this.participantes.filter(p => p.asiste);
  }

  get ausentes(): Profesor[] {
    return this.participantes.filter(p => !p.asiste);
  }

  get cursoAcademico(): string {
    return `${this.convocatoria.anioInicio}/${this.convocatoria.anioFin}`;
  }

  get fechaFormateada(): string {
    return this.convocatoria.fecha.toLocaleDateString('es-ES', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  get horaFormateada(): string {
    return this.convocatoria.fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + ' h';
  }

  iniciarControlAsistencia(): void {
    this.estado = 'en-progreso';
  }

  confirmarAsistencia(): void {
    this.estado = 'confirmado';
    sessionStorage.setItem('asistencia_estado', 'confirmado');
  }

  reiniciar(): void {
    this.estado = 'previo';
    sessionStorage.removeItem('asistencia_estado');
    this.participantes.forEach(p => p.asiste = true);
  }
}
