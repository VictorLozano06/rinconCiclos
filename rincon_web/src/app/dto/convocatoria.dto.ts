/**
 * DTOs (Data Transfer Objects) para Convocatorias
 *
 * Las interfaces se definen aquí en lugar de en los componentes
 * para evitar duplicación cuando múltiples componentes las utilizan.
 * Importa estas interfaces en tus componentes:
 *
 * import {
 *   ConvocatoriaDetalle,
 *   ConvocatoriaListaItem,
 *   OrdenDiaItemProfesor,
 *   OrdenDiaItemCoordinador,
 *   Participante
 * } from '../../../dto/convocatoria.dto';
 */

/** Participante en una orden del día */
export interface Participante {
  idProfesor: number;
  nombre: string;
}

/** Orden del día - vista de profesor (detalles completos) */
export interface OrdenDiaItemProfesor {
  numOrden: number;
  minutos: number | null;
  descripcion: string;
  objetivo: string;
  idLugar: number;
  idProfesorDinamiza: number;
  lugar: string;
  dinamiza: string;
  participantes: Participante[];
}

/** Orden del día - vista de coordinador (formulario) */
export interface OrdenDiaItemCoordinador {
  minutos: number | null;
  ordenDia: string;
  objetivo: string;
  dinamizaId: number | null;
  lugarId: number | null;
  participaIds: number[];
  participaQuery: string;
  participaOpen: boolean;
}

/** Detalles completos de una convocatoria (profesor) */
export interface ConvocatoriaDetalle {
  idConvocatoria: number;
  fecha: string;
  idLugar: number;
  idCurso: number;
  idProfesorRedactaActa: number;
  idProfesorIniciaReunion: number;
  lugar: string;
  anioInicio: string;
  anioFin: string;
  redacta: string;
  inicia: string;
  ordenDia: OrdenDiaItemProfesor[];
}

/** Item en listado de convocatorias */
export interface ConvocatoriaListaItem {
  idConvocatoria: number;
  fecha: string;
  lugar: string;
  anioInicio: string;
  anioFin: string;
  redacta: string;
  inicia: string;
}

/** Tipos de campos de profesor en coordinador */
export type ProfesorField = 'redacta' | 'inicia';
