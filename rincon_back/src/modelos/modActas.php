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
        // Obtenemos los datos base de cada acta
        $sql = "SELECT 
                    a.idActa, 
                    DATE_FORMAT(a.fecha, '%d/%m/%Y') as fecha, 
                    co.idConvocatoria, 
                    DATE_FORMAT(co.fecha, '%d/%m/%Y') as fechaConvocatoria, 
                    DATE_FORMAT(co.fecha, '%H:%i') as horaConvocatoria, 
                    l.nombre as lugar, 
                    c.anioInicio, 
                    c.anioFin,
                    (SELECT COUNT(*) FROM profesor_asiste pa WHERE pa.idActa = a.idActa) as asistentes,
                    (SELECT COUNT(DISTINCT pp.idParticipanteParticipa) FROM participanteParticipa pp WHERE pp.idConvocatoria = co.idConvocatoria) as totalConvocados
                FROM acta a
                JOIN convocatoria co ON a.idConvocatoria = co.idConvocatoria
                JOIN lugar l ON co.idLugar = l.idLugar
                JOIN cursoAcademico c ON co.idCurso = c.idCurso
                WHERE c.anioInicio = :anioInicio
                ORDER BY a.fecha DESC, co.fecha DESC";
                
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':anioInicio' => $anioInicio]);
        $actas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Para cada acta, obtenemos su informacion y ruegos
        foreach ($actas as &$acta) {
            // Transformar numéricos
            $acta['idActa'] = (int) $acta['idActa'];
            $acta['idConvocatoria'] = (int) $acta['idConvocatoria'];
            $acta['anioInicio'] = (int) $acta['anioInicio'];
            $acta['anioFin'] = (int) $acta['anioFin'];
            $acta['asistentes'] = (int) $acta['asistentes'];
            $acta['totalConvocados'] = (int) $acta['totalConvocados'];

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
}
?>
