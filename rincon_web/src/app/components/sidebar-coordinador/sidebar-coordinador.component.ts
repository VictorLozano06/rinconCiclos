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

  obtenerCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (data: CategoriaDto[]) => {
        this.errorCarga = false;
        this.menuItems = this.buildMenu(data);
      },
      error: (err) => {
        this.errorCarga = true;
        console.error('Error al obtener categorias para el sidebar de coordinador:', err);
      }
    });
  }

  private buildMenu(categorias: CategoriaDto[]): SidebarItem[] {
    const categoriasContenido = categorias.filter((cat) => cat.nombre !== 'Inicio');

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
        nombre: 'Categorias',
        icono: 'categorias',
        ruta: null,
        abierto: true,
        subcategorias: this.mapCategorias(categoriasContenido, '/coordinador'),
        deshabilitado: false
      }
    ];
  }

  private mapCategorias(cats: CategoriaDto[], prefix: string, parentRuta: string = ''): SidebarItem[] {
    const iconMap: { [key: string]: string } = {
      'Inicio': 'home',
      'Reuniones de Equipo': 'reuniones',
      'Tutorias': 'tutorias',
      'Tutorías': 'tutorias',
      'Evaluaciones': 'evaluaciones',
      'Otros': 'otros'
    };

    const disabledSubs = ['Actas', 'BOCC', 'Calendario de reuniones'];

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
        ruta = `${prefix}/inicio`;
      } else if (parentRuta) {
        ruta = `${parentRuta}/${slug}`;
      } else {
        ruta = `${prefix}/${slug}`;
      }

      const subcategorias = cat.subcategorias ? this.mapCategorias(cat.subcategorias, prefix, ruta) : [];

      return {
        nombre,
        icono: iconMap[nombre] || 'categoria-generica',
        ruta,
        abierto: false,
        subcategorias,
        deshabilitado: disabledSubs.includes(nombre)
      };
    });
  }

  toggleMenu(cat: SidebarItem): void {
    if (cat.subcategorias.length > 0) {
      cat.abierto = !cat.abierto;
    }
  }

  hasChildren(cat: SidebarItem): boolean {
    return cat.subcategorias.length > 0;
  }

  closeSidebar(): void {
    this.requestClose.emit();
  }
}
