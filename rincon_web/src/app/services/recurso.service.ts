import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { RecursoDto } from '../dto/recurso.dto';

/**
 * Respuesta auxiliar con los datos base del formulario de recursos.
 *
 * Se usa para poblar los selectores de curso y ciclos antes de que el
 * coordinador empiece a rellenar el formulario.
 */
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

/**
 * Servicio Angular para acceder a los endpoints HTTP de recursos.
 *
 * Centraliza todas las peticiones relacionadas con:
 * - listados
 * - detalle
 * - formulario
 * - guardado y borrado
 * - eliminación de archivos temporales
 *
 * Así los componentes no construyen URLs ni conocen detalles del backend.
 */
@Injectable({
  providedIn: 'root'
})
export class RecursoService {
  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  /**
   * Obtiene los recursos recientes para la portada del profesorado.
   *
   * @param limite Número máximo de recursos que se quieren mostrar.
   *
   * @returns Observable con el listado reducido de recursos recientes.
   */
  getRecientesProfesor(limite = 5): Observable<RecursoDto[]> {
    return this.http.get<RecursoDto[]>(
      this.construirUrlSinCache(`${this.apiService.baseUrl}?c=Recursos&m=listarRecientesProfesor&limite=${limite}`)
    );
  }

  /**
   * Lista todos los recursos visibles para la vista global del coordinador.
   *
   * @returns Observable con el listado completo de recursos.
   */
  getTodos(): Observable<RecursoDto[]> {
    return this.http.get<RecursoDto[]>(
      this.construirUrlSinCache(`${this.apiService.baseUrl}?c=Recursos&m=listarTodos`)
    );
  }

  /**
   * Recupera los combos base del formulario de recursos.
   *
   * @returns Observable con cursos, ciclos y el curso actual sugerido.
   */
  getFormulario(): Observable<RecursoFormularioResponse> {
    return this.http.get<RecursoFormularioResponse>(
      this.construirUrlSinCache(`${this.apiService.baseUrl}?c=Recursos&m=obtenerFormulario`)
    );
  }

  /**
   * Filtra recursos por una subcategoría concreta.
   *
   * @param idCategoria Identificador de la categoría seleccionada.
   *
   * @returns Observable con los recursos asociados a esa categoría.
   */
  getPorCategoria(idCategoria: number): Observable<RecursoDto[]> {
    return this.http.get<RecursoDto[]>(
      this.construirUrlSinCache(`${this.apiService.baseUrl}?c=Recursos&m=listarPorCategoria&idCategoria=${idCategoria}`)
    );
  }

  /**
   * Recupera el detalle completo de un recurso.
   *
   * @param idCategoria Categoría a la que pertenece el recurso.
   * @param numRecurso Número correlativo del recurso dentro de su categoría.
   *
   * @returns Observable con el DTO completo del recurso.
   */
  getDetalle(idCategoria: number, numRecurso: number): Observable<RecursoDto> {
    return this.http.get<RecursoDto>(
      this.construirUrlSinCache(`${this.apiService.baseUrl}?c=Recursos&m=detalle&idCategoria=${idCategoria}&numRecurso=${numRecurso}`)
    );
  }

  /**
   * Envía al backend un recurso nuevo o la edición de uno existente.
   *
   * @param payload Estructura del formulario lista para serializar a JSON.
   *
   * @returns Observable con la respuesta del backend.
   */
  guardar(payload: unknown): Observable<unknown> {
    return this.http.post(`${this.apiService.baseUrl}?c=Recursos&m=guardar`, payload);
  }

  /**
   * Elimina un recurso completo por su clave compuesta.
   *
   * @param idCategoria Categoría del recurso.
   * @param numRecurso Número del recurso dentro de la categoría.
   *
   * @returns Observable con el resultado del borrado.
   */
  eliminar(idCategoria: number, numRecurso: number): Observable<unknown> {
    return this.http.post(`${this.apiService.baseUrl}?c=Recursos&m=eliminar`, {
      idCategoria,
      numRecurso
    });
  }

  /**
   * Borra un archivo temporal subido con FilePond que ya no se va a usar.
   *
   * Este endpoint se usa cuando el usuario quita un archivo antes de guardar
   * definitivamente el recurso.
   *
   * @param identificadorTemporal Ruta corta del archivo dentro de `temp`.
   *
   * @returns Observable con la respuesta del backend.
   */
  eliminarArchivoTemporalSubido(identificadorTemporal: string): Observable<unknown> {
    return this.http.request('delete', `${this.apiService.baseUrl}?c=Recursos&m=eliminarArchivoTemporal`, {
      body: identificadorTemporal
    });
  }

  /**
   * Añade un parámetro de tiempo para evitar respuestas cacheadas del navegador.
   *
   * @param url URL base del endpoint.
   *
   * @returns URL final con un parámetro `_` único.
   */
  private construirUrlSinCache(url: string): string {
    return `${url}&_=${Date.now()}`;
  }
}
