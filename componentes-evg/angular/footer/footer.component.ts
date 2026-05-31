import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

const ROL_MAP: Record<string, [string, string]> = {
  admin_global:      ['Administrador',  'badge-admin'],
  coordinador:       ['Coordinador/a',  'badge-admin'],
  profesor:          ['Profesor/a',     'badge-profesor'],
  admin_financiero:  ['Adm. Financiero','badge-staff'],
  monitor:           ['Monitor/a',      'badge-staff'],
  tutor_legal:       ['Tutor Legal',    'badge-alumno'],
};

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent implements OnInit, OnDestroy {
  user: any = null;
  rolLabel: string | null = null;
  rolClass: string = '';
  fechaHora: string = '';
  private reloj: any;

  ngOnInit(): void {
    this.actualizarReloj();
    this.reloj = setInterval(() => this.actualizarReloj(), 1000);
    const token = this.getCookie('auth_token');
    if (!token) return;

    const payload = this.decodeJwt(token);
    if (!payload?.data) return;

    const d = payload.data;
    this.user = {
      name: d.nombre || d.email,
    };

    const roles: Record<string, string> = d.roles ?? {};
    const rolKey = roles['global'] ?? Object.values(roles)[0] ?? null;
    if (rolKey && ROL_MAP[rolKey]) {
      [this.rolLabel, this.rolClass] = ROL_MAP[rolKey];
    } else if (rolKey) {
      this.rolLabel = rolKey;
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.reloj);
  }

  private actualizarReloj(): void {
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    const hora  = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.fechaHora = `${fecha} | ${hora}`;
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  private decodeJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }
}
