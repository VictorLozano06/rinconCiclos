import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConvocatoriaDetalleDto } from '../../../dto/convocatoria-detalle.dto';
import { ConvocatoriaListaItemDto } from '../../../dto/convocatoria-lista-item.dto';
import { ConvocatoriaService } from '../../../services/convocatoria.service';

@Component({
  selector: 'app-convocatorias-canceladas',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './convocatorias-canceladas.component.html',
  styleUrl: './convocatorias-canceladas.component.css'
})
export class ConvocatoriasCanceladasComponent implements OnInit {
  vista: 'listado' | 'detalle' = 'listado';
  convocatorias: ConvocatoriaListaItemDto[] = [];
  convocatoriaSeleccionada: ConvocatoriaDetalleDto | null = null;
  cargandoListado = true;
  cargandoDetalle = false;
  errorMsg = '';
  feedback = '';
  feedbackError = false;

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
        this.vista = 'listado';
        this.cargarConvocatorias();
      }
    });
  }

  cargarConvocatorias(): void {
    this.cargandoListado = true;
    this.errorMsg = '';
    this.convocatoriaService.listarConvocatoriasCanceladas().subscribe({
      next: (data) => {
        this.convocatorias = data;
        this.cargandoListado = false;
      },
      error: (error) => {
        this.cargandoListado = false;
        this.errorMsg = error?.error?.message || 'Error al cargar las convocatorias canceladas.';
      }
    });
  }

  volverAActivas(): void {
    this.router.navigate(['/coordinador/reuniones-de-equipo/convocatorias']);
  }

  seleccionarConvocatoria(id: number): void {
    this.router.navigate(['/coordinador/reuniones-de-equipo/convocatorias/canceladas', id]);
  }

  volverAlListado(): void {
    this.router.navigate(['/coordinador/reuniones-de-equipo/convocatorias/canceladas']);
  }

  iniciarDetalle(id: number): void {
    this.cargandoDetalle = true;
    this.errorMsg = '';
    this.convocatoriaSeleccionada = null;
    this.vista = 'detalle';

    this.convocatoriaService.getConvocatoria(id).subscribe({
      next: (data) => {
        if (!data.cancelada) {
          this.errorMsg = 'La convocatoria seleccionada no esta cancelada.';
          this.cargandoDetalle = false;
          return;
        }

        this.convocatoriaSeleccionada = data;
        this.cargandoDetalle = false;
      },
      error: (error) => {
        this.cargandoDetalle = false;
        this.errorMsg = error?.error?.message || 'Error al cargar los detalles de la convocatoria cancelada.';
      }
    });
  }

  eliminarConvocatoria(id: number, event?: Event): void {
    event?.stopPropagation();

    if (!confirm('Estas seguro de que deseas borrar definitivamente esta convocatoria?')) {
      return;
    }

    this.convocatoriaService.eliminar(id).subscribe({
      next: (response) => {
        this.feedback = response.message;
        this.feedbackError = false;
        if (this.vista === 'detalle') {
          this.router.navigate(['/coordinador/reuniones-de-equipo/convocatorias/canceladas']);
        } else {
          this.cargarConvocatorias();
        }
        setTimeout(() => (this.feedback = ''), 3000);
      },
      error: (error) => {
        this.feedback = error?.error?.message || 'No se pudo borrar la convocatoria.';
        this.feedbackError = true;
        setTimeout(() => (this.feedback = ''), 3000);
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
}
