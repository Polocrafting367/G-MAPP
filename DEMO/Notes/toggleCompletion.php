<?php

// Récupérer les données envoyées depuis le client
$data = json_decode(file_get_contents('php://input'), true);

// Vérifier si le `folderId` est défini
if (isset($data['folderId']) && isset($data['id'])) {
    $folderId = $data['folderId'];

    // Définir le répertoire des tâches en fonction du folderId
$parts = explode('_key_', $folderId);
$user = $parts[0];

// Construction du chemin du dossier des tâches
$notesDir = "../data/{$user}_/{$folderId}/";
    // Vérifier si le répertoire existe
    if (!is_dir($notesDir)) {
        echo json_encode(['status' => 'error', 'message' => 'Dossier introuvable.']);
        exit;
    }

    // Construire le chemin du fichier de la tâche
    $filePath = $notesDir . $data['id'] . '.json';

    // Vérifier si le fichier de la tâche existe
    if (file_exists($filePath)) {
        $task = json_decode(file_get_contents($filePath), true);

        // Mettre à jour les données de la tâche
        $task['completed'] = $data['completed'];
        $task['realisePar'] = $data['completed'] ? $data['completedBy'] : '';
        $task['dateIntervention'] = $data['completed'] ? $data['dateIntervention'] : '';

        // Sauvegarder les modifications
        file_put_contents($filePath, json_encode($task));

        // Réponse de succès
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Tâche non trouvée.']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Données invalides.']);
}
?>
