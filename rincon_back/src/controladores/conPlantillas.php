<?php
require_once MODELO . 'modPlantillas.php';

class ConPlantillas extends ControladorBase {
    private $modelo;

    public function __construct($db) {
        // ControladorBase suele requerir la conexión a BD, se la pasamos aunque este módulo no la use
        parent::__construct($db);
        $this->modelo = new ModPlantillas();
    }

    /**
     * GET ?c=Plantillas&m=listar
     */
    public function listar() {
        return $this->modelo->listar();
    }

    /**
     * POST ?c=Plantillas&m=crear
     */
    public function crear() {
        $datos = json_decode(file_get_contents("php://input"), true);
        
        $nombre = $datos['nombre'] ?? '';
        $descripcion = $datos['descripcion'] ?? '';
        $bloques = $datos['bloques'] ?? [];

        if (empty(trim($nombre))) {
            http_response_code(400);
            return ["error" => "El nombre de la plantilla es obligatorio."];
        }

        if (empty($bloques) || !is_array($bloques)) {
            http_response_code(400);
            return ["error" => "Debe seleccionar al menos un bloque para la plantilla."];
        }

        $resultado = $this->modelo->crear($nombre, $descripcion, $bloques);
        
        if (isset($resultado['error'])) {
            http_response_code(400);
        }
        return $resultado;
    }

    /**
     * PUT ?c=Plantillas&m=editar
     */
    public function editar() {
        $datos = json_decode(file_get_contents("php://input"), true);
        
        $id = $datos['id'] ?? null;
        $nombre = $datos['nombre'] ?? '';
        $descripcion = $datos['descripcion'] ?? '';
        $bloques = $datos['bloques'] ?? [];

        if (!$id || empty(trim($nombre)) || empty($bloques)) {
            http_response_code(400);
            return ["error" => "Datos incompletos para editar la plantilla."];
        }

        $resultado = $this->modelo->editar($id, $nombre, $descripcion, $bloques);
        
        if (isset($resultado['error'])) {
            http_response_code(400);
        }
        return $resultado;
    }

    /**
     * DELETE ?c=Plantillas&m=eliminar&id={id}
     */
    public function eliminar() {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            return ["error" => "ID de plantilla no proporcionado."];
        }

        return $this->modelo->eliminar($id);
    }
}
?>
