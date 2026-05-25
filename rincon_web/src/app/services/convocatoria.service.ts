import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { ConvocatoriaDetalleDto } from '../dto/convocatoria-detalle.dto';
import { ConvocatoriaFormularioResponseDto } from '../dto/convocatoria-formulario-response.dto';
import { ConvocatoriaListaItemDto } from '../dto/convocatoria-lista-item.dto';
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
    return this.http.get<ConvocatoriaFormularioResponseDto>(
      `${this.apiService.baseUrl}?c=Convocatorias&m=formulario`
    );
  }

  guardar(payload: GuardarConvocatoriaPayloadDto): Observable<{ idConvocatoria: number; message: string }> {
    return this.http.post<{ idConvocatoria: number; message: string }>(
      `${this.apiService.baseUrl}?c=Convocatorias&m=guardar`,
      payload
    );
  }

  listarConvocatorias(): Observable<ConvocatoriaListaItemDto[]> {
    return this.http.get<ConvocatoriaListaItemDto[]>(
      `${this.apiService.baseUrl}?c=Convocatorias&m=listarActivas`
    );
  }

  listarConvocatoriasCoordinador(): Observable<ConvocatoriaListaItemDto[]> {
    return this.http.get<ConvocatoriaListaItemDto[]>(
      `${this.apiService.baseUrl}?c=Convocatorias&m=listarTodas`
    );
  }

  marcarComoPasada(idConvocatoria: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiService.baseUrl}?c=Convocatorias&m=marcarComoPasada`,
      { idConvocatoria }
    );
  }

  marcarTodasComoPasadas(): Observable<{ message: string; actualizadas: number }> {
    return this.http.post<{ message: string; actualizadas: number }>(
      `${this.apiService.baseUrl}?c=Convocatorias&m=marcarTodasComoPasadas`,
      {}
    );
  }

  listarConvocatoriasHistoricas(): Observable<ConvocatoriaListaItemDto[]> {
    return this.http.get<ConvocatoriaListaItemDto[]>(
      `${this.apiService.baseUrl}?c=Convocatorias&m=listarHistoricas`
    );
  }

  listarConvocatoriasCanceladas(): Observable<ConvocatoriaListaItemDto[]> {
    return this.http.get<ConvocatoriaListaItemDto[]>(
      `${this.apiService.baseUrl}?c=Convocatorias&m=listarPasadas`
    );
  }

  getConvocatoria(id: number): Observable<ConvocatoriaDetalleDto> {
    return this.http.get<ConvocatoriaDetalleDto>(
      `${this.apiService.baseUrl}?c=Convocatorias&m=detalle&id=${id}`
    );
  }

  eliminar(_id: number): Observable<{ message: string }> {
    return throwError(() => ({
      error: { message: 'La eliminacion de convocatorias no esta disponible en esta fase.' }
    }));
  }

  cancelarConvocatoria(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiService.baseUrl}?c=Convocatorias&m=cancelar`,
      { idConvocatoria: id }
    );
  }
}
