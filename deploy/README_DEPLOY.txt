Sube el contenido de esta carpeta al document root del hosting.

Estructura esperada:
- /index.html y ficheros compilados de Angular en la raiz
- /api/index.php para el backend
- /acceso.php como puente de entrada desde la app externa

Puntos importantes:
- El frontend compilado ya apunta al backend bajo /api.
- El archivo /api/.env va incluido y debe tener credenciales validas en hosting.
- El archivo /api/.user.ini incluye los limites de subida usados por recursos.
- No se incluye /api/vendor. Si el hosting lo necesita, habra que instalar dependencias alli o subirlas aparte.
- Si el hosting usa Apache, deja tambien /.htaccess para que las rutas de Angular funcionen.

Entrada desde la app externa:
- POST a /acceso.php
- El puente reenvia a /rincon_back/acceso.php en desarrollo y a /api/acceso.php en despliegue.
- Puede enviar token JWT o user/usuario con el JSON completo del usuario.
