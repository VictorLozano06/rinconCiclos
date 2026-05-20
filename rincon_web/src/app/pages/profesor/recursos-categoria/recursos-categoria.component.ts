import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CategoriaService } from '../../../services/categoria.service';
import { RecursoService } from '../../../services/recurso.service';
import { CategoriaDto } from '../../../dto/categoria.dto';
import { RecursoDto } from '../../../dto/recurso.dto';
import { RecursoItemComponent } from '../../../components/recurso-item/recurso-item.component';

@Component({
  selector: 'app-recursos-categoria-profesor',
  standalone: true,
  imports: [CommonModule, RecursoItemComponent],
  templateUrl: './recursos-categoria.component.html',
  styleUrl: './recursos-categoria.component.css'
})
export class RecursosCategoriaComponent implements OnInit {
  public section: string | null = null;
  public subsection: string | null = null;
  public categoriaActual: string | null = null;
  public recursos: RecursoDto[] = [];
  public cargando = true;
  public errorCarga = false;

  constructor(
    private route: ActivatedRoute,
    private categoriaService: CategoriaService,
    private recursoService: RecursoService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.section = params['section'] || null;
      this.subsection = params['subsection'] || null;
      this.cargarRecursos();
    });
  }

  cargarRecursos(): void {
    this.cargando = true;
    this.errorCarga = false;
    this.recursos = [];
    this.categoriaActual = null;

    this.categoriaService.getCategorias().subscribe({
      next: (categorias) => {
        const categoria = this.buscarCategoriaPorRuta(categorias, [this.section, this.subsection].filter((valor): valor is string => !!valor));

        if (!categoria) {
          this.cargando = false;
          return;
        }

        this.categoriaActual = categoria.nombre;

        this.recursoService.getPorCategoria(categoria.idCategoria).subscribe({
          next: (recursos) => {
            this.recursos = recursos;
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

  private buscarCategoriaPorRuta(categorias: CategoriaDto[], segmentos: string[]): CategoriaDto | null {
    if (segmentos.length === 0) {
      return null;
    }

    for (const categoria of categorias) {
      if (this.slug(categoria.nombre) !== segmentos[0]) {
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

  private slug(valor: string): string {
    return valor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
}
