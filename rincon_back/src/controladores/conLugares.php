<?php
require_once MODELO . 'modLugares.php';

// Controlador de lugares.
class ConLugares extends ControladorBase {
    private $modelo;

    public function __construct($db, $usuario = null) {
        parent::__construct($db, $usuario);
        $this->modelo = new ModLugares($db);
    }

    public function listar() {
        try {
            $this->responderJson($this->modelo->listar());
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar los lugares.');
        }
    }

    public function guardar() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $this->responderError('Metodo no permitido.', 405);
            }

            $json = json_decode(file_get_contents('php://input'), true);
            if (!is_array($json)) {
                $this->responderError('El cuerpo JSON no es valido.');
            }

            $respuesta = $this->modelo->guardar($json);
            $codigo = !empty($json['idLugar']) ? 200 : 201;
            $this->responderJson($respuesta, $codigo);
        } catch (InvalidArgumentException $e) {
            $this->responderError($e->getMessage());
        } catch (RuntimeException $e) {
            $this->responderError($e->getMessage(), 404);
        } catch (Exception $e) {
            $this->responderError('No se ha podido guardar el lugar.');
        }
    }

    public function eliminar() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $this->responderError('Metodo no permitido.', 405);
            }

            $json = json_decode(file_get_contents('php://input'), true);
            if (!is_array($json)) {
                $this->responderError('El cuerpo JSON no es valido.');
            }

            $idLugar = (int)($json['idLugar'] ?? 0);
            if ($idLugar <= 0) {
                $this->responderError('El idLugar no es valido.');
            }

            $this->responderJson($this->modelo->eliminar($idLugar));
        } catch (InvalidArgumentException $e) {
            $this->responderError($e->getMessage());
        } catch (RuntimeException $e) {
            $this->responderError($e->getMessage(), 404);
        } catch (Exception $e) {
            $this->responderError('No se ha podido eliminar el lugar.');
        }
    }
}
?>
