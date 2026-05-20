<?php
require_once MODELO . 'modConvocatorias.php';

class ConConvocatorias extends ControladorBase {
    private $modelo;

    public function __construct($db, $usuario = null) {
        parent::__construct($db, $usuario);
        $this->modelo = new ModConvocatorias($db);
    }

    // Devuelve los datos base que necesitan los formularios de alta y edicion.
    public function formulario() {
        try {
            $this->enviarRespuesta($this->modelo->obtenerFormulario());
        } catch (Exception $e) {
            $this->enviarError($e);
        }
    }

    // Guarda convocatorias que llegan desde el frontend en JSON.
    public function guardar() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $this->enviarRespuesta(['error' => 'Metodo no permitido.'], 405);
            }

            $payload = json_decode(file_get_contents('php://input'), true);
            if (!is_array($payload)) {
                throw new InvalidArgumentException('El cuerpo JSON no es valido.');
            }

            $this->enviarRespuesta($this->modelo->guardar($payload), 201);
        } catch (Exception $e) {
            $this->enviarError($e);
        }
    }

    // Lista las convocatorias para la pantalla principal del coordinador.
    public function listar() {
        try {
            $this->enviarRespuesta($this->modelo->listarConvocatorias());
        } catch (Exception $e) {
            $this->enviarError($e);
        }
    }

    // Devuelve el detalle completo de una convocatoria.
    public function detalle() {
        try {
            $id = $_GET['id'] ?? null;
            if (!$id) {
                throw new InvalidArgumentException('El parametro ID es obligatorio.');
            }
            $convocatoria = $this->modelo->obtenerConvocatoria((int)$id);
            if (!$convocatoria) {
                $this->enviarRespuesta(['error' => 'Convocatoria no encontrada.'], 404);
            } else {
                $this->enviarRespuesta($convocatoria);
            }
        } catch (Exception $e) {
            $this->enviarError($e);
        }
    }

    // Elimina una convocatoria y su orden del dia.
    public function eliminar() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
                $this->enviarRespuesta(['error' => 'Metodo no permitido.'], 405);
            }

            $id = $_GET['id'] ?? null;
            if (!$id) {
                throw new InvalidArgumentException('El parametro ID es obligatorio.');
            }

            $this->enviarRespuesta($this->modelo->eliminar((int)$id));
        } catch (Exception $e) {
            $this->enviarError($e);
        }
    }
}
