import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RecursoDto } from '../dto/recurso.dto';
import { MockBackendService } from './mock-backend.service';

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
  constructor(private mockBackend: MockBackendService) {}

  // Obtiene los recursos recientes de profesor.
  getRecientesProfesor(limite = 5): Observable<RecursoDto[]> {
    return this.mockBackend.getRecursosRecientesProfesor(limite);
  }

  // Lista todos los recursos para coordinacion.
  getTodos(): Observable<RecursoDto[]> {
    return this.mockBackend.getTodosLosRecursos();
  }

  // Devuelve los cursos y ciclos necesarios para el formulario.
  getFormulario(): Observable<RecursoFormularioResponse> {
    return this.mockBackend.getRecursoFormulario();
  }

  // Filtra los recursos por categoria.
  getPorCategoria(idCategoria: number): Observable<RecursoDto[]> {
    return this.mockBackend.getRecursosPorCategoria(idCategoria);
  }

  // Devuelve la ficha detallada de un recurso concreto.
  getDetalle(idCategoria: number, numRecurso: number): Observable<RecursoDto> {
    return this.mockBackend.getDetalleRecurso(idCategoria, numRecurso);
  }

  // Guarda un recurso nuevo o actualiza uno existente.
  guardar(payload: unknown): Observable<unknown> {
    return this.mockBackend.guardarRecurso(payload as any);
  }

  // Elimina un recurso completo.
  eliminar(idCategoria: number, numRecurso: number): Observable<unknown> {
    return this.mockBackend.eliminarRecurso(idCategoria, numRecurso);
  }

  // Borra del servidor un archivo que estaba en la carpeta temporal
  // y que el usuario ha quitado antes de guardar el recurso final.
  eliminarArchivoTemporalSubido(identificadorTemporal: string): Observable<unknown> {
    return this.mockBackend.eliminarArchivoTemporal(identificadorTemporal);
  }
}
