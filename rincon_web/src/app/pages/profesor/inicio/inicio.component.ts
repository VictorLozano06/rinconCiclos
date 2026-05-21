import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RecursoItemComponent } from '../../../components/recurso-item/recurso-item.component';
import { RecursoService } from '../../../services/recurso.service';
import { RecursoDto } from '../../../dto/recurso.dto';

@Component({
  selector: 'app-inicio-profesor',
  standalone: true,
  imports: [CommonModule, RecursoItemComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {
  // Recursos que aparecen en la portada del profesor.
  public recursosRecientes: RecursoDto[] = [];
  public cargandoRecursos = true;
  public errorRecursos = false;

  constructor(private recursoService: RecursoService) {}

  ngOnInit(): void {
    this.cargarRecursos();
  }

  // Carga los recursos recientes desde la API.
  cargarRecursos(): void {
    this.cargandoRecursos = true;
    this.errorRecursos = false;

    this.recursoService.getRecientesProfesor().subscribe({
      next: (recursos) => {
        this.recursosRecientes = recursos;
        this.cargandoRecursos = false;
      },
      error: (err) => {
        this.errorRecursos = true;
        this.cargandoRecursos = false;
        console.error('Error al cargar los recursos recientes del profesorado:', err);
      }
    });
  }
}
