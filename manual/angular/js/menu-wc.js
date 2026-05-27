'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">Rincon de Ciclos - Frontend</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Escribe para buscar"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Comenzando</a>
                    <ul class="links">
                                <li class="link">
                                    <a href="overview.html" data-type="chapter-link">
                                        <span class="icon ion-ios-keypad"></span>Descripción general
                                    </a>
                                </li>

                            <li class="link">
                                <a href="index.html" data-type="chapter-link">
                                    <span class="icon ion-ios-paper"></span>
                                        Léeme
                                </a>
                            </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencias
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Propiedades
                                    </a>
                                </li>

                    </ul>
                </li>
                    <li class="chapter additional">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#additional-pages"'
                            : 'data-bs-target="#xs-additional-pages"' }>
                            <span class="icon ion-ios-book"></span>
                            <span>Additional documentation</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="additional-pages"' : 'id="xs-additional-pages"' }>
                                    <li class="link ">
                                        <a href="additional-documentation/backend-overview.html" data-type="entity-link" data-context-id="additional">Backend Overview</a>
                                    </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Componentes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/ActasAsistenciaComponent.html" data-type="entity-link" >ActasAsistenciaComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ActasHistorialComponent.html" data-type="entity-link" >ActasHistorialComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ActasInicioCoordinadorComponent.html" data-type="entity-link" >ActasInicioCoordinadorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ActasInicioProfesorComponent.html" data-type="entity-link" >ActasInicioProfesorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ActasPlantillaComponent.html" data-type="entity-link" >ActasPlantillaComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ActasRedaccionComponent.html" data-type="entity-link" >ActasRedaccionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AppComponent.html" data-type="entity-link" >AppComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/BuscadorComponent.html" data-type="entity-link" >BuscadorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CiclosCursosComponent.html" data-type="entity-link" >CiclosCursosComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CiclosCursosComponent-1.html" data-type="entity-link" >CiclosCursosComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ConvocatoriasCanceladasComponent.html" data-type="entity-link" >ConvocatoriasCanceladasComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ConvocatoriasComponent.html" data-type="entity-link" >ConvocatoriasComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CoordinadorLayoutComponent.html" data-type="entity-link" >CoordinadorLayoutComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/InicioComponent.html" data-type="entity-link" >InicioComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/InicioComponent-1.html" data-type="entity-link" >InicioComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LandingComponent.html" data-type="entity-link" >LandingComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ProfesorConvocatoriasComponent.html" data-type="entity-link" >ProfesorConvocatoriasComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ProfesorLayoutComponent.html" data-type="entity-link" >ProfesorLayoutComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RecursoDetalleCompartidoComponent.html" data-type="entity-link" >RecursoDetalleCompartidoComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RecursoFormularioMockComponent.html" data-type="entity-link" >RecursoFormularioMockComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RecursoFormularioPaginaComponent.html" data-type="entity-link" >RecursoFormularioPaginaComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RecursoItemComponent.html" data-type="entity-link" >RecursoItemComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RecursoListadoCategoriaCoordinadorComponent.html" data-type="entity-link" >RecursoListadoCategoriaCoordinadorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RecursoListadoCategoriaProfesorComponent.html" data-type="entity-link" >RecursoListadoCategoriaProfesorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RecursoListadoCoordinadorComponent.html" data-type="entity-link" >RecursoListadoCoordinadorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SidebarCoordinadorComponent.html" data-type="entity-link" >SidebarCoordinadorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SidebarProfesorComponent.html" data-type="entity-link" >SidebarProfesorComponent</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Inyectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/ApiService.html" data-type="entity-link" >ApiService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CategoriaService.html" data-type="entity-link" >CategoriaService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CiclosService.html" data-type="entity-link" >CiclosService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ConvocatoriaService.html" data-type="entity-link" >ConvocatoriaService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RecursoService.html" data-type="entity-link" >RecursoService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/ActaHistorial.html" data-type="entity-link" >ActaHistorial</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AdjuntoFormulario.html" data-type="entity-link" >AdjuntoFormulario</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AdjuntoFormulario-1.html" data-type="entity-link" >AdjuntoFormulario</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BloquePlantilla.html" data-type="entity-link" >BloquePlantilla</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CategoriaDto.html" data-type="entity-link" >CategoriaDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CategoriaRuta.html" data-type="entity-link" >CategoriaRuta</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CategoriaRuta-1.html" data-type="entity-link" >CategoriaRuta</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CicloDto.html" data-type="entity-link" >CicloDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CicloFiltro.html" data-type="entity-link" >CicloFiltro</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CicloFiltro-1.html" data-type="entity-link" >CicloFiltro</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CicloFiltro-2.html" data-type="entity-link" >CicloFiltro</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CicloRecursoDto.html" data-type="entity-link" >CicloRecursoDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CoincidenciaProfesorConvocatoria.html" data-type="entity-link" >CoincidenciaProfesorConvocatoria</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ConvocatoriaDetalleDto.html" data-type="entity-link" >ConvocatoriaDetalleDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ConvocatoriaFormularioResponseDto.html" data-type="entity-link" >ConvocatoriaFormularioResponseDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ConvocatoriaListaItemDto.html" data-type="entity-link" >ConvocatoriaListaItemDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CursoFiltro.html" data-type="entity-link" >CursoFiltro</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CursoFiltro-1.html" data-type="entity-link" >CursoFiltro</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CursoFiltro-2.html" data-type="entity-link" >CursoFiltro</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CursoFiltro-3.html" data-type="entity-link" >CursoFiltro</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CursoFormulario.html" data-type="entity-link" >CursoFormulario</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CursoOptionDto.html" data-type="entity-link" >CursoOptionDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GrupoOptionDto.html" data-type="entity-link" >GrupoOptionDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GuardarConvocatoriaPayloadDto.html" data-type="entity-link" >GuardarConvocatoriaPayloadDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Informacion.html" data-type="entity-link" >Informacion</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LugarOptionDto.html" data-type="entity-link" >LugarOptionDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OrdenDiaCoordinadorDto.html" data-type="entity-link" >OrdenDiaCoordinadorDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OrdenDiaPayloadDto.html" data-type="entity-link" >OrdenDiaPayloadDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OrdenDiaProfesorDto.html" data-type="entity-link" >OrdenDiaProfesorDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ParticipanteBusqueda.html" data-type="entity-link" >ParticipanteBusqueda</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ParticipanteDto.html" data-type="entity-link" >ParticipanteDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Plantilla.html" data-type="entity-link" >Plantilla</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Profesor.html" data-type="entity-link" >Profesor</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProfesorOptionDto.html" data-type="entity-link" >ProfesorOptionDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PuntoInformacion.html" data-type="entity-link" >PuntoInformacion</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PuntoOrdenDia.html" data-type="entity-link" >PuntoOrdenDia</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RecursoArchivoDto.html" data-type="entity-link" >RecursoArchivoDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RecursoDto.html" data-type="entity-link" >RecursoDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RecursoEnlaceDto.html" data-type="entity-link" >RecursoEnlaceDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RecursoFormularioMock.html" data-type="entity-link" >RecursoFormularioMock</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RecursoFormularioMock-1.html" data-type="entity-link" >RecursoFormularioMock</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RecursoGrupo.html" data-type="entity-link" >RecursoGrupo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RutaNavegacionItem.html" data-type="entity-link" >RutaNavegacionItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SidebarItem.html" data-type="entity-link" >SidebarItem</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscelánea</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Alias de tipo</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Rutas</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Cobertura de la documentación</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentación generada utilizando <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});