import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoriaDto } from '../../dto/categoria.dto';
import { CicloRecursoDto } from '../../dto/ciclo-recurso.dto';

interface CursoFormulario {
  idCurso: number | 'Todos';
  etiqueta: string;
}

type CategoriaFormulario = Pick<CategoriaDto, 'idCategoria' | 'nombre'>;
type CicloFormulario = CicloRecursoDto;

interface RecursoFormularioMock {
  idCategoria: number | null;
  nombre: string;
  descripcion: string;
  cursoId: number | null;
  ciclosSeleccionados: number[];
  enlaces: string[];
  archivos: string[];
}

@Component({
  selector: 'app-recurso-formulario-mock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recurso-formulario-mock.component.html',
  styleUrl: './recurso-formulario-mock.component.css'
})
export class RecursoFormularioMockComponent {
  @Input({ required: true }) titulo = '';
  @Input({ required: true }) textoIntro = '';
  @Input({ required: true }) textoBotonGuardar = '';
  @Input({ required: true }) formulario!: RecursoFormularioMock;
  @Input() categoriasFormulario: CategoriaFormulario[] = [];
  @Input() cursosFiltro: CursoFormulario[] = [];
  @Input() ciclosFormulario: CicloFormulario[] = [];
  @Input() erroresFormulario: string[] = [];
  @Input() nuevoCicloId: number | null = null;
  @Input() nuevoEnlace = '';
  @Input() nuevoArchivo = '';

  @Output() nuevoCicloIdChange = new EventEmitter<number | null>();
  @Output() nuevoEnlaceChange = new EventEmitter<string>();
  @Output() nuevoArchivoChange = new EventEmitter<string>();
  @Output() agregarCiclo = new EventEmitter<void>();
  @Output() eliminarCiclo = new EventEmitter<number>();
  @Output() agregarEnlace = new EventEmitter<void>();
  @Output() eliminarEnlace = new EventEmitter<number>();
  @Output() agregarArchivo = new EventEmitter<void>();
  @Output() eliminarArchivo = new EventEmitter<number>();
  @Output() cancelar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<void>();

  actualizarNuevoCiclo(valor: string): void {
    this.nuevoCicloIdChange.emit(valor ? Number(valor) : null);
  }

  actualizarNuevoEnlace(valor: string): void {
    this.nuevoEnlaceChange.emit(valor);
  }

  actualizarNuevoArchivo(valor: string): void {
    this.nuevoArchivoChange.emit(valor);
  }

  obtenerNombreCiclo(idCiclo: number): string {
    return this.ciclosFormulario.find((ciclo) => ciclo.idCiclo === idCiclo)?.nombre || `Ciclo ${idCiclo}`;
  }
}
