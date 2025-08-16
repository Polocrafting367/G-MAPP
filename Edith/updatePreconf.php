<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = file_get_contents("php://input");

    // Vérification si des données ont été reçues
    if (!$data) {
        http_response_code(400);
        echo "Aucune donnée reçue";
        exit;
    }

    // Décodage des données JSON
    $decodedData = json_decode($data, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo "Données JSON invalides : " . json_last_error_msg();
        exit;
    }

    $filePath = '../Work/Préconf.js';
    $backupPath = 'Préconf_backup_' . date('Y-m-d_H-i-s') . '.js';

    // Sauvegarder une copie de l'ancien fichier
    if (file_exists($filePath)) {
        if (!copy($filePath, $backupPath)) {
            http_response_code(500);
            echo "Erreur lors de la sauvegarde du fichier existant.";
            exit;
        }
    }

    // Générer le contenu du fichier
    $newContent = "const preConfigurations = " . json_encode($decodedData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . ";";

    // Vérifier les permissions du fichier
    if (!is_writable(dirname($filePath))) {
        http_response_code(500);
        echo "Erreur : le répertoire n'est pas accessible en écriture.";
        exit;
    }

    // Écriture dans le fichier
    if (file_put_contents($filePath, $newContent) === false) {
        http_response_code(500);
        echo "Erreur lors de la mise à jour du fichier";
        exit;
    }

    // Réponse réussie
    echo "Fichier mis à jour avec succès.";
    exit;
} else {
    http_response_code(405);
    echo "Méthode non autorisée";
    exit;
}
?>
