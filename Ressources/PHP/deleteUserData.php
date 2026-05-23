<?php
// Activer l'affichage des erreurs pour le débogage
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Définir le type de contenu de la réponse en JSON
header('Content-Type: application/json');

// Récupérer les données envoyées en JSON
$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username'] ?? null;

// Vérifier que le nom d'utilisateur est fourni
if (!$username) {
    echo json_encode(['status' => 'error', 'message' => 'Nom d\'utilisateur non spécifié.']);
    exit;
}

// Construire le chemin du fichier ou du dossier
$filePath = "../../data/" . $username;

// Fonction récursive pour supprimer un dossier et tout son contenu
function deleteDirectory($dirPath) {
    // Si ce n'est pas un dossier, tenter de supprimer comme fichier
    if (!is_dir($dirPath)) {
        return unlink($dirPath); // Supprime le fichier
    }
    // Parcourir le contenu du dossier
    foreach (scandir($dirPath) as $item) {
        if ($item == '.' || $item == '..') continue; // Ignorer les répertoires de navigation
        $itemPath = $dirPath . DIRECTORY_SEPARATOR . $item; // Chemin complet de l'élément
        if (is_dir($itemPath)) {
            deleteDirectory($itemPath); // Appel récursif pour les sous-dossiers
        } else {
            unlink($itemPath); // Supprimer le fichier
        }
    }
    return rmdir($dirPath); // Supprimer le dossier une fois vide
}

// Vérifier si le fichier ou dossier existe, puis tenter de le supprimer
if (file_exists($filePath)) {
    if (deleteDirectory($filePath)) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Erreur lors de la suppression du fichier ou dossier.']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Fichier ou dossier non trouvé.']);
}
?>
