import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

/**
 * Refleja la tabla `informacion`:
 * - idActa (FK)
 * - numInformacion (PK parcial)
 * - titulo_OrdenDia VARCHAR(250) — título del punto del OdD
 * - informacion VARCHAR(250) — texto redactado por el profesor
 */
interface PuntoInformacion {
  numInformacion: number;
  titulo_OrdenDia: string;   // campo real de BD
  informacion: string;       // campo real de BD
  expandido: boolean;
}

@Component({
  selector: 'app-actas-redaccion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './actas-redaccion.component.html',
  styleUrl: './actas-redaccion.component.css'
})
export class ActasRedaccionComponent {
  // El acta existe o no existe en BD — no hay campo "estado"
  // Si hay fila en `acta` para esta convocatoria → está cerrada (bloqueada)
  public estado: 'redactando' | 'bloqueada' = 'redactando';
  public mostrarModalFinalizar = false;

  /**
   * Mock de acta (tabla acta):
   * - idActa: INT AUTO_INCREMENT
   * - fecha: DATE (fecha en que se redacta/cierra el acta)
   * - idConvocatoria: FK
   * No hay campo título — se identifica por idConvocatoria
   */
  public acta = {
    idActa: null as number | null,        // null = aún no guardada en BD
    fecha: null as Date | null,           // acta.fecha — se asigna al finalizar
    idConvocatoria: 1
  };

  /** Datos de la convocatoria asociada (tabla convocatoria + lugar + cursoAcademico) */
  public convocatoria = {
    idConvocatoria: 1,
    fecha: new Date('2026-05-23T10:00:00'),
    lugar: 'Sala de Reuniones B-04',
    anioInicio: 2025,
    anioFin: 2026,
    asistentes: 5,
    totalConvocados: 6
  };

  /**
   * Mock de informacion (tabla informacion):
   * Cada fila = un punto del acta con su titulo_OrdenDia e informacion redactada.
   * Los títulos vienen de ordenDia.objetivo de la convocatoria.
   */
  public puntosInformacion: PuntoInformacion[] = [
    { numInformacion: 1, titulo_OrdenDia: 'Lectura y aprobación del acta anterior',     informacion: '', expandido: true  },
    { numInformacion: 2, titulo_OrdenDia: 'Revisión de resultados de evaluación final',  informacion: '', expandido: false },
    { numInformacion: 3, titulo_OrdenDia: 'Coordinación de actividades de recuperación', informacion: '', expandido: false },
    { numInformacion: 4, titulo_OrdenDia: 'Planificación del próximo curso académico',   informacion: '', expandido: false },
  ];

  /**
   * Mock de ruegosPreguntasActa (tabla ruegosPreguntasActa):
   * - idPreguntaActa: INT AUTO_INCREMENT
   * - idActa: FK
   * - ruegosPregunta: VARCHAR(250)
   * Es una tabla separada → se gestiona como array de textos (múltiples filas)
   */
  public ruegosPreguntas: { id: number, texto: string }[] = [];
  public nuevoRuego: string = '';

  agregarRuego(): void {
    if (this.nuevoRuego.trim().length > 0) {
      this.ruegosPreguntas.push({
        id: this.ruegosPreguntas.length + 1,
        texto: this.nuevoRuego.trim()
      });
      this.nuevoRuego = '';
    }
  }

  eliminarRuego(index: number): void {
    this.ruegosPreguntas.splice(index, 1);
  }

  get cursoAcademico(): string {
    return `${this.convocatoria.anioInicio}/${this.convocatoria.anioFin}`;
  }

  get fechaFormateada(): string {
    return this.convocatoria.fecha.toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  togglePunto(punto: PuntoInformacion): void {
    if (this.estado === 'bloqueada') return;
    punto.expandido = !punto.expandido;
  }

  abrirModalFinalizar(): void {
    this.mostrarModalFinalizar = true;
  }

  finalizarActa(): void {
    // En BD: INSERT INTO acta (fecha, idConvocatoria) VALUES (NOW(), ?)
    this.acta.idActa = 1;
    this.acta.fecha = new Date();
    this.estado = 'bloqueada';
    this.mostrarModalFinalizar = false;
    this.puntosInformacion.forEach((p, i) => p.expandido = i === 0);
  }
}
