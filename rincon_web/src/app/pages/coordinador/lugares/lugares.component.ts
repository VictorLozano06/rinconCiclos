import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface LugarVista {
  idLugar: number;
  nombre: string;
}

interface LugarFormulario {
  idLugar: number | null;
  nombre: string;
}

@Component({
  selector: 'app-lugares-coordinador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lugares.component.html',
  styleUrl: './lugares.component.css'
})
export class LugaresComponent {
  public lugares: LugarVista[] = [
    { idLugar: 1, nombre: 'Aula 1' },
    { idLugar: 2, nombre: 'Aula 2' },
    { idLugar: 3, nombre: 'Sala de profesorado' },
    { idLugar: 4, nombre: 'Biblioteca' },
    { idLugar: 5, nombre: 'Salon de actos' },
    { idLugar: 6, nombre: 'Departamento' }
  ];

  public feedback = '';
  public modalEdicionAbierto = false;
  public lugarEditando: LugarVista | null = null;

  public formularioCrear: LugarFormulario = {
    idLugar: null,
    nombre: ''
  };

  public formularioEditar: LugarFormulario = {
    idLugar: null,
    nombre: ''
  };

  get textoIntro(): string {
    return 'Listado de lugares para coordinacion.';
  }

  guardarLugarNuevo(): void {
    const nombre = this.formularioCrear.nombre.trim();

    if (!nombre) {
      this.feedback = 'El nombre es obligatorio.';
      return;
    }

    this.formularioCrear = {
      idLugar: null,
      nombre: ''
    };
    this.feedback = '';
  }

  editarLugar(lugar: LugarVista): void {
    this.lugarEditando = lugar;
    this.formularioEditar = {
      idLugar: lugar.idLugar,
      nombre: lugar.nombre
    };
    this.modalEdicionAbierto = true;
    this.feedback = '';
  }

  guardarLugarEditado(): void {
    const nombre = this.formularioEditar.nombre.trim();

    if (!nombre || this.formularioEditar.idLugar === null) {
      return;
    }

    this.cerrarModalEdicion();
  }

  eliminarLugar(lugar: LugarVista): void {
    const confirmado = window.confirm(`Borrar el lugar "${lugar.nombre}"?`);
    if (!confirmado) {
      return;
    }
  }

  esLugarActivo(lugar: LugarVista): boolean {
    return this.lugarEditando?.idLugar === lugar.idLugar;
  }

  cerrarModalEdicion(): void {
    this.modalEdicionAbierto = false;
    this.lugarEditando = null;
    this.formularioEditar = {
      idLugar: null,
      nombre: ''
    };
  }
}
