import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { CicloDto } from '../dto/ciclo.dto';

@Injectable({
  providedIn: 'root'
})
export class CiclosService {
  // Mock data in memory
  private ciclosMock: any[] = [
    {
      idCiclo: 1,
      siglas: 'DAW',
      familia: 'Desarrollo de Aplicaciones Web',
      cursos: [
        { idCiclo: 1, nombre: '1DAW', familia: 'Desarrollo de Aplicaciones Web' },
        { idCiclo: 2, nombre: '2DAW', familia: 'Desarrollo de Aplicaciones Web' }
      ]
    },
    {
      idCiclo: 3,
      siglas: 'SMR',
      familia: 'Sistemas Microinformáticos y Redes',
      cursos: [
        { idCiclo: 3, nombre: '1SMR', familia: 'Sistemas Microinformáticos y Redes' },
        { idCiclo: 4, nombre: '2SMR', familia: 'Sistemas Microinformáticos y Redes' }
      ]
    }
  ];

  constructor() { }

  getCiclos(): Observable<CicloDto[]> {
    return of(JSON.parse(JSON.stringify(this.ciclosMock))).pipe(delay(300));
  }

  crearCiclo(nombre: string, familia: string): Observable<any> {
    const nuevoId = this.ciclosMock.length > 0 ? Math.max(...this.ciclosMock.map(c => c.idCiclo)) + 2 : 1;
    this.ciclosMock.push({
      idCiclo: nuevoId,
      siglas: nombre,
      familia,
      cursos: [
        { idCiclo: nuevoId, nombre: '1' + nombre, familia: familia },
        { idCiclo: nuevoId + 1, nombre: '2' + nombre, familia: familia }
      ]
    });
    return of({ exito: true, mensaje: 'Creado' }).pipe(delay(300));
  }

  editarCiclo(idCiclo: number, nombre: string, familia: string): Observable<any> {
    const ciclo = this.ciclosMock.find(c => c.idCiclo === idCiclo);
    if (ciclo) {
      ciclo.siglas = nombre;
      ciclo.familia = familia;
      ciclo.cursos.forEach((curso: any) => {
        curso.familia = familia;
      });
    }
    return of({ exito: true, mensaje: 'Editado' }).pipe(delay(300));
  }

  eliminarCiclo(id: number): Observable<any> {
    this.ciclosMock = this.ciclosMock.filter(c => c.idCiclo !== id);
    return of({ exito: true, mensaje: 'Eliminado' }).pipe(delay(300));
  }

  editarCurso(idCiclo: number, nombre: string): Observable<any> {
    // Si no existe el idCiclo como curso, asumimos que es una creación / edición
    return of({ exito: true, mensaje: 'Curso modificado' }).pipe(delay(300));
  }

  eliminarCurso(id: number): Observable<any> {
    return of({ exito: true, mensaje: 'Curso eliminado' }).pipe(delay(300));
  }
}
