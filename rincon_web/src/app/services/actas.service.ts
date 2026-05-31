import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Informacion {
  numInformacion: number;
  titulo_OrdenDia: string;
  informacion: string;
}

export interface ActaHistorial {
  idActa: number;
  fecha: string;
  idConvocatoria: number;
  fechaConvocatoria: string;
  horaConvocatoria: string;
  horaFin: string;
  lugar: string;
  anioInicio: number;
  anioFin: number;
  grupoNombre: string;
  asistentes: number;
  totalConvocados: number;
  informacion: Informacion[];
  ruegosPregunta: string[];
  listaAsistentes: string[];
  listaAusentes: string[];
  nombreRedacta: string;
  nombreConvoca: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActasService {
  constructor(private http: HttpClient, private apiService: ApiService) {}

  getAniosDisponibles(): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiService.baseUrl}?c=Actas&m=anios`);
  }

  getHistorialPorAnio(anio: number): Observable<ActaHistorial[]> {
    return this.http.get<ActaHistorial[]>(`${this.apiService.baseUrl}?c=Actas&m=historial&anio=${anio}`);
  }

  getHistorialPorProfesor(idProfesor: number): Observable<ActaHistorial[]> {
    return this.http.get<ActaHistorial[]>(`${this.apiService.baseUrl}?c=Actas&m=historialProfesor&idProfesor=${idProfesor}`);
  }
}
