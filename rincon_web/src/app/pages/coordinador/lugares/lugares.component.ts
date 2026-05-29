import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LugarDto, LugarService } from '../../../services/lugar.service';

interface LugarFormulario {
  idLugar: number | null;
  nombre: string;
}

@Component({
  selector: 'app-lugares-coordinador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lugares.component.html',
  styleUrl: './lugares.component.css'
})
export class LugaresComponent implements OnInit {
  public lugares: LugarDto[] = [];
  public cargando = true;
  public errorCarga = false;
  public feedback = '';
  public feedbackError = false;
  public modalEdicionAbierto = false;
  public lugarEditando: LugarDto | null = null;

  public formularioCrear: LugarFormulario = {
    idLugar: null,
    nombre: ''
  };

  public formularioEditar: LugarFormulario = {
    idLugar: null,
    nombre: ''
  };

  constructor(private lugarService: LugarService) {}

  ngOnInit(): void {
    this.cargarLugares();
  }

  get textoIntro(): string {
    return 'Listado de lugares para coordinacion.';
  }

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

  esLugarActivo(lugar: LugarDto): boolean {
    return this.lugarEditando?.idLugar === lugar.idLugar;
  }

  cerrarModalEdicion(): void {
    this.modalEdicionAbierto = false;
    this.lugarEditando = null;
    this.formularioEditar = {
      idLugar: null,
      nombre: ''
    };
  }

  private obtenerMensajeError(error: HttpErrorResponse, mensajePorDefecto: string): string {
    return error.error?.message ?? mensajePorDefecto;
  }
}
