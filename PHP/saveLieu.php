<?php
// Vérifier si la requête est POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Lire le contenu brut du corps de la requête
    $content = file_get_contents('php://input');

    // Chemin vers le fichier où les données seront sauvegardées
    $filePath = '../Ressources/JS/Lieu.js';

    // Enregistrer le contenu dans le fichier
    if (file_put_contents($filePath, $content) !== false) {
        echo 'Fichier Lieu.js mis à jour avec succès !';
    } else {
        http_response_code(500);
        echo 'Erreur lors de l\'écriture du fichier.';
    }
} else {
    http_response_code(405);
    echo 'Méthode non autorisée.';
}
?>
