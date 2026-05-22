import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface BloquePlantilla {
  id: string;
  etiqueta: string;
  seleccionado: boolean;
}

interface Plantilla {
  id: number;
  nombre: string;
  descripcion: string;
  bloques: string[];
  fechaCreacion: string;
}

@Component({
  selector: 'app-actas-plantilla',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './actas-plantilla.component.html',
  styleUrl: './actas-plantilla.component.css'
})
export class ActasPlantillaComponent {
  public mostrarModalNueva = false;
  public mostrarModalEditar = false;
  public mostrarModalConfirmar = false;
  public confirmarMensaje = '';
  public plantillaAEliminar: Plantilla | null = null;
  public plantillaEditando: Plantilla | null = null;

  public nombreNueva = '';
  public descripcionNueva = '';

  public bloquesDisponibles: BloquePlantilla[] = [
    { id: 'apertura', etiqueta: 'Apertura y bienvenida', seleccionado: false },
    { id: 'asistencia', etiqueta: 'Control de asistencia', seleccionado: false },
    { id: 'lectura', etiqueta: 'Lectura del acta anterior', seleccionado: false },
    { id: 'puntos', etiqueta: 'Puntos del orden del día', seleccionado: false },
    { id: 'acuerdos', etiqueta: 'Acuerdos y compromisos', seleccionado: false },
    { id: 'ruegos', etiqueta: 'Ruegos y preguntas', seleccionado: false },
    { id: 'cierre', etiqueta: 'Cierre de sesión', seleccionado: false }
  ];

  public plantillas: Plantilla[] = [
    {
      id: 1,
      nombre: 'Plantilla Reunión de Equipo',
      descripcion: 'Estructura estándar para reuniones de coordinación de equipo docente.',
      bloques: ['Control de asistencia', 'Lectura del acta anterior', 'Puntos del orden del día', 'Acuerdos y compromisos', 'Ruegos y preguntas'],
      fechaCreacion: '10/01/2026'
    },
    {
      id: 2,
      nombre: 'Plantilla Evaluaciones',
      descripcion: 'Formato específico para las sesiones de evaluación trimestral.',
      bloques: ['Control de asistencia', 'Puntos del orden del día', 'Acuerdos y compromisos', 'Cierre de sesión'],
      fechaCreacion: '15/03/2026'
    }
  ];

  private nextId = 3;

  get bloquesSeleccionados(): string[] {
    return this.bloquesDisponibles.filter(b => b.seleccionado).map(b => b.etiqueta);
  }

  abrirModalNueva(): void {
    this.nombreNueva = '';
    this.descripcionNueva = '';
    this.bloquesDisponibles.forEach(b => b.seleccionado = false);
    this.mostrarModalNueva = true;
  }

  guardarNueva(): void {
    if (!this.nombreNueva.trim() || this.bloquesSeleccionados.length === 0) return;
    this.plantillas.push({
      id: this.nextId++,
      nombre: this.nombreNueva.trim(),
      descripcion: this.descripcionNueva.trim(),
      bloques: [...this.bloquesSeleccionados],
      fechaCreacion: new Date().toLocaleDateString('es-ES')
    });
    this.mostrarModalNueva = false;
  }

  abrirEditar(plantilla: Plantilla): void {
    this.plantillaEditando = plantilla;
    this.nombreNueva = plantilla.nombre;
    this.descripcionNueva = plantilla.descripcion;
    this.bloquesDisponibles.forEach(b => {
      b.seleccionado = plantilla.bloques.includes(b.etiqueta);
    });
    this.mostrarModalEditar = true;
  }

  guardarEdicion(): void {
    if (!this.plantillaEditando || !this.nombreNueva.trim()) return;
    this.plantillaEditando.nombre = this.nombreNueva.trim();
    this.plantillaEditando.descripcion = this.descripcionNueva.trim();
    this.plantillaEditando.bloques = [...this.bloquesSeleccionados];
    this.mostrarModalEditar = false;
    this.plantillaEditando = null;
  }

  confirmarEliminar(plantilla: Plantilla): void {
    this.plantillaAEliminar = plantilla;
    this.confirmarMensaje = `¿Eliminar la plantilla "${plantilla.nombre}"? Esta acción no se puede deshacer.`;
    this.mostrarModalConfirmar = true;
  }

  confirmarAccion(): void {
    if (this.plantillaAEliminar) {
      this.plantillas = this.plantillas.filter(p => p.id !== this.plantillaAEliminar!.id);
      this.plantillaAEliminar = null;
    }
    this.mostrarModalConfirmar = false;
  }

  cancelarConfirmacion(): void {
    this.mostrarModalConfirmar = false;
    this.plantillaAEliminar = null;
  }
}
