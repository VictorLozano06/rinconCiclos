export interface OrdenDiaCoordinadorDto {
  minutos: number | null;
  ordenDia: string;
  objetivo: string;
  dinamizaId: number | null;
  lugarId: number | null;
  participaIds: number[];
  participaQuery: string;
  participaOpen: boolean;
}
