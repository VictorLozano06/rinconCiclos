import { Routes } from '@angular/router';
import { RedirectInicialComponent } from './components/redirect-inicial/redirect-inicial.component';
import { coordinadorGuard } from './guards/coordinador.guard';

export const routes: Routes = [
  {
    path: 'profesor',
    loadChildren: () => import('./pages/profesor/profesor.routes').then(m => m.PROFESOR_ROUTES)
  },
  {
    path: 'coordinador',
    canActivate: [coordinadorGuard],
    loadChildren: () => import('./pages/coordinador/coordinador.routes').then(m => m.COORDINADOR_ROUTES)
  },
  {
    path: '',
    component: RedirectInicialComponent,
    pathMatch: 'full'
  },
  {
    path: 'sin-acceso',
    pathMatch: 'full',
    redirectTo: ''
  },
  {
    path: '**',
    redirectTo: ''
  }
];
