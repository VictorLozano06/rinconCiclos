<?php

class ModActas {
    private $db;
    private $dbProfesores;
    private $nombresProfesores = [];

    public function __construct($db) {
        $this->db = $db;
        $conexionBD = new ConexionBD();
        try {
            $this->dbProfesores = $conexionBD->obtenerConexion('nueva');
        } catch (\RuntimeException $e) {
            $this->dbProfesores = null;
        }
    }

    public function obtenerAniosConActas() {
        $sql = "SELECT DISTINCT c.anioInicio 
                FROM acta a
                JOIN convocatoria co ON a.idConvocatoria = co.idConvocatoria
                JOIN cursoAcademico c ON co.idCurso = c.idCurso
                ORDER BY c.anioInicio DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $anios = [];
        foreach ($resultados as $row) {
            $anios[] = (int) $row['anioInicio'];
        }
        return $anios;
    }

    public function listarHistorialPorAnio($anioInicio) {
        $sql = "SELECT 
                    a.idActa, 
                    DATE_FORMAT(a.fecha, '%d/%m/%Y') as fecha, 
                    co.idConvocatoria, 
                    DATE_FORMAT(co.fecha, '%d/%m/%Y') as fechaConvocatoria, 
                    DATE_FORMAT(co.fecha, '%H:%i') as horaConvocatoria, 
                    l.nombre as lugar, 
                    c.anioInicio, 
                    c.anioFin,
                    co.idProfesorRedactaActa,
                    co.idProfesorIniciaReunion,
                    (SELECT COUNT(*) FROM profesor_asiste pa WHERE pa.idActa = a.idActa) as asistentes
                FROM acta a
                JOIN convocatoria co ON a.idConvocatoria = co.idConvocatoria
                JOIN lugar l ON co.idLugar = l.idLugar
                JOIN cursoAcademico c ON co.idCurso = c.idCurso
                WHERE c.anioInicio = :anioInicio
                ORDER BY a.fecha DESC, co.fecha DESC";
                
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':anioInicio' => $anioInicio]);
        $actas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $this->procesarActasConNombresExternos($actas);
    }

    public function listarHistorialPorProfesor($idProfesor) {
        $sql = "SELECT 
                    a.idActa, 
                    DATE_FORMAT(a.fecha, '%d/%m/%Y') as fecha, 
                    co.idConvocatoria, 
                    DATE_FORMAT(co.fecha, '%d/%m/%Y') as fechaConvocatoria, 
                    DATE_FORMAT(co.fecha, '%H:%i') as horaConvocatoria, 
                    l.nombre as lugar, 
                    c.anioInicio, 
                    c.anioFin,
                    co.idProfesorRedactaActa,
                    co.idProfesorIniciaReunion,
                    (SELECT COUNT(*) FROM profesor_asiste pa WHERE pa.idActa = a.idActa) as asistentes
                FROM acta a
                JOIN convocatoria co ON a.idConvocatoria = co.idConvocatoria
                JOIN lugar l ON co.idLugar = l.idLugar
                JOIN cursoAcademico c ON co.idCurso = c.idCurso
                WHERE a.idActa IN (SELECT idActa FROM profesor_asiste WHERE idProfesor = :idProfesor)
                   OR co.idProfesorRedactaActa = :idProfesor
                ORDER BY a.fecha DESC, co.fecha DESC";
                
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':idProfesor' => $idProfesor]);
        $actas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $this->procesarActasConNombresExternos($actas);
    }

    private function procesarActasConNombresExternos($actas) {
        foreach ($actas as &$acta) {
            $acta['idActa'] = (int) $acta['idActa'];
            $acta['idConvocatoria'] = (int) $acta['idConvocatoria'];
            $acta['anioInicio'] = (int) $acta['anioInicio'];
            $acta['anioFin'] = (int) $acta['anioFin'];
            $acta['asistentes'] = (int) $acta['asistentes'];

            // Obtener IDs Asistentes
            $sqlAsistentes = "SELECT idProfesor FROM profesor_asiste WHERE idActa = :idActa";
            $stmtAsis = $this->db->prepare($sqlAsistentes);
            $stmtAsis->execute([':idActa' => $acta['idActa']]);
            $idsAsistentes = $stmtAsis->fetchAll(PDO::FETCH_COLUMN);

            // Obtener IDs Convocados (solo profesores)
            $sqlConvocados = "
                SELECT idParticipanteParticipa as idProf FROM participanteParticipa WHERE idConvocatoria = :idConvocatoria AND tipoParticipante = 'profesor'
                UNION
                SELECT :idRedacta as idProf
                UNION
                SELECT :idInicia as idProf
            ";
            $stmtConv = $this->db->prepare($sqlConvocados);
            $stmtConv->execute([
                ':idConvocatoria' => $acta['idConvocatoria'],
                ':idRedacta' => $acta['idProfesorRedactaActa'],
                ':idInicia' => $acta['idProfesorIniciaReunion']
            ]);
            $idsConvocados = $stmtConv->fetchAll(PDO::FETCH_COLUMN);
            $idsConvocados = array_filter($idsConvocados, function($id) { return !is_null($id) && $id !== ''; });

            // Pre-cargar todos los nombres necesarios
            $todosLosIds = array_unique(array_merge($idsAsistentes, $idsConvocados));
            $this->obtenerNombresProfesoresPorIds($todosLosIds);

            // Nombres de Asistentes
            $listaAsistentes = [];
            foreach ($idsAsistentes as $idAsis) {
                $listaAsistentes[] = $this->resolverNombreProfesor((int)$idAsis);
            }
            $acta['listaAsistentes'] = $listaAsistentes;

            // Nombres de Ausentes
            $ausentes = [];
            foreach ($idsConvocados as $idConv) {
                if (!in_array($idConv, $idsAsistentes)) {
                    $ausentes[] = $this->resolverNombreProfesor((int)$idConv);
                }
            }
            $acta['totalConvocados'] = count($idsConvocados);
            $acta['listaAusentes'] = array_values(array_unique($ausentes));

            // Nombres de Redacta y Convoca
            $acta['nombreRedacta'] = $acta['idProfesorRedactaActa'] ? $this->resolverNombreProfesor((int)$acta['idProfesorRedactaActa']) : '';
            $acta['nombreConvoca'] = $acta['idProfesorIniciaReunion'] ? $this->resolverNombreProfesor((int)$acta['idProfesorIniciaReunion']) : '';

            // Obtener Informacion
            $sqlInfo = "SELECT numInformacion, titulo_OrdenDia, informacion 
                        FROM informacion 
                        WHERE idActa = :idActa 
                        ORDER BY numInformacion ASC";
            $stmtInfo = $this->db->prepare($sqlInfo);
            $stmtInfo->execute([':idActa' => $acta['idActa']]);
            $acta['informacion'] = $stmtInfo->fetchAll(PDO::FETCH_ASSOC);

            // Obtener Ruegos y preguntas
            $sqlRuegos = "SELECT ruegosPregunta 
                          FROM ruegosPreguntasActa 
                          WHERE idActa = :idActa";
            $stmtRuegos = $this->db->prepare($sqlRuegos);
            $stmtRuegos->execute([':idActa' => $acta['idActa']]);
            
            $ruegos = [];
            while ($row = $stmtRuegos->fetch(PDO::FETCH_ASSOC)) {
                $ruegos[] = $row['ruegosPregunta'];
            }
            $acta['ruegosPregunta'] = $ruegos;
        }

        return $actas;
    }

    public function obtenerConvocatoriaPendiente() {
        $sql = "SELECT 
                    co.idConvocatoria,
                    co.fecha as fechaOriginal,
                    DATE_FORMAT(co.fecha, '%Y-%m-%dT%H:%i:%s') as fecha,
                    l.nombre as lugar,
                    c.anioInicio,
                    c.anioFin,
                    co.idProfesorRedactaActa,
                    co.idProfesorIniciaReunion
                FROM convocatoria co
                LEFT JOIN acta a ON co.idConvocatoria = a.idConvocatoria
                JOIN lugar l ON co.idLugar = l.idLugar
                JOIN cursoAcademico c ON co.idCurso = c.idCurso
                WHERE a.idActa IS NULL AND co.cancelada = 0
                ORDER BY co.fecha ASC
                LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $convocatoria = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$convocatoria) {
            return null;
        }

        // Convertir IDs
        $convocatoria['idConvocatoria'] = (int) $convocatoria['idConvocatoria'];
        $convocatoria['anioInicio'] = (int) $convocatoria['anioInicio'];
        $convocatoria['anioFin'] = (int) $convocatoria['anioFin'];
        $convocatoria['idProfesorRedactaActa'] = (int) $convocatoria['idProfesorRedactaActa'];
        $convocatoria['idProfesorIniciaReunion'] = (int) $convocatoria['idProfesorIniciaReunion'];

        // Obtener Orden del dia
        $sqlOrden = "SELECT numOrden, objetivo, descripcion, minutos 
                     FROM ordenDia 
                     WHERE idConvocatoria = :idConvocatoria 
                     ORDER BY numOrden ASC";
        $stmtOrden = $this->db->prepare($sqlOrden);
        $stmtOrden->execute([':idConvocatoria' => $convocatoria['idConvocatoria']]);
        $convocatoria['ordenDia'] = $stmtOrden->fetchAll(PDO::FETCH_ASSOC);

        foreach ($convocatoria['ordenDia'] as &$od) {
            $od['numOrden'] = (int) $od['numOrden'];
            $od['minutos'] = $od['minutos'] !== null ? (int) $od['minutos'] : null;
        }

        // Obtener participantes (solo profesores) usando IDs e resolviendolos con la BD Externa
        $sqlPart = "SELECT DISTINCT idParticipanteParticipa as idProfesor
                    FROM participanteParticipa 
                    WHERE idConvocatoria = :idConvocatoria AND tipoParticipante = 'profesor'";
        $stmtPart = $this->db->prepare($sqlPart);
        $stmtPart->execute([':idConvocatoria' => $convocatoria['idConvocatoria']]);
        $idsProfesores = $stmtPart->fetchAll(PDO::FETCH_COLUMN);

        $this->obtenerNombresProfesoresPorIds($idsProfesores);

        $profesoresMapped = [];
        $idsProfesores = array_unique($idsProfesores);
        foreach ($idsProfesores as $idProf) {
            $profesoresMapped[] = [
                'idProfesor' => (int) $idProf,
                'nombre' => $this->resolverNombreProfesor((int)$idProf),
                'asiste' => true
            ];
        }

        // Ordenar alfabeticamente
        usort($profesoresMapped, function($a, $b) {
            return strcasecmp($a['nombre'], $b['nombre']);
        });

        $convocatoria['profesores'] = $profesoresMapped;

        return $convocatoria;
    }

    public function guardarActaDefinitiva($datos) {
        try {
            $this->db->beginTransaction();

            $idActa = null;
            if (isset($datos['idActa']) && $datos['idActa']) {
                $idActa = $datos['idActa'];
                $stmtDelInfo = $this->db->prepare("DELETE FROM informacion WHERE idActa = :idActa");
                $stmtDelInfo->execute([':idActa' => $idActa]);

                $stmtDelRuegos = $this->db->prepare("DELETE FROM ruegosPreguntasActa WHERE idActa = :idActa");
                $stmtDelRuegos->execute([':idActa' => $idActa]);
            } else {
                $sqlActa = "INSERT INTO acta (fecha, idConvocatoria) VALUES (NOW(), :idConvocatoria)";
                $stmtActa = $this->db->prepare($sqlActa);
                $stmtActa->execute([':idConvocatoria' => $datos['idConvocatoria']]);
                $idActa = $this->db->lastInsertId();

                if (isset($datos['asistentes']) && is_array($datos['asistentes'])) {
                    $sqlAsiste = "INSERT INTO profesor_asiste (idActa, idProfesor) VALUES (:idActa, :idProfesor)";
                    $stmtAsiste = $this->db->prepare($sqlAsiste);
                    foreach ($datos['asistentes'] as $idProf) {
                        $stmtAsiste->execute([
                            ':idActa' => $idActa,
                            ':idProfesor' => $idProf
                        ]);
                    }
                }
            }

            if (isset($datos['informacion']) && is_array($datos['informacion'])) {
                $sqlInfo = "INSERT INTO informacion (idActa, numInformacion, titulo_OrdenDia, informacion) 
                            VALUES (:idActa, :num, :titulo, :info)";
                $stmtInfo = $this->db->prepare($sqlInfo);
                foreach ($datos['informacion'] as $info) {
                    $stmtInfo->execute([
                        ':idActa' => $idActa,
                        ':num' => $info['numInformacion'],
                        ':titulo' => $info['titulo_OrdenDia'],
                        ':info' => $info['informacion'] ?? ''
                    ]);
                }
            }

            if (isset($datos['ruegos']) && is_array($datos['ruegos'])) {
                $sqlRuego = "INSERT INTO ruegosPreguntasActa (idActa, ruegosPregunta) VALUES (:idActa, :texto)";
                $stmtRuego = $this->db->prepare($sqlRuego);
                foreach ($datos['ruegos'] as $ruego) {
                    $stmtRuego->execute([
                        ':idActa' => $idActa,
                        ':texto' => $ruego
                    ]);
                }
            }

            $this->db->commit();
            return ['exito' => true, 'idActa' => $idActa];
        } catch (Exception $e) {
            $this->db->rollBack();
            return ['exito' => false, 'error' => $e->getMessage()];
        }
    }

    public function habilitarPlantilla($idConvocatoria) {
        return ['exito' => true, 'idActa' => 0];
    }

    // --- MÉTODOS DE SOPORTE PARA NOMBRES EXTERNOS ---

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

    private function resolverNombreProfesor($idProfesor) {
        return $this->nombresProfesores[$idProfesor] ?? ('Profesor #' . $idProfesor);
    }

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
}
?>
