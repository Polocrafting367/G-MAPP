<?php
// Configuration des dossiers
$userDir = '../data/user';

// Liste des fichiers CSV
$csvFiles = glob("$userDir/*.csv");

// Préparer les données pour les interventions et les pièces
$interventionData = [];
$piecesData = [];
$interventionHeaderAdded = false;
$piecesHeaderAdded = false;

foreach ($csvFiles as $file) {
    // Vérifie si le fichier est pour les pièces ou les interventions
    $isPiecesFile = strpos(basename($file), '_pieces') !== false;

    $handle = fopen($file, 'r');
    if ($handle === false) {
        continue;
    }

    $bom = fread($handle, 3);
    if ($bom != "\xEF\xBB\xBF") {
        rewind($handle);
    }

    $header = fgetcsv($handle, 0, ';');
    if ($isPiecesFile) {
        if (!$piecesHeaderAdded && $header !== false) {
            $piecesData[] = implode(';', $header);
            $piecesHeaderAdded = true;
        }
    } else {
        if (!$interventionHeaderAdded && $header !== false) {
            $interventionData[] = implode(';', $header);
            $interventionHeaderAdded = true;
        }
    }

    while (($row = fgetcsv($handle, 0, ';')) !== false) {
        if ($isPiecesFile) {
            $piecesData[] = implode(';', $row);
        } else {
            $interventionData[] = implode(';', $row);
        }
    }

    fclose($handle);
}

// Générer une réponse JSON contenant les deux fichiers
header('Content-Type: application/json; charset=UTF-8');
echo json_encode([
    'interventions' => implode("\n", $interventionData),
    'pieces' => implode("\n", $piecesData),
]);
exit;
?>
