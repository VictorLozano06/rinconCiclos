import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface PuntoOrdenDia {
  numOrden: number;
  objetivo: string;
  descripcion: string | null;
  minutos: number | null;
}

export interface ProfesorAsistente {
  idProfesor: number;
  nombre: string;
  asiste: boolean;
}

export interface ConvocatoriaPendiente {
  idConvocatoria: number;
  fechaOriginal: string;
  fecha: string;
  lugar: string;
  anioInicio: number;
  anioFin: number;
  idProfesorRedactaActa: number;
  idProfesorIniciaReunion: number;
  ordenDia: PuntoOrdenDia[];
  profesores: ProfesorAsistente[];
}

@Injectable({
  providedIn: 'root'
})
export class ProcesoActasService {
  private convocatoriaActiva: ConvocatoriaPendiente | null = null;
  
  constructor(private http: HttpClient, private apiService: ApiService) {}

  /**
   * Obtiene la convocatoria desde el backend y la guarda en memoria.
   */
  getConvocatoriaPendiente(): Observable<ConvocatoriaPendiente> {
    return this.http.get<ConvocatoriaPendiente>(`${this.apiService.baseUrl}?c=Actas&m=pendiente`)
      .pipe(
        tap(convocatoria => this.convocatoriaActiva = convocatoria)
      );
  }

  /**
   * Recupera la convocatoria que está guardada en memoria.
   */
  getConvocatoriaActiva(): ConvocatoriaPendiente | null {
    return this.convocatoriaActiva;
  }

  /**
   * Actualiza el estado de la asistencia en memoria.
   */
  guardarAsistencia(profesores: ProfesorAsistente[]): void {
    if (this.convocatoriaActiva) {
      this.convocatoriaActiva.profesores = profesores;
    }
  }

  limpiarEstado(): void {
    this.convocatoriaActiva = null;
  }
}
