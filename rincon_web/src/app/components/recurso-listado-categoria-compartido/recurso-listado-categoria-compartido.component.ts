import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RecursoDto } from '../../dto/recurso.dto';
import { RecursoItemComponent } from '../recurso-item/recurso-item.component';

interface OpcionCurso {
  idCurso: number | 'Todos';
  etiqueta: string;
}

interface OpcionCiclo {
  idCiclo: number | 'Todos';
  nombre: string;
}

@Component({
  selector: 'app-recurso-listado-categoria-compartido',
  standalone: true,
  imports: [CommonModule, RecursoItemComponent],
  templateUrl: './recurso-listado-categoria-compartido.component.html',
  styleUrl: './recurso-listado-categoria-compartido.component.css'
})
export class RecursoListadoCategoriaCompartidoComponent {
  @Input() titulo = '';
  @Input() subcategoria = '';
  @Input() cargando = false;
  @Input() errorCarga = false;
  @Input() cursosFiltro: OpcionCurso[] = [];
  @Input() ciclosFiltro: OpcionCiclo[] = [];
  @Input() filtroCurso: number | 'Todos' = 'Todos';
  @Input() filtroCiclo: number | 'Todos' = 'Todos';
  @Input() recursos: RecursoDto[] = [];
  @Input() rutaDetalleBase: 'profesor' | 'coordinador' = 'profesor';

  @Output() cursoChange = new EventEmitter<Event>();
  @Output() cicloChange = new EventEmitter<Event>();

  formatearCurso(recurso: RecursoDto): string {
    return `${recurso.anioInicio}/${recurso.anioFin}`;
  }

  formatearCiclos(recurso: RecursoDto): string {
    return (recurso.ciclos || [])
      .map((ciclo) => ciclo.nombre.split(' ')[0])
      .join(' / ');
  }

  construirRutaDetalle(recurso: RecursoDto): (string | number)[] {
    if (this.rutaDetalleBase === 'coordinador') {
      return ['/coordinador', 'recursos', recurso.idCategoria, recurso.numRecurso];
    }

    return ['/profesor', 'recurso', recurso.idCategoria, recurso.numRecurso];
  }
}
