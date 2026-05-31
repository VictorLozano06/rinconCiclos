<?php
// ─── Decodifica el JWT de la cookie auth_token ───────────────────────────────
function _header_jwt_payload(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    $b64    = strtr($parts[1], '-_', '+/');
    $padded = str_pad($b64, strlen($b64) + (4 - strlen($b64) % 4) % 4, '=');
    $raw    = base64_decode($padded, true);
    return ($raw !== false) ? json_decode($raw, true) : null;
}

$_h_payload = !empty($_COOKIE['auth_token']) ? _header_jwt_payload($_COOKIE['auth_token']) : null;
$_h_d       = $_h_payload['data'] ?? null;
$_h_nombre  = $_h_d['nombre'] ?? null;
$_h_foto    = $_h_d['foto']   ?? null;

// ─── Variables configurables por cada app ────────────────────────────────────
// Define estas variables ANTES del include en tu vista:
//
//   $headerLogo      = 'assets/img/logo.png';          // ruta al logo
//   $headerAppNombre = 'Mi Aplicación';                 // título principal
//   $headerAppSub    = 'Escuela Virgen de Guadalupe';   // subtítulo (opcional)
//   $headerHome      = 'index.php';                     // enlace del logo
//   $headerLogout    = 'index.php?c=Auth&m=logout';     // URL logout servidor
//                                                        // dejar vacío '' para logout solo client-side
//
$_h_logo      = $headerLogo      ?? 'assets/img/logo.png';
$_h_appNombre = $headerAppNombre ?? 'Aplicación EVG';
$_h_appSub    = $headerAppSub    ?? 'Escuela Virgen de Guadalupe';
$_h_home      = $headerHome      ?? 'index.php';
$_h_logout    = $headerLogout    ?? '';
?>
<style>
.evg-header {
    background-color: #0070AB;
    border-bottom: 3px solid #005a8e;
    position: sticky;
    top: 0;
    z-index: 1060;
    box-shadow: 0 2px 8px rgba(0,0,0,.18);
}
.evg-header-inner {
    width: 100%;
    padding: 0 1.5rem;
    height: 54px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}
.evg-header-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    flex-shrink: 0;
}
.evg-header-logo {
    height: 34px;
    width: auto;
    background: white;
    border-radius: 5px;
    padding: 3px 5px;
}
.evg-header-titles {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
}
.evg-header-main {
    font-size: 0.95rem;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 0.5px;
    text-transform: uppercase;
}
.evg-header-sub {
    font-size: 0.7rem;
    color: rgba(255,255,255,.65);
    letter-spacing: 0.2px;
}
.evg-header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}
.evg-header-avatar {
    width: 28px; height: 28px;
    border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,.5);
    object-fit: cover;
    flex-shrink: 0;
}
.evg-header-avatar-ph {
    width: 28px; height: 28px;
    border-radius: 50%;
    background: rgba(255,255,255,.2);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    color: #fff;
    font-size: .85rem;
}
.evg-header-username {
    font-size: 0.85rem;
    color: rgba(255,255,255,.85);
    font-weight: 500;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.evg-header-logout {
    display: flex;
    align-items: center;
    gap: 5px;
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.25);
    color: white;
    font-size: 0.82rem;
    font-weight: 600;
    padding: 5px 12px;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
    transition: background .2s;
    letter-spacing: 0.2px;
}
.evg-header-logout:hover {
    background: rgba(255,255,255,.22);
    color: white;
}
@media (max-width: 576px) {
    .evg-header-username,
    .evg-header-sub { display: none; }
}
</style>

<header class="evg-header">
    <div class="evg-header-inner">

        <!-- Logo + título -->
        <a href="<?= htmlspecialchars($_h_home) ?>" class="evg-header-brand">
            <img src="<?= htmlspecialchars($_h_logo) ?>" alt="<?= htmlspecialchars($_h_appNombre) ?>" class="evg-header-logo">
            <div class="evg-header-titles">
                <span class="evg-header-main"><?= htmlspecialchars($_h_appNombre) ?></span>
                <?php if ($_h_appSub): ?>
                    <span class="evg-header-sub"><?= htmlspecialchars($_h_appSub) ?></span>
                <?php endif; ?>
            </div>
        </a>

        <!-- Usuario + logout -->
        <div class="evg-header-actions">
            <?php if ($_h_foto): ?>
                <img src="<?= htmlspecialchars($_h_foto) ?>" alt="" class="evg-header-avatar" referrerpolicy="no-referrer">
            <?php elseif ($_h_nombre): ?>
                <div class="evg-header-avatar-ph"><i class="bi bi-person-fill"></i></div>
            <?php endif; ?>

            <?php if ($_h_nombre): ?>
                <span class="evg-header-username"><?= htmlspecialchars($_h_nombre) ?></span>
            <?php endif; ?>

            <?php if ($_h_logout): ?>
                <a href="<?= htmlspecialchars($_h_logout) ?>" class="evg-header-logout">
                    <i class="bi bi-box-arrow-right"></i>
                    <span>Salir</span>
                </a>
            <?php else: ?>
                <button class="evg-header-logout" onclick="
                    document.cookie='auth_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
                    window.location.href='<?= htmlspecialchars($_h_home) ?>';
                ">
                    <i class="bi bi-box-arrow-right"></i>
                    <span>Salir</span>
                </button>
            <?php endif; ?>
        </div>

    </div>
</header>
