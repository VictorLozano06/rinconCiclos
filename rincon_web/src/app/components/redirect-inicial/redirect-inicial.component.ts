import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AccesoAppService } from '../../services/acceso-app.service';

@Component({
  selector: 'app-redirect-inicial',
  standalone: true,
  template: ''
})
export class RedirectInicialComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly accesoAppService = inject(AccesoAppService);

  ngOnInit(): void {
    this.accesoAppService.inicializarDesdeUbicacionActual();

    if (this.accesoAppService.puedeAccederProfesor()) {
      void this.router.navigate(['/profesor/inicio'], { replaceUrl: true });
      return;
    }

    if (this.accesoAppService.puedeAccederCoordinador()) {
      void this.router.navigate(['/coordinador/inicio'], { replaceUrl: true });
      return;
    }

    window.location.replace('https://17.daw.esvirgua.com');
  }
}
