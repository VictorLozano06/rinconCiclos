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

// FilePond no trae activadas estas validaciones por defecto.
// Las registramos una sola vez para poder usarlas en este componente.
registerPlugin(FilePondPluginFileValidateType, FilePondPluginFileValidateSize);

/**
 * Estructura auxiliar usada para el selector de curso del formulario.
 */
interface CursoFormulario {
  idCurso: number;
  etiqueta: string;
}

type CategoriaFormulario = Pick<CategoriaDto, 'idCategoria' | 'nombre'>;
type CicloFormulario = CicloRecursoDto;

/**
 * DTO de cada enlace o archivo mostrado dentro del formulario.
 *
 * - `nombre`: título visible que decide el coordinador
 * - `valor`: URL o ruta pública del archivo
 * - `identificadorTemporal`: clave devuelta por FilePond/backend mientras el
 *   archivo aún vive en la carpeta `temp`
 * - `tamanoBytes`: tamaño usado para validaciones de límite total
 */
export interface AdjuntoFormulario {
  nombre: string;
  valor: string;
  identificadorTemporal?: string;
  tamanoBytes?: number;
}

/**
 * Estado mínimo del formulario de recurso compartido.
 */
interface RecursoFormulario {
  idCategoria: number | null;
  nombre: string;
  descripcion: string;
  cursoId: number | null;
  ciclosSeleccionados: number[];
  enlaces: AdjuntoFormulario[];
  archivos: AdjuntoFormulario[];
}

/**
 * Componente visual compartido del formulario de recursos.
 *
 * Su misión es renderizar la UI del formulario y coordinar interacciones
 * locales como:
 * - añadir ciclos
 * - añadir enlaces
 * - integrar la subida temporal con FilePond
 *
 * La persistencia final del recurso no ocurre aquí, sino en la página padre.
 */
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

  /**
   * Cola visual de FilePond.
   *
   * La usamos para poder vaciar la caja después de que el archivo ya se haya
   * reflejado en la lista real de adjuntos del formulario.
   */
  public archivosFilePond: FilePondOptions['files'] = [];

  /**
   * Configuración completa del componente FilePond.
   *
   * Aquí se definen:
   * - límites de cantidad y peso
   * - formatos aceptados
   * - textos visibles
   * - endpoints `process` y `revert`
   */
  public opcionesFilePond: FilePondOptions;

  constructor(private apiService: ApiService) {
    const urlSubidaTemporal = `${this.apiService.baseUrl}?c=Recursos&m=subirArchivoTemporal`;
    const urlBorradoTemporal = `${this.apiService.baseUrl}?c=Recursos&m=eliminarArchivoTemporal`;

    // FilePond trabaja en dos fases:
    // 1. nada mas seleccionar un archivo, lo sube a `temp`
    // 2. cuando se guarda el recurso final, backend mueve ese archivo a su
    //    carpeta definitiva y registra la ruta en la BD
    //
    // Por eso "process" no guarda el recurso entero, solo el archivo temporal.
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
          // `process` sube el archivo a la carpeta temporal del backend y
          // espera que el servidor devuelva un identificador corto.
          url: urlSubidaTemporal,
          method: 'POST',
          onload: (respuesta) => {
            const dato = JSON.parse(respuesta);
            return dato.idTemporal || '';
          }
        },
        revert: {
          // `revert` borra el archivo temporal si el usuario lo quita de la
          // caja antes de guardar el recurso definitivo.
          url: urlBorradoTemporal,
          method: 'DELETE'
        }
      }
    };
  }

  /**
   * Propaga al componente padre el cambio del ciclo seleccionado en el select.
   *
   * @param valor Valor actual del select.
   *
   * @returns void
   */
  actualizarNuevoCiclo(valor: string): void {
    this.nuevoCicloIdChange.emit(valor ? Number(valor) : null);
  }

  /**
   * Propaga el nombre visible que el usuario escribe para un enlace nuevo.
   *
   * @param valor Texto escrito en el input.
   *
   * @returns void
   */
  actualizarNuevoNombreEnlace(valor: string): void {
    this.nuevoNombreEnlaceChange.emit(valor);
  }

  /**
   * Propaga la URL escrita para un enlace nuevo.
   *
   * @param valor Texto actual del input URL.
   *
   * @returns void
   */
  actualizarNuevoEnlace(valor: string): void {
    this.nuevoEnlaceChange.emit(valor);
  }

  /**
   * Devuelve el nombre visible de un ciclo a partir de su id.
   *
   * @param idCiclo Identificador del ciclo seleccionado.
   *
   * @returns Nombre visible para pintar en la UI.
   */
  obtenerNombreCiclo(idCiclo: number): string {
    return this.ciclosFormulario.find((ciclo) => ciclo.idCiclo === idCiclo)?.nombre || `Ciclo ${idCiclo}`;
  }

  /**
   * Registra en el formulario real un archivo ya subido temporalmente.
   *
   * FilePond dispara este método cuando `process` ha terminado bien y ya existe
   * un archivo en la carpeta `uploads/recursos/temp`.
   *
   * Desde aquí se construye el adjunto que consumirá el formulario:
   * - nombre visible por defecto = nombre de archivo sin extensión
   * - valor = ruta pública temporal
   * - identificadorTemporal = clave que permitirá moverlo a destino final
   * - tamanoBytes = tamaño para validaciones posteriores
   *
   * @param evento Payload emitido por FilePond al terminar la subida temporal.
   *
   * @returns void
   */
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

  /**
   * Limpia la cola visual de FilePond después de un lote subido.
   *
   * Esto es importante porque el archivo ya no debe quedarse duplicado:
   * - una vez en la caja FilePond
   * - otra vez en la lista real de adjuntos del formulario
   *
   * @returns void
   */
  limpiarArchivosTemporalesDeFilePond(): void {
    this.archivosFilePond = [];
  }

  /**
   * Convierte el identificador temporal devuelto por backend en una ruta pública.
   *
   * Esa ruta es la que se muestra en pantalla hasta que el recurso se guarde
   * del todo y el archivo pase de `temp` a su carpeta final.
   *
   * @param identificadorTemporal Ruta corta tipo `recursos/temp/archivo.ext`.
   *
   * @returns Ruta pública temporal visible en frontend.
   */
  private construirRutaPublica(identificadorTemporal: string): string {
    return `/api/uploads/${identificadorTemporal}`;
  }

  /**
   * Quita la extensión de un nombre de archivo para usarlo como título inicial.
   *
   * @param nombreArchivo Nombre original del archivo.
   *
   * @returns Nombre sin extensión.
   */
  private quitarExtension(nombreArchivo: string): string {
    return nombreArchivo.replace(/\.[^/.]+$/, '');
  }
}
