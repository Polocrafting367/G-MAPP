<?php
header('Content-Type: text/plain');

$user = $_GET['user'] ?? null;
if (!preg_match('/^[\p{L}0-9 _\-]+$/u', $user)) {
    http_response_code(400);
    echo "Paramètre ?user= obligatoire et valide (alphanumérique, tiret, underscore).\n";
    exit;
}

$baseDir = __DIR__ . "/../../data/{$user}_";
if (!is_dir($baseDir)) {
    http_response_code(404);
    echo "Dossier introuvable pour l'utilisateur : $user\n";
    exit;
}

$deleted = 0;
$failures = [];

// Determine if the str_ends_with function is available (PHP >= 8).
$hasStrEndsWith = function_exists('str_ends_with');

foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($baseDir)) as $file) {
    $filename = $file->getFilename();
    $endsWithCrh = $hasStrEndsWith
        ? str_ends_with($filename, '_CRH.json')
        : substr($filename, -9) === '_CRH.json';

    if ($file->isFile() && $endsWithCrh) {
        $full = $file->getPathname();
        if (unlink($full)) {
            echo "✔️ Supprimé : $full\n";
            $deleted++;
        } else {
            $failures[] = $full;
            echo "❌ Échec : $full\n";
        }
    }
}

echo "\nTotal supprimés : $deleted\n";
if (count($failures) > 0) {
    echo "Fichiers non supprimés :\n" . implode("\n", $failures) . "\n";
}
