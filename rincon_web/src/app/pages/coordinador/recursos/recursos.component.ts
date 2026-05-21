import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RecursoItemComponent } from '../../../components/recurso-item/recurso-item.component';
import { CategoriaService } from '../../../services/categoria.service';
import { RecursoService } from '../../../services/recurso.service';
import { CategoriaDto } from '../../../dto/categoria.dto';
import { RecursoDto } from '../../../dto/recurso.dto';

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
  selector: 'app-recursos-coordinador',
  standalone: true,
  imports: [CommonModule, RecursoItemComponent],
  templateUrl: './recursos.component.html',
  styleUrl: './recursos.component.css'
})
export class RecursosComponent implements OnInit {
  // Grupos de recursos organizados por categoria.
  public grupos: RecursoGrupo[] = [];
  public filtros: string[] = [];
  public filtroActivo = 'Todos';
  public cursosFiltro: CursoFiltro[] = [];
  public ciclosFiltro: CicloFiltro[] = [];
  public filtroCurso: number | 'Todos' = 'Todos';
  public filtroCiclo: number | 'Todos' = 'Todos';
  public cargando = true;
  public errorCarga = false;

  constructor(
    private recursoService: RecursoService,
    private categoriaService: CategoriaService
  ) {}

  ngOnInit(): void {
    this.cargarRecursos();
  }

  // Carga todos los recursos y reconstruye la vista agrupada.
  cargarRecursos(): void {
    this.cargando = true;
    this.errorCarga = false;

    this.recursoService.getTodos().subscribe({
      next: (recursos) => {
        this.categoriaService.getCategorias().subscribe({
          next: (categorias) => {
            this.construirVista(recursos, categorias);
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

  // Cambia el filtro visual sin volver a pedir datos.
  seleccionarFiltro(filtro: string): void {
    this.filtroActivo = filtro;
  }

  // Actualiza el filtro desde el desplegable.
  cambiarFiltro(evento: Event): void {
    const select = evento.target as HTMLSelectElement | null;
    this.filtroActivo = select?.value || 'Todos';
  }

  // Actualiza el curso seleccionado.
  cambiarCurso(evento: Event): void {
    const select = evento.target as HTMLSelectElement | null;
    this.filtroCurso = select?.value === 'Todos' ? 'Todos' : Number(select?.value || 0);
  }

  // Actualiza el ciclo seleccionado.
  cambiarCiclo(evento: Event): void {
    const select = evento.target as HTMLSelectElement | null;
    this.filtroCiclo = select?.value === 'Todos' ? 'Todos' : Number(select?.value || 0);
  }

  // Devuelve los grupos segun el filtro activo.
  get gruposFiltrados(): RecursoGrupo[] {
    return this.grupos
      .filter((grupo) => this.filtroActivo === 'Todos' || grupo.categoriaNombre === this.filtroActivo)
      .map((grupo) => ({
        ...grupo,
        recursos: grupo.recursos.filter((recurso) => this.coincideCurso(recurso) && this.coincideCiclo(recurso))
      }))
      .filter((grupo) => grupo.recursos.length > 0);
  }

  // Agrupa y ordena los recursos para que la vista sea legible.
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

      grupos.get(recurso.idCategoria)!.recursos.push(recurso);
    }

    this.grupos = Array.from(grupos.values());
    this.filtros = ['Todos', ...this.grupos.map((grupo) => grupo.categoriaNombre)];
    this.filtroActivo = 'Todos';
    this.cursosFiltro = this.construirCursosFiltro(recursos);
    this.ciclosFiltro = this.construirCiclosFiltro(recursos);
    this.filtroCurso = 'Todos';
    this.filtroCiclo = 'Todos';
  }

  // Aplana el arbol de categorias para obtener un mapa id -> nombre.
  private recorrerCategorias(categorias: CategoriaDto[], mapa: Map<number, string>): void {
    for (const categoria of categorias) {
      mapa.set(categoria.idCategoria, categoria.nombre);

      if (categoria.subcategorias && categoria.subcategorias.length > 0) {
        this.recorrerCategorias(categoria.subcategorias, mapa);
      }
    }
  }

  // Crea el listado unico de cursos disponibles.
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

  // Crea el listado unico de ciclos disponibles.
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

  formatearCurso(recurso: RecursoDto): string {
    return `${recurso.anioInicio}/${recurso.anioFin}`;
  }

  formatearCiclos(recurso: RecursoDto): string {
    return (recurso.ciclos || []).map((ciclo) => ciclo.nombre).join(' · ');
  }
}
