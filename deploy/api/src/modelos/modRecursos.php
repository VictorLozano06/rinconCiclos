<?php
require_once __DIR__ . '/../configuracion/conexionBD.php';

// Modelo de recursos.
class ModRecursos extends ConexionBD {
    // El modelo solo necesita una conexion a BD.
    public function __construct($db = null) {
        if ($db instanceof PDO) {
            $this->conexion = $db;
        } else {
            $this->conexion = $this->obtenerConexion();
        }
    }

    // Devuelve los datos base del formulario de recursos.
    public function obtenerFormulario() {
        return [
            'cursos' => $this->obtenerCursos(),
            'ciclos' => $this->obtenerCiclos(),
            'cursoActualId' => $this->obtenerCursoActualId()
        ];
    }

    // =========================
    // LECTURA COMUN
    // =========================

    // Consulta comun de recursos. La reutilizan:
    // - listar recientes
    // - listar todos
    // - listar por categoria
    // - detalle
    //
    // Idea importante:
    // Angular espera "un recurso = un objeto".
    // Pero en BD los enlaces, archivos y ciclos estan en filas separadas.
    // Por eso esta consulta monta una fila principal del recurso y usa
    // subconsultas para traer enlaces, archivos y ciclos agrupados.
    private function listarRecursos($where = '', $parametros = [], $limite = null) {
        $sql = "SELECT
                    recurso.idCategoria,
                    recurso.numRecurso,
                    recurso.nombre,
                    recurso.descripcion,
                    recurso.fechaPublicacion,
                    recurso.idCurso,
                    categoria.nombre AS categoriaNombre,
                    cursoAcademico.anioInicio,
                    cursoAcademico.anioFin,
                    (
                        SELECT GROUP_CONCAT(DISTINCT CONCAT(recursoUrl.nombre, '::', recursoUrl.url) SEPARATOR '||')
                        FROM recursoUrl
                        WHERE recursoUrl.idCategoria = recurso.idCategoria
                          AND recursoUrl.numRecurso = recurso.numRecurso
                    ) AS enlacesDetalle,
                    (
                        SELECT GROUP_CONCAT(DISTINCT CONCAT(recursoArchivo.nombre, '::', recursoArchivo.archivo) SEPARATOR '||')
                        FROM recursoArchivo
                        WHERE recursoArchivo.idCategoria = recurso.idCategoria
                          AND recursoArchivo.numRecurso = recurso.numRecurso
                    ) AS archivosDetalle,
                    (
                        SELECT GROUP_CONCAT(DISTINCT CONCAT(cicloFormativo.idCiclo, '::', cicloFormativo.nombre) SEPARATOR '||')
                        FROM cicloRecurso
                        INNER JOIN cicloFormativo ON cicloFormativo.idCiclo = cicloRecurso.idCiclo
                        WHERE cicloRecurso.idCategoria = recurso.idCategoria
                          AND cicloRecurso.numRecurso = recurso.numRecurso
                    ) AS ciclos
                FROM recurso
                INNER JOIN categoria ON categoria.idCategoria = recurso.idCategoria
                INNER JOIN cursoAcademico ON cursoAcademico.idCurso = recurso.idCurso";

        $sql .= $where;
        $sql .= ' ORDER BY recurso.fechaPublicacion DESC, recurso.idCategoria ASC, recurso.numRecurso ASC';

        // El limite solo se usa cuando queremos pocos recursos,
        // por ejemplo en la portada de profesor.
        if ($limite !== null) {
            $sql .= ' LIMIT ' . $limite;
        }

        // Los parametros rellenan los :idCategoria, :numRecurso, etc.
        $stmt = $this->conexion->prepare($sql);
        foreach ($parametros as $nombre => $valor) {
            $stmt->bindValue($nombre, $valor, PDO::PARAM_INT);
        }

        $stmt->execute();

        // Aqui aun tenemos filas SQL.
        // El siguiente paso las convierte a arrays mas comodos para Angular.
        return $this->formatearRecursos($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // Convierte cada fila SQL al formato que usa Angular.
    // Aqui es donde se reconstruyen:
    // - enlacesDetalle
    // - archivosDetalle
    // - urls
    // - archivos
    // - ciclos
    private function formatearRecursos($filas) {
        $recursos = [];

        foreach ($filas as $fila) {
            // Las subconsultas devuelven texto agrupado.
            // Estas dos llamadas lo convierten en arrays reales.
            $enlacesDetalle = $this->separarAdjuntos($fila['enlacesDetalle'] ?? '');
            $archivosDetalle = $this->separarAdjuntos($fila['archivosDetalle'] ?? '', 'archivo');

            $recursos[] = [
                'idCategoria' => (int)$fila['idCategoria'],
                'numRecurso' => (int)$fila['numRecurso'],
                'nombre' => $fila['nombre'],
                'descripcion' => $fila['descripcion'] ?? '',
                'fechaPublicacion' => $fila['fechaPublicacion'],
                'idCurso' => (int)$fila['idCurso'],
                'anioInicio' => (int)$fila['anioInicio'],
                'anioFin' => (int)$fila['anioFin'],
                'categoriaNombre' => $fila['categoriaNombre'],
                'enlacesDetalle' => $enlacesDetalle,
                'archivosDetalle' => $archivosDetalle,
                // Compatibilidad simple: arrays planos por si una vista antigua solo necesita valores.
                'urls' => $this->extraerValores($enlacesDetalle, 'url'),
                'archivos' => $this->extraerValores($archivosDetalle, 'archivo'),
                'ciclos' => $this->separarCiclos($fila['ciclos'] ?? ''),
                // Se usa como acceso rapido para tarjetas o botones simples.
                'enlacePrincipal' => !empty($enlacesDetalle)
                    ? ($enlacesDetalle[0]['url'] ?? '')
                    : (!empty($archivosDetalle) ? ($archivosDetalle[0]['archivo'] ?? '') : '')
            ];
        }

        return $recursos;
    }

    // La BD guarda adjuntos como "nombre::valor||nombre::valor". Aqui se separan.
    private function separarAdjuntos($valor, $claveValor = 'url') {
        if ($valor === '' || $valor === null) {
            return [];
        }

        $resultado = [];

        foreach (explode('||', $valor) as $parte) {
            $dato = explode('::', $parte, 2);
            if (count($dato) !== 2) {
                continue;
            }

            $nombre = trim($dato[0]);
            $valorAdjunto = trim($dato[1]);

            if ($nombre === '' || $valorAdjunto === '') {
                continue;
            }

            // Los archivos deben salir con ruta publica consistente para Angular.
            if ($claveValor === 'archivo') {
                $valorAdjunto = $this->normalizarRutaPublicaArchivo($valorAdjunto);
            }

            $resultado[] = [
                'nombre' => $nombre,
                $claveValor => $valorAdjunto
            ];
        }

        return $resultado;
    }

    // Extrae solo las URLs o solo las rutas de archivo.
    // Esto existe porque algunas vistas no usan el array detallado con nombre.
    private function extraerValores($adjuntos, $claveValor = 'url') {
        $resultado = [];

        foreach ($adjuntos as $adjunto) {
            $resultado[] = $adjunto[$claveValor] ?? '';
        }

        return $resultado;
    }

    // Convierte "1::1DAW||2::2DAW" en:
    // [
    //   ['idCiclo' => 1, 'nombre' => '1DAW'],
    //   ['idCiclo' => 2, 'nombre' => '2DAW']
    // ]
    private function separarCiclos($valor) {
        if ($valor === '' || $valor === null) {
            return [];
        }

        $resultado = [];

        foreach (explode('||', $valor) as $parte) {
            $dato = explode('::', $parte, 2);
            if (count($dato) !== 2) {
                continue;
            }

            $resultado[] = [
                'idCiclo' => (int)$dato[0],
                'nombre' => $dato[1]
            ];
        }

        return $resultado;
    }

    // =========================
    // LISTADOS Y DETALLE
    // =========================

    public function listarRecientesProfesor($limite = 5) {
        // No pone filtros extra.
        // Solo usa el LIMIT para traer pocos.
        return $this->listarRecursos('', [], $limite);
    }

    public function listarTodos() {
        return $this->listarRecursos();
    }

    public function listarPorCategoria($idCategoria) {
        return $this->listarRecursos(' WHERE recurso.idCategoria = :idCategoria', [
            ':idCategoria' => $idCategoria
        ]);
    }

    public function obtenerDetalle($idCategoria, $numRecurso) {
        // Reutiliza la misma consulta general pero con WHERE por clave compuesta.
        $recursos = $this->listarRecursos(
            ' WHERE recurso.idCategoria = :idCategoria AND recurso.numRecurso = :numRecurso',
            [
                ':idCategoria' => $idCategoria,
                ':numRecurso' => $numRecurso
            ],
            1
        );

        return !empty($recursos) ? $recursos[0] : null;
    }

    // =========================
    // GUARDAR Y BORRAR
    // =========================

    // Guarda un recurso nuevo o actualiza uno existente.
    // Flujo resumido:
    // 1. validar y normalizar datos del formulario
    // 2. decidir si es crear o editar
    // 3. abrir transaccion
    // 4. guardar recurso, enlaces, archivos y ciclos
    // 5. cerrar transaccion
    // 6. borrar ficheros antiguos sobrantes si era edicion
    public function guardar($json) {
        $datos = $this->normalizarDatos($json);
        $esEdicion = $datos['numRecurso'] > 0;
        $rutasAntiguas = [];

        // Si es un recurso nuevo, calculamos el siguiente numero libre dentro de la categoria.
        $numRecursoFinal = $datos['numRecurso'] ?: $this->obtenerSiguienteNumero($datos['idCategoria']);

        // Esto sirve sobre todo en edicion para comparar rutas viejas y nuevas.
        $rutasNuevas = $this->obtenerRutasArchivosFormulario($datos['archivos'], $datos['idCategoria'], $numRecursoFinal);

        if ($esEdicion) {
            // En edicion cargamos el recurso anterior para:
            // - comprobar que existe
            // - saber que archivos habia antes
            $recursoAntiguo = $this->obtenerDetalle($datos['idCategoria'], $datos['numRecurso']);
            if (!$recursoAntiguo) {
                throw new RuntimeException('El recurso indicado no existe.');
            }

            $rutasAntiguas = $this->obtenerRutasArchivosDesdeDetalle($recursoAntiguo['archivosDetalle'] ?? []);
        } else {
            $datos['numRecurso'] = $numRecursoFinal;
        }

        // Si algo falla, deshacemos toda la operacion.
        $this->conexion->beginTransaction();

        try {
            if ($esEdicion) {
                // En edicion se actualiza la cabecera del recurso
                // y luego se rehacen enlaces, archivos y ciclos.
                $this->actualizarRecurso($datos);
                $this->borrarEnlaces($datos['idCategoria'], $datos['numRecurso']);
                $this->borrarArchivos($datos['idCategoria'], $datos['numRecurso']);
                $this->borrarCiclos($datos['idCategoria'], $datos['numRecurso']);
            } else {
                $this->insertarRecurso($datos);
            }

            $this->guardarEnlaces($datos['idCategoria'], $datos['numRecurso'], $datos['enlaces']);
            $this->guardarArchivos($datos['idCategoria'], $datos['numRecurso'], $datos['archivos']);
            $this->guardarCiclos($datos['idCategoria'], $datos['numRecurso'], $datos['ciclos']);

            $this->conexion->commit();

            // Esto ya va fuera de la transaccion porque es disco, no BD.
            // Borra solo los archivos fisicos que han dejado de usarse.
            $this->borrarArchivosFisicos(array_values(array_diff($rutasAntiguas, $rutasNuevas)));

            return [
                'idCategoria' => $datos['idCategoria'],
                'numRecurso' => $datos['numRecurso'],
                'message' => $esEdicion ? 'Recurso actualizado correctamente.' : 'Recurso guardado correctamente.'
            ];
        } catch (Exception $e) {
            if ($this->conexion->inTransaction()) {
                $this->conexion->rollBack();
            }

            throw $e;
        }
    }

    public function eliminar($idCategoria, $numRecurso) {
        // Primero cargamos el detalle para saber si existe
        // y para quedarnos con las rutas fisicas de archivo.
        $recurso = $this->obtenerDetalle($idCategoria, $numRecurso);
        if (!$recurso) {
            throw new RuntimeException('El recurso indicado no existe.');
        }

        $this->conexion->beginTransaction();

        try {
            // cicloRecurso no tiene ON DELETE CASCADE en el esquema,
            // asi que hay que borrar esas filas antes del recurso principal.
            $this->borrarCiclos($idCategoria, $numRecurso);
            $this->borrarEnlaces($idCategoria, $numRecurso);
            $this->borrarArchivos($idCategoria, $numRecurso);

            $sql = "DELETE FROM recurso WHERE idCategoria = :idCategoria AND numRecurso = :numRecurso";
            $stmt = $this->conexion->prepare($sql);
            $stmt->execute([
                ':idCategoria' => $idCategoria,
                ':numRecurso' => $numRecurso
            ]);

            $this->conexion->commit();
        } catch (Exception $e) {
            if ($this->conexion->inTransaction()) {
                $this->conexion->rollBack();
            }

            throw $e;
        }

        $this->borrarArchivosFisicos($recurso['archivosDetalle'] ?? []);
        return ['message' => 'Recurso eliminado correctamente.'];
    }

    // =========================
    // VALIDACION Y PREPARACION
    // =========================

    // Valida el JSON del formulario y lo deja listo para guardar.
    private function normalizarDatos($json) {
        if (!is_array($json)) {
            throw new InvalidArgumentException('El cuerpo JSON no es valido.');
        }

        // Leemos todos los campos posibles del formulario.
        // Algunos vienen con un nombre u otro segun si vienen del mock anterior
        // o del formato actual del frontend.
        $idCategoria = (int)($json['idCategoria'] ?? 0);
        $numRecurso = (int)($json['numRecurso'] ?? 0);
        $nombre = trim((string)($json['nombre'] ?? ''));
        $descripcion = trim((string)($json['descripcion'] ?? ''));
        $fechaPublicacion = trim((string)($json['fechaPublicacion'] ?? date('Y-m-d')));
        $idCurso = (int)($json['idCurso'] ?? 0);
        $ciclos = $this->normalizarIds($json['ciclosSeleccionados'] ?? $json['ciclos'] ?? []);
        $enlaces = $this->normalizarEnlaces($json['enlaces'] ?? []);
        $archivos = $this->normalizarArchivos($json['archivos'] ?? []);

        // Validaciones basicas del recurso.
        if ($idCategoria <= 0) {
            throw new InvalidArgumentException('Debes seleccionar una subcategoria valida.');
        }

        if ($nombre === '') {
            throw new InvalidArgumentException('El titulo es obligatorio.');
        }

        if (strlen($nombre) > 150) {
            throw new InvalidArgumentException('El titulo no puede superar los 150 caracteres.');
        }

        if ($descripcion === '') {
            throw new InvalidArgumentException('La descripcion es obligatoria.');
        }

        if ($idCurso <= 0) {
            throw new InvalidArgumentException('Debes seleccionar un curso valido.');
        }

        if (empty($enlaces) && empty($archivos)) {
            throw new InvalidArgumentException('Debes anadir al menos un archivo o un enlace.');
        }

        // Devolvemos una estructura interna limpia para las funciones de guardado.
        return [
            'idCategoria' => $idCategoria,
            'numRecurso' => $numRecurso,
            'nombre' => $nombre,
            'descripcion' => $descripcion,
            'fechaPublicacion' => $fechaPublicacion,
            'idCurso' => $idCurso,
            'ciclos' => $ciclos,
            'enlaces' => $enlaces,
            'archivos' => $archivos
        ];
    }

    // Convierte una lista de ids en enteros unicos y ordenados.
    private function normalizarIds($valores) {
        if (!is_array($valores)) {
            return [];
        }

        $resultado = [];

        foreach ($valores as $valor) {
            $id = (int)$valor;
            if ($id > 0 && !in_array($id, $resultado, true)) {
                $resultado[] = $id;
            }
        }

        sort($resultado);
        return $resultado;
    }

    // Valida cada enlace del formulario.
    // Al final todos quedan como:
    // ['nombre' => '...', 'url' => '...']
    private function normalizarEnlaces($enlaces) {
        if (!is_array($enlaces)) {
            return [];
        }

        $resultado = [];

        foreach ($enlaces as $enlace) {
            $nombre = trim((string)($enlace['nombre'] ?? ''));
            $url = trim((string)($enlace['valor'] ?? $enlace['url'] ?? ''));

            if ($nombre === '' && $url === '') {
                continue;
            }

            if ($nombre === '' || $url === '') {
                throw new InvalidArgumentException('Cada enlace debe tener nombre y URL.');
            }

            if (!filter_var($url, FILTER_VALIDATE_URL)) {
                throw new InvalidArgumentException('Hay una URL de enlace que no es valida.');
            }

            $resultado[] = [
                'nombre' => $nombre,
                'url' => $url
            ];
        }

        return $resultado;
    }

    // Valida cada archivo del formulario.
    // "valor" puede ser:
    // - una ruta ya guardada si estamos editando
    // - la ruta publica temporal que acaba de devolver FilePond
    //
    // "identificadorTemporal" es la clave corta que identifica el archivo
    // dentro de uploads/recursos/temp hasta que el recurso se guarda del todo.
    private function normalizarArchivos($archivos) {
        if (!is_array($archivos)) {
            return [];
        }

        $resultado = [];

        foreach ($archivos as $archivo) {
            $nombre = trim((string)($archivo['nombre'] ?? ''));
            $valor = trim((string)($archivo['valor'] ?? $archivo['archivo'] ?? ''));
            $identificadorTemporal = trim((string)($archivo['identificadorTemporal'] ?? ''));

            if ($nombre === '' && $valor === '' && $identificadorTemporal === '') {
                continue;
            }

            if ($nombre === '') {
                throw new InvalidArgumentException('Cada archivo debe tener nombre.');
            }

            if ($valor === '') {
                throw new InvalidArgumentException('Cada archivo debe tener una ruta o un archivo temporal.');
            }

            $resultado[] = [
                'nombre' => $nombre,
                'valor' => $valor,
                'identificadorTemporal' => $identificadorTemporal !== '' ? $identificadorTemporal : null
            ];
        }

        return $resultado;
    }

    // =========================
    // OPERACIONES DE BD
    // =========================

    private function insertarRecurso($datos) {
        // Inserta la fila principal del recurso.
        $sql = "INSERT INTO recurso (idCategoria, numRecurso, nombre, descripcion, fechaPublicacion, idCurso)
                VALUES (:idCategoria, :numRecurso, :nombre, :descripcion, :fechaPublicacion, :idCurso)";
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute([
            ':idCategoria' => $datos['idCategoria'],
            ':numRecurso' => $datos['numRecurso'],
            ':nombre' => $datos['nombre'],
            ':descripcion' => $datos['descripcion'],
            ':fechaPublicacion' => $datos['fechaPublicacion'],
            ':idCurso' => $datos['idCurso']
        ]);
    }

    private function actualizarRecurso($datos) {
        // Actualiza solo la cabecera del recurso.
        // Los enlaces, archivos y ciclos se rehacen aparte.
        $sql = "UPDATE recurso
                SET nombre = :nombre,
                    descripcion = :descripcion,
                    fechaPublicacion = :fechaPublicacion,
                    idCurso = :idCurso
                WHERE idCategoria = :idCategoria
                  AND numRecurso = :numRecurso";
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute([
            ':nombre' => $datos['nombre'],
            ':descripcion' => $datos['descripcion'],
            ':fechaPublicacion' => $datos['fechaPublicacion'],
            ':idCurso' => $datos['idCurso'],
            ':idCategoria' => $datos['idCategoria'],
            ':numRecurso' => $datos['numRecurso']
        ]);
    }

    private function guardarEnlaces($idCategoria, $numRecurso, $enlaces) {
        if (empty($enlaces)) {
            return;
        }

        // Inserta una fila por cada enlace.
        $sql = "INSERT INTO recursoUrl (idCategoria, numRecurso, nombre, url)
                VALUES (:idCategoria, :numRecurso, :nombre, :url)";
        $stmt = $this->conexion->prepare($sql);

        foreach ($enlaces as $enlace) {
            $stmt->execute([
                ':idCategoria' => $idCategoria,
                ':numRecurso' => $numRecurso,
                ':nombre' => $enlace['nombre'],
                ':url' => $enlace['url']
            ]);
        }
    }

    private function guardarArchivos($idCategoria, $numRecurso, $archivos) {
        if (empty($archivos)) {
            return;
        }

        // Inserta una fila por cada archivo.
        // Si el archivo aun esta en temporal, primero se mueve a su carpeta final.
        $sql = "INSERT INTO recursoArchivo (idCategoria, numRecurso, nombre, archivo)
                VALUES (:idCategoria, :numRecurso, :nombre, :archivo)";
        $stmt = $this->conexion->prepare($sql);

        foreach ($archivos as $archivo) {
            $rutaFinal = $archivo['valor'];

            if (!empty($archivo['identificadorTemporal'])) {
                $rutaFinal = $this->moverArchivoSubidoACarpetaFinal($archivo['identificadorTemporal'], $idCategoria, $numRecurso);
            }

            $stmt->execute([
                ':idCategoria' => $idCategoria,
                ':numRecurso' => $numRecurso,
                ':nombre' => $archivo['nombre'],
                ':archivo' => $rutaFinal
            ]);
        }
    }

    private function guardarCiclos($idCategoria, $numRecurso, $ciclos) {
        if (empty($ciclos)) {
            return;
        }

        // Inserta una fila en cicloRecurso por cada ciclo asociado.
        $sql = "INSERT INTO cicloRecurso (idCiclo, idCategoria, numRecurso)
                VALUES (:idCiclo, :idCategoria, :numRecurso)";
        $stmt = $this->conexion->prepare($sql);

        foreach ($ciclos as $idCiclo) {
            $stmt->execute([
                ':idCiclo' => $idCiclo,
                ':idCategoria' => $idCategoria,
                ':numRecurso' => $numRecurso
            ]);
        }
    }

    private function borrarEnlaces($idCategoria, $numRecurso) {
        // Se usa sobre todo en edicion para rehacer el bloque de enlaces.
        $sql = "DELETE FROM recursoUrl WHERE idCategoria = :idCategoria AND numRecurso = :numRecurso";
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute([
            ':idCategoria' => $idCategoria,
            ':numRecurso' => $numRecurso
        ]);
    }

    private function borrarArchivos($idCategoria, $numRecurso) {
        // Borra solo los registros de BD.
        // Los ficheros fisicos se borran luego con comparar rutas.
        $sql = "DELETE FROM recursoArchivo WHERE idCategoria = :idCategoria AND numRecurso = :numRecurso";
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute([
            ':idCategoria' => $idCategoria,
            ':numRecurso' => $numRecurso
        ]);
    }

    private function borrarCiclos($idCategoria, $numRecurso) {
        $sql = "DELETE FROM cicloRecurso WHERE idCategoria = :idCategoria AND numRecurso = :numRecurso";
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute([
            ':idCategoria' => $idCategoria,
            ':numRecurso' => $numRecurso
        ]);
    }

    private function obtenerSiguienteNumero($idCategoria) {
        // Busca el mayor numRecurso en esa categoria y suma 1.
        $sql = "SELECT COALESCE(MAX(numRecurso), 0) + 1 AS siguiente
                FROM recurso
                WHERE idCategoria = :idCategoria";
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute([':idCategoria' => $idCategoria]);
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);

        return (int)($fila['siguiente'] ?? 1);
    }

    private function obtenerCursos() {
        $sql = "SELECT idCurso, anioInicio, anioFin
                FROM cursoAcademico
                ORDER BY anioInicio DESC, anioFin DESC";
        $stmt = $this->conexion->query($sql);
        $resultado = [];

        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $fila) {
            $resultado[] = [
                'idCurso' => (int)$fila['idCurso'],
                'anioInicio' => (string)$fila['anioInicio'],
                'anioFin' => (string)$fila['anioFin']
            ];
        }

        return $resultado;
    }

    private function obtenerCiclos() {
        $sql = "SELECT idCiclo, nombre
                FROM cicloFormativo
                ORDER BY nombre ASC";
        $stmt = $this->conexion->query($sql);
        $resultado = [];

        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $fila) {
            $resultado[] = [
                'idCiclo' => (int)$fila['idCiclo'],
                'nombre' => $fila['nombre']
            ];
        }

        return $resultado;
    }

    private function obtenerCursoActualId() {
        $cursos = $this->obtenerCursos();
        $anioActual = (int)date('Y');
        $mesActual = (int)date('n');
        $anioInicioActual = $mesActual >= 9 ? $anioActual : $anioActual - 1;

        foreach ($cursos as $curso) {
            if ((int)$curso['anioInicio'] === $anioInicioActual) {
                return (int)$curso['idCurso'];
            }
        }

        if (!isset($cursos[0])) {
            return null;
        }

        return (int)$cursos[0]['idCurso'];
    }

    // =========================
    // ARCHIVOS Y RUTAS
    // =========================

    // Se usa solo en edicion para saber que archivos nuevos quedaran al final.
    private function obtenerRutasArchivosFormulario($archivos, $idCategoria, $numRecurso) {
        $rutas = [];

        foreach ($archivos as $archivo) {
            if (!empty($archivo['identificadorTemporal'])) {
                // Simula la ruta publica definitiva que tendra ese archivo cuando se mueva.
                $rutas[] = '/api/uploads/recursos/' . $idCategoria . '/' . $numRecurso . '/' . basename((string)$archivo['identificadorTemporal']);
            } else {
                $rutas[] = $archivo['valor'];
            }
        }

        return $rutas;
    }

    private function obtenerRutasArchivosDesdeDetalle($archivos) {
        // Saca solo las rutas de archivo del detalle ya formateado.
        $rutas = [];

        foreach ($archivos as $archivo) {
            if (!empty($archivo['archivo'])) {
                $rutas[] = $archivo['archivo'];
            }
        }

        return $rutas;
    }

    // Mueve un archivo que aun esta en uploads/recursos/temp
    // a la carpeta final del recurso que se esta guardando.
    private function moverArchivoSubidoACarpetaFinal($identificadorTemporal, $idCategoria, $numRecurso) {
        // Convertimos el identificador temporal recibido del frontend
        // en la ruta fisica real del archivo dentro de uploads/temp.
        $rutaTemporal = $this->rutaFisicaDesdePublica('/api/uploads/' . ltrim($identificadorTemporal, '/'));
        if (!is_file($rutaTemporal)) {
            throw new RuntimeException('No se ha encontrado el archivo temporal subido.');
        }

        // Esta sera la carpeta final:
        // uploads/recursos/{idCategoria}/{numRecurso}/archivo.ext
        $rutaRelativaFinal = 'recursos/' . $idCategoria . '/' . $numRecurso . '/' . basename((string)$identificadorTemporal);
        $rutaFisicaFinal = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $rutaRelativaFinal);
        $directorioFinal = dirname($rutaFisicaFinal);

        if (!is_dir($directorioFinal) && !mkdir($directorioFinal, 0775, true) && !is_dir($directorioFinal)) {
            throw new RuntimeException('No se ha podido crear la carpeta final del archivo.');
        }

        if (!rename($rutaTemporal, $rutaFisicaFinal)) {
            throw new RuntimeException('No se ha podido mover el archivo al destino final.');
        }

        // Esto es lo que se guarda en la BD.
        return '/api/uploads/' . $rutaRelativaFinal;
    }

    // Pasa una ruta publica a la ruta fisica real del disco.
    private function rutaFisicaDesdePublica($rutaPublica) {
        // Acepta rutas como:
        // /api/uploads/...
        // /uploads/...
        // uploads/...
        // y las convierte a una ruta de disco dentro de la carpeta uploads.
        $rutaPublica = trim((string)$rutaPublica);
        $rutaPublica = preg_replace('#^/api/uploads/#', '', $rutaPublica);
        $rutaPublica = preg_replace('#^/uploads/#', '', $rutaPublica);
        $rutaPublica = preg_replace('#^uploads/#', '', $rutaPublica);
        $rutaPublica = ltrim($rutaPublica, '/');

        return dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $rutaPublica);
    }

    // Asegura que los archivos salgan con la ruta publica que espera Angular.
    private function normalizarRutaPublicaArchivo($ruta) {
        $ruta = trim((string)$ruta);
        if ($ruta === '') {
            return '';
        }

        if (strpos($ruta, '/api/uploads/') === 0) {
            return $ruta;
        }

        if (strpos($ruta, '/uploads/') === 0) {
            return '/api' . $ruta;
        }

        if (strpos($ruta, 'uploads/') === 0) {
            return '/api/' . $ruta;
        }

        return $ruta;
    }

    private function borrarArchivosFisicos($adjuntos) {
        // Puede recibir arrays detallados o rutas simples.
        // Si el fichero existe en disco, lo borra.
        foreach ($adjuntos as $adjunto) {
            $rutaPublica = is_array($adjunto) ? ($adjunto['archivo'] ?? '') : (string)$adjunto;
            $rutaFisica = $this->rutaFisicaDesdePublica($rutaPublica);

            if (is_file($rutaFisica)) {
                @unlink($rutaFisica);
            }
        }
    }
}
?>
