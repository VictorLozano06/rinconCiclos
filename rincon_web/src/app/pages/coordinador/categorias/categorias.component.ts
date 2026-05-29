import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoriaDto } from '../../../dto/categoria.dto';
import { CategoriaService } from '../../../services/categoria.service';

/**
 * Estructura plana usada por la vista de gestión de categorías.
 *
 * El backend devuelve el árbol anidado. Para esta pantalla interesa aplanarlo
 * y guardar solo:
 * - el id de la categoría
 * - su nombre
 * - qué padre visible tiene en la UI
 * - si es predeterminada
 */
interface CategoriaVista {
  idCategoria: number;
  nombre: string;
  idCategoriaPadre: number | null;
  predeterminada: boolean;
}

/**
 * Estado mínimo del formulario de crear/editar categoría.
 */
interface CategoriaFormulario {
  idCategoria: number | null;
  nombre: string;
  idCategoriaPadre: number | null;
}

/**
 * Pantalla de gestión de categorías del coordinador.
 *
 * Esta vista:
 * - carga el árbol real desde backend
 * - lo transforma para el layout del CRUD
 * - permite crear categorías nuevas
 * - abre un popup para editar
 * - permite borrar categorías editables
 *
 * Las validaciones de negocio fuertes siguen en backend, pero aquí se hace una
 * primera validación visual para no enviar formularios claramente erróneos.
 */
@Component({
  selector: 'app-categorias-coordinador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categorias.component.html',
  styleUrl: './categorias.component.css'
})
export class CategoriasComponent implements OnInit {
  /**
   * Categorías que la app considera especiales y no deben gestionarse aquí.
   */
  private readonly categoriasEspeciales = ['Convocatorias', 'Actas', 'BOCC'];

  /**
   * Lista plana usada para pintar el árbol visual y resolver padres/hijas.
   */
  public categorias: CategoriaVista[] = [];

  /**
   * Estado de carga inicial del árbol.
   */
  public cargando = true;

  /**
   * Bandera que activa el mensaje de error de carga.
   */
  public errorCarga = false;

  /**
   * Texto de feedback general de la pantalla.
   */
  public feedback = '';

  /**
   * Indica si el feedback actual es un error.
   */
  public feedbackError = false;

  /**
   * Controla la visibilidad del popup de edición.
   */
  public modalEdicionAbierto = false;

  /**
   * Categoría actualmente seleccionada para editar.
   */
  public categoriaEditando: CategoriaVista | null = null;

  /**
   * Estado del formulario lateral de creación.
   */
  public formularioCrear: CategoriaFormulario = {
    idCategoria: null,
    nombre: '',
    idCategoriaPadre: null
  };

  /**
   * Estado del formulario del popup de edición.
   */
  public formularioEditar: CategoriaFormulario = {
    idCategoria: null,
    nombre: '',
    idCategoriaPadre: null
  };

  constructor(private categoriaService: CategoriaService) {}

  /**
   * Carga inicial del árbol de categorías.
   *
   * @returns void
   */
  ngOnInit(): void {
    this.cargarCategorias();
  }

  /**
   * Devuelve solo las categorías raíz visibles.
   *
   * En la pantalla, una raíz visible es una categoría que no cuelga de otra
   * categoría visible, aunque en base de datos realmente cuelgue de `RAIZ`.
   */
  get categoriasRaiz(): CategoriaVista[] {
    return this.categorias
      .filter((categoria) => categoria.idCategoriaPadre === null)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  /**
   * Texto corto de apoyo bajo el título principal.
   */
  get textoIntro(): string {
    return 'Listado de categorias para coordinacion.';
  }

  /**
   * Opciones de padre válidas en el formulario de creación.
   *
   * Solo puede elegirse una categoría raíz visible como padre.
   */
  get categoriasPadreDisponiblesCrear(): CategoriaVista[] {
    return this.categoriasRaiz;
  }

  /**
   * Opciones de padre válidas en el popup de edición.
   *
   * Se excluye la propia categoría para evitar relaciones absurdas.
   */
  get categoriasPadreDisponiblesEditar(): CategoriaVista[] {
    return this.categoriasRaiz.filter((categoria) => categoria.idCategoria !== this.formularioEditar.idCategoria);
  }

  /**
   * Texto resumido con el listado de categorías especiales bloqueadas.
   */
  get categoriasEspecialesInfo(): string {
    return this.categoriasEspeciales.join(', ');
  }

  /**
   * Pide al backend el árbol real de categorías y lo aplana para la vista.
   *
   * @returns void
   */
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

  /**
   * Reinicia el formulario lateral de creación.
   *
   * @returns void
   */
  nuevaCategoria(): void {
    this.formularioCrear = {
      idCategoria: null,
      nombre: '',
      idCategoriaPadre: null
    };
  }

  /**
   * Abre el popup de edición precargando la categoría seleccionada.
   *
   * Si la categoría no es editable, se muestra feedback de bloqueo.
   *
   * @param categoria Categoría sobre la que se ha pulsado editar.
   *
   * @returns void
   */
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

  /**
   * Valida y envía al backend la creación de una categoría nueva.
   *
   * @returns void
   */
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

  /**
   * Valida y envía al backend la edición de la categoría abierta en popup.
   *
   * @returns void
   */
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

  /**
   * Lanza el borrado confirmado de una categoría editable.
   *
   * El confirm ya avisa de la consecuencia importante: borrar recursos e hijas.
   *
   * @param categoria Categoría candidata a borrado.
   *
   * @returns void
   */
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

  /**
   * Devuelve las hijas visibles de una categoría concreta.
   *
   * @param idCategoria Identificador de la categoría padre visible.
   *
   * @returns Subcategorías directas ordenadas por nombre.
   */
  getHijos(idCategoria: number): CategoriaVista[] {
    return this.categorias
      .filter((categoria) => categoria.idCategoriaPadre === idCategoria)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  /**
   * Indica si una categoría puede editarse o borrarse desde la UI.
   *
   * @param categoria Categoría que se quiere comprobar.
   *
   * @returns `true` si es gestionable.
   */
  puedeGestionarse(categoria: CategoriaVista): boolean {
    return !categoria.predeterminada && !this.esCategoriaEspecial(categoria.nombre);
  }

  /**
   * Marca visualmente la fila que coincide con la categoría abierta en el popup.
   *
   * @param categoria Fila del árbol visual.
   *
   * @returns `true` si esa fila corresponde a la categoría en edición.
   */
  esCategoriaActiva(categoria: CategoriaVista): boolean {
    return this.categoriaEditando?.idCategoria === categoria.idCategoria;
  }

  /**
   * Cierra el popup de edición y limpia su formulario.
   *
   * @returns void
   */
  cerrarModalEdicion(): void {
    this.modalEdicionAbierto = false;
    this.categoriaEditando = null;
    this.formularioEditar = {
      idCategoria: null,
      nombre: '',
      idCategoriaPadre: null
    };
  }

  /**
   * Comprueba si un id corresponde a una raíz visible.
   *
   * @param idCategoria Identificador a comprobar.
   *
   * @returns `true` si esa categoría es una raíz de la vista.
   */
  private esCategoriaRaiz(idCategoria: number): boolean {
    return this.categorias.some((categoria) => categoria.idCategoria === idCategoria && categoria.idCategoriaPadre === null);
  }

  /**
   * Comprueba si un nombre pertenece al grupo de categorías especiales.
   *
   * @param nombre Nombre visible de la categoría.
   *
   * @returns `true` si debe bloquearse su gestión.
   */
  private esCategoriaEspecial(nombre: string): boolean {
    return this.categoriasEspeciales.includes(nombre);
  }

  /**
   * Extrae un mensaje legible desde una respuesta de error HTTP.
   *
   * Si el backend no manda un mensaje concreto, se usa el texto por defecto.
   *
   * @param error Respuesta de error Angular.
   * @param mensajePorDefecto Texto de fallback.
   *
   * @returns Mensaje listo para pintar en la UI.
   */
  private obtenerMensajeError(error: HttpErrorResponse, mensajePorDefecto: string): string {
    return error.error?.message ?? mensajePorDefecto;
  }

  /**
   * Convierte el árbol anidado del backend en una lista plana para esta vista.
   *
   * La pantalla de gestión no pinta el árbol con recursión directa. Prefiere
   * una lista plana con referencias padre/hija visibles para poder:
   * - agrupar raíces
   * - localizar hijas fácilmente
   * - evitar duplicados
   *
   * @param categorias Árbol recibido desde backend.
   * @param idCategoriaPadreVisible Padre visible del nivel actual.
   * @param idsYaIncluidos Conjunto auxiliar para no repetir nodos.
   *
   * @returns Lista plana de categorías visible para la pantalla.
   */
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
