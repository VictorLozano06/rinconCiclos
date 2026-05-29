<?php
class ModGrupos {
    private $db;

    public function __construct($base_datos) {
        $this->db = $base_datos;
    }

    public function listarGrupos() {
        $sql = "SELECT p.idParticipante AS id, p.nombre 
                FROM grupo g 
                JOIN participantes p ON g.idGrupo = p.idParticipante 
                ORDER BY p.nombre ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function crearGrupo($nombre) {
        try {
            $this->db->beginTransaction();

            $sqlParticipante = "INSERT INTO participantes (nombre) VALUES (:nombre)";
            $stmtParticipante = $this->db->prepare($sqlParticipante);
            $stmtParticipante->execute([':nombre' => $nombre]);
            
            $id = $this->db->lastInsertId();

            $sqlGrupo = "INSERT INTO grupo (idGrupo) VALUES (:id)";
            $stmtGrupo = $this->db->prepare($sqlGrupo);
            $stmtGrupo->execute([':id' => $id]);

            $this->db->commit();
            return ["success" => true, "id" => $id, "nombre" => $nombre];
        } catch (Exception $e) {
            $this->db->rollBack();
            return ["error" => "Error al crear el grupo: " . $e->getMessage()];
        }
    }

    public function editarGrupo($id, $nombre) {
        $sql = "UPDATE participantes SET nombre = :nombre WHERE idParticipante = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':nombre' => $nombre, ':id' => $id]);
        return ["success" => true];
    }

    public function eliminarGrupo($id) {
        // Asumiendo ON DELETE CASCADE de participantes a grupo
        $sql = "DELETE FROM participantes WHERE idParticipante = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        return ["success" => true];
    }
}
?>
