import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BuscadorComponent } from '../../../components/buscador/buscador.component';
import { SidebarProfesorComponent } from '../../../components/sidebar-profesor/sidebar-profesor.component';

@Component({
  selector: 'app-profesor-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarProfesorComponent, BuscadorComponent],
  templateUrl: './profesor-layout.component.html',
  styleUrl: './profesor-layout.component.css'
})
export class ProfesorLayoutComponent {
  public sidebarOpen = false;

  openSidebar(): void {
    this.sidebarOpen = true;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }
}
