<?php
header('Content-Type: application/json');

$user = $_GET['user'] ?? null;
if (!$user) {
    echo json_encode(['success' => false, 'error' => 'Utilisateur non spécifié']);
    exit;
}

$userDir = '../../data/user/';
$filePath = $userDir . $user . '.csv';

if (!file_exists($filePath)) {
    echo json_encode(['success' => true, 'data' => []]); // Aucun fichier n'existe encore
    exit;
}

$dateToLastNumber = [];
$file = fopen($filePath, 'r');
$isHeader = true;

while (($line = fgetcsv($file, 0, ";")) !== false) {
    if ($isHeader) {
        $isHeader = false; // Ignorer l'en-tête
        continue;
    }

    $date = substr($line[8], 0, 8); // Extraire la date du numéro d'intervention
    $number = intval(substr($line[8], -4)); // Extraire le numéro final

    if (!isset($dateToLastNumber[$date]) || $number > $dateToLastNumber[$date]) {
        $dateToLastNumber[$date] = $number; // Garder le plus grand numéro pour chaque date
    }
}

fclose($file);
echo json_encode(['success' => true, 'data' => $dateToLastNumber]);
