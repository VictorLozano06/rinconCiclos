import { Routes } from '@angular/router';
import { ProfesorLayoutComponent } from './layout/profesor-layout.component';
import { InicioComponent } from './inicio/inicio.component';
import { RecursosCategoriaComponent } from './recursos-categoria/recursos-categoria.component';
import { ProfesorConvocatoriasComponent } from './convocatorias/convocatorias.component';

export const PROFESOR_ROUTES: Routes = [
  {
    path: '',
    component: ProfesorLayoutComponent,
    children: [
      { path: '', component: InicioComponent },
      { path: 'inicio', component: InicioComponent },
      { path: 'reuniones-de-equipo/convocatorias', component: ProfesorConvocatoriasComponent },
      { path: 'reuniones-de-equipo/convocatorias/:id', component: ProfesorConvocatoriasComponent },
      { path: ':section', component: RecursosCategoriaComponent },
      { path: ':section/:subsection', component: RecursosCategoriaComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
