<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Obtenir les données JSON envoyées depuis le frontend
    $data = file_get_contents("php://input");

    if (!$data) {
        http_response_code(400); // Mauvaise requête
        echo "Aucune donnée reçue";
        exit;
    }

    // Valider que les données sont du JSON valide
    $decodedData = json_decode($data, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400); // Mauvaise requête
        echo "Données JSON invalides : " . json_last_error_msg();
        exit;
    }

    // Chemin du fichier regroup.js
    $filePath = '../Priv/regroup.js';
    $backupPath = 'regroup_backup_' . date('Y-m-d_H-i-s') . '.js';

    // Sauvegarder une copie de l'ancien fichier
    if (file_exists($filePath)) {
        if (!copy($filePath, $backupPath)) {
            http_response_code(500); // Erreur serveur
            echo "Erreur lors de la sauvegarde du fichier existant.";
            exit;
        }
    }

    // Préparer les nouvelles données pour `regroup.js`
    $newContent = "const Regroups = " . json_encode($decodedData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . ";";

    // Vérifier les permissions d'écriture
    if (!is_writable(dirname($filePath))) {
        http_response_code(500); // Erreur serveur
        echo "Erreur : le répertoire n'est pas accessible en écriture.";
        exit;
    }

    // Écrire dans le fichier
    if (file_put_contents($filePath, $newContent) === false) {
        http_response_code(500); // Erreur serveur
        echo "Erreur lors de la mise à jour du fichier";
        exit;
    }

    // Réponse en cas de succès
    echo "Fichier mis à jour avec succès. Une sauvegarde a été créée.";
    exit;
} else {
    http_response_code(405); // Méthode non autorisée
    echo "Méthode non autorisée";
    exit;
}
