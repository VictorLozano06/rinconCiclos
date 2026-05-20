import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-recurso-item',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recurso-item.component.html',
  styleUrl: './recurso-item.component.css'
})
export class RecursoItemComponent {
  // Datos visuales comunes para la tarjeta de recurso.
  @Input() nombre: string = '';
  @Input() descripcion: string = '';
  @Input() fechaPublicacion: string = '';
  @Input() categoria: string = '';
  @Input() curso: string = '';
  @Input() ciclos: string = '';
  @Input() detalleRuta: string | (string | number)[] = '';
  @Input() enlace: string = '';
}
