<?php
header('Content-Type: application/json');

// Répertoire des fichiers JSON
$dataDir = __DIR__ . '/../data/0_Cintres';

if (!isset($_GET['ancien_code']) || !isset($_GET['nouveau_code'])) {
    echo json_encode(["success" => false, "message" => "Paramètres manquants"]);
    exit;
}

$ancienCode = $_GET['ancien_code'];
$nouveauCode = $_GET['nouveau_code'];
$user = isset($_GET['user']) ? $_GET['user'] : 'inconnu';

$ancienFile = $dataDir . '/' . $ancienCode . '.json';
$nouveauFile = $dataDir . '/' . $nouveauCode . '.json';

// Si le fichier d'origine n'existe pas, on vérifie si le fichier renommé existe déjà
if (!file_exists($ancienFile)) {
    if (file_exists($nouveauFile)) {
        // Le fichier a déjà été renommé
        echo json_encode([
            "success" => true,
            "nouveau_code" => $nouveauCode,
            "message" => "Le fichier a déjà été renommé."
        ]);
        exit;
    } else {
        echo json_encode(["success" => false, "message" => "Fichier d'origine non trouvé"]);
        exit;
    }
}

// Charger les données existantes
$jsonData = file_get_contents($ancienFile);
$data = json_decode($jsonData, true);
if (!$data) {
    $data = [];
}

// Ajouter un événement indiquant le changement de code
$currentDate = date("Y-m-d H:i:s");
$event = [
    "date"   => $currentDate,
    "code"   => $ancienCode,
    "action" => "Changement de code vers " . $nouveauCode,
    "user"   => $user
];
if (!isset($data['historique'])) {
    $data['historique'] = [];
}
$data['historique'][] = $event;

// Renommer le fichier
if (rename($ancienFile, $nouveauFile)) {
    // Mettre à jour le code dans le contenu du fichier
    $data['code'] = $nouveauCode;
    file_put_contents($nouveauFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(["success" => true, "nouveau_code" => $nouveauCode]);
} else {
    echo json_encode(["success" => false, "message" => "Erreur lors du renommage du fichier"]);
}
?>
