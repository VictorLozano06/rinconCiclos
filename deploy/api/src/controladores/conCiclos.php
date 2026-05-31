<?php
require_once MODELO . 'modCiclos.php';

class ConCiclos extends ControladorBase {
    private $modelo;

    public function __construct($db) {
        parent::__construct($db);
        $this->modelo = new ModCiclos($this->db);
    }

    /**
     * GET ?c=Ciclos&m=listar
     */
    public function listar() {
        return $this->modelo->listar();
    }

    /**
     * POST ?c=Ciclos&m=crear
     */
    public function crear() {
        $datos = json_decode(file_get_contents("php://input"), true);
        
        if (empty($datos['nombre']) || empty($datos['familia'])) {
            http_response_code(400);
            return ["error" => "Faltan campos obligatorios para crear el ciclo (nombre o familia)."];
        }

        $resultado = $this->modelo->crear($datos['nombre'], $datos['familia']);
        
        if (isset($resultado['error'])) {
            http_response_code(409); // Conflict, e.g. duplicate family
        } else {
            http_response_code(201); // Created
        }
        
        return $resultado;
    }

    /**
     * PUT ?c=Ciclos&m=editar
     */
    public function editar() {
        $datos = json_decode(file_get_contents("php://input"), true);
        
        if (empty($datos['idCiclo']) || empty($datos['familia'])) {
            http_response_code(400);
            return ["error" => "Faltan campos obligatorios para editar el ciclo (idCiclo o familia)."];
        }

        $resultado = $this->modelo->editarCiclo($datos['idCiclo'], $datos['familia']);
        if (isset($resultado['error'])) {
            http_response_code(404); 
        }
        return $resultado;
    }

    /**
     * DELETE ?c=Ciclos&m=eliminar
     */
    public function eliminar() {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            return ["error" => "ID de ciclo no proporcionado."];
        }

        $resultado = $this->modelo->eliminarCiclo($id);
        if (isset($resultado['error'])) {
            http_response_code(404);
        }
        return $resultado;
    }

}
?>
