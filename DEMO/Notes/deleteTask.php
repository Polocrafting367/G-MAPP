<?php

// Décoder le contenu JSON de la requête
$data = json_decode(file_get_contents('php://input'), true);

// Récupérer l'ID du dossier (folderId) et l'ID de la tâche
$folderId = $data['folderId'] ?? 'notes'; // Utiliser 'default' si aucun folderId n'est fourni
$id = $data['id'];

// Définir le répertoire des notes en fonction du folderId
$parts = explode('_key_', $folderId);
$user = $parts[0];

// Construction du chemin du dossier des tâches
$notesDir = "../data/{$user}_/{$folderId}/";
// Vérifier si le fichier existe et le supprimer
if (file_exists($notesDir . $id . '.json')) {
    if (unlink($notesDir . $id . '.json')) {
        echo json_encode(['status' => 'success', 'message' => "Tâche $id supprimée avec succès."]);
    } else {
        echo json_encode(['status' => 'error', 'message' => "Erreur lors de la suppression de la tâche $id."]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => "Fichier introuvable pour la tâche $id."]);
}
?>
