<?php
// Modelo encargado de obtener los recursos y sus enlaces desde la base de datos
class ModRecursos {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function listarRecientesProfesor($limite = 5) {
        return $this->consultarRecursos(null, $limite);
    }

    public function listarPorCategoria($idCategoria) {
        return $this->consultarRecursos((int)$idCategoria, null);
    }

    public function obtenerDetalle($idCategoria, $numRecurso) {
        $recursos = $this->consultarRecursos((int)$idCategoria, null, (int)$numRecurso);
        return !empty($recursos) ? $recursos[0] : null;
    }

    private function consultarRecursos($idCategoria = null, $limite = null, $numRecurso = null) {
        $sql = "SELECT
                    r.idCategoria,
                    r.numRecurso,
                    r.nombre,
                    r.descripcion,
                    r.fechaPublicacion,
                    r.idCurso,
                    c.nombre AS categoriaNombre,
                    ca.anioInicio,
                    ca.anioFin,
                    GROUP_CONCAT(DISTINCT ru.url ORDER BY ru.url SEPARATOR '||') AS urls,
                    GROUP_CONCAT(DISTINCT ra.archivo ORDER BY ra.archivo SEPARATOR '||') AS archivos
                FROM recurso r
                INNER JOIN categoria c ON c.idCategoria = r.idCategoria
                INNER JOIN cursoAcademico ca ON ca.idCurso = r.idCurso
                LEFT JOIN recursoUrl ru ON ru.idCategoria = r.idCategoria AND ru.numRecurso = r.numRecurso
                LEFT JOIN recursoArchivo ra ON ra.idCategoria = r.idCategoria AND ra.numRecurso = r.numRecurso";

        $parametros = [];

        if ($idCategoria !== null) {
            $sql .= " WHERE r.idCategoria = :idCategoria";
            $parametros[':idCategoria'] = (int)$idCategoria;
        }

        if ($numRecurso !== null) {
            $sql .= ($idCategoria !== null ? " AND" : " WHERE") . " r.numRecurso = :numRecurso";
            $parametros[':numRecurso'] = (int)$numRecurso;
        }

        $sql .= " GROUP BY
                    r.idCategoria,
                    r.numRecurso,
                    r.nombre,
                    r.descripcion,
                    r.fechaPublicacion,
                    r.idCurso,
                    c.nombre,
                    ca.anioInicio,
                    ca.anioFin
                  ORDER BY r.fechaPublicacion DESC, r.idCategoria ASC, r.numRecurso ASC";

        if ($limite !== null) {
            $sql .= " LIMIT " . (int)$limite;
        }

        $declaracion = $this->db->prepare($sql);

        foreach ($parametros as $nombre => $valor) {
            $declaracion->bindValue($nombre, $valor, PDO::PARAM_INT);
        }

        $declaracion->execute();
        $filas = $declaracion->fetchAll(PDO::FETCH_ASSOC);

        return array_map([$this, 'formatearRecurso'], $filas);
    }

    private function formatearRecurso($fila) {
        return [
            'idCategoria' => (int)$fila['idCategoria'],
            'numRecurso' => (int)$fila['numRecurso'],
            'nombre' => $fila['nombre'],
            'descripcion' => $fila['descripcion'] ?? '',
            'fechaPublicacion' => $fila['fechaPublicacion'],
            'idCurso' => (int)$fila['idCurso'],
            'anioInicio' => (int)$fila['anioInicio'],
            'anioFin' => (int)$fila['anioFin'],
            'categoriaNombre' => $fila['categoriaNombre'],
            'urls' => $this->splitCampo($fila['urls'] ?? null),
            'archivos' => $this->splitCampo($fila['archivos'] ?? null),
            'enlacePrincipal' => $this->obtenerEnlacePrincipal($fila)
        ];
    }

    private function splitCampo($valor) {
        if (!$valor) {
            return [];
        }

        return array_values(array_filter(explode('||', $valor), function ($item) {
            return trim($item) !== '';
        }));
    }

    private function obtenerEnlacePrincipal($fila) {
        $urls = $this->splitCampo($fila['urls'] ?? null);
        if (!empty($urls)) {
            return $urls[0];
        }

        $archivos = $this->splitCampo($fila['archivos'] ?? null);
        if (!empty($archivos)) {
            return $archivos[0];
        }

        return '';
    }
}
?>
