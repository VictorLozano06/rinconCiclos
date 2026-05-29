import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActasService, ActaHistorial, Informacion } from '../../../services/actas.service';
import { PdfService } from '../../../services/pdf.service';


@Component({
  selector: 'app-actas-historial',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './actas-historial.component.html',
  styleUrl: './actas-historial.component.css'
})
export class ActasHistorialComponent implements OnInit {
  public aniosDisponibles: number[] = [];
  public anioSeleccionado: number | null = null;
  public buscando = false;
  public actaVisualizando: ActaHistorial | null = null;

  public actasFiltradas: ActaHistorial[] = [];
  public busquedaRealizada = false;

  constructor(
    private actasService: ActasService,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void {
    this.actasService.getAniosDisponibles().subscribe({
      next: (anios) => {
        this.aniosDisponibles = anios;
        if (anios.length > 0) {
          this.anioSeleccionado = anios[0];
        }
      },
      error: (err) => console.error('Error cargando años disponibles', err)
    });
  }

  get cursoSeleccionado(): string {
    const anio = this.aniosDisponibles.find(a => a === this.anioSeleccionado);
    return anio ? `${anio}/${anio + 1}` : '';
  }

  buscar(): void {
    if (!this.anioSeleccionado) return;
    this.buscando = true;
    this.actasService.getHistorialPorAnio(this.anioSeleccionado).subscribe({
      next: (actas) => {
        this.actasFiltradas = actas;
        this.buscando = false;
        this.busquedaRealizada = true;
      },
      error: (err) => {
        console.error('Error buscando actas', err);
        this.buscando = false;
        this.busquedaRealizada = true;
        this.actasFiltradas = [];
      }
    });
  }

  verActa(acta: ActaHistorial): void {
    this.actaVisualizando = acta;
  }

  cerrarModal(): void {
    this.actaVisualizando = null;
  }

  descargarActa(acta: ActaHistorial): void {
    this.pdfService.generarActaPdf(acta);
  }
}

