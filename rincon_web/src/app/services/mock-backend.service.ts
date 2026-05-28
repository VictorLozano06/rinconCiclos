import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { CategoriaDto } from '../dto/categoria.dto';
import { CicloDto } from '../dto/ciclo.dto';
import { ConvocatoriaDetalleDto } from '../dto/convocatoria-detalle.dto';
import { ConvocatoriaFormularioResponseDto } from '../dto/convocatoria-formulario-response.dto';
import { ConvocatoriaListaItemDto } from '../dto/convocatoria-lista-item.dto';
import { CursoOptionDto } from '../dto/curso-option.dto';
import { GuardarConvocatoriaPayloadDto } from '../dto/guardar-convocatoria-payload.dto';
import { GrupoOptionDto } from '../dto/grupo-option.dto';
import { LugarOptionDto } from '../dto/lugar-option.dto';
import { OrdenDiaProfesorDto } from '../dto/orden-dia-profesor.dto';
import { ParticipanteDto } from '../dto/participante.dto';
import { ProfesorOptionDto } from '../dto/profesor-option.dto';
import { RecursoDto } from '../dto/recurso.dto';
import type { RecursoFormularioResponse } from './recurso.service';

type RecursoGuardadoPayload = {
  idCategoria: number | null;
  numRecurso: number;
  nombre: string;
  descripcion: string;
  idCurso: number | null;
  ciclosSeleccionados: number[];
  enlaces: Array<{ nombre: string; valor: string }>;
  archivos: Array<{ nombre: string; valor: string; identificadorTemporal?: string | null }>;
};

type ConvocatoriaMock = Omit<ConvocatoriaDetalleDto, 'ordenDia'> & {
  ordenDia: OrdenDiaProfesorDto[];
};

@Injectable({
  providedIn: 'root'
})
export class MockBackendService {
  private readonly cursos: CursoOptionDto[] = [
    { idCurso: 1, anioInicio: '2024', anioFin: '2025' },
    { idCurso: 2, anioInicio: '2025', anioFin: '2026' },
    { idCurso: 3, anioInicio: '2026', anioFin: '2027' }
  ];

  private readonly profesores: ProfesorOptionDto[] = [
    { idProfesor: 1, nombre: 'Lucia Navarro' },
    { idProfesor: 2, nombre: 'Ruben Torres' },
    { idProfesor: 3, nombre: 'Marta Gil' },
    { idProfesor: 4, nombre: 'Diego Perez' }
  ];

  private readonly grupos: GrupoOptionDto[] = [
    { idGrupo: 1, nombre: '1DAW' },
    { idGrupo: 2, nombre: '2DAW' },
    { idGrupo: 3, nombre: '1DAM' },
    { idGrupo: 4, nombre: '2SMR' }
  ];

  private readonly lugares: LugarOptionDto[] = [
    { idLugar: 1, nombre: 'Aula A-12' },
    { idLugar: 2, nombre: 'Sala de reuniones' },
    { idLugar: 3, nombre: 'Biblioteca' },
    { idLugar: 4, nombre: 'Salon de actos' }
  ];

  private ciclosRecurso = [
    { idCiclo: 1, nombre: 'DAW' },
    { idCiclo: 2, nombre: 'DAM' },
    { idCiclo: 3, nombre: 'SMR' },
    { idCiclo: 4, nombre: 'ASIR' }
  ];

  private categorias: CategoriaDto[] = [
    {
      idCategoria: 2,
      nombre: 'Reuniones de Equipo',
      predeterminada: true,
      idCategoriaPadre: 1,
      subcategorias: [
        {
          idCategoria: 6,
          nombre: 'Convocatorias',
          predeterminada: false,
          idCategoriaPadre: 2,
          subcategorias: []
        },
        {
          idCategoria: 7,
          nombre: 'Actas',
          predeterminada: false,
          idCategoriaPadre: 2,
          subcategorias: []
        },
        { idCategoria: 8, nombre: 'BOCC', predeterminada: false, idCategoriaPadre: 2, subcategorias: [] },
        { idCategoria: 9, nombre: 'Calendario de reuniones', predeterminada: false, idCategoriaPadre: 2, subcategorias: [] }
      ]
    },
    {
      idCategoria: 3,
      nombre: 'Tutorias',
      predeterminada: true,
      idCategoriaPadre: 1,
      subcategorias: [
        { idCategoria: 10, nombre: '1 CCFF', predeterminada: false, idCategoriaPadre: 3, subcategorias: [] },
        { idCategoria: 11, nombre: '2 CCFF', predeterminada: false, idCategoriaPadre: 3, subcategorias: [] },
        { idCategoria: 12, nombre: 'PAT', predeterminada: false, idCategoriaPadre: 3, subcategorias: [] },
        { idCategoria: 13, nombre: 'Individualizadas', predeterminada: false, idCategoriaPadre: 3, subcategorias: [] }
      ]
    },
    {
      idCategoria: 4,
      nombre: 'Evaluaciones',
      predeterminada: true,
      idCategoriaPadre: 1,
      subcategorias: [
        { idCategoria: 14, nombre: 'Equipo Educativo', predeterminada: false, idCategoriaPadre: 4, subcategorias: [] },
        { idCategoria: 15, nombre: '1 Evaluacion', predeterminada: false, idCategoriaPadre: 4, subcategorias: [] },
        { idCategoria: 16, nombre: '2 Evaluacion', predeterminada: false, idCategoriaPadre: 4, subcategorias: [] },
        { idCategoria: 17, nombre: 'Extraordinaria', predeterminada: false, idCategoriaPadre: 4, subcategorias: [] }
      ]
    },
    {
      idCategoria: 5,
      nombre: 'Otros',
      predeterminada: true,
      idCategoriaPadre: 1,
      subcategorias: [
        { idCategoria: 18, nombre: 'DUAL', predeterminada: false, idCategoriaPadre: 5, subcategorias: [] },
        { idCategoria: 19, nombre: 'Semanas Especiales', predeterminada: false, idCategoriaPadre: 5, subcategorias: [] },
        { idCategoria: 20, nombre: 'Enlaces PAU', predeterminada: false, idCategoriaPadre: 5, subcategorias: [] },
        { idCategoria: 21, nombre: 'categoria no predeterminada de prueba', predeterminada: false, idCategoriaPadre: 5, subcategorias: [] }
      ]
    }
  ];

  private recursos: RecursoDto[] = [
    {
      idCategoria: 10,
      numRecurso: 1,
      nombre: 'Plan de tutoria de 1 CCFF',
      descripcion: 'Plantilla base para organizar sesiones de seguimiento y tutoria de grupo.',
      fechaPublicacion: '2026-05-22T10:00:00.000Z',
      idCurso: 2,
      anioInicio: 2025,
      anioFin: 2026,
      categoriaNombre: '1 CCFF',
      urls: ['https://example.com/tutoria-1ccff'],
      archivos: ['/mock/uploads/plan-tutoria-1ccff.pdf'],
      enlacesDetalle: [{ nombre: 'Guia de uso', url: 'https://example.com/tutoria-1ccff' }],
      archivosDetalle: [{ nombre: 'Plan de tutoria', archivo: '/mock/uploads/plan-tutoria-1ccff.pdf' }],
      ciclos: [{ idCiclo: 1, nombre: 'DAW' }, { idCiclo: 2, nombre: 'DAM' }],
      enlacePrincipal: 'https://example.com/tutoria-1ccff'
    },
    {
      idCategoria: 12,
      numRecurso: 1,
      nombre: 'Seguimiento PAT del trimestre',
      descripcion: 'Documento editable para objetivos, incidencias y acuerdos del PAT.',
      fechaPublicacion: '2026-05-25T16:15:00.000Z',
      idCurso: 3,
      anioInicio: 2026,
      anioFin: 2027,
      categoriaNombre: 'PAT',
      urls: ['https://example.com/pat-trimestre'],
      archivos: ['/mock/uploads/pat-trimestre.docx'],
      enlacesDetalle: [{ nombre: 'Modelo PAT', url: 'https://example.com/pat-trimestre' }],
      archivosDetalle: [{ nombre: 'Seguimiento PAT', archivo: '/mock/uploads/pat-trimestre.docx' }],
      ciclos: [{ idCiclo: 1, nombre: 'DAW' }],
      enlacePrincipal: 'https://example.com/pat-trimestre'
    },
    {
      idCategoria: 14,
      numRecurso: 1,
      nombre: 'Acta de equipo educativo',
      descripcion: 'Formato de trabajo para seguimiento conjunto del grupo y acuerdos docentes.',
      fechaPublicacion: '2026-05-24T08:30:00.000Z',
      idCurso: 2,
      anioInicio: 2025,
      anioFin: 2026,
      categoriaNombre: 'Equipo Educativo',
      urls: ['https://example.com/equipo-educativo'],
      archivos: ['/mock/uploads/equipo-educativo.xlsx'],
      enlacesDetalle: [{ nombre: 'Material compartido', url: 'https://example.com/equipo-educativo' }],
      archivosDetalle: [{ nombre: 'Acta equipo educativo', archivo: '/mock/uploads/equipo-educativo.xlsx' }],
      ciclos: [{ idCiclo: 3, nombre: 'SMR' }, { idCiclo: 4, nombre: 'ASIR' }],
      enlacePrincipal: 'https://example.com/equipo-educativo'
    },
    {
      idCategoria: 18,
      numRecurso: 1,
      nombre: 'Guia DUAL para tutores',
      descripcion: 'Resumen de calendario, documentos y seguimiento del alumnado en DUAL.',
      fechaPublicacion: '2026-05-20T12:45:00.000Z',
      idCurso: 1,
      anioInicio: 2024,
      anioFin: 2025,
      categoriaNombre: 'DUAL',
      urls: ['https://example.com/dual'],
      archivos: ['/mock/uploads/guia-dual.pptx'],
      enlacesDetalle: [{ nombre: 'Portal DUAL', url: 'https://example.com/dual' }],
      archivosDetalle: [{ nombre: 'Guia DUAL', archivo: '/mock/uploads/guia-dual.pptx' }],
      ciclos: [{ idCiclo: 3, nombre: 'SMR' }],
      enlacePrincipal: 'https://example.com/dual'
    },
    {
      idCategoria: 21,
      numRecurso: 1,
      nombre: 'Recurso de prueba para categoria libre',
      descripcion: 'Material de prueba vinculado a una categoria no predeterminada del backend.',
      fechaPublicacion: '2026-05-18T09:00:00.000Z',
      idCurso: 2,
      anioInicio: 2025,
      anioFin: 2026,
      categoriaNombre: 'categoria no predeterminada de prueba',
      urls: ['https://example.com/categoria-libre'],
      archivos: ['/mock/uploads/categoria-libre.docx'],
      enlacesDetalle: [{ nombre: 'Acceso de prueba', url: 'https://example.com/categoria-libre' }],
      archivosDetalle: [{ nombre: 'Documento de prueba', archivo: '/mock/uploads/categoria-libre.docx' }],
      ciclos: [{ idCiclo: 1, nombre: 'DAW' }, { idCiclo: 2, nombre: 'DAM' }, { idCiclo: 3, nombre: 'SMR' }],
      enlacePrincipal: 'https://example.com/categoria-libre'
    }
  ];

  private convocatorias: ConvocatoriaMock[] = [
    {
      idConvocatoria: 1,
      fecha: '2026-06-10T10:00:00',
      estado: 'a',
      idLugar: 2,
      idCurso: 3,
      idProfesorRedactaActa: 1,
      idProfesorIniciaReunion: 2,
      lugar: 'Sala de reuniones',
      anioInicio: '2026',
      anioFin: '2027',
      redacta: 'Lucia Navarro',
      inicia: 'Ruben Torres',
      ordenDia: [
        {
          numOrden: 1,
          minutos: 20,
          descripcion: 'Revisar programaciones del tercer trimestre',
          objetivo: 'Dejar cerrados los ajustes comunes',
          idLugar: 2,
          idProfesorDinamiza: 1,
          lugar: 'Sala de reuniones',
          dinamiza: 'Lucia Navarro',
          participantes: [this.profesorParticipante(1), this.profesorParticipante(2), this.grupoParticipante(1)]
        }
      ]
    },
    {
      idConvocatoria: 2,
      fecha: '2026-06-18T12:00:00',
      estado: 'b',
      idLugar: 1,
      idCurso: 3,
      idProfesorRedactaActa: 3,
      idProfesorIniciaReunion: null,
      lugar: 'Aula A-12',
      anioInicio: '2026',
      anioFin: '2027',
      redacta: 'Marta Gil',
      inicia: null,
      ordenDia: [
        {
          numOrden: 1,
          minutos: 15,
          descripcion: 'Preparar jornada de puertas abiertas',
          objetivo: 'Asignar tareas y turnos',
          idLugar: 1,
          idProfesorDinamiza: 3,
          lugar: 'Aula A-12',
          dinamiza: 'Marta Gil',
          participantes: [this.profesorParticipante(3), this.profesorParticipante(4)]
        }
      ]
    },
    {
      idConvocatoria: 3,
      fecha: '2026-05-08T09:00:00',
      estado: 'p',
      idLugar: 4,
      idCurso: 2,
      idProfesorRedactaActa: 2,
      idProfesorIniciaReunion: 1,
      lugar: 'Salon de actos',
      anioInicio: '2025',
      anioFin: '2026',
      redacta: 'Ruben Torres',
      inicia: 'Lucia Navarro',
      ordenDia: [
        {
          numOrden: 1,
          minutos: 30,
          descripcion: 'Balance del trimestre',
          objetivo: 'Recoger incidencias y mejoras',
          idLugar: 4,
          idProfesorDinamiza: 2,
          lugar: 'Salon de actos',
          dinamiza: 'Ruben Torres',
          participantes: [this.profesorParticipante(1), this.profesorParticipante(2), this.grupoParticipante(2)]
        }
      ]
    }
  ];

  getCategorias(): Observable<CategoriaDto[]> {
    return of(this.clonar(this.categorias));
  }

  getCiclos(): Observable<CicloDto[]> {
    return of(
      this.ciclosRecurso.map((ciclo) => ({
        idCiclo: ciclo.idCiclo,
        nombre: ciclo.nombre,
        familia: `Familia ${ciclo.nombre}`,
        abierto: false,
        cursos: []
      }))
    );
  }

  crearCiclo(nombre: string, familia: string): Observable<{ message: string }> {
    const nuevoId = Math.max(...this.ciclosRecurso.map((ciclo) => ciclo.idCiclo), 0) + 1;
    this.ciclosRecurso.push({ idCiclo: nuevoId, nombre });
    return of({ message: `Ciclo ${nombre} (${familia}) creado en mock.` });
  }

  editarCiclo(idCiclo: number, nombre: string, _familia: string): Observable<{ message: string }> {
    const ciclo = this.ciclosRecurso.find((item) => item.idCiclo === idCiclo);
    if (!ciclo) {
      return throwError(() => ({ error: { message: 'No existe el ciclo solicitado.' } }));
    }
    ciclo.nombre = nombre;
    return of({ message: `Ciclo ${nombre} actualizado en mock.` });
  }

  eliminarCiclo(idCiclo: number): Observable<{ message: string }> {
    this.ciclosRecurso = this.ciclosRecurso.filter((ciclo) => ciclo.idCiclo !== idCiclo);
    return of({ message: 'Ciclo eliminado en mock.' });
  }

  getRecursosRecientesProfesor(limite = 5): Observable<RecursoDto[]> {
    return of(this.ordenarRecursosPorFecha(this.recursos).slice(0, limite).map((recurso) => this.clonar(recurso)));
  }

  getTodosLosRecursos(): Observable<RecursoDto[]> {
    return of(this.ordenarRecursosPorFecha(this.recursos).map((recurso) => this.clonar(recurso)));
  }

  getRecursoFormulario(): Observable<RecursoFormularioResponse> {
    return of({
      cursoActualId: 3,
      cursos: this.clonar(this.cursos),
      ciclos: this.clonar(this.ciclosRecurso)
    });
  }

  getRecursosPorCategoria(idCategoria: number): Observable<RecursoDto[]> {
    return of(
      this.ordenarRecursosPorFecha(this.recursos.filter((recurso) => recurso.idCategoria === idCategoria))
        .map((recurso) => this.clonar(recurso))
    );
  }

  getDetalleRecurso(idCategoria: number, numRecurso: number): Observable<RecursoDto> {
    const recurso = this.recursos.find(
      (item) => item.idCategoria === idCategoria && item.numRecurso === numRecurso
    );

    if (!recurso) {
      return throwError(() => ({ error: { message: 'No se ha encontrado el recurso.' } }));
    }

    return of(this.clonar(recurso));
  }

  guardarRecurso(payload: RecursoGuardadoPayload): Observable<{ message: string }> {
    if (!payload.idCategoria || !payload.idCurso) {
      return throwError(() => ({ error: { message: 'Faltan datos obligatorios para guardar el recurso.' } }));
    }

    const curso = this.cursos.find((item) => item.idCurso === payload.idCurso);
    const categoria = this.buscarCategoriaPorId(payload.idCategoria);
    if (!curso || !categoria) {
      return throwError(() => ({ error: { message: 'Curso o categoria no validos.' } }));
    }

    const ciclos = this.ciclosRecurso
      .filter((ciclo) => payload.ciclosSeleccionados.includes(ciclo.idCiclo))
      .map((ciclo) => this.clonar(ciclo));

    const urls = payload.enlaces.map((enlace) => enlace.valor);
    const archivos = payload.archivos.map((archivo) => archivo.valor);
    const enlacesDetalle = payload.enlaces.map((enlace) => ({ nombre: enlace.nombre, url: enlace.valor }));
    const archivosDetalle = payload.archivos.map((archivo) => ({ nombre: archivo.nombre, archivo: archivo.valor }));

    const existente = this.recursos.find(
      (recurso) => recurso.idCategoria === payload.idCategoria && recurso.numRecurso === payload.numRecurso
    );

    if (existente) {
      existente.nombre = payload.nombre;
      existente.descripcion = payload.descripcion;
      existente.idCurso = payload.idCurso;
      existente.anioInicio = Number(curso.anioInicio);
      existente.anioFin = Number(curso.anioFin);
      existente.categoriaNombre = categoria.nombre;
      existente.urls = urls;
      existente.archivos = archivos;
      existente.enlacesDetalle = enlacesDetalle;
      existente.archivosDetalle = archivosDetalle;
      existente.ciclos = ciclos;
      existente.enlacePrincipal = urls[0] || archivos[0] || '';
      existente.fechaPublicacion = new Date().toISOString();
      return of({ message: 'Recurso actualizado correctamente en mock.' });
    }

    const nuevoNum = Math.max(
      0,
      ...this.recursos
        .filter((recurso) => recurso.idCategoria === payload.idCategoria)
        .map((recurso) => recurso.numRecurso)
    ) + 1;

    this.recursos.push({
      idCategoria: payload.idCategoria,
      numRecurso: nuevoNum,
      nombre: payload.nombre,
      descripcion: payload.descripcion,
      fechaPublicacion: new Date().toISOString(),
      idCurso: payload.idCurso,
      anioInicio: Number(curso.anioInicio),
      anioFin: Number(curso.anioFin),
      categoriaNombre: categoria.nombre,
      urls,
      archivos,
      enlacesDetalle,
      archivosDetalle,
      ciclos,
      enlacePrincipal: urls[0] || archivos[0] || ''
    });

    return of({ message: 'Recurso creado correctamente en mock.' });
  }

  eliminarRecurso(idCategoria: number, numRecurso: number): Observable<{ message: string }> {
    const totalAntes = this.recursos.length;
    this.recursos = this.recursos.filter(
      (recurso) => !(recurso.idCategoria === idCategoria && recurso.numRecurso === numRecurso)
    );

    if (this.recursos.length === totalAntes) {
      return throwError(() => ({ error: { message: 'El recurso ya no existe.' } }));
    }

    return of({ message: 'Recurso eliminado correctamente en mock.' });
  }

  eliminarArchivoTemporal(_identificadorTemporal: string): Observable<{ message: string }> {
    return of({ message: 'Archivo temporal eliminado en mock.' });
  }

  getConvocatoriaFormulario(): Observable<ConvocatoriaFormularioResponseDto> {
    return of({
      cursos: this.clonar(this.cursos),
      lugares: this.clonar(this.lugares),
      profesores: this.clonar(this.profesores),
      grupos: this.clonar(this.grupos),
      cursoActualId: 3
    });
  }

  guardarConvocatoria(payload: GuardarConvocatoriaPayloadDto): Observable<{ idConvocatoria: number; message: string }> {
    if (!payload.fechaHora || !payload.lugarId || !payload.redactaId || !payload.cursoId) {
      return throwError(() => ({ error: { message: 'Completa fecha, lugar, curso y redacta para guardar la convocatoria.' } }));
    }

    const curso = this.cursos.find((item) => item.idCurso === payload.cursoId);
    const lugar = this.lugares.find((item) => item.idLugar === payload.lugarId);
    const redacta = this.profesores.find((item) => item.idProfesor === payload.redactaId);
    const inicia = payload.iniciaId ? this.profesores.find((item) => item.idProfesor === payload.iniciaId) : null;

    if (!curso || !lugar || !redacta) {
      return throwError(() => ({ error: { message: 'Los datos relacionados de la convocatoria no son validos.' } }));
    }

    const ordenDia = (payload.ordenDia || []).map((item, index) => {
      const dinamiza = item.dinamizaId ? this.profesores.find((profesor) => profesor.idProfesor === item.dinamizaId) : null;
      const lugarFila = item.lugarId ? this.lugares.find((entrada) => entrada.idLugar === item.lugarId) : null;

      return {
        numOrden: index + 1,
        minutos: item.minutos,
        descripcion: item.ordenDia,
        objetivo: item.objetivo,
        idLugar: item.lugarId ?? payload.lugarId ?? 0,
        idProfesorDinamiza: item.dinamizaId ?? payload.redactaId ?? 0,
        lugar: lugarFila?.nombre || lugar.nombre,
        dinamiza: dinamiza?.nombre || redacta.nombre,
        participantes: (item.participantes || []).map((participante) => this.resolverParticipante(participante))
      };
    });

    if (payload.idConvocatoria) {
      const convocatoria = this.convocatorias.find((item) => item.idConvocatoria === payload.idConvocatoria);
      if (!convocatoria) {
        return throwError(() => ({ error: { message: 'No existe la convocatoria que intentas editar.' } }));
      }

      convocatoria.estado = payload.estado ?? 'a';
      convocatoria.fecha = payload.fechaHora;
      convocatoria.idLugar = payload.lugarId;
      convocatoria.idCurso = payload.cursoId;
      convocatoria.idProfesorRedactaActa = payload.redactaId;
      convocatoria.idProfesorIniciaReunion = payload.iniciaId;
      convocatoria.lugar = lugar.nombre;
      convocatoria.anioInicio = curso.anioInicio;
      convocatoria.anioFin = curso.anioFin;
      convocatoria.redacta = redacta.nombre;
      convocatoria.inicia = inicia?.nombre || null;
      convocatoria.ordenDia = ordenDia;

      return of({
        idConvocatoria: convocatoria.idConvocatoria,
        message: convocatoria.estado === 'b'
          ? 'Borrador actualizado en mock.'
          : 'Convocatoria actualizada correctamente en mock.'
      });
    }

    const nuevoId = Math.max(...this.convocatorias.map((item) => item.idConvocatoria), 0) + 1;
    this.convocatorias.push({
      idConvocatoria: nuevoId,
      estado: payload.estado ?? 'a',
      fecha: payload.fechaHora,
      idLugar: payload.lugarId,
      idCurso: payload.cursoId,
      idProfesorRedactaActa: payload.redactaId,
      idProfesorIniciaReunion: payload.iniciaId,
      lugar: lugar.nombre,
      anioInicio: curso.anioInicio,
      anioFin: curso.anioFin,
      redacta: redacta.nombre,
      inicia: inicia?.nombre || null,
      ordenDia
    });

    return of({
      idConvocatoria: nuevoId,
      message: payload.estado === 'b'
        ? 'Borrador guardado en mock.'
        : 'Convocatoria publicada en mock.'
    });
  }

  listarConvocatoriasActivas(): Observable<ConvocatoriaListaItemDto[]> {
    return of(this.listarConvocatoriasPorEstado(['a']));
  }

  listarConvocatoriasProfesor(): Observable<ConvocatoriaListaItemDto[]> {
    return of(this.listarConvocatoriasPorEstado(['a', 'p']));
  }

  listarConvocatoriasCoordinador(): Observable<ConvocatoriaListaItemDto[]> {
    return of(this.convocatorias.map((item) => this.mapearConvocatoriaLista(item)));
  }

  marcarConvocatoriaComoPasada(idConvocatoria: number): Observable<{ message: string }> {
    const convocatoria = this.convocatorias.find((item) => item.idConvocatoria === idConvocatoria);
    if (!convocatoria) {
      return throwError(() => ({ error: { message: 'No se ha encontrado la convocatoria.' } }));
    }

    convocatoria.estado = 'p';
    return of({ message: 'Convocatoria archivada en mock.' });
  }

  marcarTodasLasConvocatoriasActivasComoPasadas(): Observable<{ message: string; actualizadas: number }> {
    let actualizadas = 0;
    for (const convocatoria of this.convocatorias) {
      if (convocatoria.estado === 'a') {
        convocatoria.estado = 'p';
        actualizadas += 1;
      }
    }

    return of({ message: 'Convocatorias activas archivadas en mock.', actualizadas });
  }

  listarConvocatoriasHistoricas(): Observable<ConvocatoriaListaItemDto[]> {
    return of(this.listarConvocatoriasPorEstado(['b', 'p']));
  }

  listarConvocatoriasCanceladas(): Observable<ConvocatoriaListaItemDto[]> {
    return this.listarConvocatoriasHistoricas();
  }

  getConvocatoria(id: number): Observable<ConvocatoriaDetalleDto> {
    const convocatoria = this.convocatorias.find((item) => item.idConvocatoria === id);
    if (!convocatoria) {
      return throwError(() => ({ error: { message: 'No se ha encontrado la convocatoria.' } }));
    }

    return of(this.clonar(convocatoria));
  }

  cancelarConvocatoria(idConvocatoria: number): Observable<{ message: string }> {
    const convocatoria = this.convocatorias.find((item) => item.idConvocatoria === idConvocatoria);
    if (!convocatoria) {
      return throwError(() => ({ error: { message: 'No se ha encontrado la convocatoria.' } }));
    }

    convocatoria.estado = 'p';
    return of({ message: 'Convocatoria cancelada en mock y movida a historico.' });
  }

  private buscarCategoriaPorId(idCategoria: number): CategoriaDto | null {
    const pila = [...this.categorias];
    while (pila.length > 0) {
      const actual = pila.shift()!;
      if (actual.idCategoria === idCategoria) {
        return actual;
      }
      if (actual.subcategorias?.length) {
        pila.push(...actual.subcategorias);
      }
    }
    return null;
  }

  private mapearConvocatoriaLista(convocatoria: ConvocatoriaMock): ConvocatoriaListaItemDto {
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

  private listarConvocatoriasPorEstado(estados: Array<'a' | 'b' | 'p'>): ConvocatoriaListaItemDto[] {
    return this.convocatorias
      .filter((convocatoria) => estados.includes(convocatoria.estado ?? 'a'))
      .map((convocatoria) => this.mapearConvocatoriaLista(convocatoria));
  }

  private ordenarRecursosPorFecha(recursos: RecursoDto[]): RecursoDto[] {
    return [...recursos].sort(
      (a, b) => new Date(b.fechaPublicacion).getTime() - new Date(a.fechaPublicacion).getTime()
    );
  }

  private profesorParticipante(idProfesor: number): ParticipanteDto {
    const profesor = this.profesores.find((item) => item.idProfesor === idProfesor)!;
    return {
      idParticipante: profesor.idProfesor,
      tipo: 'profesor',
      nombre: profesor.nombre
    };
  }

  private grupoParticipante(idGrupo: number): ParticipanteDto {
    const grupo = this.grupos.find((item) => item.idGrupo === idGrupo)!;
    return {
      idParticipante: grupo.idGrupo,
      tipo: 'grupo',
      nombre: grupo.nombre
    };
  }

  private resolverParticipante(participante: ParticipanteDto): ParticipanteDto {
    if (participante.tipo === 'grupo') {
      return this.grupoParticipante(participante.idParticipante);
    }
    return this.profesorParticipante(participante.idParticipante);
  }

  private clonar<T>(valor: T): T {
    return JSON.parse(JSON.stringify(valor)) as T;
  }
}
