import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActasService, ActaHistorial, Informacion } from '../../../services/actas.service';
import { PdfService } from '../../../services/pdf.service';
import { ProcesoActasService } from '../../../services/proceso-actas.service';

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
    private pdfService: PdfService,
    private procesoActasService: ProcesoActasService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const idProfesorActual = 1;
    this.buscando = true;
    
    this.actasService.getHistorialPorProfesor(idProfesorActual).subscribe({
      next: (actas) => {
        this.actasFiltradas = actas;
        this.buscando = false;
        this.busquedaRealizada = true;
      },
      error: (err) => {
        console.error('Error cargando historial de actas del profesor', err);
        this.buscando = false;
        this.busquedaRealizada = true;
        this.actasFiltradas = [];
      }
    });
  }

  verActa(acta: ActaHistorial): void {
    this.actaVisualizando = acta;
  }

  editarActa(acta: ActaHistorial): void {
    this.procesoActasService.cargarActaParaEdicion(acta);
    this.router.navigate(['/profesor/reuniones-de-equipo/actas/redaccion']);
  }

  cerrarModal(): void {
    this.actaVisualizando = null;
  }

  descargarActa(acta: ActaHistorial): void {
    this.pdfService.generarActaPdf(acta);
  }
}

