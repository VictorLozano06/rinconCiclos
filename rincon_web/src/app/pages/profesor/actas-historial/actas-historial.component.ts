import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

/**
 * Refleja la tabla `informacion`:
 * - numInformacion: PK parcial
 * - titulo_OrdenDia: VARCHAR(250)
 * - informacion: VARCHAR(250)
 */
interface Informacion {
  numInformacion: number;
  titulo_OrdenDia: string;
  informacion: string;
}

/**
 * Refleja la tabla `acta` + joins:
 * - idActa: INT AUTO_INCREMENT
 * - fecha: DATE — fecha de cierre del acta
 * - idConvocatoria: FK → convocatoria (fecha DATETIME, lugar.nombre, cursoAcademico)
 * No hay campo "estado" — si existe fila en acta → está cerrada
 */
interface ActaHistorial {
  idActa: number;
  fecha: string;                  // acta.fecha DATE
  idConvocatoria: number;
  fechaConvocatoria: string;      // convocatoria.fecha DATETIME (parte fecha)
  horaConvocatoria: string;       // convocatoria.fecha DATETIME (parte hora)
  lugar: string;                  // lugar.nombre
  anioInicio: number;             // cursoAcademico.anioInicio
  anioFin: number;                // cursoAcademico.anioFin
  asistentes: number;             // COUNT de profesor_asiste
  totalConvocados: number;
  informacion: Informacion[];     // tabla informacion
  ruegosPregunta: string[];       // tabla ruegosPreguntasActa
}

@Component({
  selector: 'app-actas-historial-profesor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './actas-historial.component.html',
  styleUrl: './actas-historial.component.css'
})
export class ActasHistorialProfesorComponent {
  public actaVisualizando: ActaHistorial | null = null;

  /** Mock basado en la estructura real de BD */
  private todasLasActas: ActaHistorial[] = [
    {
      idActa: 1,
      fecha: '23/05/2026',
      idConvocatoria: 1,
      fechaConvocatoria: '23/05/2026',
      horaConvocatoria: '10:00',
      lugar: 'Sala de Reuniones B-04',
      anioInicio: 2025,
      anioFin: 2026,
      asistentes: 5,
      totalConvocados: 6,
      informacion: [
        { numInformacion: 1, titulo_OrdenDia: 'Lectura y aprobación del acta anterior',       informacion: 'Se aprueba el acta anterior por unanimidad sin observaciones.' },
        { numInformacion: 2, titulo_OrdenDia: 'Revisión de resultados de evaluación final',    informacion: 'El 82% del alumnado supera la convocatoria ordinaria.' },
        { numInformacion: 3, titulo_OrdenDia: 'Coordinación de actividades de recuperación',   informacion: 'Se acuerda organizar sesiones de recuperación durante la última semana de junio.' },
        { numInformacion: 4, titulo_OrdenDia: 'Planificación del próximo curso académico',     informacion: 'Se delega en el coordinador la elaboración del calendario lectivo provisional.' }
      ],
      ruegosPregunta: ['Sin ruegos ni preguntas adicionales.']
    },
    {
      idActa: 2,
      fecha: '15/03/2026',
      idConvocatoria: 2,
      fechaConvocatoria: '15/03/2026',
      horaConvocatoria: '09:00',
      lugar: 'Aula de Coordinación A-12',
      anioInicio: 2025,
      anioFin: 2026,
      asistentes: 6,
      totalConvocados: 6,
      informacion: [
        { numInformacion: 1, titulo_OrdenDia: 'Revisión de la 2ª evaluación',  informacion: 'Los resultados mejoran un 8% respecto al trimestre anterior.' },
        { numInformacion: 2, titulo_OrdenDia: 'Acuerdos de mejora',             informacion: 'Se incrementan actividades prácticas en módulos con mayor índice de suspenso.' }
      ],
      ruegosPregunta: ['Se solicita actualizar el inventario de equipos del aula de informática.']
    },
    {
      idActa: 3,
      fecha: '10/12/2025',
      idConvocatoria: 3,
      fechaConvocatoria: '10/12/2025',
      horaConvocatoria: '10:30',
      lugar: 'Sala de Reuniones B-04',
      anioInicio: 2025,
      anioFin: 2026,
      asistentes: 4,
      totalConvocados: 6,
      informacion: [
        { numInformacion: 1, titulo_OrdenDia: 'Resultados 1ª evaluación', informacion: 'Se revisan resultados por módulos y grupos.' },
        { numInformacion: 2, titulo_OrdenDia: 'Propuestas de mejora',      informacion: 'Seguimiento semanal para alumnos con más de 2 módulos suspensos.' }
      ],
      ruegosPregunta: ['El profesor de SMR solicita recursos adicionales para la sala de redes.']
    },
    {
      idActa: 4,
      fecha: '18/06/2025',
      idConvocatoria: 4,
      fechaConvocatoria: '18/06/2025',
      horaConvocatoria: '11:00',
      lugar: 'Sala de Reuniones B-04',
      anioInicio: 2024,
      anioFin: 2025,
      asistentes: 6,
      totalConvocados: 6,
      informacion: [
        { numInformacion: 1, titulo_OrdenDia: 'Balance del curso 2024/2025', informacion: 'Valoración positiva: 79% de tasa de éxito global.' },
        { numInformacion: 2, titulo_OrdenDia: 'Propuestas para el siguiente curso', informacion: 'Se acuerda revisar la programación didáctica de 3 módulos.' }
      ],
      ruegosPregunta: []
    },
    {
      idActa: 5,
      fecha: '14/03/2025',
      idConvocatoria: 5,
      fechaConvocatoria: '14/03/2025',
      horaConvocatoria: '09:30',
      lugar: 'Aula de Coordinación A-12',
      anioInicio: 2024,
      anioFin: 2025,
      asistentes: 5,
      totalConvocados: 6,
      informacion: [
        { numInformacion: 1, titulo_OrdenDia: 'Revisión 2ª evaluación', informacion: 'Resultados similares al año anterior.' }
      ],
      ruegosPregunta: []
    }
  ];

  public actasFiltradas: ActaHistorial[] = this.todasLasActas.slice(0, 3); // Solo mostrar 3 como en la captura


  verActa(acta: ActaHistorial): void {
    this.actaVisualizando = acta;
  }

  cerrarModal(): void {
    this.actaVisualizando = null;
  }

  descargarActa(acta: ActaHistorial): void {
    console.log('Descargar acta idActa:', acta.idActa);
    alert(`Descargando Acta #${acta.idActa} — Convocatoria #${acta.idConvocatoria}`);
  }
}
