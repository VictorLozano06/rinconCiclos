import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { RecursoDto } from '../dto/recurso.dto';

export interface RecursoFormularioResponse {
  cursoActualId: number | null;
  cursos: {
    idCurso: number;
    anioInicio: string;
    anioFin: string;
  }[];
  ciclos: {
    idCiclo: number;
    nombre: string;
  }[];
}

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
    return this.http.get<RecursoDto[]>(this.construirUrlSinCache(`${this.apiService.baseUrl}?c=Recursos&m=listarRecientesProfesor&limite=${limite}`));
  }

  // Lista todos los recursos para coordinacion.
  getTodos(): Observable<RecursoDto[]> {
    return this.http.get<RecursoDto[]>(this.construirUrlSinCache(`${this.apiService.baseUrl}?c=Recursos&m=listarTodos`));
  }

  // Devuelve los cursos y ciclos necesarios para el formulario.
  getFormulario(): Observable<RecursoFormularioResponse> {
    return this.http.get<RecursoFormularioResponse>(this.construirUrlSinCache(`${this.apiService.baseUrl}?c=Recursos&m=obtenerFormulario`));
  }

  // Filtra los recursos por categoria.
  getPorCategoria(idCategoria: number): Observable<RecursoDto[]> {
    return this.http.get<RecursoDto[]>(this.construirUrlSinCache(`${this.apiService.baseUrl}?c=Recursos&m=listarPorCategoria&idCategoria=${idCategoria}`));
  }

  // Devuelve la ficha detallada de un recurso concreto.
  getDetalle(idCategoria: number, numRecurso: number): Observable<RecursoDto> {
    return this.http.get<RecursoDto>(
      this.construirUrlSinCache(`${this.apiService.baseUrl}?c=Recursos&m=detalle&idCategoria=${idCategoria}&numRecurso=${numRecurso}`)
    );
  }

  // Guarda un recurso nuevo o actualiza uno existente.
  guardar(payload: unknown): Observable<unknown> {
    return this.http.post(`${this.apiService.baseUrl}?c=Recursos&m=guardar`, payload);
  }

  // Elimina un recurso completo.
  eliminar(idCategoria: number, numRecurso: number): Observable<unknown> {
    return this.http.post(`${this.apiService.baseUrl}?c=Recursos&m=eliminar`, {
      idCategoria,
      numRecurso
    });
  }

  // Borra del servidor un archivo que estaba en la carpeta temporal
  // y que el usuario ha quitado antes de guardar el recurso final.
  eliminarArchivoTemporalSubido(identificadorTemporal: string): Observable<unknown> {
    return this.http.request('delete', `${this.apiService.baseUrl}?c=Recursos&m=eliminarArchivoTemporal`, {
      body: identificadorTemporal
    });
  }

  private construirUrlSinCache(url: string): string {
    return `${url}&_=${Date.now()}`;
  }
}
