<?php
require_once MODELO . 'modLugares.php';

/**
 * Controlador HTTP para la gestión de lugares.
 *
 * Se encarga de recibir las peticiones JSON que hace Angular para:
 * - listar lugares
 * - crear o editar un lugar
 * - eliminar un lugar
 *
 * Toda la lógica de negocio queda delegada en {@see ModLugares}. El
 * controlador solo valida lo mínimo a nivel HTTP y responde con JSON.
 */
class ConLugares extends ControladorBase {
    /**
     * Modelo especializado en la persistencia y validación de lugares.
     *
     * @var ModLugares
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
        $this->modelo = new ModLugares($db);
    }

    /**
     * Devuelve el listado completo de lugares ordenado por nombre.
     *
     * @return void
     */
    public function listar() {
        try {
            $this->responderJson($this->modelo->listar());
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar los lugares.');
        }
    }

    /**
     * Crea un lugar nuevo o actualiza uno ya existente.
     *
     * Si el payload trae `idLugar` se interpreta como edición. Si no lo trae,
     * se crea una fila nueva en la tabla `lugar`.
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

    /**
     * Elimina un lugar siempre que no tenga dependencias activas en la BD.
     *
     * Si el lugar está siendo usado por convocatorias u órdenes del día, el
     * modelo devuelve un error legible para el frontend.
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
