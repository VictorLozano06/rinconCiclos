import { ParticipanteDto } from './participante.dto';

export interface OrdenDiaCoordinadorDto {
  minutos: number | null;
  ordenDia: string;
  objetivo: string;
  dinamizaId: number | null;
  lugarId: number | null;
  participantes: ParticipanteDto[];
  participaQuery: string;
  participaOpen: boolean;
}
