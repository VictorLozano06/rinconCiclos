<?php
// Modelo encargado de obtener e indexar los datos de las categorías en la base de datos
class ModCategorias {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Recupera todas las categorías y monta un árbol jerárquico recursivo
     */
    public function listar() {
        // Consulta simple para traer todas las categorías ordenadas por su ID
        $sql = "SELECT idCategoria, nombre, predeterminada, idCategoriaPadre FROM categoria ORDER BY idCategoria";
        $declaracion = $this->db->prepare($sql);
        $declaracion->execute();
        $filas = $declaracion->fetchAll(PDO::FETCH_ASSOC);

        $categorias = [];
        
        // Mapeamos los registros y los indexamos por el idCategoria para acceso directo en memoria
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
        
        // Construimos la estructura jerárquica en base a referencias en memoria (&) para evitar duplicados
        foreach ($categorias as $id => &$cat) {
            $idPadre = $cat['idCategoriaPadre'];
            
            // La categoría con ID 1 es la categoría 'Raíz' general.
            // Los elementos principales del menú son los que tienen idCategoriaPadre = 1 (pero no el propio 1).
            if ($idPadre === 1 && $id !== 1) {
                $arbol[] = &$cat; // Es una categoría principal
            } else if ($id !== 1 && $idPadre !== $id) {
                // Es una subcategoría de nivel inferior, la agregamos a su categoría padre correspondiente
                if (isset($categorias[$idPadre])) {
                    $categorias[$idPadre]['subcategorias'][] = &$cat;
                }
            }
        }

        return $arbol;
    }
}
?>
