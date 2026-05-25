<?php
// Modelo de convocatorias.
class ModConvocatorias {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // Devuelve los combos base del formulario.
    public function obtenerFormulario() {
        return [
            'cursos' => $this->obtenerCursos(),
            'lugares' => $this->obtenerLugares(),
            'profesores' => $this->obtenerProfesores(),
            'grupos' => $this->obtenerGrupos(),
            'cursoActualId' => $this->obtenerCursoActualId()
        ];
    }

    // Crea o actualiza una convocatoria activa o en borrador.
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

    // Lista las convocatorias activas segun su estado persistido.
    public function listarActivas() {
        $sql = "SELECT
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
                INNER JOIN participantes pi ON pi.idParticipante = c.idProfesorIniciaReunion
                WHERE c.cancelada = 'a'
                ORDER BY c.fecha ASC, c.idConvocatoria ASC";

        $stmt = $this->db->query($sql);
        return $this->formatearListado($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // Lista todas las convocatorias para coordinacion en una sola pantalla.
    public function listarTodas() {
        $sql = "SELECT
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
                INNER JOIN participantes pi ON pi.idParticipante = c.idProfesorIniciaReunion
                ORDER BY c.fecha ASC, c.idConvocatoria ASC";

        $stmt = $this->db->query($sql);
        return $this->formatearListado($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // Lista solo borradores y pasadas para la pantalla de historico.
    public function listarHistoricas() {
        $sql = "SELECT
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
                INNER JOIN participantes pi ON pi.idParticipante = c.idProfesorIniciaReunion
                WHERE c.cancelada IN ('b', 'p')
                ORDER BY c.fecha DESC, c.idConvocatoria DESC";

        $stmt = $this->db->query($sql);
        return $this->formatearListado($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // Lista solo las convocatorias pasadas.
    public function listarPasadas() {
        $sql = "SELECT
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
                INNER JOIN participantes pi ON pi.idParticipante = c.idProfesorIniciaReunion
                WHERE c.cancelada = 'p'
                ORDER BY c.fecha DESC, c.idConvocatoria DESC";

        $stmt = $this->db->query($sql);
        return $this->formatearListado($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // Carga la convocatoria completa con su orden del dia.
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

    // Marca una convocatoria activa concreta como pasada.
    public function marcarComoPasada($idConvocatoria) {
        $sql = "UPDATE convocatoria
                SET cancelada = 'p'
                WHERE idConvocatoria = :idConvocatoria
                  AND cancelada = 'a'";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':idConvocatoria', (int)$idConvocatoria, PDO::PARAM_INT);
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            throw new RuntimeException('La convocatoria indicada no esta activa o no existe.');
        }

        return ['message' => 'Convocatoria marcada como pasada correctamente.'];
    }

    // Marca todas las convocatorias activas como pasadas.
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

    // Cancela una convocatoria activa o un borrador moviendola a pasada.
    public function cancelarConvocatoria($idConvocatoria) {
        $sql = "UPDATE convocatoria
                SET cancelada = 'p'
                WHERE idConvocatoria = :idConvocatoria
                  AND cancelada IN ('a', 'b')";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':idConvocatoria', (int)$idConvocatoria, PDO::PARAM_INT);
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            throw new RuntimeException('La convocatoria indicada no se puede cancelar o no existe.');
        }

        return ['message' => 'Convocatoria marcada como pasada correctamente.'];
    }

    // Extrae y valida la cabecera principal.
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

    // Normaliza las lineas del orden del dia al contrato persistente.
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

    // Normaliza y deduplica participantes por tipo e id.
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

    // Inserta o actualiza la cabecera segun corresponda.
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

    // Sustituye el detalle de la convocatoria de una sola vez.
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

    // Borra primero el detalle dependiente.
    private function borrarOrdenDia($idConvocatoria) {
        $stmt = $this->db->prepare("DELETE FROM participanteParticipa WHERE idConvocatoria = :idConvocatoria");
        $stmt->bindValue(':idConvocatoria', (int)$idConvocatoria, PDO::PARAM_INT);
        $stmt->execute();

        $stmt = $this->db->prepare("DELETE FROM ordenDia WHERE idConvocatoria = :idConvocatoria");
        $stmt->bindValue(':idConvocatoria', (int)$idConvocatoria, PDO::PARAM_INT);
        $stmt->execute();
    }

    // Recupera y formatea el orden del dia con sus participantes.
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

    // Reconstruye el listado de participantes de cada punto.
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

    // Convierte el listado SQL al DTO del frontend.
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

    // Devuelve los cursos para el selector principal.
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

    // Devuelve los lugares disponibles para reuniones.
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

    // Devuelve el profesorado seleccionable.
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

    // Devuelve los grupos disponibles como participantes.
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

    // Selecciona el curso academico actual por año de inicio.
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

    // Verifica que las FK de cabecera apunten a registros existentes.
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

    // Comprueba que el participante existe en la tabla que corresponde a su tipo.
    private function validarParticipante($idParticipante, $tipo) {
        if ($tipo === 'profesor' && !$this->existeEnTabla('profesor', 'idProfesor', $idParticipante)) {
            throw new InvalidArgumentException('Uno de los profesores participantes no es valido.');
        }

        if ($tipo === 'grupo' && !$this->existeEnTabla('grupo', 'idGrupo', $idParticipante)) {
            throw new InvalidArgumentException('Uno de los grupos participantes no es valido.');
        }
    }

    // Comprueba si existe un registro simple por clave primaria.
    private function existeEnTabla($tabla, $columna, $id) {
        $sql = "SELECT 1 FROM {$tabla} WHERE {$columna} = :id LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
        $stmt->execute();

        return (bool)$stmt->fetchColumn();
    }

    // Verifica que la convocatoria sigue activa y editable.
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

    // Normaliza la fecha de entrada del formulario.
    private function normalizarFechaHora($fechaHora) {
        $timestamp = strtotime($fechaHora);
        if ($timestamp === false) {
            throw new InvalidArgumentException('La fecha y hora no tienen un formato valido.');
        }

        return date('Y-m-d H:i:s', $timestamp);
    }

    // Mantiene el contrato del frontend con formato ISO local.
    private function formatearFechaApi($fecha) {
        $timestamp = strtotime($fecha);
        if ($timestamp === false) {
            return $fecha;
        }

        return date('Y-m-d\TH:i:s', $timestamp);
    }

    // Indica si la fecha recibida ya ha pasado o coincide con el momento actual.
    private function esFechaHoraPasada($fechaHora) {
        $timestamp = strtotime($fechaHora);
        return $timestamp !== false && $timestamp <= time();
    }

}
?>
