<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if ($input === null) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON input']);
    exit;
}

$username = $input['username'] ?? null;
$key = $input['key'] ?? null;

if (!$username || !$key) {
    echo json_encode(['status' => 'error', 'message' => 'Missing username or key']);
    exit;
}

// Sécurisation minimale sans changer l’API
if (strpos($username, '..') !== false || strpos($key, '..') !== false
    || strpos($username, '/') !== false || strpos($username, '\\') !== false
    || strpos($key, '/') !== false || strpos($key, '\\') !== false) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid username or key']);
    exit;
}

$baseDir = realpath(__DIR__ . '/../../data');
if ($baseDir === false) {
    echo json_encode(['status' => 'error', 'message' => 'Base data dir not found']);
    exit;
}

$userDir = $baseDir . DIRECTORY_SEPARATOR . $username;
$filePath = $userDir . DIRECTORY_SEPARATOR . $key . '.json';

$globalAttempts = 0;
$isCRH = function_exists('str_ends_with') ? str_ends_with($key, '_CRH') : (substr($key, -4) === '_CRH');

if (!file_exists($filePath)) {
    echo json_encode([
        'status' => 'file_not_found',
        'message' => 'Key file does not exist',
        'path'   => $filePath
    ]);
    exit;
}

$success = false;
$maxAttempts = 5;

// Retenter la suppression proprement avec invalidation du cache FS
while ($globalAttempts < $maxAttempts && !$success) {
    // tentative
    @unlink($filePath);

    // invalider le cache et attendre un peu pour les FS lents
    clearstatcache(true, $filePath);
    usleep(150000); // 150 ms

    if (!file_exists($filePath)) {
        $success = true;
        break;
    }

    $globalAttempts++;
}

if ($success) {
    echo json_encode([
        'status'   => 'success',
        'message'  => 'File deleted successfully',
        'path'     => $filePath,
        'attempts' => $globalAttempts + 1
    ]);
    exit;
}

// Ici: ÉCHEC RÉEL → ne JAMAIS renvoyer success, même pour CRH
$lastError = error_get_last();
echo json_encode([
    'status'   => 'error',
    'message'  => 'Failed to delete the key file after multiple retries',
    'path'     => $filePath,
    'attempts' => $globalAttempts + 1,
    'php_error'=> $lastError ? ($lastError['message'] ?? null) : null
]);
