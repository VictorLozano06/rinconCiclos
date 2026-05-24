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

  get metaSuperior(): string {
    const fecha = this.fechaPublicacion ? this.formatearFecha(this.fechaPublicacion) : '';
    const categoria = (this.categoria || '').trim();
    const nombre = (this.nombre || '').trim();

    if (!categoria) {
      return fecha;
    }

    if (categoria.toLowerCase() === nombre.toLowerCase()) {
      return fecha;
    }

    return fecha ? `${categoria} - ${fecha}` : categoria;
  }

  private formatearFecha(valor: string): string {
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) {
      return valor;
    }

    return fecha.toLocaleDateString('es-ES');
  }
}
