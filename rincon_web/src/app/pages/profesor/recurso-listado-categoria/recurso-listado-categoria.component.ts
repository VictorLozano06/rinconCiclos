import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CategoriaService } from '../../../services/categoria.service';
import { RecursoService } from '../../../services/recurso.service';
import { CategoriaDto } from '../../../dto/categoria.dto';
import { RecursoDto } from '../../../dto/recurso.dto';
import { RecursoListadoCategoriaCompartidoComponent } from '../../../components/recurso-listado-categoria-compartido/recurso-listado-categoria-compartido.component';

interface CursoFiltro {
  idCurso: number | 'Todos';
  etiqueta: string;
}

interface CicloFiltro {
  idCiclo: number | 'Todos';
  nombre: string;
}

interface CategoriaRuta {
  categoria: CategoriaDto;
  ruta: string[];
}

@Component({
  selector: 'app-recurso-listado-categoria-profesor',
  standalone: true,
  imports: [CommonModule, RecursoListadoCategoriaCompartidoComponent],
  templateUrl: './recurso-listado-categoria.component.html',
  styleUrl: './recurso-listado-categoria.component.css'
})
export class RecursoListadoCategoriaProfesorComponent implements OnInit {
  public seccion: string | null = null;
  public subseccion: string | null = null;
  public categoriaActual: string | null = null;
  public rutaCategoria: string[] = [];
  public recursos: RecursoDto[] = [];
  public cursosFiltro: CursoFiltro[] = [];
  public ciclosFiltro: CicloFiltro[] = [];
  public filtroCurso: number | 'Todos' = 'Todos';
  public filtroCiclo: number | 'Todos' = 'Todos';
  public cargando = true;
  public errorCarga = false;

  constructor(
    private route: ActivatedRoute,
    private categoriaService: CategoriaService,
    private recursoService: RecursoService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.seccion = params['section'] || null;
      this.subseccion = params['subsection'] || null;
      this.cargarRecursos();
    });
  }

  cargarRecursos(): void {
    this.cargando = true;
    this.errorCarga = false;
    this.recursos = [];
    this.categoriaActual = null;
    this.rutaCategoria = [];
    this.cursosFiltro = [];
    this.ciclosFiltro = [];
    this.filtroCurso = 'Todos';
    this.filtroCiclo = 'Todos';

    this.categoriaService.getCategorias().subscribe({
      next: (categorias) => {
        const categoriaEncontrada = this.buscarCategoriaPorRuta(
          categorias,
          [this.seccion, this.subseccion].filter((valor): valor is string => !!valor)
        );

        if (!categoriaEncontrada) {
          this.cargando = false;
          return;
        }

        this.categoriaActual = categoriaEncontrada.categoria.nombre;
        this.rutaCategoria = categoriaEncontrada.ruta;

        this.recursoService.getPorCategoria(categoriaEncontrada.categoria.idCategoria).subscribe({
          next: (recursos) => {
            this.recursos = recursos;
            this.cursosFiltro = this.construirCursosFiltro(recursos);
            this.ciclosFiltro = this.construirCiclosFiltro(recursos);
            this.cargando = false;
          },
          error: (err) => {
            this.errorCarga = true;
            this.cargando = false;
            console.error('Error al cargar los recursos de la categoria:', err);
          }
        });
      },
      error: (err) => {
        this.errorCarga = true;
        this.cargando = false;
        console.error('Error al cargar las categorias del profesor:', err);
      }
    });
  }

  // Aplica todos los filtros visibles sobre la lista actual antes de pintarla.
  get recursosFiltrados(): RecursoDto[] {
    return this.recursos.filter((recurso) =>
      this.coincideCurso(recurso) &&
      this.coincideCiclo(recurso)
    );
  }

  cambiarCurso(evento: Event): void {
    const selector = evento.target as HTMLSelectElement | null;
    this.filtroCurso = selector?.value === 'Todos' ? 'Todos' : Number(selector?.value || 0);
  }

  cambiarCiclo(evento: Event): void {
    const selector = evento.target as HTMLSelectElement | null;
    this.filtroCiclo = selector?.value === 'Todos' ? 'Todos' : Number(selector?.value || 0);
  }

  // Recorre el arbol de categorias y resuelve la ruta real de la URL actual.
  private buscarCategoriaPorRuta(categorias: CategoriaDto[], segmentosRuta: string[]): CategoriaRuta | null {
    if (segmentosRuta.length === 0) {
      return null;
    }

    for (const categoria of categorias) {
      if (this.crearSlug(categoria.nombre) !== segmentosRuta[0]) {
        continue;
      }

      if (segmentosRuta.length === 1) {
        return { categoria, ruta: [categoria.nombre] };
      }

      if (categoria.subcategorias && categoria.subcategorias.length > 0) {
        const categoriaEncontrada = this.buscarCategoriaPorRuta(categoria.subcategorias, segmentosRuta.slice(1));
        if (categoriaEncontrada) {
          return {
            categoria: categoriaEncontrada.categoria,
            ruta: [categoria.nombre, ...categoriaEncontrada.ruta]
          };
        }
      }
    }

    return null;
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

  formatearCurso(recurso: RecursoDto): string {
    return `${recurso.anioInicio}/${recurso.anioFin}`;
  }

  formatearCiclos(recurso: RecursoDto): string {
    return (recurso.ciclos || [])
      .map((ciclo) => ciclo.nombre.split(' ')[0])
      .join(' / ');
  }

  private crearSlug(valor: string): string {
    return valor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

}
