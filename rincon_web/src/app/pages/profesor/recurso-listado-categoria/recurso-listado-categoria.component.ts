import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CategoriaService } from '../../../services/categoria.service';
import { RecursoService } from '../../../services/recurso.service';
import { CategoriaDto } from '../../../dto/categoria.dto';
import { RecursoDto } from '../../../dto/recurso.dto';
import { RecursoItemComponent } from '../../../components/recurso-item/recurso-item.component';

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
  imports: [CommonModule, RecursoItemComponent],
  templateUrl: './recurso-listado-categoria.component.html',
  styleUrl: './recurso-listado-categoria.component.css'
})
export class RecursoListadoCategoriaProfesorComponent implements OnInit {
  // Ruta actual y subtipo seleccionado dentro del arbol de categorias.
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

  // Resuelve la categoria real desde la ruta y pide sus recursos.
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
        const encontrada = this.buscarCategoriaPorRuta(
          categorias,
          [this.seccion, this.subseccion].filter((valor): valor is string => !!valor)
        );

        if (!encontrada) {
          this.cargando = false;
          return;
        }

        this.categoriaActual = encontrada.categoria.nombre;
        this.rutaCategoria = encontrada.ruta;

        this.recursoService.getPorCategoria(encontrada.categoria.idCategoria).subscribe({
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

  // Busca la categoria correspondiente recorriendo el arbol de categorias.
  private buscarCategoriaPorRuta(categorias: CategoriaDto[], segmentos: string[]): CategoriaRuta | null {
    if (segmentos.length === 0) {
      return null;
    }

    for (const categoria of categorias) {
      if (this.slug(categoria.nombre) !== segmentos[0]) {
        continue;
      }

      if (segmentos.length === 1) {
        return { categoria, ruta: [categoria.nombre] };
      }

      if (categoria.subcategorias && categoria.subcategorias.length > 0) {
        const encontrada = this.buscarCategoriaPorRuta(categoria.subcategorias, segmentos.slice(1));
        if (encontrada) {
          return {
            categoria: encontrada.categoria,
            ruta: [categoria.nombre, ...encontrada.ruta]
          };
        }
      }
    }

    return null;
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

  formatearCurso(recurso: RecursoDto): string {
    return `${recurso.anioInicio}/${recurso.anioFin}`;
  }

  formatearCiclos(recurso: RecursoDto): string {
    return (recurso.ciclos || [])
      .map((ciclo) => ciclo.nombre.split(' ')[0])
      .join(' · ');
  }

  // Convierte un nombre visible a slug URL.
  private slug(valor: string): string {
    return valor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
}


