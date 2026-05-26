<?php
require_once MODELO . 'modRecursos.php';

// Controlador para la gestion de recursos del profesorado
class ConRecursos extends ControladorBase {
    // El controlador no hace SQL.
    // Solo valida la peticion, llama al modelo y devuelve JSON al frontend.
    private $modelo;

    public function __construct($db, $usuario = null) {
        parent::__construct($db, $usuario);
        $this->modelo = new ModRecursos($db);
    }

    // Devuelve los recursos mas recientes para la portada del profesor.
    public function listarRecientesProfesor() {
        try {
            // Si no llega limite, usamos 5 por defecto.
            $limite = 5;

            // Si llega por URL, lo convertimos a numero y lo dejamos entre 1 y 20.
            if (isset($_GET['limite'])) {
                $limite = (int)$_GET['limite'];
                if ($limite < 1) {
                    $limite = 1;
                }
                if ($limite > 20) {
                    $limite = 20;
                }
            }

            // El modelo devuelve un array de recursos listo para Angular.
            $datos = $this->modelo->listarRecientesProfesor($limite);

            // ControladorBase es quien envia el JSON final al navegador.
            $this->responderJson($datos);
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar los recursos.');
        }
    }

    // Devuelve todos los recursos para la vista centralizada del coordinador.
    public function listarTodos() {
        try {
            $datos = $this->modelo->listarTodos();
            $this->responderJson($datos);
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar los recursos.');
        }
    }

    // Devuelve los combos base del formulario de recursos.
    public function obtenerFormulario() {
        try {
            $this->responderJson($this->modelo->obtenerFormulario());
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar los datos del formulario.');
        }
    }

    // Filtra recursos por la categoria seleccionada en el sidebar.
    public function listarPorCategoria() {
        try {
            // Este endpoint necesita el id de la categoria en la URL.
            if (!isset($_GET['idCategoria'])) {
                $this->responderError('Falta el parametro idCategoria.');
            }

            $idCategoria = (int)$_GET['idCategoria'];
            if ($idCategoria <= 0) {
                $this->responderError('El parametro idCategoria no es valido.');
            }

            // El modelo filtra por categoria y devuelve la lista ya montada.
            $datos = $this->modelo->listarPorCategoria($idCategoria);
            $this->responderJson($datos);
        } catch (Exception $e) {
            $this->responderError('No se han podido cargar los recursos.');
        }
    }

    // Carga la ficha detallada del recurso individual.
    public function detalle() {
        try {
            // Para el detalle hacen falta dos claves:
            // la categoria y el numero del recurso dentro de esa categoria.
            if (!isset($_GET['idCategoria']) || !isset($_GET['numRecurso'])) {
                $this->responderError('Faltan los parametros idCategoria y numRecurso.');
            }

            $idCategoria = (int)$_GET['idCategoria'];
            $numRecurso = (int)$_GET['numRecurso'];

            if ($idCategoria <= 0 || $numRecurso <= 0) {
                $this->responderError('Los parametros del recurso no son validos.');
            }

            // Devuelve un solo recurso o null si no existe.
            $dato = $this->modelo->obtenerDetalle($idCategoria, $numRecurso);
            if (!$dato) {
                $this->responderError('No se ha encontrado el recurso solicitado.', 404);
            }

            $this->responderJson($dato);
        } catch (Exception $e) {
            $this->responderError('No se ha podido cargar el recurso.');
        }
    }

    // Guarda un recurso nuevo o actualiza uno existente.
    public function guardar() {
        try {
            // Este endpoint solo acepta POST porque modifica datos.
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $this->responderError('Metodo no permitido.', 405);
            }

            // Leemos el cuerpo JSON que manda Angular.
            $json = json_decode(file_get_contents('php://input'), true);
            if (!is_array($json)) {
                $this->responderError('El cuerpo JSON no es valido.');
            }

            // El modelo decide si es insercion o edicion segun numRecurso.
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

    // Elimina un recurso completo.
    public function eliminar() {
        try {
            // Aqui tambien exigimos POST para evitar borrados por URL.
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $this->responderError('Metodo no permitido.', 405);
            }

            // Llegan idCategoria y numRecurso en el body JSON.
            $json = json_decode(file_get_contents('php://input'), true);
            if (!is_array($json)) {
                $this->responderError('El cuerpo JSON no es valido.');
            }

            $idCategoria = (int)($json['idCategoria'] ?? 0);
            $numRecurso = (int)($json['numRecurso'] ?? 0);

            if ($idCategoria <= 0 || $numRecurso <= 0) {
                $this->responderError('Los parametros del recurso no son validos.');
            }

            // El modelo borra el recurso y sus archivos fisicos asociados.
            $this->responderJson($this->modelo->eliminar($idCategoria, $numRecurso));
        } catch (RuntimeException $e) {
            $this->responderError($e->getMessage(), 404);
        } catch (Exception $e) {
            $this->responderError('No se ha podido eliminar el recurso.');
        }
    }

    // Recibe un archivo desde FilePond, lo guarda en la carpeta temporal
    // y devuelve el identificador que el frontend necesita para referenciarlo.
    public function subirArchivoTemporal() {
        try {
            // FilePond manda el archivo con la clave "filepond".
            if (!isset($_FILES['filepond'])) {
                $this->responderError('No se ha recibido ningun archivo.', 400);
            }

            $archivo = $_FILES['filepond'];

            if (($archivo['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
                $this->responderError('El archivo no se ha podido subir.', 400);
            }

            // Limite de peso por archivo: 10 MB.
            $tamanoMaximo = 10 * 1024 * 1024; // 10 MB
            if (($archivo['size'] ?? 0) > $tamanoMaximo) {
                $this->responderError('El archivo supera el tamano maximo permitido de 10 MB.', 400);
            }

            // Formatos admitidos en recursos.
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

            // Esto es lo que el frontend guarda temporalmente para luego asociarlo al recurso.
            $identificadorTemporal = 'recursos/temp/' . $nombreSeguro;

            $this->responderJson([
                'idTemporal' => $identificadorTemporal
            ]);
        } catch (Exception $e) {
            $this->responderError('No se ha podido subir el archivo temporal.', 500);
        }
    }

    // Borra de la carpeta temporal un archivo que el usuario ya no quiere adjuntar.
    // Esto evita dejar basura si el usuario lo quita antes de guardar el recurso final.
    public function eliminarArchivoTemporal() {
        try {
            // El frontend manda solo el identificador del archivo temporal.
            $identificadorTemporal = trim(file_get_contents('php://input') ?: '');

            if ($identificadorTemporal === '') {
                $this->responderError('Falta el identificador del archivo temporal.', 400);
            }

            if (!preg_match('#^recursos/temp/[a-zA-Z0-9._-]+$#', $identificadorTemporal)) {
                $this->responderError('El identificador del archivo temporal no es valido.', 400);
            }

            // Construimos la ruta fisica real del archivo temporal para borrarlo del disco.
            $rutaFisica = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $identificadorTemporal);

            if (is_file($rutaFisica) && !unlink($rutaFisica)) {
                $this->responderError('No se ha podido borrar el archivo temporal.', 500);
            }

            $this->responderJson(['ok' => true]);
        } catch (Exception $e) {
            $this->responderError('No se ha podido borrar el archivo temporal.', 500);
        }
    }
}
?>
