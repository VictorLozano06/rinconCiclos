import { OrdenDiaPayloadDto } from './orden-dia-payload.dto';

export interface GuardarConvocatoriaPayloadDto {
  idConvocatoria?: number;
  estado?: 'a' | 'p' | 'b';
  fechaHora: string;
  lugarId: number | null;
  redactaId: number | null;
  iniciaId: number | null;
  cursoId: number | null;
  ordenDia: OrdenDiaPayloadDto[];
}
