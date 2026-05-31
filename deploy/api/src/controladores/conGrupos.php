<?php
require_once MODELO . 'modGrupos.php';

class ConGrupos extends ControladorBase {
    private $modelo;

    public function __construct($base_datos) {
        parent::__construct($base_datos);
        $this->modelo = new ModGrupos($base_datos);
    }

    public function listar() {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            http_response_code(405);
            return ["error" => "Método no permitido. Use GET."];
        }
        return $this->modelo->listarGrupos();
    }

    public function crear() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            return ["error" => "Método no permitido. Use POST."];
        }
        $datos = json_decode(file_get_contents("php://input"), true);
        if (!isset($datos['nombre']) || trim($datos['nombre']) === '') {
            http_response_code(400);
            return ["error" => "El nombre del grupo es obligatorio."];
        }
        return $this->modelo->crearGrupo(trim($datos['nombre']));
    }

    public function editar() {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            http_response_code(405);
            return ["error" => "Método no permitido. Use PUT."];
        }
        $datos = json_decode(file_get_contents("php://input"), true);
        if (!isset($datos['id']) || !isset($datos['nombre']) || trim($datos['nombre']) === '') {
            http_response_code(400);
            return ["error" => "ID y nombre son obligatorios."];
        }
        return $this->modelo->editarGrupo($datos['id'], trim($datos['nombre']));
    }

    public function eliminar() {
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            http_response_code(405);
            return ["error" => "Método no permitido. Use DELETE."];
        }
        $datos = json_decode(file_get_contents("php://input"), true);
        if (!isset($datos['id'])) {
            http_response_code(400);
            return ["error" => "El ID es obligatorio para eliminar."];
        }
        return $this->modelo->eliminarGrupo($datos['id']);
    }
}
?>
