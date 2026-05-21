import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CategoriaService } from '../../../services/categoria.service';
import { RecursoService } from '../../../services/recurso.service';
import { CategoriaDto } from '../../../dto/categoria.dto';
import { RecursoDto } from '../../../dto/recurso.dto';

interface BreadcrumbItem {
  nombre: string;
  ruta: string | any[] | null;
}

@Component({
  selector: 'app-recurso-detalle-profesor',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recurso-detalle.component.html',
  styleUrl: './recurso-detalle.component.css'
})
export class RecursoDetalleComponent implements OnInit {
  // Ficha completa del recurso que se muestra en pantalla.
  public recurso: RecursoDto | null = null;
  public breadcrumbs: BreadcrumbItem[] = [];
  public cargando = true;
  public errorCarga = false;
  public basePath = '/profesor';
  public homeRoute = '/profesor/inicio';

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
      this.basePath = this.route.snapshot.data['basePath'] || '/profesor';
      this.homeRoute = this.route.snapshot.data['homeRoute'] || '/profesor/inicio';
      this.cargarDetalle();
    });
  }

  // Trae categorias y detalle del recurso para construir la vista final.
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

  // Devuelve los enlaces externos asociados al recurso.
  obtenerEnlaces(): string[] {
    if (!this.recurso) {
      return [];
    }

    return this.recurso.urls || [];
  }

  // Devuelve los archivos adjuntos asociados al recurso.
  obtenerArchivos(): string[] {
    if (!this.recurso) {
      return [];
    }

    return this.recurso.archivos || [];
  }

  // Devuelve los ciclos asociados al recurso en formato visual.
  obtenerCiclos(): string[] {
    if (!this.recurso) {
      return [];
    }

    return (this.recurso.ciclos || []).map((ciclo) => ciclo.nombre);
  }

  // Extrae el nombre legible de un archivo o ruta.
  getNombreArchivo(archivo: string): string {
    const limpio = archivo.replace(/\\/g, '/');
    return limpio.split('/').pop() || archivo;
  }

  // Construye el breadcrumb a partir de la categoria real del recurso.
  private construirBreadcrumbs(categorias: CategoriaDto[], idCategoria: number, nombreRecurso: string): BreadcrumbItem[] {
    const ruta = this.buscarRutaCategoria(categorias, idCategoria);
    const breadcrumbs: BreadcrumbItem[] = [{ nombre: 'Inicio', ruta: this.homeRoute }];

    if (ruta.length > 0) {
      ruta.forEach((nombre, index) => {
        breadcrumbs.push({
          nombre,
          ruta: index === ruta.length - 1 ? null : this.homeRoute
        });
      });
    }

    breadcrumbs.push({ nombre: nombreRecurso, ruta: '' });
    return breadcrumbs;
  }

  // Localiza la ruta jerarquica de una categoria dentro del arbol.
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
}
