import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlantillasService, Plantilla } from '../../../services/plantillas.service';

interface BloquePlantilla {
  id: string;
  etiqueta: string;
  seleccionado: boolean;
}

@Component({
  selector: 'app-actas-plantilla',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './actas-plantilla.component.html',
  styleUrl: './actas-plantilla.component.css'
})
export class ActasPlantillaComponent implements OnInit {
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

  public plantillas: Plantilla[] = [];
  public errorMensaje: string = '';

  constructor(private plantillasService: PlantillasService) {}

  ngOnInit(): void {
    this.cargarPlantillas();
  }

  cargarPlantillas(): void {
    this.plantillasService.getPlantillas().subscribe({
      next: (data) => this.plantillas = data,
      error: (err) => console.error('Error cargando plantillas', err)
    });
  }

  get bloquesSeleccionados(): string[] {
    return this.bloquesDisponibles.filter(b => b.seleccionado).map(b => b.etiqueta);
  }

  abrirModalNueva(): void {
    this.nombreNueva = '';
    this.descripcionNueva = '';
    this.errorMensaje = '';
    this.bloquesDisponibles.forEach(b => b.seleccionado = false);
    this.mostrarModalNueva = true;
  }

  guardarNueva(): void {
    this.errorMensaje = '';
    
    if (!this.nombreNueva.trim() || this.bloquesSeleccionados.length === 0) {
      this.errorMensaje = 'Error: Debe asignar un nombre y seleccionar al menos un bloque para la plantilla';
      return;
    }

    this.plantillasService.crearPlantilla(this.nombreNueva.trim(), this.descripcionNueva.trim(), this.bloquesSeleccionados)
      .subscribe({
        next: (data) => {
          this.plantillas.push(data);
          this.mostrarModalNueva = false;
        },
        error: (err) => {
          this.errorMensaje = err?.error?.error || 'Error al guardar la plantilla.';
        }
      });
  }

  abrirEditar(plantilla: Plantilla): void {
    this.plantillaEditando = plantilla;
    this.nombreNueva = plantilla.nombre;
    this.descripcionNueva = plantilla.descripcion;
    this.errorMensaje = '';
    this.bloquesDisponibles.forEach(b => {
      b.seleccionado = plantilla.bloques.includes(b.etiqueta);
    });
    this.mostrarModalEditar = true;
  }

  guardarEdicion(): void {
    this.errorMensaje = '';

    if (!this.plantillaEditando || !this.nombreNueva.trim() || this.bloquesSeleccionados.length === 0) {
      this.errorMensaje = 'Error: Debe asignar un nombre y seleccionar al menos un bloque para la plantilla';
      return;
    }
    
    this.plantillasService.editarPlantilla(this.plantillaEditando.id, this.nombreNueva.trim(), this.descripcionNueva.trim(), this.bloquesSeleccionados)
      .subscribe({
        next: () => {
          this.cargarPlantillas();
          this.mostrarModalEditar = false;
          this.plantillaEditando = null;
        },
        error: (err) => {
          this.errorMensaje = err?.error?.error || 'Error al editar la plantilla.';
        }
      });
  }

  confirmarEliminar(plantilla: Plantilla): void {
    this.plantillaAEliminar = plantilla;
    this.confirmarMensaje = `¿Eliminar la plantilla "${plantilla.nombre}"? Esta acción no se puede deshacer.`;
    this.mostrarModalConfirmar = true;
  }

  confirmarAccion(): void {
    if (this.plantillaAEliminar) {
      this.plantillasService.eliminarPlantilla(this.plantillaAEliminar.id).subscribe({
        next: () => {
          this.plantillas = this.plantillas.filter(p => p.id !== this.plantillaAEliminar!.id);
          this.plantillaAEliminar = null;
          this.mostrarModalConfirmar = false;
        },
        error: (err) => console.error('Error al eliminar', err)
      });
    }
  }

  cancelarConfirmacion(): void {
    this.mostrarModalConfirmar = false;
    this.plantillaAEliminar = null;
  }
}
