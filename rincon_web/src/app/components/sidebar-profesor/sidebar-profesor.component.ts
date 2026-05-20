import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CategoriaDto } from '../../dto/categoria.dto';
import { CategoriaService } from '../../services/categoria.service';

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
    this.obtenerCategorias();
  }

  obtenerCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (data: CategoriaDto[]) => {
        this.categorias = this.mapCategorias(data, '/profesor');
      },
      error: (err) => {
        console.error('Error de conexion con el servidor backend PHP:', err);
      }
    });
  }

  private mapCategorias(cats: CategoriaDto[], prefix: string, parentRuta: string = ''): any[] {
    const iconMap: { [key: string]: string } = {
      'Inicio': 'home',
      'Reuniones de Equipo': 'reuniones',
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

  toggleMenu(cat: any): void {
    if (cat.subcategorias.length > 0) {
      cat.abierto = !cat.abierto;
    }
  }

  handleCategoriaClick(cat: any): void {
    if (cat.subcategorias.length === 0) {
      this.closeSidebar();
      return;
    }

    this.toggleMenu(cat);
  }

  closeSidebar(): void {
    this.requestClose.emit();
  }
}
