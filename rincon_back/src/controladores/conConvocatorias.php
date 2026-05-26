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
            $this->enviarMensajes($this->modelo->obtenerFormulario());
        } catch (Exception $e) {
            $this->montarMensajes('No se han podido cargar los datos del formulario.');
        }
    }

    // Crea o actualiza una convocatoria activa.
    public function guardar() {
        try {
            $this->asegurarMetodo('POST');
            $payload = $this->leerPayloadJson();

            $respuesta = $this->modelo->guardar($payload);
            $codigo = !empty($payload['idConvocatoria']) ? 200 : 201;
            $this->enviarMensajes($respuesta, $codigo);
        } catch (InvalidArgumentException $e) {
            $this->montarMensajes($e->getMessage());
        } catch (RuntimeException $e) {
            $this->montarMensajes($e->getMessage(), 404);
        } catch (Exception $e) {
            $this->montarMensajes('No se ha podido guardar la convocatoria.');
        }
    }

    // Lista solo las convocatorias activas.
    public function listarActivas() {
        try {
            $this->enviarMensajes($this->modelo->listarActivas());
        } catch (Exception $e) {
            $this->montarMensajes('No se han podido cargar las convocatorias.');
        }
    }

    // Lista todas las convocatorias para la vista unificada del coordinador.
    public function listarTodas() {
        try {
            $this->enviarMensajes($this->modelo->listarTodas());
        } catch (Exception $e) {
            $this->montarMensajes('No se han podido cargar las convocatorias.');
        }
    }

    // Lista borradores y convocatorias pasadas para el historico.
    public function listarHistoricas() {
        try {
            $this->enviarMensajes($this->modelo->listarHistoricas());
        } catch (Exception $e) {
            $this->montarMensajes('No se ha podido cargar el historico de convocatorias.');
        }
    }

    // Lista solo las convocatorias pasadas.
    public function listarPasadas() {
        try {
            $this->enviarMensajes($this->modelo->listarPasadas());
        } catch (Exception $e) {
            $this->montarMensajes('No se han podido cargar las convocatorias pasadas.');
        }
    }

    // Devuelve el detalle de una convocatoria concreta.
    public function detalle() {
        try {
            $idConvocatoria = $this->leerEnteroQuery('id');

            $dato = $this->modelo->obtenerDetalle($idConvocatoria);
            if (!$dato) {
                $this->montarMensajes('No se ha encontrado la convocatoria solicitada.', 404);
            }

            $this->enviarMensajes($dato);
        } catch (Exception $e) {
            $this->montarMensajes('No se han podido cargar los detalles de la convocatoria.');
        }
    }

    // Marca una convocatoria activa concreta como pasada.
    public function marcarComoPasada() {
        try {
            $this->asegurarMetodo('POST');
            $idConvocatoria = $this->leerEnteroPayload('idConvocatoria');

            $this->enviarMensajes($this->modelo->marcarComoPasada($idConvocatoria));
        } catch (RuntimeException $e) {
            $this->montarMensajes($e->getMessage(), 404);
        } catch (Exception $e) {
            $this->montarMensajes('No se ha podido marcar la convocatoria como pasada.');
        }
    }

    // Marca todas las convocatorias activas como pasadas.
    public function marcarTodasComoPasadas() {
        try {
            $this->asegurarMetodo('POST');

            $this->enviarMensajes($this->modelo->marcarTodasComoPasadas());
        } catch (Exception $e) {
            $this->montarMensajes('No se han podido marcar las convocatorias como pasadas.');
        }
    }

    // Marca una convocatoria como pasada desde el formulario.
    public function cancelar() {
        try {
            $this->asegurarMetodo('POST');
            $idConvocatoria = $this->leerEnteroPayload('idConvocatoria');

            $this->enviarMensajes($this->modelo->cancelarConvocatoria($idConvocatoria));
        } catch (RuntimeException $e) {
            $this->montarMensajes($e->getMessage(), 404);
        } catch (Exception $e) {
            $this->montarMensajes('No se ha podido cancelar la convocatoria.');
        }
    }

    private function asegurarMetodo($metodoEsperado) {
        $metodoActual = strtoupper($_SERVER['REQUEST_METHOD'] ?? '');
        if ($metodoActual !== strtoupper($metodoEsperado)) {
            $this->montarMensajes('Metodo no permitido.', 405);
        }
    }

    private function leerPayloadJson() {
        $payload = json_decode(file_get_contents('php://input'), true);
        if (!is_array($payload)) {
            $this->montarMensajes('El cuerpo JSON no es valido.');
        }

        return $payload;
    }

    private function leerEnteroQuery($nombre) {
        if (!isset($_GET[$nombre])) {
            $this->montarMensajes('Falta el parametro ' . $nombre . '.');
        }

        $valor = (int)$_GET[$nombre];
        if ($valor <= 0) {
            $this->montarMensajes('El parametro ' . $nombre . ' no es valido.');
        }

        return $valor;
    }

    private function leerEnteroPayload($nombre) {
        $payload = $this->leerPayloadJson();
        $valor = (int)($payload[$nombre] ?? 0);

        if ($valor <= 0) {
            $this->montarMensajes('El parametro ' . $nombre . ' no es valido.');
        }

        return $valor;
    }
}
?>
