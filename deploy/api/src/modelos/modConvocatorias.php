<?php
/**
 * Modelo de acceso a datos y reglas de negocio de convocatorias.
 */
class ModConvocatorias extends ConexionBD {
    /**
     * Conexion PDO principal usada para tablas locales.
     *
     * @var PDO
     */
    private $db;

    /**
     * Conexion PDO usada para el catalogo externo de personal.
     *
     * @var PDO
     */
    private $dbProfesores;

    /**
     * Cache del profesorado seleccionable en convocatorias.
     *
     * @var array<int,array<string,int|string>>|null
     */
    private $profesoresSeleccionables;

    /**
     * Cache de nombres externos resueltos por id.
     *
     * @var array<int,string>
     */
    private $nombresProfesores = [];

    /**
     * Consulta base reutilizable para listados.
     *
     * @var string
     */
    private const SQL_LISTADO_BASE = "SELECT
                    c.idConvocatoria,
                    c.fecha,
                    c.cancelada AS estado,
                    c.idProfesorRedactaActa,
                    c.idProfesorIniciaReunion,
                    l.nombre AS lugar,
                    ca.anioInicio,
                    ca.anioFin
                FROM convocatoria c
                INNER JOIN lugar l ON l.idLugar = c.idLugar
                INNER JOIN cursoAcademico ca ON ca.idCurso = c.idCurso";

    /**
     * Inicializa el modelo con las dos conexiones necesarias.
     *
     * @param PDO|null $db Conexion local compartida por la aplicacion.
     */
    public function __construct($db = null) {
        parent::__construct();
        $this->db = $db ?: $this->obtenerConexion();
        $this->dbProfesores = $this->obtenerConexion('nueva');
        $this->profesoresSeleccionables = null;
    }

    /**
     * Devuelve los datos base necesarios para construir el formulario.
     *
     * @return array<string,mixed>
     */
    public function obtenerFormulario() {
        return [
            'cursos' => $this->obtenerCursos(),
            'lugares' => $this->obtenerLugares(),
            'profesores' => $this->obtenerProfesores(),
            'grupos' => $this->obtenerGrupos(),
            'cursoActualId' => $this->obtenerCursoActualId()
        ];
    }

    /**
     * Crea o actualiza una convocatoria y su orden del dia en una transaccion.
     *
     * @param array<string,mixed> $payload
     *
     * @return array<string,mixed>
     */
    public function guardar($payload) {
        $cabecera = $this->normalizarCabecera($payload);
        $lineas = $this->normalizarOrdenDia($payload['ordenDia'] ?? []);

        $this->db->beginTransaction();

        try {
            $idConvocatoria = $this->guardarCabecera($cabecera);
            $this->reemplazarOrdenDia($idConvocatoria, $lineas);
            $this->db->commit();

            return [
                'idConvocatoria' => $idConvocatoria,
                'message' => $cabecera['idConvocatoria']
                    ? ($cabecera['estado'] === 'b'
                        ? 'Borrador actualizado correctamente.'
                        : 'Convocatoria actualizada correctamente.')
                    : ($cabecera['estado'] === 'b'
                        ? 'Borrador guardado correctamente.'
                        : 'Convocatoria guardada correctamente.')
            ];
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $e;
        }
    }

    /**
     * Lista las convocatorias activas.
     *
     * @return array<int,array<string,mixed>>
     */
    public function listarActivas() {
        return $this->listarPorEstados(['a']);
    }

    /**
     * Lista las convocatorias visibles para profesor: activas y pasadas.
     *
     * @return array<int,array<string,mixed>>
     */
    public function listarVisiblesProfesor() {
        return $this->listarPorEstados(['a', 'p']);
    }

    /**
     * Lista todas las convocatorias sin filtrar por estado.
     *
     * @return array<int,array<string,mixed>>
     */
    public function listarTodas() {
        return $this->listarPorEstados();
    }

    /**
     * Lista borradores y convocatorias pasadas para el historico.
     *
     * @return array<int,array<string,mixed>>
     */
    public function listarHistoricas() {
        return $this->listarPorEstados(['b', 'p'], true);
    }

    /**
     * Lista unicamente las convocatorias pasadas.
     *
     * @return array<int,array<string,mixed>>
     */
    public function listarPasadas() {
        return $this->listarPorEstados(['p'], true);
    }

    /**
     * Recupera el detalle completo de una convocatoria.
     *
     * @param int $idConvocatoria
     *
     * @return array<string,mixed>|null
     */
    public function obtenerDetalle($idConvocatoria) {
        $sql = "SELECT
                    c.idConvocatoria,
                    c.fecha,
                    c.cancelada AS estado,
                    c.idLugar,
                    c.idCurso,
                    c.idProfesorRedactaActa,
                    c.idProfesorIniciaReunion,
                    l.nombre AS lugar,
                    ca.anioInicio,
                    ca.anioFin
                FROM convocatoria c
                INNER JOIN lugar l ON l.idLugar = c.idLugar
                INNER JOIN cursoAcademico ca ON ca.idCurso = c.idCurso
                WHERE c.idConvocatoria = :idConvocatoria
                LIMIT 1";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':idConvocatoria', (int)$idConvocatoria, PDO::PARAM_INT);
        $stmt->execute();
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$fila) {
            return null;
        }

        $nombresProfesores = $this->obtenerNombresProfesoresPorIds([
            (int)$fila['idProfesorRedactaActa'],
            $fila['idProfesorIniciaReunion'] !== null ? (int)$fila['idProfesorIniciaReunion'] : null,
        ]);

        return [
            'idConvocatoria' => (int)$fila['idConvocatoria'],
            'fecha' => $this->formatearFechaApi($fila['fecha']),
            'estado' => $fila['estado'],
            'idLugar' => (int)$fila['idLugar'],
            'idCurso' => (int)$fila['idCurso'],
            'idProfesorRedactaActa' => (int)$fila['idProfesorRedactaActa'],
            'idProfesorIniciaReunion' => $fila['idProfesorIniciaReunion'] !== null ? (int)$fila['idProfesorIniciaReunion'] : null,
            'lugar' => $fila['lugar'],
            'anioInicio' => (string)$fila['anioInicio'],
            'anioFin' => (string)$fila['anioFin'],
            'redacta' => $this->resolverNombreProfesor((int)$fila['idProfesorRedactaActa'], $nombresProfesores),
            'inicia' => $fila['idProfesorIniciaReunion'] !== null
                ? $this->resolverNombreProfesor((int)$fila['idProfesorIniciaReunion'], $nombresProfesores)
                : null,
            'ordenDia' => $this->obtenerOrdenDia($idConvocatoria)
        ];
    }

    /**
     * Marca como pasada una convocatoria activa.
     *
     * @param int $idConvocatoria
     *
     * @return array<string,string>
     */
    public function marcarComoPasada($idConvocatoria) {
        return $this->actualizarEstadoConvocatoria(
            $idConvocatoria,
            ['a'],
            'p',
            'La convocatoria indicada no esta activa o no existe.',
            'Convocatoria marcada como pasada correctamente.'
        );
    }

    /**
     * Marca como pasadas todas las convocatorias activas.
     *
     * @return array<string,int|string>
     */
    public function marcarTodasComoPasadas() {
        $sql = "UPDATE convocatoria
                SET cancelada = 'p'
                WHERE cancelada = 'a'";

        $stmt = $this->db->prepare($sql);
        $stmt->execute();

        return [
            'message' => 'Las convocatorias activas se han marcado como pasadas correctamente.',
            'actualizadas' => (int)$stmt->rowCount()
        ];
    }

    /**
     * Cancela una convocatoria activa o borrador moviendola a pasada.
     *
     * @param int $idConvocatoria
     *
     * @return array<string,string>
     */
    public function cancelarConvocatoria($idConvocatoria) {
        return $this->actualizarEstadoConvocatoria(
            $idConvocatoria,
            ['a', 'b'],
            'p',
            'La convocatoria indicada no se puede cancelar o no existe.',
            'Convocatoria marcada como pasada correctamente.'
        );
    }

    /**
     * Extrae y valida la cabecera principal del payload de convocatoria.
     *
     * @param array<string,mixed> $payload
     *
     * @return array<string,mixed>
     */
    private function normalizarCabecera($payload) {
        if (!is_array($payload)) {
            throw new InvalidArgumentException('El cuerpo JSON no es valido.');
        }

        $estado = isset($payload['estado']) ? trim((string)$payload['estado']) : 'a';
        if ($estado !== 'a' && $estado !== 'b') {
            throw new InvalidArgumentException('El estado de la convocatoria no es valido.');
        }

        $datos = [
            'idConvocatoria' => isset($payload['idConvocatoria']) ? (int)$payload['idConvocatoria'] : null,
            'idCurso' => (int)($payload['cursoId'] ?? 0),
            'idLugar' => (int)($payload['lugarId'] ?? 0),
            'idProfesorRedactaActa' => (int)($payload['redactaId'] ?? 0),
            'idProfesorIniciaReunion' => isset($payload['iniciaId']) && $payload['iniciaId'] !== ''
                ? (int)$payload['iniciaId']
                : null,
            'fecha' => trim((string)($payload['fechaHora'] ?? '')),
            'estado' => $estado
        ];

        if (
            $datos['idCurso'] <= 0 ||
            $datos['idLugar'] <= 0 ||
            $datos['idProfesorRedactaActa'] <= 0 ||
            $datos['fecha'] === ''
        ) {
            throw new InvalidArgumentException('Faltan datos obligatorios de la convocatoria.');
        }

        $datos['fecha'] = $this->normalizarFechaHora($datos['fecha']);
        if ($this->esFechaHoraPasada($datos['fecha'])) {
            throw new InvalidArgumentException('No se puede crear o publicar una convocatoria con una fecha pasada.');
        }

        $this->validarCabeceraRelacionada($datos);
        return $datos;
    }

    /**
     * Normaliza el orden del dia recibido desde el frontend.
     *
     * @param mixed $ordenDia
     *
     * @return array<int,array<string,mixed>>
     */
    private function normalizarOrdenDia($ordenDia) {
        if (!is_array($ordenDia)) {
            throw new InvalidArgumentException('El orden del dia no tiene un formato valido.');
        }

        $lineas = [];

        foreach ($ordenDia as $item) {
            $descripcion = trim((string)($item['ordenDia'] ?? ''));
            $objetivo = trim((string)($item['objetivo'] ?? ''));
            $idProfesorDinamiza = (int)($item['dinamizaId'] ?? 0);
            $idLugar = (int)($item['lugarId'] ?? 0);
            $minutosRaw = $item['minutos'] ?? null;
            $minutos = ($minutosRaw === '' || $minutosRaw === null) ? null : (int)$minutosRaw;
            $participantes = $this->normalizarParticipantes($item['participantes'] ?? []);

            $estaVacia = $descripcion === '' &&
                $objetivo === '' &&
                $idProfesorDinamiza === 0 &&
                $idLugar === 0 &&
                $minutos === null &&
                empty($participantes);

            if ($estaVacia) {
                continue;
            }

            if ($objetivo === '' || $idProfesorDinamiza <= 0 || $idLugar <= 0) {
                throw new InvalidArgumentException('Cada punto del orden del dia debe tener objetivo, dinamiza y lugar.');
            }

            if (!$this->existeProfesorConvocatoria($idProfesorDinamiza)) {
                throw new InvalidArgumentException('El profesor que dinamiza no es valido.');
            }

            if (!$this->existeEnTabla('lugar', 'idLugar', $idLugar)) {
                throw new InvalidArgumentException('El lugar del orden del dia no es valido.');
            }

            $lineas[] = [
                'numOrden' => count($lineas) + 1,
                'minutos' => $minutos,
                'descripcion' => $descripcion !== '' ? $descripcion : null,
                'objetivo' => $objetivo,
                'idLugar' => $idLugar,
                'idProfesorDinamiza' => $idProfesorDinamiza,
                'participantes' => $participantes
            ];
        }

        if (empty($lineas)) {
            throw new InvalidArgumentException('Anade al menos un punto valido al orden del dia.');
        }

        return $lineas;
    }

    /**
     * Normaliza y deduplica los participantes de un punto del orden del dia.
     *
     * @param mixed $participantes
     *
     * @return array<int,array<string,int|string>>
     */
    private function normalizarParticipantes($participantes) {
        if (!is_array($participantes)) {
            throw new InvalidArgumentException('Los participantes del orden del dia no tienen un formato valido.');
        }

        $resultado = [];
        $vistos = [];

        foreach ($participantes as $participante) {
            $idParticipante = (int)($participante['idParticipante'] ?? 0);
            $tipo = trim((string)($participante['tipo'] ?? ''));

            if ($idParticipante <= 0 || ($tipo !== 'profesor' && $tipo !== 'grupo')) {
                continue;
            }

            $clave = $tipo . ':' . $idParticipante;
            if (isset($vistos[$clave])) {
                continue;
            }

            $this->validarParticipante($idParticipante, $tipo);

            $resultado[] = [
                'idParticipante' => $idParticipante,
                'tipo' => $tipo
            ];
            $vistos[$clave] = true;
        }

        return $resultado;
    }

    /**
     * Inserta una cabecera nueva o actualiza una convocatoria existente.
     *
     * @param array<string,mixed> $datos
     *
     * @return int
     */
    private function guardarCabecera($datos) {
        if (!empty($datos['idConvocatoria'])) {
            $this->asegurarConvocatoriaEditable($datos['idConvocatoria']);

            $sql = "UPDATE convocatoria SET
                        fecha = :fecha,
                        idLugar = :idLugar,
                        idCurso = :idCurso,
                        cancelada = :estado,
                        idProfesorRedactaActa = :idProfesorRedactaActa,
                        idProfesorIniciaReunion = :idProfesorIniciaReunion
                    WHERE idConvocatoria = :idConvocatoria";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':fecha' => $datos['fecha'],
                ':idLugar' => $datos['idLugar'],
                ':idCurso' => $datos['idCurso'],
                ':estado' => $datos['estado'],
                ':idProfesorRedactaActa' => $datos['idProfesorRedactaActa'],
                ':idProfesorIniciaReunion' => $datos['idProfesorIniciaReunion'],
                ':idConvocatoria' => $datos['idConvocatoria']
            ]);

            return (int)$datos['idConvocatoria'];
        }

        $sql = "INSERT INTO convocatoria (
                    fecha,
                    idLugar,
                    idCurso,
                    cancelada,
                    idProfesorRedactaActa,
                    idProfesorIniciaReunion
                ) VALUES (
                    :fecha,
                    :idLugar,
                    :idCurso,
                    :estado,
                    :idProfesorRedactaActa,
                    :idProfesorIniciaReunion
                )";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':fecha' => $datos['fecha'],
            ':idLugar' => $datos['idLugar'],
            ':idCurso' => $datos['idCurso'],
            ':estado' => $datos['estado'],
            ':idProfesorRedactaActa' => $datos['idProfesorRedactaActa'],
            ':idProfesorIniciaReunion' => $datos['idProfesorIniciaReunion']
        ]);

        return (int)$this->db->lastInsertId();
    }

    /**
     * Sustituye el detalle completo de una convocatoria.
     *
     * @param int $idConvocatoria
     * @param array<int,array<string,mixed>> $lineas
     *
     * @return void
     */
    private function reemplazarOrdenDia($idConvocatoria, $lineas) {
        $this->borrarOrdenDia($idConvocatoria);

        $stmtOrden = $this->db->prepare(
            "INSERT INTO ordenDia (
                idConvocatoria,
                numOrden,
                minutos,
                descripcion,
                objetivo,
                idLugar,
                idProfesorDinamiza
            ) VALUES (
                :idConvocatoria,
                :numOrden,
                :minutos,
                :descripcion,
                :objetivo,
                :idLugar,
                :idProfesorDinamiza
            )"
        );

        $stmtParticipa = $this->db->prepare(
            "INSERT INTO participanteParticipa (
                idConvocatoria,
                numOrden,
                idParticipanteParticipa,
                tipoParticipante
            ) VALUES (
                :idConvocatoria,
                :numOrden,
                :idParticipanteParticipa,
                :tipoParticipante
            )"
        );

        foreach ($lineas as $linea) {
            $stmtOrden->execute([
                ':idConvocatoria' => $idConvocatoria,
                ':numOrden' => $linea['numOrden'],
                ':minutos' => $linea['minutos'],
                ':descripcion' => $linea['descripcion'],
                ':objetivo' => $linea['objetivo'],
                ':idLugar' => $linea['idLugar'],
                ':idProfesorDinamiza' => $linea['idProfesorDinamiza']
            ]);

            foreach ($linea['participantes'] as $participante) {
                $stmtParticipa->execute([
                    ':idConvocatoria' => $idConvocatoria,
                    ':numOrden' => $linea['numOrden'],
                    ':idParticipanteParticipa' => $participante['idParticipante'],
                    ':tipoParticipante' => $participante['tipo']
                ]);
            }
        }
    }

    /**
     * Elimina primero el detalle dependiente de una convocatoria.
     *
     * @param int $idConvocatoria
     *
     * @return void
     */
    private function borrarOrdenDia($idConvocatoria) {
        $stmt = $this->db->prepare("DELETE FROM participanteParticipa WHERE idConvocatoria = :idConvocatoria");
        $stmt->bindValue(':idConvocatoria', (int)$idConvocatoria, PDO::PARAM_INT);
        $stmt->execute();

        $stmt = $this->db->prepare("DELETE FROM ordenDia WHERE idConvocatoria = :idConvocatoria");
        $stmt->bindValue(':idConvocatoria', (int)$idConvocatoria, PDO::PARAM_INT);
        $stmt->execute();
    }

    /**
     * Recupera el orden del dia y lo reconstruye en el DTO esperado por Angular.
     *
     * @param int $idConvocatoria
     *
     * @return array<int,array<string,mixed>>
     */
    private function obtenerOrdenDia($idConvocatoria) {
        $sql = "SELECT
                    od.numOrden,
                    od.minutos,
                    od.descripcion,
                    od.objetivo,
                    od.idLugar,
                    od.idProfesorDinamiza,
                    l.nombre AS lugar
                FROM ordenDia od
                INNER JOIN lugar l ON l.idLugar = od.idLugar
                WHERE od.idConvocatoria = :idConvocatoria
                ORDER BY od.numOrden ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':idConvocatoria', (int)$idConvocatoria, PDO::PARAM_INT);
        $stmt->execute();
        $filas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $participantesPorOrden = $this->obtenerParticipantesPorOrden($idConvocatoria);
        $idsProfesores = [];
        foreach ($filas as $fila) {
            $idsProfesores[] = (int)$fila['idProfesorDinamiza'];
        }
        $nombresProfesores = $this->obtenerNombresProfesoresPorIds($idsProfesores);

        $resultado = [];
        foreach ($filas as $fila) {
            $numOrden = (int)$fila['numOrden'];
            $idProfesorDinamiza = (int)$fila['idProfesorDinamiza'];

            $resultado[] = [
                'numOrden' => $numOrden,
                'minutos' => $fila['minutos'] !== null ? (int)$fila['minutos'] : null,
                'descripcion' => $fila['descripcion'] ?? '',
                'objetivo' => $fila['objetivo'],
                'idLugar' => (int)$fila['idLugar'],
                'idProfesorDinamiza' => $idProfesorDinamiza,
                'lugar' => $fila['lugar'],
                'dinamiza' => $this->resolverNombreProfesor($idProfesorDinamiza, $nombresProfesores),
                'participantes' => $participantesPorOrden[$numOrden] ?? []
            ];
        }

        return $resultado;
    }

    /**
     * Reconstruye el listado de participantes agrupado por numero de orden.
     *
     * @param int $idConvocatoria
     *
     * @return array<int,array<int,array<string,int|string>>>
     */
    private function obtenerParticipantesPorOrden($idConvocatoria) {
        $sql = "SELECT
                    pp.numOrden,
                    pp.idParticipanteParticipa AS idParticipante,
                    pp.tipoParticipante AS tipo,
                    pa.nombre AS nombreGrupo
                FROM participanteParticipa pp
                LEFT JOIN grupo g
                    ON g.idGrupo = pp.idParticipanteParticipa
                   AND pp.tipoParticipante = 'grupo'
                LEFT JOIN participantes pa
                    ON pa.idParticipante = g.idGrupo
                WHERE pp.idConvocatoria = :idConvocatoria
                ORDER BY pp.numOrden ASC, pp.idParticipanteParticipa ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':idConvocatoria', (int)$idConvocatoria, PDO::PARAM_INT);
        $stmt->execute();
        $filas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $idsProfesores = [];
        foreach ($filas as $fila) {
            if ($fila['tipo'] === 'profesor') {
                $idsProfesores[] = (int)$fila['idParticipante'];
            }
        }
        $nombresProfesores = $this->obtenerNombresProfesoresPorIds($idsProfesores);

        $resultado = [];
        foreach ($filas as $fila) {
            $numOrden = (int)$fila['numOrden'];
            $tipo = $fila['tipo'] === 'grupo' ? 'grupo' : 'profesor';
            $idParticipante = (int)$fila['idParticipante'];

            $resultado[$numOrden][] = [
                'idParticipante' => $idParticipante,
                'tipo' => $tipo,
                'nombre' => $tipo === 'grupo'
                    ? ($fila['nombreGrupo'] !== null ? $fila['nombreGrupo'] : ('Grupo #' . $idParticipante))
                    : $this->resolverNombreProfesor($idParticipante, $nombresProfesores)
            ];
        }

        foreach ($resultado as &$participantes) {
            usort($participantes, function ($a, $b) {
                return strcasecmp((string)$a['nombre'], (string)$b['nombre']);
            });
        }
        unset($participantes);

        return $resultado;
    }

    /**
     * Convierte un conjunto de filas SQL al DTO de listado del frontend.
     *
     * @param array<int,array<string,mixed>> $filas
     *
     * @return array<int,array<string,mixed>>
     */
    private function formatearListado($filas) {
        $idsProfesores = [];
        foreach ($filas as $fila) {
            $idsProfesores[] = (int)$fila['idProfesorRedactaActa'];
            if ($fila['idProfesorIniciaReunion'] !== null) {
                $idsProfesores[] = (int)$fila['idProfesorIniciaReunion'];
            }
        }

        $nombresProfesores = $this->obtenerNombresProfesoresPorIds($idsProfesores);
        $resultado = [];

        foreach ($filas as $fila) {
            $resultado[] = [
                'idConvocatoria' => (int)$fila['idConvocatoria'],
                'fecha' => $this->formatearFechaApi($fila['fecha']),
                'estado' => $fila['estado'],
                'lugar' => $fila['lugar'],
                'anioInicio' => (string)$fila['anioInicio'],
                'anioFin' => (string)$fila['anioFin'],
                'redacta' => $this->resolverNombreProfesor((int)$fila['idProfesorRedactaActa'], $nombresProfesores),
                'inicia' => $fila['idProfesorIniciaReunion'] !== null
                    ? $this->resolverNombreProfesor((int)$fila['idProfesorIniciaReunion'], $nombresProfesores)
                    : null
            ];
        }

        return $resultado;
    }

    /**
     * Ejecuta un listado reutilizando la consulta base de convocatorias.
     *
     * @param array<int,string>|null $estados
     * @param bool $ordenDescendente
     *
     * @return array<int,array<string,mixed>>
     */
    private function listarPorEstados($estados = null, $ordenDescendente = false) {
        $sql = self::SQL_LISTADO_BASE;
        $parametros = [];

        if (is_array($estados) && !empty($estados)) {
            $marcadores = [];
            foreach (array_values($estados) as $indice => $estado) {
                $marcador = ':estado' . $indice;
                $marcadores[] = $marcador;
                $parametros[$marcador] = $estado;
            }

            $sql .= " WHERE c.cancelada IN (" . implode(', ', $marcadores) . ")";
        }

        $direccion = $ordenDescendente ? 'DESC' : 'ASC';
        $sql .= " ORDER BY c.fecha {$direccion}, c.idConvocatoria {$direccion}";

        $stmt = $this->db->prepare($sql);
        foreach ($parametros as $marcador => $valor) {
            $stmt->bindValue($marcador, $valor, PDO::PARAM_STR);
        }

        $stmt->execute();
        return $this->formatearListado($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Devuelve los cursos academicos para el selector principal.
     *
     * @return array<int,array<string,int|string>>
     */
    private function obtenerCursos() {
        $sql = "SELECT idCurso, anioInicio, anioFin FROM cursoAcademico ORDER BY anioInicio DESC, anioFin DESC";
        $stmt = $this->db->query($sql);
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

    /**
     * Devuelve los lugares disponibles para reuniones.
     *
     * @return array<int,array<string,int|string>>
     */
    private function obtenerLugares() {
        $sql = "SELECT idLugar, nombre FROM lugar ORDER BY nombre ASC";
        $stmt = $this->db->query($sql);
        $resultado = [];

        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $fila) {
            $resultado[] = [
                'idLugar' => (int)$fila['idLugar'],
                'nombre' => $fila['nombre']
            ];
        }

        return $resultado;
    }

    /**
     * Devuelve el profesorado seleccionable en la convocatoria.
     *
     * @return array<int,array<string,int|string>>
     */
    private function obtenerProfesores() {
        if ($this->profesoresSeleccionables !== null) {
            return array_values($this->profesoresSeleccionables);
        }

        $sql = "SELECT DISTINCT
                    p.id AS idProfesor,
                    TRIM(CONCAT_WS(' ', p.nombre, p.apellidos)) AS nombre
                FROM personal p
                INNER JOIN personal_roles pr ON pr.personal_id = p.id
                INNER JOIN tm_roles r ON r.id = pr.rol_id
                WHERE p.activo = 1
                  AND p.tipo_personal_id = 1
                  AND r.nombre LIKE 'profesor%'
                ORDER BY nombre ASC, p.id ASC";

        $stmt = $this->dbProfesores->query($sql);
        $this->profesoresSeleccionables = [];

        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $fila) {
            $idProfesor = (int)$fila['idProfesor'];
            $nombre = $fila['nombre'] !== '' ? $fila['nombre'] : ('Profesor #' . $idProfesor);

            $this->profesoresSeleccionables[$idProfesor] = [
                'idProfesor' => $idProfesor,
                'nombre' => $nombre
            ];
            $this->nombresProfesores[$idProfesor] = $nombre;
        }

        return array_values($this->profesoresSeleccionables);
    }

    /**
     * Devuelve los grupos disponibles para participar en puntos del orden del dia.
     *
     * @return array<int,array<string,int|string>>
     */
    private function obtenerGrupos() {
        $sql = "SELECT g.idGrupo, pa.nombre
                FROM grupo g
                INNER JOIN participantes pa ON pa.idParticipante = g.idGrupo
                ORDER BY pa.nombre ASC";

        $stmt = $this->db->query($sql);
        $resultado = [];

        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $fila) {
            $resultado[] = [
                'idGrupo' => (int)$fila['idGrupo'],
                'nombre' => $fila['nombre']
            ];
        }

        return $resultado;
    }

    /**
     * Determina el curso academico actual a partir de la fecha del sistema.
     *
     * @return int|null
     */
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

        return isset($cursos[0]) ? (int)$cursos[0]['idCurso'] : null;
    }

    /**
     * Verifica que las referencias de cabecera apunten a registros existentes.
     *
     * @param array<string,mixed> $datos
     *
     * @return void
     */
    private function validarCabeceraRelacionada($datos) {
        if (!$this->existeEnTabla('cursoAcademico', 'idCurso', $datos['idCurso'])) {
            throw new InvalidArgumentException('El curso academico seleccionado no es valido.');
        }

        if (!$this->existeEnTabla('lugar', 'idLugar', $datos['idLugar'])) {
            throw new InvalidArgumentException('El lugar seleccionado no es valido.');
        }

        if (!$this->existeProfesorConvocatoria($datos['idProfesorRedactaActa'])) {
            throw new InvalidArgumentException('El profesor que redacta no es valido.');
        }

        if ($datos['idProfesorIniciaReunion'] !== null && !$this->existeProfesorConvocatoria($datos['idProfesorIniciaReunion'])) {
            throw new InvalidArgumentException('El profesor que inicia la reunion no es valido.');
        }
    }

    /**
     * Comprueba que un participante exista en la tabla asociada a su tipo.
     *
     * @param int $idParticipante
     * @param string $tipo
     *
     * @return void
     */
    private function validarParticipante($idParticipante, $tipo) {
        if ($tipo === 'profesor' && !$this->existeProfesorConvocatoria($idParticipante)) {
            throw new InvalidArgumentException('Uno de los profesores participantes no es valido.');
        }

        if ($tipo === 'grupo' && !$this->existeEnTabla('grupo', 'idGrupo', $idParticipante)) {
            throw new InvalidArgumentException('Uno de los grupos participantes no es valido.');
        }
    }

    /**
     * Comprueba si existe un registro simple por clave primaria.
     *
     * @param string $tabla
     * @param string $columna
     * @param int $id
     *
     * @return bool
     */
    private function existeEnTabla($tabla, $columna, $id) {
        $sql = "SELECT 1 FROM {$tabla} WHERE {$columna} = :id LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
        $stmt->execute();

        return (bool)$stmt->fetchColumn();
    }

    /**
     * Verifica si un profesor externo esta disponible para convocatorias.
     *
     * @param int $idProfesor
     *
     * @return bool
     */
    private function existeProfesorConvocatoria($idProfesor) {
        if ($idProfesor <= 0) {
            return false;
        }

        $mapa = $this->obtenerMapaProfesoresSeleccionables();
        return isset($mapa[(int)$idProfesor]);
    }

    /**
     * Devuelve el mapa del profesorado seleccionable indexado por id.
     *
     * @return array<int,array<string,int|string>>
     */
    private function obtenerMapaProfesoresSeleccionables() {
        if ($this->profesoresSeleccionables === null) {
            $this->obtenerProfesores();
        }

        return $this->profesoresSeleccionables ?? [];
    }

    /**
     * Resuelve nombres externos para un conjunto de ids.
     *
     * @param array<int,int|null> $ids
     *
     * @return array<int,string>
     */
    private function obtenerNombresProfesoresPorIds($ids) {
        $idsNormalizados = [];
        foreach ($ids as $id) {
            $id = (int)$id;
            if ($id > 0) {
                $idsNormalizados[$id] = $id;
            }
        }

        if (empty($idsNormalizados)) {
            return [];
        }

        $idsFaltantes = [];
        foreach ($idsNormalizados as $id) {
            if (!isset($this->nombresProfesores[$id])) {
                $idsFaltantes[] = $id;
            }
        }

        if (!empty($idsFaltantes)) {
            $consultaIds = $this->crearConsultaIds($idsFaltantes, 'profesorId');
            $sql = "SELECT
                        p.id AS idProfesor,
                        TRIM(CONCAT_WS(' ', p.nombre, p.apellidos)) AS nombre
                    FROM personal p
                    WHERE p.id IN (" . $consultaIds['marcadores'] . ")";

            $stmt = $this->dbProfesores->prepare($sql);
            foreach ($consultaIds['parametros'] as $marcador => $valor) {
                $stmt->bindValue($marcador, $valor, PDO::PARAM_INT);
            }
            $stmt->execute();

            foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $fila) {
                $idProfesor = (int)$fila['idProfesor'];
                $nombre = $fila['nombre'] !== '' ? $fila['nombre'] : ('Profesor #' . $idProfesor);
                $this->nombresProfesores[$idProfesor] = $nombre;
            }

            $idsLocalesPendientes = [];
            foreach ($idsFaltantes as $idFaltante) {
                if (!isset($this->nombresProfesores[$idFaltante])) {
                    $idsLocalesPendientes[] = $idFaltante;
                }
            }

            if (!empty($idsLocalesPendientes)) {
                $consultaIdsLocales = $this->crearConsultaIds($idsLocalesPendientes, 'profesorLocalId');
                $sqlLocal = "SELECT
                                p.idProfesor,
                                pa.nombre
                             FROM profesor p
                             INNER JOIN participantes pa ON pa.idParticipante = p.idProfesor
                             WHERE p.idProfesor IN (" . $consultaIdsLocales['marcadores'] . ")";

                $stmtLocal = $this->db->prepare($sqlLocal);
                foreach ($consultaIdsLocales['parametros'] as $marcador => $valor) {
                    $stmtLocal->bindValue($marcador, $valor, PDO::PARAM_INT);
                }
                $stmtLocal->execute();

                foreach ($stmtLocal->fetchAll(PDO::FETCH_ASSOC) as $filaLocal) {
                    $idProfesorLocal = (int)$filaLocal['idProfesor'];
                    $nombreLocal = trim((string)$filaLocal['nombre']);
                    $this->nombresProfesores[$idProfesorLocal] = $nombreLocal !== ''
                        ? $nombreLocal
                        : ('Profesor #' . $idProfesorLocal);
                }
            }

            foreach ($idsFaltantes as $idFaltante) {
                if (!isset($this->nombresProfesores[$idFaltante])) {
                    $this->nombresProfesores[$idFaltante] = 'Profesor #' . $idFaltante;
                }
            }
        }

        $resultado = [];
        foreach ($idsNormalizados as $id) {
            $resultado[$id] = $this->nombresProfesores[$id];
        }

        return $resultado;
    }

    /**
     * Actualiza el estado de una convocatoria si su estado actual esta permitido.
     *
     * @param int $idConvocatoria
     * @param array<int,string> $estadosPermitidos
     * @param string $nuevoEstado
     * @param string $mensajeError
     * @param string $mensajeExito
     *
     * @return array<string,string>
     */
    private function actualizarEstadoConvocatoria($idConvocatoria, $estadosPermitidos, $nuevoEstado, $mensajeError, $mensajeExito) {
        $marcadores = [];
        $parametros = [
            ':idConvocatoria' => (int)$idConvocatoria,
            ':nuevoEstado' => $nuevoEstado
        ];

        foreach (array_values($estadosPermitidos) as $indice => $estado) {
            $marcador = ':estado' . $indice;
            $marcadores[] = $marcador;
            $parametros[$marcador] = $estado;
        }

        $sql = "UPDATE convocatoria
                SET cancelada = :nuevoEstado
                WHERE idConvocatoria = :idConvocatoria
                  AND cancelada IN (" . implode(', ', $marcadores) . ")";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':idConvocatoria', $parametros[':idConvocatoria'], PDO::PARAM_INT);
        $stmt->bindValue(':nuevoEstado', $parametros[':nuevoEstado'], PDO::PARAM_STR);

        foreach ($marcadores as $marcador) {
            $stmt->bindValue($marcador, $parametros[$marcador], PDO::PARAM_STR);
        }

        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            throw new RuntimeException($mensajeError);
        }

        return ['message' => $mensajeExito];
    }

    /**
     * Verifica que una convocatoria existente sigue siendo editable.
     *
     * @param int $idConvocatoria
     *
     * @return void
     */
    private function asegurarConvocatoriaEditable($idConvocatoria) {
        $sql = "SELECT cancelada, fecha
                FROM convocatoria
                WHERE idConvocatoria = :idConvocatoria
                LIMIT 1";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':idConvocatoria', (int)$idConvocatoria, PDO::PARAM_INT);
        $stmt->execute();
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$fila) {
            throw new RuntimeException('No se ha encontrado la convocatoria solicitada.');
        }

        if ($fila['cancelada'] === 'p') {
            throw new InvalidArgumentException('No se puede modificar una convocatoria pasada.');
        }
    }

    /**
     * Normaliza una fecha del frontend al formato SQL Y-m-d H:i:s.
     *
     * @param string $fechaHora
     *
     * @return string
     */
    private function normalizarFechaHora($fechaHora) {
        $timestamp = strtotime($fechaHora);
        if ($timestamp === false) {
            throw new InvalidArgumentException('La fecha y hora no tienen un formato valido.');
        }

        return date('Y-m-d H:i:s', $timestamp);
    }

    /**
     * Convierte una fecha SQL al formato ISO local consumido por el frontend.
     *
     * @param string $fecha
     *
     * @return string
     */
    private function formatearFechaApi($fecha) {
        $timestamp = strtotime($fecha);
        if ($timestamp === false) {
            return $fecha;
        }

        return date('Y-m-d\TH:i:s', $timestamp);
    }

    /**
     * Indica si una fecha ya ha pasado o coincide con el instante actual.
     *
     * @param string $fechaHora
     *
     * @return bool
     */
    private function esFechaHoraPasada($fechaHora) {
        $timestamp = strtotime($fechaHora);
        return $timestamp !== false && $timestamp <= time();
    }

    /**
     * Crea una lista de marcadores para una clausula IN.
     *
     * @param array<int,int> $ids
     * @param string $prefijo
     *
     * @return array{marcadores:string,parametros:array<string,int>}
     */
    private function crearConsultaIds($ids, $prefijo) {
        $marcadores = [];
        $parametros = [];

        foreach (array_values($ids) as $indice => $id) {
            $marcador = ':' . $prefijo . $indice;
            $marcadores[] = $marcador;
            $parametros[$marcador] = (int)$id;
        }

        return [
            'marcadores' => implode(', ', $marcadores),
            'parametros' => $parametros
        ];
    }

    /**
     * Devuelve el nombre de profesor listo para el DTO.
     *
     * @param int $idProfesor
     * @param array<int,string> $nombresProfesores
     *
     * @return string
     */
    private function resolverNombreProfesor($idProfesor, $nombresProfesores) {
        return $nombresProfesores[$idProfesor] ?? ('Profesor #' . $idProfesor);
    }
}
?>
