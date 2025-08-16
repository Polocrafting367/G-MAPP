<?php
header('Content-Type: application/json');

// Dossier de stockage des fichiers JSON
$dataDir = __DIR__ . '/../data/0_Cintres';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0777, true);
}

// Vérification du paramètre code
if (!isset($_GET['code'])) {
    echo json_encode(["success" => false, "message" => "Code non spécifié"]);
    exit;
}
$code = $_GET['code'];

// Récupérer le paramètre "user" (par défaut "scanner" s'il n'est pas précisé)
$user = isset($_GET['user']) ? $_GET['user'] : 'scanner';

// Date actuelle formatée
$currentDate = date("Y-m-d H:i:s");
$currentYear = date("Y");

$filePath = $dataDir . '/' . $code . '.json';
$statsFilePath = $dataDir . '/00A_stats.json';

if (file_exists($filePath)) {
    // Le fichier existe, on le lit
    $jsonData = file_get_contents($filePath);
    $data = json_decode($jsonData, true);
    if (!$data) {
        $data = [];
    }
    
    $previousLastRead = isset($data['last_read']) ? $data['last_read'] : $currentDate;
    $data['last_read'] = $currentDate;
    
    $newEvent = [
        "date"   => $currentDate,
        "code"   => $code,
        "action" => "Cintre vu",
        "user"   => $user
    ];
    
    $addNewEvent = true;
    if (isset($data['historique']) && count($data['historique']) > 0) {
        $lastIndex = count($data['historique']) - 1;
        $lastEvent = $data['historique'][$lastIndex];
        $lastEventDate = DateTime::createFromFormat("Y-m-d H:i:s", $lastEvent['date']);
        $currentDateObj = new DateTime($currentDate);
        if ($lastEventDate !== false) {
            $diffSeconds = $currentDateObj->getTimestamp() - $lastEventDate->getTimestamp();
            if ($diffSeconds < 30 * 60) {
                $addNewEvent = false;
            }
        }
    }
    if ($addNewEvent) {
        $data['historique'][] = $newEvent;
    }
    file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
} else {
    // Le fichier n'existe pas, on le crée
    $data = [
        "code"          => $code,
        "creation_date" => $currentDate,
        "creator"       => $user,
        "last_read"     => $currentDate,
        "historique"    => [
            [
                "date"   => $currentDate,
                "code"   => $code,
                "action" => "Enregistrement du code",
                "user"   => $user,
            ]
        ]
    ];
    file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Mise à jour des statistiques
$stats = file_exists($statsFilePath) ? json_decode(file_get_contents($statsFilePath), true) : [];
if (!$stats) {
    $stats = [];
}

if (!isset($stats[$currentYear])) {
    $stats[$currentYear] = [];
}

if (!isset($stats[$currentYear][$user])) {
    $stats[$currentYear][$user] = 1;
} else {
    $stats[$currentYear][$user] += 1;
}

file_put_contents($statsFilePath, json_encode($stats, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// Réponse JSON
echo json_encode([
    "exists"        => file_exists($filePath),
    "code"          => $data['code'],
    "creation_date" => $data['creation_date'],
    "creator"       => $data['creator'],
    "last_read"     => $data['last_read'],
    "historique"    => $data['historique'],
    "stats_updated" => true
]);
?>