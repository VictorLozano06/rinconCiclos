import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RecursoFormularioComponent, AdjuntoFormulario } from '../../../components/recurso-formulario/recurso-formulario.component';
import { CategoriaDto } from '../../../dto/categoria.dto';
import { CicloRecursoDto } from '../../../dto/ciclo-recurso.dto';
import { RecursoDto } from '../../../dto/recurso.dto';
import { CategoriaService } from '../../../services/categoria.service';
import { RecursoService, RecursoFormularioResponse } from '../../../services/recurso.service';

interface CursoFiltro {
  idCurso: number;
  etiqueta: string;
}

type CategoriaFormulario = Pick<CategoriaDto, 'idCategoria' | 'nombre'>;
type CicloFormulario = CicloRecursoDto;

interface RecursoFormulario {
  idCategoria: number | null;
  nombre: string;
  descripcion: string;
  cursoId: number | null;
  ciclosSeleccionados: number[];
  enlaces: AdjuntoFormulario[];
  archivos: AdjuntoFormulario[];
}

@Component({
  selector: 'app-recurso-formulario-page',
  standalone: true,
  imports: [CommonModule, RecursoFormularioComponent],
  templateUrl: './recurso-formulario.component.html',
  styleUrl: './recurso-formulario.component.css'
})
export class RecursoFormularioPageComponent implements OnInit {
  public modoFormulario: 'crear' | 'editar' = 'crear';
  public categoriasBase: CategoriaDto[] = [];
  public cursosFiltro: CursoFiltro[] = [];
  public ciclosFormulario: CicloFormulario[] = [];
  public cargando = true;
  public guardando = false;
  public errorCarga = false;
  public erroresFormulario: string[] = [];
  public formulario: RecursoFormulario = this.crearFormularioVacio();
  public nuevoCicloId: number | null = null;
  public nuevoNombreEnlace = '';
  public nuevoEnlace = '';
  private recursoOriginal: RecursoDto | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recursoService: RecursoService,
    private categoriaService: CategoriaService
  ) {}

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.modoFormulario = data['modoFormulario'] === 'editar' ? 'editar' : 'crear';
      this.cargarContextoFormulario();
    });
  }

  get categoriasFormulario(): CategoriaFormulario[] {
    return this.obtenerCategoriasRecurso(this.categoriasBase)
      .map((categoria) => ({
        idCategoria: categoria.idCategoria,
        nombre: categoria.nombre
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  get tituloFormulario(): string {
    return this.modoFormulario === 'crear' ? 'Crear recurso' : 'Editar recurso';
  }

  get textoIntroFormulario(): string {
    return this.modoFormulario === 'crear'
      ? 'Formulario de coordinacion con FilePond para subir archivos temporales al servidor.'
      : 'Formulario de edicion con FilePond para subir archivos nuevos al servidor antes de actualizar.';
  }

  get textoBotonGuardar(): string {
    return this.guardando
      ? (this.modoFormulario === 'crear' ? 'Guardando...' : 'Actualizando...')
      : (this.modoFormulario === 'crear' ? 'Guardar' : 'Actualizar');
  }

  actualizarNuevoEnlace(valor: string): void {
    this.nuevoEnlace = valor;
  }

  actualizarNuevoNombreEnlace(valor: string): void {
    this.nuevoNombreEnlace = valor;
  }

  agregarCiclo(): void {
    if (this.nuevoCicloId === null) {
      return;
    }

    if (!this.formulario.ciclosSeleccionados.includes(this.nuevoCicloId)) {
      this.formulario.ciclosSeleccionados = [...this.formulario.ciclosSeleccionados, this.nuevoCicloId].sort((a, b) => a - b);
    }

    this.nuevoCicloId = this.obtenerSiguienteCicloDisponible();
  }

  eliminarCiclo(idCiclo: number): void {
    this.formulario.ciclosSeleccionados = this.formulario.ciclosSeleccionados.filter((ciclo) => ciclo !== idCiclo);
    if (this.nuevoCicloId === idCiclo) {
      this.nuevoCicloId = this.obtenerSiguienteCicloDisponible();
    }
  }

  agregarEnlace(): void {
    const nombre = this.nuevoNombreEnlace.trim();
    const enlace = this.nuevoEnlace.trim();

    if (!nombre || !enlace) {
      return;
    }

    this.formulario.enlaces = [...this.formulario.enlaces, { nombre, valor: enlace }];
    this.nuevoNombreEnlace = '';
    this.nuevoEnlace = '';
  }

  eliminarEnlace(index: number): void {
    this.formulario.enlaces = this.formulario.enlaces.filter((_, i) => i !== index);
  }

  // Añade al formulario el archivo ya subido temporalmente por FilePond.
  // Añade al array del formulario un archivo que ya existe en la carpeta temporal.
  // Aqui todavia no se ha guardado el recurso: solo tenemos el archivo provisional.
  agregarArchivoSubido(adjunto: AdjuntoFormulario): void {
    const yaExiste = this.formulario.archivos.some(
      (archivo) => archivo.identificadorTemporal && archivo.identificadorTemporal === adjunto.identificadorTemporal
    );

    if (yaExiste) {
      return;
    }

    this.formulario.archivos = [...this.formulario.archivos, adjunto];
  }

  eliminarArchivo(index: number): void {
    const archivo = this.formulario.archivos[index];
    if (!archivo) {
      return;
    }

    if (!archivo.identificadorTemporal) {
      this.formulario.archivos = this.formulario.archivos.filter((_, i) => i !== index);
      return;
    }

    this.recursoService.eliminarArchivoTemporalSubido(archivo.identificadorTemporal).subscribe({
      next: () => {
        this.formulario.archivos = this.formulario.archivos.filter((_, i) => i !== index);
      },
      error: (err) => {
        console.error('Error al borrar el archivo temporal:', err);
        this.erroresFormulario = ['No se pudo eliminar el archivo temporal. Intentalo de nuevo.'];
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/coordinador/recursos']);
  }

  guardarFormulario(): void {
    this.erroresFormulario = this.validarFormulario();

    if (this.erroresFormulario.length > 0) {
      return;
    }

    if (this.modoFormulario === 'editar' && !this.recursoOriginal) {
      return;
    }

    this.guardando = true;

    this.recursoService.guardar(this.construirPayloadGuardado()).subscribe({
      next: () => {
        this.guardando = false;
        this.router.navigate(['/coordinador/recursos'], {
          state: {
            feedbackAccion: this.modoFormulario === 'crear'
              ? 'Recurso guardado correctamente.'
              : 'Recurso actualizado correctamente.'
          }
        });
      },
      error: (err) => {
        this.guardando = false;
        this.erroresFormulario = [err?.error?.message || 'No se pudo guardar el recurso.'];
      }
    });
  }

  private cargarContextoFormulario(): void {
    this.cargando = true;
    this.errorCarga = false;

    this.categoriaService.getCategorias().subscribe({
      next: (categorias) => {
        this.categoriasBase = categorias;
        this.cargarDatosFormulario();
      },
      error: (err) => {
        this.errorCarga = true;
        this.cargando = false;
        console.error('Error al cargar categorias para el formulario de recursos:', err);
      }
    });
  }

  private cargarDatosFormulario(): void {
    this.recursoService.getFormulario().subscribe({
      next: (datosFormulario) => {
        this.prepararFormularioBase(datosFormulario);
        this.cargarRecursoEdicionSiHaceFalta();
      },
      error: (err) => {
        this.errorCarga = true;
        this.cargando = false;
        console.error('Error al cargar cursos y ciclos para el formulario de coordinador:', err);
      }
    });
  }

  private prepararFormularioBase(datosFormulario: RecursoFormularioResponse): void {
    this.cursosFiltro = this.construirCursosFiltro(datosFormulario);
    this.ciclosFormulario = this.construirCiclosFormulario(datosFormulario);

    if (this.modoFormulario === 'crear') {
      this.prepararFormularioCreacion(datosFormulario.cursoActualId);
      this.cargando = false;
    }
  }

  private cargarRecursoEdicionSiHaceFalta(): void {
    if (this.modoFormulario !== 'editar') {
      return;
    }

    const idCategoria = Number(this.route.snapshot.paramMap.get('idCategoria'));
    const numRecurso = Number(this.route.snapshot.paramMap.get('numRecurso'));

    this.recursoService.getDetalle(idCategoria, numRecurso).subscribe({
      next: (recurso) => {
        this.recursoOriginal = recurso;
        this.formulario = {
          idCategoria: recurso.idCategoria,
          nombre: recurso.nombre,
          descripcion: recurso.descripcion,
          cursoId: recurso.idCurso,
          ciclosSeleccionados: (recurso.ciclos || []).map((ciclo) => ciclo.idCiclo),
          enlaces: this.obtenerEnlacesRecurso(recurso),
          archivos: this.obtenerArchivosRecurso(recurso)
        };
        this.nuevoEnlace = '';
        this.nuevoNombreEnlace = '';
        this.nuevoCicloId = this.obtenerSiguienteCicloDisponible();
        this.erroresFormulario = [];
        this.cargando = false;
      },
      error: (err) => {
        this.errorCarga = true;
        this.cargando = false;
        console.error('Error al cargar el recurso que se va a editar:', err);
      }
    });
  }

  private prepararFormularioCreacion(cursoActualId: number | null): void {
    const primerCurso = this.cursosFiltro[0];

    this.recursoOriginal = null;
    this.formulario = this.crearFormularioVacio();
    this.formulario.idCategoria = this.categoriasFormulario[0]?.idCategoria ?? null;
    this.formulario.cursoId = cursoActualId || primerCurso?.idCurso || null;
    this.nuevoEnlace = '';
    this.nuevoNombreEnlace = '';
    this.nuevoCicloId = this.obtenerSiguienteCicloDisponible();
    this.erroresFormulario = [];
  }

  private crearFormularioVacio(): RecursoFormulario {
    return {
      idCategoria: null,
      nombre: '',
      descripcion: '',
      cursoId: null,
      ciclosSeleccionados: [],
      enlaces: [],
      archivos: []
    };
  }

  // Solo deja categorias finales de recursos.
  // No se admiten padres ni la rama de Reuniones de Equipo.
  private obtenerCategoriasRecurso(categorias: CategoriaDto[]): CategoriaDto[] {
    const resultado: CategoriaDto[] = [];

    for (const categoria of categorias) {
      const tieneHijos = !!(categoria.subcategorias && categoria.subcategorias.length > 0);

      if (categoria.nombre === 'Reuniones de Equipo') {
        continue;
      }

      if (tieneHijos) {
        resultado.push(...this.obtenerCategoriasRecurso(categoria.subcategorias || []));
        continue;
      }

      resultado.push(categoria);
    }

    return resultado;
  }

  private construirCursosFiltro(datosFormulario: RecursoFormularioResponse): CursoFiltro[] {
    return datosFormulario.cursos
      .map((curso) => ({
        idCurso: curso.idCurso,
        etiqueta: `${curso.anioInicio}/${curso.anioFin}`
      }))
      .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta));
  }

  private construirPayloadGuardado(): object {
    return {
      idCategoria: this.formulario.idCategoria,
      numRecurso: this.modoFormulario === 'editar' ? (this.recursoOriginal?.numRecurso || 0) : 0,
      nombre: this.formulario.nombre.trim(),
      descripcion: this.formulario.descripcion.trim(),
      idCurso: this.formulario.cursoId,
      ciclosSeleccionados: this.formulario.ciclosSeleccionados,
      enlaces: this.formulario.enlaces.map((enlace) => ({
        nombre: enlace.nombre.trim(),
        valor: enlace.valor.trim()
      })),
      archivos: this.formulario.archivos.map((archivo) => ({
        nombre: archivo.nombre.trim(),
        valor: archivo.valor.trim(),
        identificadorTemporal: archivo.identificadorTemporal || null
      }))
    };
  }

  private construirCiclosFormulario(datosFormulario: RecursoFormularioResponse): CicloFormulario[] {
    return datosFormulario.ciclos
      .map((ciclo) => ({
        idCiclo: ciclo.idCiclo,
        nombre: ciclo.nombre
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  private obtenerSiguienteCicloDisponible(): number | null {
    const cicloLibre = this.ciclosFormulario.find(
      (ciclo) => !this.formulario.ciclosSeleccionados.includes(ciclo.idCiclo)
    );

    return cicloLibre?.idCiclo ?? null;
  }

  private obtenerEnlacesRecurso(recurso: RecursoDto): AdjuntoFormulario[] {
    const enlacesDetalle = recurso.enlacesDetalle || [];
    if (enlacesDetalle.length > 0) {
      return enlacesDetalle.map((enlace) => ({ nombre: enlace.nombre, valor: enlace.url }));
    }

    return (recurso.urls || []).map((url, index) => ({
      nombre: `Acceso ${index + 1}`,
      valor: url
    }));
  }

  private obtenerArchivosRecurso(recurso: RecursoDto): AdjuntoFormulario[] {
    const archivosDetalle = recurso.archivosDetalle || [];
    if (archivosDetalle.length > 0) {
      return archivosDetalle.map((archivo) => ({ nombre: archivo.nombre, valor: archivo.archivo }));
    }

    return (recurso.archivos || []).map((archivo, index) => ({
      nombre: `Adjunto ${index + 1}`,
      valor: archivo
    }));
  }

  private validarFormulario(): string[] {
    const errores: string[] = [];
    const nombre = this.formulario.nombre.trim();
    const descripcion = this.formulario.descripcion.trim();

    if (!nombre) {
      errores.push('El titulo es obligatorio.');
    } else if (nombre.length > 150) {
      errores.push('El titulo no puede superar los 150 caracteres.');
    }

    if (!descripcion) {
      errores.push('La descripcion es obligatoria.');
    }

    if (!this.formulario.idCategoria) {
      errores.push('Debes seleccionar una subcategoria.');
    }

    if (!this.formulario.cursoId) {
      errores.push('Debes seleccionar un curso.');
    }

    if (this.formulario.enlaces.length === 0 && this.formulario.archivos.length === 0) {
      errores.push('Debes anadir al menos un archivo o un enlace.');
    }

    if (this.formulario.archivos.length > 10) {
      errores.push('No puedes anadir mas de 10 archivos.');
    }

    if (this.formulario.enlaces.length > 10) {
      errores.push('No puedes anadir mas de 10 enlaces.');
    }

    const tamanoTotalArchivos = this.formulario.archivos.reduce((total, archivo) => total + (archivo.tamanoBytes || 0), 0);
    if (tamanoTotalArchivos > 25 * 1024 * 1024) {
      errores.push('El tamano total de archivos no puede superar los 25 MB.');
    }

    for (const archivo of this.formulario.archivos) {
      if (!archivo.nombre.trim()) {
        errores.push('Cada archivo necesita un nombre visible.');
      }

      if (!this.esArchivoValido(archivo.valor)) {
        errores.push(`Formato de archivo no permitido: ${archivo.valor}`);
      }
    }

    for (const enlace of this.formulario.enlaces) {
      if (!enlace.nombre.trim()) {
        errores.push('Cada enlace necesita un nombre visible.');
      }

      if (!this.esUrlValida(enlace.valor)) {
        errores.push(`URL no valida: ${enlace.valor}`);
      }
    }

    return errores;
  }

  private esArchivoValido(archivo: string): boolean {
    return /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i.test(archivo.trim());
  }

  private esUrlValida(url: string): boolean {
    try {
      const parsed = new URL(url.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
