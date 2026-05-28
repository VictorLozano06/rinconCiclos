import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CategoriaService } from '../../services/categoria.service';
import { CategoriaDto } from '../../dto/categoria.dto';
import { AccesoAppService } from '../../services/acceso-app.service';

interface CategoriaSidebar extends CategoriaDto {
  icono: string;
  ruta: string;
  abierto: boolean;
  subcategorias: CategoriaSidebar[];
  deshabilitado: boolean;
}

@Component({
  selector: 'app-sidebar-profesor',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar-profesor.component.html',
  styleUrl: './sidebar-profesor.component.css'
})
export class SidebarProfesorComponent implements OnInit {
  @Input() mobileOpen = false;
  @Output() requestClose = new EventEmitter<void>();

  public categorias: CategoriaSidebar[] = [];
  public mostrarAccesoCoordinador = false;

  constructor(
    private categoriaService: CategoriaService,
    private accesoAppService: AccesoAppService
  ) {}

  ngOnInit(): void {
    this.accesoAppService.inicializarDesdeUbicacionActual();
    this.mostrarAccesoCoordinador = this.accesoAppService.puedeAccederCoordinador();
    this.obtenerCategorias();
  }

  // Carga las categorias reales de la BD y solo les añade lo visual del sidebar.
  obtenerCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (datos: CategoriaDto[]) => {
        this.categorias = [
          {
            idCategoria: 0,
            nombre: 'Inicio',
            predeterminada: true,
            idCategoriaPadre: 0,
            icono: 'home',
            ruta: '/profesor/inicio',
            abierto: false,
            subcategorias: [],
            deshabilitado: false
          },
          ...this.mapCategorias(datos, '/profesor')
        ];
      },
      error: (err) => {
        console.error('Error al cargar las categorias del sidebar:', err);
      }
    });
  }

  // Convierte el arbol de categorias en items navegables.
  private mapCategorias(categorias: CategoriaDto[], prefijo: string, rutaPadre = ''): CategoriaSidebar[] {
    const iconosPorNombre: Record<string, string> = {
      'Reuniones de Equipo': 'reuniones',
      'Tutorias': 'tutorias',
      'Evaluaciones': 'evaluaciones',
      'Otros': 'otros'
    };

    const deshabilitadas = ['BOCC', 'Calendario de reuniones'];

    return categorias.map((categoria) => {
      const nombreNormalizado = this.normalizarTexto(categoria.nombre);
      const slug = this.crearSlug(categoria.nombre);
      const ruta = rutaPadre ? `${rutaPadre}/${slug}` : `${prefijo}/${slug}`;
      const subcategorias = categoria.subcategorias ? this.mapCategorias(categoria.subcategorias, prefijo, ruta) : [];

      return {
        ...categoria,
        icono: categoria.predeterminada ? (iconosPorNombre[nombreNormalizado] || 'categoria-generica') : 'categoria-generica',
        ruta,
        abierto: subcategorias.length > 0,
        subcategorias,
        deshabilitado: deshabilitadas.includes(categoria.nombre)
      };
    });
  }

  toggleMenu(categoria: CategoriaSidebar): void {
    if (categoria.subcategorias.length > 0) {
      categoria.abierto = !categoria.abierto;
    }
  }

  cerrarSidebar(): void {
    this.requestClose.emit();
  }

  activarCategoria(categoria: CategoriaSidebar): void {
    this.toggleMenu(categoria);

    if (categoria.subcategorias.length === 0) {
      this.cerrarSidebar();
    }
  }

  // Sirve para comparar nombres aunque vengan con o sin tilde.
  private normalizarTexto(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  // Convierte el nombre visible en una ruta tipo /tutorias/pat.
  private crearSlug(valor: string): string {
    return this.normalizarTexto(valor)
      .toLowerCase()
      .replace(/[ºª]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
}
