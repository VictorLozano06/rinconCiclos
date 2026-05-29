import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
export interface Grupo {
  id: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class GruposService {
  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  private get apiUrl(): string {
    return this.apiService.baseUrl + '?c=Grupos';
  }

  getGrupos(): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(`${this.apiUrl}&m=listar`);
  }

  crearGrupo(nombre: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}&m=crear`, { nombre });
  }

  editarGrupo(id: number, nombre: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}&m=editar`, { id, nombre });
  }

  eliminarGrupo(id: number): Observable<any> {
    return this.http.request<any>('delete', `${this.apiUrl}&m=eliminar`, { body: { id } });
  }
}
