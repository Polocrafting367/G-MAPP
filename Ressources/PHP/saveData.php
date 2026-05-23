<?php
// saveData.php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Récupère les données envoyées en JSON
    $input = json_decode(file_get_contents('php://input'), true);
    $username = $input['username'];
    $key = $input['key'];
    $value = $input['value'] ?? null;

    // Dossier où stocker les fichiers JSON
    $dataDir = __DIR__ . '/../../data/' . $username;
    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0777, true); // Crée le dossier utilisateur s'il n'existe pas
    }

    // Chemin du fichier JSON pour chaque clé de l'utilisateur
    $filePath = $dataDir . '/' . $key . '.json';

    // ✅ Sauvegarde directe sans json_encode supplémentaire
    file_put_contents($filePath, $value);

    echo json_encode(['status' => 'success']);
}
?>
