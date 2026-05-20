import { Routes } from '@angular/router';
import { CoordinadorLayoutComponent } from './layout/coordinador-layout.component';
import { InicioComponent } from './inicio/inicio.component';
import { ConvocatoriasComponent } from './convocatorias/convocatorias.component';
import { RecursosCategoriaComponent } from './recursos-categoria/recursos-categoria.component';
import { RecursosComponent } from './recursos/recursos.component';
import { RecursoDetalleComponent } from '../profesor/recurso-detalle/recurso-detalle.component';
import { CiclosCursosComponent } from '../../components/ciclos-cursos/ciclos-cursos.component';

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
      { path: 'gestion-de-ciclos', component: CiclosCursosComponent },
      { path: 'gestion-de-cursos', component: CiclosCursosComponent },
      { path: 'recursos', component: RecursosComponent, data: { basePath: '/coordinador', homeRoute: '/coordinador/recursos' } },
      { path: 'recursos/:idCategoria/:numRecurso', component: RecursoDetalleComponent, data: { basePath: '/coordinador', homeRoute: '/coordinador/recursos' } },
      { path: ':section', component: RecursosCategoriaComponent },
      { path: ':section/:subsection', component: RecursosCategoriaComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];


