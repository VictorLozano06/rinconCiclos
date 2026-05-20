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
  enlacePrincipal: string;
}

export interface RecursoDetalleDto extends RecursoDto {}
