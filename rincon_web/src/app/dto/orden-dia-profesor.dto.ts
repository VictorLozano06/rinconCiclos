import { ParticipanteDto } from './participante.dto';

export interface OrdenDiaProfesorDto {
  numOrden: number;
  minutos: number | null;
  descripcion: string;
  objetivo: string;
  idLugar: number;
  idProfesorDinamiza: number;
  lugar: string;
  dinamiza: string;
  participantes: ParticipanteDto[];
}
