<?php
header('Content-Type: application/json');

if (isset($_GET['user'])) {
    $username = $_GET['user'];

    // Utiliser Priv uniquement
    $directory = "../data/user/";
    $filePath = "{$directory}{$username}_Priv.csv";

    $fichesPrev = 0;
    $interventionsListPrev = [];

    if (file_exists($filePath)) {
        if (($handle = fopen($filePath, "r")) !== FALSE) {
            $isFirstLine = true;
            while (($data = fgetcsv($handle, 1000, ";")) !== FALSE) {
                if ($isFirstLine) {
                    $isFirstLine = false;
                    continue;
                }
                $fichesPrev++;
                $interventionsListPrev[] = implode("; ", $data);
            }
            fclose($handle);
        }
    }

    echo json_encode([
        'fichesPrev' => $fichesPrev,
        'interventionsListPrev' => $interventionsListPrev
    ]);
} else {
    echo json_encode(['error' => 'Utilisateur non spécifié.']);
}
?>
