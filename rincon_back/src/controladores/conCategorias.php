<?php
require_once MODELO . 'modCategorias.php';

/**
 * Controlador HTTP para la gestión de categorías.
 *
 * Expone los endpoints JSON que usa Angular para:
 * - cargar el árbol visible de categorías
 * - crear una categoría nueva
 * - editar una categoría existente
 * - eliminar una categoría y sus dependencias
 *
 * La lógica de negocio y las validaciones reales viven en {@see ModCategorias}.
 * Este controlador solo se encarga de:
 * - comprobar método HTTP cuando toca
 * - leer el cuerpo JSON
 * - validar parámetros mínimos
 * - devolver la respuesta JSON final
 */
class ConCategorias extends ControladorBase {
    /**
     * Modelo especializado en la persistencia y validación de categorías.
     *
     * @var ModCategorias
     */
    private $modelo;

    /**
     * Inicializa el controlador y el modelo asociado.
     *
     * @param PDO $db Conexión PDO compartida por la aplicación.
     * @param mixed|null $usuario Usuario autenticado si existe contexto de sesión.
     */
    public function __construct($db, $usuario = null) {
        parent::__construct($db, $usuario);
        $this->modelo = new ModCategorias($db);
    }

    /**
     * Devuelve el árbol visible de categorías consumido por Angular.
     *
     * El árbol ya sale procesado desde el modelo sin la categoría técnica RAIZ.
     *
     * @return void
     */
    public function listar() {
        try {
            $this->responderJson($this->modelo->listar());
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar las categorias.');
        }
    }

    /**
     * Crea una categoría nueva o actualiza una ya existente.
     *
     * Si el payload incluye `idCategoria` se interpreta como edición.
     * Si no lo incluye, se crea una categoría nueva como no predeterminada.
     *
     * @return void
     */
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
            $codigo = !empty($json['idCategoria']) ? 200 : 201;
            $this->responderJson($respuesta, $codigo);
        } catch (InvalidArgumentException $e) {
            $this->responderError($e->getMessage());
        } catch (RuntimeException $e) {
            $this->responderError($e->getMessage(), 404);
        } catch (Exception $e) {
            $this->responderError('No se ha podido guardar la categoria.');
        }
    }

    /**
     * Elimina una categoría editable a partir de su identificador.
     *
     * El modelo se ocupa de limpiar antes:
     * - recursos colgados de esa categoría o de sus hijas
     * - relaciones cicloRecurso
     * - archivos físicos asociados
     *
     * @return void
     */
    public function eliminar() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $this->responderError('Metodo no permitido.', 405);
            }

            $json = json_decode(file_get_contents('php://input'), true);
            if (!is_array($json)) {
                $this->responderError('El cuerpo JSON no es valido.');
            }

            $idCategoria = (int)($json['idCategoria'] ?? 0);
            if ($idCategoria <= 0) {
                $this->responderError('El idCategoria no es valido.');
            }

            $this->responderJson($this->modelo->eliminar($idCategoria));
        } catch (InvalidArgumentException $e) {
            $this->responderError($e->getMessage());
        } catch (RuntimeException $e) {
            $this->responderError($e->getMessage(), 404);
        } catch (Exception $e) {
            $this->responderError('No se ha podido eliminar la categoria.');
        }
    }
}
?>
