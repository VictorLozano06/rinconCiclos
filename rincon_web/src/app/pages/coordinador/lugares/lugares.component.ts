import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LugarDto, LugarService } from '../../../services/lugar.service';

/**
 * Estado mínimo de los formularios de lugar.
 *
 * Se reutiliza tanto en la creación lateral como en el popup de edición.
 */
interface LugarFormulario {
  idLugar: number | null;
  nombre: string;
}

/**
 * Pantalla de gestión de lugares del coordinador.
 *
 * Esta vista muestra el listado real de lugares y permite:
 * - crear uno nuevo
 * - editar uno existente desde popup
 * - eliminarlo si la base de datos lo permite
 *
 * El backend es quien decide si un lugar sigue teniendo dependencias activas.
 */
@Component({
  selector: 'app-lugares-coordinador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lugares.component.html',
  styleUrl: './lugares.component.css'
})
export class LugaresComponent implements OnInit {
  /**
   * Listado real de lugares cargado desde backend.
   */
  public lugares: LugarDto[] = [];

  /**
   * Estado de carga inicial del listado.
   */
  public cargando = true;

  /**
   * Activa el mensaje de error cuando falla la carga del listado.
   */
  public errorCarga = false;

  /**
   * Texto de feedback general de la pantalla.
   */
  public feedback = '';

  /**
   * Indica si el feedback actual es de tipo error.
   */
  public feedbackError = false;

  /**
   * Controla si está visible el popup de edición.
   */
  public modalEdicionAbierto = false;

  /**
   * Lugar actualmente seleccionado para editar.
   */
  public lugarEditando: LugarDto | null = null;

  /**
   * Estado del formulario lateral de creación.
   */
  public formularioCrear: LugarFormulario = {
    idLugar: null,
    nombre: ''
  };

  /**
   * Estado del formulario del popup de edición.
   */
  public formularioEditar: LugarFormulario = {
    idLugar: null,
    nombre: ''
  };

  constructor(private lugarService: LugarService) {}

  /**
   * Carga inicial del listado de lugares.
   *
   * @returns void
   */
  ngOnInit(): void {
    this.cargarLugares();
  }

  /**
   * Texto corto de apoyo bajo el título de la vista.
   */
  get textoIntro(): string {
    return 'Listado de lugares para coordinacion.';
  }

  /**
   * Pide al backend el listado completo de lugares.
   *
   * @returns void
   */
  cargarLugares(): void {
    this.cargando = true;
    this.errorCarga = false;

    this.lugarService.getLugares().subscribe({
      next: (lugares) => {
        this.lugares = lugares;
        this.cargando = false;
      },
      error: () => {
        this.errorCarga = true;
        this.cargando = false;
      }
    });
  }

  /**
   * Valida y envía al backend un lugar nuevo.
   *
   * @returns void
   */
  guardarLugarNuevo(): void {
    const nombre = this.formularioCrear.nombre.trim();

    if (!nombre) {
      this.feedback = 'El nombre es obligatorio.';
      this.feedbackError = true;
      return;
    }

    this.lugarService.guardarLugar({
      idLugar: null,
      nombre
    }).subscribe({
      next: (respuesta) => {
        this.feedback = respuesta.message;
        this.feedbackError = false;
        this.formularioCrear = {
          idLugar: null,
          nombre: ''
        };
        this.cargarLugares();
      },
      error: (error: HttpErrorResponse) => {
        this.feedback = this.obtenerMensajeError(error, 'No se ha podido crear el lugar.');
        this.feedbackError = true;
      }
    });
  }

  /**
   * Abre el popup de edición precargando el lugar pulsado.
   *
   * @param lugar Lugar que el usuario quiere editar.
   *
   * @returns void
   */
  editarLugar(lugar: LugarDto): void {
    this.lugarEditando = lugar;
    this.formularioEditar = {
      idLugar: lugar.idLugar,
      nombre: lugar.nombre
    };
    this.modalEdicionAbierto = true;
    this.feedback = '';
    this.feedbackError = false;
  }

  /**
   * Valida y envía al backend la edición del lugar abierto en popup.
   *
   * @returns void
   */
  guardarLugarEditado(): void {
    const nombre = this.formularioEditar.nombre.trim();

    if (!nombre || this.formularioEditar.idLugar === null) {
      this.feedback = 'El nombre es obligatorio.';
      this.feedbackError = true;
      return;
    }

    this.lugarService.guardarLugar({
      idLugar: this.formularioEditar.idLugar,
      nombre
    }).subscribe({
      next: (respuesta) => {
        this.feedback = respuesta.message;
        this.feedbackError = false;
        this.cerrarModalEdicion();
        this.cargarLugares();
      },
      error: (error: HttpErrorResponse) => {
        this.feedback = this.obtenerMensajeError(error, 'No se ha podido guardar el lugar.');
        this.feedbackError = true;
      }
    });
  }

  /**
   * Lanza el borrado confirmado de un lugar.
   *
   * Si el backend detecta dependencias activas, devolverá un error legible y el
   * lugar seguirá apareciendo intacto en el listado.
   *
   * @param lugar Lugar que se quiere borrar.
   *
   * @returns void
   */
  eliminarLugar(lugar: LugarDto): void {
    const confirmado = window.confirm(`Borrar el lugar "${lugar.nombre}"?`);
    if (!confirmado) {
      return;
    }

    this.lugarService.eliminarLugar(lugar.idLugar).subscribe({
      next: (respuesta) => {
        this.feedback = respuesta.message;
        this.feedbackError = false;
        this.cargarLugares();
      },
      error: (error: HttpErrorResponse) => {
        this.feedback = this.obtenerMensajeError(error, 'No se ha podido borrar el lugar.');
        this.feedbackError = true;
      }
    });
  }

  /**
   * Marca visualmente la fila activa cuando coincide con el lugar en edición.
   *
   * @param lugar Fila del listado.
   *
   * @returns `true` si coincide con el lugar abierto en popup.
   */
  esLugarActivo(lugar: LugarDto): boolean {
    return this.lugarEditando?.idLugar === lugar.idLugar;
  }

  /**
   * Cierra el popup de edición y limpia su formulario.
   *
   * @returns void
   */
  cerrarModalEdicion(): void {
    this.modalEdicionAbierto = false;
    this.lugarEditando = null;
    this.formularioEditar = {
      idLugar: null,
      nombre: ''
    };
  }

  /**
   * Extrae un mensaje legible desde una respuesta HTTP fallida.
   *
   * @param error Error recibido desde Angular.
   * @param mensajePorDefecto Texto de fallback si el backend no manda mensaje.
   *
   * @returns Texto listo para pintar en la interfaz.
   */
  private obtenerMensajeError(error: HttpErrorResponse, mensajePorDefecto: string): string {
    return error.error?.message ?? mensajePorDefecto;
  }
}
