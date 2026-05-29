# Apuntes Rastrillo

## Buscador de recursos

- El buscador solo sirve para recursos.
- No busca convocatorias.
- No busca actas.
- No busca BOCC.
- El buscador no pinta resultados abajo.
- Solo saca sugerencias debajo del input.
- Al escribir, Angular llama a `BusquedaService`.
- `BusquedaService` pide todos los recursos una sola vez con `getTodos()`.
- Luego filtra en memoria por nombre, descripcion, categoria, curso y ciclos.
- Al elegir una sugerencia, el componente navega a la ruta del recurso.

## Flujo entero del buscador

- El input visual está en:
- `buscador.component.ts`
- `buscador.component.html`

- Cuando el usuario escribe:
- `BuscadorComponent` llama a `BusquedaService.buscarSugerencias(...)`

- `BusquedaService` hace esto:
- mira si ya tiene los recursos en memoria
- si ya los tiene, no vuelve a pedirlos
- si no los tiene, llama a:
- `RecursoService.getTodos()`

- `RecursoService.getTodos()` hace un `GET` a:
- `?c=Recursos&m=listarTodos`

- En backend entra:
- `conRecursos.php`
- metodo `listarTodos()`

- Ese controlador llama a:
- `modRecursos.php`
- metodo `listarTodos()`

- Y `modRecursos.php` reutiliza:
- `listarRecursos()`

- Esa consulta devuelve todos los recursos ya formateados para Angular.

- Cuando los recursos vuelven al frontend:
- `BusquedaService` construye un texto buscable con cada recurso
- ahi mezcla:
- titulo
- descripcion
- categoria
- curso
- ciclos

- Luego compara el texto escrito con ese bloque ya normalizado.
- Normalizar aqui significa:
- pasar a minusculas
- quitar tildes
- quitar diferencias tontas de formato

- Si hay coincidencia:
- crea una sugerencia con:
- titulo visible
- descripcion corta
- ruta del recurso

- `BuscadorComponent` pinta esas sugerencias debajo del input.

- Si haces click en una:
- usa el router de Angular
- y navega a la ruta del recurso

- Si pulsas `Enter`:
- va a la primera sugerencia disponible

- Importante:
- el buscador ahora solo busca recursos
- no convocatorias
- no actas
- no hace falta una vista especial de resultados
- solo sugiere y te manda al sitio

## El buscador usa modelo o no

- Directamente no.
- El buscador es frontend.
- El modelo PHP solo entra cuando hay que sacar datos de la base de datos.
- En este caso el frontend pide todos los recursos una vez y luego busca localmente.

- O sea:
- el buscador no tiene un `modBuscador.php`
- reutiliza el listado general de recursos
- y busca en memoria dentro de Angular

- Esto se hizo asi porque:
- era mas simple
- no hacia falta crear otra API
- y evitaba montar una pagina nueva de resultados

- Si algun dia hubiera miles de recursos:
- entonces si tendria sentido mover la busqueda al backend
- con un endpoint propio

## FilePond

- FilePond esta instalado en el frontend.
- Paquetes usados:
- `filepond`
- `ngx-filepond`
- `filepond-plugin-file-validate-type`
- `filepond-plugin-file-validate-size`
- El CSS global se carga en `angular.json`.
- El componente que lo usa es `app-recurso-formulario`.

## Que significa `subirArchivoTemporal`

- Significa que el archivo aun no es definitivo.
- Primero se sube a una carpeta provisional.
- Si luego guardas el recurso, ese archivo se mueve a la carpeta final.
- Si cancelas o lo borras antes, se puede eliminar sin dejar basura.

## Nombres claros de la subida

- En el controlador ahora se llama:
- `subirArchivoTemporal()`
- `eliminarArchivoTemporal()`
- Asi se entiende mejor que:
- uno guarda el archivo en `temp`
- y el otro lo borra de `temp`

- En el modelo, el paso que lo manda a la carpeta definitiva se llama:
- `moverArchivoSubidoACarpetaFinal()`
- Eso significa:
- el archivo ya existia en temporal
- y al guardar el recurso se mueve a `uploads/recursos/{idCategoria}/{numRecurso}`

- En el componente Angular del formulario:
- `registrarArchivoSubidoTemporalmente()`
- `limpiarArchivosTemporalesDeFilePond()`
- El primero mete el archivo provisional en el array del formulario.
- El segundo limpia la cola visual de FilePond cuando ya no hace falta verla.

## Donde se guarda el archivo

- Primero en:
- `rincon_back/uploads/recursos/temp`
- Luego, al guardar el recurso:
- `rincon_back/uploads/recursos/{idCategoria}/{numRecurso}`
- En la base de datos no se guarda el archivo.
- En la base de datos se guarda la ruta.

## Flujo entero de la subida de archivo

- El usuario arrastra o selecciona un archivo en FilePond.
- FilePond llama al endpoint `?c=Recursos&m=subirArchivoTemporal`.
- `conRecursos.php` valida tamaño y extensión.
- Si todo va bien, guarda el fichero en:
- `uploads/recursos/temp`
- y devuelve un identificador temporal como:
- `recursos/temp/nombre-archivo.ext`

- El componente Angular recibe ese identificador.
- Con `registrarArchivoSubidoTemporalmente()` lo mete en el formulario como adjunto provisional.
- Aun no existe el recurso en la BD.

- Cuando el usuario pulsa `Guardar`, Angular manda el recurso entero al endpoint `guardar`.
- `modRecursos.php` entra en `guardarArchivos()`.
- Si un archivo trae `identificadorTemporal`, llama a:
- `moverArchivoSubidoACarpetaFinal()`
- Ese metodo mueve el fichero desde `temp` a:
- `uploads/recursos/{idCategoria}/{numRecurso}`
- y devuelve la ruta publica final.

- Esa ruta final es la que se inserta en `recursoArchivo.archivo`.
- O sea:
- FilePond sube primero
- el recurso se guarda despues
- y la BD solo guarda la ruta final

## ControladorBase

- `ControladorBase` responde al navegador.
- Devuelve JSON.
- Devuelve errores.
- Pone codigo HTTP.
- El modelo no tiene que extenderlo.
- El modelo solo consulta la base de datos.
- El controlador recibe la peticion, llama al modelo y responde.

## Recursos

- `conRecursos.php` recibe la peticion HTTP.
- `modRecursos.php` hace las consultas y prepara los datos.
- `listarRecursos()` es la consulta comun.
- La usan listado reciente, listado total, listado por categoria y detalle.
- `formatearRecursos()` convierte filas SQL en arrays que entiende Angular.
- `guardar()` crea o edita un recurso.
- `eliminar()` borra la fila y luego los archivos fisicos.

## Preguntas tipicas

- "Esto por que funciona?"
- Porque el frontend pide datos y el controlador devuelve JSON.

- "Esto como navega?"
- Porque cada sugerencia tiene una ruta y el componente usa `router.navigateByUrl()`.

- "Esto por que no va al backend cada vez?"
- Porque se guarda una cache de recursos en memoria y se filtra localmente.

- "Entonces el buscador de donde saca los datos?"
- De `getTodos()`, que trae todos los recursos una vez.

- "Entonces el buscador usa la base de datos?"
- Indirectamente si.
- La usa al principio para traer los recursos.
- Pero luego las comparaciones de texto se hacen en Angular.

- "Por que no hiciste una API de buscar?"
- Porque para este volumen era mas simple reutilizar `listarTodos()`
- y sacar sugerencias sin montar otra pantalla ni otro endpoint.

- "Que busca exactamente?"
- titulo
- descripcion
- categoria
- curso
- ciclos

- "Por que se separan enlaces, archivos y ciclos?"
- Porque en la base de datos estan en tablas distintas.
- La consulta los vuelve a juntar para que Angular reciba un recurso completo.

- "Por que `subirArchivoTemporal`?"
- Porque FilePond necesita una subida intermedia antes de guardar el recurso completo.

- "Donde esta instalado FilePond?"
- En `rincon_web/package.json` y sus estilos en `rincon_web/angular.json`.

