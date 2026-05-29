<?php
require_once __DIR__ . '/../configuracion/conexionBD.php';

// Modelo de lugares.
class ModLugares extends ConexionBD {
    public function __construct($db = null) {
        if ($db instanceof PDO) {
            $this->conexion = $db;
        } else {
            $this->conexion = $this->obtenerConexion();
        }
    }

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

    private function insertarLugar($datos) {
        $sql = "INSERT INTO lugar (nombre) VALUES (:nombre)";
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute([':nombre' => $datos['nombre']]);
    }

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
