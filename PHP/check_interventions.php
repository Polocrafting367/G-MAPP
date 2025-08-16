<?php
header('Content-Type: application/json');

// Vérifier que le nom de l'utilisateur est passé en paramètre
if (isset($_GET['user'])) {
    $username = $_GET['user'];

    // Déterminer le dossier à utiliser
    $directory = "../data/user/";

    $filePath = "{$directory}{$username}_Work.csv";

    $interventions = 0;
    $interventionsList = [];

    // Vérifier si le fichier existe
    if (file_exists($filePath)) {
        // Lire le fichier CSV et compter les lignes
        if (($handle = fopen($filePath, "r")) !== FALSE) {
            $isFirstLine = true;
            while (($data = fgetcsv($handle, 1000, ";")) !== FALSE) {
                // Ignorer l'en-tête
                if ($isFirstLine) {
                    $isFirstLine = false;
                    continue;
                }
                $interventions++;
                $interventionsList[] = implode("; ", $data); // Ajouter l'intervention à la liste
            }
            fclose($handle);
        }
    }

    // Envoyer la réponse avec le nombre d'interventions
    echo json_encode([
        'interventions' => $interventions,
        'interventionsList' => $interventionsList
    ]);
} else {
    echo json_encode(['error' => 'Utilisateur non spécifié.']);
}
?>
