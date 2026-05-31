<?php
require_once MODELO . 'modRecursos.php';

/**
 * Controlador HTTP para la gestión de recursos del profesorado.
 *
 * Expone endpoints de lectura, guardado, borrado y subida temporal de
 * archivos. Su responsabilidad es validar la petición HTTP y delegar la
 * persistencia real en {@see ModRecursos}.
 */
class ConRecursos extends ControladorBase {
    /**
     * Modelo especializado en la persistencia y validación de recursos.
     *
     * @var ModRecursos
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
        $this->modelo = new ModRecursos($db);
    }

    /**
     * Devuelve los recursos más recientes para la portada del profesor.
     *
     * Acepta un parámetro opcional `limite` por query string y lo acota entre
     * 1 y 20 para evitar lecturas absurdas o abusivas.
     *
     * @return void
     */
    public function listarRecientesProfesor() {
        try {
            $limite = 5;

            if (isset($_GET['limite'])) {
                $limite = (int)$_GET['limite'];
                if ($limite < 1) {
                    $limite = 1;
                }
                if ($limite > 20) {
                    $limite = 20;
                }
            }

            $datos = $this->modelo->listarRecientesProfesor($limite);
            $this->responderJson($datos);
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar los recursos.');
        }
    }

    /**
     * Devuelve el listado completo de recursos para coordinación.
     *
     * @return void
     */
    public function listarTodos() {
        try {
            $datos = $this->modelo->listarTodos();
            $this->responderJson($datos);
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar los recursos.');
        }
    }

    /**
     * Devuelve los datos base necesarios para renderizar el formulario.
     *
     * Incluye cursos, ciclos y el curso sugerido como actual.
     *
     * @return void
     */
    public function obtenerFormulario() {
        try {
            $this->responderJson($this->modelo->obtenerFormulario());
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar los datos del formulario.');
        }
    }

    /**
     * Filtra recursos por la categoría elegida en el sidebar.
     *
     * Espera `idCategoria` en query string.
     *
     * @return void
     */
    public function listarPorCategoria() {
        try {
            if (!isset($_GET['idCategoria'])) {
                $this->responderError('Falta el parametro idCategoria.');
            }

            $idCategoria = (int)$_GET['idCategoria'];
            if ($idCategoria <= 0) {
                $this->responderError('El parametro idCategoria no es valido.');
            }

            $datos = $this->modelo->listarPorCategoria($idCategoria);
            $this->responderJson($datos);
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar los recursos.');
        }
    }

    /**
     * Recupera el detalle completo de un recurso concreto.
     *
     * Espera la clave compuesta `idCategoria + numRecurso` en query string.
     *
     * @return void
     */
    public function detalle() {
        try {
            if (!isset($_GET['idCategoria']) || !isset($_GET['numRecurso'])) {
                $this->responderError('Faltan los parametros idCategoria y numRecurso.');
            }

            $idCategoria = (int)$_GET['idCategoria'];
            $numRecurso = (int)$_GET['numRecurso'];

            if ($idCategoria <= 0 || $numRecurso <= 0) {
                $this->responderError('Los parametros del recurso no son validos.');
            }

            $dato = $this->modelo->obtenerDetalle($idCategoria, $numRecurso);
            if (!$dato) {
                $this->responderError('No se ha encontrado el recurso solicitado.', 404);
            }

            $this->responderJson($dato);
        } catch (Exception $e) {
            $this->responderError('No se ha podido cargar el recurso.');
        }
    }

    /**
     * Guarda un recurso nuevo o actualiza uno existente.
     *
     * El backend distingue entre alta y edición por el valor de `numRecurso`.
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
            $codigo = !empty($json['numRecurso']) ? 200 : 201;
            $this->responderJson($respuesta, $codigo);
        } catch (InvalidArgumentException $e) {
            $this->responderError($e->getMessage());
        } catch (RuntimeException $e) {
            $this->responderError($e->getMessage(), 404);
        } catch (Exception $e) {
            $this->responderError('No se ha podido guardar el recurso.');
        }
    }

    /**
     * Elimina un recurso completo por su clave compuesta.
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
            $numRecurso = (int)($json['numRecurso'] ?? 0);

            if ($idCategoria <= 0 || $numRecurso <= 0) {
                $this->responderError('Los parametros del recurso no son validos.');
            }

            $this->responderJson($this->modelo->eliminar($idCategoria, $numRecurso));
        } catch (RuntimeException $e) {
            $this->responderError($e->getMessage(), 404);
        } catch (Exception $e) {
            $this->responderError('No se ha podido eliminar el recurso.');
        }
    }

    /**
     * Recibe un archivo desde FilePond y lo guarda en la carpeta temporal.
     *
     * Devuelve un identificador corto que el frontend almacena hasta que el
     * usuario guarda definitivamente el recurso.
     *
     * @return void
     */
    public function subirArchivoTemporal() {
        try {
            if (!empty($_SERVER['CONTENT_LENGTH']) && empty($_FILES)) {
                $this->responderError(
                    'El servidor ha rechazado la subida antes de procesarla. Revisa upload_max_filesize y post_max_size en PHP.',
                    400
                );
            }

            if (!isset($_FILES['filepond'])) {
                $this->responderError('No se ha recibido ningun archivo.', 400);
            }

            $archivo = $_FILES['filepond'];

            if (($archivo['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
                $this->responderError($this->obtenerMensajeErrorSubida((int)$archivo['error']), 400);
            }

            $tamanoMaximo = 10 * 1024 * 1024; // 10 MB
            if (($archivo['size'] ?? 0) > $tamanoMaximo) {
                $this->responderError('El archivo supera el tamano maximo permitido de 10 MB.', 400);
            }

            $extension = strtolower(pathinfo($archivo['name'] ?? '', PATHINFO_EXTENSION));
            $extensionesPermitidas = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

            if (!in_array($extension, $extensionesPermitidas, true)) {
                $this->responderError('Formato de archivo no permitido.', 400);
            }

            $rutaBaseUploads = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'recursos' . DIRECTORY_SEPARATOR . 'temp';
            if (!is_dir($rutaBaseUploads) && !mkdir($rutaBaseUploads, 0775, true) && !is_dir($rutaBaseUploads)) {
                $this->responderError('No se ha podido crear la carpeta de subida.', 500);
            }

            $nombreSeguro = uniqid('recurso_', true) . '.' . $extension;
            $rutaFisica = $rutaBaseUploads . DIRECTORY_SEPARATOR . $nombreSeguro;

            if (!move_uploaded_file($archivo['tmp_name'], $rutaFisica)) {
                $this->responderError('No se ha podido mover el archivo al servidor.', 500);
            }

            $identificadorTemporal = 'recursos/temp/' . $nombreSeguro;

            $this->responderJson([
                'idTemporal' => $identificadorTemporal
            ]);
        } catch (Exception $e) {
            $this->responderError('No se ha podido subir el archivo temporal: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Borra de la carpeta temporal un archivo que el usuario descartó.
     *
     * @return void
     */
    public function eliminarArchivoTemporal() {
        try {
            $identificadorTemporal = trim(file_get_contents('php://input') ?: '');

            if ($identificadorTemporal === '') {
                $this->responderError('Falta el identificador del archivo temporal.', 400);
            }

            if (!preg_match('#^recursos/temp/[a-zA-Z0-9._-]+$#', $identificadorTemporal)) {
                $this->responderError('El identificador del archivo temporal no es valido.', 400);
            }

            $rutaFisica = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $identificadorTemporal);

            if (is_file($rutaFisica) && !unlink($rutaFisica)) {
                $this->responderError('No se ha podido borrar el archivo temporal.', 500);
            }

            $this->responderJson(['ok' => true]);
        } catch (Exception $e) {
            $this->responderError('No se ha podido borrar el archivo temporal.', 500);
        }
    }

    /**
     * Traduce los códigos de error nativos de subida PHP a mensajes legibles.
     *
     * @param int $codigoError Código `UPLOAD_ERR_*` recibido desde `$_FILES`.
     *
     * @return string
     */
    private function obtenerMensajeErrorSubida($codigoError) {
        switch ($codigoError) {
            case UPLOAD_ERR_INI_SIZE:
                return 'El archivo supera el limite de subida del servidor PHP.';
            case UPLOAD_ERR_FORM_SIZE:
                return 'El archivo supera el limite permitido por el formulario.';
            case UPLOAD_ERR_PARTIAL:
                return 'La subida del archivo se ha quedado incompleta.';
            case UPLOAD_ERR_NO_FILE:
                return 'No se ha seleccionado ningun archivo.';
            case UPLOAD_ERR_NO_TMP_DIR:
                return 'Falta la carpeta temporal de PHP en el servidor.';
            case UPLOAD_ERR_CANT_WRITE:
                return 'PHP no ha podido escribir el archivo en disco.';
            case UPLOAD_ERR_EXTENSION:
                return 'Una extension de PHP ha bloqueado la subida del archivo.';
            default:
                return 'El archivo no se ha podido subir.';
        }
    }
}
?>
