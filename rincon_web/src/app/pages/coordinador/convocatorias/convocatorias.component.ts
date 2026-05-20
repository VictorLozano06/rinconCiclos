import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import {
  ConvocatoriaService,
  CursoOption,
  GuardarConvocatoriaPayload,
  LugarOption,
  ProfesorOption
} from '../../../services/convocatoria.service';
import {
  OrdenDiaItemCoordinador,
  ProfesorField
} from '../../../dto/convocatoria.dto';

@Component({
  selector: 'app-convocatorias-coordinador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './convocatorias.component.html',
  styleUrl: './convocatorias.component.css'
})
export class ConvocatoriasComponent implements OnInit {
  vista: 'listado' | 'formulario' | 'detalle' = 'listado';
  convocatorias: any[] = [];
  cargandoListado = true;
  convocatoriaSeleccionada: any = null;

  convocatoria = {
    idConvocatoria: null as number | null,
    titulo: 'Nueva Convocatoria',
    subtitulo: 'Configura los campos que encajan con la estructura actual de la base de datos.',
    fechaHora: '',
    lugarId: null as number | null,
    redactaId: null as number | null,
    iniciaId: null as number | null,
    cursoId: null as number | null
  };

  cursosAcademicos: CursoOption[] = [];
  lugares: LugarOption[] = [];
  profesores: ProfesorOption[] = [];

  cargandoFormulario = true;
  guardando = false;
  errorFormulario = '';
  feedback = '';
  feedbackError = false;

  redactaOpen = false;
  redactaQuery = '';
  iniciaOpen = false;
  iniciaQuery = '';

  ordenDia: OrdenDiaItemCoordinador[] = [this.createEmptyFila()];

  constructor(
    private convocatoriaService: ConvocatoriaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarFormulario();
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      const url = this.router.url;

      if (url.includes('/crear')) {
        this.iniciarCreacion();
      } else if (idParam) {
        const id = Number(idParam);
        if (url.endsWith('/editar')) {
          this.iniciarEdicion(id);
        } else {
          this.iniciarDetalle(id);
        }
      } else {
        this.vista = 'listado';
        this.cargarConvocatorias();
      }
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
        if (!this.convocatoria.cursoId) {
          this.convocatoria.cursoId = data.cursoActualId;
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
    this.convocatoriaService.listarConvocatorias().subscribe({
      next: (data) => {
        this.convocatorias = data;
        this.cargandoListado = false;
      },
      error: (error) => {
        this.cargandoListado = false;
        this.errorFormulario = error?.error?.message || 'Error al cargar el listado de convocatorias.';
      }
    });
  }

  // Navigation triggered from UI
  crearNueva(): void {
    this.router.navigate(['/coordinador/reuniones-de-equipo/convocatorias/crear']);
  }

  editarConvocatoria(id: number): void {
    this.router.navigate(['/coordinador/reuniones-de-equipo/convocatorias', id, 'editar']);
  }

  verConvocatoria(id: number): void {
    this.router.navigate(['/coordinador/reuniones-de-equipo/convocatorias', id]);
  }

  volverAlListado(): void {
    this.router.navigate(['/coordinador/reuniones-de-equipo/convocatorias']);
  }

  // Route initializers
  iniciarCreacion(): void {
    this.convocatoria = {
      idConvocatoria: null,
      titulo: 'Nueva Convocatoria',
      subtitulo: 'Configura los campos que encajan con la estructura actual de la base de datos.',
      fechaHora: '',
      lugarId: null,
      redactaId: null,
      iniciaId: null,
      cursoId: this.cursosAcademicos.length > 0 ? this.cursosAcademicos[0].idCurso : null
    };
    this.ordenDia = [this.createEmptyFila()];
    this.vista = 'formulario';
    this.feedback = '';
    this.feedbackError = false;
  }

  iniciarEdicion(id: number): void {
    this.cargandoFormulario = true;
    this.errorFormulario = '';
    this.vista = 'formulario';
    this.feedback = '';
    this.feedbackError = false;

    this.convocatoriaService.getConvocatoria(id).subscribe({
      next: (data) => {
        this.convocatoria = {
          idConvocatoria: data.idConvocatoria,
          titulo: 'Editar Convocatoria',
          subtitulo: 'Modifica los campos del orden del día y responsables de la sesión.',
          fechaHora: data.fecha ? data.fecha.substring(0, 16) : '',
          lugarId: data.idLugar ? Number(data.idLugar) : null,
          redactaId: data.idProfesorRedactaActa ? Number(data.idProfesorRedactaActa) : null,
          iniciaId: data.idProfesorIniciaReunion ? Number(data.idProfesorIniciaReunion) : null,
          cursoId: data.idCurso ? Number(data.idCurso) : null
        };

        if (data.ordenDia && data.ordenDia.length > 0) {
          this.ordenDia = data.ordenDia.map((item: any) => ({
            minutos: item.minutos ? Number(item.minutos) : null,
            ordenDia: item.descripcion || '',
            objetivo: item.objetivo || '',
            dinamizaId: item.idProfesorDinamiza ? Number(item.idProfesorDinamiza) : null,
            lugarId: item.idLugar ? Number(item.idLugar) : null,
            participaIds: (item.participantes || []).map((p: any) => Number(p.idProfesor)),
            participaQuery: '',
            participaOpen: false
          }));
        } else {
          this.ordenDia = [this.createEmptyFila()];
        }

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

  toggleProfesorDropdown(field: ProfesorField): void {
    if (field === 'redacta') {
      this.redactaOpen = !this.redactaOpen;
      this.iniciaOpen = false;
      return;
    }

    this.iniciaOpen = !this.iniciaOpen;
    this.redactaOpen = false;
  }

  getProfesoresFieldFiltrados(field: ProfesorField): ProfesorOption[] {
    const query = (field === 'redacta' ? this.redactaQuery : this.iniciaQuery).trim().toLowerCase();

    return this.profesores
      .filter((profesor) => !query || profesor.nombre.toLowerCase().includes(query))
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

  toggleParticipa(item: OrdenDiaItemCoordinador): void {
    item.participaOpen = !item.participaOpen;
  }

  getProfesoresFiltrados(item: OrdenDiaItemCoordinador): ProfesorOption[] {
    const query = item.participaQuery.trim().toLowerCase();

    return this.profesores
      .filter((profesor) => !item.participaIds.includes(profesor.idProfesor))
      .filter((profesor) => !query || profesor.nombre.toLowerCase().includes(query))
      .slice(0, 8);
  }

  addProfesor(item: OrdenDiaItemCoordinador, profesorId: number): void {
    if (!item.participaIds.includes(profesorId)) {
      item.participaIds.push(profesorId);
    }

    item.participaQuery = '';
    item.participaOpen = true;
  }

  removeProfesor(item: OrdenDiaItemCoordinador, profesorId: number): void {
    item.participaIds = item.participaIds.filter((selected: number) => selected !== profesorId);
  }

  eliminarConvocatoria(id: number, event: Event): void {
    event.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar esta convocatoria y todo su orden del día?')) {
      this.convocatoriaService.eliminar(id).subscribe({
        next: (response) => {
          this.feedback = response.message;
          this.feedbackError = false;
          this.cargarConvocatorias();
          setTimeout(() => (this.feedback = ''), 3000);
        },
        error: (error) => {
          this.feedback = error?.error?.message || 'No se pudo eliminar la convocatoria.';
          this.feedbackError = true;
          setTimeout(() => (this.feedback = ''), 3000);
        }
      });
    }
  }

  guardarConvocatoria(): void {
    this.feedback = '';
    this.feedbackError = false;

    const payload: GuardarConvocatoriaPayload = {
      idConvocatoria: this.convocatoria.idConvocatoria || undefined,
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
        participaIds: item.participaIds
      }))
    };

    this.guardando = true;

    this.convocatoriaService.guardar(payload).subscribe({
      next: (response) => {
        this.guardando = false;
        this.feedback = response.message;
        this.feedbackError = false;
        setTimeout(() => {
          this.volverAlListado();
        }, 1500);
      },
      error: (error) => {
        this.guardando = false;
        this.feedback = error?.error?.message || 'No se pudo guardar la convocatoria.';
        this.feedbackError = true;
      }
    });
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
    return this.getProfesorNombre(this.convocatoria.iniciaId) || 'Selecciona un profesor';
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

  getParticipanteNombres(ids: number[]): string[] {
    return ids
      .map((id) => this.getProfesorNombre(id))
      .filter((nombre) => nombre !== '');
  }

  private createEmptyFila(): OrdenDiaItemCoordinador {
    return {
      minutos: null,
      ordenDia: '',
      objetivo: '',
      dinamizaId: null,
      lugarId: null,
      participaIds: [],
      participaQuery: '',
      participaOpen: false
    };
  }
}
