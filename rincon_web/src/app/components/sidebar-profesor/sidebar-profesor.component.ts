import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CategoriaService } from '../../services/categoria.service';
import { CategoriaDto } from '../../dto/categoria.dto';

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

  public categorias: any[] = [];

  constructor(private categoriaService: CategoriaService) {}

  ngOnInit(): void {
    this.categorias = this.obtenerItemsEstaticos();
    this.obtenerCategorias();
  }

  private obtenerItemsEstaticos(): any[] {
    return [
      {
        nombre: 'Reuniones de Equipo',
        icono: 'reuniones',
        ruta: null,
        abierto: true,
        subcategorias: [
          {
            nombre: 'Actas',
            icono: 'categoria-generica',
            ruta: null,
            abierto: true,
            subcategorias: [
              {
                nombre: 'Control de Asistencia',
                icono: 'categoria-generica',
                ruta: '/profesor/proceso-de-actas/asistencia',
                abierto: false,
                subcategorias: [],
                deshabilitado: false
              },
              {
                nombre: 'Redacción de Actas',
                icono: 'categoria-generica',
                ruta: '/profesor/proceso-de-actas/redaccion',
                abierto: false,
                subcategorias: [],
                deshabilitado: false
              }
            ],
            deshabilitado: false
          }
        ],
        deshabilitado: false
      }
    ];
  }

  // Carga categorias y las transforma en enlaces del sidebar.
  obtenerCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (data: CategoriaDto[]) => {
        this.categorias = this.mapCategorias(data, '/profesor');
      },
      error: (err) => {
        console.error('Error de conexion con el servidor backend PHP, usando items estaticos:', err);
      }
    });
  }

  // Convierte el arbol de categorias en items navegables.
  private mapCategorias(cats: CategoriaDto[], prefix: string, parentRuta: string = ''): any[] {
    const iconMap: { [key: string]: string } = {
      'Inicio': 'home',
      'Reuniones de Equipo': 'reuniones',
      'Tutorias': 'tutorias',
      'Tutorías': 'tutorias',
      'Evaluaciones': 'evaluaciones',
      'Otros': 'otros'
    };

    const disabledSubs = ['BOCC', 'Calendario de reuniones'];

    return cats.map((cat) => {
      const nombre = cat.nombre;

      // Slug simple para construir rutas limpias.
      const slug = nombre.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[ºª]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      // Interceptar 'Actas': expande con Control de Asistencia y Redacción
      if (nombre === 'Actas') {
        return {
          nombre,
          icono: 'categoria-generica',
          ruta: null,
          abierto: true,
          subcategorias: [
            {
              nombre: 'Control de Asistencia',
              icono: 'categoria-generica',
              ruta: '/profesor/proceso-de-actas/asistencia',
              abierto: false,
              subcategorias: [],
              deshabilitado: false
            },
            {
              nombre: 'Redacción de Actas',
              icono: 'categoria-generica',
              ruta: '/profesor/proceso-de-actas/redaccion',
              abierto: false,
              subcategorias: [],
              deshabilitado: false
            }
          ],
          deshabilitado: false
        };
      }

      // Construye la ruta segun el nivel de la categoria.
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
        abierto: subcategorias.length > 0,
        subcategorias,
        deshabilitado: disabledSubs.includes(nombre)
      };
    });
  }

  toggleMenu(cat: any): void {
    if (cat.subcategorias.length > 0) {
      cat.abierto = !cat.abierto;
    }
  }

  cerrarSidebar(): void {
    this.requestClose.emit();
  }

  activarCategoria(cat: any): void {
    this.toggleMenu(cat);

    if (cat.subcategorias.length === 0) {
      this.cerrarSidebar();
    }
  }
}
