import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConvocatoriaDetalleDto } from '../../../dto/convocatoria-detalle.dto';
import { ConvocatoriaListaItemDto } from '../../../dto/convocatoria-lista-item.dto';
import { CursoOptionDto } from '../../../dto/curso-option.dto';
import { GrupoOptionDto } from '../../../dto/grupo-option.dto';
import { LugarOptionDto } from '../../../dto/lugar-option.dto';
import { OrdenDiaCoordinadorDto } from '../../../dto/orden-dia-coordinador.dto';
import { ParticipanteDto } from '../../../dto/participante.dto';
import { ProfesorField } from '../../../dto/profesor-field.type';
import { ProfesorOptionDto } from '../../../dto/profesor-option.dto';
import { ConvocatoriaService } from '../../../services/convocatoria.service';

type VistaConvocatoria = 'listado' | 'formulario' | 'detalle';
type EstadoConvocatoriaFormulario = 'a' | 'p' | 'b';
type ModalPublicacionModo = 'publicar' | 'archivar';

interface ParticipanteBusqueda {
  idParticipante: number;
  tipo: 'profesor' | 'grupo';
  nombre: string;
  seleccionado?: boolean;
}

type FiltroParticipantesModal = 'todos' | 'profesor' | 'grupo';

@Component({
  selector: 'app-convocatorias-coordinador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './convocatorias.component.html',
  styleUrl: './convocatorias.component.css'
})
export class ConvocatoriasComponent implements OnInit {
  vista: VistaConvocatoria = 'listado';
  convocatorias: ConvocatoriaListaItemDto[] = [];
  cargandoListado = true;
  convocatoriaSeleccionada: ConvocatoriaDetalleDto | null = null;

  convocatoria = {
    idConvocatoria: null as number | null,
    estado: 'a' as EstadoConvocatoriaFormulario,
    titulo: 'Nueva convocatoria',
    subtitulo: 'Configura y publica una convocatoria activa.',
    fechaHora: '',
    lugarId: null as number | null,
    redactaId: null as number | null,
    iniciaId: null as number | null,
    cursoId: null as number | null
  };

  cursosAcademicos: CursoOptionDto[] = [];
  lugares: LugarOptionDto[] = [];
  profesores: ProfesorOptionDto[] = [];
  grupos: GrupoOptionDto[] = [];

  cargandoFormulario = true;
  guardando = false;
  errorFormulario = '';
  feedback = '';
  feedbackError = false;

  redactaOpen = false;
  redactaQuery = '';
  iniciaOpen = false;
  iniciaQuery = '';

  modalParticipantesAbierto = false;
  modalParticipantesFilaIndex: number | null = null;
  modalParticipantesFilaActiva: OrdenDiaCoordinadorDto | null = null;
  modalParticipantesQuery = '';
  modalParticipantesFiltro: FiltroParticipantesModal = 'todos';
  modalParticipantesSeleccionados: ParticipanteDto[] = [];
  modalPublicacionAbierto = false;
  modalPublicacionCargando = false;
  modalPublicacionProcesando = false;
  modalPublicacionModo: ModalPublicacionModo = 'archivar';
  convocatoriasActivasPendientes: ConvocatoriaListaItemDto[] = [];
  ordenDia: OrdenDiaCoordinadorDto[] = [this.createEmptyFila()];

  private estadoInicialFormulario = '';

  constructor(
    private convocatoriaService: ConvocatoriaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarFormulario();

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      const url = this.router.url;

      if (url.includes('/crear')) {
        this.iniciarCreacion();
        return;
      }

      if (idParam) {
        const id = Number(idParam);
        if (url.endsWith('/editar')) {
          this.iniciarEdicion(id);
        } else {
          this.iniciarDetalle(id);
        }
        return;
      }

      this.vista = 'listado';
      this.aplicarEstadoNavegacion();
      this.cargarConvocatorias();
    });
  }

  cargarFormulario(): void {
    this.cargandoFormulario = true;
    this.errorFormulario = '';

    this.convocatoriaService.getFormulario().subscribe({
      next: (data) => {
        this.cursosAcademicos = data.cursos;
        this.lugares = data.lugares;
        this.profesores = data.profesores;
        this.grupos = data.grupos;

        if (!this.convocatoria.cursoId) {
          this.convocatoria.cursoId = data.cursoActualId ?? this.cursosAcademicos[0]?.idCurso ?? null;
        }

        if (this.convocatoria.idConvocatoria === null && this.convocatoria.lugarId === null) {
          this.convocatoria.lugarId = this.lugares[0]?.idLugar ?? null;
        }

        if (this.vista === 'formulario' && this.convocatoria.idConvocatoria === null) {
          this.estadoInicialFormulario = this.serializarEstadoFormulario();
        }

        this.cargandoFormulario = false;
      },
      error: (error) => {
        this.cargandoFormulario = false;
        this.errorFormulario = error?.error?.message || 'No se pudieron cargar los datos del formulario.';
      }
    });
  }

  cargarConvocatorias(): void {
    this.cargandoListado = true;
    this.convocatoriaService.listarConvocatoriasCoordinador().subscribe({
      next: (data) => {
        this.convocatorias = this.ordenarListado(data);
        this.cargandoListado = false;
      },
      error: (error) => {
        this.cargandoListado = false;
        this.errorFormulario = error?.error?.message || 'Error al cargar el listado de convocatorias.';
      }
    });
  }

  crearNueva(): void {
    this.router.navigate(['/coordinador/reuniones-de-equipo/convocatorias/crear']);
  }

  abrirArchivado(): void {
    if (this.convocatoriasActivas.length === 0) {
      return;
    }

    this.modalPublicacionModo = 'archivar';
    this.feedback = '';
    this.feedbackError = false;
    this.modalPublicacionAbierto = true;
    this.modalPublicacionCargando = false;
    this.modalPublicacionProcesando = false;
    this.convocatoriasActivasPendientes = this.ordenarListado(this.convocatoriasActivas);
  }

  editarConvocatoria(id: number): void {
    const convocatoria = this.convocatorias.find((item) => item.idConvocatoria === id) || this.convocatoriaSeleccionada;
    if (convocatoria?.estado === 'p') {
      this.feedback = 'No se puede modificar una convocatoria pasada.';
      this.feedbackError = true;
      return;
    }

    this.router.navigate(['/coordinador/reuniones-de-equipo/convocatorias', id, 'editar']);
  }

  verConvocatoria(id: number): void {
    this.router.navigate(['/coordinador/reuniones-de-equipo/convocatorias', id]);
  }

  volverAlListado(): void {
    this.router.navigate(['/coordinador/reuniones-de-equipo/convocatorias']);
  }

  iniciarCreacion(): void {
    this.convocatoria = {
      idConvocatoria: null,
      estado: 'a',
      titulo: 'Nueva convocatoria',
      subtitulo: 'Completa los datos y publica una convocatoria activa.',
      fechaHora: '',
      lugarId: this.lugares[0]?.idLugar ?? null,
      redactaId: null,
      iniciaId: null,
      cursoId: this.cursosAcademicos[0]?.idCurso ?? null
    };
    this.ordenDia = [this.createEmptyFila()];
    this.vista = 'formulario';
    this.feedback = '';
    this.feedbackError = false;
    this.errorFormulario = '';
    this.estadoInicialFormulario = this.serializarEstadoFormulario();
  }

  iniciarEdicion(id: number): void {
    this.cargandoFormulario = true;
    this.errorFormulario = '';
    this.vista = 'formulario';
    this.feedback = '';
    this.feedbackError = false;

    this.convocatoriaService.getConvocatoria(id).subscribe({
      next: (data) => {
        if (data.estado === 'p') {
          this.feedback = 'No se puede modificar una convocatoria pasada.';
          this.feedbackError = true;
          this.router.navigate(['/coordinador/reuniones-de-equipo/convocatorias/historico', id]);
          return;
        }

        this.convocatoria = {
          idConvocatoria: data.idConvocatoria,
          estado: data.estado ?? 'a',
          titulo: 'Editar convocatoria',
          subtitulo: 'Actualiza la convocatoria activa.',
          fechaHora: data.fecha ? data.fecha.substring(0, 16) : '',
          lugarId: data.idLugar ? Number(data.idLugar) : null,
          redactaId: data.idProfesorRedactaActa ? Number(data.idProfesorRedactaActa) : null,
          iniciaId: data.idProfesorIniciaReunion ? Number(data.idProfesorIniciaReunion) : null,
          cursoId: data.idCurso ? Number(data.idCurso) : null
        };

        this.ordenDia = (data.ordenDia || []).length > 0
          ? data.ordenDia.map((item) => ({
              minutos: item.minutos ? Number(item.minutos) : null,
              ordenDia: item.descripcion || '',
              objetivo: item.objetivo || '',
              dinamizaId: item.idProfesorDinamiza ? Number(item.idProfesorDinamiza) : null,
              lugarId: item.idLugar ? Number(item.idLugar) : null,
              participantes: (item.participantes || []).map((participante) => ({ ...participante })),
              dinamizaQuery: '',
              dinamizaOpen: false,
              lugarQuery: '',
              lugarOpen: false,
              participantesExpandido: false,
              participaQuery: '',
              participaOpen: false
            }))
          : [this.createEmptyFila()];

        this.estadoInicialFormulario = this.serializarEstadoFormulario();
        this.cargandoFormulario = false;
      },
      error: (error) => {
        this.cargandoFormulario = false;
        this.errorFormulario = error?.error?.message || 'Error al cargar los detalles de la convocatoria.';
      }
    });
  }

  iniciarDetalle(id: number): void {
    this.cargandoListado = true;
    this.errorFormulario = '';
    this.convocatoriaSeleccionada = null;

    this.convocatoriaService.getConvocatoria(id).subscribe({
      next: (data) => {
        this.convocatoriaSeleccionada = data;
        this.cargandoListado = false;
        this.vista = 'detalle';
      },
      error: (error) => {
        this.cargandoListado = false;
        this.errorFormulario = error?.error?.message || 'Error al cargar los detalles de la convocatoria.';
      }
    });
  }

  addFila(): void {
    this.ordenDia.push(this.createEmptyFila());
  }

  removeFila(index: number): void {
    if (this.ordenDia.length > 1) {
      this.ordenDia.splice(index, 1);
    }
  }

  toggleFilaDropdown(item: OrdenDiaCoordinadorDto, field: 'dinamiza' | 'lugar'): void {
    this.ordenDia.forEach((fila) => {
      if (fila !== item) {
        fila.dinamizaOpen = false;
        fila.lugarOpen = false;
      }
    });

    if (field === 'dinamiza') {
      item.dinamizaOpen = !item.dinamizaOpen;
      item.lugarOpen = false;
      return;
    }

    item.lugarOpen = !item.lugarOpen;
    item.dinamizaOpen = false;
  }

  toggleProfesorDropdown(field: ProfesorField): void {
    if (field === 'redacta') {
      this.redactaOpen = !this.redactaOpen;
      this.iniciaOpen = false;
      return;
    }

    this.iniciaOpen = !this.iniciaOpen;
    this.redactaOpen = false;
  }

  getProfesoresFieldFiltrados(field: ProfesorField): ProfesorOptionDto[] {
    const query = this.normalizarTexto(field === 'redacta' ? this.redactaQuery : this.iniciaQuery);

    return this.profesores
      .filter((profesor) => !query || this.normalizarTexto(profesor.nombre).includes(query))
      .slice(0, 8);
  }

  selectProfesor(field: ProfesorField, profesorId: number): void {
    if (field === 'redacta') {
      this.convocatoria.redactaId = profesorId;
      this.redactaQuery = '';
      this.redactaOpen = false;
      return;
    }

    this.convocatoria.iniciaId = profesorId;
    this.iniciaQuery = '';
    this.iniciaOpen = false;
  }

  limpiarProfesor(field: ProfesorField): void {
    if (field === 'redacta') {
      this.convocatoria.redactaId = null;
      this.redactaQuery = '';
      this.redactaOpen = false;
      return;
    }

    this.convocatoria.iniciaId = null;
    this.iniciaQuery = '';
    this.iniciaOpen = false;
  }

  getProfesoresFilaFiltrados(item: OrdenDiaCoordinadorDto): ProfesorOptionDto[] {
    const query = this.normalizarTexto(item.dinamizaQuery);

    return this.profesores
      .filter((profesor) => !query || this.normalizarTexto(profesor.nombre).includes(query))
      .slice(0, 8);
  }

  getLugaresFilaFiltrados(item: OrdenDiaCoordinadorDto): LugarOptionDto[] {
    const query = this.normalizarTexto(item.lugarQuery);

    return this.lugares
      .filter((lugar) => !query || this.normalizarTexto(lugar.nombre).includes(query))
      .slice(0, 8);
  }

  selectDinamizaFila(item: OrdenDiaCoordinadorDto, profesorId: number): void {
    item.dinamizaId = profesorId;
    item.dinamizaQuery = '';
    item.dinamizaOpen = false;
  }

  selectLugarFila(item: OrdenDiaCoordinadorDto, lugarId: number): void {
    item.lugarId = lugarId;
    item.lugarQuery = '';
    item.lugarOpen = false;
  }

  abrirModalParticipantes(item: OrdenDiaCoordinadorDto): void {
    this.modalParticipantesFilaActiva = item;
    this.modalParticipantesFilaIndex = this.ordenDia.indexOf(item);
    this.modalParticipantesAbierto = true;
    this.modalParticipantesQuery = '';
    this.modalParticipantesFiltro = 'todos';
    this.modalParticipantesSeleccionados = item.participantes.map((participante) => ({ ...participante }));
  }

  cerrarModalParticipantes(): void {
    this.modalParticipantesAbierto = false;
    this.modalParticipantesFilaIndex = null;
    this.modalParticipantesFilaActiva = null;
    this.modalParticipantesQuery = '';
    this.modalParticipantesFiltro = 'todos';
    this.modalParticipantesSeleccionados = [];
  }

  aplicarModalParticipantes(): void {
    if (!this.modalParticipantesFilaActiva) {
      this.cerrarModalParticipantes();
      return;
    }

    this.modalParticipantesFilaActiva.participantes = this.modalParticipantesSeleccionados.map((participante) => ({ ...participante }));
    this.cerrarModalParticipantes();
  }

  toggleParticipanteModal(participante: ParticipanteBusqueda): void {
    const existe = this.modalParticipantesSeleccionados.some(
      (actual) => actual.tipo === participante.tipo && actual.idParticipante === participante.idParticipante
    );

    if (!existe) {
      this.modalParticipantesSeleccionados = [
        ...this.modalParticipantesSeleccionados,
        {
          idParticipante: participante.idParticipante,
          tipo: participante.tipo,
          nombre: participante.nombre
        }
      ];
      return;
    }

    this.modalParticipantesSeleccionados = this.modalParticipantesSeleccionados.filter(
      (actual) => actual.tipo !== participante.tipo || actual.idParticipante !== participante.idParticipante
    );
  }

  quitarParticipanteModal(participante: ParticipanteDto): void {
    this.modalParticipantesSeleccionados = this.modalParticipantesSeleccionados.filter(
      (actual) => actual.tipo !== participante.tipo || actual.idParticipante !== participante.idParticipante
    );
  }

  esParticipanteSeleccionadoModal(participante: ParticipanteBusqueda): boolean {
    return this.modalParticipantesSeleccionados.some(
      (actual) => actual.tipo === participante.tipo && actual.idParticipante === participante.idParticipante
    );
  }

  getParticipantesModalFiltrados(): ParticipanteBusqueda[] {
    const query = this.normalizarTexto(this.modalParticipantesQuery);
    const filtro = this.modalParticipantesFiltro;
    const seleccionados = new Set(
      this.modalParticipantesSeleccionados.map((participante) => `${participante.tipo}:${participante.idParticipante}`)
    );

    return this.obtenerParticipantesDisponibles()
      .filter((participante) => filtro === 'todos' || participante.tipo === filtro)
      .filter((participante) => !query || this.normalizarTexto(participante.nombre).includes(query))
      .map((participante) => ({
        ...participante,
        seleccionado: seleccionados.has(`${participante.tipo}:${participante.idParticipante}`)
      }))
      .sort((a, b) => Number(b.seleccionado) - Number(a.seleccionado) || a.nombre.localeCompare(b.nombre, 'es'));
  }

  guardarConvocatoria(estadoDestino: 'b' | 'a'): void {
    this.convocatoria.estado = estadoDestino;
    this.feedback = '';
    this.feedbackError = false;

    if (this.esFechaPasada(this.convocatoria.fechaHora)) {
      this.feedback = estadoDestino === 'b'
        ? 'No se puede guardar un borrador con una fecha pasada.'
        : 'No se puede crear o publicar una convocatoria con una fecha pasada.';
      this.feedbackError = true;
      return;
    }

    this.ejecutarGuardado(estadoDestino);
  }

  cerrarModalPublicacion(): void {
    this.modalPublicacionAbierto = false;
    this.modalPublicacionCargando = false;
    this.modalPublicacionProcesando = false;
    this.convocatoriasActivasPendientes = [];
  }

  marcarConvocatoriaActivaComoPasada(idConvocatoria: number): void {
    if (this.modalPublicacionProcesando) {
      return;
    }

    this.modalPublicacionProcesando = true;

    this.convocatoriaService.marcarComoPasada(idConvocatoria).subscribe({
      next: () => {
        this.convocatoriasActivasPendientes = this.convocatoriasActivasPendientes.filter(
          (convocatoria) => convocatoria.idConvocatoria !== idConvocatoria
        );
        this.convocatorias = this.convocatorias.map((convocatoria) =>
          convocatoria.idConvocatoria === idConvocatoria
            ? { ...convocatoria, estado: 'p' }
            : convocatoria
        );
        this.modalPublicacionProcesando = false;
      },
      error: (error) => {
        this.modalPublicacionProcesando = false;
        this.feedback = error?.error?.message || 'No se pudo marcar la convocatoria como pasada.';
        this.feedbackError = true;
      }
    });
  }

  marcarTodasActivasComoPasadas(): void {
    if (this.modalPublicacionProcesando || this.convocatoriasActivasPendientes.length === 0) {
      return;
    }

    this.modalPublicacionProcesando = true;

    this.convocatoriaService.marcarTodasComoPasadas().subscribe({
      next: () => {
        const idsPasadas = new Set(this.convocatoriasActivasPendientes.map((convocatoria) => convocatoria.idConvocatoria));
        this.convocatorias = this.convocatorias.map((convocatoria) =>
          idsPasadas.has(convocatoria.idConvocatoria)
            ? { ...convocatoria, estado: 'p' }
            : convocatoria
        );
        this.convocatoriasActivasPendientes = [];
        this.modalPublicacionProcesando = false;
      },
      error: (error) => {
        this.modalPublicacionProcesando = false;
        this.feedback = error?.error?.message || 'No se pudieron marcar las convocatorias como pasadas.';
        this.feedbackError = true;
      }
    });
  }

  continuarPublicacionNueva(): void {
    this.cerrarModalPublicacion();
  }

  private ejecutarGuardado(estadoDestino: 'a' | 'b'): void {
    this.guardando = true;

    const payload = this.construirPayload(estadoDestino);

    this.convocatoriaService.guardar(payload).subscribe({
      next: (response) => {
        this.guardando = false;
        this.estadoInicialFormulario = this.serializarEstadoFormulario();
        this.router.navigate(['/coordinador/reuniones-de-equipo/convocatorias'], {
          state: {
            feedback: response.message,
            feedbackError: false
          }
        });
      },
      error: (error) => {
        this.guardando = false;
        this.feedback = error?.error?.message || 'No se pudo guardar la convocatoria.';
        this.feedbackError = true;
      }
    });
  }

  private construirPayload(estadoDestino: 'a' | 'b') {
    return {
      idConvocatoria: this.convocatoria.idConvocatoria ?? undefined,
      estado: estadoDestino,
      fechaHora: this.convocatoria.fechaHora,
      lugarId: this.convocatoria.lugarId,
      redactaId: this.convocatoria.redactaId,
      iniciaId: this.convocatoria.iniciaId,
      cursoId: this.convocatoria.cursoId,
      ordenDia: this.ordenDia.map((item) => ({
        minutos: item.minutos,
        ordenDia: item.ordenDia,
        objetivo: item.objetivo,
        dinamizaId: item.dinamizaId,
        lugarId: item.lugarId,
        participantes: item.participantes.map((participante) => ({ ...participante }))
      }))
    };
  }

  cancelarConvocatoria(): void {
    const hayCambios = this.hayCambiosSinGuardar();
    const confirmarSalida = !hayCambios || confirm('Hay cambios sin guardar. Si continúas, se perderán. ¿Deseas salir igualmente?');

    if (!confirmarSalida) {
      return;
    }

    this.router.navigate(['/coordinador/reuniones-de-equipo/convocatorias']);
  }

  esFechaPasada(fechaStr: string): boolean {
    if (!fechaStr) return false;
    const fechaConvocatoria = new Date(fechaStr);
    return fechaConvocatoria.getTime() <= Date.now();
  }

  formatFecha(fechaStr: string): string {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return fechaStr;
    return fecha.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  get minutosTotales(): number {
    return this.ordenDia.reduce((total, item) => total + Number(item.minutos || 0), 0);
  }

  get minutosTotalesDetalle(): number {
    if (!this.convocatoriaSeleccionada || !this.convocatoriaSeleccionada.ordenDia) return 0;
    return this.convocatoriaSeleccionada.ordenDia.reduce((total: number, item: any) => total + Number(item.minutos || 0), 0);
  }

  get cursoActualLabel(): string {
    return this.cursosAcademicos.find((curso) => curso.idCurso === this.convocatoria.cursoId)
      ? this.getCursoLabel(this.convocatoria.cursoId)
      : 'Sin curso';
  }

  get fechaHoraResumen(): string {
    if (!this.convocatoria.fechaHora) {
      return 'Sin programar';
    }

    const fecha = new Date(this.convocatoria.fechaHora);

    if (Number.isNaN(fecha.getTime())) {
      return this.convocatoria.fechaHora;
    }

    return fecha.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  get redactaLabel(): string {
    return this.getProfesorNombre(this.convocatoria.redactaId) || 'Selecciona un profesor';
  }

  get iniciaLabel(): string {
    return this.getProfesorNombre(this.convocatoria.iniciaId) || 'Pendiente de decidir';
  }

  get avisoFormulario(): string {
    return this.convocatoria.iniciaId === null
      ? 'Aviso: puedes guardar o publicar sin indicar todavía quién inicia la reunión.'
      : '';
  }

  get modalPublicacionTitulo(): string {
    return this.modalPublicacionModo === 'archivar' ? 'Archivar convocatorias' : 'Publicar convocatoria';
  }

  get modalPublicacionDescripcion(): string {
    return this.modalPublicacionModo === 'archivar'
      ? 'Marca como pasadas las convocatorias activas que ya deban ir al histórico.'
      : 'Antes de publicar esta convocatoria, puedes marcar como pasadas las que sigan activas.';
  }

  get modalPublicacionAccionFinal(): string {
    return this.modalPublicacionModo === 'archivar' ? 'Cerrar' : 'Publicar convocatoria';
  }

  getCursoLabel(cursoId: number | null): string {
    const curso = this.cursosAcademicos.find((item) => item.idCurso === cursoId);
    return curso ? `${curso.anioInicio}/${curso.anioFin}` : 'Sin curso';
  }

  getLugarNombre(lugarId: number | null): string {
    return this.lugares.find((item) => item.idLugar === lugarId)?.nombre || '';
  }

  getProfesorNombre(profesorId: number | null): string {
    return this.profesores.find((item) => item.idProfesor === profesorId)?.nombre || '';
  }

  getGrupoNombre(grupoId: number | null): string {
    return this.grupos.find((item) => item.idGrupo === grupoId)?.nombre || '';
  }

  getParticipanteEtiqueta(participante: ParticipanteDto): string {
    return participante.tipo === 'grupo' ? 'Grupo' : 'Profesor';
  }

  getParticipanteClase(participante: ParticipanteDto): string {
    return participante.tipo === 'grupo' ? 'chip-tipo-grupo' : 'chip-tipo-profesor';
  }

  getParticipanteNombres(participantes: ParticipanteDto[]): string[] {
    return participantes.map((participante) => participante.nombre);
  }

  getEstadoLabel(estado?: string | null): string {
    switch (estado) {
      case 'a':
        return 'Activa';
      case 'b':
        return 'Borrador';
      case 'p':
        return 'Pasada';
      default:
        return 'Sin estado';
    }
  }

  getEstadoClase(estado?: string | null): string {
    switch (estado) {
      case 'a':
        return 'status-badge-activa';
      case 'b':
        return 'status-badge-borrador';
      case 'p':
        return 'status-badge-historica';
      default:
        return 'status-badge-historica';
    }
  }

  puedeEditar(estado?: string | null): boolean {
    return estado !== 'p';
  }

  get convocatoriasActivas(): ConvocatoriaListaItemDto[] {
    return this.convocatorias.filter((convocatoria) => convocatoria.estado === 'a');
  }

  get convocatoriasPasadas(): ConvocatoriaListaItemDto[] {
    return this.convocatorias.filter((convocatoria) => convocatoria.estado === 'p');
  }

  get convocatoriasBorradores(): ConvocatoriaListaItemDto[] {
    return this.convocatorias.filter((convocatoria) => convocatoria.estado === 'b');
  }

  get botonArchivarDeshabilitado(): boolean {
    return this.convocatoriasActivas.length === 0;
  }

  getParticipantesResumen(item: OrdenDiaCoordinadorDto): string {
    if (item.participantes.length === 0) {
      return 'Seleccionar participantes';
    }

    return `${item.participantes.length} participante${item.participantes.length === 1 ? '' : 's'}`;
  }

  getParticipantesSeleccionados(item: OrdenDiaCoordinadorDto): ParticipanteDto[] {
    return item.participantes;
  }

  getParticipantesPreview(item: OrdenDiaCoordinadorDto, limite = 4): ParticipanteDto[] {
    return item.participantesExpandido ? item.participantes : item.participantes.slice(0, limite);
  }

  getParticipantesRestantes(item: OrdenDiaCoordinadorDto, limite = 4): number {
    return Math.max(item.participantes.length - limite, 0);
  }

  toggleParticipantesExpandido(item: OrdenDiaCoordinadorDto): void {
    item.participantesExpandido = !item.participantesExpandido;
  }

  getDinamizaLabelFila(item: OrdenDiaCoordinadorDto): string {
    return this.getProfesorNombre(item.dinamizaId) || 'Selecciona';
  }

  getLugarLabelFila(item: OrdenDiaCoordinadorDto): string {
    return this.getLugarNombre(item.lugarId) || 'Selecciona';
  }

  getTodasOpcionesParticipantes(): ParticipanteBusqueda[] {
    return this.obtenerParticipantesDisponibles();
  }

  private obtenerParticipantesDisponibles(): ParticipanteBusqueda[] {
    return [
      ...this.profesores.map((profesor) => ({
        idParticipante: profesor.idProfesor,
        tipo: 'profesor' as const,
        nombre: profesor.nombre
      })),
      ...this.grupos.map((grupo) => ({
        idParticipante: grupo.idGrupo,
        tipo: 'grupo' as const,
        nombre: grupo.nombre
      }))
    ];
  }

  private ordenarListado(convocatorias: ConvocatoriaListaItemDto[]): ConvocatoriaListaItemDto[] {
    return [...convocatorias].sort((a, b) => {
      return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
    });
  }

  private aplicarEstadoNavegacion(): void {
    const navigation = this.router.getCurrentNavigation();
    const state = (navigation?.extras?.state ?? history.state) as {
      feedback?: string;
      feedbackError?: boolean;
    };

    if (state?.feedback) {
      this.feedback = state.feedback;
      this.feedbackError = !!state.feedbackError;
    }
  }

  private hayCambiosSinGuardar(): boolean {
    return this.estadoInicialFormulario !== this.serializarEstadoFormulario();
  }

  private serializarEstadoFormulario(): string {
    return JSON.stringify({
      convocatoria: {
        idConvocatoria: this.convocatoria.idConvocatoria,
        fechaHora: this.convocatoria.fechaHora,
        lugarId: this.convocatoria.lugarId,
        redactaId: this.convocatoria.redactaId,
        iniciaId: this.convocatoria.iniciaId,
        cursoId: this.convocatoria.cursoId
      },
      ordenDia: this.ordenDia.map((item) => ({
        minutos: item.minutos,
        ordenDia: item.ordenDia,
        objetivo: item.objetivo,
        dinamizaId: item.dinamizaId,
        lugarId: item.lugarId,
        participantes: item.participantes
          .map((participante) => ({
            idParticipante: participante.idParticipante,
            tipo: participante.tipo
          }))
          .sort((a, b) => `${a.tipo}:${a.idParticipante}`.localeCompare(`${b.tipo}:${b.idParticipante}`))
      }))
    });
  }

  private normalizarTexto(valor: string | null | undefined): string {
    return (valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private createEmptyFila(): OrdenDiaCoordinadorDto {
    return {
      minutos: null,
      ordenDia: '',
      objetivo: '',
      dinamizaId: null,
      lugarId: null,
      participantes: [],
      dinamizaQuery: '',
      dinamizaOpen: false,
      lugarQuery: '',
      lugarOpen: false,
      participantesExpandido: false,
      participaQuery: '',
      participaOpen: false
    };
  }
}
