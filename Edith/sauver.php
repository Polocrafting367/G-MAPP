<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo "Méthode non autorisée";
    exit;
}

$donnees = file_get_contents("php://input");
if (json_decode($donnees) === null && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo "JSON invalide";
    exit;
}

file_put_contents("../Priv/Planning.json", $donnees);
echo "Sauvegarde réussie";
