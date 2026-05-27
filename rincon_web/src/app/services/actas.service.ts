import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Informacion {
  numInformacion: number;
  titulo_OrdenDia: string;
  informacion: string;
}

export interface ActaHistorial {
  idActa: number;
  fecha: string;
  idConvocatoria: number;
  fechaConvocatoria: string;
  horaConvocatoria: string;
  lugar: string;
  anioInicio: number;
  anioFin: number;
  asistentes: number;
  totalConvocados: number;
  informacion: Informacion[];
  ruegosPregunta: string[];
  listaAsistentes: string[];
  listaAusentes: string[];
  nombreRedacta: string;
  nombreConvoca: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActasService {
  constructor() {}

  getAniosDisponibles(): Observable<number[]> {
    return of([2024, 2025, 2026]).pipe(delay(300));
  }

  getHistorialPorAnio(anio: number): Observable<ActaHistorial[]> {
    return of([
      {
        idActa: 142, fecha: '18/05/2026', idConvocatoria: 42, fechaConvocatoria: '16/05/2026', horaConvocatoria: '18:00',
        lugar: 'Aula 2.04 - Informática', anioInicio: anio, anioFin: anio + 1, asistentes: 5, totalConvocados: 6,
        informacion: [
          { numInformacion: 1, titulo_OrdenDia: 'Análisis de resultados de la 2ª Evaluación', informacion: 'Se ha observado una mejora general en los resultados de programación, aunque persisten dificultades en el módulo de bases de datos.' },
          { numInformacion: 2, titulo_OrdenDia: 'Preparación de FCTs', informacion: 'Se han asignado las empresas a los alumnos de 2º DAW. Queda pendiente la firma de dos convenios.' }
        ],
        ruegosPregunta: ['Se solicita revisar el estado de los ordenadores del aula 2.04.', 'Recordatorio sobre las fechas límite para subir las notas al sistema.'], 
        listaAsistentes: ['Carlos García', 'Elena Martínez', 'Antonio López', 'María Sánchez', 'David Ruiz'], 
        listaAusentes: ['Laura Gómez'],
        nombreRedacta: 'María Sánchez', nombreConvoca: 'Carlos García'
      },
      {
        idActa: 145, fecha: '10/06/2026', idConvocatoria: 45, fechaConvocatoria: '08/06/2026', horaConvocatoria: '17:30',
        lugar: 'Sala de Profesores', anioInicio: anio, anioFin: anio + 1, asistentes: 4, totalConvocados: 4,
        informacion: [
          { numInformacion: 1, titulo_OrdenDia: 'Evaluación Final Ordinaria', informacion: 'Revisión y firma de las actas de evaluación final. El 80% del alumnado de 2º SMR titula en la convocatoria ordinaria.' }
        ],
        ruegosPregunta: [], 
        listaAsistentes: ['Pedro Ruiz', 'Laura Gómez', 'Carlos García', 'Elena Martínez'], 
        listaAusentes: [],
        nombreRedacta: 'Laura Gómez', nombreConvoca: 'Pedro Ruiz'
      }
    ]).pipe(delay(500));
  }

  getHistorialPorProfesor(idProfesor: number): Observable<ActaHistorial[]> {
    return of([
      {
        idActa: 150, fecha: '15/06/2026', idConvocatoria: 50, fechaConvocatoria: '12/06/2026', horaConvocatoria: '10:00',
        lugar: 'Despacho de Coordinación', anioInicio: 2025, anioFin: 2026, asistentes: 3, totalConvocados: 3,
        informacion: [
          { numInformacion: 1, titulo_OrdenDia: 'Cierre del curso y memorias', informacion: 'Se acuerda la fecha límite del 25 de junio para la entrega de las memorias finales de departamento.' }
        ],
        ruegosPregunta: ['Consulta sobre el presupuesto para compra de material fungible el próximo curso.'], 
        listaAsistentes: ['Carlos García', 'Antonio López', 'María Sánchez'], 
        listaAusentes: [],
        nombreRedacta: 'Antonio López', nombreConvoca: 'Carlos García'
      }
    ]).pipe(delay(500));
  }
}
