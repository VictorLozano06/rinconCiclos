<?php
class ModConvocatorias {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function obtenerFormulario() {
        $this->sincronizarConvocatorias();

        return [
            'cursos' => $this->obtenerCursos(),
            'lugares' => $this->obtenerLugares(),
            'profesores' => $this->obtenerProfesores(),
            'cursoActualId' => $this->obtenerCursoActualId()
        ];
    }

    public function guardar($payload) {
        $this->sincronizarConvocatorias();

        $datos = $this->extraerCabecera($payload);
        $lineas = $this->normalizarOrdenDia($payload['ordenDia'] ?? []);

        $this->db->beginTransaction();

        try {
            $idConvocatoria = $this->guardarCabecera($datos);
            $this->reemplazarDetalle($idConvocatoria, $lineas);
            $this->db->commit();

            return [
                'idConvocatoria' => $idConvocatoria,
                'message' => $datos['idConvocatoria']
                    ? 'Convocatoria actualizada correctamente.'
                    : 'Convocatoria guardada correctamente.'
            ];
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $e;
        }
    }

    public function listarConvocatorias() {
        $this->sincronizarConvocatorias();
        return $this->listarPorEstado(0);
    }

    public function listarConvocatoriasCanceladas() {
        $this->sincronizarConvocatorias();
        return $this->listarPorEstado(1);
    }

    public function obtenerConvocatoria($idConvocatoria) {
        $this->sincronizarConvocatorias();

        $convocatoria = $this->obtenerCabeceraConvocatoria($idConvocatoria);
        if (!$convocatoria) {
            return null;
        }

        $convocatoria['ordenDia'] = $this->obtenerOrdenDia($idConvocatoria);
        return $convocatoria;
    }

    public function eliminar($idConvocatoria) {
        $this->db->beginTransaction();

        try {
            $this->borrarDetalle($idConvocatoria);

            $stmt = $this->db->prepare("DELETE FROM convocatoria WHERE idConvocatoria = :idConvocatoria");
            $stmt->execute([':idConvocatoria' => $idConvocatoria]);

            $this->db->commit();
            return ['message' => 'Convocatoria y su orden del dia eliminados correctamente.'];
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $e;
        }
    }

    private function extraerCabecera($payload) {
        $datos = [
            'idConvocatoria' => isset($payload['idConvocatoria']) ? (int)$payload['idConvocatoria'] : null,
            'cursoId' => (int)($payload['cursoId'] ?? 0),
            'lugarId' => (int)($payload['lugarId'] ?? 0),
            'redactaId' => (int)($payload['redactaId'] ?? 0),
            'iniciaId' => (int)($payload['iniciaId'] ?? 0),
            'fecha' => trim((string)($payload['fechaHora'] ?? ''))
        ];

        if (!$datos['cursoId'] || !$datos['lugarId'] || !$datos['redactaId'] || !$datos['iniciaId'] || !$datos['fecha']) {
            throw new InvalidArgumentException('Faltan datos obligatorios de la convocatoria.');
        }

        $datos['fecha'] = $this->normalizarFechaHora($datos['fecha']);
        return $datos;
    }

    private function normalizarOrdenDia($ordenDia) {
        if (!is_array($ordenDia)) {
            throw new InvalidArgumentException('El orden del dia no tiene un formato valido.');
        }

        $lineas = [];

        foreach ($ordenDia as $item) {
            $descripcion = trim((string)($item['ordenDia'] ?? ''));
            $objetivo = trim((string)($item['objetivo'] ?? ''));
            $dinamizaId = (int)($item['dinamizaId'] ?? 0);
            $lugarId = (int)($item['lugarId'] ?? 0);
            $minutos = $item['minutos'] ?? null;
            $participaIds = [];

            foreach (($item['participaIds'] ?? []) as $participanteId) {
                $participanteId = (int)$participanteId;
                if ($participanteId > 0) {
                    $participaIds[] = $participanteId;
                }
            }

            $estaVacia = $descripcion === '' && $objetivo === '' && !$dinamizaId && !$lugarId && empty($participaIds) && !$minutos;
            if ($estaVacia) {
                continue;
            }

            if ($objetivo === '' || !$dinamizaId || !$lugarId) {
                throw new InvalidArgumentException('Cada punto del orden del dia debe tener objetivo, dinamiza y lugar.');
            }

            $lineas[] = [
                'numOrden' => count($lineas) + 1,
                'minutos' => $minutos !== null && $minutos !== '' ? (int)$minutos : null,
                'descripcion' => $descripcion !== '' ? $descripcion : null,
                'objetivo' => $objetivo,
                'dinamizaId' => $dinamizaId,
                'lugarId' => $lugarId,
                'participaIds' => array_values(array_unique($participaIds))
            ];
        }

        if (empty($lineas)) {
            throw new InvalidArgumentException('Anade al menos un punto valido al orden del dia.');
        }

        return $lineas;
    }

    private function guardarCabecera($datos) {
        if ($datos['idConvocatoria']) {
            if ($this->convocatoriaBloqueada($datos['idConvocatoria'])) {
                throw new InvalidArgumentException('No se puede modificar una convocatoria cancelada o pasada.');
            }

            $sql = "UPDATE convocatoria SET
                    fecha = :fecha,
                    idLugar = :idLugar,
                    idCurso = :idCurso,
                    idProfesorRedactaActa = :idRedacta,
                    idProfesorIniciaReunion = :idInicia
                    WHERE idConvocatoria = :idConvocatoria";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':fecha' => $datos['fecha'],
                ':idLugar' => $datos['lugarId'],
                ':idCurso' => $datos['cursoId'],
                ':idRedacta' => $datos['redactaId'],
                ':idInicia' => $datos['iniciaId'],
                ':idConvocatoria' => $datos['idConvocatoria']
            ]);

            return $datos['idConvocatoria'];
        }

        $sql = "INSERT INTO convocatoria (
                    fecha,
                    idLugar,
                    idCurso,
                    idProfesorRedactaActa,
                    idProfesorIniciaReunion,
                    cancelada
                ) VALUES (
                    :fecha,
                    :idLugar,
                    :idCurso,
                    :idRedacta,
                    :idInicia,
                    0
                )";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':fecha' => $datos['fecha'],
            ':idLugar' => $datos['lugarId'],
            ':idCurso' => $datos['cursoId'],
            ':idRedacta' => $datos['redactaId'],
            ':idInicia' => $datos['iniciaId']
        ]);

        return (int)$this->db->lastInsertId();
    }

    private function reemplazarDetalle($idConvocatoria, $lineas) {
        $this->borrarDetalle($idConvocatoria);

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
                :idParticipante
            )"
        );

        foreach ($lineas as $linea) {
            $stmtOrden->execute([
                ':idConvocatoria' => $idConvocatoria,
                ':numOrden' => $linea['numOrden'],
                ':minutos' => $linea['minutos'],
                ':descripcion' => $linea['descripcion'],
                ':objetivo' => $linea['objetivo'],
                ':idLugar' => $linea['lugarId'],
                ':idProfesorDinamiza' => $linea['dinamizaId']
            ]);

            foreach ($linea['participaIds'] as $participanteId) {
                $stmtParticipa->execute([
                    ':idConvocatoria' => $idConvocatoria,
                    ':numOrden' => $linea['numOrden'],
                    ':idParticipante' => $participanteId
                ]);
            }
        }
    }

    private function borrarDetalle($idConvocatoria) {
        $stmt = $this->db->prepare("DELETE FROM participanteParticipa WHERE idConvocatoria = :idConvocatoria");
        $stmt->execute([':idConvocatoria' => $idConvocatoria]);

        $stmt = $this->db->prepare("DELETE FROM ordenDia WHERE idConvocatoria = :idConvocatoria");
        $stmt->execute([':idConvocatoria' => $idConvocatoria]);
    }

    private function listarPorEstado($cancelada) {
        $sql = "SELECT
                    convocatoria.idConvocatoria,
                    convocatoria.fecha,
                    (convocatoria.cancelada + 0) AS cancelada,
                    lugar.nombre AS lugar,
                    cursoAcademico.anioInicio,
                    cursoAcademico.anioFin,
                    participanteRedacta.nombre AS redacta,
                    participanteInicia.nombre AS inicia
                FROM convocatoria
                LEFT JOIN lugar ON lugar.idLugar = convocatoria.idLugar
                LEFT JOIN cursoAcademico ON cursoAcademico.idCurso = convocatoria.idCurso
                LEFT JOIN participantes AS participanteRedacta
                    ON participanteRedacta.idParticipante = convocatoria.idProfesorRedactaActa
                LEFT JOIN participantes AS participanteInicia
                    ON participanteInicia.idParticipante = convocatoria.idProfesorIniciaReunion
                WHERE (convocatoria.cancelada + 0) = :cancelada
                ORDER BY convocatoria.fecha DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':cancelada' => (int)$cancelada]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function obtenerCabeceraConvocatoria($idConvocatoria) {
        $sql = "SELECT
                    convocatoria.idConvocatoria,
                    convocatoria.fecha,
                    (convocatoria.cancelada + 0) AS cancelada,
                    convocatoria.idLugar,
                    convocatoria.idCurso,
                    convocatoria.idProfesorRedactaActa,
                    convocatoria.idProfesorIniciaReunion,
                    lugar.nombre AS lugar,
                    cursoAcademico.anioInicio,
                    cursoAcademico.anioFin,
                    participanteRedacta.nombre AS redacta,
                    participanteInicia.nombre AS inicia
                FROM convocatoria
                LEFT JOIN lugar ON lugar.idLugar = convocatoria.idLugar
                LEFT JOIN cursoAcademico ON cursoAcademico.idCurso = convocatoria.idCurso
                LEFT JOIN participantes AS participanteRedacta
                    ON participanteRedacta.idParticipante = convocatoria.idProfesorRedactaActa
                LEFT JOIN participantes AS participanteInicia
                    ON participanteInicia.idParticipante = convocatoria.idProfesorIniciaReunion
                WHERE convocatoria.idConvocatoria = :idConvocatoria";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':idConvocatoria' => $idConvocatoria]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    private function obtenerOrdenDia($idConvocatoria) {
        $sql = "SELECT
                    ordenDia.numOrden,
                    ordenDia.minutos,
                    ordenDia.descripcion,
                    ordenDia.objetivo,
                    ordenDia.idLugar,
                    ordenDia.idProfesorDinamiza,
                    lugar.nombre AS lugar,
                    participanteDinamiza.nombre AS dinamiza
                FROM ordenDia
                LEFT JOIN lugar ON lugar.idLugar = ordenDia.idLugar
                LEFT JOIN participantes AS participanteDinamiza
                    ON participanteDinamiza.idParticipante = ordenDia.idProfesorDinamiza
                WHERE ordenDia.idConvocatoria = :idConvocatoria
                ORDER BY ordenDia.numOrden ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':idConvocatoria' => $idConvocatoria]);
        $puntos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $participantesPorOrden = $this->obtenerParticipantesPorOrden($idConvocatoria);

        foreach ($puntos as &$punto) {
            $numOrden = (int)$punto['numOrden'];
            $punto['participantes'] = $participantesPorOrden[$numOrden] ?? [];
        }

        return $puntos;
    }

    private function obtenerParticipantesPorOrden($idConvocatoria) {
        $sql = "SELECT
                    participanteParticipa.numOrden,
                    participanteParticipa.idParticipanteParticipa,
                    participante.nombre
                FROM participanteParticipa
                INNER JOIN participantes AS participante
                    ON participante.idParticipante = participanteParticipa.idParticipanteParticipa
                WHERE participanteParticipa.idConvocatoria = :idConvocatoria";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':idConvocatoria' => $idConvocatoria]);

        $participantesPorOrden = [];

        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $fila) {
            $numOrden = (int)$fila['numOrden'];
            $participantesPorOrden[$numOrden][] = [
                'idProfesor' => (int)$fila['idParticipanteParticipa'],
                'nombre' => $fila['nombre']
            ];
        }

        return $participantesPorOrden;
    }

    private function obtenerCursos() {
        $sql = "SELECT idCurso, anioInicio, anioFin FROM cursoAcademico ORDER BY anioInicio DESC";
        return $this->db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    }

    private function obtenerLugares() {
        $sql = "SELECT idLugar, nombre FROM lugar ORDER BY nombre";
        return $this->db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    }

    private function obtenerProfesores() {
        $sql = "SELECT profesor.idProfesor, participante.nombre
                FROM profesor
                INNER JOIN participantes AS participante ON participante.idParticipante = profesor.idProfesor
                ORDER BY participante.nombre";
        return $this->db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
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

        return isset($cursos[0]) ? (int)$cursos[0]['idCurso'] : null;
    }

    private function normalizarFechaHora($fechaHora) {
        $timestamp = strtotime($fechaHora);

        if ($timestamp === false) {
            throw new InvalidArgumentException('La fecha y hora no tienen un formato valido.');
        }

        return date('Y-m-d H:i:s', $timestamp);
    }

    private function convocatoriaBloqueada($idConvocatoria) {
        $stmt = $this->db->prepare(
            "SELECT convocatoria.fecha, (convocatoria.cancelada + 0) AS cancelada
             FROM convocatoria
             WHERE convocatoria.idConvocatoria = :idConvocatoria"
        );
        $stmt->execute([':idConvocatoria' => $idConvocatoria]);
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$fila) {
            return false;
        }

        if ((int)$fila['cancelada'] === 1) {
            return true;
        }

        $fechaConvocatoria = strtotime($fila['fecha']);
        return $fechaConvocatoria !== false && $fechaConvocatoria <= time();
    }

    private function sincronizarConvocatorias() {
        $sql = "UPDATE convocatoria
                SET convocatoria.cancelada = 1
                WHERE (convocatoria.cancelada + 0) = 0
                  AND convocatoria.fecha <= NOW()";

        $this->db->exec($sql);
    }
}
