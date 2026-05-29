import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AccesoAppService } from '../services/acceso-app.service';

export const profesorGuard: CanActivateFn = () => {
  const accesoAppService = inject(AccesoAppService);
  const router = inject(Router);

  accesoAppService.inicializarDesdeUbicacionActual();

  if (accesoAppService.puedeAccederProfesor()) {
    return true;
  }

  if (accesoAppService.puedeAccederCoordinador()) {
    return router.createUrlTree(['/coordinador/inicio']);
  }

  return router.createUrlTree(['/sin-acceso']);
};
