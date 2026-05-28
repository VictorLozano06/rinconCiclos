import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CiclosService } from '../../../services/ciclos.service';

@Component({
  selector: 'app-ciclos-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ciclos-cursos.component.html',
  styleUrl: './ciclos-cursos.component.css'
})
export class CiclosCursosComponent implements OnInit {
  public mostrarModalNuevoCiclo = false;
  public mostrarModalEditarCiclo = false;
  public mostrarModalConfirmar = false;
  public confirmarMensaje: string = '';

  public nuevoNombre: string = '';
  public nuevaFamilia: string = '';
  public cicloSeleccionado: any = null;
  public editarFamilia: string = '';
  public errorMensaje: string = '';

  public ciclos = [
    {
      siglas: 'DAW',
      familia: 'Desarrollo de Aplicaciones Web',
      abierto: false,
      cursos: [
        { nombre: '1DAW', familia: 'Desarrollo de Aplicaciones Web' },
        { nombre: '2DAW', familia: 'Desarrollo de Aplicaciones Web' }
      ]
    },
    {
      siglas: 'DAM',
      familia: 'Desarrollo de Aplicaciones Multiplataforma',
      abierto: false,
      cursos: [
        { nombre: '1DAM', familia: 'Desarrollo de Aplicaciones Multiplataforma' },
        { nombre: '2DAM', familia: 'Desarrollo de Aplicaciones Multiplataforma' }
      ]
    },
    {
      siglas: 'SMR',
      familia: 'Sistemas Microinformáticos y Redes',
      abierto: false,
      cursos: [
        { nombre: '1SMR', familia: 'Sistemas Microinformáticos y Redes' },
        { nombre: '2SMR', familia: 'Sistemas Microinformáticos y Redes' }
      ]
    }
  ];

  guardarNuevoCiclo(): void {
    this.errorMensaje = '';
    if (!this.nuevoNombre.trim() || !this.nuevaFamilia.trim()) {
      this.errorMensaje = 'No puedes dejar campos vacíos al crear un ciclo';
      return;
    }
    const existe = this.ciclos.find(c => c.siglas.toLowerCase() === this.nuevoNombre.trim().toLowerCase());
    if (existe) {
      this.errorMensaje = 'No se puede introducir el mismo ciclo';
      return;
    }
    this.ciclos.push({
      siglas: this.nuevoNombre.trim(),
      familia: this.nuevaFamilia.trim(),
      abierto: false,
      cursos: [
        { nombre: '1' + this.nuevoNombre.trim(), familia: this.nuevaFamilia.trim() },
        { nombre: '2' + this.nuevoNombre.trim(), familia: this.nuevaFamilia.trim() }
      ]
    });
  }

  abrirModalNuevoCiclo(): void {
    this.nuevoNombre = '';
    this.nuevaFamilia = '';
    this.errorNuevoCiclo = '';
    this.mostrarModalNuevoCiclo = true;
  }

  guardarNuevoCiclo(): void {
    this.errorNuevoCiclo = '';
    if (!this.nuevoNombre.trim() || !this.nuevaFamilia.trim()) return;

    // Validar duplicidad
    const existe = this.ciclos.some(c => c.siglas.toLowerCase() === this.nuevoNombre.trim().toLowerCase());
    if (existe) {
      this.errorNuevoCiclo = 'No se puede introducir el mismo ciclo';
      return;
    }

    this.ciclosService.crearCiclo(this.nuevoNombre.trim(), this.nuevaFamilia.trim()).subscribe({
      next: () => {
        this.cargarCiclos();
        this.mostrarModalNuevoCiclo = false;
        this.nuevoNombre = '';
        this.nuevaFamilia = '';
      },
      error: (err) => console.error('Error al crear ciclo', err)
    });
  }

  abrirEditarCiclo(ciclo: any): void {
    this.errorMensaje = '';
    this.cicloSeleccionado = ciclo;
    this.editarFamilia = ciclo.familia;
    this.mostrarModalEditarCiclo = true;
  }

  guardarEditarCiclo(): void {
    this.errorMensaje = '';
    if (!this.editarFamilia.trim()) {
      this.errorMensaje = 'La familia profesional no puede estar vacía';
      return;
    }
    this.cicloSeleccionado.familia = this.editarFamilia.trim();
    this.cicloSeleccionado.cursos.forEach((c: any) => c.familia = this.editarFamilia.trim());
    this.mostrarModalEditarCiclo = false;
  }

  eliminarCiclo(ciclo: any): void {
    this.confirmarMensaje = `¿Eliminar el ciclo "${ciclo.siglas}" y todos sus cursos?`;
    this.accionConfirmar = 'eliminarCiclo';
    this.itemAEliminar = ciclo;
    this.mostrarModalConfirmar = true;
  }

  confirmarAccion(): void {
    if (this.accionConfirmar === 'eliminarCiclo' && this.itemAEliminar) {
      this.ciclosService.eliminarCiclo(this.itemAEliminar.idCiclo).subscribe({
        next: () => {
          this.cargarCiclos();
          this.mostrarModalConfirmar = false;
        },
        error: (err) => console.error('Error al eliminar ciclo', err)
      });
    }
  }

  cancelarConfirmacion(): void {
    this.mostrarModalConfirmar = false;
    this.accionConfirmar = null;
    this.itemAEliminar = null;
  }

  toggleCiclo(ciclo: any): void {
    ciclo.abierto = !ciclo.abierto;
  }
}
