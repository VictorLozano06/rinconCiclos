import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ConvocatoriaService } from '../../../services/convocatoria.service';
import {
  ConvocatoriaDetalle,
  ConvocatoriaListaItem,
  OrdenDiaItemProfesor
} from '../../../dto/convocatoria.dto';

@Component({
  selector: 'app-convocatorias-profesor',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './convocatorias.component.html',
  styleUrl: './convocatorias.component.css'
})
export class ProfesorConvocatoriasComponent implements OnInit {
  convocatoras: ConvocatoriaListaItem[] = [];
  convocatoriaSeleccionada: ConvocatoriaDetalle | null = null;
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
}
