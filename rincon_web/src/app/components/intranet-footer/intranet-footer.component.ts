import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AccesoAppService, UsuarioAcceso } from '../../services/acceso-app.service';

@Component({
  selector: 'app-intranet-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './intranet-footer.component.html',
  styleUrl: './intranet-footer.component.css'
})
export class IntranetFooterComponent implements OnInit, OnDestroy {
  public nombreVisible = 'Sin sesion';
  public fechaHora = '';
  private relojId: ReturnType<typeof setInterval> | null = null;

  constructor(private accesoAppService: AccesoAppService) {}

  ngOnInit(): void {
    this.accesoAppService.inicializarDesdeUbicacionActual();
    this.actualizarUsuario(this.accesoAppService.obtenerUsuario());
    this.actualizarReloj();
    this.relojId = setInterval(() => this.actualizarReloj(), 1000);
  }

  ngOnDestroy(): void {
    if (this.relojId !== null) {
      clearInterval(this.relojId);
    }
  }

  private actualizarUsuario(usuario: UsuarioAcceso | null): void {
    const nombreCompleto = [usuario?.nombre, usuario?.apellidos]
      .map((valor) => (valor ?? '').trim())
      .filter(Boolean)
      .join(' ');

    this.nombreVisible = nombreCompleto || usuario?.email?.trim() || 'Usuario';
  }

  private actualizarReloj(): void {
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const hora = ahora.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    this.fechaHora = `${fecha} | ${hora}`;
  }
}
