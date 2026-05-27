# Backend Overview

Este backend implementa la API de Rincon de Ciclos en PHP sobre PDO.

## Responsabilidades principales

- Exponer endpoints JSON a traves de controladores.
- Encapsular el acceso a datos y la validacion en modelos.
- Centralizar la salida JSON y los errores HTTP en `ControladorBase`.

## Estructura

- `src/configuracion/`: bootstrap, rutas y conexion a base de datos.
- `src/controladores/`: capa HTTP y validacion de entrada.
- `src/modelos/`: consultas SQL, transformacion de DTOs y reglas de negocio.

## Modulo de convocatorias

El modulo de convocatorias permite:

- listar convocatorias por estado
- recuperar el detalle completo de una convocatoria
- crear o actualizar convocatorias con orden del dia y participantes
- marcar convocatorias activas como pasadas
- cancelar convocatorias moviendolas al historico
