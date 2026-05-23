<?php
// Reconstruction de notesIndex à partir des fichiers Comm_note_X.json

// Sécurisation de l'URL
if (!isset($_GET['user']) || empty($_GET['user'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Paramètre user manquant']);
    exit;
}

$user = urldecode($_GET['user']);

// Protection basique anti injection de chemin (supporte accents, tirets, espaces)
if (preg_match('/[^\p{L}\p{N} _-]/u', $user)) {
    http_response_code(400);
    echo json_encode(['error' => 'Nom d\'utilisateur invalide']);
    exit;
}

$basePath = __DIR__ . "/../../data/{$user}_/";

if (!is_dir($basePath)) {
    http_response_code(404);
    echo json_encode(['error' => 'Dossier utilisateur non trouvé']);
    exit;
}

$files = scandir($basePath);
$notesIndex = [];

// 1. Reconstruire notesIndex
foreach ($files as $file) {
    if (preg_match('/^Comm_note_(\d+)\.json$/', $file, $matches)) {
        $id = $matches[1];  // On récupère le numéro contenu dans le nom du fichier
        $notesIndex[] = "note_" . $id;
    }
}

// 2. Supprimer les dossiers vides du type "${user}_key..."
foreach ($files as $file) {
    $fullPath = $basePath . $file;
    if (is_dir($fullPath) && preg_match("/^" . preg_quote($user, '/') . "_key/", $file)) {
        $subfiles = scandir($fullPath);
        // Si le dossier ne contient que "." et "..", il est vide
        if (count($subfiles) <= 2) {
            rmdir($fullPath);
        }
    }
}

// Tri facultatif
sort($notesIndex);

// Sauvegarde du nouvel index
file_put_contents($basePath . 'notesIndex.json', json_encode($notesIndex, JSON_PRETTY_PRINT));

// Réponse API propre
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'notesIndex' => $notesIndex,
    'count' => count($notesIndex)
]);
?>
