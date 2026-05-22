import { Routes } from '@angular/router';
import { ProfesorLayoutComponent } from './layout/profesor-layout.component';
import { InicioComponent } from './inicio/inicio.component';
import { RecursosCategoriaComponent } from './recursos-categoria/recursos-categoria.component';
import { ActasAsistenciaComponent } from './actas-asistencia/actas-asistencia.component';
import { ActasRedaccionComponent } from './actas-redaccion/actas-redaccion.component';

export const PROFESOR_ROUTES: Routes = [
  {
    path: '',
    component: ProfesorLayoutComponent,
    children: [
      { path: '', component: InicioComponent },
      { path: 'inicio', component: InicioComponent },
      { path: 'proceso-de-actas/asistencia', component: ActasAsistenciaComponent },
      { path: 'proceso-de-actas/redaccion', component: ActasRedaccionComponent },
      { path: ':section', component: RecursosCategoriaComponent },
      { path: ':section/:subsection', component: RecursosCategoriaComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
