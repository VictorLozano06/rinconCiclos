import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

interface RespuestaApi {
  message: string;
}

export interface LugarDto {
  idLugar: number;
  nombre: string;
}

interface LugarGuardarPayload {
  idLugar: number | null;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class LugarService {
  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  getLugares(): Observable<LugarDto[]> {
    return this.http.get<LugarDto[]>(`${this.apiService.baseUrl}?c=Lugares&m=listar`);
  }

  guardarLugar(datos: LugarGuardarPayload): Observable<RespuestaApi> {
    return this.http.post<RespuestaApi>(`${this.apiService.baseUrl}?c=Lugares&m=guardar`, datos);
  }

  eliminarLugar(idLugar: number): Observable<RespuestaApi> {
    return this.http.post<RespuestaApi>(`${this.apiService.baseUrl}?c=Lugares&m=eliminar`, { idLugar });
  }
}
