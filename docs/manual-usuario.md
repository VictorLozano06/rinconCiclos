# Manual de usuario

Este manual explica como usar `Rincon de Ciclos` desde el punto de vista de usuario final.

## 1. Acceso a la aplicacion

Al entrar en la web, la aplicacion identifica el perfil y te lleva al area correspondiente:

- `profesor`
- `coordinador`

Si no hay sesion valida o no hay rol reconocido, la aplicacion redirige a la pagina de inicio externa configurada por el proyecto.

## 2. Estructura general de la pantalla

La interfaz se organiza en tres zonas:

- barra lateral con accesos directos
- barra superior con busqueda
- zona central con el contenido de la pagina

La barra lateral cambia segun el rol. El coordinador ve mas opciones de gestion que el profesor.

## 3. Perfil de profesor

El perfil de profesor sirve para consultar informacion y participar en las reuniones de equipo.

### 3.1 Inicio

Ruta:

- `/profesor/inicio`

Uso:

- ver acceso rapido a contenidos del area docente
- consultar los recursos que le corresponden

### 3.2 Convocatorias

Ruta:

- `/profesor/reuniones-de-equipo/convocatorias`

Uso:

- consultar convocatorias de reuniones
- abrir el detalle de una convocatoria concreta

### 3.3 Actas

Rutas:

- `/profesor/reuniones-de-equipo/actas`
- `/profesor/reuniones-de-equipo/actas/asistencia`
- `/profesor/reuniones-de-equipo/actas/redaccion`
- `/profesor/reuniones-de-equipo/actas/historial`

Uso:

- registrar asistencia
- redactar actas
- revisar actas anteriores

### 3.4 Recursos

Rutas:

- `/profesor/:section`
- `/profesor/:section/:subsection`
- `/profesor/recurso/:idCategoria/:numRecurso`

Uso:

- navegar por categorias de recursos
- abrir el detalle de un recurso compartido

## 4. Perfil de coordinador

El perfil de coordinador incluye la gestion completa de reuniones, recursos y configuracion de categorias y grupos.

### 4.1 Inicio

Ruta:

- `/coordinador/inicio`

Uso:

- ver recursos recientes
- acceder a las secciones mas usadas

### 4.2 Convocatorias

Rutas:

- `/coordinador/reuniones-de-equipo/convocatorias`
- `/coordinador/reuniones-de-equipo/convocatorias/crear`
- `/coordinador/reuniones-de-equipo/convocatorias/:id`
- `/coordinador/reuniones-de-equipo/convocatorias/:id/editar`
- `/coordinador/reuniones-de-equipo/convocatorias/canceladas`
- `/coordinador/reuniones-de-equipo/convocatorias/historico`

Uso:

- crear convocatorias nuevas
- editar convocatorias existentes
- revisar convocatorias canceladas o historicas

### 4.3 Actas

Rutas:

- `/coordinador/reuniones-de-equipo/actas`
- `/coordinador/reuniones-de-equipo/actas/asistencia`
- `/coordinador/reuniones-de-equipo/actas/historial`

Uso:

- controlar asistencia
- consultar historico de actas

### 4.4 Gestion academica

Rutas:

- `/coordinador/gestion-de-ciclos`
- `/coordinador/gestion-de-cursos`
- `/coordinador/grupos-participantes`
- `/coordinador/categorias`
- `/coordinador/lugares`

Uso:

- consultar y mantener ciclos y cursos
- revisar grupos participantes
- mantener categorias
- mantener lugares relacionados con la gestion

### 4.5 Recursos

Rutas:

- `/coordinador/recursos`
- `/coordinador/recursos/crear`
- `/coordinador/recursos/:idCategoria/:numRecurso`
- `/coordinador/recursos/:idCategoria/:numRecurso/editar`

Uso:

- listar recursos
- crear recursos nuevos
- ver detalle de un recurso
- editar un recurso existente

## 5. Buscador

La aplicacion incluye una barra de busqueda en la cabecera.

Uso:

- escribir parte del nombre de un recurso
- buscar rapidamente sin navegar por todos los menus

## 6. Como moverse por la aplicacion

Recomendaciones de uso:

1. Entra con tu perfil.
2. Usa la barra lateral para ir a la seccion que necesitas.
3. Si trabajas con recursos, abre primero la categoria y luego el recurso.
4. Si trabajas con convocatorias o actas, usa el area de reuniones de equipo.
5. Para volver al inicio de tu rol, usa la opcion `Inicio`.

## 7. Que hacer si no puedes entrar

Si ves una redireccion o no te carga tu area:

- comprueba que has iniciado sesion con el usuario correcto
- revisa que tu usuario tenga el rol adecuado
- si la sesion esta rota, vuelve a entrar desde el acceso inicial

## 8. Diferencia entre perfiles

### Profesor

- consulta convocatorias
- participa en actas
- consulta recursos compartidos

### Coordinador

- hace todo lo anterior
- ademas gestiona recursos, categorias, lugares, grupos y ciclos

## 9. Atajos utiles

- La opcion `Inicio` te devuelve al panel principal de tu perfil.
- El detalle de un recurso se abre desde un listado o desde una categoria.
- Si no sabes donde estas, vuelve al inicio de tu rol y navega desde la barra lateral.
