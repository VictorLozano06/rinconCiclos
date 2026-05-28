import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-sin-acceso',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="sin-acceso">
      <div class="sin-acceso-card">
        <p class="sin-acceso-kicker">Rincon de Ciclos</p>
        <h1>No tienes acceso a esta aplicacion</h1>
        <p>
          Esta entrada requiere el rol <strong>profesor</strong> o
          <strong>coordinador_rinconCiclos</strong> desde la aplicacion principal.
        </p>
      </div>
    </section>
  `,
  styles: [`
    .sin-acceso {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 2rem;
      background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
    }

    .sin-acceso-card {
      width: min(100%, 34rem);
      padding: 2rem;
      border-radius: 1.5rem;
      background: #ffffff;
      border: 0.0625rem solid #dbe7f5;
      box-shadow: 0 1.5rem 3rem rgba(36, 48, 67, 0.08);
      color: #243043;
    }

    .sin-acceso-kicker {
      margin: 0 0 0.5rem;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #2563eb;
    }

    h1 {
      margin: 0 0 0.75rem;
      font-size: clamp(1.6rem, 3vw, 2.2rem);
      line-height: 1.1;
    }

    p {
      margin: 0;
      color: #526279;
      line-height: 1.5;
    }
  `]
})
export class SinAccesoComponent {}
