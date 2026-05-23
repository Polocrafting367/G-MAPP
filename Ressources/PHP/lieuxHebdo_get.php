<?php


// En-tête JSON pour la réponse
header('Content-Type: application/json');

// Vérifier si la requête est de type GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Récupérer les paramètres username et key depuis la requête GET
    $username = $_GET['username'] ?? null;
    $key = $_GET['key'] ?? null;

    // Vérifier si les paramètres nécessaires sont fournis
    if (!$username || !$key) {
        echo json_encode(['status' => 'error', 'message' => 'Missing username or key']);
        exit;
    }

    // Définir le chemin du fichier pour la clé de l'utilisateur
$filePath = __DIR__ . '/../../data/'  . $key . '.json';

if (file_exists($filePath)) {
    $fileContents = file_get_contents($filePath);
    if ($fileContents === false) {
        echo json_encode(['status' => 'error', 'message' => 'Could not read file']);
        exit;
    }
    $userData = json_decode($fileContents, true);
    echo json_encode(['value' => $userData]);
} else {
    echo json_encode(['value' => null]);
}
}
?>
