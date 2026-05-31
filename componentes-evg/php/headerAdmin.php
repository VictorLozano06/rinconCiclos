<?php
$c = $_GET['c'] ?? 'PanelAdmin';
$m = $_GET['m'] ?? 'inicio';

function sidebarActivo(string $condicion): string {
    return $condicion ? 'active' : '';
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($pageTitle) ? htmlspecialchars($pageTitle) . ' — Aula Matinal' : 'Aula Matinal'; ?></title>
    <link rel="icon" href="assets/img/favicon-img.png" type="image/x-icon">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&display=swap" rel="stylesheet">
    <link href="assets/css/style.css?v=4" rel="stylesheet">
</head>
<body>

<!-- Overlay para móvil -->
<div class="sidebar-overlay" id="sidebarOverlay"></div>

<!-- SIDEBAR -->
<aside class="sidebar" id="sidebar" aria-label="Menú de navegación">

    <nav class="sidebar-nav">

        <div class="sidebar-section-label">Inscripciones</div>

        <a href="index.php?c=GestionInscripciones&m=alumnosinscritos"
           class="sidebar-link <?php echo sidebarActivo($c === 'GestionInscripciones' && in_array($m, ['alumnosinscritos', 'consultardatos', 'modificacionInscripcion', 'modificarinscripcion_completa', 'insertar', 'darDeBaja', 'exportarCSV'])); ?>">
            <i class="bi bi-people-fill"></i>
            <span>Alumnos inscritos</span>
        </a>

        <a href="index.php?c=GestionInscripciones&m=inscripcionesincompletas"
           class="sidebar-link <?php echo sidebarActivo($c === 'GestionInscripciones' && in_array($m, ['inscripcionesincompletas', 'completarInscripcion', 'procesosCompletado'])); ?>">
            <i class="bi bi-clipboard-x-fill"></i>
            <span>Incompletas</span>
        </a>

        <a href="index.php?c=GestionInscripciones&m=alta"
           class="sidebar-link <?php echo sidebarActivo($c === 'GestionInscripciones' && $m === 'alta'); ?>">
            <i class="bi bi-person-plus-fill"></i>
            <span>Añadir alumno</span>
        </a>

        <div class="sidebar-section-label">Remesas</div>

        <a href="index.php?c=Remesas&m=datosMensuales"
           class="sidebar-link <?php echo sidebarActivo($c === 'Remesas' && $m !== 'listarRemesas'); ?>">
            <i class="bi bi-calendar3"></i>
            <span>Datos mensuales</span>
        </a>

        <a href="index.php?c=Remesas&m=listarRemesas"
           class="sidebar-link <?php echo sidebarActivo($c === 'Remesas' && $m === 'listarRemesas'); ?>">
            <i class="bi bi-file-earmark-spreadsheet-fill"></i>
            <span>Consultar remesas</span>
        </a>

        <div class="sidebar-divider"></div>

        <a href="index.php?c=Tarifas&m=tarifas"
           class="sidebar-link <?php echo sidebarActivo($c === 'Tarifas'); ?>">
            <i class="bi bi-cash-coin"></i>
            <span>Tarifas</span>
        </a>

        <div class="sidebar-section-label">Inicio de curso</div>

        <a href="index.php?c=DiasNoLectivos&m=listar"
           class="sidebar-link <?php echo sidebarActivo($c === 'DiasNoLectivos'); ?>">
            <i class="bi bi-calendar-x-fill"></i>
            <span>Días no lectivos</span>
        </a>

        <a href="index.php?c=FechaCurso&m=fechaCurso"
           class="sidebar-link <?php echo sidebarActivo($c === 'FechaCurso'); ?>">
            <i class="bi bi-calendar-range-fill"></i>
            <span>Fecha de curso</span>
        </a>

        <div class="sidebar-divider"></div>

        <a href="../user/index.php?c=ControlAsistencia&m=gestionar"
           target="_blank" rel="noopener noreferrer"
           class="sidebar-link sidebar-link-accent">
            <i class="bi bi-calendar2-check-fill"></i>
            <span>Gestión día a día</span>
        </a>

    </nav>
</aside>

<!-- TOPBAR -->
<header class="topbar">
    <button class="topbar-toggle" id="sidebarToggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="sidebar">
        <i class="bi bi-list"></i>
    </button>
    <a href="index.php?c=PanelAdmin&m=inicio" class="d-flex align-items-center gap-2 text-decoration-none">
        <img src="assets/img/logoEscuela.png" alt="Aula Matinal" class="topbar-logo">
    </a>
    <a href="index.php?c=PanelAdmin&m=inicio" class="topbar-inicio">
        <i class="bi bi-house-fill"></i> Inicio
    </a>
</header>

<script>
    (function () {
        const sidebar  = document.getElementById('sidebar');
        const overlay  = document.getElementById('sidebarOverlay');
        const toggle   = document.getElementById('sidebarToggle');

        function abrir()  { sidebar.classList.add('open'); overlay.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); }
        function cerrar() { sidebar.classList.remove('open'); overlay.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }

        toggle.addEventListener('click', () => sidebar.classList.contains('open') ? cerrar() : abrir());
        overlay.addEventListener('click', cerrar);
    })();
</script>
