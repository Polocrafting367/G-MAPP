<?php
// Fichier : saveDev.php

$destination = __DIR__ . '/../Dev.txt';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['content'])) {
    $content = $_POST['content'];
    if (file_put_contents($destination, $content) !== false) {
        echo "OK";
    } else {
        http_response_code(500);
        echo "Erreur d'écriture";
    }
} else {
    http_response_code(400);
    echo "Requête invalide";
}
?>
