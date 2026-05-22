import { Routes } from '@angular/router';
import { CoordinadorLayoutComponent } from './layout/coordinador-layout.component';
import { InicioComponent } from './inicio/inicio.component';
import { ConvocatoriasComponent } from './convocatorias/convocatorias.component';
import { ConvocatoriasCanceladasComponent } from './convocatorias-canceladas/convocatorias-canceladas.component';
import { RecursoListadoCategoriaCoordinadorComponent } from './recurso-listado-categoria/recurso-listado-categoria.component';
import { RecursoListadoCoordinadorComponent } from './recurso-listado/recurso-listado.component';
import { RecursoFormularioPaginaComponent } from './recurso-formulario-pagina/recurso-formulario-pagina.component';
import { RecursoDetalleCompartidoComponent } from '../../components/recurso-detalle-compartido/recurso-detalle-compartido.component';
import { CiclosCursosComponent } from '../../components/ciclos-cursos/ciclos-cursos.component';

export const COORDINADOR_ROUTES: Routes = [
  {
    path: '',
    component: CoordinadorLayoutComponent,
    children: [
      { path: '', component: InicioComponent },
      { path: 'inicio', component: InicioComponent },
      { path: 'reuniones-de-equipo/convocatorias', component: ConvocatoriasComponent },
      { path: 'reuniones-de-equipo/convocatorias/canceladas', component: ConvocatoriasCanceladasComponent },
      { path: 'reuniones-de-equipo/convocatorias/canceladas/:id', component: ConvocatoriasCanceladasComponent },
      { path: 'reuniones-de-equipo/convocatorias/crear', component: ConvocatoriasComponent },
      { path: 'reuniones-de-equipo/convocatorias/:id/editar', component: ConvocatoriasComponent },
      { path: 'reuniones-de-equipo/convocatorias/:id', component: ConvocatoriasComponent },
      { path: 'gestion-de-ciclos', component: CiclosCursosComponent },
      { path: 'gestion-de-cursos', component: CiclosCursosComponent },
      { path: 'recursos', component: RecursoListadoCoordinadorComponent, data: { rutaBase: '/coordinador', rutaInicio: '/coordinador/recursos' } },
      { path: 'recursos/crear', component: RecursoFormularioPaginaComponent, data: { modoFormulario: 'crear' } },
      { path: 'recursos/:idCategoria/:numRecurso/editar', component: RecursoFormularioPaginaComponent, data: { modoFormulario: 'editar' } },
      { path: 'recursos/:idCategoria/:numRecurso', component: RecursoDetalleCompartidoComponent, data: { rutaBase: '/coordinador', rutaInicio: '/coordinador/recursos' } },
      { path: ':section', component: RecursoListadoCategoriaCoordinadorComponent },
      { path: ':section/:subsection', component: RecursoListadoCategoriaCoordinadorComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];


