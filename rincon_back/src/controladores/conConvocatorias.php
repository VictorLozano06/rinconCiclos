<?php
require_once MODELO . 'modConvocatorias.php';

class ConConvocatorias extends ControladorBase {
    private $modelo;

    public function __construct($db, $usuario = null) {
        parent::__construct($db, $usuario);
        $this->modelo = new ModConvocatorias($db);
    }

    public function formulario() {
        try {
            $this->enviarMensajes($this->modelo->obtenerFormulario());
        } catch (Exception $e) {
            $this->montarMensajes('No se han podido cargar los datos del formulario.');
        }
    }

    public function guardar() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $this->montarMensajes('Metodo no permitido.', 405);
            }

            $payload = json_decode(file_get_contents('php://input'), true);
            if (!is_array($payload)) {
                throw new InvalidArgumentException('El cuerpo JSON no es valido.');
            }

            $this->enviarMensajes($this->modelo->guardar($payload), 201);
        } catch (Exception $e) {
            $this->montarMensajes('No se ha podido guardar la convocatoria.');
        }
    }

    public function listar() {
        try {
            $this->enviarMensajes($this->modelo->listarConvocatorias());
        } catch (Exception $e) {
            $this->montarMensajes('No se han podido cargar las convocatorias.');
        }
    }

    public function listarCanceladas() {
        try {
            $this->enviarMensajes($this->modelo->listarConvocatoriasCanceladas());
        } catch (Exception $e) {
            $this->montarMensajes('No se han podido cargar las convocatorias canceladas.');
        }
    }

    public function detalle() {
        try {
            $id = $_GET['id'] ?? null;
            if (!$id) {
                $this->montarMensajes('El parametro ID es obligatorio.');
            }

            $convocatoria = $this->modelo->obtenerConvocatoria((int)$id);
            if (!$convocatoria) {
                $this->montarMensajes('Convocatoria no encontrada.', 404);
            }

            $this->enviarMensajes($convocatoria);
        } catch (Exception $e) {
            $this->montarMensajes('No se han podido cargar los detalles de la convocatoria.');
        }
    }

    public function eliminar() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
                $this->montarMensajes('Metodo no permitido.', 405);
            }

            $id = $_GET['id'] ?? null;
            if (!$id) {
                $this->montarMensajes('El parametro ID es obligatorio.');
            }

            $this->enviarMensajes($this->modelo->eliminar((int)$id));
        } catch (Exception $e) {
            $this->montarMensajes('No se ha podido eliminar la convocatoria.');
        }
    }
}

?>
