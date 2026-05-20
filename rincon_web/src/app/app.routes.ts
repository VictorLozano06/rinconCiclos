import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';

export const routes: Routes = [
  {
    path: 'profesor',
    loadChildren: () => import('./pages/profesor/profesor.routes').then(m => m.PROFESOR_ROUTES)
  },
  {
    path: 'coordinador',
    loadChildren: () => import('./pages/coordinador/coordinador.routes').then(m => m.COORDINADOR_ROUTES)
  },
  {
    path: '',
    component: LandingComponent, /*Aqui iria la movida de aitor*/
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
