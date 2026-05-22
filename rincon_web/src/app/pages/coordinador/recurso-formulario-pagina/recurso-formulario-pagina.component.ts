import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RecursoFormularioMockComponent } from '../../../components/recurso-formulario-mock/recurso-formulario-mock.component';
import { CategoriaDto } from '../../../dto/categoria.dto';
import { CicloRecursoDto } from '../../../dto/ciclo-recurso.dto';
import { RecursoDto } from '../../../dto/recurso.dto';
import { CategoriaService } from '../../../services/categoria.service';
import { RecursoService } from '../../../services/recurso.service';

interface CursoFiltro {
  idCurso: number | 'Todos';
  etiqueta: string;
}

type CategoriaFormulario = Pick<CategoriaDto, 'idCategoria' | 'nombre'>;
type CicloFormulario = CicloRecursoDto;

interface RecursoFormularioMock {
  idCategoria: number | null;
  nombre: string;
  descripcion: string;
  cursoId: number | null;
  ciclosSeleccionados: number[];
  enlaces: string[];
  archivos: string[];
}

@Component({
  selector: 'app-recurso-formulario-pagina',
  standalone: true,
  imports: [CommonModule, RecursoFormularioMockComponent],
  templateUrl: './recurso-formulario-pagina.component.html',
  styleUrl: './recurso-formulario-pagina.component.css'
})
export class RecursoFormularioPaginaComponent implements OnInit {
  public modoFormulario: 'crear' | 'editar' = 'crear';
  public categoriasBase: CategoriaDto[] = [];
  public cursosFiltro: CursoFiltro[] = [];
  public ciclosFormulario: CicloFormulario[] = [];
  public cargando = true;
  public errorCarga = false;
  public erroresFormulario: string[] = [];
  public formulario: RecursoFormularioMock = this.crearFormularioVacio();
  public nuevoCicloId: number | null = null;
  public nuevoEnlace = '';
  public nuevoArchivo = '';
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
    const mapa = new Map<number, string>();
    this.recorrerCategorias(this.categoriasBase, mapa);

    return Array.from(mapa.entries())
      .map(([idCategoria, nombre]) => ({ idCategoria, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  get tituloFormulario(): string {
    return this.modoFormulario === 'crear' ? 'Crear recurso' : 'Editar recurso';
  }

  get textoIntroFormulario(): string {
    return this.modoFormulario === 'crear'
      ? 'Formulario mock de alta para coordinacion. No guarda nada en backend.'
      : 'Formulario mock de edicion para coordinacion. Carga el recurso real, pero no guarda cambios.';
  }

  get textoBotonGuardar(): string {
    return this.modoFormulario === 'crear' ? 'Guardar' : 'Actualizar';
  }

  actualizarNuevoEnlace(valor: string): void {
    this.nuevoEnlace = valor;
  }

  actualizarNuevoArchivo(valor: string): void {
    this.nuevoArchivo = valor;
  }

  agregarCicloMock(): void {
    if (this.nuevoCicloId === null) {
      return;
    }

    if (!this.formulario.ciclosSeleccionados.includes(this.nuevoCicloId)) {
      this.formulario.ciclosSeleccionados = [...this.formulario.ciclosSeleccionados, this.nuevoCicloId].sort((a, b) => a - b);
    }

    this.nuevoCicloId = this.obtenerSiguienteCicloDisponible();
  }

  eliminarCicloMock(idCiclo: number): void {
    this.formulario.ciclosSeleccionados = this.formulario.ciclosSeleccionados.filter((ciclo) => ciclo !== idCiclo);
    if (this.nuevoCicloId === idCiclo) {
      this.nuevoCicloId = this.obtenerSiguienteCicloDisponible();
    }
  }

  agregarEnlaceMock(): void {
    const enlace = this.nuevoEnlace.trim();

    if (!enlace) {
      return;
    }

    this.formulario.enlaces = [...this.formulario.enlaces, enlace];
    this.nuevoEnlace = '';
  }

  eliminarEnlaceMock(index: number): void {
    this.formulario.enlaces = this.formulario.enlaces.filter((_, i) => i !== index);
  }

  agregarArchivoMock(): void {
    const archivo = this.nuevoArchivo.trim();

    if (!archivo) {
      return;
    }

    this.formulario.archivos = [...this.formulario.archivos, archivo];
    this.nuevoArchivo = '';
  }

  eliminarArchivoMock(index: number): void {
    this.formulario.archivos = this.formulario.archivos.filter((_, i) => i !== index);
  }

  cancelar(): void {
    this.router.navigate(['/coordinador/recursos']);
  }

  guardarMock(): void {
    this.erroresFormulario = this.validarFormularioMock();

    if (this.erroresFormulario.length > 0) {
      return;
    }

    if (this.modoFormulario === 'crear') {
      this.router.navigate(['/coordinador/recursos'], {
        state: { feedbackMock: 'Mock de creacion completado. No se ha creado ningun recurso real.' }
      });
      return;
    }

    if (!this.recursoOriginal) {
      return;
    }

    this.router.navigate(['/coordinador/recursos'], {
      state: { feedbackMock: `Mock de edicion completado para "${this.recursoOriginal.nombre}". No se ha guardado nada.` }
    });
  }

  private cargarContextoFormulario(): void {
    this.cargando = true;
    this.errorCarga = false;

    this.categoriaService.getCategorias().subscribe({
      next: (categorias) => {
        this.categoriasBase = categorias;
        this.cargarRecursosBase();
      },
      error: (err) => {
        this.errorCarga = true;
        this.cargando = false;
        console.error('Error al cargar categorias para el formulario de recursos:', err);
      }
    });
  }

  private cargarRecursosBase(): void {
    this.recursoService.getTodos().subscribe({
      next: (recursos) => {
        this.prepararFormularioDesdeRecursos(recursos);
      },
      error: (err) => {
        this.errorCarga = true;
        this.cargando = false;
        console.error('Error al cargar recursos para el formulario de coordinador:', err);
      }
    });
  }

  private prepararFormularioDesdeRecursos(recursos: RecursoDto[]): void {
    this.cursosFiltro = this.construirCursosFiltro(recursos);
    this.ciclosFormulario = this.construirCiclosFormulario(recursos);

    if (this.modoFormulario === 'crear') {
      this.prepararFormularioCreacion();
      this.cargando = false;
      return;
    }

    const idCategoria = Number(this.route.snapshot.paramMap.get('idCategoria'));
    const numRecurso = Number(this.route.snapshot.paramMap.get('numRecurso'));
    const recurso = recursos.find(
      (item) => item.idCategoria === idCategoria && item.numRecurso === numRecurso
    ) || null;

    if (!recurso) {
      this.errorCarga = true;
      this.cargando = false;
      return;
    }

    this.recursoOriginal = recurso;
    this.formulario = {
      idCategoria: recurso.idCategoria,
      nombre: recurso.nombre,
      descripcion: recurso.descripcion,
      cursoId: recurso.idCurso,
      ciclosSeleccionados: (recurso.ciclos || []).map((ciclo) => ciclo.idCiclo),
      enlaces: this.obtenerEnlacesRecurso(recurso),
      archivos: [...(recurso.archivos || [])]
    };
    this.nuevoArchivo = '';
    this.nuevoEnlace = '';
    this.nuevoCicloId = this.obtenerSiguienteCicloDisponible();
    this.erroresFormulario = [];
    this.cargando = false;
  }

  private prepararFormularioCreacion(): void {
    const primerCurso = this.cursosFiltro.find((curso) => curso.idCurso !== 'Todos');

    this.recursoOriginal = null;
    this.formulario = this.crearFormularioVacio();
    this.formulario.idCategoria = this.categoriasFormulario[0]?.idCategoria ?? null;
    this.formulario.cursoId = typeof primerCurso?.idCurso === 'number' ? primerCurso.idCurso : null;
    this.nuevoArchivo = '';
    this.nuevoEnlace = '';
    this.nuevoCicloId = this.obtenerSiguienteCicloDisponible();
    this.erroresFormulario = [];
  }

  private crearFormularioVacio(): RecursoFormularioMock {
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

  private recorrerCategorias(categorias: CategoriaDto[], mapa: Map<number, string>): void {
    for (const categoria of categorias) {
      mapa.set(categoria.idCategoria, categoria.nombre);

      if (categoria.subcategorias && categoria.subcategorias.length > 0) {
        this.recorrerCategorias(categoria.subcategorias, mapa);
      }
    }
  }

  private construirCursosFiltro(recursos: RecursoDto[]): CursoFiltro[] {
    const cursos = new Map<number, string>();

    for (const recurso of recursos) {
      cursos.set(recurso.idCurso, `${recurso.anioInicio}/${recurso.anioFin}`);
    }

    return [
      { idCurso: 'Todos', etiqueta: 'Todos' },
      ...Array.from(cursos.entries()).map(([idCurso, etiqueta]) => ({ idCurso, etiqueta }))
    ];
  }

  private construirCiclosFormulario(recursos: RecursoDto[]): CicloFormulario[] {
    const ciclos = new Map<number, string>();

    for (const recurso of recursos) {
      for (const ciclo of recurso.ciclos || []) {
        ciclos.set(ciclo.idCiclo, ciclo.nombre);
      }
    }

    return Array.from(ciclos.entries())
      .map(([idCiclo, nombre]) => ({ idCiclo, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  private obtenerSiguienteCicloDisponible(): number | null {
    const cicloLibre = this.ciclosFormulario.find(
      (ciclo) => !this.formulario.ciclosSeleccionados.includes(ciclo.idCiclo)
    );

    return cicloLibre?.idCiclo ?? null;
  }

  private obtenerNombreCategoria(idCategoria: number): string {
    return this.categoriasFormulario.find((categoria) => categoria.idCategoria === idCategoria)?.nombre || 'Sin categoria';
  }

  private obtenerEnlacesRecurso(recurso: RecursoDto): string[] {
    const enlaces = [...(recurso.urls || [])];

    if (recurso.enlacePrincipal && !enlaces.includes(recurso.enlacePrincipal)) {
      enlaces.unshift(recurso.enlacePrincipal);
    }

    return enlaces;
  }

  private validarFormularioMock(): string[] {
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

    for (const archivo of this.formulario.archivos) {
      if (!this.esArchivoValido(archivo)) {
        errores.push(`Formato de archivo no permitido: ${archivo}`);
      }
    }

    for (const enlace of this.formulario.enlaces) {
      if (!this.esUrlValida(enlace)) {
        errores.push(`URL no valida: ${enlace}`);
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
