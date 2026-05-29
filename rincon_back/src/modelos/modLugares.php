<?php
require_once __DIR__ . '/../configuracion/conexionBD.php';

/**
 * Modelo de acceso a datos y validación de lugares.
 *
 * Centraliza las operaciones CRUD simples sobre la tabla `lugar`. No necesita
 * estructuras complejas porque un lugar es una entidad plana con solo dos
 * campos relevantes para la aplicación: identificador y nombre.
 */
class ModLugares extends ConexionBD {
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
     * Devuelve todos los lugares ordenados por nombre.
     *
     * @return array<int,array<string,int|string>>
     */
    public function listar() {
        $sql = "SELECT idLugar, nombre
                FROM lugar
                ORDER BY nombre ASC, idLugar ASC";
        $stmt = $this->conexion->query($sql);
        $resultado = [];

        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $fila) {
            $resultado[] = [
                'idLugar' => (int)$fila['idLugar'],
                'nombre' => $fila['nombre']
            ];
        }

        return $resultado;
    }

    /**
     * Crea un lugar nuevo o actualiza uno ya existente.
     *
     * @param array<string,mixed> $json
     *
     * @return array<string,string>
     */
    public function guardar($json) {
        $datos = $this->normalizarDatos($json);

        if ($datos['idLugar'] > 0) {
            if (!$this->obtenerLugarPorId($datos['idLugar'])) {
                throw new RuntimeException('El lugar indicado no existe.');
            }

            $this->actualizarLugar($datos);
            return ['message' => 'Lugar actualizado correctamente.'];
        }

        $this->insertarLugar($datos);
        return ['message' => 'Lugar creado correctamente.'];
    }

    /**
     * Elimina un lugar si la base de datos permite el borrado.
     *
     * Si el lugar está referenciado por convocatorias u órdenes del día, la FK
     * de MySQL rechazará el DELETE y se traduce a un mensaje legible.
     *
     * @param int $idLugar
     *
     * @return array<string,string>
     */
    public function eliminar($idLugar) {
        if (!$this->obtenerLugarPorId($idLugar)) {
            throw new RuntimeException('El lugar indicado no existe.');
        }

        try {
            $sql = "DELETE FROM lugar WHERE idLugar = :idLugar";
            $stmt = $this->conexion->prepare($sql);
            $stmt->execute([':idLugar' => $idLugar]);
        } catch (PDOException $e) {
            throw new InvalidArgumentException('No se puede borrar este lugar porque esta siendo usado en convocatorias u ordenes del dia.');
        }

        return ['message' => 'Lugar eliminado correctamente.'];
    }

    /**
     * Valida y limpia los datos básicos del formulario.
     *
     * @param mixed $json
     *
     * @return array<string,int|string>
     */
    private function normalizarDatos($json) {
        if (!is_array($json)) {
            throw new InvalidArgumentException('El cuerpo JSON no es valido.');
        }

        $idLugar = (int)($json['idLugar'] ?? 0);
        $nombre = trim((string)($json['nombre'] ?? ''));

        if ($nombre === '') {
            throw new InvalidArgumentException('El nombre es obligatorio.');
        }

        if (strlen($nombre) > 150) {
            throw new InvalidArgumentException('El nombre no puede superar los 150 caracteres.');
        }

        return [
            'idLugar' => $idLugar,
            'nombre' => $nombre
        ];
    }

    /**
     * Recupera un lugar por su clave primaria.
     *
     * @param int $idLugar
     *
     * @return array<string,int|string>|null
     */
    private function obtenerLugarPorId($idLugar) {
        $sql = "SELECT idLugar, nombre FROM lugar WHERE idLugar = :idLugar";
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute([':idLugar' => $idLugar]);
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$fila) {
            return null;
        }

        return [
            'idLugar' => (int)$fila['idLugar'],
            'nombre' => $fila['nombre']
        ];
    }

    /**
     * Inserta una fila nueva en la tabla `lugar`.
     *
     * @param array<string,int|string> $datos
     *
     * @return void
     */
    private function insertarLugar($datos) {
        $sql = "INSERT INTO lugar (nombre) VALUES (:nombre)";
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute([':nombre' => $datos['nombre']]);
    }

    /**
     * Actualiza el nombre de un lugar existente.
     *
     * @param array<string,int|string> $datos
     *
     * @return void
     */
    private function actualizarLugar($datos) {
        $sql = "UPDATE lugar SET nombre = :nombre WHERE idLugar = :idLugar";
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute([
            ':nombre' => $datos['nombre'],
            ':idLugar' => $datos['idLugar']
        ]);
    }
}
?>
