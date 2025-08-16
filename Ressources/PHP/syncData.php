<?php
header('Content-Type: application/json');

// Vérification de la méthode HTTP
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Méthode non autorisée']);
    exit;
}

// Récupération des données envoyées
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Vérification des données
if (!isset($data['actions']) || !isset($data['username'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Données invalides']);
    exit;
}

$actions = $data['actions'];
$username = $data['username'];

// Simuler une connexion à une base de données
$database = new SQLite3('data.db');

// Résultats pour chaque action
$results = [];

// Traitement des actions
foreach ($actions as $action) {
    if (!isset($action['action'], $action['key'])) {
        $results[] = ['status' => 'error', 'message' => 'Action ou clé manquante'];
        continue;
    }

    $actionType = $action['action'];
    $key = $database->escapeString($action['key']);
    $value = isset($action['value']) ? $database->escapeString(json_encode($action['value'])) : null;

    switch ($actionType) {
        case 'update':
            if ($value === null) {
                $results[] = ['status' => 'error', 'message' => 'Valeur manquante pour la mise à jour', 'key' => $key];
                continue;
            }

            $query = "INSERT INTO data (username, `key`, `value`) 
                      VALUES ('$username', '$key', '$value')
                      ON CONFLICT(`key`) DO UPDATE SET `value` = '$value'";
            $success = $database->exec($query);

            if ($success) {
                $results[] = ['status' => 'success', 'message' => 'Mise à jour réussie', 'key' => $key];
            } else {
                $results[] = ['status' => 'error', 'message' => 'Échec de la mise à jour', 'key' => $key];
            }
            break;

        case 'delete':
            $query = "DELETE FROM data WHERE username = '$username' AND `key` = '$key'";
            $success = $database->exec($query);

            if ($success) {
                $results[] = ['status' => 'success', 'message' => 'Suppression réussie', 'key' => $key];
            } else {
                $results[] = ['status' => 'error', 'message' => 'Échec de la suppression', 'key' => $key];
            }
            break;

        default:
            $results[] = ['status' => 'error', 'message' => 'Type d\'action non supporté', 'key' => $key];
            break;
    }
}

// Retour des résultats
echo json_encode(['status' => 'success', 'results' => $results]);
