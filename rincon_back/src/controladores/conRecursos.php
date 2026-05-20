<?php
require_once MODELO . 'modRecursos.php';

// Controlador para la gestion de recursos del profesorado
class ConRecursos extends ControladorBase {
    private $modelo;

    public function __construct($db, $usuario = null) {
        parent::__construct($db, $usuario);
        $this->modelo = new ModRecursos($db);
    }

    public function listarRecientesProfesor() {
        try {
            $limite = isset($_GET['limite']) ? max(1, min(20, (int)$_GET['limite'])) : 5;
            $datos = $this->modelo->listarRecientesProfesor($limite);
            $this->enviarRespuesta($datos);
        } catch (Exception $e) {
            $this->enviarError($e);
        }
    }

    public function listarPorCategoria() {
        try {
            if (!isset($_GET['idCategoria'])) {
                $this->enviarError('Falta el parametro idCategoria.');
            }

            $idCategoria = (int)$_GET['idCategoria'];
            if ($idCategoria <= 0) {
                $this->enviarError('El parametro idCategoria no es valido.');
            }

            $datos = $this->modelo->listarPorCategoria($idCategoria);
            $this->enviarRespuesta($datos);
        } catch (Exception $e) {
            $this->enviarError($e);
        }
    }

    public function detalle() {
        try {
            if (!isset($_GET['idCategoria']) || !isset($_GET['numRecurso'])) {
                $this->enviarError('Faltan los parametros idCategoria y numRecurso.');
            }

            $idCategoria = (int)$_GET['idCategoria'];
            $numRecurso = (int)$_GET['numRecurso'];

            if ($idCategoria <= 0 || $numRecurso <= 0) {
                $this->enviarError('Los parametros del recurso no son validos.');
            }

            $dato = $this->modelo->obtenerDetalle($idCategoria, $numRecurso);
            if (!$dato) {
                $this->enviarError('No se ha encontrado el recurso solicitado.', 404);
            }

            $this->enviarRespuesta($dato);
        } catch (Exception $e) {
            $this->enviarError($e);
        }
    }
}
?>
