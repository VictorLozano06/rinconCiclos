<?php
require_once MODELO . 'modConvocatorias.php';

/**
 * Controlador HTTP para la gestión de convocatorias de reuniones.
 *
 * Expone los endpoints de lectura y escritura de convocatorias y delega la
 * lógica de negocio en {@see ModConvocatorias}. Su responsabilidad principal
 * es validar el método HTTP, leer parámetros o JSON de entrada y devolver las
 * respuestas en formato JSON usando la infraestructura de {@see ControladorBase}.
 */
class ConConvocatorias extends ControladorBase {
    /**
     * Modelo especializado en la persistencia y validación de convocatorias.
     *
     * @var ModConvocatorias
     */
    private $modelo;

    /**
     * Inicializa el controlador y su modelo asociado.
     *
     * @param PDO $db Conexión PDO compartida por la aplicación.
     * @param mixed|null $usuario Usuario autenticado si existe contexto de sesión.
     */
    public function __construct($db, $usuario = null) {
        parent::__construct($db, $usuario);
        $this->modelo = new ModConvocatorias($db);
    }

    /**
     * Devuelve los datos base necesarios para renderizar el formulario.
     *
     * La respuesta incluye cursos, lugares, profesores, grupos y el curso
     * académico que debe aparecer preseleccionado en el frontend.
     *
     * @return void
     */
    public function formulario() {
        try {
            $datos = $this->modelo->obtenerFormulario();
            $this->responderJson($datos);
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar los datos del formulario.');
        }
    }

    /**
     * Crea una convocatoria nueva o actualiza una existente a partir de JSON.
     *
     * Si el payload incluye `idConvocatoria` se interpreta como actualización.
     * En caso contrario se crea una nueva convocatoria. La respuesta mantiene
     * el mismo contrato consumido por Angular.
     *
     * @return void
     */
    public function guardar() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $this->responderError('Metodo no permitido.', 405);
            }

            $payload = json_decode(file_get_contents('php://input'), true);
            if (!is_array($payload)) {
                $this->responderError('El cuerpo JSON no es valido.');
            }

            $respuesta = $this->modelo->guardar($payload);
            $codigo = !empty($payload['idConvocatoria']) ? 200 : 201;
            $this->responderJson($respuesta, $codigo);
        } catch (InvalidArgumentException $e) {
            $this->responderError($e->getMessage());
        } catch (RuntimeException $e) {
            $this->responderError($e->getMessage(), 404);
        } catch (Exception $e) {
            $this->responderError('No se ha podido guardar la convocatoria.');
        }
    }

    /**
     * Lista exclusivamente las convocatorias activas.
     *
     * @return void
     */
    public function listarActivas() {
        try {
            $datos = $this->modelo->listarActivas();
            $this->responderJson($datos);
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar las convocatorias.');
        }
    }

    /**
     * Lista las convocatorias visibles para el perfil profesor.
     *
     * @return void
     */
    public function listarVisiblesProfesor() {
        try {
            $datos = $this->modelo->listarVisiblesProfesor();
            $this->responderJson($datos);
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar las convocatorias visibles para profesorado.');
        }
    }

    /**
     * Lista todas las convocatorias sin filtrar por estado.
     *
     * @return void
     */
    public function listarTodas() {
        try {
            $datos = $this->modelo->listarTodas();
            $this->responderJson($datos);
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar las convocatorias.');
        }
    }

    /**
     * Lista convocatorias históricas: borradores y convocatorias pasadas.
     *
     * @return void
     */
    public function listarHistoricas() {
        try {
            $datos = $this->modelo->listarHistoricas();
            $this->responderJson($datos);
        } catch (Exception $e) {
            $this->responderError('No se ha podido cargar el historico de convocatorias.');
        }
    }

    /**
     * Lista únicamente las convocatorias marcadas como pasadas.
     *
     * @return void
     */
    public function listarPasadas() {
        try {
            $datos = $this->modelo->listarPasadas();
            $this->responderJson($datos);
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar las convocatorias pasadas.');
        }
    }

    /**
     * Devuelve el detalle completo de una convocatoria concreta.
     *
     * Lee el identificador desde la query string bajo el parámetro `id`.
     *
     * @return void
     */
    public function detalle() {
        try {
            if (!isset($_GET['id'])) {
                $this->responderError('Falta el parametro id.');
            }

            $idConvocatoria = (int)$_GET['id'];
            if ($idConvocatoria <= 0) {
                $this->responderError('El parametro id no es valido.');
            }

            $dato = $this->modelo->obtenerDetalle($idConvocatoria);
            if (!$dato) {
                $this->responderError('No se ha encontrado la convocatoria solicitada.', 404);
            }

            $this->responderJson($dato);
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar los detalles de la convocatoria.');
        }
    }

    /**
     * Marca una convocatoria activa concreta como pasada.
     *
     * Espera un JSON con `idConvocatoria`.
     *
     * @return void
     */
    public function marcarComoPasada() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $this->responderError('Metodo no permitido.', 405);
            }

            $payload = json_decode(file_get_contents('php://input'), true);
            $idConvocatoria = (int)($payload['idConvocatoria'] ?? 0);

            if ($idConvocatoria <= 0) {
                $this->responderError('El id de la convocatoria no es valido.');
            }

            $this->responderJson($this->modelo->marcarComoPasada($idConvocatoria));
        } catch (RuntimeException $e) {
            $this->responderError($e->getMessage(), 404);
        } catch (Exception $e) {
            $this->responderError('No se ha podido marcar la convocatoria como pasada.');
        }
    }

    /**
     * Marca como pasadas todas las convocatorias activas existentes.
     *
     * @return void
     */
    public function marcarTodasComoPasadas() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $this->responderError('Metodo no permitido.', 405);
            }

            $this->responderJson($this->modelo->marcarTodasComoPasadas());
        } catch (Exception $e) {
            $this->responderError('No se han podido marcar las convocatorias como pasadas.');
        }
    }

    /**
     * Cancela una convocatoria activa o borrador moviéndola a estado pasado.
     *
     * Espera un JSON con `idConvocatoria`.
     *
     * @return void
     */
    public function cancelar() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $this->responderError('Metodo no permitido.', 405);
            }

            $payload = json_decode(file_get_contents('php://input'), true);
            $idConvocatoria = (int)($payload['idConvocatoria'] ?? 0);

            if ($idConvocatoria <= 0) {
                $this->responderError('El id de la convocatoria no es valido.');
            }

            $this->responderJson($this->modelo->cancelarConvocatoria($idConvocatoria));
        } catch (RuntimeException $e) {
            $this->responderError($e->getMessage(), 404);
        } catch (Exception $e) {
            $this->responderError('No se ha podido cancelar la convocatoria.');
        }
    }

    /**
     * Valida que la petición se esté ejecutando con el verbo HTTP esperado.
     *
     * Si el método no coincide, el controlador corta la ejecución devolviendo
     * un error JSON 405.
     *
     * @param string $metodoEsperado Método HTTP permitido, por ejemplo `POST`.
     *
     * @return void
     */
    private function asegurarMetodo($metodoEsperado) {
        $metodoActual = strtoupper($_SERVER['REQUEST_METHOD'] ?? '');
        if ($metodoActual !== strtoupper($metodoEsperado)) {
            $this->montarMensajes('Metodo no permitido.', 405);
        }
    }

    /**
     * Lee el cuerpo JSON de la petición y lo devuelve como array asociativo.
     *
     * Si el cuerpo no contiene un JSON válido se devuelve un error JSON 400
     * mediante {@see ControladorBase::montarMensajes()}.
     *
     * @return array<string,mixed>
     */
    private function leerPayloadJson() {
        $payload = json_decode(file_get_contents('php://input'), true);
        if (!is_array($payload)) {
            $this->montarMensajes('El cuerpo JSON no es valido.');
        }

        return $payload;
    }

    /**
     * Lee y valida un parámetro entero positivo de la query string.
     *
     * @param string $nombre Nombre del parámetro esperado en `$_GET`.
     *
     * @return int Entero positivo listo para usar en el modelo.
     */
    private function leerEnteroQuery($nombre) {
        if (!isset($_GET[$nombre])) {
            $this->montarMensajes('Falta el parametro ' . $nombre . '.');
        }

        $valor = (int)$_GET[$nombre];
        if ($valor <= 0) {
            $this->montarMensajes('El parametro ' . $nombre . ' no es valido.');
        }

        return $valor;
    }

    /**
     * Lee y valida un entero positivo dentro del payload JSON.
     *
     * @param string $nombre Nombre de la clave esperada dentro del payload.
     *
     * @return int Entero positivo listo para usar en el modelo.
     */
    private function leerEnteroPayload($nombre) {
        $payload = $this->leerPayloadJson();
        $valor = (int)($payload[$nombre] ?? 0);

        if ($valor <= 0) {
            $this->montarMensajes('El parametro ' . $nombre . ' no es valido.');
        }

        return $valor;
    }
}
?>
