import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface GrupoMock {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-grupos-participantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grupos-participantes.component.html',
  styleUrl: './grupos-participantes.component.css'
})
export class GruposParticipantesComponent {
  public grupos: GrupoMock[] = [
    { id: 1, nombre: '1º DAW' },
    { id: 2, nombre: '2º DAW' },
    { id: 3, margin: '1º SMR' } as any, // Will fix typings in data below
    { id: 4, nombre: '2º SMR' }
  ];

  constructor() {
    this.grupos[2] = { id: 3, nombre: '1º SMR' };
  }

  public mostrarModalNuevo = false;
  public mostrarModalEditar = false;
  public mostrarModalConfirmar = false;

  public nuevoNombre = '';
  public editarNombre = '';
  public grupoSeleccionado: GrupoMock | null = null;
  public mensajeConfirmar = '';
  public errorMensaje = '';

  guardarNuevo(): void {
    this.errorMensaje = '';
    if (!this.nuevoNombre.trim()) {
      this.errorMensaje = 'El nombre no puede estar vacío';
      return;
    }
    const existe = this.grupos.find(g => g.nombre.toLowerCase() === this.nuevoNombre.trim().toLowerCase());
    if (existe) {
      this.errorMensaje = 'Ya existe un grupo registrado con ese nombre';
      return;
    }
    const nuevoId = this.grupos.length > 0 ? Math.max(...this.grupos.map(g => g.id)) + 1 : 1;
    this.grupos.push({ id: nuevoId, nombre: this.nuevoNombre.trim() });
    this.mostrarModalNuevo = false;
    this.nuevoNombre = '';
  }

  abrirEditar(grupo: GrupoMock): void {
    this.errorMensaje = '';
    this.grupoSeleccionado = grupo;
    this.editarNombre = grupo.nombre;
    this.mostrarModalEditar = true;
  }

  guardarEditar(): void {
    this.errorMensaje = '';
    if (!this.editarNombre.trim() || !this.grupoSeleccionado) {
      this.errorMensaje = 'El nombre no puede estar vacío';
      return;
    }
    
    // Validar duplicado excluyendo el propio
    const existe = this.grupos.find(g => 
      g.id !== this.grupoSeleccionado!.id && 
      g.nombre.toLowerCase() === this.editarNombre.trim().toLowerCase()
    );

    if (existe) {
      this.errorMensaje = 'Ya existe otro grupo registrado con ese nombre';
      return;
    }

    this.grupoSeleccionado.nombre = this.editarNombre.trim();
    this.mostrarModalEditar = false;
    this.grupoSeleccionado = null;
  }

  abrirEliminar(grupo: GrupoMock): void {
    this.grupoSeleccionado = grupo;
    this.mensajeConfirmar = `¿Eliminar definitivamente el grupo "${grupo.nombre}"?`;
    this.mostrarModalConfirmar = true;
  }

  confirmarEliminar(): void {
    if (!this.grupoSeleccionado) return;
    this.grupos = this.grupos.filter(g => g.id !== this.grupoSeleccionado!.id);
    this.mostrarModalConfirmar = false;
    this.grupoSeleccionado = null;
  }
}
