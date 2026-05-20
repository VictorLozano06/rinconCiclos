import { Component, OnInit } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';
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
    this.obtenerCategorias();
  }

  obtenerCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (data: CategoriaDto[]) => {
        // Carga directa de los datos dinamicos de la base de datos
        this.categorias = this.mapCategorias(data, '/profesor');
      },
      error: (err) => {
        console.error('Error de conexion con el servidor backend PHP:', err);
      }
    });
  }

  /*Mapear rutas de forma dinamica con lo que venga de la bd*/

  private mapCategorias(cats: CategoriaDto[], prefix: string, parentRuta: string = ''): any[] {
    /*Iconos solo para las predeterminadas*/
    const iconMap: { [key: string]: string } = {
      'Inicio': 'home',
      'Reuniones de Equipo': 'reuniones',
      'Tutorías': 'tutorias',
      'Evaluaciones': 'evaluaciones',
      'Otros': 'otros'
    };

    const disabledSubs = ['Actas', 'BOCC', 'Calendario de reuniones'];

    return cats.map(cat => {
      const nombre = cat.nombre;
      
      // Generación automática de slug URL amigable 
      const slug = nombre.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // elimina acentos
        .replace(/º/g, "") // los elimina los simbolos º
        .replace(/ª/g, "") // los elimina los simbolos ª
        .replace(/\s+/g, '-') // convierte espacios en guiones
        .replace(/[^a-z0-9-]/g, ''); // elimina caracteres no deseados

      // Construcción de la ruta
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
        nombre: nombre,
        icono: iconMap[nombre] || 'categoria-generica',
        ruta: ruta,
        abierto: false,
        subcategorias: subcategorias,
        deshabilitado: deshabilitado
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
