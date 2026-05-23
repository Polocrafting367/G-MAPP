<?php
$data = json_decode(file_get_contents('php://input'), true);

// Récupérer l'ID du dossier
$folderId = $data['folderId'] ?? 'notes';

// Définir le chemin du dossier
$parts = explode('_key_', $folderId);
$user = $parts[0];

// Construction du chemin du dossier des tâches
$notesDir = "../data/{$user}_/{$folderId}/";
// Exemple : Ajouter la tâche dans le dossier spécifié
$taskFile = $notesDir . uniqid() . '.json';

$newTask = json_decode(file_get_contents('php://input'), true);
$id = uniqid('note_', true);
$newTask['id'] = $id;
$newTask['dateCreated'] = date('Y-m-d'); // Date de création au format Y-m-d

// Définir la date butoir (optionnelle, vide par défaut si non fournie)
$newTask['dateButoir'] = !empty($newTask['dateButoir']) ? $newTask['dateButoir'] : '';

// Définir la position comme la dernière par défaut
$existingFiles = glob($notesDir . '*.json');
$newTask['position'] = count($existingFiles) + 1;

// Enregistrer la nouvelle tâche
file_put_contents($notesDir . $id . '.json', json_encode($newTask));

// Retourner la tâche ajoutée au client
header('Content-Type: application/json');
echo json_encode($newTask);
?>
