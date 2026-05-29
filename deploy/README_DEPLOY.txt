Sube el contenido de esta carpeta al document root del hosting.

Estructura esperada:
- /index.html y ficheros compilados de Angular en la raiz
- /api/index.php para el backend
- /acceso.php como puente de entrada por POST desde la app externa

Puntos importantes:
- El backend ya apunta a /api/index.php desde el frontend.
- El archivo /api/.env va incluido y debe contener credenciales validas en hosting.
- Si el hosting usa Apache, deja tambien el archivo /.htaccess para que las rutas de Angular funcionen.

Entrada desde la app externa:
- POST a /acceso.php
- Puede enviar "user" o "usuario" con el JSON completo del usuario
- O campos separados: id, nombre, apellidos, email, foto, roles[]
- Opcional: redirect=/profesor/inicio
