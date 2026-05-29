import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AccesoAppService } from '../services/acceso-app.service';

export const coordinadorGuard: CanActivateFn = () => {
  const accesoAppService = inject(AccesoAppService);
  const router = inject(Router);

  accesoAppService.inicializarDesdeUbicacionActual();

  if (accesoAppService.puedeAccederCoordinador()) {
    return true;
  }

  if (accesoAppService.puedeAccederProfesor()) {
    return router.createUrlTree(['/profesor/inicio']);
  }

  return router.createUrlTree(['/sin-acceso']);
};
