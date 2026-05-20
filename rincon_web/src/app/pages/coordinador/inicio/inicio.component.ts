import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RecursoItemComponent } from '../../../components/recurso-item/recurso-item.component';

@Component({
  selector: 'app-inicio-coordinador',
  standalone: true,
  imports: [CommonModule, RecursoItemComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {
  public recursosRecientes = [
    {
      categoria: 'Administración',
      fechaPublicacion: 'Hoy',
      nombre: 'Gestión de Ciclos Formativos 2026',
      descripcion: 'Panel de control para la gestión de nuevos ciclos y cursos.'
    },
    {
      categoria: 'Personal',
      fechaPublicacion: 'Ayer',
      nombre: 'Alta de nuevos profesores',
      descripcion: 'Listado de solicitudes pendientes de validación para el próximo curso.'
    }
  ];

  constructor() {}

  ngOnInit(): void {}
}

