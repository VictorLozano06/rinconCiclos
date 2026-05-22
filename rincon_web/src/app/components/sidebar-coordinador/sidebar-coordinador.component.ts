import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CategoriaService } from '../../services/categoria.service';
import { CategoriaDto } from '../../dto/categoria.dto';

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

  constructor(private categoriaService: CategoriaService) {}

  ngOnInit(): void {
    this.obtenerCategorias();
  }

  // Carga categorias para construir el menu lateral de coordinador.
  obtenerCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (data: CategoriaDto[]) => {
        this.errorCarga = false;
        this.menuItems = this.construirMenu(data);
      },
      error: (err) => {
        this.errorCarga = true;
        console.error('Error al obtener categorias para el sidebar de coordinador:', err);
      }
    });
  }

  // Monta los grupos del sidebar, incluyendo accesos fijos y categorias dinamicas.
  private construirMenu(categorias: CategoriaDto[]): SidebarItem[] {
    const catReuniones = categorias.find((cat) => cat.nombre === 'Reuniones de Equipo');

    let subCategoriasReuniones: SidebarItem[] = [];
    if (catReuniones && catReuniones.subcategorias) {
      subCategoriasReuniones = this.mapearCategorias(
        catReuniones.subcategorias,
        '/coordinador',
        '/coordinador/reuniones-de-equipo'
      );
    }

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
        nombre: 'Gestión de Cursos',
        icono: 'categoria-generica',
        ruta: '/coordinador/gestion-de-cursos',
        abierto: false,
        subcategorias: [],
        deshabilitado: false
      },
      {
        nombre: 'Categorías',
        icono: 'categorias',
        ruta: null,
        abierto: true,
        subcategorias: [
          {
            nombre: 'Crear categoría',
            icono: 'categoria-generica',
            ruta: '/coordinador/categorias/crear',
            abierto: false,
            subcategorias: [],
            deshabilitado: true
          },
          {
            nombre: 'Modificar categoría',
            icono: 'categoria-generica',
            ruta: '/coordinador/categorias/modificar',
            abierto: false,
            subcategorias: [],
            deshabilitado: true
          }
        ],
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

  // Convierte categorias anidadas en items navegables.
  private mapearCategorias(cats: CategoriaDto[], prefijoRuta: string, rutaPadre: string = ''): SidebarItem[] {
    const mapaIconos: { [key: string]: string } = {
      'Inicio': 'home',
      'Reuniones de Equipo': 'reuniones',
      'Tutorias': 'tutorias',
      'Tutorías': 'tutorias',
      'Evaluaciones': 'evaluaciones',
      'Otros': 'otros'
    };

    const subcategoriasDeshabilitadas = ['Actas', 'BOCC', 'Calendario de reuniones'];

    return cats.map((cat) => {
      const nombre = cat.nombre;

      const slug = nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[ºª]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      let ruta = '';
      if (nombre === 'Inicio') {
        ruta = `${prefijoRuta}/inicio`;
      } else if (rutaPadre) {
        ruta = `${rutaPadre}/${slug}`;
      } else {
        ruta = `${prefijoRuta}/${slug}`;
      }

      const subcategorias = cat.subcategorias ? this.mapearCategorias(cat.subcategorias, prefijoRuta, ruta) : [];

      return {
        nombre,
        icono: mapaIconos[nombre] || 'categoria-generica',
        ruta,
        abierto: false,
        subcategorias,
        deshabilitado: subcategoriasDeshabilitadas.includes(nombre)
      };
    });
  }

  // Abre o cierra el bloque de menu que corresponda.
  alternarMenu(cat: SidebarItem): void {
    if (cat.subcategorias.length > 0) {
      cat.abierto = !cat.abierto;
    }
  }

  // Indica si un item tiene hijos para decidir si se pinta como boton o enlace.
  tieneHijos(cat: SidebarItem): boolean {
    return cat.subcategorias.length > 0;
  }

  // Cierra el sidebar en mobile.
  cerrarSidebar(): void {
    this.requestClose.emit();
  }
}
