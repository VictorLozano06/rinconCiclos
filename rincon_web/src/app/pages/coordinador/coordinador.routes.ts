import { Routes } from '@angular/router';
import { CoordinadorLayoutComponent } from './layout/coordinador-layout.component';
import { InicioComponent } from './inicio/inicio.component';
import { ConvocatoriasComponent } from './convocatorias/convocatorias.component';
import { ConvocatoriasCanceladasComponent } from './convocatorias-canceladas/convocatorias-canceladas.component';
import { RecursoListadoCategoriaCoordinadorComponent } from './recurso-listado-categoria/recurso-listado-categoria.component';
import { RecursoListadoCoordinadorComponent } from './recurso-listado/recurso-listado.component';
import { RecursoFormularioPageComponent } from './recurso-formulario/recurso-formulario.component';
import { RecursoDetalleCompartidoComponent } from '../../components/recurso-detalle-compartido/recurso-detalle-compartido.component';
import { CiclosCursosComponent } from './ciclos-cursos/ciclos-cursos.component';
import { ActasPlantillaComponent } from './actas-plantilla/actas-plantilla.component';
import { ActasHistorialComponent } from './actas-historial/actas-historial.component';
import { ActasInicioCoordinadorComponent } from './actas-inicio/actas-inicio.component';
import { CategoriasComponent } from './categorias/categorias.component';
import { LugaresComponent } from './lugares/lugares.component';
import { GruposParticipantesComponent } from './grupos-participantes/grupos-participantes.component';

export const COORDINADOR_ROUTES: Routes = [
  {
    path: '',
    component: CoordinadorLayoutComponent,
    children: [
      { path: '', component: InicioComponent },
      { path: 'inicio', component: InicioComponent },
      { path: 'reuniones-de-equipo/convocatorias', component: ConvocatoriasComponent },
      { path: 'reuniones-de-equipo/convocatorias/historico', component: ConvocatoriasCanceladasComponent },
      { path: 'reuniones-de-equipo/convocatorias/historico/:id', component: ConvocatoriasCanceladasComponent },
      { path: 'reuniones-de-equipo/convocatorias/canceladas', component: ConvocatoriasCanceladasComponent },
      { path: 'reuniones-de-equipo/convocatorias/canceladas/:id', component: ConvocatoriasCanceladasComponent },
      { path: 'reuniones-de-equipo/convocatorias/crear', component: ConvocatoriasComponent },
      { path: 'reuniones-de-equipo/convocatorias/:id/editar', component: ConvocatoriasComponent },
      { path: 'reuniones-de-equipo/convocatorias/:id', component: ConvocatoriasComponent },
      { path: 'gestion-de-ciclos', component: CiclosCursosComponent },
      { path: 'gestion-de-cursos', component: CiclosCursosComponent },
      { path: 'gestion-de-grupos', component: GruposParticipantesComponent },
      { path: 'categorias', component: CategoriasComponent },
      { path: 'lugares', component: LugaresComponent },
      { path: 'reuniones-de-equipo/actas', component: ActasInicioCoordinadorComponent },
      { path: 'reuniones-de-equipo/actas/plantillas', component: ActasPlantillaComponent },
      { path: 'reuniones-de-equipo/actas/historial', component: ActasHistorialComponent },
      { path: 'recursos', component: RecursoListadoCoordinadorComponent, data: { rutaBase: '/coordinador', rutaInicio: '/coordinador/recursos' } },
      { path: 'recursos/crear', component: RecursoFormularioPageComponent, data: { modoFormulario: 'crear' } },
      { path: 'recursos/:idCategoria/:numRecurso/editar', component: RecursoFormularioPageComponent, data: { modoFormulario: 'editar' } },
      { path: 'recursos/:idCategoria/:numRecurso', component: RecursoDetalleCompartidoComponent, data: { rutaBase: '/coordinador', rutaInicio: '/coordinador/recursos' } },
      { path: ':section', component: RecursoListadoCategoriaCoordinadorComponent },
      { path: ':section/:subsection', component: RecursoListadoCategoriaCoordinadorComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];


