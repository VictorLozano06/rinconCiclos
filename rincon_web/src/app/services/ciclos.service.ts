import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CicloDto } from '../dto/ciclo.dto';
import { MockBackendService } from './mock-backend.service';

@Injectable({
  providedIn: 'root'
})
export class CiclosService {
  constructor(private mockBackend: MockBackendService) {}

  getCiclos(): Observable<CicloDto[]> {
    return this.mockBackend.getCiclos();
  }

  crearCiclo(nombre: string, familia: string): Observable<any> {
    return this.mockBackend.crearCiclo(nombre, familia);
  }

  editarCiclo(idCiclo: number, nombre: string, familia: string): Observable<any> {
    return this.mockBackend.editarCiclo(idCiclo, nombre, familia);
  }

  eliminarCiclo(id: number): Observable<any> {
    return this.mockBackend.eliminarCiclo(id);
  }
}
