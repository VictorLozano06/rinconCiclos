# Manual de programador

Este manual se genera con las herramientas reales del proyecto:

- `TypeDoc` para el frontend Angular.
- `phpDocumentor` para el backend PHP.

## Salidas generadas

- Frontend: [docs/frontend](/c:/laragon/www/rinconCiclos/docs/frontend/index.html)
- Backend: [docs/backend](/c:/laragon/www/rinconCiclos/docs/backend/index.html)

## Comandos

Generar toda la documentacion:

```powershell
npm run docs
```

Generar solo el frontend:

```powershell
npm run docs:web
```

Generar solo el backend:

```powershell
npm run docs:back
```

## Estructura de la documentacion

### Frontend

La documentacion del frontend cubre:

- componentes reutilizables
- paginas por rol
- servicios
- guards
- DTOs
- rutas principales

### Backend

La documentacion del backend cubre:

- configuracion
- controladores
- modelos
- rutas internas
- clases base

## Notas

- La generacion ya esta configurada en `typedoc.json` y `rincon_back/phpdoc.xml`.
- Si cambian rutas, servicios o controladores, vuelve a ejecutar `npm run docs`.
- La version detallada del programador esta en los HTML autogenerados; este archivo actua como indice rapido.
