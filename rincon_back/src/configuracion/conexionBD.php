<?php
// Clase encargada de establecer la conexión segura con la base de datos MySQL usando PDO
class ConexionBD {
    private $servidor;
    private $nombre_bd;
    private $usuario;
    private $clave;
    private $codificacion = 'utf8mb4';
    public $conexion;

    // Lee los datos de conexión configurados en el archivo local .env
    public function __construct() {
        $this->servidor = $_ENV['DB_HOST'] ?? 'localhost';
        $this->nombre_bd = $_ENV['DB_NAME'] ?? null;
        $this->usuario = $_ENV['DB_USER'] ?? null;
        $this->clave = $_ENV['DB_PASS'] ?? '';

        // Fallback: si las variables no están disponibles en $_ENV, intentar cargar el .env local
        if ((!$this->nombre_bd || !$this->usuario) && file_exists(__DIR__ . '/../../.env')) {
            foreach (file(__DIR__ . '/../../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $linea) {
                if (strpos($linea, '=') !== false && strpos(trim($linea), '#') !== 0) {
                    list($nombre, $valor) = explode('=', $linea, 2);
                    $nombre = trim($nombre);
                    $valor = trim($valor);
                    if ($nombre === 'DB_HOST' && !$this->servidor) {
                        $this->servidor = $valor;
                    }
                    if ($nombre === 'DB_NAME' && !$this->nombre_bd) {
                        $this->nombre_bd = $valor;
                    }
                    if ($nombre === 'DB_USER' && !$this->usuario) {
                        $this->usuario = $valor;
                    }
                    if ($nombre === 'DB_PASS' && $this->clave === '') {
                        $this->clave = $valor;
                    }
                }
            }
        }
    }

    // Abre la conexión y la devuelve lista para ejecutar consultas SQL
    public function obtenerConexion() {
        $this->conexion = null;

        if (!$this->nombre_bd || !$this->usuario) {
            http_response_code(500);
            echo json_encode(["error" => "Configuración de base de datos incompleta"]);
            exit;
        }

        try {
            $dsn = "mysql:host=" . $this->servidor . ";dbname=" . $this->nombre_bd . ";charset=" . $this->codificacion;
            
            $opciones = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Activa el lanzamiento de excepciones ante errores SQL
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Devuelve los registros como arrays asociativos
                PDO::ATTR_EMULATE_PREPARES   => false,                  // Desactiva la emulación para mayor seguridad frente a inyección SQL
            ];

            $this->conexion = new PDO($dsn, $this->usuario, $this->clave, $opciones);
            
        } catch (PDOException $e) {
            // Si hay un fallo de conexión, devolvemos un código 500 y finalizamos
            http_response_code(500);
            echo json_encode(["error" => "Error de conexión a la base de datos: " . $e->getMessage()]);
            exit;
        }

        return $this->conexion;
    }
}
?>
