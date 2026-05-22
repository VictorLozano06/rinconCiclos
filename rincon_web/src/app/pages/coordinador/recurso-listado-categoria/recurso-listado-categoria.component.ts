import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CategoriaDto } from '../../../dto/categoria.dto';
import { RecursoDto } from '../../../dto/recurso.dto';
import { RecursoItemComponent } from '../../../components/recurso-item/recurso-item.component';
import { CategoriaService } from '../../../services/categoria.service';
import { RecursoService } from '../../../services/recurso.service';

interface CursoFiltro {
  idCurso: number | 'Todos';
  etiqueta: string;
}

interface CicloFiltro {
  idCiclo: number | 'Todos';
  nombre: string;
}

@Component({
  selector: 'app-recurso-listado-categoria-coordinador',
  standalone: true,
  imports: [CommonModule, RecursoItemComponent],
  templateUrl: './recurso-listado-categoria.component.html',
  styleUrl: './recurso-listado-categoria.component.css'
})
export class RecursoListadoCategoriaCoordinadorComponent implements OnInit {
  // Segmentos de la URL actual usados para resolver la categoria real.
  public seccion: string | null = null;
  public subseccion: string | null = null;
  public categoriaActual: string | null = null;
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
    // subscribe no es un foreach: se ejecuta cada vez que cambian los params de la ruta.
    this.route.params.subscribe((params) => {
      this.seccion = params['section'] || null;
      this.subseccion = params['subsection'] || null;
      this.cargarRecursos();
    });
  }

  // Carga categorias, resuelve la categoria actual desde la URL y luego pide sus recursos.
  cargarRecursos(): void {
    this.cargando = true;
    this.errorCarga = false;
    this.recursos = [];
    this.categoriaActual = null;
    this.cursosFiltro = [];
    this.ciclosFiltro = [];
    this.filtroCurso = 'Todos';
    this.filtroCiclo = 'Todos';

    this.categoriaService.getCategorias().subscribe({
      next: (categorias) => {
        const categoria = this.buscarCategoriaPorRuta(
          categorias,
          [this.seccion, this.subseccion].filter((valor): valor is string => !!valor)
        );

        if (!categoria) {
          this.cargando = false;
          return;
        }

        this.categoriaActual = categoria.nombre;

        this.recursoService.getPorCategoria(categoria.idCategoria).subscribe({
          next: (recursos) => {
            this.recursos = recursos;
            this.cursosFiltro = this.construirCursosFiltro(recursos);
            this.ciclosFiltro = this.construirCiclosFiltro(recursos);
            this.cargando = false;
          },
          error: (err) => {
            this.errorCarga = true;
            this.cargando = false;
            console.error('Error al cargar los recursos de la categoria para coordinador:', err);
          }
        });
      },
      error: (err) => {
        this.errorCarga = true;
        this.cargando = false;
        console.error('Error al cargar las categorias del coordinador:', err);
      }
    });
  }

  // Getter calculado: devuelve solo los recursos que pasan los filtros actuales.
  get recursosFiltrados(): RecursoDto[] {
    return this.recursos.filter((recurso) => this.coincideCurso(recurso) && this.coincideCiclo(recurso));
  }

  cambiarCurso(evento: Event): void {
    const select = evento.target as HTMLSelectElement | null;
    this.filtroCurso = select?.value === 'Todos' ? 'Todos' : Number(select?.value || 0);
  }

  cambiarCiclo(evento: Event): void {
    const select = evento.target as HTMLSelectElement | null;
    this.filtroCiclo = select?.value === 'Todos' ? 'Todos' : Number(select?.value || 0);
  }

  formatearCurso(recurso: RecursoDto): string {
    return `${recurso.anioInicio}/${recurso.anioFin}`;
  }

  formatearCiclos(recurso: RecursoDto): string {
    return (recurso.ciclos || []).map((ciclo) => ciclo.nombre).join(' / ');
  }

  // Busca dentro del arbol de categorias la que coincide con la ruta actual.
  private buscarCategoriaPorRuta(categorias: CategoriaDto[], segmentos: string[]): CategoriaDto | null {
    if (segmentos.length === 0) {
      return null;
    }

    for (const categoria of categorias) {
      if (this.crearSlugCategoria(categoria.nombre) !== segmentos[0]) {
        continue;
      }

      if (segmentos.length === 1) {
        return categoria;
      }

      if (categoria.subcategorias && categoria.subcategorias.length > 0) {
        const encontrada = this.buscarCategoriaPorRuta(categoria.subcategorias, segmentos.slice(1));
        if (encontrada) {
          return encontrada;
        }
      }
    }

    return null;
  }

  // Recorre todos los recursos y construye el combo de cursos sin duplicados.
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

  // Esto tampoco es un foreach. Es un bucle for...of anidado:
  // recorre cada recurso y dentro recorre sus ciclos para montar un listado unico.
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

  // Convierte el nombre visible de la categoria en el slug usado en la URL.
  private crearSlugCategoria(valor: string): string {
    return valor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
}
