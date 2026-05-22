import { Component, OnInit } from '@angular/core';
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

    const disabledSubs = ['BOCC', 'Calendario de reuniones'];

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
        abierto: subcategorias.length > 0, // abierto por defecto si tiene hijos
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
}
