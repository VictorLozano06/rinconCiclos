import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategoriaDto } from '../dto/categoria.dto';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  // Carga el arbol de categorias que usan los sidebars y rutas dinamicas.
  getCategorias(): Observable<CategoriaDto[]> {
    return this.http.get<CategoriaDto[]>(`${this.apiService.baseUrl}?c=Categorias&m=listar`);
  }
}
