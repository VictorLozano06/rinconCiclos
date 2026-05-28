export interface ConvocatoriaListaItemDto {
  idConvocatoria: number;
  fecha: string;
  estado?: 'a' | 'p' | 'b';
  lugar: string;
  anioInicio: string;
  anioFin: string;
  redacta: string;
  inicia: string | null;
}
