<?php
class ModCiclos {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // Devuelve todos los registros de cicloFormativo
    public function listar() {
        $sql = "SELECT idCiclo, nombre, familia FROM cicloFormativo ORDER BY nombre ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // El usuario escribe "DAW" → se guardan "1DAW" y "2DAW" en la misma tabla
    public function crear($nombre, $familia) {
        $this->db->beginTransaction();
        try {
            $sql = "INSERT INTO cicloFormativo (nombre, familia) VALUES (:nombre, :familia)";
            $stmt = $this->db->prepare($sql);

            $stmt->execute([':nombre' => '1' . $nombre, ':familia' => $familia]);
            $stmt->execute([':nombre' => '2' . $nombre, ':familia' => $familia]);

            $this->db->commit();
            return ['success' => true, 'message' => 'Cursos 1' . $nombre . ' y 2' . $nombre . ' creados correctamente.'];
        } catch (Exception $e) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            throw $e;
        }
    }

    // Editar un registro concreto (curso o ciclo) por su ID
    public function editar($idCiclo, $nombre, $familia) {
        $sql = "UPDATE cicloFormativo SET nombre = :nombre, familia = :familia WHERE idCiclo = :idCiclo";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':nombre' => $nombre, ':familia' => $familia, ':idCiclo' => $idCiclo]);
        return ['success' => true, 'message' => 'Registro actualizado correctamente.'];
    }

    // Elimina un registro por ID
    public function eliminar($idCiclo) {
        $sql = "DELETE FROM cicloFormativo WHERE idCiclo = :idCiclo";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':idCiclo' => $idCiclo]);
        return ['success' => true, 'message' => 'Registro eliminado correctamente.'];
    }
}
?>
