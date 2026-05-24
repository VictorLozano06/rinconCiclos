import { OrdenDiaProfesorDto } from './orden-dia-profesor.dto';

export interface ConvocatoriaDetalleDto {
  idConvocatoria: number;
  fecha: string;
  estado?: 'a' | 'p' | 'b';
  idLugar: number;
  idCurso: number;
  idProfesorRedactaActa: number;
  idProfesorIniciaReunion: number;
  lugar: string;
  anioInicio: string;
  anioFin: string;
  redacta: string;
  inicia: string;
  ordenDia: OrdenDiaProfesorDto[];
}
