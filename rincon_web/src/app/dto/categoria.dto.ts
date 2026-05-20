export interface CategoriaDto {
  idCategoria: number;
  nombre: string;
  predeterminada: boolean;
  idCategoriaPadre: number;
  subcategorias?: CategoriaDto[];
  
  // Opcionales para el manejo visual en la interfaz de Angular
  icono?: string;
  ruta?: string;
  abierto?: boolean;
}
