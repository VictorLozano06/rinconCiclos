import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FilePondOptions } from 'filepond';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import { FilePondModule, registerPlugin } from 'ngx-filepond';
import { CategoriaDto } from '../../dto/categoria.dto';
import { CicloRecursoDto } from '../../dto/ciclo-recurso.dto';
import { ApiService } from '../../services/api.service';

registerPlugin(FilePondPluginFileValidateType, FilePondPluginFileValidateSize);

interface CursoFormulario {
  idCurso: number;
  etiqueta: string;
}

type CategoriaFormulario = Pick<CategoriaDto, 'idCategoria' | 'nombre'>;
type CicloFormulario = CicloRecursoDto;

export interface AdjuntoFormulario {
  nombre: string;
  valor: string;
  identificadorTemporal?: string;
  tamanoBytes?: number;
}

interface RecursoFormulario {
  idCategoria: number | null;
  nombre: string;
  descripcion: string;
  cursoId: number | null;
  ciclosSeleccionados: number[];
  enlaces: AdjuntoFormulario[];
  archivos: AdjuntoFormulario[];
}

@Component({
  selector: 'app-recurso-formulario',
  standalone: true,
  imports: [CommonModule, FormsModule, FilePondModule],
  templateUrl: './recurso-formulario.component.html',
  styleUrl: './recurso-formulario.component.css'
})
export class RecursoFormularioComponent {
  @Input({ required: true }) titulo = '';
  @Input({ required: true }) textoIntro = '';
  @Input({ required: true }) textoBotonGuardar = '';
  @Input({ required: true }) formulario!: RecursoFormulario;
  @Input() categoriasFormulario: CategoriaFormulario[] = [];
  @Input() cursosFiltro: CursoFormulario[] = [];
  @Input() ciclosFormulario: CicloFormulario[] = [];
  @Input() erroresFormulario: string[] = [];
  @Input() nuevoCicloId: number | null = null;
  @Input() nuevoNombreEnlace = '';
  @Input() nuevoEnlace = '';

  @Output() nuevoCicloIdChange = new EventEmitter<number | null>();
  @Output() nuevoNombreEnlaceChange = new EventEmitter<string>();
  @Output() nuevoEnlaceChange = new EventEmitter<string>();
  @Output() agregarCiclo = new EventEmitter<void>();
  @Output() eliminarCiclo = new EventEmitter<number>();
  @Output() agregarEnlace = new EventEmitter<void>();
  @Output() eliminarEnlace = new EventEmitter<number>();
  @Output() agregarArchivoSubido = new EventEmitter<AdjuntoFormulario>();
  @Output() eliminarArchivo = new EventEmitter<number>();
  @Output() cancelar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<void>();

  public archivosFilePond: FilePondOptions['files'] = [];
  public opcionesFilePond: FilePondOptions;

  constructor(private apiService: ApiService) {
    const urlSubidaTemporal = `${this.apiService.baseUrl}?c=Recursos&m=subirArchivoTemporal`;
    const urlBorradoTemporal = `${this.apiService.baseUrl}?c=Recursos&m=eliminarArchivoTemporal`;

    // FilePond gestiona la subida provisional:
    // el archivo se sube nada mas seleccionarlo y el backend devuelve
    // un identificador temporal que luego usaremos al guardar el recurso.
    this.opcionesFilePond = {
      allowMultiple: true,
      maxFiles: 10,
      maxFileSize: '10MB',
      acceptedFileTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ],
      labelIdle: 'Arrastra archivos o <span class="filepond--label-action">seleccionalos</span>',
      labelFileTypeNotAllowed: 'Formato no permitido',
      fileValidateTypeLabelExpectedTypes: 'Formatos permitidos: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX',
      labelMaxFileSizeExceeded: 'Archivo demasiado grande',
      labelMaxFileSize: 'Tamano maximo por archivo: 10 MB',
      credits: false,
      server: {
        process: {
          // "process" sube el archivo a la carpeta temporal del backend.
          url: urlSubidaTemporal,
          method: 'POST',
          onload: (respuesta) => {
            const dato = JSON.parse(respuesta);
            return dato.idTemporal || '';
          }
        },
        revert: {
          // "revert" borra el archivo temporal si el usuario lo quita.
          url: urlBorradoTemporal,
          method: 'DELETE'
        }
      }
    };
  }

  actualizarNuevoCiclo(valor: string): void {
    this.nuevoCicloIdChange.emit(valor ? Number(valor) : null);
  }

  actualizarNuevoNombreEnlace(valor: string): void {
    this.nuevoNombreEnlaceChange.emit(valor);
  }

  actualizarNuevoEnlace(valor: string): void {
    this.nuevoEnlaceChange.emit(valor);
  }

  obtenerNombreCiclo(idCiclo: number): string {
    return this.ciclosFormulario.find((ciclo) => ciclo.idCiclo === idCiclo)?.nombre || `Ciclo ${idCiclo}`;
  }

  // Cuando FilePond termina la subida temporal, añadimos el archivo al formulario.
  // Cuando termina la subida provisional, añadimos el archivo al formulario real.
  registrarArchivoSubidoTemporalmente(evento: any): void {
    const archivoNativo = evento?.file?.file as File | undefined;
    const identificadorTemporal = evento?.file?.serverId as string | undefined;

    if (!archivoNativo || !identificadorTemporal) {
      return;
    }

    this.agregarArchivoSubido.emit({
      nombre: this.quitarExtension(archivoNativo.name),
      valor: this.construirRutaPublica(identificadorTemporal),
      identificadorTemporal,
      tamanoBytes: archivoNativo.size
    });
  }

  // Limpiamos la lista visual de FilePond cuando termina el lote.
  // Limpiamos la cola visual de FilePond porque el archivo ya está
  // reflejado en la lista de adjuntos del formulario.
  limpiarArchivosTemporalesDeFilePond(): void {
    this.archivosFilePond = [];
  }

  // A partir del identificador temporal montamos la URL publica temporal
  // que se muestra en pantalla hasta que el recurso se guarde del todo.
  private construirRutaPublica(identificadorTemporal: string): string {
    return `/api/uploads/${identificadorTemporal}`;
  }

  private quitarExtension(nombreArchivo: string): string {
    return nombreArchivo.replace(/\.[^/.]+$/, '');
  }
}
