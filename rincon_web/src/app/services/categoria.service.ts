import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { CategoriaDto } from '../dto/categoria.dto';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  constructor() {}

  // Devuelve los datos estáticos para la demo (Mock)
  getCategorias(): Observable<CategoriaDto[]> {
    const categoriasMock: CategoriaDto[] = [
      {
        idCategoria: 2,
        nombre: 'Reuniones de Equipo',
        predeterminada: true,
        idCategoriaPadre: 1,
        subcategorias: [
          { idCategoria: 10, nombre: 'Actas', predeterminada: false, idCategoriaPadre: 2 },
          { idCategoria: 11, nombre: 'Convocatorias', predeterminada: false, idCategoriaPadre: 2 }
        ]
      },
      {
        idCategoria: 3,
        nombre: 'Tutorias',
        predeterminada: true,
        idCategoriaPadre: 1,
        subcategorias: []
      },
      {
        idCategoria: 4,
        nombre: 'Evaluaciones',
        predeterminada: true,
        idCategoriaPadre: 1,
        subcategorias: []
      },
      {
        idCategoria: 5,
        nombre: 'Otros',
        predeterminada: true,
        idCategoriaPadre: 1,
        subcategorias: [
          { idCategoria: 15, nombre: 'BOCC', predeterminada: false, idCategoriaPadre: 5 },
          { idCategoria: 16, nombre: 'Calendario de reuniones', predeterminada: false, idCategoriaPadre: 5 }
        ]
      }
    ];
    return of(categoriasMock).pipe(delay(200));
  }
}
