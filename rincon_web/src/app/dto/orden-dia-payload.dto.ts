export interface OrdenDiaPayloadDto {
  minutos: number | null;
  ordenDia: string;
  objetivo: string;
  dinamizaId: number | null;
  lugarId: number | null;
  participaIds: number[];
}
