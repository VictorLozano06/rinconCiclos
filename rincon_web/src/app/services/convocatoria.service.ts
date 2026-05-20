import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ProfesorOption {
  idProfesor: number;
  nombre: string;
}

export interface LugarOption {
  idLugar: number;
  nombre: string;
}

export interface CursoOption {
  idCurso: number;
  anioInicio: string;
  anioFin: string;
}

export interface ConvocatoriaFormularioResponse {
  cursos: CursoOption[];
  lugares: LugarOption[];
  profesores: ProfesorOption[];
  cursoActualId: number | null;
}

export interface OrdenDiaPayload {
  minutos: number | null;
  ordenDia: string;
  objetivo: string;
  dinamizaId: number | null;
  lugarId: number | null;
  participaIds: number[];
}

export interface GuardarConvocatoriaPayload {
  idConvocatoria?: number;
  fechaHora: string;
  lugarId: number | null;
  redactaId: number | null;
  iniciaId: number | null;
  cursoId: number | null;
  ordenDia: OrdenDiaPayload[];
}

@Injectable({
  providedIn: 'root'
})
export class ConvocatoriaService {
  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  getFormulario(): Observable<ConvocatoriaFormularioResponse> {
    return this.http.get<ConvocatoriaFormularioResponse>(`${this.apiService.baseUrl}?c=Convocatorias&m=formulario`);
  }

  guardar(payload: GuardarConvocatoriaPayload): Observable<{ idConvocatoria: number; message: string }> {
    return this.http.post<{ idConvocatoria: number; message: string }>(
      `${this.apiService.baseUrl}?c=Convocatorias&m=guardar`,
      payload
    );
  }

  listarConvocatorias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiService.baseUrl}?c=Convocatorias&m=listar`);
  }

  getConvocatoria(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiService.baseUrl}?c=Convocatorias&m=detalle&id=${id}`);
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiService.baseUrl}?c=Convocatorias&m=eliminar&id=${id}`);
  }
}
