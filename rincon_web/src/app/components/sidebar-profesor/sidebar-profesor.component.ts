import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CategoriaService } from '../../services/categoria.service';
import { CategoriaDto } from '../../dto/categoria.dto';
import { AccesoAppService } from '../../services/acceso-app.service';

/**
 * DTO visual específico del sidebar de profesor.
 *
 * Parte de la estructura real de categorías y añade solo lo necesario para la
 * navegación:
 * - icono
 * - ruta resuelta
 * - estado abierto/cerrado
 * - indicador de deshabilitado
 */
interface CategoriaSidebar extends CategoriaDto {
  icono: string;
  ruta: string;
  abierto: boolean;
  subcategorias: CategoriaSidebar[];
  deshabilitado: boolean;
}

/**
 * Sidebar lateral del perfil profesor.
 *
 * Carga las categorías reales del backend, las transforma en enlaces de
 * navegación y añade accesos fijos como "Inicio". También decide si debe
 * mostrarse el acceso al panel de coordinador según los roles detectados.
 */
@Component({
  selector: 'app-sidebar-profesor',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar-profesor.component.html',
  styleUrl: './sidebar-profesor.component.css'
})
export class SidebarProfesorComponent implements OnInit {
  /**
   * Indica si el sidebar está abierto en móvil.
   *
   * Lo consume la plantilla para aplicar estilos de panel desplegable.
   */
  @Input() mobileOpen = false;

  /**
   * Evento que permite pedir al layout que cierre el sidebar en móvil.
   */
  @Output() requestClose = new EventEmitter<void>();

  /**
   * Árbol final que pinta la plantilla del sidebar.
   */
  public categorias: CategoriaSidebar[] = [];

  /**
   * Controla si se muestra el atajo hacia el área de coordinador.
   */
  public mostrarAccesoCoordinador = false;

  constructor(
    private categoriaService: CategoriaService,
    private accesoAppService: AccesoAppService
  ) {}

  /**
   * Inicializa los roles del usuario y carga las categorías del menú.
   *
   * @returns void
   */
  ngOnInit(): void {
    this.accesoAppService.inicializarDesdeUbicacionActual();
    this.mostrarAccesoCoordinador = this.accesoAppService.puedeAccederCoordinador();
    this.obtenerCategorias();
  }

  /**
   * Pide al backend el árbol de categorías real y le añade la capa visual.
   *
   * La primera entrada se inyecta manualmente porque "Inicio" es navegación de
   * la app, no una categoría guardada en la base de datos.
   *
   * @returns void
   */
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
      error: (err: unknown) => {
        console.error('Error al cargar las categorias del sidebar:', err);
      }
    });
  }

  /**
   * Convierte el árbol DTO del backend en elementos navegables del sidebar.
   *
   * Cada categoría recibe:
   * - un icono visual
   * - una ruta basada en slug
   * - sus hijas ya transformadas
   * - un estado deshabilitado si es una opción especial no navegable
   *
   * @param categorias Categorías del nivel actual.
   * @param prefijo Prefijo base de ruta, por ejemplo `/profesor`.
   * @param rutaPadre Ruta ya acumulada cuando estamos en una subcategoría.
   *
   * @returns Árbol listo para pintar en la plantilla.
   */
  private mapCategorias(categorias: CategoriaDto[], prefijo: string, rutaPadre = ''): CategoriaSidebar[] {
    const iconosPorNombre: Record<string, string> = {
      'Reuniones de Equipo': 'reuniones',
      Tutorias: 'tutorias',
      Evaluaciones: 'evaluaciones',
      Otros: 'otros'
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

  /**
   * Abre o cierra un bloque del sidebar cuando tiene subcategorías.
   *
   * @param categoria Nodo visual del sidebar que se quiere alternar.
   *
   * @returns void
   */
  toggleMenu(categoria: CategoriaSidebar): void {
    if (categoria.subcategorias.length > 0) {
      categoria.abierto = !categoria.abierto;
    }
  }

  /**
   * Pide al layout cerrar el sidebar, sobre todo en vista móvil.
   *
   * @returns void
   */
  cerrarSidebar(): void {
    this.requestClose.emit();
  }

  /**
   * Responde al clic de una categoría en el sidebar.
   *
   * Si la categoría tiene hijas, alterna su despliegue. Si es una hoja final,
   * además pide cerrar el sidebar en móvil para dejar visible el contenido.
   *
   * @param categoria Elemento pulsado por el usuario.
   *
   * @returns void
   */
  activarCategoria(categoria: CategoriaSidebar): void {
    this.toggleMenu(categoria);

    if (categoria.subcategorias.length === 0) {
      this.cerrarSidebar();
    }
  }

  /**
   * Normaliza un texto quitando tildes para poder comparar nombres.
   *
   * Sirve para que "Tutorias" y "Tutorías" se traten igual al decidir iconos
   * y otros detalles visuales del menú.
   *
   * @param valor Texto de entrada.
   *
   * @returns Texto sin diacríticos.
   */
  private normalizarTexto(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Convierte un nombre visible a un slug de ruta amigable.
   *
   * Ejemplo:
   * - `1 Evaluación` -> `1-evaluacion`
   * - `Calendario de reuniones` -> `calendario-de-reuniones`
   *
   * @param valor Nombre visible de la categoría.
   *
   * @returns Fragmento de URL limpio.
   */
  private crearSlug(valor: string): string {
    return this.normalizarTexto(valor)
      .toLowerCase()
      .replace(/[ÂºÂª]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
}
