<?php
// Modelo encargado de obtener e indexar los datos de las categorías en la base de datos
class ModCategorias {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Recupera todas las categorias y monta el arbol de navegacion del sidebar.
     * El orden final no depende de la BD, sino de la estructura padre/hijo.
     */
    public function listar() {
        $sql = "SELECT idCategoria, nombre, predeterminada, idCategoriaPadre FROM categoria ORDER BY idCategoria";
        $declaracion = $this->db->prepare($sql);
        $declaracion->execute();
        $filas = $declaracion->fetchAll(PDO::FETCH_ASSOC);

        $categorias = [];

        // Indexamos por id para poder colgar hijos de forma rapida sin volver a consultar la BD.
        foreach ($filas as $fila) {
            $id = (int)$fila['idCategoria'];
            $categorias[$id] = [
                'idCategoria'      => $id,
                'nombre'           => $fila['nombre'],
                'predeterminada'   => (int)$fila['predeterminada'] === 1,
                'idCategoriaPadre' => (int)$fila['idCategoriaPadre'],
                'subcategorias'    => []
            ];
        }

        $arbol = [];

        // Recorremos una sola vez y vamos enlazando nodos hijos a su padre.
        foreach ($categorias as $id => &$cat) {
            $idPadre = $cat['idCategoriaPadre'];

            // La categoria 1 actua como raiz tecnica del arbol.
            if ($idPadre === 1 && $id !== 1) {
                $arbol[] = &$cat;
            } else if ($id !== 1 && $idPadre !== $id) {
                if (isset($categorias[$idPadre])) {
                    $categorias[$idPadre]['subcategorias'][] = &$cat;
                }
            }
        }

        return $arbol;
    }
}
?>
