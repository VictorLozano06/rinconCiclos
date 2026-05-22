import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RecursoItemComponent } from '../recurso-item/recurso-item.component';

@Component({
  selector: 'app-role-home',
  standalone: true,
  imports: [CommonModule, RecursoItemComponent],
  templateUrl: './role-home.component.html',
  styleUrl: './role-home.component.css'
})
export class RoleHomeComponent {
  public recursosRecientes = [
    {
      categoria: '1ª Evaluación',
      fechaPublicacion: 'Hace 2 días',
      nombre: 'Actas y Notas 1ª Evaluación Automoción',
      descripcion: 'Adjunto los enlaces a los horarios y el acta oficial de la reunión.',
      url: 'https://google.com'
    },
    {
      categoria: 'Objetivos',
      fechaPublicacion: 'Hace 5 días',
      nombre: 'Planificación Docente Segundo Semestre',
      descripcion: 'Guía de contenidos y objetivos para el siguiente periodo académico.',
      archivo: 'planificacion.pdf'
    },
    {
      categoria: 'PAT',
      fechaPublicacion: 'Hace 1 semana',
      nombre: 'Seguimiento PAT - 1º DAW',
      descripcion: 'Actualización del plan de acción tutorial para el grupo de primero.',
      url: 'https://google.com'
    }
  ];
}
