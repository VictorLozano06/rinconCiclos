import { Routes } from '@angular/router';
import { CoordinadorLayoutComponent } from './layout/coordinador-layout.component';
import { InicioComponent } from './inicio/inicio.component';
import { RecursosCategoriaComponent } from './recursos-categoria/recursos-categoria.component';
import { CiclosCursosComponent } from './ciclos-cursos/ciclos-cursos.component';
import { ActasPlantillaComponent } from './actas-plantilla/actas-plantilla.component';
import { ActasHistorialComponent } from './actas-historial/actas-historial.component';

export const COORDINADOR_ROUTES: Routes = [
  {
    path: '',
    component: CoordinadorLayoutComponent,
    children: [
      { path: '', component: InicioComponent },
      { path: 'inicio', component: InicioComponent },
      { path: 'gestion-de-ciclos', component: CiclosCursosComponent },
      { path: 'proceso-de-actas/plantillas', component: ActasPlantillaComponent },
      { path: 'proceso-de-actas/historial', component: ActasHistorialComponent },
      { path: ':section', component: RecursosCategoriaComponent },
      { path: ':section/:subsection', component: RecursosCategoriaComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];


