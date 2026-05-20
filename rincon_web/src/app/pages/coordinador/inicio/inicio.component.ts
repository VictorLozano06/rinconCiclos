import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RecursoItemComponent } from '../../../components/recurso-item/recurso-item.component';
import { RecursoDto } from '../../../dto/recurso.dto';
import { RecursoService } from '../../../services/recurso.service';

@Component({
  selector: 'app-inicio-coordinador',
  standalone: true,
  imports: [CommonModule, RouterModule, RecursoItemComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {
  public recursosRecientes: RecursoDto[] = [];
  public cargandoRecursos = true;
  public errorRecursos = false;

  constructor(private recursoService: RecursoService) {}

  ngOnInit(): void {
    this.cargarRecursos();
  }

  cargarRecursos(): void {
    this.cargandoRecursos = true;
    this.errorRecursos = false;

    this.recursoService.getTodos().subscribe({
      next: (recursos) => {
        this.recursosRecientes = [...recursos]
          .sort((a, b) => new Date(b.fechaPublicacion).getTime() - new Date(a.fechaPublicacion).getTime())
          .slice(0, 5);
        this.cargandoRecursos = false;
      },
      error: (err) => {
        this.errorRecursos = true;
        this.cargandoRecursos = false;
        console.error('Error al cargar los recursos recientes del coordinador:', err);
      }
    });
  }

  formatearCurso(recurso: RecursoDto): string {
    return `${recurso.anioInicio}/${recurso.anioFin}`;
  }

  formatearCiclos(recurso: RecursoDto): string {
    return (recurso.ciclos || []).map((ciclo) => ciclo.nombre).join(' · ');
  }
}
