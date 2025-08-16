<?php
// Créer un fichier contenant la date à la racine
$date = $_POST['date'] ?? date('Y-m-d');
$file = '../date_LM.txt';
file_put_contents($file, $date);
header('Content-Type: application/json');
echo json_encode(['message' => 'Fichier de date créé avec succès']);
?>
