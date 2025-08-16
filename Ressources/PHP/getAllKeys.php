<?php
header('Content-Type: application/json');

// Vérifier si un nom d'utilisateur est fourni
if (!isset($_GET['username']) || empty($_GET['username'])) {
    echo json_encode(['status' => 'error', 'message' => 'Paramètre username manquant.']);
    exit;
}

$username = preg_replace('/[^a-zA-Z0-9_]/', '', $_GET['username']); // Sanitize username
$dataDirectory = __DIR__ . '/../data/' . $username . '_';

// Vérifier si le répertoire existe
if (!is_dir($dataDirectory)) {
    echo json_encode(['status' => 'success', 'keys' => []]); // Aucun fichier
    exit;
}

// Parcourir tous les fichiers du répertoire utilisateur
$files = scandir($dataDirectory);
$keys = [];

foreach ($files as $file) {
    if ($file !== '.' && $file !== '..') {
        // Extraire la clé du nom du fichier (en supposant le format user_clé)
        $parts = explode('_', $file, 2);
        if (count($parts) === 2) {
            $keys[] = $parts[1];
        }
    }
}

// Retourner les clés trouvées
echo json_encode(['status' => 'success', 'keys' => $keys]);
