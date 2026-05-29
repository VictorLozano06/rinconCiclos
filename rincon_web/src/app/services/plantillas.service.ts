import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface BloquePlantillaDatos {
  objetivo: string;
  descripcion: string;
  minutos: number | null;
  idLugar: number | null;
  idProfesorDinamiza: number | null;
  participantes: number[];
}

export interface Plantilla {
  id: number;
  nombre: string;
  descripcion: string;
  bloques: BloquePlantillaDatos[];
  fechaCreacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlantillasService {
  constructor(private http: HttpClient, private apiService: ApiService) {}

  getPlantillas(): Observable<Plantilla[]> {
    return this.http.get<Plantilla[]>(`${this.apiService.baseUrl}?c=Plantillas&m=listar`);
  }

  crearPlantilla(nombre: string, descripcion: string, bloques: BloquePlantillaDatos[]): Observable<Plantilla> {
    return this.http.post<Plantilla>(`${this.apiService.baseUrl}?c=Plantillas&m=crear`, { nombre, descripcion, bloques });
  }

  editarPlantilla(id: number, nombre: string, descripcion: string, bloques: BloquePlantillaDatos[]): Observable<any> {
    return this.http.put<any>(`${this.apiService.baseUrl}?c=Plantillas&m=editar`, { id, nombre, descripcion, bloques });
  }

  eliminarPlantilla(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiService.baseUrl}?c=Plantillas&m=eliminar&id=${id}`);
  }
}
