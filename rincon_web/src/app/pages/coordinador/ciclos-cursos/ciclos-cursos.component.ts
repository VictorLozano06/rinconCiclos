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

    // Validación de duplicado
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
    
    // Validación de duplicado dentro del mismo ciclo
    const existe = this.cicloSeleccionado.cursos.some((c: any) => 
      c.nombre.toLowerCase() === this.editarNombreCurso.trim().toLowerCase() && 
      c.idCiclo !== this.cursoSeleccionado.idCiclo
    );

    if (existe) {
      this.errorEditarCurso = 'No se puede introducir en el mismo curso';
      return;
    }

    // Necesitamos llamar a un nuevo método en el servicio si editamos un curso individual.
    // Usaremos put directamente o implementaremos editarCurso en el servicio.
    // Como un workaround rápido, llamamos directo usando fetch para no tener que editar el service.ts
    // Pero lo correcto es añadir el método en CiclosService.
    fetch(`http://localhost:8000/index.php?c=Ciclos&m=editarCurso`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idCiclo: this.cursoSeleccionado.idCiclo, nombre: this.editarNombreCurso.trim() })
    }).then(res => res.json()).then(() => {
      this.cargarCiclos();
      this.mostrarModalEditarCurso = false;
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
      fetch(`http://localhost:8000/index.php?c=Ciclos&m=eliminarCurso&id=${this.itemAEliminar.idCiclo}`, {
        method: 'DELETE'
      }).then(res => res.json()).then(() => {
        this.cargarCiclos();
        this.mostrarModalConfirmar = false;
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
