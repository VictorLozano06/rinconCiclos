<?php
// Clase encargada de establecer conexiones seguras con las bases de datos MySQL usando PDO.
class ConexionBD {
    private const PERFIL_PRINCIPAL = 'principal';
    private const PERFIL_NUEVO = 'nuevo';

    private static $entornoCargado = false;
    private static $conexiones = [];

    private $perfil;
    private $codificacion = 'utf8mb4';
    public $conexion;

    // Lee los datos de conexion configurados en el archivo local .env.
    public function __construct($perfil = self::PERFIL_PRINCIPAL) {
        $this->cargarEntornoSiHaceFalta();
        $this->perfil = $this->normalizarPerfil($perfil);
    }

    // Abre la conexion solicitada y la devuelve lista para ejecutar consultas SQL.
    public function obtenerConexion($perfil = null) {
        $perfilNormalizado = $this->normalizarPerfil($perfil ?? $this->perfil);

        if (isset(self::$conexiones[$perfilNormalizado]) && self::$conexiones[$perfilNormalizado] instanceof PDO) {
            $this->conexion = self::$conexiones[$perfilNormalizado];
            return $this->conexion;
        }

        $configuracion = $this->obtenerConfiguracionPerfil($perfilNormalizado);
        if (!$configuracion['nombre_bd'] || !$configuracion['usuario']) {
            throw new \RuntimeException("Configuracion de base de datos incompleta para el perfil '" . $perfilNormalizado . "'.");
        }

        try {
            $dsn = "mysql:host=" . $configuracion['servidor']
                . ";dbname=" . $configuracion['nombre_bd']
                . ";charset=" . $this->codificacion;

            $opciones = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            self::$conexiones[$perfilNormalizado] = new PDO(
                $dsn,
                $configuracion['usuario'],
                $configuracion['clave'],
                $opciones
            );
            $this->conexion = self::$conexiones[$perfilNormalizado];
        } catch (PDOException $e) {
            throw new \RuntimeException("Error de conexion a la base de datos (" . $perfilNormalizado . "): " . $e->getMessage());
        }

        return $this->conexion;
    }

    private function normalizarPerfil($perfil) {
        $perfil = strtolower(trim((string)$perfil));

        if (
            $perfil === self::PERFIL_NUEVO ||
            $perfil === 'nueva' ||
            $perfil === 'secundaria' ||
            $perfil === 'profesores'
        ) {
            return self::PERFIL_NUEVO;
        }

        return self::PERFIL_PRINCIPAL;
    }

    private function cargarEntornoSiHaceFalta() {
        if (self::$entornoCargado) {
            return;
        }

        $rutaEnv = __DIR__ . '/../../.env';
        if (file_exists($rutaEnv)) {
            foreach (file($rutaEnv, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $linea) {
                $linea = trim($linea);
                if ($linea === '' || strpos($linea, '#') === 0 || strpos($linea, '=') === false) {
                    continue;
                }

                list($nombre, $valor) = explode('=', $linea, 2);
                $nombre = trim($nombre);

                if (!array_key_exists($nombre, $_ENV) || $_ENV[$nombre] === '') {
                    $_ENV[$nombre] = trim($valor);
                }
            }
        }

        self::$entornoCargado = true;
    }

    private function obtenerConfiguracionPerfil($perfil) {
        $prefijo = $perfil === self::PERFIL_NUEVO ? 'NUEVA_DB_' : 'DB_';

        return [
            'servidor' => $_ENV[$prefijo . 'HOST'] ?? 'localhost',
            'nombre_bd' => $_ENV[$prefijo . 'NAME'] ?? null,
            'usuario' => $_ENV[$prefijo . 'USER'] ?? null,
            'clave' => $_ENV[$prefijo . 'PASS'] ?? '',
        ];
    }
}
?>
