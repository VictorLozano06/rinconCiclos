<?php
require_once MODELO . 'modRecursos.php';

// Controlador para la gestion de recursos del profesorado
class ConRecursos extends ControladorBase {
    private $modelo;

    public function __construct($db, $usuario = null) {
        parent::__construct($db, $usuario);
        $this->modelo = new ModRecursos($db);
    }

    // Devuelve los recursos mas recientes para la portada del profesor.
    public function listarRecientesProfesor() {
        try {
            $limite = isset($_GET['limite']) ? max(1, min(20, (int)$_GET['limite'])) : 5;
            $datos = $this->modelo->listarRecientesProfesor($limite);
            $this->enviarMensajes($datos);
        } catch (Exception $e) {
            $this->montarMensajes('No se han podido cargar los recursos.');
        }
    }

    // Devuelve todos los recursos para la vista centralizada del coordinador.
    public function listarTodos() {
        try {
            $datos = $this->modelo->listarTodos();
            $this->enviarMensajes($datos);
        } catch (Exception $e) {
            $this->montarMensajes('No se han podido cargar los recursos.');
        }
    }

    // Filtra recursos por la categoria seleccionada en el sidebar.
    public function listarPorCategoria() {
        try {
            if (!isset($_GET['idCategoria'])) {
                $this->montarMensajes('Falta el parametro idCategoria.');
            }

            $idCategoria = (int)$_GET['idCategoria'];
            if ($idCategoria <= 0) {
                $this->montarMensajes('El parametro idCategoria no es valido.');
            }

            $datos = $this->modelo->listarPorCategoria($idCategoria);
            $this->enviarMensajes($datos);
        } catch (Exception $e) {
            $this->montarMensajes('No se han podido cargar los recursos.');
        }
    }

    // Carga la ficha detallada del recurso individual.
    public function detalle() {
        try {
            if (!isset($_GET['idCategoria']) || !isset($_GET['numRecurso'])) {
                $this->montarMensajes('Faltan los parametros idCategoria y numRecurso.');
            }

            $idCategoria = (int)$_GET['idCategoria'];
            $numRecurso = (int)$_GET['numRecurso'];

            if ($idCategoria <= 0 || $numRecurso <= 0) {
                $this->montarMensajes('Los parametros del recurso no son validos.');
            }

            $dato = $this->modelo->obtenerDetalle($idCategoria, $numRecurso);
            if (!$dato) {
                $this->montarMensajes('No se ha encontrado el recurso solicitado.', 404);
            }

            $this->enviarMensajes($dato);
        } catch (Exception $e) {
            $this->montarMensajes('No se ha podido cargar el recurso.');
        }
    }
}
?>
