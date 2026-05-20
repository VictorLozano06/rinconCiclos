import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recurso-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recurso-item.component.html',
  styleUrl: './recurso-item.component.css'
})
export class RecursoItemComponent {
  @Input() nombre: string = '';
  @Input() descripcion: string = '';
  @Input() fechaPublicacion: string = '';
  @Input() categoria: string = '';
}
