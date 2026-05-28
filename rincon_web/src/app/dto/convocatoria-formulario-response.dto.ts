import { GrupoOptionDto } from './grupo-option.dto';
import { CursoOptionDto } from './curso-option.dto';
import { LugarOptionDto } from './lugar-option.dto';
import { ProfesorOptionDto } from './profesor-option.dto';

export interface ConvocatoriaFormularioResponseDto {
  cursos: CursoOptionDto[];
  lugares: LugarOptionDto[];
  profesores: ProfesorOptionDto[];
  grupos: GrupoOptionDto[];
  cursoActualId: number | null;
}
