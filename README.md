# Rincon de Ciclos - Guia Tecnica del Proyecto

Este repositorio contiene la aplicacion docente `Rincon de Ciclos`, separada en dos capas:

1. `rincon_back`: backend en PHP con controladores y modelos.
2. `rincon_web`: frontend en Angular 19.

## Estructura general

```text
rinconCiclos/
├── SQL.sql
├── README.md
├── docs/
│   └── manual-programador.md
├── rincon_back/
│   ├── .env
│   ├── index.php
│   ├── uploads/
│   │   └── recursos/
│   └── src/
│       ├── configuracion/
│       │   ├── conexionBD.php
│       │   ├── ControladorBase.php
│       │   └── rutas.php
│       ├── controladores/
│       │   ├── conActas.php
│       │   ├── conCategorias.php
│       │   ├── conCiclos.php
│       │   ├── conConvocatorias.php
│       │   ├── conPlantillas.php
│       │   └── conRecursos.php
│       └── modelos/
│           ├── modActas.php
│           ├── modCategorias.php
│           ├── modCiclos.php
│           ├── modConvocatorias.php
│           ├── modPlantillas.php
│           └── modRecursos.php
└── rincon_web/
    ├── angular.json
    └── src/
        ├── assets/
        └── app/
            ├── components/
            │   ├── buscador/
            │   ├── recurso-detalle-compartido/
            │   ├── recurso-formulario/
            │   ├── recurso-item/
            │   ├── recurso-listado-categoria-compartido/
            │   ├── sidebar-coordinador/
            │   └── sidebar-profesor/
            ├── dto/
            ├── pages/
            │   ├── coordinador/
            │   │   ├── actas-historial/
            │   │   ├── actas-inicio/
            │   │   ├── categorias/
            │   │   ├── ciclos-cursos/
            │   │   ├── convocatorias/
            │   │   ├── convocatorias-canceladas/
            │   │   ├── inicio/
            │   │   ├── layout/
            │   │   ├── lugares/
            │   │   ├── recurso-formulario/
            │   │   ├── recurso-listado/
            │   │   └── recurso-listado-categoria/
            │   └── profesor/
            │       ├── inicio/
            │       ├── layout/
            │       └── recurso-listado-categoria/
            └── services/
```

## Backend

El backend expone respuestas JSON desde `index.php` y reparte la logica por controlador y modelo.

- `ControladorBase.php`: respuestas JSON y errores HTTP comunes.
- `conexionBD.php`: conexion PDO.
- `rutas.php`: rutas internas del backend.

Modulos ya presentes:

- `Categorias`
- `Ciclos`
- `Convocatorias`
- `Actas`
- `Recursos`
- `Plantillas`

### Recursos

El modulo de recursos ha crecido respecto a la version inicial:

- subida de archivos con FilePond
- carpeta temporal en `rincon_back/uploads/recursos/temp`
- carpeta final por recurso dentro de `rincon_back/uploads/recursos/`
- gestion de enlaces y archivos por separado en base de datos

## Frontend

El frontend esta organizado por:

- `components/`: piezas reutilizables
- `dto/`: interfaces compartidas
- `pages/`: vistas por rol
- `services/`: acceso HTTP al backend

### Componentes reutilizables importantes

- `buscador`: buscador global de recursos con sugerencias
- `recurso-item`: tarjeta comun de recurso
- `recurso-detalle-compartido`: detalle comun de recurso
- `recurso-formulario`: formulario de creacion y edicion de recursos
- `recurso-listado-categoria-compartido`: listado compartido por categoria
- `sidebar-profesor` y `sidebar-coordinador`

### Paginas de coordinador añadidas o relevantes

- `categorias/`
- `lugares/`
- `recurso-formulario/`
- `recurso-listado/`
- `recurso-listado-categoria/`
- `convocatorias/`
- `convocatorias-canceladas/`
- `actas-inicio/`
- `actas-historial/`

## Flujo de datos basico

Ejemplo simple con categorias:

1. Angular llama a `CategoriaService`.
2. El servicio hace una peticion HTTP a `index.php?c=Categorias&m=listar`.
3. `conCategorias.php` recibe la peticion.
4. `modCategorias.php` consulta la base de datos y monta el arbol.
5. El controlador devuelve JSON.
6. Angular pinta el resultado en sidebar o en la pagina de categorias.

## Desarrollo rapido

### Crear una nueva pagina en Angular

1. Crear carpeta dentro de `src/app/pages/profesor/` o `src/app/pages/coordinador/`.
2. Crear `.ts`, `.html` y `.css`.
3. Registrar la ruta en `profesor.routes.ts` o `coordinador.routes.ts`.
4. Si la pagina necesita datos, crear o reutilizar un servicio en `services/`.

### DTOs

Las interfaces compartidas deben ir en `src/app/dto/`.

Ejemplo:

```ts
export interface ConvocatoriaDetalle {
  idConvocatoria: number;
  fecha: string;
}
```

### Bootstrap y estilos globales

Bootstrap 5 sigue integrado globalmente desde `angular.json`.

Se usa sobre todo para:

- grid
- utilidades de espaciado
- estructura base de layout

## Documentacion adicional

- [manual-programador.md](C:/Users/EQUIPO/Desktop/rinconCiclos/docs/manual-programador.md)
