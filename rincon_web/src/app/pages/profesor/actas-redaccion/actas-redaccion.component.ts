import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ProcesoActasService, ConvocatoriaPendiente } from '../../../services/proceso-actas.service';

interface PuntoInformacion {
  numInformacion: number;
  titulo_OrdenDia: string;
  informacion: string;
  expandido: boolean;
}

@Component({
  selector: 'app-actas-redaccion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './actas-redaccion.component.html',
  styleUrl: './actas-redaccion.component.css'
})
export class ActasRedaccionComponent implements OnInit {
  public estado: 'redactando' | 'bloqueada' | 'guardando' = 'redactando';
  public mostrarModalFinalizar = false;
  
  public acta = {
    idActa: null as number | null,
    fecha: null as Date | null,
    idConvocatoria: null as number | null
  };

  public convocatoria: ConvocatoriaPendiente | null = null;
  public puntosInformacion: PuntoInformacion[] = [];
  public ruegosPreguntas: { id: number, texto: string }[] = [];
  public nuevoRuego: string = '';

  constructor(
    private procesoActasService: ProcesoActasService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const conv = this.procesoActasService.getConvocatoriaActiva();
    
    if (!conv) {
      // Seguridad: Si recarga F5 se pierde la memoria, lo devolvemos al check de asistencia
      this.router.navigate(['/profesor/reuniones-de-equipo/actas/asistencia']);
      return;
    }

    this.convocatoria = conv;
    this.acta.idConvocatoria = conv.idConvocatoria;

    // Mapeamos los temas a tratar
    const actaEnEdicion = this.procesoActasService.getActaEnEdicion();
    
    if (actaEnEdicion) {
      this.acta.idActa = actaEnEdicion.idActa;
      this.puntosInformacion = actaEnEdicion.informacion.map((info: any, index: number) => ({
        numInformacion: info.numInformacion,
        titulo_OrdenDia: info.titulo_OrdenDia,
        informacion: info.informacion,
        expandido: index === 0
      }));
      
      this.ruegosPreguntas = (actaEnEdicion.ruegosPregunta || []).map((texto: string, index: number) => ({
        id: index + 1,
        texto: texto
      }));
    } else {
      this.puntosInformacion = conv.ordenDia.map((od, index) => ({
        numInformacion: od.numOrden,
        titulo_OrdenDia: od.objetivo,
        informacion: '',
        expandido: index === 0
      }));
    }
  }

  agregarRuego(): void {
    if (this.nuevoRuego.trim().length > 0) {
      this.ruegosPreguntas.push({
        id: this.ruegosPreguntas.length + 1,
        texto: this.nuevoRuego.trim()
      });
      this.nuevoRuego = '';
    }
  }

  eliminarRuego(index: number): void {
    this.ruegosPreguntas.splice(index, 1);
  }

  get cursoAcademico(): string {
    return this.convocatoria ? `${this.convocatoria.anioInicio}/${this.convocatoria.anioFin}` : '';
  }

  get fechaFormateada(): string {
    if (!this.convocatoria) return '';
    const date = new Date(this.convocatoria.fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  get asistentesRegistrados(): number {
    return this.convocatoria ? this.convocatoria.profesores.filter(p => p.asiste).length : 0;
  }

  togglePunto(punto: PuntoInformacion): void {
    if (this.estado === 'bloqueada') return;
    punto.expandido = !punto.expandido;
  }

  abrirModalFinalizar(): void {
    this.mostrarModalFinalizar = true;
  }

  finalizarActa(): void {
    this.estado = 'guardando';
    
    // Construimos la petición para el controlador
    const informacionPayload = this.puntosInformacion.map(p => ({
      numInformacion: p.numInformacion,
      titulo_OrdenDia: p.titulo_OrdenDia,
      informacion: p.informacion.trim()
    }));
    
    const ruegosPayload = this.ruegosPreguntas.map(r => r.texto);

    this.procesoActasService.guardarActaDefinitiva(informacionPayload, ruegosPayload)
      .subscribe({
        next: (res) => {
          this.acta.idActa = res.idActa;
          this.acta.fecha = new Date();
          this.estado = 'bloqueada';
          this.mostrarModalFinalizar = false;
          this.puntosInformacion.forEach((p, i) => p.expandido = i === 0);
        },
        error: (err) => {
          console.error('Error al guardar el acta', err);
          alert('Hubo un error al guardar el acta. Por favor, inténtelo de nuevo.');
          this.estado = 'redactando';
          this.mostrarModalFinalizar = false;
        }
      });
  }
}
