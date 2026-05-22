import { Routes } from '@angular/router';
import { ProfesorLayoutComponent } from './layout/profesor-layout.component';
import { InicioComponent } from './inicio/inicio.component';
import { RecursoListadoCategoriaProfesorComponent } from './recurso-listado-categoria/recurso-listado-categoria.component';
import { ProfesorConvocatoriasComponent } from './convocatorias/convocatorias.component';
import { RecursoDetalleCompartidoComponent } from '../../components/recurso-detalle-compartido/recurso-detalle-compartido.component';
import { ActasAsistenciaComponent } from './actas-asistencia/actas-asistencia.component';
import { ActasRedaccionComponent } from './actas-redaccion/actas-redaccion.component';
import { ActasInicioProfesorComponent } from './actas-inicio/actas-inicio.component';

export const PROFESOR_ROUTES: Routes = [
  {
    path: '',
    component: ProfesorLayoutComponent,
    children: [
      { path: '', component: InicioComponent },
      { path: 'inicio', component: InicioComponent },
      { path: 'reuniones-de-equipo/convocatorias', component: ProfesorConvocatoriasComponent },
      { path: 'reuniones-de-equipo/convocatorias/:id', component: ProfesorConvocatoriasComponent },
      { path: 'proceso-de-actas', component: ActasInicioProfesorComponent },
      { path: 'proceso-de-actas/asistencia', component: ActasAsistenciaComponent },
      { path: 'proceso-de-actas/redaccion', component: ActasRedaccionComponent },
      { path: 'recurso/:idCategoria/:numRecurso', component: RecursoDetalleCompartidoComponent, data: { rutaBase: '/profesor', rutaInicio: '/profesor/inicio' } },
      { path: ':section', component: RecursoListadoCategoriaProfesorComponent },
      { path: ':section/:subsection', component: RecursoListadoCategoriaProfesorComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
