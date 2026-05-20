<?php
ob_start();

// Cabeceras CORS para permitir peticiones HTTP desde el frontend en Angular
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Max-Age: 3600");
header("Content-Type: application/json; charset=UTF-8");

// Si es una petición de tipo preflight OPTIONS, responder con código de éxito 200 y salir
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    ob_end_clean();
    exit;
}

// Cargar las variables de entorno definidas en el archivo local .env
if (file_exists(__DIR__ . '/.env')) {
    foreach (file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $linea) {
        if (strpos($linea, '=') !== false && strpos($linea, '#') !== 0) {
            list($nombre, $valor) = explode('=', $linea, 2);
            $_ENV[trim($nombre)] = trim($valor);
        }
    }
}

// Requerir la configuración de rutas y clases base en español
require_once 'src/configuracion/rutas.php';
require_once CONFIGURACION . 'conexionBD.php';
require_once CONFIGURACION . 'ControladorBase.php';

// Establecer la conexión con la base de datos MySQL
$base_datos = (new ConexionBD())->obtenerConexion();

// Obtener el controlador y método a llamar por medio de parámetros de URL (?c=Categorias&m=listar)
$c = $_GET["c"] ?? null;
$m = $_GET["m"] ?? null;

if (!$c || !$m) {
    http_response_code(400);
    echo json_encode(["error" => "Parámetros c (controlador) o m (método) ausentes"]);
    ob_end_flush();
    exit;
}

// Resolver la ruta del controlador basándose en el estándar
$ruta_controlador = CONTROLADOR . "con$c.php";

if (file_exists($ruta_controlador)) {
    require_once $ruta_controlador;
    $clase_controlador = "Con$c";
    $objeto_controlador = new $clase_controlador($base_datos); 

    // Comprobar si el método solicitado existe en la clase controladora
    if (method_exists($objeto_controlador, $m)) {
        $resultado = $objeto_controlador->$m();
        echo json_encode($resultado);
    } else {
        http_response_code(404);
        echo json_encode(["error" => "Método '" . htmlspecialchars($m) . "' no encontrado en el controlador"]);
    }
} else {
    http_response_code(404);
    echo json_encode(["error" => "Controlador '" . htmlspecialchars($c) . "' no encontrado"]);
}

ob_end_flush();
?>
