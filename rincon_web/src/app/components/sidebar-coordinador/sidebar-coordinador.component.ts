import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CategoriaDto } from '../../dto/categoria.dto';
import { AccesoAppService } from '../../services/acceso-app.service';
import { CategoriaService } from '../../services/categoria.service';

interface SidebarItem {
  nombre: string;
  icono: string;
  ruta: string | null;
  abierto: boolean;
  subcategorias: SidebarItem[];
  deshabilitado: boolean;
}

@Component({
  selector: 'app-sidebar-coordinador',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar-coordinador.component.html',
  styleUrl: './sidebar-coordinador.component.css'
})
export class SidebarCoordinadorComponent implements OnInit {
  @Input() mobileOpen = false;
  @Output() requestClose = new EventEmitter<void>();

  public menuItems: SidebarItem[] = [];
  public errorCarga = false;
  public mostrarAccesoProfesor = false;

  constructor(
    private categoriaService: CategoriaService,
    private accesoAppService: AccesoAppService
  ) {}

  ngOnInit(): void {
    this.accesoAppService.inicializarDesdeUbicacionActual();
    this.mostrarAccesoProfesor = this.accesoAppService.puedeAccederProfesor();
    this.obtenerCategorias();
  }

  // Carga las categorias del backend para pintar solo lo que existe de verdad.
  obtenerCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (data: CategoriaDto[]) => {
        this.errorCarga = false;
        this.menuItems = this.construirMenu(data);
      },
      error: (err: unknown) => {
        this.errorCarga = true;
        console.error('Error al obtener categorias para el sidebar de coordinador:', err);
      }
    });
  }

  // Mezcla accesos fijos con las categorias dinamicas que vienen de la BD.
  private construirMenu(categorias: CategoriaDto[]): SidebarItem[] {
    const catReuniones = categorias.find((cat) => cat.nombre === 'Reuniones de Equipo');

    const subCategoriasReuniones =
      catReuniones?.subcategorias?.length
        ? this.mapearCategorias(catReuniones.subcategorias, '/coordinador', '/coordinador/reuniones-de-equipo')
        : [];

    return [
      {
        nombre: 'Inicio',
        icono: 'home',
        ruta: '/coordinador/inicio',
        abierto: false,
        subcategorias: [],
        deshabilitado: false
      },
      {
        nombre: 'Gestión de Ciclos',
        icono: 'categorias',
        ruta: '/coordinador/gestion-de-ciclos',
        abierto: false,
        subcategorias: [],
        deshabilitado: false
      },
      {
        nombre: 'Categorías',
        icono: 'categorias',
        ruta: '/coordinador/categorias',
        abierto: false,
        subcategorias: [],
        deshabilitado: false
      },
      {
        nombre: 'Lugares',
        icono: 'tag',
        ruta: '/coordinador/lugares',
        abierto: false,
        subcategorias: [],
        deshabilitado: false
      },
      {
        nombre: 'Reuniones',
        icono: 'reuniones',
        ruta: null,
        abierto: true,
        subcategorias: subCategoriasReuniones,
        deshabilitado: false
      },
      {
        nombre: 'Recursos',
        icono: 'tag',
        ruta: null,
        abierto: true,
        subcategorias: [
          {
            nombre: 'Ver todos',
            icono: 'categoria-generica',
            ruta: '/coordinador/recursos',
            abierto: false,
            subcategorias: [],
            deshabilitado: false
          },
          {
            nombre: 'Crear recurso',
            icono: 'categoria-generica',
            ruta: '/coordinador/recursos/crear',
            abierto: false,
            subcategorias: [],
            deshabilitado: false
          }
        ],
        deshabilitado: false
      }
    ];
  }

  // Convierte las categorias anidadas en items navegables del sidebar.
  private mapearCategorias(cats: CategoriaDto[], prefijoRuta: string, rutaPadre = ''): SidebarItem[] {
    const mapaIconos: Record<string, string> = {
      'Reuniones de Equipo': 'reuniones',
      Tutorias: 'tutorias',
      'Tutorías': 'tutorias',
      Evaluaciones: 'evaluaciones',
      Otros: 'otros'
    };

    const subcategoriasBloqueadas = ['BOCC', 'Calendario de reuniones'];

    return cats.map((categoria) => {
      const slug = this.generarSlug(categoria.nombre);
      const ruta = rutaPadre ? `${rutaPadre}/${slug}` : `${prefijoRuta}/${slug}`;
      const subcategorias = categoria.subcategorias?.length
        ? this.mapearCategorias(categoria.subcategorias, prefijoRuta, ruta)
        : [];

      return {
        nombre: categoria.nombre,
        icono: mapaIconos[categoria.nombre] || 'categoria-generica',
        ruta,
        abierto: false,
        subcategorias,
        deshabilitado: subcategoriasBloqueadas.includes(categoria.nombre)
      };
    });
  }

  // Pasa el nombre a una ruta simple, sin tildes ni espacios raros.
  private generarSlug(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[ºª]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  // Abre o cierra el bloque de menu que corresponda.
  alternarMenu(item: SidebarItem): void {
    if (item.subcategorias.length > 0) {
      item.abierto = !item.abierto;
    }
  }

  // Indica si un item tiene hijos para pintarlo como boton o como enlace.
  tieneHijos(item: SidebarItem): boolean {
    return item.subcategorias.length > 0;
  }

  // Cierra el sidebar en mobile.
  cerrarSidebar(): void {
    this.requestClose.emit();
  }
}
