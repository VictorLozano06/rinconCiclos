import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
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
export class ProfesorLayoutComponent implements OnInit {
  public sidebarOpen = typeof window !== 'undefined' ? window.innerWidth > 768 : true;

  ngOnInit(): void {
    this.syncSidebarMode();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  @HostListener('window:resize')
  onResize(): void {
    this.syncSidebarMode();
  }

  private syncSidebarMode(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (window.innerWidth <= 768) {
      this.sidebarOpen = false;
    }
  }
}
