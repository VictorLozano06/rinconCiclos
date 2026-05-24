import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { ConvocatoriaDetalleDto } from '../dto/convocatoria-detalle.dto';
import { ConvocatoriaFormularioResponseDto } from '../dto/convocatoria-formulario-response.dto';
import { ConvocatoriaListaItemDto } from '../dto/convocatoria-lista-item.dto';
import { GuardarConvocatoriaPayloadDto } from '../dto/guardar-convocatoria-payload.dto';
import { GrupoOptionDto } from '../dto/grupo-option.dto';
import { LugarOptionDto } from '../dto/lugar-option.dto';
import { ParticipanteDto } from '../dto/participante.dto';
import { ProfesorOptionDto } from '../dto/profesor-option.dto';
import { CursoOptionDto } from '../dto/curso-option.dto';

type EstadoConvocatoria = 'a' | 'p' | 'b';

interface ConvocatoriaMock extends ConvocatoriaDetalleDto {
  estado: EstadoConvocatoria;
}

@Injectable({
  providedIn: 'root'
})
export class ConvocatoriaService {
  private readonly cursos: CursoOptionDto[] = [
    { idCurso: 1, anioInicio: '2025', anioFin: '2026' },
    { idCurso: 2, anioInicio: '2024', anioFin: '2025' }
  ];

  private readonly lugares: LugarOptionDto[] = [
    { idLugar: 1, nombre: 'Sala de juntas' },
    { idLugar: 2, nombre: 'Biblioteca' },
    { idLugar: 3, nombre: 'Aula A-12' },
    { idLugar: 4, nombre: 'Departamento de Informática' }
  ];

  private readonly profesores: ProfesorOptionDto[] = [
    { idProfesor: 1, nombre: 'Victor Manuel Lozano Herrera' },
    { idProfesor: 2, nombre: 'Alejandro Rastrollo Santos' },
    { idProfesor: 3, nombre: 'Rafael Manzano' },
    { idProfesor: 4, nombre: 'Maria Garcia' },
    { idProfesor: 5, nombre: 'Juan Perez' },
    { idProfesor: 6, nombre: 'Laura Sanchez' }
  ];

  private readonly grupos: GrupoOptionDto[] = [
    { idGrupo: 101, nombre: '1DAW' },
    { idGrupo: 102, nombre: '2DAW' },
    { idGrupo: 103, nombre: '1ASIR' },
    { idGrupo: 104, nombre: '2ASIR' },
    { idGrupo: 105, nombre: '1SMR' }
  ];

  private readonly convocatorias: ConvocatoriaMock[] = [
    {
      idConvocatoria: 1,
      fecha: '2026-05-28T09:00:00',
      estado: 'a',
      idLugar: 1,
      idCurso: 1,
      idProfesorRedactaActa: 3,
      idProfesorIniciaReunion: 1,
      lugar: 'Sala de juntas',
      anioInicio: '2025',
      anioFin: '2026',
      redacta: 'Rafael Manzano',
      inicia: 'Victor Manuel Lozano Herrera',
      ordenDia: [
        {
          numOrden: 1,
          minutos: 10,
          descripcion: 'Bienvenida y repaso de acuerdos pendientes',
          objetivo: 'Revisar el estado de las tareas abiertas',
          idLugar: 1,
          idProfesorDinamiza: 1,
          lugar: 'Sala de juntas',
          dinamiza: 'Victor Manuel Lozano Herrera',
          participantes: [
            { idParticipante: 4, tipo: 'profesor', nombre: 'Maria Garcia' },
            { idParticipante: 101, tipo: 'grupo', nombre: '1DAW' }
          ]
        },
        {
          numOrden: 2,
          minutos: 15,
          descripcion: 'Seguimiento de tutoria y convivencia',
          objetivo: 'Compartir incidencias comunes del grupo',
          idLugar: 3,
          idProfesorDinamiza: 4,
          lugar: 'Aula A-12',
          dinamiza: 'Maria Garcia',
          participantes: [
            { idParticipante: 5, tipo: 'profesor', nombre: 'Juan Perez' },
            { idParticipante: 102, tipo: 'grupo', nombre: '2DAW' }
          ]
        },
        {
          numOrden: 3,
          minutos: 20,
          descripcion: 'Coordinacion de actividades comunes',
          objetivo: 'Alinear salidas, evaluaciones y recursos',
          idLugar: 2,
          idProfesorDinamiza: 2,
          lugar: 'Biblioteca',
          dinamiza: 'Alejandro Rastrollo Santos',
          participantes: [
            { idParticipante: 2, tipo: 'profesor', nombre: 'Alejandro Rastrollo Santos' },
            { idParticipante: 103, tipo: 'grupo', nombre: '1ASIR' }
          ]
        }
      ]
    },
    {
      idConvocatoria: 2,
      fecha: '2026-03-14T12:00:00',
      estado: 'p',
      idLugar: 4,
      idCurso: 1,
      idProfesorRedactaActa: 2,
      idProfesorIniciaReunion: 1,
      lugar: 'Departamento de Informática',
      anioInicio: '2025',
      anioFin: '2026',
      redacta: 'Alejandro Rastrollo Santos',
      inicia: 'Victor Manuel Lozano Herrera',
      ordenDia: [
        {
          numOrden: 1,
          minutos: 12,
          descripcion: 'Estado general del trimestre',
          objetivo: 'Poner en común resultados y necesidades',
          idLugar: 4,
          idProfesorDinamiza: 2,
          lugar: 'Departamento de Informática',
          dinamiza: 'Alejandro Rastrollo Santos',
          participantes: [
            { idParticipante: 4, tipo: 'profesor', nombre: 'Maria Garcia' },
            { idParticipante: 104, tipo: 'grupo', nombre: '2ASIR' }
          ]
        },
        {
          numOrden: 2,
          minutos: 18,
          descripcion: 'Planificacion de recursos compartidos',
          objetivo: 'Repartir espacios y materiales',
          idLugar: 1,
          idProfesorDinamiza: 3,
          lugar: 'Sala de juntas',
          dinamiza: 'Rafael Manzano',
          participantes: [
            { idParticipante: 3, tipo: 'profesor', nombre: 'Rafael Manzano' },
            { idParticipante: 105, tipo: 'grupo', nombre: '1SMR' }
          ]
        }
      ]
    },
    {
      idConvocatoria: 3,
      fecha: '2026-02-20T10:30:00',
      estado: 'b',
      idLugar: 2,
      idCurso: 2,
      idProfesorRedactaActa: 5,
      idProfesorIniciaReunion: 6,
      lugar: 'Biblioteca',
      anioInicio: '2024',
      anioFin: '2025',
      redacta: 'Juan Perez',
      inicia: 'Laura Sanchez',
      ordenDia: [
        {
          numOrden: 1,
          minutos: 8,
          descripcion: 'Revision de orden del dia',
          objetivo: 'Confirmar la organizacion de la reunion',
          idLugar: 2,
          idProfesorDinamiza: 5,
          lugar: 'Biblioteca',
          dinamiza: 'Juan Perez',
          participantes: [
            { idParticipante: 5, tipo: 'profesor', nombre: 'Juan Perez' },
            { idParticipante: 102, tipo: 'grupo', nombre: '2DAW' }
          ]
        }
      ]
    }
  ];

  getFormulario(): Observable<ConvocatoriaFormularioResponseDto> {
    return of(this.clone({
      cursos: this.cursos,
      lugares: this.lugares,
      profesores: this.profesores,
      grupos: this.grupos,
      cursoActualId: 1
    }));
  }

  guardar(_payload: GuardarConvocatoriaPayloadDto): Observable<{ idConvocatoria: number; message: string }> {
    return of({
      idConvocatoria: 0,
      message: 'No se guardan cambios.'
    });
  }

  cancelarConvocatoria(id: number): Observable<{ message: string }> {
    const convocatoria = this.convocatorias.find((item) => item.idConvocatoria === id);

    if (!convocatoria) {
      return throwError(() => ({
        error: { message: 'No se ha encontrado la convocatoria que quieres cancelar.' }
      }));
    }

    convocatoria.estado = 'p';

    return of({
      message: 'La convocatoria ha pasado al histórico.'
    });
  }

  listarConvocatorias(): Observable<ConvocatoriaListaItemDto[]> {
    return of(this.clone(
      this.ordenarConvocatorias(
        this.convocatorias.filter((convocatoria) => convocatoria.estado === 'a')
      ).map((convocatoria) => this.toListaItem(convocatoria))
    ));
  }

  listarConvocatoriasHistoricas(): Observable<ConvocatoriaListaItemDto[]> {
    return of(this.clone(
      this.ordenarConvocatorias(
        this.convocatorias.filter((convocatoria) => convocatoria.estado !== 'a')
      ).map((convocatoria) => this.toListaItem(convocatoria))
    ));
  }

  listarConvocatoriasCanceladas(): Observable<ConvocatoriaListaItemDto[]> {
    return this.listarConvocatoriasHistoricas();
  }

  getConvocatoria(id: number): Observable<ConvocatoriaDetalleDto> {
    const convocatoria = this.convocatorias.find((item) => item.idConvocatoria === id);

    if (!convocatoria) {
      return throwError(() => ({
        error: { message: 'No se ha encontrado la convocatoria solicitada.' }
      }));
    }

    return of(this.clone(convocatoria));
  }

  eliminar(_id: number): Observable<{ message: string }> {
    return of({
      message: 'No se borran convocatorias.'
    });
  }

  private toListaItem(convocatoria: ConvocatoriaMock): ConvocatoriaListaItemDto {
    return {
      idConvocatoria: convocatoria.idConvocatoria,
      fecha: convocatoria.fecha,
      estado: convocatoria.estado,
      lugar: convocatoria.lugar,
      anioInicio: convocatoria.anioInicio,
      anioFin: convocatoria.anioFin,
      redacta: convocatoria.redacta,
      inicia: convocatoria.inicia
    };
  }

  private ordenarConvocatorias<T extends { estado: EstadoConvocatoria; fecha: string }>(items: T[]): T[] {
    const prioridad: Record<EstadoConvocatoria, number> = {
      a: 0,
      b: 1,
      p: 2
    };

    return [...items].sort((a, b) => {
      const prioridadDiff = prioridad[a.estado] - prioridad[b.estado];
      if (prioridadDiff !== 0) {
        return prioridadDiff;
      }

      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}
