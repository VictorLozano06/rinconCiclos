import { CicloRecursoDto } from './ciclo-recurso.dto';

export interface RecursoDto {
  idCategoria: number;
  numRecurso: number;
  nombre: string;
  descripcion: string;
  fechaPublicacion: string;
  idCurso: number;
  anioInicio: number;
  anioFin: number;
  categoriaNombre: string;
  urls: string[];
  archivos: string[];
  // Un recurso puede estar asociado a varios ciclos.
  ciclos: CicloRecursoDto[];
  enlacePrincipal: string;
}
