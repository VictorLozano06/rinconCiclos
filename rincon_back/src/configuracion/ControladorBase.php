<?php
// Clase controladora base que centraliza las respuestas JSON y traduce errores comunes de la base de datos
class ControladorBase {
    protected $db;
    protected $usuario;

    public function __construct($db, $usuario = null) {
        $this->db = $db;
        $this->usuario = $usuario;
    }

    // Envía respuestas con código HTTP de éxito y cabeceras JSON
    protected function enviarRespuesta($datos, $codigo = 200) {
        if (!headers_sent()) {
            http_response_code($codigo);
        }
        header('Content-Type: application/json');
        echo json_encode($datos);
        exit;
    }

    // Traduce errores del motor de base de datos a explicaciones claras en español
    protected function enviarError($error, $codigo = 400) {
        $mensaje = $error;

        if ($error instanceof Exception) {
            $mensajeSQL = $error->getMessage();
            $codigo = 500;

            // Traducimos códigos de error nativos de MySQL a castellano legible
            if (strpos($mensajeSQL, '1062') !== false || $error->getCode() == 23000) {
                $codigo = 400;
                $mensaje = "Ya existe un registro con estos datos únicos.";
            } else if (strpos($mensajeSQL, '1451') !== false) {
                $codigo = 400;
                $mensaje = "No se puede eliminar este registro porque tiene otros datos vinculados.";
            } else if (strpos($mensajeSQL, '1452') !== false) {
                $codigo = 400;
                $mensaje = "El registro seleccionado no es válido.";
            } else {
                $mensaje = "Error interno en la base de datos: " . $mensajeSQL;
            }
        }

        $this->enviarRespuesta([
            "error" => $mensaje,
            "message" => $mensaje
        ], $codigo);
    }
}
?>
