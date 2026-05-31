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
     * GET ?c=Actas&m=historialProfesor&idProfesor={id}
     */
    public function historialProfesor() {
        $idProfesor = $_GET['idProfesor'] ?? null;
        if (!$idProfesor) {
            http_response_code(400);
            return ["error" => "Parámetro 'idProfesor' es requerido."];
        }

        return $this->modelo->listarHistorialPorProfesor($idProfesor);
    }

    /**
     * GET ?c=Actas&m=pendiente
     */
    public function pendiente() {
        $convocatoria = $this->modelo->obtenerConvocatoriaPendiente();
        if (!$convocatoria) {
            http_response_code(404);
            return ["error" => "No hay convocatorias pendientes de asistencia."];
        }
        return $convocatoria;
    }

    /**
     * GET ?c=Actas&m=pendienteRedaccion
     */
    public function pendienteRedaccion() {
        $convocatoria = $this->modelo->obtenerConvocatoriaPendienteRedaccion();
        if (!$convocatoria) {
            http_response_code(404);
            return ["error" => "No hay borradores pendientes de redacción."];
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

    /**
     * POST ?c=Actas&m=crearBorrador
     */
    public function crearBorrador() {
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

        $resultado = $this->modelo->guardarAsistenciaYCrearBorrador($datos);

        if (!$resultado['exito']) {
            http_response_code(500);
            return ["error" => "Error al crear el borrador: " . $resultado['error']];
        }

        return ["mensaje" => "Borrador de acta creado correctamente", "idActa" => $resultado['idActa']];
    }
}
?>
