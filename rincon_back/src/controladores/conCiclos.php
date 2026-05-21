<?php
require_once MODELO . 'modCiclos.php';

class ConCiclos extends ControladorBase {
    private $modelo;

    public function __construct($db, $usuario = null) {
        parent::__construct($db, $usuario);
        $this->modelo = new ModCiclos($db);
    }

    public function listar() {
        try {
            $datos = $this->modelo->listar();
            $this->enviarRespuesta($datos);
        } catch (Exception $e) {
            $this->enviarError($e);
        }
    }

    public function crear() {
        $datos = json_decode(file_get_contents("php://input"), true);

        $nombre  = trim($datos['nombre']  ?? '');
        $familia = trim($datos['familia'] ?? '');

        if (empty($nombre) || empty($familia)) {
            $this->enviarError('Faltan datos obligatorios (nombre y familia).', 400);
            return;
        }

        try {
            $resultado = $this->modelo->crear($nombre, $familia);
            $this->enviarRespuesta($resultado);
        } catch (Exception $e) {
            $this->enviarError($e);
        }
    }

    public function editar() {
        $datos = json_decode(file_get_contents("php://input"), true);

        $idCiclo = $datos['idCiclo'] ?? null;
        $nombre  = trim($datos['nombre']  ?? '');
        $familia = trim($datos['familia'] ?? '');

        if (!$idCiclo || empty($nombre) || empty($familia)) {
            $this->enviarError('Faltan datos obligatorios (idCiclo, nombre y familia).', 400);
            return;
        }

        try {
            $resultado = $this->modelo->editar($idCiclo, $nombre, $familia);
            $this->enviarRespuesta($resultado);
        } catch (Exception $e) {
            $this->enviarError($e);
        }
    }

    public function eliminar() {
        $idCiclo = $_GET['id'] ?? null;

        if (!$idCiclo) {
            $this->enviarError('ID de ciclo no proporcionado.', 400);
            return;
        }

        try {
            $resultado = $this->modelo->eliminar($idCiclo);
            $this->enviarRespuesta($resultado);
        } catch (Exception $e) {
            $this->enviarError($e);
        }
    }
}
?>
