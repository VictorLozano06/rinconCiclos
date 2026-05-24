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
  public recursosBase: RecursoDto[] = [];
  public categoriasBase: CategoriaDto[] = [];
  public filtros: string[] = [];
  public filtroActivo = 'Todos';
  public cursosFiltro: CursoFiltro[] = [];
  public ciclosFiltro: CicloFiltro[] = [];
  public filtroCurso: number | 'Todos' = 'Todos';
  public filtroCiclo: number | 'Todos' = 'Todos';
  public cargando = true;
  public errorCarga = false;
  public feedbackMock = '';
  public mostrarModalEliminar = false;
  public recursoSeleccionado: RecursoDto | null = null;

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
            this.categoriasBase = categorias;
            this.recursosBase = recursos;
            this.construirVista(this.recursosBase, this.categoriasBase);
            this.feedbackMock = history.state?.feedbackMock || '';
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
    const select = evento.target as HTMLSelectElement | null;
    this.filtroActivo = select?.value || 'Todos';
  }

  cambiarCurso(evento: Event): void {
    const select = evento.target as HTMLSelectElement | null;
    this.filtroCurso = select?.value === 'Todos' ? 'Todos' : Number(select?.value || 0);
  }

  cambiarCiclo(evento: Event): void {
    const select = evento.target as HTMLSelectElement | null;
    this.filtroCiclo = select?.value === 'Todos' ? 'Todos' : Number(select?.value || 0);
  }

  get gruposFiltrados(): RecursoGrupo[] {
    return this.grupos
      .filter((grupo) => this.filtroActivo === 'Todos' || grupo.categoriaNombre === this.filtroActivo)
      .map((grupo) => ({
        ...grupo,
        recursos: grupo.recursos.filter((recurso) => this.coincideCurso(recurso) && this.coincideCiclo(recurso))
      }))
      .filter((grupo) => grupo.recursos.length > 0);
  }

  abrirEditarMock(recurso: RecursoDto): void {
    this.router.navigate(['/coordinador/recursos', recurso.idCategoria, recurso.numRecurso, 'editar']);
  }

  abrirEliminarMock(recurso: RecursoDto): void {
    this.recursoSeleccionado = recurso;
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.recursoSeleccionado = null;
  }

  eliminarMock(): void {
    if (!this.recursoSeleccionado) {
      return;
    }

    const nombreRecurso = this.recursoSeleccionado.nombre;
    this.cerrarModalEliminar();
    this.router.navigate(['/coordinador/recursos'], {
      state: { feedbackMock: `Mock de eliminacion lanzado para "${nombreRecurso}". No se ha borrado nada.` }
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
    const categoriasMapa = new Map<number, string>();
    this.recorrerCategorias(categorias, categoriasMapa);

    const ordenados = [...recursos].sort((a, b) => {
      const fechaA = new Date(a.fechaPublicacion).getTime();
      const fechaB = new Date(b.fechaPublicacion).getTime();
      return fechaB - fechaA || a.categoriaNombre.localeCompare(b.categoriaNombre) || a.nombre.localeCompare(b.nombre);
    });

    const grupos = new Map<number, RecursoGrupo>();

    for (const recurso of ordenados) {
      const nombreCategoria = categoriasMapa.get(recurso.idCategoria) || recurso.categoriaNombre;

      if (!grupos.has(recurso.idCategoria)) {
        grupos.set(recurso.idCategoria, {
          categoriaNombre: nombreCategoria,
          idCategoria: recurso.idCategoria,
          recursos: []
        });
      }

      grupos.get(recurso.idCategoria)!.recursos.push({
        ...recurso,
        categoriaNombre: nombreCategoria
      });
    }

    this.grupos = Array.from(grupos.values());
    this.filtros = ['Todos', ...this.grupos.map((grupo) => grupo.categoriaNombre)];
    this.filtroActivo = 'Todos';
    this.cursosFiltro = this.construirCursosFiltro(recursos);
    this.ciclosFiltro = this.construirCiclosFiltro(recursos);
    this.filtroCurso = 'Todos';
    this.filtroCiclo = 'Todos';
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

  private construirCiclosFiltro(recursos: RecursoDto[]): CicloFiltro[] {
    const ciclos = new Map<number, string>();

    for (const recurso of recursos) {
      for (const ciclo of recurso.ciclos || []) {
        ciclos.set(ciclo.idCiclo, ciclo.nombre);
      }
    }

    return [
      { idCiclo: 'Todos', nombre: 'Todos' },
      ...Array.from(ciclos.entries()).map(([idCiclo, nombre]) => ({ idCiclo, nombre }))
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
}
