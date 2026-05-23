<?php

// Récupérer les données JSON envoyées par la requête POST
$data = json_decode(file_get_contents('php://input'), true);

// Vérifier que les paramètres nécessaires sont présents
if (isset($data['id'], $data['importance'], $data['folderId'])) {
    // Récupérer l'ID du dossier
    $folderId = $data['folderId'];

    // Définir le chemin du dossier
$parts = explode('_key_', $folderId);
$user = $parts[0];

// Construction du chemin du dossier des tâches
$notesDir = "../data/{$user}_/{$folderId}/";
    // Vérifier que le dossier existe
    if (!is_dir($notesDir)) {
        echo json_encode(['status' => 'error', 'message' => "Dossier $folderId introuvable."]);
        exit;
    }

    // Chemin du fichier de la tâche
    $filePath = $notesDir . $data['id'] . '.json';

    // Vérifier que le fichier existe
    if (file_exists($filePath)) {
        // Charger la tâche existante
        $task = json_decode(file_get_contents($filePath), true);

        // Mettre à jour l'importance
        $task['importance'] = $data['importance'];

        // Sauvegarder les modifications
        file_put_contents($filePath, json_encode($task));

        // Retourner une réponse de succès
        echo json_encode(['status' => 'success']);
    } else {
        // Retourner une erreur si la tâche n'est pas trouvée
        echo json_encode(['status' => 'error', 'message' => 'Tâche non trouvée.']);
    }
} else {
    // Retourner une erreur si les données sont invalides
    echo json_encode(['status' => 'error', 'message' => 'Données invalides.']);
}
?>
