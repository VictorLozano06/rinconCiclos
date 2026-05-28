<?php
// Clase base comun para todos los controladores JSON.
// Solo centraliza la salida correcta de datos y errores.
class ControladorBase {
    protected $db;
    protected $usuario;

    public function __construct($db, $usuario = null) {
        $this->db = $db;
        $this->usuario = $usuario;
    }

    // Devuelve datos en JSON y corta la ejecucion del controlador.
    protected function responderJson($datos, $codigo = 200) {
        if (!headers_sent()) {
            http_response_code($codigo);
        }

        header('Content-Type: application/json');
        echo json_encode($datos);
        exit;
    }

    // Devuelve un error en JSON con el codigo HTTP que toque.
    protected function responderError($mensaje, $codigo = 400) {
        $this->responderJson([
            'error' => $mensaje,
            'message' => $mensaje
        ], $codigo);
    }
}
?>
