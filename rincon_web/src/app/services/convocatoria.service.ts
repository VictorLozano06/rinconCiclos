import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ConvocatoriaFormularioResponseDto } from '../dto/convocatoria-formulario-response.dto';
import { GuardarConvocatoriaPayloadDto } from '../dto/guardar-convocatoria-payload.dto';

@Injectable({
  providedIn: 'root'
})
export class ConvocatoriaService {
  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  // Devuelve los datos necesarios para pintar el formulario de convocatorias.
  getFormulario(): Observable<ConvocatoriaFormularioResponseDto> {
    return this.http.get<ConvocatoriaFormularioResponseDto>(`${this.apiService.baseUrl}?c=Convocatorias&m=formulario`);
  }

  // Guarda o actualiza una convocatoria usando el backend en PHP.
  guardar(payload: GuardarConvocatoriaPayloadDto): Observable<{ idConvocatoria: number; message: string }> {
    return this.http.post<{ idConvocatoria: number; message: string }>(
      `${this.apiService.baseUrl}?c=Convocatorias&m=guardar`,
      payload
    );
  }

  // Lista las convocatorias resumidas.
  listarConvocatorias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiService.baseUrl}?c=Convocatorias&m=listar`);
  }

  // Recupera el detalle completo de una convocatoria.
  getConvocatoria(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiService.baseUrl}?c=Convocatorias&m=detalle&id=${id}`);
  }

  // Elimina una convocatoria.
  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiService.baseUrl}?c=Convocatorias&m=eliminar&id=${id}`);
  }
}
