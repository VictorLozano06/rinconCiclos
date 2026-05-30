import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CategoriaService } from '../../services/categoria.service';
import { RecursoService } from '../../services/recurso.service';
import { CategoriaDto } from '../../dto/categoria.dto';
import { RecursoArchivoDto, RecursoDto, RecursoEnlaceDto } from '../../dto/recurso.dto';

interface RutaNavegacionItem {
  nombre: string;
  ruta: string | any[] | null;
}

@Component({
  selector: 'app-recurso-detalle-compartido',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recurso-detalle-compartido.component.html',
  styleUrl: './recurso-detalle-compartido.component.css'
})
export class RecursoDetalleCompartidoComponent implements OnInit {
  // Ficha completa del recurso que se muestra en pantalla.
  public recurso: RecursoDto | null = null;
  // Ruta jerarquica visible arriba del detalle: Inicio / Categoria / Recurso.
  public rutaNavegacion: RutaNavegacionItem[] = [];
  public cargando = true;
  public errorCarga = false;
  public mensajeError = '';
  public rutaBase = '/profesor';
  public rutaInicio = '/profesor/inicio';

  private idCategoria = 0;
  private numRecurso = 0;

  constructor(
    private route: ActivatedRoute,
    private categoriaService: CategoriaService,
    private recursoService: RecursoService,
    private location: Location
  ) {}

  ngOnInit(): void {
    // subscribe escucha cambios de la ruta. Si cambia el id del recurso, se recarga el detalle.
    this.route.params.subscribe((params) => {
      this.idCategoria = Number(params['idCategoria'] || 0);
      this.numRecurso = Number(params['numRecurso'] || 0);
      // snapshot es una foto instantanea del estado actual de la ruta en este momento.
      this.rutaBase = this.route.snapshot.data['rutaBase'] || '/profesor';
      this.rutaInicio = this.route.snapshot.data['rutaInicio'] || '/profesor/inicio';
      this.cargarDetalle();
    });
  }

  // Trae categorias y detalle del recurso para construir la vista final.
  cargarDetalle(): void {
    this.cargando = true;
    this.errorCarga = false;
    this.mensajeError = '';
    this.recurso = null;
    this.rutaNavegacion = [];

    if (!this.idCategoria || !this.numRecurso) {
      this.errorCarga = true;
      this.cargando = false;
      return;
    }

    // forkJoin lanza varias peticiones en paralelo y espera a que todas terminen.
    forkJoin({
      categorias: this.categoriaService.getCategorias(),
      recurso: this.recursoService.getDetalle(this.idCategoria, this.numRecurso)
    }).subscribe({
      next: ({ categorias, recurso }) => {
        this.recurso = recurso;
        this.rutaNavegacion = this.construirRutaNavegacion(categorias, this.idCategoria, recurso.nombre);
        this.cargando = false;
      },
      error: (err) => {
        this.errorCarga = true;
        this.mensajeError = err?.error?.message || err?.error?.error || 'No se ha podido cargar el recurso.';
        this.cargando = false;
        console.error('Error al cargar el detalle del recurso:', err);
      }
    });
  }

  // Devuelve los enlaces externos asociados al recurso.
  obtenerEnlaces(): RecursoEnlaceDto[] {
    if (!this.recurso) {
      return [];
    }

    if (this.recurso.enlacesDetalle && this.recurso.enlacesDetalle.length > 0) {
      return this.recurso.enlacesDetalle;
    }

    return (this.recurso.urls || []).map((url, index) => ({
      nombre: this.obtenerEtiquetaDesdeUrl(url, `Acceso ${index + 1}`),
      url
    }));
  }

  // Devuelve los archivos adjuntos asociados al recurso.
  obtenerArchivos(): RecursoArchivoDto[] {
    if (!this.recurso) {
      return [];
    }

    if (this.recurso.archivosDetalle && this.recurso.archivosDetalle.length > 0) {
      return this.recurso.archivosDetalle;
    }

    return (this.recurso.archivos || []).map((archivo, index) => ({
      nombre: `Adjunto ${index + 1}`,
      archivo
    }));
  }

  // Devuelve los ciclos asociados al recurso en formato visual.
  obtenerCiclos(): string[] {
    if (!this.recurso) {
      return [];
    }

    return (this.recurso.ciclos || []).map((ciclo) => ciclo.nombre);
  }

  get textoRutaNavegacion(): string {
    return this.rutaNavegacion.map((item) => item.nombre).join(' / ');
  }

  // Extrae el nombre legible de un archivo o ruta.
  getNombreArchivo(archivo: string): string {
    const limpio = archivo.replace(/\\/g, '/');
    return limpio.split('/').pop() || archivo;
  }

  getNombreEnlace(enlace: RecursoEnlaceDto): string {
    const nombre = (enlace.nombre || '').trim();
    if (nombre) {
      return nombre;
    }

    return this.obtenerEtiquetaDesdeUrl(enlace.url, 'Acceso externo');
  }

  getNombreArchivoAdjunto(archivo: RecursoArchivoDto): string {
    const nombre = (archivo.nombre || '').trim();
    return nombre || this.getNombreArchivo(archivo.archivo);
  }

  private obtenerEtiquetaDesdeUrl(url: string, fallback: string): string {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, '');
      const path = parsed.pathname.replace(/\/+$/, '');

      if (host && path && path !== '/') {
        return `${host}${path}`.slice(0, 80);
      }

      return host || fallback;
    } catch {
      return fallback;
    }
  }

  // Construye la ruta superior visible a partir de la categoria real del recurso.
  private construirRutaNavegacion(categorias: CategoriaDto[], idCategoria: number, nombreRecurso: string): RutaNavegacionItem[] {
    const ruta = this.buscarRutaCategoria(categorias, idCategoria);
    const rutaNavegacion: RutaNavegacionItem[] = [{ nombre: 'Inicio', ruta: this.rutaInicio }];

    if (ruta.length > 0) {
      ruta.forEach((nombre, index) => {
        rutaNavegacion.push({
          nombre,
          ruta: index === ruta.length - 1 ? null : this.rutaInicio
        });
      });
    }

    rutaNavegacion.push({ nombre: nombreRecurso, ruta: '' });
    return rutaNavegacion;
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

  volver(): void {
    this.location.back();
  }
}
