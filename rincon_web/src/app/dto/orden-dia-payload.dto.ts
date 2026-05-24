import { ParticipanteDto } from './participante.dto';

export interface OrdenDiaPayloadDto {
  minutos: number | null;
  ordenDia: string;
  objetivo: string;
  dinamizaId: number | null;
  lugarId: number | null;
  participantes: ParticipanteDto[];
}
