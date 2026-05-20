import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { RecursoDto, RecursoDetalleDto } from '../dto/recurso.dto';

@Injectable({
  providedIn: 'root'
})
export class RecursoService {
  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  getRecientesProfesor(limite = 5): Observable<RecursoDto[]> {
    return this.http.get<RecursoDto[]>(`${this.apiService.baseUrl}?c=Recursos&m=listarRecientesProfesor&limite=${limite}`);
  }

  getPorCategoria(idCategoria: number): Observable<RecursoDto[]> {
    return this.http.get<RecursoDto[]>(`${this.apiService.baseUrl}?c=Recursos&m=listarPorCategoria&idCategoria=${idCategoria}`);
  }

  getDetalle(idCategoria: number, numRecurso: number): Observable<RecursoDetalleDto> {
    return this.http.get<RecursoDetalleDto>(
      `${this.apiService.baseUrl}?c=Recursos&m=detalle&idCategoria=${idCategoria}&numRecurso=${numRecurso}`
    );
  }
}
