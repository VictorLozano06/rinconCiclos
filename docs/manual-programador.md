# Manual de programador

Este proyecto tiene documentacion tecnica autogenerada para frontend y backend.

## Herramientas

- Frontend: `TypeDoc`
- Backend: `phpDocumentor`

## Generar toda la documentacion

```powershell
npm run docs
```

## Generar solo la documentacion del frontend

```powershell
npm run docs:web
```

## Generar solo la documentacion del backend

```powershell
npm run docs:back
```

## Salidas generadas

- Frontend: `docs/frontend`
- Backend: `docs/backend`

## Requisitos

- Node.js con dependencias instaladas en la raiz del proyecto
- Composer instalado

## Notas

- `TypeDoc` documenta el codigo TypeScript de `rincon_web/src/app`
- `phpDocumentor` documenta el codigo PHP de `rincon_back/src`
- Para que el resultado sea util, conviene anadir comentarios `TSDoc` y `PHPDoc` en clases, metodos y propiedades importantes
