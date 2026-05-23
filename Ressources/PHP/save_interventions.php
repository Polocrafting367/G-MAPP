<?php
header('Content-Type: application/json');
ini_set('display_errors', 0);
error_reporting(0);
$cleType = $_POST['cleType'] ?? 'Work'; // 'Correctif' ou 'Preventif' (à toi de choisir les libellés)
$userDir = '../../data/user/';
$user = $_POST['user'];
$csvContent = $_POST['csvContent'];

$filePath       = $userDir . $user . '_' . $cleType . '.csv';          // interventions
$piecesFilePath = $userDir . $user . '_' . $cleType . '_pieces.csv';   // ✅ pièces séparées par type

function getInitials($fullName) {
    $parts = explode(' ', trim($fullName));
    $initials = '';
    foreach ($parts as $part) {
        $initials .= strtoupper($part[0]);
    }
    return $initials;
}

function loadInterventionNumbers($user) {
    $dateFilePath = "../../data/{$user}_/Date.json";
    if (file_exists($dateFilePath)) {
        $content = file_get_contents($dateFilePath);
        return json_decode($content, true);
    }
    return [];
}

function saveInterventionNumbers($user, $numbersByDate) {
    $dateFilePath = "../../data/{$user}_/Date.json";
    $existingData = file_exists($dateFilePath) ? json_decode(file_get_contents($dateFilePath), true) : [];
    foreach ($numbersByDate as $date => $number) {
        $existingData[$date] = $number;
    }
    if (count($existingData) > 6) {
        uksort($existingData, function($a, $b) { return strcmp($b, $a); });
        $existingData = array_slice($existingData, 0, 6, true);
    }
    file_put_contents($dateFilePath, json_encode($existingData));
}

if (!isset($_POST['user']) || !isset($_POST['csvContent'])) {
    echo json_encode(['success' => false, 'error' => 'Paramètres manquants.']);
    exit;
}




if (!is_dir($userDir) && !mkdir($userDir, 0777, true)) {
    echo json_encode(['success' => false, 'error' => 'Impossible de créer le répertoire utilisateur.']);
    exit;
}

function loadCSV($filePath, $hasHeader = true, $delimiter = ";") {
    $data = [];
    if (file_exists($filePath)) {
        $file = fopen($filePath, 'r');
        if ($hasHeader) fgetcsv($file);
        while (($line = fgetcsv($file, 0, $delimiter)) !== false) {
            $data[] = $line;
        }
        fclose($file);
    }
    return $data;
}


function parseAndNormalizePieces($raw) {
    $out = [];
    if (!is_string($raw) || trim($raw) === '') {
        return [$out, '[]'];
    }

    // enlève crochets éventuels
    $s = trim($raw);
    if ($s[0] === '[') $s = substr($s, 1);
    if (substr($s, -1) === ']') $s = substr($s, 0, -1);

    if ($s === '') return [$out, '[]'];

    foreach (explode(',', $s) as $chunk) {
        $chunk = trim($chunk);
        if ($chunk === '') continue;

        // coupe la place d'abord
        $left = explode('@', $chunk, 2)[0];   // "ID:Q"
        $parts = explode(':', $left, 2);
        $id  = isset($parts[0]) ? trim($parts[0]) : '';
        $qty = isset($parts[1]) ? (int)trim($parts[1]) : 1;

        if ($id !== '' && $qty > 0) {
            $out[] = [$id, $qty];
        }
    }

    // reconstruit au format "[ID:Q, ID:Q]"
    if (empty($out)) return [$out, '[]'];
    $str = '[' . implode(', ', array_map(function($pq){ return $pq[0].':'.$pq[1]; }, $out)) . ']';
    return [$out, $str];
}



$interventionNumbers = loadInterventionNumbers($user);
$lastNumbersByDate = [];

$existingData = loadCSV($filePath);
$existingPieces = loadCSV($piecesFilePath, true, ";");

// Clé = ID + Date + Personnel
$existingKeys = [];
foreach ($existingData as $line) {
    if (isset($line[0], $line[1], $line[8], $line[10])) {
        $key = $line[0] . '_' . $line[1] . '_' . $line[8];
        $existingKeys[$key] = true;
        $date = $line[1];
        $numero = $line[10];
        $lastNumbersByDate[$date] = max($lastNumbersByDate[$date] ?? 0, intval(substr($numero, -4)));
        $interventionNumbers[$line[0] . '_' . $line[1]] = $numero;
    }
}

$newLines = array_map('trim', explode("\n", $csvContent));
$isHeader = true;

foreach ($newLines as $line) {
    if ($isHeader) { $isHeader = false; continue; }

    $fields = explode(";", $line);
    if (count($fields) < 10) {
        // ligne invalide, on saute
        continue;
    }

    // --- Normaliser la colonne Pièces (index 6): retirer @place ---
    list($piecesParsed, $piecesNormalized) = parseAndNormalizePieces($fields[6] ?? '');
    $fields[6] = $piecesNormalized; // ex: "[ID1:2, ID2:1]"

    $id        = $fields[0];
    $date      = $fields[1];
    $personnel = $fields[8];
    $key       = $id . '_' . $date . '_' . $personnel;

    if (isset($existingKeys[$key])) {
        continue;
    }

    $interventionKey = $id . '_' . $date;
    if (!isset($interventionNumbers[$interventionKey])) {
        $lastNumber = $lastNumbersByDate[$date] ?? ($interventionNumbers[$date] ?? 0);
        $lastNumbersByDate[$date] = $lastNumber + 1;
        $interventionNumbers[$interventionKey] = sprintf(
            "%s%s%04d",
            $date,
            getInitials($user),
            $lastNumbersByDate[$date]
        );
    }

    // injecte n° fiche corrective
    $fields[10] = $interventionNumbers[$interventionKey];

    // empile la ligne normalisée dans le CSV principal
    $existingData[]    = $fields;
    $existingKeys[$key] = true;

    // --- Alimente le CSV pièces avec le parsing déjà fait ---
    if (!empty($piecesParsed)) {
        foreach ($piecesParsed as $pq) {
            list($pieceNumber, $quantity) = $pq; // [$id, $qty]
            $pieceLine = [$fields[10], $pieceNumber, $quantity];
            if (!in_array($pieceLine, $existingPieces, true)) {
                $existingPieces[] = $pieceLine;
            }
        }
    }
}


usort($existingData, function ($a, $b) {
    return strcmp($a[1], $b[1]) ?: strcmp($a[0], $b[0]);
});

$header = "ID;Date intervention;Désignation machine;Type de panne;Cause;Résumé intervention;Pièces;Durée arrêt (h);Personnel;Nombre d'heures;N° fiche corrective\n";
$fileContent = $header . implode("\n", array_map(fn($line) => implode(";", $line), $existingData));
file_put_contents($filePath, $fileContent);

$piecesHeader = "N° fiche corrective;Référence article;Quantité\n";
$piecesContent = $piecesHeader . implode("\n", array_map(fn($line) => implode(";", $line), $existingPieces));
file_put_contents($piecesFilePath, $piecesContent);

saveInterventionNumbers($user, $lastNumbersByDate);

echo json_encode(['success' => true, 'message' => 'Données enregistrées avec succès.']);
