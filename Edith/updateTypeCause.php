<?php
// updateTypeCause.php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $content = file_get_contents('php://input');
    // Chemin vers le fichier Rais.js à mettre à jour (exemple : Work/Rais.js)
    $targetFile = '../Work/Rais.js';

    if (file_put_contents($targetFile, $content) !== false) {
        echo "Le fichier Rais.js a été mis à jour avec succès.";
    } else {
        http_response_code(500);
        echo "Erreur lors de la mise à jour du fichier Rais.js.";
    }
} else {
    http_response_code(405);
    echo "Méthode non autorisée.";
}
?>
