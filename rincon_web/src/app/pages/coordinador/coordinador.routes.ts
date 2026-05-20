import { Routes } from '@angular/router';
import { CoordinadorLayoutComponent } from './layout/coordinador-layout.component';
import { InicioComponent } from './inicio/inicio.component';
import { ConvocatoriasComponent } from './convocatorias/convocatorias.component';
import { RecursosCategoriaComponent } from './recursos-categoria/recursos-categoria.component';

export const COORDINADOR_ROUTES: Routes = [
  {
    path: '',
    component: CoordinadorLayoutComponent,
    children: [
      { path: '', component: InicioComponent },
      { path: 'inicio', component: InicioComponent },
      { path: 'reuniones-de-equipo/convocatorias', component: ConvocatoriasComponent },
      { path: 'reuniones-de-equipo/convocatorias/crear', component: ConvocatoriasComponent },
      { path: 'reuniones-de-equipo/convocatorias/:id', component: ConvocatoriasComponent },
      { path: 'reuniones-de-equipo/convocatorias/:id/editar', component: ConvocatoriasComponent },
      { path: ':section', component: RecursosCategoriaComponent },
      { path: ':section/:subsection', component: RecursosCategoriaComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];


