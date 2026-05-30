import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RecursoItemComponent } from '../../../components/recurso-item/recurso-item.component';
import { ConvocatoriaItemComponent } from '../../../components/convocatoria-item/convocatoria-item.component';
import { RecursoDto } from '../../../dto/recurso.dto';
import { RecursoService } from '../../../services/recurso.service';
import { ConvocatoriaService } from '../../../services/convocatoria.service';
import { ConvocatoriaListaItemDto } from '../../../dto/convocatoria-lista-item.dto';

@Component({
  selector: 'app-inicio-profesor',
  standalone: true,
  imports: [CommonModule, RecursoItemComponent, ConvocatoriaItemComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {
  public recursosRecientes: RecursoDto[] = [];
  public cargandoRecursos = true;
  public errorRecursos = false;

  public convocatoriasRecientes: ConvocatoriaListaItemDto[] = [];
  public cargandoConvocatorias = true;
  public errorConvocatorias = false;

  public itemsRecientes: any[] = [];

  constructor(
    private recursoService: RecursoService,
    private convocatoriaService: ConvocatoriaService
  ) {}

  ngOnInit(): void {
    this.cargarRecursos();
    this.cargarConvocatorias();
  }

  cargarRecursos(): void {
    this.cargandoRecursos = true;
    this.errorRecursos = false;

    this.recursoService.getRecientesProfesor().subscribe({
      next: (recursos) => {
        this.recursosRecientes = recursos;
        this.cargandoRecursos = false;
        this.combinarRecientes();
      },
      error: (err) => {
        this.errorRecursos = true;
        this.cargandoRecursos = false;
        this.combinarRecientes();
        console.error('Error al cargar los recursos recientes del profesorado:', err);
      }
    });
  }

  cargarConvocatorias(): void {
    this.cargandoConvocatorias = true;
    this.errorConvocatorias = false;

    this.convocatoriaService.listarConvocatoriasProfesor().subscribe({
      next: (convocatorias) => {
        this.convocatoriasRecientes = [...convocatorias]
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
          .slice(0, 5);
        this.cargandoConvocatorias = false;
        this.combinarRecientes();
      },
      error: (err) => {
        this.errorConvocatorias = true;
        this.cargandoConvocatorias = false;
        this.combinarRecientes();
        console.error('Error al cargar las convocatorias recientes:', err);
      }
    });
  }

  private combinarRecientes(): void {
    if (this.cargandoRecursos || this.cargandoConvocatorias) {
      return;
    }

    const items: any[] = [];

    for (const r of this.recursosRecientes) {
      items.push({
        tipo: 'recurso',
        fecha: r.fechaPublicacion,
        categoria: r.categoriaNombre,
        nombre: r.nombre,
        descripcion: r.descripcion,
        curso: this.formatearCurso(r),
        ciclos: this.formatearCiclos(r),
        detalleRuta: ['/profesor', 'recurso', r.idCategoria, r.numRecurso]
      });
    }

    for (const c of this.convocatoriasRecientes) {
      items.push({
        tipo: 'convocatoria',
        fecha: c.fecha,
        lugar: c.lugar,
        inicia: c.inicia,
        redacta: c.redacta,
        detalleRuta: ['/profesor', 'reuniones-de-equipo', 'convocatorias', c.idConvocatoria]
      });
    }

    items.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    this.itemsRecientes = items;
  }

  formatearCurso(recurso: RecursoDto): string {
    return `${recurso.anioInicio}/${recurso.anioFin}`;
  }

  formatearCiclos(recurso: RecursoDto): string {
    return (recurso.ciclos || []).map((ciclo) => ciclo.nombre).join(' / ');
  }
}
