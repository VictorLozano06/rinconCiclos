<?php
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

function escaparHtml($valor) {
    return htmlspecialchars((string)$valor, ENT_QUOTES, 'UTF-8');
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Metodo no permitido</title></head><body><p>Este endpoint solo admite POST.</p></body></html>';
    exit;
}

function extraerRolesDesdeTexto($valor) {
    if ($valor === null) {
        return [];
    }

    if (is_array($valor)) {
        return array_values(array_filter(array_map('strval', $valor), function ($item) {
            return trim($item) !== '';
        }));
    }

    $texto = trim((string)$valor);
    if ($texto === '') {
        return [];
    }

    if ($texto[0] === '[' && substr($texto, -1) === ']') {
        $parseado = json_decode($texto, true);
        if (is_array($parseado)) {
            return array_values(array_filter(array_map('strval', $parseado), function ($item) {
                return trim($item) !== '';
            }));
        }
    }

    return array_values(array_filter(array_map('trim', preg_split('/[\s,|;]+/', $texto) ?: []), function ($item) {
        return $item !== '';
    }));
}

function decodificarBase64Url($valor) {
    $valor = strtr((string)$valor, '-_', '+/');
    $padding = strlen($valor) % 4;
    if ($padding > 0) {
        $valor .= str_repeat('=', 4 - $padding);
    }

    $resultado = base64_decode($valor, true);
    return $resultado === false ? null : $resultado;
}

function extraerPayloadToken($token) {
    $token = trim((string)$token);
    if ($token === '') {
        return null;
    }

    $partes = explode('.', $token);
    if (count($partes) < 2) {
        return null;
    }

    $payloadJson = decodificarBase64Url($partes[1]);
    if (!is_string($payloadJson) || trim($payloadJson) === '') {
        return null;
    }

    $payload = json_decode($payloadJson, true);
    return is_array($payload) ? $payload : null;
}

function construirUsuarioDesdePayloadToken($payload) {
    if (!is_array($payload)) {
        return null;
    }

    $fuente = $payload;
    if (isset($payload['data']) && is_array($payload['data'])) {
        $fuente = $payload['data'];
    }

    $roles = [];
    foreach (['roles', 'role', 'rol', 'authorities', 'permissions'] as $claveRoles) {
        if (isset($fuente[$claveRoles])) {
            $roles = extraerRolesDesdeTexto($fuente[$claveRoles]);
            if (!empty($roles)) {
                break;
            }
        }
    }

    $nombre = trim((string)($fuente['nombre'] ?? $fuente['name'] ?? $fuente['given_name'] ?? ''));
    $apellidos = trim((string)($fuente['apellidos'] ?? $fuente['family_name'] ?? ''));

    if ($nombre === '' && isset($fuente['full_name'])) {
        $partesNombre = preg_split('/\s+/', trim((string)$fuente['full_name'])) ?: [];
        $nombre = array_shift($partesNombre) ?? '';
        $apellidos = trim(implode(' ', $partesNombre));
    }

    return [
        'id' => isset($fuente['id']) && $fuente['id'] !== ''
            ? (int)$fuente['id']
            : (isset($payload['sub']) && ctype_digit((string)$payload['sub']) ? (int)$payload['sub'] : null),
        'nombre' => $nombre,
        'apellidos' => $apellidos,
        'email' => trim((string)($fuente['email'] ?? $fuente['mail'] ?? '')),
        'foto' => trim((string)($fuente['foto'] ?? $fuente['picture'] ?? $fuente['avatar'] ?? '')),
        'roles' => $roles
    ];
}

function normalizarUsuarioEntrada($entrada) {
    if (!is_array($entrada)) {
        return null;
    }

    $roles = [];
    if (isset($entrada['roles'])) {
        $roles = extraerRolesDesdeTexto($entrada['roles']);
    } elseif (isset($entrada['role'])) {
        $roles = extraerRolesDesdeTexto($entrada['role']);
    } elseif (isset($entrada['rol'])) {
        $roles = extraerRolesDesdeTexto($entrada['rol']);
    }

    return [
        'id' => isset($entrada['id']) && $entrada['id'] !== '' ? (int)$entrada['id'] : null,
        'nombre' => trim((string)($entrada['nombre'] ?? '')),
        'apellidos' => trim((string)($entrada['apellidos'] ?? '')),
        'email' => trim((string)($entrada['email'] ?? '')),
        'foto' => trim((string)($entrada['foto'] ?? '')),
        'roles' => $roles
    ];
}

function extraerJsonCrudoBody() {
    $raw = file_get_contents('php://input');
    if (!is_string($raw)) {
        return null;
    }

    $raw = trim($raw);
    if ($raw === '' || $raw[0] !== '{' || substr($raw, -1) !== '}') {
        return null;
    }

    $parseado = json_decode($raw, true);
    return is_array($parseado) ? $parseado : null;
}

function obtenerRawBody() {
    $raw = file_get_contents('php://input');
    return is_string($raw) ? $raw : '';
}

function normalizarUsuarioDesdeContenedor($entrada) {
    if (!is_array($entrada)) {
        return null;
    }

    $candidatos = [
        $entrada,
        $entrada['user'] ?? null,
        $entrada['usuario'] ?? null,
        $entrada['auth_user'] ?? null,
        $entrada['user_data'] ?? null,
        $entrada['payload'] ?? null,
        $entrada['data'] ?? null
    ];

    foreach ($candidatos as $candidato) {
        if (is_string($candidato)) {
            $texto = trim($candidato);
            if ($texto !== '' && $texto[0] === '{' && substr($texto, -1) === '}') {
                $candidato = json_decode($texto, true);
            }
        }

        $usuario = normalizarUsuarioEntrada($candidato);
        if ($usuario !== null && !empty($usuario['roles'])) {
            return $usuario;
        }
    }

    return normalizarUsuarioEntrada($entrada);
}

function obtenerUsuarioPost() {
    $candidatosJson = [
        $_POST['user'] ?? null,
        $_POST['usuario'] ?? null,
        $_POST['auth_user'] ?? null,
        $_POST['user_data'] ?? null,
        $_POST['payload'] ?? null,
        $_POST['data'] ?? null
    ];

    foreach ($candidatosJson as $candidato) {
        if (!is_string($candidato)) {
            continue;
        }

        $texto = trim($candidato);
        if ($texto === '' || $texto[0] !== '{' || substr($texto, -1) !== '}') {
            continue;
        }

        $parseado = json_decode($texto, true);
        if (is_array($parseado)) {
            return normalizarUsuarioEntrada($parseado);
        }
    }

    $usuarioFormulario = normalizarUsuarioDesdeContenedor($_POST);
    if ($usuarioFormulario !== null && !empty($usuarioFormulario['roles'])) {
        return $usuarioFormulario;
    }

    $token = $_POST['token'] ?? $_POST['jwt'] ?? $_POST['access_token'] ?? null;
    if (is_string($token) && trim($token) !== '') {
        $usuarioToken = construirUsuarioDesdePayloadToken(extraerPayloadToken($token));
        if ($usuarioToken !== null && !empty($usuarioToken['roles'])) {
            return $usuarioToken;
        }
    }

    $jsonCrudo = extraerJsonCrudoBody();
    if (is_array($jsonCrudo)) {
        $usuarioJson = normalizarUsuarioDesdeContenedor($jsonCrudo);
        if ($usuarioJson !== null) {
            return $usuarioJson;
        }

        $tokenJson = $jsonCrudo['token'] ?? $jsonCrudo['jwt'] ?? $jsonCrudo['access_token'] ?? null;
        if (is_string($tokenJson) && trim($tokenJson) !== '') {
            $usuarioTokenJson = construirUsuarioDesdePayloadToken(extraerPayloadToken($tokenJson));
            if ($usuarioTokenJson !== null && !empty($usuarioTokenJson['roles'])) {
                return $usuarioTokenJson;
            }
        }
    }

    return $usuarioFormulario;
}

function obtenerTokenEntrada() {
    $tokenPost = $_POST['token'] ?? $_POST['jwt'] ?? $_POST['access_token'] ?? null;
    if (is_string($tokenPost) && trim($tokenPost) !== '') {
        return trim($tokenPost);
    }

    $jsonCrudo = extraerJsonCrudoBody();
    if (is_array($jsonCrudo)) {
        $tokenJson = $jsonCrudo['token'] ?? $jsonCrudo['jwt'] ?? $jsonCrudo['access_token'] ?? null;
        if (is_string($tokenJson) && trim($tokenJson) !== '') {
            return trim($tokenJson);
        }
    }

    return null;
}

function obtenerDestinoSeguro() {
    $destino = trim((string)($_POST['redirect'] ?? ''));

    if ($destino === '') {
        $jsonCrudo = extraerJsonCrudoBody();
        if (is_array($jsonCrudo)) {
            $destino = trim((string)($jsonCrudo['redirect'] ?? ''));
        }
    }

    if ($destino === '') {
        return '/';
    }

    if (preg_match('#^/[-a-zA-Z0-9_/?=&%.]*$#', $destino) === 1) {
        return $destino;
    }

    return '/';
}

$usuario = obtenerUsuarioPost();
if ($usuario === null || empty($usuario['roles'])) {
    http_response_code(400);
    $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? 'sin-content-type';
    $postJson = json_encode($_POST, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    $rawBody = obtenerRawBody();
    $jsonBody = extraerJsonCrudoBody();
    $tokenEntrada = obtenerTokenEntrada();
    $payloadToken = $tokenEntrada !== null ? extraerPayloadToken($tokenEntrada) : null;
    $jsonBodyTexto = $jsonBody !== null
        ? json_encode($jsonBody, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT)
        : 'No se pudo parsear como JSON';
    $payloadTokenTexto = $payloadToken !== null
        ? json_encode($payloadToken, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT)
        : 'No se pudo decodificar payload del token';
    $postKeys = implode(', ', array_keys($_POST));

    echo '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Acceso no valido</title>';
    echo '<style>body{font-family:Arial,sans-serif;padding:24px;line-height:1.4}pre{white-space:pre-wrap;background:#f6f8fb;border:1px solid #dbe4f0;border-radius:12px;padding:12px}code{background:#f6f8fb;padding:2px 6px;border-radius:6px}</style>';
    echo '</head><body>';
    echo '<p><strong>No se ha recibido un usuario valido.</strong></p>';
    echo '<p>Metodo: <code>' . escaparHtml($_SERVER['REQUEST_METHOD'] ?? 'desconocido') . '</code></p>';
    echo '<p>Content-Type: <code>' . escaparHtml($contentType) . '</code></p>';
    echo '<p>Claves en $_POST: <code>' . escaparHtml($postKeys !== '' ? $postKeys : '(ninguna)') . '</code></p>';
    echo '<p>$_POST:</p><pre>' . escaparHtml($postJson !== false ? $postJson : 'No serializable') . '</pre>';
    echo '<p>Body bruto:</p><pre>' . escaparHtml($rawBody !== '' ? $rawBody : '(vacio)') . '</pre>';
    echo '<p>Body JSON parseado:</p><pre>' . escaparHtml($jsonBodyTexto !== false ? $jsonBodyTexto : 'No serializable') . '</pre>';
    echo '<p>Payload token decodificado:</p><pre>' . escaparHtml($payloadTokenTexto !== false ? $payloadTokenTexto : 'No serializable') . '</pre>';
    echo '</body></html>';
    exit;
}

$jsonUsuario = json_encode($usuario, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($jsonUsuario === false) {
    http_response_code(500);
    echo '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Error</title></head><body><p>No se ha podido preparar el acceso.</p></body></html>';
    exit;
}

$roles = array_values(array_unique(array_filter(array_map('strval', $usuario['roles']))));
$jsonRoles = json_encode($roles, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$destino = obtenerDestinoSeguro();
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Accediendo a Rincon de Ciclos</title>
    <style>
        body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            font-family: Arial, sans-serif;
            background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
            color: #243043;
        }

        .card {
            width: min(100%, 32rem);
            padding: 2rem;
            border-radius: 1.5rem;
            background: #fff;
            border: 1px solid #dbe7f5;
            box-shadow: 0 1.25rem 2.5rem rgba(36, 48, 67, 0.08);
        }

        h1 {
            margin: 0 0 0.75rem;
            font-size: 1.8rem;
        }

        p {
            margin: 0;
            line-height: 1.5;
            color: #526279;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>Entrando en Rincon de Ciclos</h1>
        <p>Estamos comprobando tus permisos y preparando el acceso.</p>
    </div>

    <script>
        (function () {
            const usuario = <?php echo $jsonUsuario; ?>;
            const roles = <?php echo $jsonRoles; ?>;
            const destino = <?php echo json_encode($destino, JSON_UNESCAPED_SLASHES); ?>;

            sessionStorage.setItem('rinconCiclos.usuario', JSON.stringify(usuario));
            localStorage.setItem('rinconCiclos.usuario', JSON.stringify(usuario));
            sessionStorage.setItem('rinconCiclos.roles', JSON.stringify(roles));
            localStorage.setItem('rinconCiclos.roles', JSON.stringify(roles));

            window.location.replace(destino);
        })();
    </script>
</body>
</html>
