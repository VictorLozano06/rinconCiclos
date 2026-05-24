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
}
?>
