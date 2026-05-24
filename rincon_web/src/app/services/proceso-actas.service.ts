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

  // Recuperamos los datos del servidor para pintar la pantalla
  getConvocatoriaPendiente(): Observable<ConvocatoriaPendiente> {
    return this.http.get<ConvocatoriaPendiente>(`${this.apiService.baseUrl}?c=Actas&m=pendiente`)
      .pipe(
        tap(convocatoria => this.convocatoriaActiva = convocatoria)
      );
  }

  // Permite acceder a los datos que el usuario ya habia cargado
  getConvocatoriaActiva(): ConvocatoriaPendiente | null {
    return this.convocatoriaActiva;
  }

  // Guardamos la lista de checks para la siguiente pantalla
  guardarAsistencia(profesores: ProfesorAsistente[]): void {
    if (this.convocatoriaActiva) {
      this.convocatoriaActiva.profesores = profesores;
    }
  }

  limpiarEstado(): void {
    this.convocatoriaActiva = null;
  }

  // Llama al controlador para registrar definitivamente los acuerdos
  guardarActaDefinitiva(informacion: any[], ruegos: string[]): Observable<any> {
    if (!this.convocatoriaActiva) {
      throw new Error('No hay convocatoria activa en memoria');
    }

    const asistentes = this.convocatoriaActiva.profesores
      .filter(p => p.asiste)
      .map(p => p.idProfesor);

    const payload = {
      idConvocatoria: this.convocatoriaActiva.idConvocatoria,
      asistentes: asistentes,
      informacion: informacion,
      ruegos: ruegos
    };

    return this.http.post(`${this.apiService.baseUrl}?c=Actas&m=guardar`, payload)
      .pipe(
        tap(() => this.limpiarEstado())
      );
  }
}
