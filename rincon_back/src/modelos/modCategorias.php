<?php
require_once __DIR__ . '/../configuracion/conexionBD.php';

// Modelo de categorias.
class ModCategorias extends ConexionBD {
    private $categoriasEspeciales = ['Convocatorias', 'Actas', 'BOCC'];

    public function __construct($db = null) {
        if ($db instanceof PDO) {
            $this->conexion = $db;
        } else {
            $this->conexion = $this->obtenerConexion();
        }
    }

    // Devuelve el arbol visible de categorias.
    // La categoria 1 es una raiz tecnica y no se pinta en Angular.
    public function listar() {
        $categorias = $this->obtenerCategoriasIndexadas();
        $arbol = [];

        foreach ($categorias as $id => &$categoria) {
            $idPadre = $categoria['idCategoriaPadre'];

            if ($id === 1) {
                continue;
            }

            if ($idPadre === 1) {
                $arbol[] = &$categoria;
                continue;
            }

            if (isset($categorias[$idPadre])) {
                $categorias[$idPadre]['subcategorias'][] = &$categoria;
            }
        }

        return $arbol;
    }

    // Crea una categoria nueva o actualiza una existente.
    public function guardar($json) {
        $datos = $this->normalizarDatos($json);

        if ($datos['idCategoria'] > 0) {
            $categoriaActual = $this->obtenerCategoriaPorId($datos['idCategoria']);
            if (!$categoriaActual) {
                throw new RuntimeException('La categoria indicada no existe.');
            }

            $this->comprobarQuePuedeGestionarse($categoriaActual);
            $this->actualizarCategoria($datos);

            return ['message' => 'Categoria actualizada correctamente.'];
        }

        $this->insertarCategoria($datos);
        return ['message' => 'Categoria creada correctamente.'];
    }

    // Borra una categoria, sus subcategorias y los recursos que cuelgan de ellas.
    public function eliminar($idCategoria) {
        $categoria = $this->obtenerCategoriaPorId($idCategoria);
        if (!$categoria) {
            throw new RuntimeException('La categoria indicada no existe.');
        }

        $this->comprobarQuePuedeGestionarse($categoria);

        $idsCategorias = $this->obtenerIdsCategoriaYDescendientes($idCategoria);
        $rutasArchivos = $this->obtenerRutasArchivosCategorias($idsCategorias);

        $this->conexion->beginTransaction();

        try {
            $this->borrarCiclosRecursosPorCategorias($idsCategorias);
            $this->borrarRecursosPorCategorias($idsCategorias);

            $sql = "DELETE FROM categoria WHERE idCategoria = :idCategoria";
            $stmt = $this->conexion->prepare($sql);
            $stmt->execute([':idCategoria' => $idCategoria]);

            $this->conexion->commit();
        } catch (Exception $e) {
            if ($this->conexion->inTransaction()) {
                $this->conexion->rollBack();
            }

            throw $e;
        }

        $this->borrarArchivosFisicos($rutasArchivos);

        return ['message' => 'Categoria eliminada correctamente.'];
    }

    // =========================
    // LECTURA BASE
    // =========================

    private function obtenerCategoriasIndexadas() {
        $sql = "SELECT idCategoria, nombre, predeterminada, idCategoriaPadre
                FROM categoria
                ORDER BY idCategoria";
        $stmt = $this->conexion->query($sql);
        $resultado = [];

        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $fila) {
            $id = (int)$fila['idCategoria'];

            $resultado[$id] = [
                'idCategoria' => $id,
                'nombre' => $fila['nombre'],
                'predeterminada' => (int)$fila['predeterminada'] === 1,
                'idCategoriaPadre' => $fila['idCategoriaPadre'] !== null ? (int)$fila['idCategoriaPadre'] : null,
                'subcategorias' => []
            ];
        }

        return $resultado;
    }

    private function obtenerCategoriaPorId($idCategoria) {
        $sql = "SELECT idCategoria, nombre, predeterminada, idCategoriaPadre
                FROM categoria
                WHERE idCategoria = :idCategoria";
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute([':idCategoria' => $idCategoria]);
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$fila) {
            return null;
        }

        return [
            'idCategoria' => (int)$fila['idCategoria'],
            'nombre' => $fila['nombre'],
            'predeterminada' => (int)$fila['predeterminada'] === 1,
            'idCategoriaPadre' => $fila['idCategoriaPadre'] !== null ? (int)$fila['idCategoriaPadre'] : null
        ];
    }

    // =========================
    // VALIDACION
    // =========================

    private function normalizarDatos($json) {
        if (!is_array($json)) {
            throw new InvalidArgumentException('El cuerpo JSON no es valido.');
        }

        $idCategoria = (int)($json['idCategoria'] ?? 0);
        $nombre = trim((string)($json['nombre'] ?? ''));
        $idCategoriaPadre = $json['idCategoriaPadre'] ?? null;

        if ($nombre === '') {
            throw new InvalidArgumentException('El nombre es obligatorio.');
        }

        if (strlen($nombre) > 150) {
            throw new InvalidArgumentException('El nombre no puede superar los 150 caracteres.');
        }

        // En la UI "sin categoria padre" significa categoria raiz visible.
        // En BD eso se guarda colgando de la raiz tecnica 1.
        if ($idCategoriaPadre === null || $idCategoriaPadre === '' || (int)$idCategoriaPadre === 0) {
            $idCategoriaPadre = 1;
        } else {
            $idCategoriaPadre = (int)$idCategoriaPadre;
        }

        if ($idCategoriaPadre <= 0) {
            throw new InvalidArgumentException('La categoria padre no es valida.');
        }

        if ($idCategoria > 0 && $idCategoriaPadre === $idCategoria) {
            throw new InvalidArgumentException('Una categoria no puede ser padre de si misma.');
        }

        // Solo dejamos colgar hijas de categorias raiz visibles.
        // O sea: categorias cuyo padre real es la raiz tecnica 1.
        if ($idCategoriaPadre !== 1) {
            $categoriaPadre = $this->obtenerCategoriaPorId($idCategoriaPadre);

            if (!$categoriaPadre) {
                throw new InvalidArgumentException('La categoria padre indicada no existe.');
            }

            if ((int)$categoriaPadre['idCategoriaPadre'] !== 1) {
                throw new InvalidArgumentException('La categoria padre tiene que ser una categoria raiz.');
            }
        }

        return [
            'idCategoria' => $idCategoria,
            'nombre' => $nombre,
            'idCategoriaPadre' => $idCategoriaPadre
        ];
    }

    private function comprobarQuePuedeGestionarse($categoria) {
        if ((int)$categoria['idCategoria'] === 1) {
            throw new InvalidArgumentException('La categoria raiz no se puede modificar.');
        }

        if (!empty($categoria['predeterminada'])) {
            throw new InvalidArgumentException('Las categorias predeterminadas no se pueden modificar.');
        }

        if (in_array($categoria['nombre'], $this->categoriasEspeciales, true)) {
            throw new InvalidArgumentException('Esta categoria esta bloqueada y no se puede modificar.');
        }
    }

    // =========================
    // ESCRITURA
    // =========================

    private function insertarCategoria($datos) {
        $sql = "INSERT INTO categoria (nombre, predeterminada, idCategoriaPadre)
                VALUES (:nombre, b'0', :idCategoriaPadre)";
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute([
            ':nombre' => $datos['nombre'],
            ':idCategoriaPadre' => $datos['idCategoriaPadre']
        ]);
    }

    private function actualizarCategoria($datos) {
        $sql = "UPDATE categoria
                SET nombre = :nombre,
                    idCategoriaPadre = :idCategoriaPadre
                WHERE idCategoria = :idCategoria";
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute([
            ':nombre' => $datos['nombre'],
            ':idCategoriaPadre' => $datos['idCategoriaPadre'],
            ':idCategoria' => $datos['idCategoria']
        ]);
    }

    // =========================
    // BORRADO DE CATEGORIAS
    // =========================

    private function obtenerIdsCategoriaYDescendientes($idCategoria) {
        $categorias = $this->obtenerCategoriasIndexadas();
        $ids = [$idCategoria];
        $pendientes = [$idCategoria];

        while (!empty($pendientes)) {
            $idActual = array_pop($pendientes);

            foreach ($categorias as $categoria) {
                if ((int)$categoria['idCategoriaPadre'] !== $idActual) {
                    continue;
                }

                $idHija = (int)$categoria['idCategoria'];
                if (in_array($idHija, $ids, true)) {
                    continue;
                }

                $ids[] = $idHija;
                $pendientes[] = $idHija;
            }
        }

        return $ids;
    }

    private function obtenerRutasArchivosCategorias($idsCategorias) {
        if (empty($idsCategorias)) {
            return [];
        }

        $marcas = implode(',', array_fill(0, count($idsCategorias), '?'));
        $sql = "SELECT archivo
                FROM recursoArchivo
                WHERE idCategoria IN ($marcas)";
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute($idsCategorias);

        $rutas = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $fila) {
            if (!empty($fila['archivo'])) {
                $rutas[] = $fila['archivo'];
            }
        }

        return $rutas;
    }

    private function borrarCiclosRecursosPorCategorias($idsCategorias) {
        if (empty($idsCategorias)) {
            return;
        }

        $marcas = implode(',', array_fill(0, count($idsCategorias), '?'));
        $sql = "DELETE FROM cicloRecurso WHERE idCategoria IN ($marcas)";
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute($idsCategorias);
    }

    private function borrarRecursosPorCategorias($idsCategorias) {
        if (empty($idsCategorias)) {
            return;
        }

        // recursoUrl y recursoArchivo caen por cascada desde recurso.
        $marcas = implode(',', array_fill(0, count($idsCategorias), '?'));
        $sql = "DELETE FROM recurso WHERE idCategoria IN ($marcas)";
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute($idsCategorias);
    }

    private function borrarArchivosFisicos($rutasPublicas) {
        foreach ($rutasPublicas as $rutaPublica) {
            $rutaFisica = $this->rutaFisicaDesdePublica($rutaPublica);

            if (is_file($rutaFisica)) {
                @unlink($rutaFisica);
            }
        }
    }

    private function rutaFisicaDesdePublica($rutaPublica) {
        $rutaPublica = trim((string)$rutaPublica);
        $rutaPublica = preg_replace('#^/api/uploads/#', '', $rutaPublica);
        $rutaPublica = preg_replace('#^/uploads/#', '', $rutaPublica);
        $rutaPublica = preg_replace('#^uploads/#', '', $rutaPublica);
        $rutaPublica = ltrim($rutaPublica, '/');

        return dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $rutaPublica);
    }
}
?>
