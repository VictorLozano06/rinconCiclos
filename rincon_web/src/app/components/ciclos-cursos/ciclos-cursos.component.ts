import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ciclos-cursos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ciclos-cursos.component.html',
  styleUrl: './ciclos-cursos.component.css'
})
export class CiclosCursosComponent {
  public mostrarModalNuevoCiclo = false;
  public mostrarModalEditarCiclo = false;
  public mostrarModalEditarCurso = false;
  
  public cicloSeleccionado: any = null;
  public cursoSeleccionado: any = null;

  public ciclos = [
    {
      id: 1,
      siglas: 'DAW',
      nombre: 'Desarrollo de Aplicaciones Web',
      familia: 'Informática y Comunicaciones',
      abierto: true,
      cursos: [
        { nombre: '1DAW' },
        { nombre: '2DAW' }
      ]
    },
    {
      id: 2,
      siglas: 'ASIR',
      nombre: 'Administración de Sistemas Informáticos',
      familia: 'Informática y Comunicaciones',
      abierto: false,
      cursos: []
    },
    {
      id: 3,
      siglas: 'SMR',
      nombre: 'Sistemas Microinformáticos y Redes',
      familia: 'Informática y Comunicaciones',
      abierto: false,
      cursos: []
    }
  ];

  toggleCiclo(ciclo: any): void {
    ciclo.abierto = !ciclo.abierto;
  }

  abrirEditarCiclo(ciclo: any): void {
    this.cicloSeleccionado = { ...ciclo };
    this.mostrarModalEditarCiclo = true;
  }

  abrirEditarCurso(ciclo: any, curso: any): void {
    this.cicloSeleccionado = ciclo;
    this.cursoSeleccionado = { ...curso };
    this.mostrarModalEditarCurso = true;
  }
}
