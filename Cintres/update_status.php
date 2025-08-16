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
$currentDateObj = new DateTime($currentDate);

$filePath = $dataDir . '/' . $code . '.json';
$statsPucePath = $dataDir . '/00A_stats_puce.json';
$statsMecaPath = $dataDir . '/00A_stats_mecanique.json';

if (!file_exists($filePath)) {
    echo json_encode(["success" => false, "message" => "Fichier non trouvé pour le code " . $code]);
    exit;
}

$jsonData = file_get_contents($filePath);
$data = json_decode($jsonData, true) ?: [];

$previousLastRead = isset($data['last_read']) ? $data['last_read'] : $currentDate;
$data['last_read'] = $currentDate;

$newState = [
    "puce"      => isset($_GET['puce']) ? filter_var($_GET['puce'], FILTER_VALIDATE_BOOLEAN) : false,
    "mecanique" => isset($_GET['mecanique']) ? filter_var($_GET['mecanique'], FILTER_VALIDATE_BOOLEAN) : false,
    "ok"        => isset($_GET['ok']) ? filter_var($_GET['ok'], FILTER_VALIDATE_BOOLEAN) : false
];

$actions = [];
if ($newState['puce']) {
    $actions[] = "Puce changé";
    enregistrerStatistique($statsPucePath, $data, 'puce', $currentDateObj);
mettreAJourCompteurReparation($filePath, $data, $currentDateObj, $user);
}
if ($newState['mecanique']) {
    $actions[] = "Révisé mécaniquement";
    enregistrerStatistique($statsMecaPath, $data, 'mecanique', $currentDateObj);
mettreAJourCompteurReparation($filePath, $data, $currentDateObj, $user);
}
if ($newState['ok']) {
    $actions[] = "Cintre OK";
}
if (empty($actions)) {
    $actions[] = "N/A";
}
$actionDescription = "Changement : " . implode(", ", $actions);

$updateEvent = [
    "date"   => $currentDate,
    "code"   => $code,
    "action" => $actionDescription,
    "user"   => $user,
    "state"  => $newState
];

$addNewEvent = true;
if (isset($data['historique']) && count($data['historique']) > 0) {
    $lastIndex = count($data['historique']) - 1;
    $lastEvent = $data['historique'][$lastIndex];
    $lastEventDate = DateTime::createFromFormat("Y-m-d H:i:s", $lastEvent['date']);
    if ($lastEventDate && $currentDateObj->getTimestamp() - $lastEventDate->getTimestamp() < 30 * 60) {
        $data['historique'][$lastIndex] = $updateEvent;
        $addNewEvent = false;
    }
}
if ($addNewEvent) {
    $data['historique'][] = $updateEvent;
}
if (count($data['historique']) > 10) {
    $data['historique'] = array_slice($data['historique'], -10);
}

file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode([
    "success"       => true,
    "code"          => $data['code'],
    "last_read"     => $data['last_read'],
    "historique"    => $data['historique']
]);

function enregistrerStatistique($filePath, &$data, $type, $currentDateObj) {
    if (!isset($data['historique'])) return;
    $stats = file_exists($filePath) ? json_decode(file_get_contents($filePath), true) : ["durations" => [], "count" => 0];
    
    $lastDate = null;
    foreach (array_reverse($data['historique']) as $event) {
        if (isset($event['state'][$type]) && $event['state'][$type]) {
            $lastDate = DateTime::createFromFormat("Y-m-d H:i:s", $event['date']);
            break;
        }
    }
    
    if ($lastDate) {
        $diffDays = $lastDate->diff($currentDateObj)->days;
        $stats['durations'][] = $diffDays;
        $stats['count']++;
    }
    file_put_contents($filePath, json_encode($stats, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}



function mettreAJourCompteurReparation($filePath, &$data, $currentDateObj, $user) {
    // Initialisation du compteur de réparations si absent
    if (!isset($data['compteur_reparations'])) {
        $data['compteur_reparations'] = 1; // Mettre à 1 si elle n'existe pas
    } else {
        if (!isset($data['dernier_repare']) || $currentDateObj->getTimestamp() - strtotime($data['dernier_repare']) > 30 * 60) {
            $data['compteur_reparations']++; // Incrémenter si la réparation est valide
            $data['dernier_repare'] = $currentDateObj->format("Y-m-d H:i:s"); // Mise à jour
            enregistrerStatistiqueUtilisateur($currentDateObj, $user);
        }
    }
}

/**
 * Enregistre le nombre de réparations par utilisateur et par année dans 00A_stats_rep_user.json
 */
function enregistrerStatistiqueUtilisateur($currentDateObj, $user) {
    $statsFilePath = __DIR__ . '/data/00A_stats_rep_user.json';

    // Charger les statistiques existantes ou créer une nouvelle structure
    $stats = file_exists($statsFilePath) ? json_decode(file_get_contents($statsFilePath), true) : [];

    $year = $currentDateObj->format("Y");

    // Initialiser l'année si elle n'existe pas
    if (!isset($stats[$year])) {
        $stats[$year] = [];
    }

    // Initialiser le compteur pour l'utilisateur s'il n'existe pas
    if (!isset($stats[$year][$user])) {
        $stats[$year][$user] = 0;
    }

    // Incrémenter le compteur pour l'utilisateur
    $stats[$year][$user]++;

    // Sauvegarder les mises à jour dans le fichier JSON
    file_put_contents($statsFilePath, json_encode($stats, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

