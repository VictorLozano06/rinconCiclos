<?php

/**
 * Modelo de acceso a datos y reglas de negocio para las Actas.
 *
 * Encargado de la persistencia local de las actas de reuniones, 
 * obtención del historial, control de borradores, y firmas de cierre.
 */
class ModActas {
    /** @var PDO Conexión a la base de datos principal local */
    private $db;
    /** @var PDO|null Conexión a la base de datos externa de profesores */
    private $dbProfesores;
    /** @var array Caché de nombres de profesores consultados */
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

    /**
     * Obtiene una lista de años únicos (anioInicio) en los que existen actas cerradas.
     *
     * @return array<int> Lista de años de inicio disponibles
     */
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

    /**
     * Lista todas las actas cerradas correspondientes a un curso académico específico.
     *
     * @param int $anioInicio Año de inicio del curso académico (ej. 2025 para 2025/2026)
     * @return array Lista de actas cerradas procesadas
     */
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
                  AND a.idActa NOT IN (SELECT idActa FROM informacion WHERE informacion = '###BORRADOR###')
                ORDER BY a.fecha DESC, co.fecha DESC";
                
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':anioInicio' => $anioInicio]);
        $actas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $this->procesarActasConNombresExternos($actas);
    }

    /**
     * Lista el historial de actas cerradas en las que un profesor ha participado
     * (ya sea porque fue asistente, las redactó o las inició).
     *
     * @param int $idProfesor Identificador numérico del profesor
     * @return array Lista de actas procesadas asociadas al profesor
     */
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
                WHERE (a.idActa IN (SELECT idActa FROM profesor_asiste WHERE idProfesor = :idProfesor1)
                   OR co.idProfesorRedactaActa = :idProfesor2)
                  AND a.idActa NOT IN (SELECT idActa FROM informacion WHERE informacion = '###BORRADOR###')
                ORDER BY a.fecha DESC, co.fecha DESC";
                
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':idProfesor1' => $idProfesor,
            ':idProfesor2' => $idProfesor
        ]);
        $actas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $this->procesarActasConNombresExternos($actas);
    }

    /**
     * Procesa un listado crudo de actas y lo hidrata con nombres externos 
     * resolviendo IDs locales frente a la base de datos externa de profesores.
     * Calcula dinámicamente horas de fin, ausentes y participantes.
     *
     * @param array $actas Matriz con los registros de actas extraídos de SQL
     * @return array Actas procesadas y listas para su consumo en JSON
     */
    private function procesarActasConNombresExternos($actas) {
        foreach ($actas as &$acta) {
            $acta['idActa'] = (int) $acta['idActa'];
            $acta['idConvocatoria'] = (int) $acta['idConvocatoria'];
            $acta['anioInicio'] = (int) $acta['anioInicio'];
            $acta['anioFin'] = (int) $acta['anioFin'];
            $acta['asistentes'] = (int) $acta['asistentes'];

            // Calcular hora de fin sumando minutos de ordenDia
            $sqlMin = "SELECT SUM(minutos) FROM ordenDia WHERE idConvocatoria = :idConvocatoria";
            $stmtMin = $this->db->prepare($sqlMin);
            $stmtMin->execute([':idConvocatoria' => $acta['idConvocatoria']]);
            $totMin = (int)$stmtMin->fetchColumn();

            if (!empty($acta['horaConvocatoria'])) {
                $horaObj = DateTime::createFromFormat('H:i', $acta['horaConvocatoria']);
                if ($horaObj) {
                    $horaObj->modify("+$totMin minutes");
                    $acta['horaFin'] = $horaObj->format('H:i');
                } else {
                    $acta['horaFin'] = '';
                }
            } else {
                $acta['horaFin'] = '';
            }

            // Obtener el Grupo
            $sqlGrupo = "SELECT p.nombre 
                         FROM participanteParticipa pp
                         JOIN grupo g ON pp.idParticipanteParticipa = g.idGrupo
                         JOIN participantes p ON g.idGrupo = p.idParticipante
                         WHERE pp.idConvocatoria = :idConvocatoria
                         LIMIT 1";
            $stmtGrupo = $this->db->prepare($sqlGrupo);
            $stmtGrupo->execute([':idConvocatoria' => $acta['idConvocatoria']]);
            $grupoNombre = $stmtGrupo->fetchColumn();
            $acta['grupoNombre'] = $grupoNombre ? $grupoNombre : 'Equipo Docente';

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
            $infos = $stmtInfo->fetchAll(PDO::FETCH_ASSOC);
            foreach ($infos as &$inf) {
                if ($inf['informacion'] === '###BORRADOR###') {
                    $inf['informacion'] = '';
                }
            }
            $acta['informacion'] = $infos;

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

    /**
     * Obtiene la próxima convocatoria activa que no tiene un acta abierta o cerrada.
     * Esto se utiliza para iniciar la fase de control de asistencia.
     *
     * @return array|null Datos de la convocatoria pendiente o nulo si no hay ninguna
     */
    public function obtenerConvocatoriaPendiente() {
        $sql = "SELECT 
                    co.idConvocatoria,
                    co.fecha as fechaOriginal,
                    DATE_FORMAT(co.fecha, '%Y-%m-%dT%H:%i:%s') as fecha,
                    l.nombre as lugar,
                    c.anioInicio,
                    c.anioFin,
                    co.idProfesorRedactaActa,
                    co.idProfesorIniciaReunion,
                    a.idActa
                FROM convocatoria co
                LEFT JOIN acta a ON co.idConvocatoria = a.idConvocatoria
                JOIN lugar l ON co.idLugar = l.idLugar
                JOIN cursoAcademico c ON co.idCurso = c.idCurso
                WHERE a.idActa IS NULL AND co.cancelada = 'a'
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

        // Obtener Orden del dia y calcular minutos totales
        $sqlOrden = "SELECT numOrden, objetivo, descripcion, minutos 
                     FROM ordenDia 
                     WHERE idConvocatoria = :idConvocatoria 
                     ORDER BY numOrden ASC";
        $stmtOrden = $this->db->prepare($sqlOrden);
        $stmtOrden->execute([':idConvocatoria' => $convocatoria['idConvocatoria']]);
        $convocatoria['ordenDia'] = $stmtOrden->fetchAll(PDO::FETCH_ASSOC);

        $totalMinutos = 0;
        foreach ($convocatoria['ordenDia'] as &$od) {
            $od['numOrden'] = (int) $od['numOrden'];
            $od['minutos'] = $od['minutos'] !== null ? (int) $od['minutos'] : null;
            if ($od['minutos'] !== null) {
                $totalMinutos += $od['minutos'];
            }
        }

        // Calcular hora de fin
        if ($convocatoria['fechaOriginal']) {
            $fechaInicio = new DateTime($convocatoria['fechaOriginal']);
            $fechaInicio->modify("+$totalMinutos minutes");
            $convocatoria['fechaFin'] = $fechaInicio->format('Y-m-d\TH:i:s');
        } else {
            $convocatoria['fechaFin'] = null;
        }
        
        // Obtener el Grupo asociado a la convocatoria
        $sqlGrupo = "SELECT p.nombre 
                     FROM participanteParticipa pp
                     JOIN grupo g ON pp.idParticipanteParticipa = g.idGrupo
                     JOIN participantes p ON g.idGrupo = p.idParticipante
                     WHERE pp.idConvocatoria = :idConvocatoria
                     LIMIT 1";
        $stmtGrupo = $this->db->prepare($sqlGrupo);
        $stmtGrupo->execute([':idConvocatoria' => $convocatoria['idConvocatoria']]);
        $grupoNombre = $stmtGrupo->fetchColumn();
        $convocatoria['grupoNombre'] = $grupoNombre ? $grupoNombre : 'Equipo Docente';

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

    public function obtenerConvocatoriaPendienteRedaccion() {
        $sql = "SELECT 
                    co.idConvocatoria,
                    co.fecha as fechaOriginal,
                    DATE_FORMAT(co.fecha, '%Y-%m-%dT%H:%i:%s') as fecha,
                    l.nombre as lugar,
                    c.anioInicio,
                    c.anioFin,
                    co.idProfesorRedactaActa,
                    co.idProfesorIniciaReunion,
                    a.idActa
                FROM convocatoria co
                JOIN acta a ON co.idConvocatoria = a.idConvocatoria
                JOIN lugar l ON co.idLugar = l.idLugar
                JOIN cursoAcademico c ON co.idCurso = c.idCurso
                JOIN informacion i ON a.idActa = i.idActa
                WHERE i.informacion = '###BORRADOR###' AND co.cancelada = 'a'
                ORDER BY co.fecha ASC
                LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $convocatoria = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$convocatoria) {
            return null;
        }

        $convocatoria['idConvocatoria'] = (int) $convocatoria['idConvocatoria'];
        $convocatoria['anioInicio'] = (int) $convocatoria['anioInicio'];
        $convocatoria['anioFin'] = (int) $convocatoria['anioFin'];
        $convocatoria['idProfesorRedactaActa'] = (int) $convocatoria['idProfesorRedactaActa'];
        $convocatoria['idProfesorIniciaReunion'] = (int) $convocatoria['idProfesorIniciaReunion'];
        $convocatoria['idActa'] = (int) $convocatoria['idActa'];

        $sqlOrden = "SELECT numOrden, objetivo, descripcion, minutos 
                     FROM ordenDia 
                     WHERE idConvocatoria = :idConvocatoria 
                     ORDER BY numOrden ASC";
        $stmtOrden = $this->db->prepare($sqlOrden);
        $stmtOrden->execute([':idConvocatoria' => $convocatoria['idConvocatoria']]);
        $convocatoria['ordenDia'] = $stmtOrden->fetchAll(PDO::FETCH_ASSOC);

        $totalMinutos = 0;
        foreach ($convocatoria['ordenDia'] as &$od) {
            $od['numOrden'] = (int) $od['numOrden'];
            $od['minutos'] = $od['minutos'] !== null ? (int) $od['minutos'] : null;
            if ($od['minutos'] !== null) {
                $totalMinutos += $od['minutos'];
            }
        }

        $minutosExtra = $totalMinutos + 15;
        $fechaDateTime = new DateTime($convocatoria['fechaOriginal']);
        $fechaDateTime->add(new DateInterval('PT' . $minutosExtra . 'M'));
        $convocatoria['horaFin'] = $fechaDateTime->format('H:i');

        $sqlGrupo = "SELECT p.nombre 
                     FROM participanteParticipa pp
                     JOIN grupo g ON pp.idParticipanteParticipa = g.idGrupo
                     JOIN participantes p ON g.idGrupo = p.idParticipante
                     WHERE pp.idConvocatoria = :idConvocatoria
                     LIMIT 1";
        $stmtGrupo = $this->db->prepare($sqlGrupo);
        $stmtGrupo->execute([':idConvocatoria' => $convocatoria['idConvocatoria']]);
        $grupoNombre = $stmtGrupo->fetchColumn();
        $convocatoria['grupo'] = $grupoNombre ? $grupoNombre : 'No asignado';

        $this->obtenerNombresProfesoresPorIds([$convocatoria['idProfesorRedactaActa'], $convocatoria['idProfesorIniciaReunion']]);
        $convocatoria['nombreRedacta'] = $convocatoria['idProfesorRedactaActa'] ? $this->resolverNombreProfesor($convocatoria['idProfesorRedactaActa']) : '';
        $convocatoria['nombreConvoca'] = $convocatoria['idProfesorIniciaReunion'] ? $this->resolverNombreProfesor($convocatoria['idProfesorIniciaReunion']) : '';

        // Ahora obtener la asistencia guardada
        $sqlAsist = "SELECT idProfesor FROM profesor_asiste WHERE idActa = :idActa";
        $stmtAsist = $this->db->prepare($sqlAsist);
        $stmtAsist->execute([':idActa' => $convocatoria['idActa']]);
        $idsAsistentes = $stmtAsist->fetchAll(PDO::FETCH_COLUMN);

        $sqlConv = "SELECT idParticipanteParticipa as idProfesor FROM participanteParticipa WHERE idConvocatoria = :idConvocatoria AND tipoParticipante = 'profesor'";
        $stmtConv = $this->db->prepare($sqlConv);
        $stmtConv->execute([':idConvocatoria' => $convocatoria['idConvocatoria']]);
        $idsConvocados = $stmtConv->fetchAll(PDO::FETCH_COLUMN);

        $todosLosIds = array_unique(array_merge($idsAsistentes, $idsConvocados));
        $this->obtenerNombresProfesoresPorIds($todosLosIds);

        $profesores = [];
        foreach ($idsAsistentes as $idAsis) {
            $profesores[] = [
                'idProfesor' => (int)$idAsis,
                'nombre' => $this->resolverNombreProfesor((int)$idAsis),
                'asiste' => true
            ];
        }

        foreach ($idsConvocados as $idConv) {
            if (!in_array($idConv, $idsAsistentes)) {
                $profesores[] = [
                    'idProfesor' => (int)$idConv,
                    'nombre' => $this->resolverNombreProfesor((int)$idConv),
                    'asiste' => false
                ];
            }
        }

        $convocatoria['profesores'] = $profesores;
        
        // Obtener la información del borrador
        $sqlInfo = "SELECT numInformacion, titulo_OrdenDia, informacion 
                    FROM informacion 
                    WHERE idActa = :idActa 
                    ORDER BY numInformacion ASC";
        $stmtInfo = $this->db->prepare($sqlInfo);
        $stmtInfo->execute([':idActa' => $convocatoria['idActa']]);
        $infos = $stmtInfo->fetchAll(PDO::FETCH_ASSOC);
        foreach ($infos as &$inf) {
            if ($inf['informacion'] === '###BORRADOR###') {
                $inf['informacion'] = '';
            }
        }
        $convocatoria['informacion'] = $infos;

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
                    if (trim($ruego) !== '') {
                        $stmtRuego->execute([
                            ':idActa' => $idActa,
                            ':texto' => trim($ruego)
                        ]);
                    }
                }
            }

            $this->db->commit();
            return ['exito' => true, 'idActa' => $idActa];
        } catch (Exception $e) {
            $this->db->rollBack();
            return ['exito' => false, 'error' => $e->getMessage()];
        }
    }

    public function guardarAsistenciaYCrearBorrador($datos) {
        try {
            $this->db->beginTransaction();

            // 1. Crear el acta vacía
            $sqlActa = "INSERT INTO acta (fecha, idConvocatoria) VALUES (NOW(), :idConvocatoria)";
            $stmtActa = $this->db->prepare($sqlActa);
            $stmtActa->execute([':idConvocatoria' => $datos['idConvocatoria']]);
            $idActa = $this->db->lastInsertId();

            // 2. Guardar asistencia
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

            // 3. Crear registros vacíos en 'informacion' basándose en 'ordenDia'
            $sqlOrden = "SELECT numOrden, objetivo FROM ordenDia WHERE idConvocatoria = :idConvocatoria";
            $stmtOrden = $this->db->prepare($sqlOrden);
            $stmtOrden->execute([':idConvocatoria' => $datos['idConvocatoria']]);
            $ordenes = $stmtOrden->fetchAll(PDO::FETCH_ASSOC);

            $sqlInfo = "INSERT INTO informacion (idActa, numInformacion, titulo_OrdenDia, informacion) 
                        VALUES (:idActa, :num, :titulo, :info)";
            $stmtInfo = $this->db->prepare($sqlInfo);
            
            $first = true;
            foreach ($ordenes as $od) {
                $infoText = '';
                if ($first) {
                    $infoText = '###BORRADOR###';
                    $first = false;
                }
                $stmtInfo->execute([
                    ':idActa' => $idActa,
                    ':num' => $od['numOrden'],
                    ':titulo' => $od['objetivo'],
                    ':info' => $infoText
                ]);
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
