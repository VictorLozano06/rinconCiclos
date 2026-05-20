# Rincon de Ciclos - Guia Tecnica del Monorepositorio

Este proyecto contiene la aplicacion docente Rincon de Ciclos, dividida en dos capas:

1. **rincon_back**: Servidor de datos desarrollado en PHP con arquitectura de controladores y modelos.
2. **rincon_web**: Interfaz de usuario interactiva desarrollada en Angular 19.

---

## Estructura General del Proyecto

Rincon de ciclos/
├── SQL.sql # Base de datos e inicializacion
├── rincon_back/ # Capa de Backend (PHP)
│ ├── .env # Parametros confidenciales de conexion
│ ├── index.php # Punto de acceso y enrutador unico
│ └── src/
│ ├── configuracion/
│ │ ├── conexionBD.php # Conexiones seguras via PDO
│ │ ├── ControladorBase.php # Respuestas JSON y traductor de errores
│ │ └── rutas.php # Constantes de directorios
│ ├── controladores/
│ │ └── conCategorias.php # Controlador de categorias
│ └── modelos/
│ └── modCategorias.php # Consultas y estructuracion en arbol
└── rincon_web/ # Capa de Frontend (Angular 19)
├── src/
│ ├── app/
│ │ ├── components/ # Componentes comunes (Sidebars, buscador)
│ │ ├── dto/ # Objetos de transferencia de datos
│ │ ├── pages/ # Vistas por roles (Profesor / Coordinador)
│ │ └── services/ # Consumo de la API en PHP
│ └── assets/ # Iconos y estilos globales
└── angular.json # Workspace de Angular

## Flujo de Datos y Ciclo de Vida (Secuencia)

Ejemplo con como traemos las categorias del backend a angular.

**Backend (PHP + MySQL)**
MySQL: Guarda las categorías y subcategorías.
Ejemplo: Tutorías es la categoría padre y PAT la hija.
Modelo (PHP): Obtiene los datos y organiza las categorías en forma de árbol.
Controlador (PHP): Convierte los datos a JSON y los envía al frontend.

**Frontend (Angular)**
Servicio: Hace la petición HTTP y recibe las categorías en JSON.
Sidebar:
Procesa las categorías.
Asigna iconos automáticamente.
Genera las rutas según el rol del usuario.
HTML: Muestra las categorías y despliega las subcategorías sin recargar la página.

## Guia de Desarrollo Rapido

### Como crear una nueva pagina en el Frontend

1. **Crear el componente**: Generar la carpeta y archivos bajo `src/app/pages/profesor/nombre-pagina/` o `src/app/pages/coordinador/nombre-pagina/`.
2. **Definir el codigo de la vista**: En el archivo HTML, estructurar el diseno utilizando el sistema de rejillas de Bootstrap 5.
3. **Configurar la ruta**: Registrar el componente importandolo en `profesor.routes.ts` o `coordinador.routes.ts`

### Integracion de Bootstrap 5

El framework Bootstrap 5 y su libreria de iconos estan integrados de manera global.

- **Configuracion global**: Declarados en `angular.json` en las secciones de estilos y scripts.
- **Uso**: Compatible de forma directa en las plantillas HTML de cualquier componente del sistema sin necesidad de declaraciones adicionales.

Para ser consistentes con los disenos utilizamos las clases para grid de bootstrap como: contenedores (`.container-fluid`), filas (`.row`) y columnas (`.col-12`, `.col-md-6`).
