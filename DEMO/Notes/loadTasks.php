<?php
// Récupérer le paramètre 'folders' depuis l'URL
$folderId = isset($_GET['folders']) ? $_GET['folders'] : 'notes';

// Définir le chemin du dossier des tâches en fonction de folderId
$parts = explode('_key_', $folderId);
$user = $parts[0];

// Construction du chemin du dossier des tâches
$notesDir = "../data/{$user}_/{$folderId}/";
// Vérifier si le dossier existe, sinon le créer
if (!is_dir($notesDir)) {
    if (!mkdir($notesDir, 0777, true)) { // Crée le dossier avec les permissions 0777
        http_response_code(500);
        echo json_encode(['error' => "Impossible de créer le dossier spécifié ($folderId)."]);
        exit;
    }
}

// Initialiser un tableau pour les tâches
$tasks = [];

// Lire tous les fichiers JSON dans le dossier
foreach (glob($notesDir . '*.json') as $file) {
    $task = json_decode(file_get_contents($file), true);

    // Ajouter des valeurs par défaut si elles ne sont pas présentes
    $task['completed'] = $task['completed'] ?? false;
    $task['dateButoir'] = $task['dateButoir'] ?? '';

    $tasks[] = $task;
}

// Envoyer les tâches au format JSON
header('Content-Type: application/json');
echo json_encode($tasks);
?>
