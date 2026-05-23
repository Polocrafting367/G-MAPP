<?php

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Récupérer le contenu JSON envoyé dans la requête POST
    $payload = json_decode(file_get_contents('php://input'), true);

    // Vérifier que les données incluent bien `order` et `folderId`
    if ($payload && isset($payload['order']) && is_array($payload['order']) && isset($payload['folderId'])) {
        $folderId = $payload['folderId'];
        $order = $payload['order'];

        // Définir le chemin du dossier basé sur `folderId`
$parts = explode('_key_', $folderId);
$user = $parts[0];

// Construction du chemin du dossier des tâches
$notesDir = "../data/{$user}_/{$folderId}/";
        // Vérifier que le dossier existe
        if (!is_dir($notesDir)) {
            http_response_code(400);
            echo json_encode(['error' => "Le dossier spécifié '$folderId' n'existe pas."]);
            exit;
        }

        // Parcourir les données pour mettre à jour les positions
        foreach ($order as $entry) {
            if (isset($entry['id'], $entry['position'])) {
                $id = $entry['id'];
                $position = $entry['position'];

                $filePath = $notesDir . $id . '.json';
                if (file_exists($filePath)) {
                    $data = json_decode(file_get_contents($filePath), true);
                    $data['position'] = $position; // Mettre à jour la position
                    file_put_contents($filePath, json_encode($data));
                }
            }
        }

        echo json_encode(['success' => true]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Données invalides.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée.']);
}
