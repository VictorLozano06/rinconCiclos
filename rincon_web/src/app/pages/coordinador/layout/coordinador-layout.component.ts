import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BuscadorComponent } from '../../../components/buscador/buscador.component';
import { SidebarCoordinadorComponent } from '../../../components/sidebar-coordinador/sidebar-coordinador.component';

@Component({
  selector: 'app-coordinador-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarCoordinadorComponent, BuscadorComponent],
  templateUrl: './coordinador-layout.component.html',
  styleUrl: './coordinador-layout.component.css'
})
export class CoordinadorLayoutComponent {
  sidebarOpen = false;

  openSidebar(): void {
    this.sidebarOpen = true;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }
}
