import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConvocatoriaService } from '../../../services/convocatoria.service';
import { ConvocatoriaDetalleDto } from '../../../dto/convocatoria-detalle.dto';
import { ConvocatoriaListaItemDto } from '../../../dto/convocatoria-lista-item.dto';

interface CoincidenciaProfesorConvocatoria {
  nombre: string;
  contexto: string;
}

@Component({
  selector: 'app-convocatorias-profesor',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './convocatorias.component.html',
  styleUrl: './convocatorias.component.css'
})
export class ProfesorConvocatoriasComponent implements OnInit {
  convocatoras: ConvocatoriaListaItemDto[] = [];
  convocatoriaSeleccionada: ConvocatoriaDetalleDto | null = null;
  buscadorProfesor = '';
  cargandoListado = true;
  cargandoDetalle = false;
  errorMsg = '';

  constructor(
    private convocatoriaService: ConvocatoriaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.iniciarDetalle(Number(idParam));
      } else {
        this.convocatoriaSeleccionada = null;
        this.cargarConvocatorias();
      }
    });
  }

  cargarConvocatorias(): void {
    this.cargandoListado = true;
    this.errorMsg = '';
    this.convocatoriaService.listarConvocatorias().subscribe({
      next: (data) => {
        this.convocatoras = data;
        this.cargandoListado = false;
      },
      error: (error) => {
        this.cargandoListado = false;
        this.errorMsg = error?.error?.message || 'Error al cargar el listado de convocatorias.';
      }
    });
  }

  // Navigation triggered from UI
  seleccionarConvocatoria(id: number): void {
    this.router.navigate(['/profesor/reuniones-de-equipo/convocatorias', id]);
  }

  volverAlListado(): void {
    this.router.navigate(['/profesor/reuniones-de-equipo/convocatorias']);
  }

  // Route initializer
  iniciarDetalle(id: number): void {
    this.cargandoDetalle = true;
    this.errorMsg = '';
    this.convocatoriaSeleccionada = null;

    this.convocatoriaService.getConvocatoria(id).subscribe({
      next: (data) => {
        this.convocatoriaSeleccionada = data;
        this.cargandoDetalle = false;
      },
      error: (error) => {
        this.cargandoDetalle = false;
        this.errorMsg = error?.error?.message || 'Error al cargar los detalles de la convocatoria.';
      }
    });
  }

  formatFecha(fechaStr: string): string {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return fechaStr;
    return fecha.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  get minutosTotales(): number {
    if (!this.convocatoriaSeleccionada || !this.convocatoriaSeleccionada.ordenDia) return 0;
    return this.convocatoriaSeleccionada.ordenDia.reduce((total, item) => total + Number(item.minutos || 0), 0);
  }

  get resultadoBuscadorProfesor(): { encontrado: boolean; coincidencias: CoincidenciaProfesorConvocatoria[] } | null {
    const convocatoria = this.convocatoriaSeleccionada;
    const termino = this.normalizarTexto(this.buscadorProfesor);

    if (!convocatoria || !termino) {
      return null;
    }

    const coincidencias: CoincidenciaProfesorConvocatoria[] = [];

    this.agregarCoincidencia(coincidencias, termino, convocatoria.redacta, 'Redacta la convocatoria');
    this.agregarCoincidencia(coincidencias, termino, convocatoria.inicia, 'Inicia la reunión');

    (convocatoria.ordenDia || []).forEach((punto) => {
      this.agregarCoincidencia(
        coincidencias,
        termino,
        punto.dinamiza,
        `Punto ${punto.numOrden}: dinamiza`
      );

      (punto.participantes || []).forEach((participante) => {
        this.agregarCoincidencia(
          coincidencias,
          termino,
          participante.nombre,
          `Punto ${punto.numOrden}: participa`
        );
      });
    });

    return {
      encontrado: coincidencias.length > 0,
      coincidencias
    };
  }

  limpiarBuscadorProfesor(): void {
    this.buscadorProfesor = '';
  }

  private agregarCoincidencia(
    coincidencias: CoincidenciaProfesorConvocatoria[],
    termino: string,
    nombre: string | null | undefined,
    contexto: string
  ): void {
    if (!nombre) {
      return;
    }

    if (this.normalizarTexto(nombre).includes(termino)) {
      coincidencias.push({
        nombre,
        contexto
      });
    }
  }

  private normalizarTexto(valor: string | null | undefined): string {
    return (valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
