import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CategoriaService } from '../../services/categoria.service';
import { CategoriaDto } from '../../dto/categoria.dto';

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

  public categorias: any[] = [];
  public errorCarga = false;

  constructor(private categoriaService: CategoriaService) {}

  ngOnInit(): void {
    this.obtenerCategorias();
  }

  obtenerCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (data: CategoriaDto[]) => {
        this.errorCarga = false;
        this.categorias = this.mapCategorias(data, '/coordinador');
      },
      error: (err) => {
        this.errorCarga = true;
        console.error('Error al obtener categorias para el sidebar de coordinador:', err);
      }
    });
  }

  private mapCategorias(cats: CategoriaDto[], prefix: string, parentRuta: string = ''): any[] {
    const iconMap: { [key: string]: string } = {
      'Inicio': 'home',
      'Reuniones de Equipo': 'reuniones',
      'Tutorias': 'tutorias',
      'Tutorías': 'tutorias',
      'Evaluaciones': 'evaluaciones',
      'Otros': 'otros'
    };

    const disabledSubs = ['Actas', 'BOCC', 'Calendario de reuniones'];

    return cats.map(cat => {
      const nombre = cat.nombre;

      const slug = nombre.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/º/g, '')
        .replace(/ª/g, '')
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
      const deshabilitado = disabledSubs.includes(nombre);

      return {
        nombre,
        icono: iconMap[nombre] || 'categoria-generica',
        ruta,
        abierto: subcategorias.length > 0,
        subcategorias,
        deshabilitado
      };
    });
  }

  toggleMenu(cat: any): void {
    if (cat.subcategorias.length > 0) {
      cat.abierto = !cat.abierto;
    }
  }

  closeSidebar(): void {
    this.requestClose.emit();
  }
}
