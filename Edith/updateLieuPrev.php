<?php
// Vérifie que la méthode utilisée est POST
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    // Vérifie que le contenu du fichier est bien envoyé
    if (isset($_POST["fileContent"])) {
        $content = $_POST["fileContent"];
        // Chemin de destination (assurez-vous que ce chemin est correct par rapport à la position de ce script)
        $filePath = "../Priv/Lieu.js";
        
        // Vérifie que le dossier de destination existe, sinon on le crée
        $directory = dirname($filePath);
        if (!is_dir($directory)) {
            if (!mkdir($directory, 0755, true)) {
                die("Erreur : Impossible de créer le dossier de destination.");
            }
        }
        
        // Écriture du contenu dans le fichier
        if (file_put_contents($filePath, $content) !== false) {
            echo "Fichier exporté avec succès à l'emplacement : $filePath";
        } else {
            echo "Erreur lors de l'exportation du fichier.";
        }
    } else {
        echo "Aucun contenu de fichier fourni.";
    }
} else {
    echo "Méthode de requête invalide. Utilisez POST.";
}
?>
