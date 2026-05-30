import { Injectable } from '@angular/core';

const CLAVE_ROLES = 'rinconCiclos.roles';
const CLAVE_USUARIO = 'rinconCiclos.usuario';
const CLAVE_ROLES_DEV = 'rinconCiclos.dev_roles';
const CLAVE_USUARIO_DEV = 'rinconCiclos.dev_usuario';
const ROL_PROFESOR = 'profesor';
const ROL_COORDINADOR = 'coordinador_rinconciclos';
const URL_PORTAL_INICIO = 'https://17.daw.esvirgua.com/dashboard-inicio';

export interface UsuarioAcceso {
  id: number | null;
  nombre: string;
  apellidos: string;
  email: string;
  foto: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AccesoAppService {
  private roles: string[] = [];
  private usuario: UsuarioAcceso | null = null;
  private inicializado = false;

  inicializarDesdeUbicacionActual(): void {
    if (this.inicializado) {
      return;
    }

    const usuarioDetectado = this.obtenerUsuarioDesdeFuentes();
    const rolesDetectados = this.normalizarRoles([
      ...this.leerRolesDesdeStorage(sessionStorage),
      ...this.leerRolesDesdeStorage(localStorage),
      ...this.leerRolesDesdeQueryString(window.location.search),
      ...(usuarioDetectado?.roles ?? [])
    ]);

    this.roles = rolesDetectados;
    this.usuario = usuarioDetectado
      ? {
          ...usuarioDetectado,
          roles: rolesDetectados
        }
      : null;

    this.persistirEstado();
    this.inicializado = true;
  }

  puedeAccederProfesor(): boolean {
    this.inicializarDesdeUbicacionActual();
    return this.roles.includes(ROL_PROFESOR);
  }

  puedeAccederCoordinador(): boolean {
    this.inicializarDesdeUbicacionActual();
    return this.roles.includes(ROL_COORDINADOR);
  }

  puedeEntrarEnLaApp(): boolean {
    this.inicializarDesdeUbicacionActual();
    return this.puedeAccederProfesor() || this.puedeAccederCoordinador();
  }

  salir(): void {
    this.limpiarEstado();
    window.location.replace(URL_PORTAL_INICIO);
  }

  obtenerRoles(): string[] {
    this.inicializarDesdeUbicacionActual();
    return [...this.roles];
  }

  obtenerUsuario(): UsuarioAcceso | null {
    this.inicializarDesdeUbicacionActual();
    return this.usuario ? { ...this.usuario, roles: [...this.usuario.roles] } : null;
  }

  private obtenerUsuarioDesdeFuentes(): UsuarioAcceso | null {
    return (
      this.leerUsuarioDesdeStorage(sessionStorage) ||
      this.leerUsuarioDesdeStorage(localStorage) ||
      this.leerUsuarioDesdeQueryString(window.location.search)
    );
  }

  private leerUsuarioDesdeStorage(storage: Storage): UsuarioAcceso | null {
    const claves = this.esEntornoLocal()
      ? [CLAVE_USUARIO, CLAVE_USUARIO_DEV, 'usuario', 'user', 'auth_user', 'user_data', 'session_user', 'dev_usuario', 'dev_user']
      : [CLAVE_USUARIO, 'usuario', 'user', 'auth_user', 'user_data', 'session_user'];

    for (const clave of claves) {
      const usuario = this.extraerUsuario(storage.getItem(clave));
      if (usuario) {
        return usuario;
      }
    }

    return null;
  }

  private leerUsuarioDesdeQueryString(queryString: string): UsuarioAcceso | null {
    const params = new URLSearchParams(queryString);
    const claves = this.esEntornoLocal()
      ? ['usuario', 'user', 'auth_user', 'user_data', 'session_user', 'dev_usuario', 'dev_user']
      : ['usuario', 'user', 'auth_user', 'user_data', 'session_user'];

    for (const clave of claves) {
      const valores = params.getAll(clave);
      for (const valor of valores) {
        const usuario = this.extraerUsuario(valor);
        if (usuario) {
          return usuario;
        }
      }
    }

    return null;
  }

  private leerRolesDesdeStorage(storage: Storage): string[] {
    const rolesCrudos = this.esEntornoLocal()
      ? [
          storage.getItem(CLAVE_ROLES),
          storage.getItem(CLAVE_ROLES_DEV),
          storage.getItem('roles'),
          storage.getItem('role'),
          storage.getItem('rol'),
          storage.getItem('dev_roles'),
          storage.getItem('dev_role'),
          storage.getItem('dev_rol')
        ]
      : [
          storage.getItem(CLAVE_ROLES),
          storage.getItem('roles'),
          storage.getItem('role'),
          storage.getItem('rol')
        ];

    return rolesCrudos.flatMap((valor) => this.extraerRoles(valor));
  }

  private leerRolesDesdeQueryString(queryString: string): string[] {
    const params = new URLSearchParams(queryString);
    const claves = this.esEntornoLocal()
      ? ['roles', 'role', 'rol', 'user_roles', 'user_role', 'dev_roles', 'dev_role', 'dev_rol']
      : ['roles', 'role', 'rol', 'user_roles', 'user_role'];
    const roles: string[] = [];

    claves.forEach((clave) => {
      params.getAll(clave).forEach((valor) => {
        roles.push(...this.extraerRoles(valor));
      });
    });

    return roles;
  }

  private extraerUsuario(valor: string | null): UsuarioAcceso | null {
    if (!valor) {
      return null;
    }

    const texto = valor.trim();
    if (texto === '' || !texto.startsWith('{') || !texto.endsWith('}')) {
      return null;
    }

    try {
      const parseado = JSON.parse(texto) as Record<string, unknown>;
      const roles = Array.isArray(parseado['roles']) ? parseado['roles'].map((rol) => String(rol)) : [];

      return {
        id: typeof parseado['id'] === 'number' ? parseado['id'] : parseado['id'] ? Number(parseado['id']) : null,
        nombre: String(parseado['nombre'] ?? ''),
        apellidos: String(parseado['apellidos'] ?? ''),
        email: String(parseado['email'] ?? ''),
        foto: String(parseado['foto'] ?? ''),
        roles: this.normalizarRoles(roles)
      };
    } catch {
      return null;
    }
  }

  private extraerRoles(valor: string | null): string[] {
    if (!valor) {
      return [];
    }

    const texto = valor.trim();
    if (texto === '') {
      return [];
    }

    if (texto.startsWith('[') && texto.endsWith(']')) {
      try {
        const parseado = JSON.parse(texto);
        if (Array.isArray(parseado)) {
          return parseado.map((item) => String(item));
        }
      } catch {
        // Si viene algo no parseable, cae al parser simple de abajo.
      }
    }

    return texto
      .split(/[,\s|;]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private normalizarRoles(roles: string[]): string[] {
    return Array.from(
      new Set(
        roles
          .map((rol) =>
            rol
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .trim()
              .toLowerCase()
          )
          .filter(Boolean)
      )
    );
  }

  private persistirEstado(): void {
    const serializadoRoles = JSON.stringify(this.roles);
    sessionStorage.setItem(CLAVE_ROLES, serializadoRoles);
    localStorage.setItem(CLAVE_ROLES, serializadoRoles);

    if (this.usuario) {
      const serializadoUsuario = JSON.stringify(this.usuario);
      sessionStorage.setItem(CLAVE_USUARIO, serializadoUsuario);
      localStorage.setItem(CLAVE_USUARIO, serializadoUsuario);
    }
  }

  private limpiarEstado(): void {
    sessionStorage.removeItem(CLAVE_ROLES);
    localStorage.removeItem(CLAVE_ROLES);
    sessionStorage.removeItem(CLAVE_USUARIO);
    localStorage.removeItem(CLAVE_USUARIO);
    this.roles = [];
    this.usuario = null;
    this.inicializado = false;
  }

  private esEntornoLocal(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const host = window.location.hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  }
}
