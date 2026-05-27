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

  public errorNuevoCiclo: string = '';
  
  public accionConfirmar: 'eliminarCiclo' | null = null;
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
