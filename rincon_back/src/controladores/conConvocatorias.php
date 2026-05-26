<?php
require_once MODELO . 'modConvocatorias.php';

// Controlador para la gestion de convocatorias de reuniones.
class ConConvocatorias extends ControladorBase {
    private $modelo;

    public function __construct($db, $usuario = null) {
        parent::__construct($db, $usuario);
        $this->modelo = new ModConvocatorias($db);
    }

    // Devuelve los datos base para el formulario de convocatorias.
    public function formulario() {
        try {
            $datos = $this->modelo->obtenerFormulario();
            $this->responderJson($datos);
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar los datos del formulario.');
        }
    }

    // Crea o actualiza una convocatoria activa.
    public function guardar() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $this->responderError('Metodo no permitido.', 405);
            }

            $payload = json_decode(file_get_contents('php://input'), true);
            if (!is_array($payload)) {
                $this->responderError('El cuerpo JSON no es valido.');
            }

            $respuesta = $this->modelo->guardar($payload);
            $codigo = !empty($payload['idConvocatoria']) ? 200 : 201;
            $this->responderJson($respuesta, $codigo);
        } catch (InvalidArgumentException $e) {
            $this->responderError($e->getMessage());
        } catch (RuntimeException $e) {
            $this->responderError($e->getMessage(), 404);
        } catch (Exception $e) {
            $this->responderError('No se ha podido guardar la convocatoria.');
        }
    }

    // Lista solo las convocatorias activas.
    public function listarActivas() {
        try {
            $datos = $this->modelo->listarActivas();
            $this->responderJson($datos);
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar las convocatorias.');
        }
    }

    // Lista todas las convocatorias para la vista unificada del coordinador.
    public function listarTodas() {
        try {
            $datos = $this->modelo->listarTodas();
            $this->responderJson($datos);
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar las convocatorias.');
        }
    }

    // Lista borradores y convocatorias pasadas para el historico.
    public function listarHistoricas() {
        try {
            $datos = $this->modelo->listarHistoricas();
            $this->responderJson($datos);
        } catch (Exception $e) {
            $this->responderError('No se ha podido cargar el historico de convocatorias.');
        }
    }

    // Lista solo las convocatorias pasadas.
    public function listarPasadas() {
        try {
            $datos = $this->modelo->listarPasadas();
            $this->responderJson($datos);
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar las convocatorias pasadas.');
        }
    }

    // Devuelve el detalle de una convocatoria concreta.
    public function detalle() {
        try {
            if (!isset($_GET['id'])) {
                $this->responderError('Falta el parametro id.');
            }

            $idConvocatoria = (int)$_GET['id'];
            if ($idConvocatoria <= 0) {
                $this->responderError('El parametro id no es valido.');
            }

            $dato = $this->modelo->obtenerDetalle($idConvocatoria);
            if (!$dato) {
                $this->responderError('No se ha encontrado la convocatoria solicitada.', 404);
            }

            $this->responderJson($dato);
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar los detalles de la convocatoria.');
        }
    }

    // Marca una convocatoria activa concreta como pasada.
    public function marcarComoPasada() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $this->responderError('Metodo no permitido.', 405);
            }

            $payload = json_decode(file_get_contents('php://input'), true);
            $idConvocatoria = (int)($payload['idConvocatoria'] ?? 0);

            if ($idConvocatoria <= 0) {
                $this->responderError('El id de la convocatoria no es valido.');
            }

            $this->responderJson($this->modelo->marcarComoPasada($idConvocatoria));
        } catch (RuntimeException $e) {
            $this->responderError($e->getMessage(), 404);
        } catch (Exception $e) {
            $this->responderError('No se ha podido marcar la convocatoria como pasada.');
        }
    }

    // Marca todas las convocatorias activas como pasadas.
    public function marcarTodasComoPasadas() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $this->responderError('Metodo no permitido.', 405);
            }

            $this->responderJson($this->modelo->marcarTodasComoPasadas());
        } catch (Exception $e) {
            $this->responderError('No se han podido marcar las convocatorias como pasadas.');
        }
    }

    // Marca una convocatoria como pasada desde el formulario.
    public function cancelar() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $this->responderError('Metodo no permitido.', 405);
            }

            $payload = json_decode(file_get_contents('php://input'), true);
            $idConvocatoria = (int)($payload['idConvocatoria'] ?? 0);

            if ($idConvocatoria <= 0) {
                $this->responderError('El id de la convocatoria no es valido.');
            }

            $this->responderJson($this->modelo->cancelarConvocatoria($idConvocatoria));
        } catch (RuntimeException $e) {
            $this->responderError($e->getMessage(), 404);
        } catch (Exception $e) {
            $this->responderError('No se ha podido cancelar la convocatoria.');
        }
    }
}
?>
