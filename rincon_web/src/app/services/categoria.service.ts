import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CategoriaDto } from '../dto/categoria.dto';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) { }

  // Carga el arbol de categorias que usan los sidebars y rutas dinamicas.
  getCategorias(): Observable<CategoriaDto[]> {
    return this.http.get<CategoriaDto[]>(`${this.apiService.baseUrl}?c=Categorias&m=listar`).pipe(
      map(categorias => {
        // MOCKUP: Inyectamos 'Actas' dinámicamente si no viene de BD para poder ver el diseño
        const reuniones = categorias.find(c => c.nombre === 'Reuniones de Equipo');
        if (reuniones) {
          const tieneActas = reuniones.subcategorias?.some(s => s.nombre === 'Actas');
          if (!tieneActas) {
            if (!reuniones.subcategorias) reuniones.subcategorias = [];
            reuniones.subcategorias.push({
              idCategoria: 9999,
              nombre: 'Actas',
              predeterminada: false,
              idCategoriaPadre: reuniones.idCategoria,
              subcategorias: [] // Sin subcategorías
            });
          }
        }
        return categorias;
      })
    );
  }
}
