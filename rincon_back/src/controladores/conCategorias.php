<?php
require_once MODELO . 'modCategorias.php';

// Controlador para la gestión de las Categorías
class ConCategorias extends ControladorBase {
    private $modelo;

    public function __construct($db, $usuario = null) {
        parent::__construct($db, $usuario);
        $this->modelo = new ModCategorias($db);
    }

    // Devuelve el arbol de categorias que usan los sidebars de ambos roles.
    public function listar() {
        try {
            $datos = $this->modelo->listar();
            $this->responderJson($datos);
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar las categorias.');
        }
    }
}
?>
