<?php

class ModPlantillas {
    private $archivoJson;

    public function __construct() {
        // La ruta absoluta al archivo JSON
        $this->archivoJson = __DIR__ . '/../datos/plantillas.json';
        
        // Crear el archivo si no existe
        if (!file_exists($this->archivoJson)) {
            if (!is_dir(dirname($this->archivoJson))) {
                mkdir(dirname($this->archivoJson), 0777, true);
            }
            file_put_contents($this->archivoJson, json_encode([]));
        }
    }

    private function leerDatos() {
        $contenido = file_get_contents($this->archivoJson);
        return json_decode($contenido, true) ?: [];
    }

    private function guardarDatos($datos) {
        // Formatear JSON con pretty print para que sea legible
        return file_put_contents($this->archivoJson, json_encode($datos, JSON_PRETTY_PRINT));
    }

    public function listar() {
        return $this->leerDatos();
    }

    public function crear($nombre, $descripcion, $bloques) {
        $plantillas = $this->leerDatos();
        
        // Validación de duplicidad (CU FA 2.3.B)
        $nombreLimpio = trim(strtolower($nombre));
        foreach ($plantillas as $p) {
            if (trim(strtolower($p['nombre'])) === $nombreLimpio) {
                return ["error" => "Ya existe una plantilla con ese nombre."];
            }
        }

        // Generar un ID simple (el máximo actual + 1)
        $maxId = 0;
        foreach ($plantillas as $p) {
            if (isset($p['id']) && $p['id'] > $maxId) {
                $maxId = $p['id'];
            }
        }
        $nuevoId = $maxId + 1;

        $nuevaPlantilla = [
            "id" => $nuevoId,
            "nombre" => trim($nombre),
            "descripcion" => trim($descripcion),
            "bloques" => $bloques,
            // Fecha actual en formato "dd/mm/yyyy" como muestra el frontend
            "fechaCreacion" => date('d/m/Y')
        ];

        $plantillas[] = $nuevaPlantilla;
        $this->guardarDatos($plantillas);

        return $nuevaPlantilla;
    }

    public function editar($id, $nombre, $descripcion, $bloques) {
        $plantillas = $this->leerDatos();
        $nombreLimpio = trim(strtolower($nombre));
        
        // Buscar si existe un nombre duplicado (excluyendo la plantilla actual)
        foreach ($plantillas as $p) {
            if ($p['id'] != $id && trim(strtolower($p['nombre'])) === $nombreLimpio) {
                return ["error" => "Ya existe una plantilla con ese nombre."];
            }
        }

        $encontrado = false;
        foreach ($plantillas as $key => $p) {
            if ($p['id'] == $id) {
                $plantillas[$key]['nombre'] = trim($nombre);
                $plantillas[$key]['descripcion'] = trim($descripcion);
                $plantillas[$key]['bloques'] = $bloques;
                $encontrado = true;
                break;
            }
        }

        if (!$encontrado) {
            return ["error" => "Plantilla no encontrada."];
        }

        $this->guardarDatos($plantillas);
        return ["message" => "Plantilla editada correctamente."];
    }

    public function eliminar($id) {
        $plantillas = $this->leerDatos();
        
        $plantillasFiltradas = array_filter($plantillas, function($p) use ($id) {
            return $p['id'] != $id;
        });

        // Reindexar el array para evitar que se guarde como objeto JSON
        $plantillasLimpias = array_values($plantillasFiltradas);

        $this->guardarDatos($plantillasLimpias);
        return ["message" => "Plantilla eliminada correctamente."];
    }
}
?>
