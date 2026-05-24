import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CicloDto } from '../dto/ciclo.dto';

@Injectable({
  providedIn: 'root'
})
export class CiclosService {
  constructor(private http: HttpClient, private apiService: ApiService) {}

  getCiclos(): Observable<CicloDto[]> {
    return this.http.get<CicloDto[]>(`${this.apiService.baseUrl}?c=Ciclos&m=listar`);
  }

  crearCiclo(nombre: string, familia: string): Observable<any> {
    return this.http.post<any>(`${this.apiService.baseUrl}?c=Ciclos&m=crear`, { nombre, familia });
  }

  editarCiclo(idCiclo: number, nombre: string, familia: string): Observable<any> {
    return this.http.put<any>(`${this.apiService.baseUrl}?c=Ciclos&m=editar`, { idCiclo, nombre, familia });
  }

  eliminarCiclo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiService.baseUrl}?c=Ciclos&m=eliminar&id=${id}`);
  }
}
