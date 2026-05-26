<?php
/**
 * Modelo de acceso a datos y reglas de negocio de convocatorias.
 *
 * Se encarga de validar el payload recibido desde el controlador, persistir la
 * cabecera y el orden del día, reconstruir los DTO de salida y aplicar los
 * cambios de estado de las convocatorias.
 */
class ModConvocatorias {
    /**
     * Conexión PDO utilizada por todas las consultas y transacciones del modelo.
     *
     * @var PDO
     */
    private $db;

    /**
     * Consulta base reutilizable para los listados de convocatorias.
     *
     * Se completa dinámicamente con filtros por estado y el orden final del
     * listado según el caso de uso.
     *
     * @var string
     */
    private const SQL_LISTADO_BASE = "SELECT
                    c.idConvocatoria,
                    c.fecha,
                    c.cancelada AS estado,
                    l.nombre AS lugar,
                    ca.anioInicio,
                    ca.anioFin,
                    pr.nombre AS redacta,
                    pi.nombre AS inicia
                FROM convocatoria c
                INNER JOIN lugar l ON l.idLugar = c.idLugar
                INNER JOIN cursoAcademico ca ON ca.idCurso = c.idCurso
                INNER JOIN participantes pr ON pr.idParticipante = c.idProfesorRedactaActa
                INNER JOIN participantes pi ON pi.idParticipante = c.idProfesorIniciaReunion";

    /**
     * Inicializa el modelo con la conexión PDO de la aplicación.
     *
     * @param PDO $db Conexión a base de datos.
     */
    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Devuelve los datos base necesarios para construir el formulario.
     *
     * @return array<string,mixed> Estructura con cursos, lugares, profesores,
     * grupos y curso actual.
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
     * Crea o actualiza una convocatoria y su orden del día en una transacción.
     *
     * @param array<string,mixed> $payload Datos recibidos desde el frontend.
     *
     * @return array<string,mixed> Identificador persistido y mensaje de resultado.
     *
     * @throws InvalidArgumentException Si el payload no supera la validación.
     * @throws RuntimeException Si se intenta editar una convocatoria no editable.
     * @throws Exception Si ocurre un error durante la persistencia.
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
     * Lista todas las convocatorias sin filtrar por estado.
     *
     * @return array<int,array<string,mixed>>
     */
    public function listarTodas() {
        return $this->listarPorEstados();
    }

    /**
     * Lista borradores y convocatorias pasadas para el histórico.
     *
     * @return array<int,array<string,mixed>>
     */
    public function listarHistoricas() {
        return $this->listarPorEstados(['b', 'p'], true);
    }

    /**
     * Lista únicamente las convocatorias pasadas.
     *
     * @return array<int,array<string,mixed>>
     */
    public function listarPasadas() {
        return $this->listarPorEstados(['p'], true);
    }

    /**
     * Recupera el detalle completo de una convocatoria.
     *
     * @param int $idConvocatoria Identificador de la convocatoria.
     *
     * @return array<string,mixed>|null DTO completo o `null` si no existe.
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
                    ca.anioFin,
                    pr.nombre AS redacta,
                    pi.nombre AS inicia
                FROM convocatoria c
                INNER JOIN lugar l ON l.idLugar = c.idLugar
                INNER JOIN cursoAcademico ca ON ca.idCurso = c.idCurso
                INNER JOIN participantes pr ON pr.idParticipante = c.idProfesorRedactaActa
                INNER JOIN participantes pi ON pi.idParticipante = c.idProfesorIniciaReunion
                WHERE c.idConvocatoria = :idConvocatoria
                LIMIT 1";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':idConvocatoria', (int)$idConvocatoria, PDO::PARAM_INT);
        $stmt->execute();
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$fila) {
            return null;
        }

        return [
            'idConvocatoria' => (int)$fila['idConvocatoria'],
            'fecha' => $this->formatearFechaApi($fila['fecha']),
            'estado' => $fila['estado'],
            'idLugar' => (int)$fila['idLugar'],
            'idCurso' => (int)$fila['idCurso'],
            'idProfesorRedactaActa' => (int)$fila['idProfesorRedactaActa'],
            'idProfesorIniciaReunion' => (int)$fila['idProfesorIniciaReunion'],
            'lugar' => $fila['lugar'],
            'anioInicio' => (string)$fila['anioInicio'],
            'anioFin' => (string)$fila['anioFin'],
            'redacta' => $fila['redacta'],
            'inicia' => $fila['inicia'],
            'ordenDia' => $this->obtenerOrdenDia($idConvocatoria)
        ];
    }

    /**
     * Marca como pasada una convocatoria activa.
     *
     * @param int $idConvocatoria Identificador de la convocatoria.
     *
     * @return array<string,string> Mensaje de confirmación.
     *
     * @throws RuntimeException Si no existe o no está activa.
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
     * @return array<string,int|string> Mensaje y número de filas actualizadas.
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
     * Cancela una convocatoria activa o borrador moviéndola a pasada.
     *
     * @param int $idConvocatoria Identificador de la convocatoria.
     *
     * @return array<string,string> Mensaje de confirmación.
     *
     * @throws RuntimeException Si no existe o no puede cancelarse.
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
     * Normaliza nombres de campo procedentes del frontend y comprueba que las
     * claves foráneas, el estado y la fecha sean válidos.
     *
     * @param array<string,mixed> $payload Datos originales recibidos del cliente.
     *
     * @return array<string,mixed> Cabecera normalizada lista para persistir.
     *
     * @throws InvalidArgumentException Si falta información obligatoria o contiene valores inválidos.
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
            'idProfesorIniciaReunion' => (int)($payload['iniciaId'] ?? 0),
            'fecha' => trim((string)($payload['fechaHora'] ?? '')),
            'estado' => $estado
        ];

        if (
            $datos['idCurso'] <= 0 ||
            $datos['idLugar'] <= 0 ||
            $datos['idProfesorRedactaActa'] <= 0 ||
            $datos['idProfesorIniciaReunion'] <= 0 ||
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
     * Normaliza el orden del día recibido desde el frontend.
     *
     * Elimina filas vacías, valida referencias y transforma la estructura en el
     * contrato persistente utilizado por las sentencias SQL.
     *
     * @param mixed $ordenDia Estructura recibida en el payload.
     *
     * @return array<int,array<string,mixed>> Líneas listas para insertar.
     *
     * @throws InvalidArgumentException Si el orden del día no es válido.
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

            if (!$this->existeEnTabla('profesor', 'idProfesor', $idProfesorDinamiza)) {
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
     * Normaliza y deduplica los participantes de un punto del orden del día.
     *
     * @param mixed $participantes Lista recibida desde el frontend.
     *
     * @return array<int,array<string,int|string>>
     *
     * @throws InvalidArgumentException Si el formato o las referencias no son válidas.
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
     * @param array<string,mixed> $datos Cabecera normalizada.
     *
     * @return int Identificador de la convocatoria persistida.
     *
     * @throws RuntimeException Si la convocatoria existente no se encuentra.
     * @throws InvalidArgumentException Si la convocatoria ya no es editable.
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
     * Primero elimina el detalle existente y después inserta de nuevo las
     * líneas del orden del día y sus participantes.
     *
     * @param int $idConvocatoria Identificador de la convocatoria.
     * @param array<int,array<string,mixed>> $lineas Orden del día normalizado.
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
                idParticipanteParticipa
            ) VALUES (
                :idConvocatoria,
                :numOrden,
                :idParticipanteParticipa
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
                    ':idParticipanteParticipa' => $participante['idParticipante']
                ]);
            }
        }
    }

    /**
     * Elimina primero el detalle dependiente de una convocatoria.
     *
     * @param int $idConvocatoria Identificador de la convocatoria.
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
     * Recupera el orden del día y lo reconstruye en el DTO esperado por Angular.
     *
     * @param int $idConvocatoria Identificador de la convocatoria.
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
                    l.nombre AS lugar,
                    pd.nombre AS dinamiza
                FROM ordenDia od
                INNER JOIN lugar l ON l.idLugar = od.idLugar
                INNER JOIN participantes pd ON pd.idParticipante = od.idProfesorDinamiza
                WHERE od.idConvocatoria = :idConvocatoria
                ORDER BY od.numOrden ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':idConvocatoria', (int)$idConvocatoria, PDO::PARAM_INT);
        $stmt->execute();
        $filas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $participantesPorOrden = $this->obtenerParticipantesPorOrden($idConvocatoria);
        $resultado = [];

        foreach ($filas as $fila) {
            $numOrden = (int)$fila['numOrden'];

            $resultado[] = [
                'numOrden' => $numOrden,
                'minutos' => $fila['minutos'] !== null ? (int)$fila['minutos'] : null,
                'descripcion' => $fila['descripcion'] ?? '',
                'objetivo' => $fila['objetivo'],
                'idLugar' => (int)$fila['idLugar'],
                'idProfesorDinamiza' => (int)$fila['idProfesorDinamiza'],
                'lugar' => $fila['lugar'],
                'dinamiza' => $fila['dinamiza'],
                'participantes' => $participantesPorOrden[$numOrden] ?? []
            ];
        }

        return $resultado;
    }

    /**
     * Reconstruye el listado de participantes agrupado por número de orden.
     *
     * @param int $idConvocatoria Identificador de la convocatoria.
     *
     * @return array<int,array<int,array<string,int|string>>>
     */
    private function obtenerParticipantesPorOrden($idConvocatoria) {
        $sql = "SELECT
                    pp.numOrden,
                    pp.idParticipanteParticipa AS idParticipante,
                    pa.nombre,
                    CASE WHEN prof.idProfesor IS NULL THEN 'grupo' ELSE 'profesor' END AS tipo
                FROM participanteParticipa pp
                INNER JOIN participantes pa ON pa.idParticipante = pp.idParticipanteParticipa
                LEFT JOIN profesor prof ON prof.idProfesor = pp.idParticipanteParticipa
                LEFT JOIN grupo g ON g.idGrupo = pp.idParticipanteParticipa
                WHERE pp.idConvocatoria = :idConvocatoria
                ORDER BY pp.numOrden ASC, pa.nombre ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':idConvocatoria', (int)$idConvocatoria, PDO::PARAM_INT);
        $stmt->execute();

        $resultado = [];

        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $fila) {
            $numOrden = (int)$fila['numOrden'];
            $resultado[$numOrden][] = [
                'idParticipante' => (int)$fila['idParticipante'],
                'tipo' => $fila['tipo'],
                'nombre' => $fila['nombre']
            ];
        }

        return $resultado;
    }

    /**
     * Convierte un conjunto de filas SQL al DTO de listado del frontend.
     *
     * @param array<int,array<string,mixed>> $filas Filas devueltas por la consulta.
     *
     * @return array<int,array<string,mixed>>
     */
    private function formatearListado($filas) {
        $resultado = [];

        foreach ($filas as $fila) {
            $resultado[] = [
                'idConvocatoria' => (int)$fila['idConvocatoria'],
                'fecha' => $this->formatearFechaApi($fila['fecha']),
                'estado' => $fila['estado'],
                'lugar' => $fila['lugar'],
                'anioInicio' => (string)$fila['anioInicio'],
                'anioFin' => (string)$fila['anioFin'],
                'redacta' => $fila['redacta'],
                'inicia' => $fila['inicia']
            ];
        }

        return $resultado;
    }

    /**
     * Ejecuta un listado reutilizando la consulta base de convocatorias.
     *
     * @param array<int,string>|null $estados Estados permitidos o `null` para no filtrar.
     * @param bool $ordenDescendente Indica si el listado debe devolverse descendente.
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
     * Devuelve los cursos académicos para el selector principal.
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
        $sql = "SELECT p.idProfesor, pa.nombre
                FROM profesor p
                INNER JOIN participantes pa ON pa.idParticipante = p.idProfesor
                ORDER BY pa.nombre ASC";

        $stmt = $this->db->query($sql);
        $resultado = [];

        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $fila) {
            $resultado[] = [
                'idProfesor' => (int)$fila['idProfesor'],
                'nombre' => $fila['nombre']
            ];
        }

        return $resultado;
    }

    /**
     * Devuelve los grupos disponibles para participar en puntos del orden del día.
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
     * Determina el curso académico actual a partir de la fecha del sistema.
     *
     * Considera que el curso empieza en septiembre, por lo que de enero a agosto
     * sigue tomándose el año de inicio anterior.
     *
     * @return int|null Identificador del curso actual o `null` si no hay cursos.
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
     * @param array<string,mixed> $datos Cabecera normalizada.
     *
     * @return void
     *
     * @throws InvalidArgumentException Si alguna referencia no existe.
     */
    private function validarCabeceraRelacionada($datos) {
        if (!$this->existeEnTabla('cursoAcademico', 'idCurso', $datos['idCurso'])) {
            throw new InvalidArgumentException('El curso academico seleccionado no es valido.');
        }

        if (!$this->existeEnTabla('lugar', 'idLugar', $datos['idLugar'])) {
            throw new InvalidArgumentException('El lugar seleccionado no es valido.');
        }

        if (!$this->existeEnTabla('profesor', 'idProfesor', $datos['idProfesorRedactaActa'])) {
            throw new InvalidArgumentException('El profesor que redacta no es valido.');
        }

        if (!$this->existeEnTabla('profesor', 'idProfesor', $datos['idProfesorIniciaReunion'])) {
            throw new InvalidArgumentException('El profesor que inicia la reunion no es valido.');
        }
    }

    /**
     * Comprueba que un participante exista en la tabla asociada a su tipo.
     *
     * @param int $idParticipante Identificador del participante.
     * @param string $tipo Tipo del participante: `profesor` o `grupo`.
     *
     * @return void
     *
     * @throws InvalidArgumentException Si el participante no existe.
     */
    private function validarParticipante($idParticipante, $tipo) {
        if ($tipo === 'profesor' && !$this->existeEnTabla('profesor', 'idProfesor', $idParticipante)) {
            throw new InvalidArgumentException('Uno de los profesores participantes no es valido.');
        }

        if ($tipo === 'grupo' && !$this->existeEnTabla('grupo', 'idGrupo', $idParticipante)) {
            throw new InvalidArgumentException('Uno de los grupos participantes no es valido.');
        }
    }

    /**
     * Comprueba si existe un registro simple por clave primaria.
     *
     * @param string $tabla Nombre de la tabla a consultar.
     * @param string $columna Nombre de la columna identificadora.
     * @param int $id Valor de la clave primaria o identificador.
     *
     * @return bool `true` si existe al menos un registro, `false` en caso contrario.
     */
    private function existeEnTabla($tabla, $columna, $id) {
        $sql = "SELECT 1 FROM {$tabla} WHERE {$columna} = :id LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
        $stmt->execute();

        return (bool)$stmt->fetchColumn();
    }

    /**
     * Actualiza el estado de una convocatoria si su estado actual está permitido.
     *
     * @param int $idConvocatoria Identificador de la convocatoria.
     * @param array<int,string> $estadosPermitidos Estados desde los que se permite la transición.
     * @param string $nuevoEstado Estado destino.
     * @param string $mensajeError Mensaje lanzado si no se actualiza ninguna fila.
     * @param string $mensajeExito Mensaje devuelto si la actualización se aplica.
     *
     * @return array<string,string>
     *
     * @throws RuntimeException Si no se actualiza ninguna fila.
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
     * @param int $idConvocatoria Identificador de la convocatoria.
     *
     * @return void
     *
     * @throws RuntimeException Si la convocatoria no existe.
     * @throws InvalidArgumentException Si la convocatoria ya está pasada.
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
     * Normaliza una fecha del frontend al formato SQL `Y-m-d H:i:s`.
     *
     * @param string $fechaHora Fecha y hora recibida desde el cliente.
     *
     * @return string Fecha lista para persistir.
     *
     * @throws InvalidArgumentException Si la fecha no tiene un formato interpretable.
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
     * @param string $fecha Fecha original devuelta por la base de datos.
     *
     * @return string Fecha en formato `Y-m-dTH:i:s` o la original si no puede parsearse.
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
     * @param string $fechaHora Fecha normalizada a comparar.
     *
     * @return bool `true` si la fecha es pasada o actual; `false` si es futura.
     */
    private function esFechaHoraPasada($fechaHora) {
        $timestamp = strtotime($fechaHora);
        return $timestamp !== false && $timestamp <= time();
    }
}
?>
