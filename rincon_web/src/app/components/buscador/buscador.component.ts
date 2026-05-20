import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-buscador',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './buscador.component.html',
  styleUrl: './buscador.component.css'
})
export class BuscadorComponent {
  onSearch(event: any) {
    const value = event.target.value;
    console.log('Buscando:', value);
    // TODO: Implementar lógica de búsqueda
  }
}
