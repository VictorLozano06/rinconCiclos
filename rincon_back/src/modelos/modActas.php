<?php

class ModActas {
    private $db;

    public function __construct($db) {
        $this->db = $db;
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
        // Hacemos el join principal para traer lugar y curso
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

        // Bucle para añadir información anidada a cada acta
        foreach ($actas as &$acta) {
            // El driver PDO a veces devuelve strings, forzamos enteros
            $acta['idActa'] = (int) $acta['idActa'];
            $acta['idConvocatoria'] = (int) $acta['idConvocatoria'];
            $acta['anioInicio'] = (int) $acta['anioInicio'];
            $acta['anioFin'] = (int) $acta['anioFin'];
            $acta['asistentes'] = (int) $acta['asistentes'];

            // Nombres de Asistentes
            $sqlAsistentes = "SELECT p.nombre FROM profesor_asiste pa JOIN participantes p ON pa.idProfesor = p.idParticipante WHERE pa.idActa = :idActa";
            $stmtAsis = $this->db->prepare($sqlAsistentes);
            $stmtAsis->execute([':idActa' => $acta['idActa']]);
            $acta['listaAsistentes'] = $stmtAsis->fetchAll(PDO::FETCH_COLUMN);

            // Nombres de Ausentes y total convocados reales (incluyendo a quien redacta e inicia)
            $sqlConvocados = "SELECT DISTINCT prof.idProfesor, p.nombre 
                              FROM (
                                  SELECT idParticipanteParticipa as idProf FROM participanteParticipa WHERE idConvocatoria = :idConvocatoria
                                  UNION
                                  SELECT :idRedacta as idProf
                                  UNION
                                  SELECT :idInicia as idProf
                              ) tmp
                              JOIN profesor prof ON tmp.idProf = prof.idProfesor
                              JOIN participantes p ON prof.idProfesor = p.idParticipante";
                              
            $stmtConv = $this->db->prepare($sqlConvocados);
            $stmtConv->execute([
                ':idConvocatoria' => $acta['idConvocatoria'],
                ':idRedacta' => $acta['idProfesorRedactaActa'],
                ':idInicia' => $acta['idProfesorIniciaReunion']
            ]);
            $convocados = $stmtConv->fetchAll(PDO::FETCH_ASSOC);
            
            $acta['totalConvocados'] = count($convocados);
            
            // Los ausentes son los convocados que no están en listaAsistentes
            $nombresAsistentes = $acta['listaAsistentes'];
            $ausentes = [];
            foreach ($convocados as $c) {
                if (!in_array($c['nombre'], $nombresAsistentes)) {
                    $ausentes[] = $c['nombre'];
                }
            }
            $acta['listaAusentes'] = $ausentes;

            // Nombres de Redacta y Convoca
            $sqlNombre = "SELECT nombre FROM participantes WHERE idParticipante = :id";
            $stmtN = $this->db->prepare($sqlNombre);
            
            $stmtN->execute([':id' => $acta['idProfesorRedactaActa']]);
            $acta['nombreRedacta'] = $stmtN->fetchColumn() ?: '';

            $stmtN->execute([':id' => $acta['idProfesorIniciaReunion']]);
            $acta['nombreConvoca'] = $stmtN->fetchColumn() ?: '';

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
                ORDER BY a.fecha DESC, co.fecha DESC";
                
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $actas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Reutilizamos la misma lógica de anidado (copiada de listarHistorialPorAnio)
        foreach ($actas as &$acta) {
            $acta['idActa'] = (int) $acta['idActa'];
            $acta['idConvocatoria'] = (int) $acta['idConvocatoria'];
            $acta['anioInicio'] = (int) $acta['anioInicio'];
            $acta['anioFin'] = (int) $acta['anioFin'];
            $acta['asistentes'] = (int) $acta['asistentes'];

            // Nombres de Asistentes
            $sqlAsistentes = "SELECT p.nombre FROM profesor_asiste pa JOIN participantes p ON pa.idProfesor = p.idParticipante WHERE pa.idActa = :idActa";
            $stmtAsis = $this->db->prepare($sqlAsistentes);
            $stmtAsis->execute([':idActa' => $acta['idActa']]);
            $acta['listaAsistentes'] = $stmtAsis->fetchAll(PDO::FETCH_COLUMN);

            // Nombres de Ausentes y total convocados reales (incluyendo a quien redacta e inicia)
            $sqlConvocados = "SELECT DISTINCT prof.idProfesor, p.nombre 
                              FROM (
                                  SELECT idParticipanteParticipa as idProf FROM participanteParticipa WHERE idConvocatoria = :idConvocatoria
                                  UNION
                                  SELECT :idRedacta as idProf
                                  UNION
                                  SELECT :idInicia as idProf
                              ) tmp
                              JOIN profesor prof ON tmp.idProf = prof.idProfesor
                              JOIN participantes p ON prof.idProfesor = p.idParticipante";
                              
            $stmtConv = $this->db->prepare($sqlConvocados);
            $stmtConv->execute([
                ':idConvocatoria' => $acta['idConvocatoria'],
                ':idRedacta' => $acta['idProfesorRedactaActa'],
                ':idInicia' => $acta['idProfesorIniciaReunion']
            ]);
            $convocados = $stmtConv->fetchAll(PDO::FETCH_ASSOC);
            
            $acta['totalConvocados'] = count($convocados);
            
            // Los ausentes son los convocados que no están en listaAsistentes
            $nombresAsistentes = $acta['listaAsistentes'];
            $ausentes = [];
            foreach ($convocados as $c) {
                if (!in_array($c['nombre'], $nombresAsistentes)) {
                    $ausentes[] = $c['nombre'];
                }
            }
            $acta['listaAusentes'] = $ausentes;

            // Nombres de Redacta y Convoca
            $sqlNombre = "SELECT nombre FROM participantes WHERE idParticipante = :id";
            $stmtN = $this->db->prepare($sqlNombre);
            
            $stmtN->execute([':id' => $acta['idProfesorRedactaActa']]);
            $acta['nombreRedacta'] = $stmtN->fetchColumn() ?: '';

            $stmtN->execute([':id' => $acta['idProfesorIniciaReunion']]);
            $acta['nombreConvoca'] = $stmtN->fetchColumn() ?: '';

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

        // Obtener participantes (solo profesores)
        $sqlPart = "SELECT DISTINCT p.idProfesor, part.nombre
                    FROM participanteParticipa pp
                    JOIN profesor p ON pp.idParticipanteParticipa = p.idProfesor
                    JOIN participantes part ON p.idProfesor = part.idParticipante
                    WHERE pp.idConvocatoria = :idConvocatoria
                    ORDER BY part.nombre ASC";
        $stmtPart = $this->db->prepare($sqlPart);
        $stmtPart->execute([':idConvocatoria' => $convocatoria['idConvocatoria']]);
        $convocatoria['profesores'] = $stmtPart->fetchAll(PDO::FETCH_ASSOC);

        foreach ($convocatoria['profesores'] as &$prof) {
            $prof['idProfesor'] = (int) $prof['idProfesor'];
            $prof['asiste'] = true;
        }

        return $convocatoria;
    }

    public function guardarActaDefinitiva($datos) {
        try {
            $this->db->beginTransaction();

            $idActa = null;
            if (isset($datos['idActa']) && $datos['idActa']) {
                $idActa = $datos['idActa'];
                // En modo edición, limpiamos la información y ruegos antiguos para reemplazarlos
                $stmtDelInfo = $this->db->prepare("DELETE FROM informacion WHERE idActa = :idActa");
                $stmtDelInfo->execute([':idActa' => $idActa]);

                $stmtDelRuegos = $this->db->prepare("DELETE FROM ruegosPreguntasActa WHERE idActa = :idActa");
                $stmtDelRuegos->execute([':idActa' => $idActa]);
            } else {
                // Bloqueamos el acta creando su registro
                $sqlActa = "INSERT INTO acta (fecha, idConvocatoria) VALUES (NOW(), :idConvocatoria)";
                $stmtActa = $this->db->prepare($sqlActa);
                $stmtActa->execute([':idConvocatoria' => $datos['idConvocatoria']]);
                $idActa = $this->db->lastInsertId();

                // Vinculamos profesores presentes
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

            // Pasamos los puntos tratados
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

            // Y las preguntas si las hubo
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
}
?>
