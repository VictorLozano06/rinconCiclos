import { Component, OnInit, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {

  @Input() redirectTras: string = '/';

  user: any = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const token = this.getCookie('auth_token');
    if (token) {
      const payload = this.decodeJwt(token);
      if (payload?.data) {
        this.user = {
          name:    payload.data.nombre || payload.data.email,
          picture: payload.data.foto,
          email:   payload.data.email,
          rol:     payload.data.rol
        };
      }
    }
  }

  logout(): void {
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
    this.router.navigate([this.redirectTras]);
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  private decodeJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(
        window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      ));
    } catch {
      return null;
    }
  }
}
