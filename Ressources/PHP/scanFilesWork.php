<?php
header('Content-Type: application/json');

$root = realpath(__DIR__ . '/../../../G-MAPP');

function getFiles($dir) {
    $files = [];
    $items = scandir($dir);
    foreach ($items as $item) {
        if ($item !== "." && $item !== "..") {
            $filePath = $dir . '/' . $item;
            if (is_dir($filePath)) {
                $files = array_merge($files, getFiles($filePath)); // récursif
            } else {
                $files[] = $filePath;
            }
        }
    }
    return $files;
}

$mode = $_GET['mode'] ?? 'Work';

$dirs = [
    "../../../G-MAPP/Ressources/CSS",
    "../../../G-MAPP/Ressources/JS",
    "../../../G-MAPP/Ressources/HTML",
    "../../../G-MAPP/$mode/CSS",
    "../../../G-MAPP/$mode/JS",
    "../../../G-MAPP/$mode/HTML",
];

// Correction pour Lieu.js
if ($mode === 'Priv') {
    $lieuPath = "../../../G-MAPP/Priv/Lieu.js";
} else {
    $lieuPath = "../../../G-MAPP/Ressources/JS/Lieu.js";
}


$requiredFiles = [
    "../../../G-MAPP/$mode/start.html",
    $lieuPath,
    "../../../G-MAPP/Ressources/Pièces.js",
    "../../../G-MAPP/$mode/Préconf.js",
    "../../../G-MAPP/$mode/Rais.js",
    "../../../G-MAPP/$mode/regroup.js",
];
if ($mode === 'Story') {
    $requiredFiles[] = "../../../G-MAPP/data/interventions.json";
}

$allFiles = [];
foreach ($dirs as $dir) {
    if (is_dir($dir)) {
        $allFiles = array_merge($allFiles, getFiles($dir));
    }
}

foreach ($requiredFiles as $file) {
    if (file_exists($file)) {
        $allFiles[] = $file;
    }
}

echo json_encode($allFiles);
?>
