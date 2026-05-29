import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GruposService, Grupo } from '../../../services/grupos.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-grupos-participantes',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './grupos-participantes.component.html',
  styleUrl: './grupos-participantes.component.css'
})
export class GruposParticipantesComponent implements OnInit {
  public grupos: Grupo[] = [];

  constructor(private gruposService: GruposService) {}

  ngOnInit(): void {
    this.cargarGrupos();
  }

  cargarGrupos(): void {
    this.gruposService.getGrupos().subscribe({
      next: (data) => {
        this.grupos = data;
      },
      error: (err) => {
        console.error('Error al cargar grupos', err);
      }
    });
  }

  public mostrarModalNuevo = false;
  public mostrarModalEditar = false;
  public mostrarModalConfirmar = false;

  public nuevoNombre = '';
  public editarNombre = '';
  public grupoSeleccionado: Grupo | null = null;
  public mensajeConfirmar = '';
  public errorMensaje = '';

  private normalizarTexto(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quita tildes
      .replace(/[ºª]/g, '')           // Quita º y ª
      .replace(/\s+/g, '')            // Quita todos los espacios
      .toLowerCase();
  }

  guardarNuevo(): void {
    this.errorMensaje = '';
    if (!this.nuevoNombre.trim()) {
      this.errorMensaje = 'El nombre no puede estar vacío';
      return;
    }

    const nombreNormalizado = this.normalizarTexto(this.nuevoNombre.trim());
    const existe = this.grupos.find(g => this.normalizarTexto(g.nombre) === nombreNormalizado);
    
    if (existe) {
      this.errorMensaje = 'Ya existe un grupo registrado con ese nombre';
      return;
    }

    this.gruposService.crearGrupo(this.nuevoNombre.trim()).subscribe({
      next: (res) => {
        if (res.error) {
          this.errorMensaje = res.error;
        } else {
          this.mostrarModalNuevo = false;
          this.nuevoNombre = '';
          this.cargarGrupos();
        }
      },
      error: (err) => {
        this.errorMensaje = 'Error de conexión al crear el grupo.';
      }
    });
  }

  abrirEditar(grupo: Grupo): void {
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
    
    const nombreNormalizado = this.normalizarTexto(this.editarNombre.trim());
    const existe = this.grupos.find(g => 
      g.id !== this.grupoSeleccionado!.id && 
      this.normalizarTexto(g.nombre) === nombreNormalizado
    );

    if (existe) {
      this.errorMensaje = 'Ya existe otro grupo registrado con ese nombre';
      return;
    }

    this.gruposService.editarGrupo(this.grupoSeleccionado.id, this.editarNombre.trim()).subscribe({
      next: (res) => {
        if (res.error) {
          this.errorMensaje = res.error;
        } else {
          this.mostrarModalEditar = false;
          this.grupoSeleccionado = null;
          this.cargarGrupos();
        }
      },
      error: (err) => {
        this.errorMensaje = 'Error de conexión al editar el grupo.';
      }
    });
  }

  abrirEliminar(grupo: Grupo): void {
    this.grupoSeleccionado = grupo;
    this.mensajeConfirmar = `¿Eliminar definitivamente el grupo "${grupo.nombre}"?`;
    this.mostrarModalConfirmar = true;
  }

  confirmarEliminar(): void {
    if (!this.grupoSeleccionado) return;
    this.gruposService.eliminarGrupo(this.grupoSeleccionado.id).subscribe({
      next: (res) => {
        if (res.error) {
          console.error(res.error);
        } else {
          this.mostrarModalConfirmar = false;
          this.grupoSeleccionado = null;
          this.cargarGrupos();
        }
      },
      error: (err) => {
        console.error('Error al eliminar grupo', err);
      }
    });
  }
}
