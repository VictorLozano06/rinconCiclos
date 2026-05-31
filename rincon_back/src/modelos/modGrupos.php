<?php
/**
 * Modelo de acceso a datos y reglas de negocio para los Grupos.
 *
 * Gestiona las operaciones CRUD sobre la tabla 'grupo' y su correspondencia 
 * obligatoria en la tabla 'participantes'.
 */
class ModGrupos {
    /**
     * @var PDO Conexión a la base de datos
     */
    private $db;

    /**
     * Constructor del modelo de grupos.
     *
     * @param PDO $base_datos Instancia de la base de datos principal
     */
    public function __construct($base_datos) {
        $this->db = $base_datos;
    }

    /**
     * Lista todos los grupos ordenados alfabéticamente.
     *
     * @return array Lista asociativa con id y nombre de los grupos
     */
    public function listarGrupos() {
        $sql = "SELECT p.idParticipante AS id, p.nombre 
                FROM grupo g 
                JOIN participantes p ON g.idGrupo = p.idParticipante 
                ORDER BY p.nombre ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Crea un nuevo grupo insertándolo también como participante.
     *
     * @param string $nombre Nombre del grupo a crear
     * @return array Diccionario con "success" (bool) y el "id" insertado en caso de éxito, o un mensaje de error
     */
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

    /**
     * Modifica el nombre de un grupo existente.
     *
     * @param int $id Identificador del grupo (idParticipante)
     * @param string $nombre Nuevo nombre del grupo
     * @return array Diccionario con "success" (bool)
     */
    public function editarGrupo($id, $nombre) {
        $sql = "UPDATE participantes SET nombre = :nombre WHERE idParticipante = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':nombre' => $nombre, ':id' => $id]);
        return ["success" => true];
    }

    /**
     * Elimina un grupo y su registro en la tabla participantes.
     *
     * @param int $id Identificador del grupo (idParticipante)
     * @return array Diccionario con "success" (bool)
     */
    public function eliminarGrupo($id) {
        // Asumiendo ON DELETE CASCADE de participantes a grupo
        $sql = "DELETE FROM participantes WHERE idParticipante = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        return ["success" => true];
    }
}
?>
