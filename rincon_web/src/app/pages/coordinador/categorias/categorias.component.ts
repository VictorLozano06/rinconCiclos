import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoriaDto } from '../../../dto/categoria.dto';
import { CategoriaService } from '../../../services/categoria.service';

interface CategoriaVista {
  idCategoria: number;
  nombre: string;
  idCategoriaPadre: number | null;
  predeterminada: boolean;
}

interface CategoriaFormulario {
  idCategoria: number | null;
  nombre: string;
  idCategoriaPadre: number | null;
}

@Component({
  selector: 'app-categorias-coordinador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categorias.component.html',
  styleUrl: './categorias.component.css'
})
export class CategoriasComponent implements OnInit {
  private readonly categoriasEspeciales = ['Convocatorias', 'Actas', 'BOCC'];

  public categorias: CategoriaVista[] = [];
  public cargando = true;
  public errorCarga = false;
  public feedback = '';
  public feedbackError = false;
  public modalEdicionAbierto = false;
  public categoriaEditando: CategoriaVista | null = null;

  public formularioCrear: CategoriaFormulario = {
    idCategoria: null,
    nombre: '',
    idCategoriaPadre: null
  };

  public formularioEditar: CategoriaFormulario = {
    idCategoria: null,
    nombre: '',
    idCategoriaPadre: null
  };

  constructor(private categoriaService: CategoriaService) {}

  ngOnInit(): void {
    this.cargarCategorias();
  }

  get categoriasRaiz(): CategoriaVista[] {
    return this.categorias
      .filter((categoria) => categoria.idCategoriaPadre === null)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  get textoIntro(): string {
    return 'Listado de categorias para coordinacion.';
  }

  get categoriasPadreDisponiblesCrear(): CategoriaVista[] {
    return this.categoriasRaiz;
  }

  get categoriasPadreDisponiblesEditar(): CategoriaVista[] {
    return this.categoriasRaiz.filter((categoria) => categoria.idCategoria !== this.formularioEditar.idCategoria);
  }

  get categoriasEspecialesInfo(): string {
    return this.categoriasEspeciales.join(', ');
  }

  cargarCategorias(): void {
    this.cargando = true;
    this.errorCarga = false;

    this.categoriaService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias = this.aplanarCategorias(categorias);
        this.cargando = false;
      },
      error: () => {
        this.errorCarga = true;
        this.cargando = false;
      }
    });
  }

  nuevaCategoria(): void {
    this.formularioCrear = {
      idCategoria: null,
      nombre: '',
      idCategoriaPadre: null
    };
  }

  editarCategoria(categoria: CategoriaVista): void {
    if (!this.puedeGestionarse(categoria)) {
      this.feedback = 'Esta categoria no se puede editar.';
      this.feedbackError = true;
      return;
    }

    this.categoriaEditando = categoria;
    this.formularioEditar = {
      idCategoria: categoria.idCategoria,
      nombre: categoria.nombre,
      idCategoriaPadre: categoria.idCategoriaPadre
    };
    this.modalEdicionAbierto = true;
    this.feedback = '';
    this.feedbackError = false;
  }

  guardarCategoriaNueva(): void {
    const nombre = this.formularioCrear.nombre.trim();

    if (!nombre) {
      this.feedback = 'El nombre es obligatorio.';
      this.feedbackError = true;
      return;
    }

    if (this.formularioCrear.idCategoriaPadre !== null && !this.esCategoriaRaiz(this.formularioCrear.idCategoriaPadre)) {
      this.feedback = 'La categoria padre tiene que ser una categoria raiz.';
      this.feedbackError = true;
      return;
    }

    this.categoriaService.guardarCategoria({
      idCategoria: null,
      nombre,
      idCategoriaPadre: this.formularioCrear.idCategoriaPadre
    }).subscribe({
      next: (respuesta) => {
        this.feedback = respuesta.message;
        this.feedbackError = false;
        this.nuevaCategoria();
        this.cargarCategorias();
      },
      error: (error: HttpErrorResponse) => {
        this.feedback = this.obtenerMensajeError(error, 'No se ha podido crear la categoria.');
        this.feedbackError = true;
      }
    });
  }

  guardarCategoriaEditada(): void {
    const nombre = this.formularioEditar.nombre.trim();

    if (!nombre || this.formularioEditar.idCategoria === null) {
      this.feedback = 'El nombre es obligatorio.';
      this.feedbackError = true;
      return;
    }

    if (this.formularioEditar.idCategoriaPadre !== null && !this.esCategoriaRaiz(this.formularioEditar.idCategoriaPadre)) {
      this.feedback = 'La categoria padre tiene que ser una categoria raiz.';
      this.feedbackError = true;
      return;
    }

    this.categoriaService.guardarCategoria({
      idCategoria: this.formularioEditar.idCategoria,
      nombre,
      idCategoriaPadre: this.formularioEditar.idCategoriaPadre
    }).subscribe({
      next: (respuesta) => {
        this.feedback = respuesta.message;
        this.feedbackError = false;
        this.cerrarModalEdicion();
        this.cargarCategorias();
      },
      error: (error: HttpErrorResponse) => {
        this.feedback = this.obtenerMensajeError(error, 'No se ha podido guardar la categoria.');
        this.feedbackError = true;
      }
    });
  }

  eliminarCategoria(categoria: CategoriaVista): void {
    if (!this.puedeGestionarse(categoria)) {
      this.feedback = 'Esta categoria no se puede borrar.';
      this.feedbackError = true;
      return;
    }

    const confirmado = window.confirm(
      `Borrar la categoria "${categoria.nombre}"?\n\nAl borrar esta categoria tambien se borran sus subcategorias y sus recursos asociados.`
    );
    if (!confirmado) {
      return;
    }

    this.categoriaService.eliminarCategoria(categoria.idCategoria).subscribe({
      next: (respuesta) => {
        this.feedback = respuesta.message;
        this.feedbackError = false;
        this.cargarCategorias();
      },
      error: (error: HttpErrorResponse) => {
        this.feedback = this.obtenerMensajeError(error, 'No se ha podido borrar la categoria.');
        this.feedbackError = true;
      }
    });
  }

  getHijos(idCategoria: number): CategoriaVista[] {
    return this.categorias
      .filter((categoria) => categoria.idCategoriaPadre === idCategoria)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  puedeGestionarse(categoria: CategoriaVista): boolean {
    return !categoria.predeterminada && !this.esCategoriaEspecial(categoria.nombre);
  }

  esCategoriaActiva(categoria: CategoriaVista): boolean {
    return this.categoriaEditando?.idCategoria === categoria.idCategoria;
  }

  cerrarModalEdicion(): void {
    this.modalEdicionAbierto = false;
    this.categoriaEditando = null;
    this.formularioEditar = {
      idCategoria: null,
      nombre: '',
      idCategoriaPadre: null
    };
  }

  private esCategoriaRaiz(idCategoria: number): boolean {
    return this.categorias.some((categoria) => categoria.idCategoria === idCategoria && categoria.idCategoriaPadre === null);
  }

  private esCategoriaEspecial(nombre: string): boolean {
    return this.categoriasEspeciales.includes(nombre);
  }

  private obtenerMensajeError(error: HttpErrorResponse, mensajePorDefecto: string): string {
    return error.error?.message ?? mensajePorDefecto;
  }

  private aplanarCategorias(
    categorias: CategoriaDto[],
    idCategoriaPadreVisible: number | null = null,
    idsYaIncluidos: Set<number> = new Set<number>()
  ): CategoriaVista[] {
    const resultado: CategoriaVista[] = [];

    for (const categoria of categorias) {
      if (idsYaIncluidos.has(categoria.idCategoria)) {
        continue;
      }

      idsYaIncluidos.add(categoria.idCategoria);

      resultado.push({
        idCategoria: categoria.idCategoria,
        nombre: categoria.nombre,
        idCategoriaPadre: idCategoriaPadreVisible,
        predeterminada: categoria.predeterminada
      });

      if (categoria.subcategorias?.length) {
        resultado.push(...this.aplanarCategorias(categoria.subcategorias, categoria.idCategoria, idsYaIncluidos));
      }
    }

    return resultado;
  }
}
