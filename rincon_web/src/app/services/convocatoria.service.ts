import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { ConvocatoriaDetalleDto } from '../dto/convocatoria-detalle.dto';
import { ConvocatoriaFormularioResponseDto } from '../dto/convocatoria-formulario-response.dto';
import { ConvocatoriaListaItemDto } from '../dto/convocatoria-lista-item.dto';
import { GuardarConvocatoriaPayloadDto } from '../dto/guardar-convocatoria-payload.dto';
import { MockBackendService } from './mock-backend.service';

@Injectable({
  providedIn: 'root'
})
export class ConvocatoriaService {
  constructor(private mockBackend: MockBackendService) {}

  getFormulario(): Observable<ConvocatoriaFormularioResponseDto> {
    return this.mockBackend.getConvocatoriaFormulario();
  }

  guardar(payload: GuardarConvocatoriaPayloadDto): Observable<{ idConvocatoria: number; message: string }> {
    return this.mockBackend.guardarConvocatoria(payload);
  }

  listarConvocatorias(): Observable<ConvocatoriaListaItemDto[]> {
    return this.mockBackend.listarConvocatoriasActivas();
  }

  listarConvocatoriasProfesor(): Observable<ConvocatoriaListaItemDto[]> {
    return this.mockBackend.listarConvocatoriasProfesor();
  }

  listarConvocatoriasCoordinador(): Observable<ConvocatoriaListaItemDto[]> {
    return this.mockBackend.listarConvocatoriasCoordinador();
  }

  marcarComoPasada(idConvocatoria: number): Observable<{ message: string }> {
    return this.mockBackend.marcarConvocatoriaComoPasada(idConvocatoria);
  }

  marcarTodasComoPasadas(): Observable<{ message: string; actualizadas: number }> {
    return this.mockBackend.marcarTodasLasConvocatoriasActivasComoPasadas();
  }

  listarConvocatoriasHistoricas(): Observable<ConvocatoriaListaItemDto[]> {
    return this.mockBackend.listarConvocatoriasHistoricas();
  }

  listarConvocatoriasCanceladas(): Observable<ConvocatoriaListaItemDto[]> {
    return this.mockBackend.listarConvocatoriasCanceladas();
  }

  getConvocatoria(id: number): Observable<ConvocatoriaDetalleDto> {
    return this.mockBackend.getConvocatoria(id);
  }

  eliminar(_id: number): Observable<{ message: string }> {
    return throwError(() => ({
      error: { message: 'La eliminacion de convocatorias no esta disponible en esta fase.' }
    }));
  }

  cancelarConvocatoria(id: number): Observable<{ message: string }> {
    return this.mockBackend.cancelarConvocatoria(id);
  }
}
