<?php
class ModConvocatorias {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // Devuelve los datos basicos que necesita el formulario de alta/edicion.
    public function obtenerFormulario() {
        return [
            'cursos' => $this->obtenerCursos(),
            'lugares' => $this->obtenerLugares(),
            'profesores' => $this->obtenerProfesores(),
            'cursoActualId' => $this->obtenerCursoActualId()
        ];
    }

    // Guarda o actualiza una convocatoria y rehace el orden del dia en una transaccion.
    public function guardar($payload) {
        $idConvocatoria = isset($payload['idConvocatoria']) ? (int)$payload['idConvocatoria'] : null;
        $cursoId = (int)($payload['cursoId'] ?? 0);
        $lugarId = (int)($payload['lugarId'] ?? 0);
        $redactaId = (int)($payload['redactaId'] ?? 0);
        $iniciaId = (int)($payload['iniciaId'] ?? 0);
        $fechaHora = trim((string)($payload['fechaHora'] ?? ''));
        $ordenDia = $payload['ordenDia'] ?? [];

        if (!$cursoId || !$lugarId || !$redactaId || !$iniciaId || !$fechaHora) {
            throw new InvalidArgumentException('Faltan datos obligatorios de la convocatoria.');
        }

        if (!is_array($ordenDia)) {
            throw new InvalidArgumentException('El orden del dia no tiene un formato valido.');
        }

        $lineasValidas = [];
        foreach ($ordenDia as $indice => $item) {
            $descripcion = trim((string)($item['ordenDia'] ?? ''));
            $objetivo = trim((string)($item['objetivo'] ?? ''));
            $dinamizaId = (int)($item['dinamizaId'] ?? 0);
            $lugarLineaId = (int)($item['lugarId'] ?? 0);
            $minutos = $item['minutos'];
            $participaIds = array_values(array_filter(
                array_map('intval', $item['participaIds'] ?? []),
                fn ($id) => $id > 0
            ));

            $estaVacia = $descripcion === '' && $objetivo === '' && !$dinamizaId && !$lugarLineaId && empty($participaIds) && !$minutos;
            if ($estaVacia) {
                continue;
            }

            if ($objetivo === '' || !$dinamizaId || !$lugarLineaId) {
                throw new InvalidArgumentException('Cada punto del orden del dia debe tener objetivo, dinamiza y lugar.');
            }

            $lineasValidas[] = [
                'numOrden' => count($lineasValidas) + 1,
                'minutos' => $minutos !== null && $minutos !== '' ? (int)$minutos : null,
                'descripcion' => $descripcion !== '' ? $descripcion : null,
                'objetivo' => $objetivo,
                'dinamizaId' => $dinamizaId,
                'lugarId' => $lugarLineaId,
                'participaIds' => $participaIds
            ];
        }

        if (count($lineasValidas) === 0) {
            throw new InvalidArgumentException('Anade al menos un punto valido al orden del dia.');
        }

        $this->db->beginTransaction();

        try {
            if ($idConvocatoria) {
                // Si es edicion, se protege la convocatoria ya publicada y se limpian los detalles previos.
                if ($this->esConvocatoriaPasada($idConvocatoria)) {
                    throw new InvalidArgumentException('No se puede modificar una convocatoria pasada.');
                }

                $sqlConvocatoria = "UPDATE convocatoria SET
                                    fecha = :fecha,
                                    idLugar = :idLugar,
                                    idCurso = :idCurso,
                                    idProfesorRedactaActa = :idRedacta,
                                    idProfesorIniciaReunion = :idInicia
                                    WHERE idConvocatoria = :idConvocatoria";
                $stmtConvocatoria = $this->db->prepare($sqlConvocatoria);
                $stmtConvocatoria->execute([
                    ':fecha' => $this->normalizarFechaHora($fechaHora),
                    ':idLugar' => $lugarId,
                    ':idCurso' => $cursoId,
                    ':idRedacta' => $redactaId,
                    ':idInicia' => $iniciaId,
                    ':idConvocatoria' => $idConvocatoria
                ]);

                // Delete old details
                $sqlDelParticipa = "DELETE FROM participanteParticipa WHERE idConvocatoria = :idConvocatoria";
                $stmtDelParticipa = $this->db->prepare($sqlDelParticipa);
                $stmtDelParticipa->execute([':idConvocatoria' => $idConvocatoria]);

                $sqlDelOrden = "DELETE FROM ordenDia WHERE idConvocatoria = :idConvocatoria";
                $stmtDelOrden = $this->db->prepare($sqlDelOrden);
                $stmtDelOrden->execute([':idConvocatoria' => $idConvocatoria]);
            } else {
                // En alta nueva, primero insertamos la cabecera para obtener el id.
                $sqlConvocatoria = "INSERT INTO convocatoria (fecha, idLugar, idCurso, idProfesorRedactaActa, idProfesorIniciaReunion)
                                    VALUES (:fecha, :idLugar, :idCurso, :idRedacta, :idInicia)";
                $stmtConvocatoria = $this->db->prepare($sqlConvocatoria);
                $stmtConvocatoria->execute([
                    ':fecha' => $this->normalizarFechaHora($fechaHora),
                    ':idLugar' => $lugarId,
                    ':idCurso' => $cursoId,
                    ':idRedacta' => $redactaId,
                    ':idInicia' => $iniciaId
                ]);

                $idConvocatoria = (int)$this->db->lastInsertId();
            }

            $sqlOrden = "INSERT INTO ordenDia (idConvocatoria, numOrden, minutos, descripcion, objetivo, idLugar, idProfesorDinamiza)
                         VALUES (:idConvocatoria, :numOrden, :minutos, :descripcion, :objetivo, :idLugar, :idProfesorDinamiza)";
            $stmtOrden = $this->db->prepare($sqlOrden);

            // Cada linea valida del orden del dia genera su entrada y sus participantes asociados.
            $sqlParticipa = "INSERT INTO participanteParticipa (idConvocatoria, numOrden, idParticipanteParticipa)
                             VALUES (:idConvocatoria, :numOrden, :idParticipante)";
            $stmtParticipa = $this->db->prepare($sqlParticipa);

            foreach ($lineasValidas as $linea) {
                $stmtOrden->execute([
                    ':idConvocatoria' => $idConvocatoria,
                    ':numOrden' => $linea['numOrden'],
                    ':minutos' => $linea['minutos'],
                    ':descripcion' => $linea['descripcion'],
                    ':objetivo' => $linea['objetivo'],
                    ':idLugar' => $linea['lugarId'],
                    ':idProfesorDinamiza' => $linea['dinamizaId']
                ]);

                foreach (array_unique($linea['participaIds']) as $participanteId) {
                    $stmtParticipa->execute([
                        ':idConvocatoria' => $idConvocatoria,
                        ':numOrden' => $linea['numOrden'],
                        ':idParticipante' => $participanteId
                    ]);
                }
            }

            $this->db->commit();

            return [
                'idConvocatoria' => $idConvocatoria,
                'message' => $idConvocatoria ? 'Convocatoria actualizada correctamente.' : 'Convocatoria guardada correctamente.'
            ];
        } catch (Exception $e) {
            // Si algo falla, dejamos la BD como estaba para no mezclar cabecera y lineas a medias.
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $e;
        }
    }

    // Lista convocatorias para la pantalla principal del coordinador.
    public function listarConvocatorias() {
        $sql = "SELECT c.idConvocatoria, c.fecha,
                       l.nombre AS lugar,
                       ca.anioInicio, ca.anioFin,
                       pr.nombre AS redacta,
                       pi.nombre AS inicia
                FROM convocatoria c
                LEFT JOIN lugar l ON l.idLugar = c.idLugar
                LEFT JOIN cursoAcademico ca ON ca.idCurso = c.idCurso
                LEFT JOIN participantes pr ON pr.idParticipante = c.idProfesorRedactaActa
                LEFT JOIN participantes pi ON pi.idParticipante = c.idProfesorIniciaReunion
                ORDER BY c.fecha DESC";
        return $this->db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    }

    // Devuelve una convocatoria concreta con su orden del dia y participantes.
    public function obtenerConvocatoria($idConvocatoria) {
        $sql = "SELECT c.idConvocatoria, c.fecha, c.idLugar, c.idCurso, c.idProfesorRedactaActa, c.idProfesorIniciaReunion,
                       l.nombre AS lugar,
                       ca.anioInicio, ca.anioFin,
                       pr.nombre AS redacta,
                       pi.nombre AS inicia
                FROM convocatoria c
                LEFT JOIN lugar l ON l.idLugar = c.idLugar
                LEFT JOIN cursoAcademico ca ON ca.idCurso = c.idCurso
                LEFT JOIN participantes pr ON pr.idParticipante = c.idProfesorRedactaActa
                LEFT JOIN participantes pi ON pi.idParticipante = c.idProfesorIniciaReunion
                WHERE c.idConvocatoria = :idConvocatoria";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':idConvocatoria' => $idConvocatoria]);
        $convocatoria = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$convocatoria) {
            return null;
        }

        $sqlOrden = "SELECT od.numOrden, od.minutos, od.descripcion, od.objetivo, od.idLugar, od.idProfesorDinamiza,
                             l.nombre AS lugar,
                             pd.nombre AS dinamiza
                      FROM ordenDia od
                      LEFT JOIN lugar l ON l.idLugar = od.idLugar
                      LEFT JOIN participantes pd ON pd.idParticipante = od.idProfesorDinamiza
                      WHERE od.idConvocatoria = :idConvocatoria
                      ORDER BY od.numOrden ASC";
        $stmtOrden = $this->db->prepare($sqlOrden);
        $stmtOrden->execute([':idConvocatoria' => $idConvocatoria]);
        $puntos = $stmtOrden->fetchAll(PDO::FETCH_ASSOC);

        $sqlParticipantes = "SELECT pp.numOrden, pp.idParticipanteParticipa, pa.nombre
                              FROM participanteParticipa pp
                              INNER JOIN participantes pa ON pa.idParticipante = pp.idParticipanteParticipa
                              WHERE pp.idConvocatoria = :idConvocatoria";
        $stmtPart = $this->db->prepare($sqlParticipantes);
        $stmtPart->execute([':idConvocatoria' => $idConvocatoria]);
        $participantes = $stmtPart->fetchAll(PDO::FETCH_ASSOC);

        $partPorOrden = [];
        foreach ($participantes as $p) {
            $numOrden = (int)$p['numOrden'];
            $partPorOrden[$numOrden][] = [
                'idProfesor' => (int)$p['idParticipanteParticipa'],
                'nombre' => $p['nombre']
            ];
        }

        foreach ($puntos as &$punto) {
            $num = (int)$punto['numOrden'];
            $punto['participantes'] = $partPorOrden[$num] ?? [];
        }

        $convocatoria['ordenDia'] = $puntos;

        return $convocatoria;
    }

    // Borra primero las dependencias manuales para que la eliminacion quede limpia.
    public function eliminar($idConvocatoria) {
        $this->db->beginTransaction();

        try {
            // Se eliminan los participantes de los puntos del orden del día
            $sqlDelParticipa = "DELETE FROM participanteParticipa WHERE idConvocatoria = :idConvocatoria";
            $stmtDelParticipa = $this->db->prepare($sqlDelParticipa);
            $stmtDelParticipa->execute([':idConvocatoria' => $idConvocatoria]);

            // Se eliminan los puntos del orden del día
            $sqlDelOrden = "DELETE FROM ordenDia WHERE idConvocatoria = :idConvocatoria";
            $stmtDelOrden = $this->db->prepare($sqlDelOrden);
            $stmtDelOrden->execute([':idConvocatoria' => $idConvocatoria]);

            // Finalmente se elimina la convocatoria
            $sqlDelConvocatoria = "DELETE FROM convocatoria WHERE idConvocatoria = :idConvocatoria";
            $stmtDelConvocatoria = $this->db->prepare($sqlDelConvocatoria);
            $stmtDelConvocatoria->execute([':idConvocatoria' => $idConvocatoria]);

            $this->db->commit();

            return ['message' => 'Convocatoria y su orden del día eliminados correctamente.'];
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }

    // Obtiene el catalogo que usa el formulario de convocatorias.
    private function obtenerCursos() {
        $sql = "SELECT idCurso, anioInicio, anioFin FROM cursoAcademico ORDER BY anioInicio DESC";
        return $this->db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    }

    private function obtenerLugares() {
        $sql = "SELECT idLugar, nombre FROM lugar ORDER BY nombre";
        return $this->db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    }

    private function obtenerProfesores() {
        $sql = "SELECT p.idProfesor, pa.nombre
                FROM profesor p
                INNER JOIN participantes pa ON pa.idParticipante = p.idProfesor
                ORDER BY pa.nombre";
        return $this->db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    }

    // Calcula el curso que toca por calendario escolar.
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

    // Normaliza la fecha que llega del frontend al formato SQL.
    private function normalizarFechaHora($fechaHora) {
        $timestamp = strtotime($fechaHora);
        if ($timestamp === false) {
            throw new InvalidArgumentException('La fecha y hora no tienen un formato valido.');
        }

        return date('Y-m-d H:i:s', $timestamp);
    }

    // Evita editar convocatorias ya pasadas.
    private function esConvocatoriaPasada($idConvocatoria) {
        $stmt = $this->db->prepare("SELECT fecha FROM convocatoria WHERE idConvocatoria = :idConvocatoria");
        $stmt->execute([':idConvocatoria' => $idConvocatoria]);
        $fecha = $stmt->fetchColumn();

        if (!$fecha) {
            return false;
        }

        $fechaConvocatoria = strtotime($fecha);
        $inicioHoy = strtotime(date('Y-m-d 00:00:00'));

        return $fechaConvocatoria !== false && $fechaConvocatoria < $inicioHoy;
    }
}
