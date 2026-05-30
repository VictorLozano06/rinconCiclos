import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-convocatoria-item',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './convocatoria-item.component.html',
  styleUrl: './convocatoria-item.component.css'
})
export class ConvocatoriaItemComponent {
  @Input() fecha: string = '';
  @Input() lugar: string = '';
  @Input() inicia: string | null = '';
  @Input() redacta: string = '';
  @Input() detalleRuta: string | (string | number)[] = '';
}
