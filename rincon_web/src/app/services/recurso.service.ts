import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { RecursoDto } from '../dto/recurso.dto';

@Injectable({
  providedIn: 'root'
})
export class RecursoService {
  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  // Obtiene los recursos recientes de profesor.
  getRecientesProfesor(limite = 5): Observable<RecursoDto[]> {
    return this.http.get<RecursoDto[]>(`${this.apiService.baseUrl}?c=Recursos&m=listarRecientesProfesor&limite=${limite}`);
  }

  // Lista todos los recursos para coordinacion.
  getTodos(): Observable<RecursoDto[]> {
    return this.http.get<RecursoDto[]>(`${this.apiService.baseUrl}?c=Recursos&m=listarTodos`);
  }

  // Filtra los recursos por categoria.
  getPorCategoria(idCategoria: number): Observable<RecursoDto[]> {
    return this.http.get<RecursoDto[]>(`${this.apiService.baseUrl}?c=Recursos&m=listarPorCategoria&idCategoria=${idCategoria}`);
  }

  // Devuelve la ficha detallada de un recurso concreto.
  getDetalle(idCategoria: number, numRecurso: number): Observable<RecursoDto> {
    return this.http.get<RecursoDto>(
      `${this.apiService.baseUrl}?c=Recursos&m=detalle&idCategoria=${idCategoria}&numRecurso=${numRecurso}`
    );
  }
}
