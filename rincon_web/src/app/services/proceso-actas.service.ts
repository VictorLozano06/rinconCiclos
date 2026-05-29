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
  private actaEnEdicion: any = null; // Guardará los datos del ActaHistorial a editar
  
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

  // Permite cargar un acta ya creada para poder editar su redacción
  cargarActaParaEdicion(actaHistorial: any): void {
    this.actaEnEdicion = actaHistorial;

    // Convertir DD/MM/YYYY a YYYY-MM-DD HH:mm:ss para evitar Invalid Date en JS
    const partesFecha = actaHistorial.fechaConvocatoria.split('/');
    const fechaFormat = partesFecha.length === 3 
      ? `${partesFecha[2]}-${partesFecha[1]}-${partesFecha[0]} ${actaHistorial.horaConvocatoria}:00`
      : actaHistorial.fechaConvocatoria;

    // Reconstruir la lista de profesores para que no se vea vacío el control de asistencia
    const asistentes = (actaHistorial.listaAsistentes || []).map((nombre: string, i: number) => ({
      idProfesor: i + 1,
      nombre: nombre,
      asiste: true
    }));

    const ausentes = (actaHistorial.listaAusentes || []).map((nombre: string, i: number) => ({
      idProfesor: asistentes.length + i + 1,
      nombre: nombre,
      asiste: false
    }));

    this.convocatoriaActiva = {
      idConvocatoria: actaHistorial.idConvocatoria,
      fechaOriginal: fechaFormat,
      fecha: fechaFormat.replace(' ', 'T'),
      lugar: actaHistorial.lugar,
      anioInicio: actaHistorial.anioInicio,
      anioFin: actaHistorial.anioFin,
      idProfesorRedactaActa: 0,
      idProfesorIniciaReunion: 0,
      ordenDia: actaHistorial.informacion.map((info: any) => ({
        numOrden: info.numInformacion,
        objetivo: info.titulo_OrdenDia,
        descripcion: null,
        minutos: null
      })),
      profesores: [...asistentes, ...ausentes] // Recreamos los profesores para la UI
    };
  }

  getActaEnEdicion(): any | null {
    return this.actaEnEdicion;
  }

  // Guardamos la lista de checks para la siguiente pantalla
  guardarAsistencia(profesores: ProfesorAsistente[]): void {
    if (this.convocatoriaActiva) {
      this.convocatoriaActiva.profesores = profesores;
    }
  }

  limpiarEstado(): void {
    this.convocatoriaActiva = null;
    this.actaEnEdicion = null;
  }

  // Llama al controlador para registrar definitivamente los acuerdos
  guardarActaDefinitiva(informacion: any[], ruegos: string[]): Observable<any> {
    if (!this.convocatoriaActiva) {
      throw new Error('No hay convocatoria activa en memoria');
    }

    const payload: any = {
      idConvocatoria: this.convocatoriaActiva.idConvocatoria,
      informacion: informacion,
      ruegos: ruegos
    };

    if (this.actaEnEdicion) {
      payload.idActa = this.actaEnEdicion.idActa;
    } else {
      payload.asistentes = this.convocatoriaActiva.profesores
        .filter(p => p.asiste)
        .map(p => p.idProfesor);
    }

    return this.http.post(`${this.apiService.baseUrl}?c=Actas&m=guardar`, payload)
      .pipe(
        tap(() => this.limpiarEstado())
      );
  }

  // Habilita una convocatoria pendiente para convertirla en acta
  habilitarPlantilla(idConvocatoria: number): Observable<any> {
    return this.http.post(`${this.apiService.baseUrl}?c=Actas&m=habilitarPlantilla`, { idConvocatoria });
  }
}
