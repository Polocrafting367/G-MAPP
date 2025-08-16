<?php
// Configuration des dossiers
$userDir = '../data/user';
$archiveDir = '../archive';

// Crée le dossier d'archive s'il n'existe pas
if (!is_dir($archiveDir)) {
    mkdir($archiveDir, 0777, true);
}

// Liste des fichiers CSV
$csvFiles = glob("$userDir/*_Priv.csv");

// Filtrer les fichiers non liés aux pièces
$interventionFiles = array_filter($csvFiles, function($file) {
    return strpos(basename($file), '_pieces') === false;
    return strpos(basename($file), '_Work') === false;

});

// Vérifiez qu'il y a des fichiers à traiter
if (empty($interventionFiles)) {
    http_response_code(500); // ✅ Important pour bloquer le téléchargement
    header('Content-Type: text/plain; charset=UTF-8');
    echo "Aucun fichier d'interventions trouvé.";
    exit;
}


// Préparer les données consolidées
$finalData = [];
$headerAdded = false;
$uniqueIds = [];

foreach ($interventionFiles as $file) {
    $handle = fopen($file, 'r');
    if ($handle === false) {
        continue;
    }

    $bom = fread($handle, 3);
    if ($bom != "\xEF\xBB\xBF") {
        rewind($handle);
    }

    $header = fgetcsv($handle, 0, ';');
    if (!$headerAdded && $header !== false) {
        $finalData[] = implode(';', $header);
        $headerAdded = true;
    }

while (($row = fgetcsv($handle, 0, ';')) !== false) {
    $finalData[] = implode(';', $row);

    // Collecter les IDs distincts
    $id = $row[0]; // Supposé que la première colonne est l'ID
    $uniqueIds[$id] = true;
}

    fclose($handle);

    // Archiver le fichier
    $baseName = pathinfo($file, PATHINFO_FILENAME); // Récupère le nom sans l'extension
    $archivePath = $archiveDir . '/' . date('Ymd') . '_' . $baseName . '__archive.csv';
    rename($file, $archivePath);
}

// Construire le nom du fichier final
$totalInterventions = count($uniqueIds);
$date = date('Ymd');
$fileCount = count($interventionFiles);
$fileName = "{$totalInterventions}_Preventives_{$fileCount}_utilisateur(s)__{$date}_.csv";

// Encode le nom du fichier pour éviter les problèmes avec les caractères spéciaux
$fileName = mb_convert_encoding($fileName, 'ISO-8859-1', 'UTF-8');

// Générer le fichier final avec le bon nom
header('Content-Type: application/csv; charset=UTF-8');
header('Content-Disposition: attachment; filename="' . $fileName);
header('Pragma: no-cache');
header('Expires: 0');

echo "\xEF\xBB\xBF";
// Remplacer les fins de ligne LF par CRLF
echo implode("\r\n", $finalData);
exit;
?>
