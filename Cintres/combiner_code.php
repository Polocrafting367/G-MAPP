<?php
header('Content-Type: application/json');

// Répertoire de stockage des fichiers JSON
$dataDir = __DIR__ . '/../data/0_Cintres';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0777, true);
}

// Vérifier les paramètres requis
if (!isset($_GET['code_actuel']) || !isset($_GET['nouveau_code']) || !isset($_GET['best_choice'])) {
    echo json_encode(["success" => false, "message" => "Paramètres manquants"]);
    exit;
}

$codeActuel   = trim($_GET['code_actuel']);
$nouveauCode  = trim($_GET['nouveau_code']);
$bestChoice   = trim($_GET['best_choice']); // "actuel" ou "nouveau"
$user         = isset($_GET['user']) ? $_GET['user'] : 'inconnu';
$currentDate  = date("Y-m-d H:i:s");

// Fonction pour lire l'historique d'un fichier et conserver uniquement les 5 derniers événements
function getHistory($filePath) {
    if (!file_exists($filePath)) {
        return [];
    }
    $jsonData = file_get_contents($filePath);
    $data = json_decode($jsonData, true);
    if (!$data || !isset($data['historique']) || !is_array($data['historique'])) {
        return [];
    }
    // Trier l'historique par date décroissante (les plus récents en premier)
    usort($data['historique'], function($a, $b) {
        return strtotime($b['date']) - strtotime($a['date']);
    });
    // Conserver uniquement les 5 premiers
    return array_slice($data['historique'], 0, 5);
}

// Déterminer le chemin des fichiers pour les deux codes
$fileActuel  = $dataDir . '/' . $codeActuel . '.json';
$fileNouveau = $dataDir . '/' . $nouveauCode . '.json';

// Récupérer les historiques existants (si le fichier existe)
$historyActuel  = getHistory($fileActuel);
$historyNouveau = getHistory($fileNouveau);

// Combiner les historiques (si un des deux n'existe pas, on ignore)
// Combiner les historiques (si un des deux n'existe pas, on ignore)
$combinedHistory = [];
if (!empty($historyActuel)) {
    $combinedHistory = array_merge($combinedHistory, $historyActuel);
}
if (!empty($historyNouveau)) {
    $combinedHistory = array_merge($combinedHistory, $historyNouveau);
}

// Ajouter un événement de combinaison dans l'historique
$combinaisonEvent = [
    "date"   => $currentDate,
    "code"   => ($bestChoice === "actuel" ? $codeActuel : $nouveauCode),
    "action" => "Combinaison de code : " . $codeActuel . " + " . $nouveauCode . " (meilleur: " . ($bestChoice === "actuel" ? $codeActuel : $nouveauCode) . ")",
    "user"   => $user
];
$combinedHistory[] = $combinaisonEvent;

// Si aucun historique n'est trouvé, on peut créer un événement initial
if (empty($combinedHistory)) {
    $combinedHistory[] = [
        "date"   => $currentDate,
        "code"   => ($bestChoice === "actuel" ? $codeActuel : $nouveauCode),
        "action" => "Création du code combiné",
        "user"   => $user
    ];
}

// Trier le tableau combiné par date décroissante
usort($combinedHistory, function($a, $b) {
    return strtotime($b['date']) - strtotime($a['date']);
});


// Conserver uniquement les 5 événements les plus récents
$combinedHistory = array_slice($combinedHistory, 0, 5);

// Déterminer le code final (celui du fichier résultat) en fonction de best_choice
$finalCode = ($bestChoice === "actuel" ? $codeActuel : $nouveauCode);
$finalFile = $dataDir . '/' . $finalCode . '.json';

// Charger le contenu existant du fichier final (s'il existe), sinon créer un nouveau tableau de données
if (file_exists($finalFile)) {
    $jsonData = file_get_contents($finalFile);
    $finalData = json_decode($jsonData, true);
    if (!$finalData) {
        $finalData = [];
    }
} else {
    $finalData = [];
    // Par exemple, enregistrer la date de création et le créateur
    $finalData['creation_date'] = $currentDate;
    $finalData['creator'] = $user;
}

// Mettre à jour le code et la dernière lecture
$finalData['code'] = $finalCode;
$finalData['last_read'] = $currentDate;

// Mettre à jour l'historique avec l'historique combiné
$finalData['historique'] = $combinedHistory;

// Enregistrer dans le fichier final
if (file_put_contents($finalFile, json_encode($finalData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) === false) {
    echo json_encode(["success" => false, "message" => "Erreur lors de l'enregistrement du fichier final."]);
    exit;
}

// Supprimer le fichier non sélectionné s'il existe
if ($bestChoice === "actuel") {
    if (file_exists($fileNouveau)) {
        unlink($fileNouveau);
    }
} else { // best_choice === "nouveau"
    if (file_exists($fileActuel)) {
        unlink($fileActuel);
    }
}

echo json_encode([
    "success"       => true,
    "final_code"    => $finalCode,
    "historique"    => $finalData['historique']
]);
?>
