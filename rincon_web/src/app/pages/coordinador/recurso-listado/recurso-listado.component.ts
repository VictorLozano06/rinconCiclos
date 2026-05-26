import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RecursoItemComponent } from '../../../components/recurso-item/recurso-item.component';
import { CategoriaDto } from '../../../dto/categoria.dto';
import { RecursoDto } from '../../../dto/recurso.dto';
import { CategoriaService } from '../../../services/categoria.service';
import { RecursoService } from '../../../services/recurso.service';

interface RecursoGrupo {
  categoriaNombre: string;
  idCategoria: number;
  recursos: RecursoDto[];
}

interface CursoFiltro {
  idCurso: number | 'Todos';
  etiqueta: string;
}

interface CicloFiltro {
  idCiclo: number | 'Todos';
  nombre: string;
}

@Component({
  selector: 'app-recurso-listado-coordinador',
  standalone: true,
  imports: [CommonModule, RecursoItemComponent],
  templateUrl: './recurso-listado.component.html',
  styleUrl: './recurso-listado.component.css'
})
export class RecursoListadoCoordinadorComponent implements OnInit {
  public grupos: RecursoGrupo[] = [];
  public filtros: string[] = [];
  public filtroActivo = 'Todos';
  public cursosFiltro: CursoFiltro[] = [];
  public ciclosFiltro: CicloFiltro[] = [];
  public filtroCurso: number | 'Todos' = 'Todos';
  public filtroCiclo: number | 'Todos' = 'Todos';
  public cargando = true;
  public errorCarga = false;
  public eliminando = false;
  public feedbackAccion = '';

  constructor(
    private router: Router,
    private recursoService: RecursoService,
    private categoriaService: CategoriaService
  ) {}

  ngOnInit(): void {
    this.cargarRecursos();
  }

  cargarRecursos(): void {
    this.cargando = true;
    this.errorCarga = false;

    this.recursoService.getTodos().subscribe({
      next: (recursos) => {
        this.categoriaService.getCategorias().subscribe({
          next: (categorias) => {
            this.construirVista(recursos, categorias);
            this.feedbackAccion = history.state?.feedbackAccion || '';
            this.cargando = false;
          },
          error: (err) => {
            this.errorCarga = true;
            this.cargando = false;
            console.error('Error al cargar categorias para recursos de coordinador:', err);
          }
        });
      },
      error: (err) => {
        this.errorCarga = true;
        this.cargando = false;
        console.error('Error al cargar recursos para coordinador:', err);
      }
    });
  }

  cambiarFiltro(evento: Event): void {
    const selector = evento.target as HTMLSelectElement | null;
    this.filtroActivo = selector?.value || 'Todos';
  }

  cambiarCurso(evento: Event): void {
    const selector = evento.target as HTMLSelectElement | null;
    this.filtroCurso = selector?.value === 'Todos' ? 'Todos' : Number(selector?.value || 0);
  }

  cambiarCiclo(evento: Event): void {
    const selector = evento.target as HTMLSelectElement | null;
    this.filtroCiclo = selector?.value === 'Todos' ? 'Todos' : Number(selector?.value || 0);
  }

  // Aplica todos los filtros visibles sobre cada grupo antes de pintarlo.
  get gruposFiltrados(): RecursoGrupo[] {
    return this.grupos
      .filter((grupo) => this.filtroActivo === 'Todos' || grupo.categoriaNombre === this.filtroActivo)
      .map((grupo) => ({
        ...grupo,
        recursos: grupo.recursos.filter((recurso) =>
          this.coincideCurso(recurso) &&
          this.coincideCiclo(recurso)
        )
      }))
      .filter((grupo) => grupo.recursos.length > 0);
  }

  abrirEditarRecurso(recurso: RecursoDto): void {
    this.router.navigate(['/coordinador/recursos', recurso.idCategoria, recurso.numRecurso, 'editar']);
  }

  confirmarEliminarRecurso(recurso: RecursoDto): void {
    if (this.eliminando) {
      return;
    }

    const confirmar = window.confirm(`Vas a eliminar "${recurso.nombre}". Esta accion no se puede deshacer.`);
    if (!confirmar) {
      return;
    }

    this.eliminando = true;

    this.recursoService.eliminar(recurso.idCategoria, recurso.numRecurso).subscribe({
      next: () => {
        this.eliminando = false;
        this.feedbackAccion = `Recurso "${recurso.nombre}" eliminado correctamente.`;
        this.quitarRecursoDeLaVista(recurso.idCategoria, recurso.numRecurso);
      },
      error: (err) => {
        this.eliminando = false;
        console.error('Error al eliminar el recurso:', err);
        this.feedbackAccion = err?.error?.message || 'No se pudo eliminar el recurso.';
      }
    });
  }

  formatearCurso(recurso: RecursoDto): string {
    return `${recurso.anioInicio}/${recurso.anioFin}`;
  }

  formatearCiclos(recurso: RecursoDto): string {
    return (recurso.ciclos || [])
      .map((ciclo) => ciclo.nombre.split(' ')[0])
      .join(' / ');
  }

  private construirVista(recursos: RecursoDto[], categorias: CategoriaDto[]): void {
    const nombresPorCategoria = new Map<number, string>();
    this.recorrerCategorias(categorias, nombresPorCategoria);

    const recursosOrdenados = [...recursos].sort((primero, segundo) => {
      const fechaPrimero = new Date(primero.fechaPublicacion).getTime();
      const fechaSegundo = new Date(segundo.fechaPublicacion).getTime();
      return fechaSegundo - fechaPrimero || primero.categoriaNombre.localeCompare(segundo.categoriaNombre) || primero.nombre.localeCompare(segundo.nombre);
    });

    const gruposPorCategoria = new Map<number, RecursoGrupo>();

    for (const recurso of recursosOrdenados) {
      const nombreCategoria = nombresPorCategoria.get(recurso.idCategoria) || recurso.categoriaNombre;

      if (!gruposPorCategoria.has(recurso.idCategoria)) {
        gruposPorCategoria.set(recurso.idCategoria, {
          categoriaNombre: nombreCategoria,
          idCategoria: recurso.idCategoria,
          recursos: []
        });
      }

      gruposPorCategoria.get(recurso.idCategoria)!.recursos.push({
        ...recurso,
        categoriaNombre: nombreCategoria
      });
    }

    this.grupos = Array.from(gruposPorCategoria.values());
    this.filtros = ['Todos', ...this.grupos.map((grupo) => grupo.categoriaNombre)];
    this.filtroActivo = 'Todos';
    this.cursosFiltro = this.construirCursosFiltro(recursos);
    this.ciclosFiltro = this.construirCiclosFiltro(recursos);
    this.filtroCurso = 'Todos';
    this.filtroCiclo = 'Todos';
  }

  // Recorre el arbol de categorias para tener un mapa rapido id -> nombre.
  private recorrerCategorias(categorias: CategoriaDto[], nombresPorCategoria: Map<number, string>): void {
    for (const categoria of categorias) {
      nombresPorCategoria.set(categoria.idCategoria, categoria.nombre);

      if (categoria.subcategorias && categoria.subcategorias.length > 0) {
        this.recorrerCategorias(categoria.subcategorias, nombresPorCategoria);
      }
    }
  }

  private construirCursosFiltro(recursos: RecursoDto[]): CursoFiltro[] {
    const cursosPorId = new Map<number, string>();

    for (const recurso of recursos) {
      cursosPorId.set(recurso.idCurso, `${recurso.anioInicio}/${recurso.anioFin}`);
    }

    return [
      { idCurso: 'Todos', etiqueta: 'Todos' },
      ...Array.from(cursosPorId.entries()).map(([idCurso, etiqueta]) => ({ idCurso, etiqueta }))
    ];
  }

  private construirCiclosFiltro(recursos: RecursoDto[]): CicloFiltro[] {
    const ciclosPorId = new Map<number, string>();

    for (const recurso of recursos) {
      for (const ciclo of recurso.ciclos || []) {
        ciclosPorId.set(ciclo.idCiclo, ciclo.nombre);
      }
    }

    return [
      { idCiclo: 'Todos', nombre: 'Todos' },
      ...Array.from(ciclosPorId.entries()).map(([idCiclo, nombre]) => ({ idCiclo, nombre }))
    ];
  }

  private coincideCurso(recurso: RecursoDto): boolean {
    return this.filtroCurso === 'Todos' || recurso.idCurso === this.filtroCurso;
  }

  private coincideCiclo(recurso: RecursoDto): boolean {
    if (this.filtroCiclo === 'Todos') {
      return true;
    }

    return (recurso.ciclos || []).some((ciclo) => ciclo.idCiclo === this.filtroCiclo);
  }

  private quitarRecursoDeLaVista(idCategoria: number, numRecurso: number): void {
    this.grupos = this.grupos
      .map((grupo) => ({
        ...grupo,
        recursos: grupo.recursos.filter(
          (recurso) => !(recurso.idCategoria === idCategoria && recurso.numRecurso === numRecurso)
        )
      }))
      .filter((grupo) => grupo.recursos.length > 0);

    const recursosRestantes = this.grupos.flatMap((grupo) => grupo.recursos);
    this.filtros = ['Todos', ...this.grupos.map((grupo) => grupo.categoriaNombre)];
    this.cursosFiltro = this.construirCursosFiltro(recursosRestantes);
    this.ciclosFiltro = this.construirCiclosFiltro(recursosRestantes);

    if (this.filtroActivo !== 'Todos' && !this.filtros.includes(this.filtroActivo)) {
      this.filtroActivo = 'Todos';
    }

    if (this.filtroCurso !== 'Todos' && !this.cursosFiltro.some((curso) => curso.idCurso === this.filtroCurso)) {
      this.filtroCurso = 'Todos';
    }

    if (this.filtroCiclo !== 'Todos' && !this.ciclosFiltro.some((ciclo) => ciclo.idCiclo === this.filtroCiclo)) {
      this.filtroCiclo = 'Todos';
    }
  }
}
