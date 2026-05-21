<?php
// Modelo de recursos.
class ModRecursos {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // Lista los recursos mas recientes para la portada del profesor.
    public function listarRecientesProfesor($limite = 5) {
        $sql = "SELECT
                    recurso.*,
                    categoria.nombre AS categoriaNombre,
                    cursoAcademico.anioInicio,
                    cursoAcademico.anioFin,
                    (
                        SELECT GROUP_CONCAT(DISTINCT recursoUrl.url SEPARATOR '||')
                        FROM recursoUrl
                        WHERE recursoUrl.idCategoria = recurso.idCategoria
                          AND recursoUrl.numRecurso = recurso.numRecurso
                    ) AS urls,
                    (
                        SELECT GROUP_CONCAT(DISTINCT recursoArchivo.archivo SEPARATOR '||')
                        FROM recursoArchivo
                        WHERE recursoArchivo.idCategoria = recurso.idCategoria
                          AND recursoArchivo.numRecurso = recurso.numRecurso
                    ) AS archivos,
                    (
                        SELECT GROUP_CONCAT(DISTINCT CONCAT(cicloFormativo.idCiclo, '::', cicloFormativo.nombre) SEPARATOR '||')
                        FROM cicloRecurso
                        INNER JOIN cicloFormativo ON cicloFormativo.idCiclo = cicloRecurso.idCiclo
                        WHERE cicloRecurso.idCategoria = recurso.idCategoria
                          AND cicloRecurso.numRecurso = recurso.numRecurso
                    ) AS ciclos
                FROM recurso
                INNER JOIN categoria ON categoria.idCategoria = recurso.idCategoria
                INNER JOIN cursoAcademico ON cursoAcademico.idCurso = recurso.idCurso
                ORDER BY recurso.fechaPublicacion DESC, recurso.idCategoria ASC, recurso.numRecurso ASC
                LIMIT " . (int)$limite;

        $resultado = $this->db->query($sql);
        return $this->formatearRecursos($resultado->fetchAll(PDO::FETCH_ASSOC));
    }

    // Devuelve todos los recursos para la vista centralizada del coordinador.
    public function listarTodos() {
        $sql = "SELECT
                    recurso.*,
                    categoria.nombre AS categoriaNombre,
                    cursoAcademico.anioInicio,
                    cursoAcademico.anioFin,
                    (
                        SELECT GROUP_CONCAT(DISTINCT recursoUrl.url SEPARATOR '||')
                        FROM recursoUrl
                        WHERE recursoUrl.idCategoria = recurso.idCategoria
                          AND recursoUrl.numRecurso = recurso.numRecurso
                    ) AS urls,
                    (
                        SELECT GROUP_CONCAT(DISTINCT recursoArchivo.archivo SEPARATOR '||')
                        FROM recursoArchivo
                        WHERE recursoArchivo.idCategoria = recurso.idCategoria
                          AND recursoArchivo.numRecurso = recurso.numRecurso
                    ) AS archivos,
                    (
                        SELECT GROUP_CONCAT(DISTINCT CONCAT(cicloFormativo.idCiclo, '::', cicloFormativo.nombre) SEPARATOR '||')
                        FROM cicloRecurso
                        INNER JOIN cicloFormativo ON cicloFormativo.idCiclo = cicloRecurso.idCiclo
                        WHERE cicloRecurso.idCategoria = recurso.idCategoria
                          AND cicloRecurso.numRecurso = recurso.numRecurso
                    ) AS ciclos
                FROM recurso
                INNER JOIN categoria ON categoria.idCategoria = recurso.idCategoria
                INNER JOIN cursoAcademico ON cursoAcademico.idCurso = recurso.idCurso
                ORDER BY recurso.fechaPublicacion DESC, recurso.idCategoria ASC, recurso.numRecurso ASC";

        $resultado = $this->db->query($sql);
        return $this->formatearRecursos($resultado->fetchAll(PDO::FETCH_ASSOC));
    }

    // Filtra los recursos por categoria concreta.
    public function listarPorCategoria($idCategoria) {
        $sql = "SELECT
                    recurso.*,
                    categoria.nombre AS categoriaNombre,
                    cursoAcademico.anioInicio,
                    cursoAcademico.anioFin,
                    (
                        SELECT GROUP_CONCAT(DISTINCT recursoUrl.url SEPARATOR '||')
                        FROM recursoUrl
                        WHERE recursoUrl.idCategoria = recurso.idCategoria
                          AND recursoUrl.numRecurso = recurso.numRecurso
                    ) AS urls,
                    (
                        SELECT GROUP_CONCAT(DISTINCT recursoArchivo.archivo SEPARATOR '||')
                        FROM recursoArchivo
                        WHERE recursoArchivo.idCategoria = recurso.idCategoria
                          AND recursoArchivo.numRecurso = recurso.numRecurso
                    ) AS archivos,
                    (
                        SELECT GROUP_CONCAT(DISTINCT CONCAT(cicloFormativo.idCiclo, '::', cicloFormativo.nombre) SEPARATOR '||')
                        FROM cicloRecurso
                        INNER JOIN cicloFormativo ON cicloFormativo.idCiclo = cicloRecurso.idCiclo
                        WHERE cicloRecurso.idCategoria = recurso.idCategoria
                          AND cicloRecurso.numRecurso = recurso.numRecurso
                    ) AS ciclos
                FROM recurso
                INNER JOIN categoria ON categoria.idCategoria = recurso.idCategoria
                INNER JOIN cursoAcademico ON cursoAcademico.idCurso = recurso.idCurso
                WHERE recurso.idCategoria = :idCategoria
                ORDER BY recurso.fechaPublicacion DESC, recurso.idCategoria ASC, recurso.numRecurso ASC";

        return $this->consultarRecurso($sql, [':idCategoria' => (int)$idCategoria]);
    }

    // Recupera un unico recurso para su ficha de detalle.
    public function obtenerDetalle($idCategoria, $numRecurso) {
        $sql = "SELECT
                    recurso.*,
                    categoria.nombre AS categoriaNombre,
                    cursoAcademico.anioInicio,
                    cursoAcademico.anioFin,
                    (
                        SELECT GROUP_CONCAT(DISTINCT recursoUrl.url SEPARATOR '||')
                        FROM recursoUrl
                        WHERE recursoUrl.idCategoria = recurso.idCategoria
                          AND recursoUrl.numRecurso = recurso.numRecurso
                    ) AS urls,
                    (
                        SELECT GROUP_CONCAT(DISTINCT recursoArchivo.archivo SEPARATOR '||')
                        FROM recursoArchivo
                        WHERE recursoArchivo.idCategoria = recurso.idCategoria
                          AND recursoArchivo.numRecurso = recurso.numRecurso
                    ) AS archivos,
                    (
                        SELECT GROUP_CONCAT(DISTINCT CONCAT(cicloFormativo.idCiclo, '::', cicloFormativo.nombre) SEPARATOR '||')
                        FROM cicloRecurso
                        INNER JOIN cicloFormativo ON cicloFormativo.idCiclo = cicloRecurso.idCiclo
                        WHERE cicloRecurso.idCategoria = recurso.idCategoria
                          AND cicloRecurso.numRecurso = recurso.numRecurso
                    ) AS ciclos
                FROM recurso
                INNER JOIN categoria ON categoria.idCategoria = recurso.idCategoria
                INNER JOIN cursoAcademico ON cursoAcademico.idCurso = recurso.idCurso
                WHERE recurso.idCategoria = :idCategoria AND recurso.numRecurso = :numRecurso
                LIMIT 1";

        $recursos = $this->consultarRecurso($sql, [
            ':idCategoria' => (int)$idCategoria,
            ':numRecurso' => (int)$numRecurso
        ]);

        return !empty($recursos) ? $recursos[0] : null;
    }

    // Ejecuta la consulta de un recurso y devuelve la lista ya preparada.
    private function consultarRecurso($sql, $parametros = []) {
        $stmt = $this->db->prepare($sql);
        foreach ($parametros as $nombre => $valor) {
            $stmt->bindValue($nombre, $valor, PDO::PARAM_INT);
        }

        $stmt->execute();
        return $this->formatearRecursos($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // Convierte las filas SQL al formato que consume Angular.
    private function formatearRecursos($filas) {
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
                'urls' => $this->separarLista($fila['urls'] ?? ''),
                'archivos' => $this->separarLista($fila['archivos'] ?? ''),
                'ciclos' => $this->separarCiclos($fila['ciclos'] ?? ''),
                'enlacePrincipal' => $this->obtenerEnlacePrincipal($fila)
            ];
        }

        return $recursos;
    }

    // Convierte un texto con separador en un array.
    private function separarLista($valor) {
        if ($valor === '' || $valor === null) {
            return [];
        }

        $resultado = [];
        $partes = explode('||', $valor);

        foreach ($partes as $parte) {
            $parte = trim($parte);
            if ($parte !== '') {
                $resultado[] = $parte;
            }
        }

        return $resultado;
    }

    // Convierte el texto de ciclos en un array con id y nombre.
    private function separarCiclos($valor) {
        if ($valor === '' || $valor === null) {
            return [];
        }

        $resultado = [];
        $partes = explode('||', $valor);

        foreach ($partes as $parte) {
            $dato = explode('::', $parte, 2);
            if (count($dato) === 2) {
                $resultado[] = [
                    'idCiclo' => (int)$dato[0],
                    'nombre' => $dato[1]
                ];
            }
        }

        return $resultado;
    }

    // Elige un enlace o archivo para la vista previa.
    private function obtenerEnlacePrincipal($fila) {
        $urls = $this->separarLista($fila['urls'] ?? '');
        if (!empty($urls)) {
            return $urls[0];
        }

        $archivos = $this->separarLista($fila['archivos'] ?? '');
        if (!empty($archivos)) {
            return $archivos[0];
        }

        return '';
    }
}
?>
