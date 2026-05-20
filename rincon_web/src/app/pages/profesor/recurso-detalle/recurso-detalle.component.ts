import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CategoriaService } from '../../../services/categoria.service';
import { RecursoService } from '../../../services/recurso.service';
import { CategoriaDto } from '../../../dto/categoria.dto';
import { RecursoDetalleDto } from '../../../dto/recurso.dto';

interface BreadcrumbItem {
  nombre: string;
  ruta: string | any[];
}

@Component({
  selector: 'app-recurso-detalle-profesor',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recurso-detalle.component.html',
  styleUrl: './recurso-detalle.component.css'
})
export class RecursoDetalleComponent implements OnInit {
  public recurso: RecursoDetalleDto | null = null;
  public breadcrumbs: BreadcrumbItem[] = [];
  public cargando = true;
  public errorCarga = false;

  private idCategoria = 0;
  private numRecurso = 0;

  constructor(
    private route: ActivatedRoute,
    private categoriaService: CategoriaService,
    private recursoService: RecursoService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.idCategoria = Number(params['idCategoria'] || 0);
      this.numRecurso = Number(params['numRecurso'] || 0);
      this.cargarDetalle();
    });
  }

  cargarDetalle(): void {
    this.cargando = true;
    this.errorCarga = false;
    this.recurso = null;
    this.breadcrumbs = [];

    if (!this.idCategoria || !this.numRecurso) {
      this.errorCarga = true;
      this.cargando = false;
      return;
    }

    forkJoin({
      categorias: this.categoriaService.getCategorias(),
      recurso: this.recursoService.getDetalle(this.idCategoria, this.numRecurso)
    }).subscribe({
      next: ({ categorias, recurso }) => {
        this.recurso = recurso;
        this.breadcrumbs = this.construirBreadcrumbs(categorias, this.idCategoria, recurso.nombre);
        this.cargando = false;
      },
      error: (err) => {
        this.errorCarga = true;
        this.cargando = false;
        console.error('Error al cargar el detalle del recurso:', err);
      }
    });
  }

  obtenerEnlaces(): string[] {
    if (!this.recurso) {
      return [];
    }

    return this.recurso.urls || [];
  }

  obtenerArchivos(): string[] {
    if (!this.recurso) {
      return [];
    }

    return this.recurso.archivos || [];
  }

  getNombreArchivo(archivo: string): string {
    const limpio = archivo.replace(/\\/g, '/');
    return limpio.split('/').pop() || archivo;
  }

  private construirBreadcrumbs(categorias: CategoriaDto[], idCategoria: number, nombreRecurso: string): BreadcrumbItem[] {
    const ruta = this.buscarRutaCategoria(categorias, idCategoria);
    const breadcrumbs: BreadcrumbItem[] = [{ nombre: 'Inicio', ruta: ['/profesor', 'inicio'] }];

    if (ruta.length > 0) {
      ruta.forEach((nombre, index) => {
        const path = ruta.slice(0, index + 1).map((valor) => this.slug(valor));
        breadcrumbs.push({
          nombre,
          ruta: path.length > 0 ? ['/profesor', ...path] : ['/profesor']
        });
      });
    }

    breadcrumbs.push({ nombre: nombreRecurso, ruta: '' });
    return breadcrumbs;
  }

  private buscarRutaCategoria(categorias: CategoriaDto[], idCategoria: number): string[] {
    for (const categoria of categorias) {
      if (categoria.idCategoria === idCategoria) {
        return [categoria.nombre];
      }

      if (categoria.subcategorias && categoria.subcategorias.length > 0) {
        const encontrada = this.buscarRutaCategoria(categoria.subcategorias, idCategoria);
        if (encontrada.length > 0) {
          return [categoria.nombre, ...encontrada];
        }
      }
    }

    return [];
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
