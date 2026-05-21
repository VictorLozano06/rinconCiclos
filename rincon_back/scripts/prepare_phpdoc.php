<?php

$origen = __DIR__ . '/../vendor/phpdocumentor/reflection/src/phpDocumentor/Reflection/Php';
$destino = __DIR__ . '/../vendor/phpdocumentor/phpdocumentor/vendor/phpdocumentor/reflection/src/phpDocumentor/Reflection/Php';

if (!is_dir($origen) || is_dir($destino)) {
    exit(0);
}

mkdir($destino, 0777, true);

$iterador = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($origen, FilesystemIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST
);

foreach ($iterador as $item) {
    $rutaDestino = $destino . DIRECTORY_SEPARATOR . $iterador->getSubPathName();

    if ($item->isDir()) {
        if (!is_dir($rutaDestino)) {
            mkdir($rutaDestino, 0777, true);
        }

        continue;
    }

    copy($item->getPathname(), $rutaDestino);
}
