<?php
// Clase base para devolver mensajes JSON simples desde los controladores.
class ControladorBase {
    protected $db;
    protected $usuario;

    public function __construct($db, $usuario = null) {
        $this->db = $db;
        $this->usuario = $usuario;
    }

    // Devuelve cualquier respuesta en JSON.
    protected function enviarMensajes($datos, $codigo = 200) {
        if (!headers_sent()) {
            http_response_code($codigo);
        }

        header('Content-Type: application/json');
        echo json_encode($datos);
        exit;
    }

    // Devuelve un mensaje de error en JSON.
    protected function montarMensajes($mensaje, $codigo = 400) {
        $this->enviarMensajes([
            'error' => $mensaje,
            'message' => $mensaje
        ], $codigo);
    }
}
?>
