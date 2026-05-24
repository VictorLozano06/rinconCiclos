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
  public mostrarModalEditarCurso = false;
  public mostrarModalConfirmar = false;
  public confirmarMensaje: string = '';

  public nuevoNombre: string = '';
  public nuevaFamilia: string = '';
  public cicloSeleccionado: any = null;
  public editarFamilia: string = '';
  public cursoSeleccionado: any = null;
  public editarNombreCurso: string = '';

  public errorNuevoCiclo: string = '';
  public errorEditarCurso: string = '';
  
  public accionConfirmar: 'eliminarCiclo' | 'eliminarCurso' | null = null;
  public itemAEliminar: any = null;

  public ciclos: any[] = [];

  constructor(private ciclosService: CiclosService) {}

  ngOnInit(): void {
    this.cargarCiclos();
  }

  cargarCiclos(): void {
    this.ciclosService.getCiclos().subscribe({
      next: (data: any) => {
        this.ciclos = data;
      },
      error: (err) => console.error('Error al cargar ciclos', err)
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
    this.cicloSeleccionado = ciclo;
    this.editarFamilia = ciclo.familia;
    this.mostrarModalEditarCiclo = true;
  }

  guardarEditarCiclo(): void {
    if (!this.editarFamilia.trim()) return;
    this.ciclosService.editarCiclo(this.cicloSeleccionado.idCiclo, this.cicloSeleccionado.siglas, this.editarFamilia.trim()).subscribe({
      next: () => {
        this.cargarCiclos();
        this.mostrarModalEditarCiclo = false;
      },
      error: (err) => console.error('Error al editar ciclo', err)
    });
  }

  eliminarCiclo(ciclo: any): void {
    this.confirmarMensaje = `¿Eliminar el ciclo "${ciclo.siglas}" y todos sus cursos?`;
    this.accionConfirmar = 'eliminarCiclo';
    this.itemAEliminar = ciclo;
    this.mostrarModalConfirmar = true;
  }

  abrirEditarCurso(ciclo: any, curso: any): void {
    this.cicloSeleccionado = ciclo;
    this.cursoSeleccionado = curso;
    this.editarNombreCurso = curso.nombre;
    this.errorEditarCurso = '';
    this.mostrarModalEditarCurso = true;
  }

  guardarEditarCurso(): void {
    this.errorEditarCurso = '';
    if (!this.editarNombreCurso.trim()) return;
    
    // Comprobamos que no se repita el curso en la misma familia
    const existe = this.cicloSeleccionado.cursos.some((c: any) => 
      c.nombre.toLowerCase() === this.editarNombreCurso.trim().toLowerCase() && 
      c.idCiclo !== this.cursoSeleccionado.idCiclo
    );

    if (existe) {
      this.errorEditarCurso = 'No se puede introducir en el mismo curso';
      return;
    }

    // OJO: Tirando directo con el servicio para usar el enviroment configurado
    this.ciclosService.editarCurso(this.cursoSeleccionado.idCiclo, this.editarNombreCurso.trim()).subscribe({
      next: () => {
        this.cargarCiclos();
        this.mostrarModalEditarCurso = false;
      },
      error: (err) => console.error(err)
    });
  }

  eliminarCurso(curso: any): void {
    this.confirmarMensaje = `¿Eliminar el curso "${curso.nombre}"?`;
    this.accionConfirmar = 'eliminarCurso';
    this.itemAEliminar = curso;
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
    } else if (this.accionConfirmar === 'eliminarCurso' && this.itemAEliminar) {
      this.ciclosService.eliminarCurso(this.itemAEliminar.idCiclo).subscribe({
        next: () => {
          this.cargarCiclos();
          this.mostrarModalConfirmar = false;
        },
        error: (err) => console.error(err)
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
