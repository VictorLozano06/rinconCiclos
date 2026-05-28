import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CategoriaDto } from '../dto/categoria.dto';
import { ApiService } from './api.service';
import { MockBackendService } from './mock-backend.service';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  constructor(
    private http: HttpClient,
    private apiService: ApiService,
    private mockBackend: MockBackendService
  ) {}

  // Devuelve los datos estáticos para la demo (Mock)
  getCategorias(): Observable<CategoriaDto[]> {
    return this.http
      .get<CategoriaDto[]>(`${this.apiService.baseUrl}?c=Categorias&m=listar`)
      .pipe(catchError(() => this.mockBackend.getCategorias()));
  }
}
