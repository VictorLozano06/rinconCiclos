<?php
require_once MODELO . 'modConvocatorias.php';

class ConConvocatorias extends ControladorBase {
    private $modelo;

    public function __construct($db, $usuario = null) {
        parent::__construct($db, $usuario);
        $this->modelo = new ModConvocatorias($db);
    }

    public function formulario() {
        $this->ejecutar(fn () => $this->modelo->obtenerFormulario());
    }

    public function guardar() {
        $this->ejecutar(function () {
            $this->requerirMetodo('POST');
            return $this->modelo->guardar($this->leerJson());
        }, 201);
    }

    public function listar() {
        $this->ejecutar(fn () => $this->modelo->listarConvocatorias());
    }

    public function listarCanceladas() {
        $this->ejecutar(fn () => $this->modelo->listarConvocatoriasCanceladas());
    }

    public function detalle() {
        $this->ejecutar(function () {
            $convocatoria = $this->modelo->obtenerConvocatoria($this->leerId());

            if (!$convocatoria) {
                $this->enviarRespuesta(['error' => 'Convocatoria no encontrada.'], 404);
            }

            return $convocatoria;
        });
    }

    public function eliminar() {
        $this->ejecutar(function () {
            $this->requerirMetodo('DELETE');
            return $this->modelo->eliminar($this->leerId());
        });
    }

    private function ejecutar(callable $accion, $codigo = 200) {
        try {
            $this->enviarRespuesta($accion(), $codigo);
        } catch (Exception $e) {
            $this->enviarError($e);
        }
    }

    private function requerirMetodo($metodo) {
        if ($_SERVER['REQUEST_METHOD'] !== $metodo) {
            $this->enviarRespuesta(['error' => 'Metodo no permitido.'], 405);
        }
    }

    private function leerJson() {
        $payload = json_decode(file_get_contents('php://input'), true);

        if (!is_array($payload)) {
            throw new InvalidArgumentException('El cuerpo JSON no es valido.');
        }

        return $payload;
    }

    private function leerId() {
        $id = $_GET['id'] ?? null;

        if (!$id) {
            throw new InvalidArgumentException('El parametro ID es obligatorio.');
        }

        return (int)$id;
    }
}
