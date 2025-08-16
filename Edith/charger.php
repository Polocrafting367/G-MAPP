<?php
header("Content-Type: application/json");

$fichier = "../Priv/Planning.json";
if (!file_exists($fichier)) {
    echo json_encode([
        "parametres" => [],
        "blocs" => [],
        "machines" => []
    ]);
    exit;
}

echo file_get_contents($fichier);
