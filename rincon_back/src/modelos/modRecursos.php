<?php
// Modelo para consultar recursos sin capas de abstraccion innecesarias
class ModRecursos {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // Lista los recursos mas recientes para la portada del profesor.
    public function listarRecientesProfesor($limite = 5) {
        $sql = $this->sqlBase() . "
                GROUP BY r.idCategoria, r.numRecurso, r.nombre, r.descripcion, r.fechaPublicacion, r.idCurso, c.nombre, ca.anioInicio, ca.anioFin
                ORDER BY r.fechaPublicacion DESC, r.idCategoria ASC, r.numRecurso ASC
                LIMIT " . (int)$limite;

        return $this->mapearRecursos($this->ejecutar($sql));
    }

    // Devuelve todos los recursos para la vista centralizada del coordinador.
    public function listarTodos() {
        $sql = $this->sqlBase() . "
                GROUP BY r.idCategoria, r.numRecurso, r.nombre, r.descripcion, r.fechaPublicacion, r.idCurso, c.nombre, ca.anioInicio, ca.anioFin
                ORDER BY r.fechaPublicacion DESC, r.idCategoria ASC, r.numRecurso ASC";

        return $this->mapearRecursos($this->ejecutar($sql));
    }

    // Filtra los recursos por categoria concreta.
    public function listarPorCategoria($idCategoria) {
        $sql = $this->sqlBase() . "
                WHERE r.idCategoria = :idCategoria
                GROUP BY r.idCategoria, r.numRecurso, r.nombre, r.descripcion, r.fechaPublicacion, r.idCurso, c.nombre, ca.anioInicio, ca.anioFin
                ORDER BY r.fechaPublicacion DESC, r.idCategoria ASC, r.numRecurso ASC";

        return $this->mapearRecursos($this->ejecutar($sql, [':idCategoria' => (int)$idCategoria]));
    }

    // Recupera un unico recurso para su ficha de detalle.
    public function obtenerDetalle($idCategoria, $numRecurso) {
        $sql = $this->sqlBase() . "
                WHERE r.idCategoria = :idCategoria AND r.numRecurso = :numRecurso
                GROUP BY r.idCategoria, r.numRecurso, r.nombre, r.descripcion, r.fechaPublicacion, r.idCurso, c.nombre, ca.anioInicio, ca.anioFin
                LIMIT 1";

        $recursos = $this->mapearRecursos($this->ejecutar($sql, [
            ':idCategoria' => (int)$idCategoria,
            ':numRecurso' => (int)$numRecurso
        ]));

        return !empty($recursos) ? $recursos[0] : null;
    }

    // Consulta base comun: solo cambia el filtro y el limite segun el caso de uso.
    private function sqlBase() {
        return "SELECT
                    r.idCategoria,
                    r.numRecurso,
                    r.nombre,
                    r.descripcion,
                    r.fechaPublicacion,
                    r.idCurso,
                    c.nombre AS categoriaNombre,
                    ca.anioInicio,
                    ca.anioFin,
                    GROUP_CONCAT(DISTINCT ru.url SEPARATOR '||') AS urls,
                    GROUP_CONCAT(DISTINCT ra.archivo SEPARATOR '||') AS archivos,
                    GROUP_CONCAT(DISTINCT CONCAT(cf.idCiclo, '::', cf.nombre) SEPARATOR '||') AS ciclos
                FROM recurso r
                INNER JOIN categoria c ON c.idCategoria = r.idCategoria
                INNER JOIN cursoAcademico ca ON ca.idCurso = r.idCurso
                LEFT JOIN recursoUrl ru ON ru.idCategoria = r.idCategoria AND ru.numRecurso = r.numRecurso
                LEFT JOIN recursoArchivo ra ON ra.idCategoria = r.idCategoria AND ra.numRecurso = r.numRecurso
                LEFT JOIN cicloRecurso cr ON cr.idCategoria = r.idCategoria AND cr.numRecurso = r.numRecurso
                LEFT JOIN cicloFormativo cf ON cf.idCiclo = cr.idCiclo";
        return $sql;
    }

    // Ejecuta la consulta y devuelve filas asociativas.
    private function ejecutar($sql, $parametros = []) {
        $stmt = $this->db->prepare($sql);
        foreach ($parametros as $nombre => $valor) {
            $stmt->bindValue($nombre, $valor, PDO::PARAM_INT);
        }

        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Convierte las filas SQL a la estructura que consume Angular.
    private function mapearRecursos($filas) {
        $recursos = [];

        foreach ($filas as $fila) {
            $recursos[] = [
                'idCategoria' => (int)$fila['idCategoria'],
                'numRecurso' => (int)$fila['numRecurso'],
                'nombre' => $fila['nombre'],
                'descripcion' => $fila['descripcion'] ?? '',
                'fechaPublicacion' => $fila['fechaPublicacion'],
                'idCurso' => (int)$fila['idCurso'],
                'anioInicio' => (int)$fila['anioInicio'],
                'anioFin' => (int)$fila['anioFin'],
                'categoriaNombre' => $fila['categoriaNombre'],
                'urls' => $this->separarCampo($fila['urls'] ?? ''),
                'archivos' => $this->separarCampo($fila['archivos'] ?? ''),
                'ciclos' => $this->separarCiclos($fila['ciclos'] ?? ''),
                'enlacePrincipal' => $this->obtenerPrincipal($fila)
            ];
        }

        return $recursos;
    }

    // Convierte el campo concatenado por MySQL en un array limpio.
    private function separarCampo($valor) {
        if ($valor === '' || $valor === null) {
            return [];
        }

        $resultado = [];
        foreach (explode('||', $valor) as $elemento) {
            $elemento = trim($elemento);
            if ($elemento !== '') {
                $resultado[] = $elemento;
            }
        }

        return $resultado;
    }

    // Convierte el campo concatenado de ciclos en pares id/nombre.
    private function separarCiclos($valor) {
        if ($valor === '' || $valor === null) {
            return [];
        }

        $resultado = [];
        foreach (explode('||', $valor) as $elemento) {
            $elemento = trim($elemento);
            if ($elemento === '') {
                continue;
            }

            $partes = explode('::', $elemento, 2);
            if (count($partes) !== 2) {
                continue;
            }

            $resultado[] = [
                'idCiclo' => (int)$partes[0],
                'nombre' => $partes[1]
            ];
        }

        return $resultado;
    }

    // Selecciona un enlace principal para el resumen visual.
    private function obtenerPrincipal($fila) {
        $urls = $this->separarCampo($fila['urls'] ?? '');
        if (!empty($urls)) {
            return $urls[0];
        }

        $archivos = $this->separarCampo($fila['archivos'] ?? '');
        if (!empty($archivos)) {
            return $archivos[0];
        }

        return '';
    }
}
?>
