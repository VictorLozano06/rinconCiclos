export interface CicloDto {
  idCiclo: number;
  nombre: string;
  familia: string;
  cursos?: CicloDto[];
  abierto?: boolean;
}
