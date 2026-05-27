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
  tabActiva: 'borradores' | 'pasadas' = 'borradores';
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
    this.route.queryParamMap.subscribe((queryParams) => {
      const tab = queryParams.get('tab');
      this.tabActiva = tab === 'pasadas' ? 'pasadas' : 'borradores';
    });

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
    this.convocatoriaService.listarConvocatoriasHistoricas().subscribe({
      next: (data) => {
        this.convocatorias = data;
        this.cargandoListado = false;
      },
      error: (error) => {
        this.cargandoListado = false;
        this.errorMsg = error?.error?.message || 'Error al cargar el histórico de convocatorias.';
      }
    });
  }

  volverAActivas(): void {
    this.router.navigate(['/coordinador/reuniones-de-equipo/convocatorias']);
  }

  cambiarTab(tab: 'borradores' | 'pasadas'): void {
    this.tabActiva = tab;
    this.router.navigate(
      ['/coordinador/reuniones-de-equipo/convocatorias/historico'],
      { queryParams: { tab } }
    );
  }

  seleccionarConvocatoria(id: number): void {
    this.router.navigate(['/coordinador/reuniones-de-equipo/convocatorias/historico', id]);
  }

  retomarConvocatoria(id: number): void {
    this.router.navigate(['/coordinador/reuniones-de-equipo/convocatorias', id, 'editar']);
  }

  volverAlListado(): void {
    this.router.navigate(
      ['/coordinador/reuniones-de-equipo/convocatorias/historico'],
      { queryParams: { tab: this.tabActiva } }
    );
  }

  iniciarDetalle(id: number): void {
    this.cargandoDetalle = true;
    this.errorMsg = '';
    this.convocatoriaSeleccionada = null;
    this.vista = 'detalle';

    this.convocatoriaService.getConvocatoria(id).subscribe({
      next: (data) => {
        if (data.estado === 'a') {
          this.errorMsg = 'La convocatoria seleccionada es activa y no pertenece al histórico.';
          this.cargandoDetalle = false;
          return;
        }

        this.convocatoriaSeleccionada = data;
        this.cargandoDetalle = false;
      },
      error: (error) => {
        this.cargandoDetalle = false;
        this.errorMsg = error?.error?.message || 'Error al cargar los detalles de la convocatoria.';
      }
    });
  }

  eliminarConvocatoria(id: number, event?: Event): void {
    event?.stopPropagation();

    if (!confirm('Estas seguro de que deseas borrar definitivamente esta convocatoria?')) {
      return;
    }

    this.feedback = 'No se borran convocatorias.';
    this.feedbackError = false;
    setTimeout(() => (this.feedback = ''), 3000);
  }

  getEstadoLabel(estado?: string | null): string {
    switch (estado) {
      case 'b':
        return 'Borrador';
      case 'p':
        return 'Pasada';
      case 'a':
        return 'Activa';
      default:
        return 'Sin estado';
    }
  }

  getEstadoClase(estado?: string | null): string {
    switch (estado) {
      case 'b':
        return 'status-badge-borrador';
      case 'p':
        return 'status-badge-historica';
      case 'a':
        return 'status-badge-activa';
      default:
        return 'status-badge-historica';
    }
  }

  puedeRetomar(estado?: string | null): boolean {
    return estado === 'b';
  }

  get borradores(): ConvocatoriaListaItemDto[] {
    return this.convocatorias.filter((convocatoria) => convocatoria.estado === 'b');
  }

  get pasadas(): ConvocatoriaListaItemDto[] {
    return this.convocatorias.filter((convocatoria) => convocatoria.estado === 'p');
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
