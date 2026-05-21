import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConvocatoriaDetalleDto } from '../dto/convocatoria-detalle.dto';
import { ConvocatoriaFormularioResponseDto } from '../dto/convocatoria-formulario-response.dto';
import { ConvocatoriaListaItemDto } from '../dto/convocatoria-lista-item.dto';
import { ApiService } from './api.service';
import { GuardarConvocatoriaPayloadDto } from '../dto/guardar-convocatoria-payload.dto';

@Injectable({
  providedIn: 'root'
})
export class ConvocatoriaService {
  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  getFormulario(): Observable<ConvocatoriaFormularioResponseDto> {
    return this.http.get<ConvocatoriaFormularioResponseDto>(`${this.apiService.baseUrl}?c=Convocatorias&m=formulario`);
  }

  guardar(payload: GuardarConvocatoriaPayloadDto): Observable<{ idConvocatoria: number; message: string }> {
    return this.http.post<{ idConvocatoria: number; message: string }>(
      `${this.apiService.baseUrl}?c=Convocatorias&m=guardar`,
      payload
    );
  }

  listarConvocatorias(): Observable<ConvocatoriaListaItemDto[]> {
    return this.http.get<ConvocatoriaListaItemDto[]>(`${this.apiService.baseUrl}?c=Convocatorias&m=listar`);
  }

  listarConvocatoriasCanceladas(): Observable<ConvocatoriaListaItemDto[]> {
    return this.http.get<ConvocatoriaListaItemDto[]>(`${this.apiService.baseUrl}?c=Convocatorias&m=listarCanceladas`);
  }

  getConvocatoria(id: number): Observable<ConvocatoriaDetalleDto> {
    return this.http.get<ConvocatoriaDetalleDto>(`${this.apiService.baseUrl}?c=Convocatorias&m=detalle&id=${id}`);
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiService.baseUrl}?c=Convocatorias&m=eliminar&id=${id}`);
  }
}
