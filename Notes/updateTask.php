<?php

header('Content-Type: application/json');

// Vérifier si la requête est de type POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Décoder les données JSON envoyées dans le corps de la requête
    $data = json_decode(file_get_contents('php://input'), true);

    // Vérifier si les données requises sont présentes
    if (isset($data['id'], $data['note'], $data['intervenant'], $data['folderId'])) {
        // Récupérer l'ID du dossier depuis les données
        $folderId = $data['folderId'];

        // Construire le chemin du dossier basé sur l'ID du dossier
$parts = explode('_key_', $folderId);
$user = $parts[0];

// Construction du chemin du dossier des tâches
$notesDir = "../data/{$user}_/{$folderId}/";
        // Vérifier si le dossier existe
        if (!is_dir($notesDir)) {
            http_response_code(404);
            echo json_encode(['error' => "Dossier '$folderId' introuvable."]);
            exit;
        }

        // Chemin du fichier de la tâche à mettre à jour
        $taskFile = $notesDir . $data['id'] . '.json';

        // Vérifier si le fichier existe
        if (file_exists($taskFile)) {
            // Charger les données existantes de la tâche
            $task = json_decode(file_get_contents($taskFile), true);

            // Mettre à jour les champs modifiés
            $task['note'] = $data['note'] ?? $task['note'];
            $task['intervenant'] = $data['intervenant'] ?? $task['intervenant'];
            $task['dateButoir'] = $data['dateButoir'] ?? $task['dateButoir'];

            // Sauvegarder la tâche mise à jour
            file_put_contents($taskFile, json_encode($task));

            // Retourner la tâche mise à jour
            echo json_encode($task);
        } else {
            // Erreur si la tâche n'est pas trouvée
            http_response_code(404);
            echo json_encode(['error' => 'Tâche introuvable.']);
        }
    } else {
        // Erreur si des données obligatoires manquent
        http_response_code(400);
        echo json_encode(['error' => 'Données invalides.']);
    }
} else {
    // Erreur si la méthode HTTP n'est pas POST
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée.']);
}
?>
