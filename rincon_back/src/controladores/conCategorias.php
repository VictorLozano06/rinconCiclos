<?php
require_once MODELO . 'modCategorias.php';

// Controlador para la gestión de las Categorías
class ConCategorias extends ControladorBase {
    private $modelo;

    public function __construct($db, $usuario = null) {
        parent::__construct($db, $usuario);
        $this->modelo = new ModCategorias($db);
    }

    // Método para devolver la lista de categorías en formato de árbol JSON
    public function listar() {
        try {
            $datos = $this->modelo->listar();
            $this->enviarRespuesta($datos);
        } catch (Exception $e) {
            $this->enviarError($e);
        }
    }
}
?>
