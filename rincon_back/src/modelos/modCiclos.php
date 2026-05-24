<?php
// Clase para CRUD de ciclos y cursos
class ModCiclos {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function listar() {
        $sql = "SELECT idCiclo, nombre, familia FROM cicloFormativo ORDER BY familia, nombre";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $filas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $ciclosAgrupados = [];

        foreach ($filas as $fila) {
            $fam = $fila['familia'];
            if (!isset($ciclosAgrupados[$fam])) {
                // Quitamos el '1' o '2' para deducir el nombre padre
                $nombreCiclo = preg_replace('/^[0-9]+[º°]?\s*/', '', $fila['nombre']);
                $ciclosAgrupados[$fam] = [
                    'idCiclo' => (int)$fila['idCiclo'],
                    'siglas'  => trim($nombreCiclo),
                    'familia' => $fam,
                    'cursos'  => []
                ];
            }
            $ciclosAgrupados[$fam]['cursos'][] = [
                'idCiclo' => (int)$fila['idCiclo'],
                'nombre'  => $fila['nombre'],
                'familia' => $fila['familia']
            ];
        }

        return array_values($ciclosAgrupados);
    }

    /**
     * Crea un ciclo formativo insertando automáticamente los cursos 1 y 2
     */
    public function crear($siglas, $familia) {
        $sqlCheck = "SELECT COUNT(*) FROM cicloFormativo WHERE familia = :familia";
        $stmtCheck = $this->db->prepare($sqlCheck);
        $stmtCheck->execute([':familia' => $familia]);
        if ($stmtCheck->fetchColumn() > 0) {
            return ["error" => "Ya existe un ciclo asociado a esta familia."];
        }

        $sql = "INSERT INTO cicloFormativo (nombre, familia) VALUES (:nombre, :familia)";
        $stmt = $this->db->prepare($sql);
        
        $curso1 = "1" . $siglas;
        $curso2 = "2" . $siglas;

        try {
            $this->db->beginTransaction();
            $stmt->execute([':nombre' => $curso1, ':familia' => $familia]);
            $stmt->execute([':nombre' => $curso2, ':familia' => $familia]);
            $this->db->commit();
            return ["success" => true, "mensaje" => "Ciclo y cursos creados con éxito."];
        } catch (Exception $e) {
            $this->db->rollBack();
            return ["error" => "Error al crear el ciclo: " . $e->getMessage()];
        }
    }



    /**
     * Modifica la familia de todos los cursos que componen un ciclo (CU 1.3)
     */
    public function editarCiclo($idCicloRepresentativo, $nuevaFamilia) {
        // Sacamos la familia antigua por el ID recibido
        $sqlGet = "SELECT familia FROM cicloFormativo WHERE idCiclo = :id";
        $stmtGet = $this->db->prepare($sqlGet);
        $stmtGet->execute([':id' => $idCicloRepresentativo]);
        $familiaAntigua = $stmtGet->fetchColumn();

        if (!$familiaAntigua) {
            return ["error" => "Ciclo no encontrado."];
        }

        $sqlUpdate = "UPDATE cicloFormativo SET familia = :nuevaFamilia WHERE familia = :familiaAntigua";
        $stmtUpdate = $this->db->prepare($sqlUpdate);
        try {
            $stmtUpdate->execute([
                ':nuevaFamilia' => $nuevaFamilia,
                ':familiaAntigua' => $familiaAntigua
            ]);
            return ["success" => true, "mensaje" => "Familia del ciclo actualizada correctamente."];
        } catch (Exception $e) {
            return ["error" => "Error al editar el ciclo: " . $e->getMessage()];
        }
    }

    /**
     * Modifica el nombre de un curso individual específico (CU 1.5)
     */
    public function editarCurso($idCurso, $nuevoNombre) {
        $sqlUpdate = "UPDATE cicloFormativo SET nombre = :nombre WHERE idCiclo = :id";
        $stmtUpdate = $this->db->prepare($sqlUpdate);
        try {
            $stmtUpdate->execute([
                ':nombre' => $nuevoNombre, 
                ':id' => $idCurso
            ]);
            return ["success" => true, "mensaje" => "Curso actualizado correctamente."];
        } catch (Exception $e) {
            return ["error" => "Error al editar el curso: " . $e->getMessage()];
        }
    }

    /**
     * Elimina todos los cursos pertenecientes a un ciclo, borrando el ciclo por completo (CU 1.4)
     */
    public function eliminarCiclo($idCicloRepresentativo) {
        $sqlGet = "SELECT familia FROM cicloFormativo WHERE idCiclo = :id";
        $stmtGet = $this->db->prepare($sqlGet);
        $stmtGet->execute([':id' => $idCicloRepresentativo]);
        $familia = $stmtGet->fetchColumn();

        if (!$familia) {
            return ["error" => "Ciclo no encontrado."];
        }

        $sqlDelete = "DELETE FROM cicloFormativo WHERE familia = :familia";
        $stmtDelete = $this->db->prepare($sqlDelete);
        try {
            $stmtDelete->execute([':familia' => $familia]);
            return ["success" => true, "mensaje" => "Ciclo y todos sus cursos eliminados."];
        } catch (Exception $e) {
            return ["error" => "Error al eliminar el ciclo: " . $e->getMessage()];
        }
    }

    /**
     * Elimina un curso individual específico (CU 1.6)
     */
    public function eliminarCurso($idCurso) {
        $sqlDelete = "DELETE FROM cicloFormativo WHERE idCiclo = :id";
        $stmtDelete = $this->db->prepare($sqlDelete);
        try {
            $stmtDelete->execute([':id' => $idCurso]);
            return ["success" => true, "mensaje" => "Curso eliminado correctamente."];
        } catch (Exception $e) {
            return ["error" => "Error al eliminar el curso: " . $e->getMessage()];
        }
    }
}
?>
