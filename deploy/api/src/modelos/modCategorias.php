<?php
require_once __DIR__ . '/../configuracion/conexionBD.php';

/**
 * Modelo de acceso a datos y reglas de negocio de categorías.
 *
 * Gestiona tanto el árbol visible de categorías como las operaciones de alta,
 * edición y borrado. También protege las categorías especiales y se encarga
 * de limpiar los recursos asociados antes de borrar ramas del árbol.
 */
class ModCategorias extends ConexionBD {
    /**
     * Nombres de categorías especiales que la aplicación no permite gestionar.
     *
     * @var array<int,string>
     */
    private $categoriasEspeciales = ['Convocatorias', 'Actas', 'BOCC'];

    /**
     * Inicializa el modelo usando la conexión compartida o una nueva.
     *
     * @param PDO|null $db Conexión PDO opcional compartida por el controlador.
     */
    public function __construct($db = null) {
        if ($db instanceof PDO) {
            $this->conexion = $db;
        } else {
            $this->conexion = $this->obtenerConexion();
        }
    }

    /**
     * Devuelve el árbol visible de categorías para Angular.
     *
     * La categoría `RAIZ` existe en base de datos solo como apoyo técnico para
     * colgar el primer nivel. El frontend no la pinta, así que aquí se omite y
     * se devuelven directamente sus hijas como raíces visibles.
     *
     * @return array<int,array<string,mixed>>
     */
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

    /**
     * Crea una categoría nueva o actualiza una ya existente.
     *
     * @param array<string,mixed> $json
     *
     * @return array<string,string>
     */
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

    /**
     * Elimina una categoría editable junto a sus recursos colgados.
     *
     * Antes de borrar la rama de categorías se limpian:
     * - relaciones en `cicloRecurso`
     * - recursos principales
     * - archivos físicos asociados
     *
     * @param int $idCategoria
     *
     * @return array<string,string>
     */
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

    /**
     * Lee todas las categorías y las deja indexadas por id.
     *
     * Esta estructura es la base para:
     * - construir el árbol
     * - buscar una categoría concreta
     * - recorrer descendientes en cascada
     *
     * @return array<int,array<string,mixed>>
     */
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

    /**
     * Recupera una categoría concreta por id.
     *
     * @param int $idCategoria
     *
     * @return array<string,mixed>|null
     */
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

    /**
     * Valida y limpia los datos básicos del formulario de categorías.
     *
     * En la interfaz, "sin categoría padre" significa crear una raíz visible.
     * En base de datos eso no se guarda como `NULL`, sino colgando de la raíz
     * técnica `1`.
     *
     * @param mixed $json
     *
     * @return array<string,int|string>
     */
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

    /**
     * Comprueba si una categoría puede gestionarse desde el CRUD.
     *
     * Bloquea:
     * - la raíz técnica
     * - las predeterminadas
     * - las categorías especiales
     *
     * @param array<string,mixed> $categoria
     *
     * @return void
     */
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

    /**
     * Inserta una categoría nueva siempre como no predeterminada.
     *
     * @param array<string,int|string> $datos
     *
     * @return void
     */
    private function insertarCategoria($datos) {
        $sql = "INSERT INTO categoria (nombre, predeterminada, idCategoriaPadre)
                VALUES (:nombre, b'0', :idCategoriaPadre)";
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute([
            ':nombre' => $datos['nombre'],
            ':idCategoriaPadre' => $datos['idCategoriaPadre']
        ]);
    }

    /**
     * Actualiza nombre y padre de una categoría editable.
     *
     * @param array<string,int|string> $datos
     *
     * @return void
     */
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

    /**
     * Devuelve la categoría pedida y todas sus hijas recursivamente.
     *
     * @param int $idCategoria
     *
     * @return array<int,int>
     */
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

    /**
     * Recupera las rutas públicas de todos los archivos de una rama.
     *
     * Se necesitan para borrar después los ficheros físicos del disco.
     *
     * @param array<int,int> $idsCategorias
     *
     * @return array<int,string>
     */
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

    /**
     * Limpia la tabla intermedia `cicloRecurso` antes de borrar recursos.
     *
     * @param array<int,int> $idsCategorias
     *
     * @return void
     */
    private function borrarCiclosRecursosPorCategorias($idsCategorias) {
        if (empty($idsCategorias)) {
            return;
        }

        $marcas = implode(',', array_fill(0, count($idsCategorias), '?'));
        $sql = "DELETE FROM cicloRecurso WHERE idCategoria IN ($marcas)";
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute($idsCategorias);
    }

    /**
     * Borra los recursos principales de las categorías indicadas.
     *
     * `recursoUrl` y `recursoArchivo` caen por cascada desde la FK de
     * `recurso`, así que no hace falta borrarlos a mano aquí.
     *
     * @param array<int,int> $idsCategorias
     *
     * @return void
     */
    private function borrarRecursosPorCategorias($idsCategorias) {
        if (empty($idsCategorias)) {
            return;
        }

        $marcas = implode(',', array_fill(0, count($idsCategorias), '?'));
        $sql = "DELETE FROM recurso WHERE idCategoria IN ($marcas)";
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute($idsCategorias);
    }

    /**
     * Borra del disco los ficheros asociados a una rama de categorías.
     *
     * @param array<int,string> $rutasPublicas
     *
     * @return void
     */
    private function borrarArchivosFisicos($rutasPublicas) {
        foreach ($rutasPublicas as $rutaPublica) {
            $rutaFisica = $this->rutaFisicaDesdePublica($rutaPublica);

            if (is_file($rutaFisica)) {
                @unlink($rutaFisica);
            }
        }
    }

    /**
     * Convierte una ruta pública `/api/uploads/...` a su ruta física real.
     *
     * @param string $rutaPublica
     *
     * @return string
     */
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
