import { CicloRecursoDto } from './ciclo-recurso.dto';

export interface RecursoEnlaceDto {
  nombre: string;
  url: string;
}

export interface RecursoArchivoDto {
  nombre: string;
  archivo: string;
}

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
  enlacesDetalle?: RecursoEnlaceDto[];
  archivosDetalle?: RecursoArchivoDto[];
  // Un recurso puede estar asociado a varios ciclos.
  ciclos: CicloRecursoDto[];
  enlacePrincipal: string;
}
