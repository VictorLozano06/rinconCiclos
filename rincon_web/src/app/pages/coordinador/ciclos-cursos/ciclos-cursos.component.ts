import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ciclos-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ciclos-cursos.component.html',
  styleUrl: './ciclos-cursos.component.css'
})
export class CiclosCursosComponent {
  public mostrarModalNuevoCiclo = false;
  public mostrarModalEditarCiclo = false;
  public mostrarModalEditarCurso = false;
  public mostrarModalConfirmar = false;
  public confirmarMensaje: string = '';

  public nuevoNombre: string = '';
  public nuevaFamilia: string = '';
  public cicloSeleccionado: any = null;
  public editarFamilia: string = '';
  public cursoSeleccionado: any = null;
  public editarNombreCurso: string = '';

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
    if (!this.nuevoNombre.trim() || !this.nuevaFamilia.trim()) return;
    this.ciclos.push({
      siglas: this.nuevoNombre.trim(),
      familia: this.nuevaFamilia.trim(),
      abierto: false,
      cursos: [
        { nombre: '1' + this.nuevoNombre.trim(), familia: this.nuevaFamilia.trim() },
        { nombre: '2' + this.nuevoNombre.trim(), familia: this.nuevaFamilia.trim() }
      ]
    });
    this.mostrarModalNuevoCiclo = false;
    this.nuevoNombre = '';
    this.nuevaFamilia = '';
  }

  abrirEditarCiclo(ciclo: any): void {
    this.cicloSeleccionado = ciclo;
    this.editarFamilia = ciclo.familia;
    this.mostrarModalEditarCiclo = true;
  }

  guardarEditarCiclo(): void {
    if (!this.editarFamilia.trim()) return;
    this.cicloSeleccionado.familia = this.editarFamilia.trim();
    this.cicloSeleccionado.cursos.forEach((c: any) => c.familia = this.editarFamilia.trim());
    this.mostrarModalEditarCiclo = false;
  }

  eliminarCiclo(ciclo: any): void {
    this.confirmarMensaje = `¿Eliminar el ciclo "${ciclo.siglas}" y todos sus cursos?`;
    this.mostrarModalConfirmar = true;
  }

  abrirEditarCurso(ciclo: any, curso: any): void {
    this.cicloSeleccionado = ciclo;
    this.cursoSeleccionado = curso;
    this.editarNombreCurso = curso.nombre;
    this.mostrarModalEditarCurso = true;
  }

  guardarEditarCurso(): void {
    if (!this.editarNombreCurso.trim()) return;
    this.cursoSeleccionado.nombre = this.editarNombreCurso.trim();
    this.mostrarModalEditarCurso = false;
  }

  eliminarCurso(curso: any): void {
    this.confirmarMensaje = `¿Eliminar el curso "${curso.nombre}"?`;
    this.mostrarModalConfirmar = true;
  }

  confirmarAccion(): void {
    this.mostrarModalConfirmar = false;
  }

  cancelarConfirmacion(): void {
    this.mostrarModalConfirmar = false;
  }

  toggleCiclo(ciclo: any): void {
    ciclo.abierto = !ciclo.abierto;
  }
}
