<?php
require_once MODELO . 'modActas.php';

class ConActas extends ControladorBase {
    private $modelo;

    public function __construct($db) {
        parent::__construct($db);
        $this->modelo = new ModActas($this->db);
    }

    /**
     * GET ?c=Actas&m=anios
     */
    public function anios() {
        return $this->modelo->obtenerAniosConActas();
    }

    /**
     * GET ?c=Actas&m=historial&anio={anio}
     */
    public function historial() {
        $anio = $_GET['anio'] ?? null;
        if (!$anio) {
            http_response_code(400);
            return ["error" => "Parámetro 'anio' es requerido."];
        }

        return $this->modelo->listarHistorialPorAnio($anio);
    }

    /**
     * GET ?c=Actas&m=pendiente
     */
    public function pendiente() {
        $convocatoria = $this->modelo->obtenerConvocatoriaPendiente();
        if (!$convocatoria) {
            http_response_code(404);
            return ["error" => "No hay convocatorias pendientes."];
        }
        return $convocatoria;
    }

    /**
     * POST ?c=Actas&m=guardar
     */
    public function guardar() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            return ["error" => "Método no permitido. Use POST."];
        }

        $json = file_get_contents('php://input');
        $datos = json_decode($json, true);

        if (!$datos || !isset($datos['idConvocatoria'])) {
            http_response_code(400);
            return ["error" => "Datos inválidos o falta idConvocatoria."];
        }

        $resultado = $this->modelo->guardarActaDefinitiva($datos);

        if (!$resultado['exito']) {
            http_response_code(500);
            return ["error" => "Error al guardar el acta: " . $resultado['error']];
        }

        return ["mensaje" => "Acta guardada correctamente", "idActa" => $resultado['idActa']];
    }
}
?>
