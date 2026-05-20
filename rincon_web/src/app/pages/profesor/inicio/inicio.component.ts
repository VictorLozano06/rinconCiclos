import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RecursoItemComponent } from '../../../components/recurso-item/recurso-item.component';

@Component({
  selector: 'app-inicio-profesor',
  standalone: true,
  imports: [CommonModule, RecursoItemComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {
  public recursosRecientes = [
    {
      categoria: '1ª Evaluación',
      fechaPublicacion: 'Hace 2 días',
      nombre: 'Actas y Notas 1ª Evaluación Automoción',
      descripcion: 'Adjunto los enlaces a los horarios y el acta oficial de la reunión.'
    },
    {
      categoria: 'Objetivos',
      fechaPublicacion: 'Hace 5 días',
      nombre: 'Planificación Docente Segundo Semestre',
      descripcion: 'Guía de contenidos y objetivos para el siguiente periodo académico.'
    }
  ];

  constructor() {}

  ngOnInit(): void {}
}

