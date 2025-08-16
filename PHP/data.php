<?php
header('Content-Type: application/json');

$dirFIN = '../archive/FIN';
$dirNT = '../archive/NT';
$filesFIN = glob("$dirFIN/*.csv");
$filesNT = glob("$dirNT/*.csv");
$files = array_merge($filesFIN, $filesNT);

$uniqueNames = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['file'])) {
    $file = urldecode($_POST['file']);
    if (file_exists($file)) {
        unlink($file);
        echo json_encode(['status' => 'success', 'message' => 'Fichier supprimé avec succès.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Fichier introuvable.']);
    }
    exit;
}

function generateNameOptions($files, &$uniqueNames) {
    $options = "";
    foreach ($files as $file) {
        $fileName = basename($file);
        $fullName = extractFullName($fileName);
        if (!in_array($fullName, $uniqueNames)) {
            $uniqueNames[] = $fullName;
            $options .= "<option value='$fullName'>$fullName</option>";
        }
    }
    return $options;
}

function generateFileList($files) {
    $fileList = "";
    foreach ($files as $file) {
        $fileName = basename($file);
        $filePath = $file;

        $date = extractDate($fileName);
        $fullName = extractFullName($fileName);
        $fileType = extractFileType($fileName);

        if (!$date || !$fullName) {
            $fileList .= "<tr><td colspan='5'>Pas reconnu comme archive: $fileName</td></tr>";
            continue;
        }

        $fileList .= "<tr data-date='$date' data-fullname='$fullName'>
                        <td>$date</td>
                        <td>$fullName</td>
                        <td>$fileType</td>
                        <td><a href='$filePath' download>Télécharger</a></td>
                        <td><button onclick='deleteFile(\"$filePath\")'>Supprimer</button></td>
                      </tr>";
    }
    return $fileList;
}

// --- Fonctions d'extraction personnalisées ---

function extractDate($fileName) {
    if (preg_match('/^(\d{8})_/', $fileName, $matches)) {
        return $matches[1];
    }
    return null;
}

function extractFullName($fileName) {
    // Ex: 20250325_LELONG Paul_Work_Priv__archive.csv
    if (preg_match('/^\d{8}_([A-Z]+ [\p{L}-]+)(?:_[^_]+)*__archive\.csv/u', $fileName, $matches)) {
        return $matches[1]; // NOM Prénom
    }
    return null;
}


function extractFileType($fileName) {
    // Ex: 20250325_LELONG Paul_Work_Priv__archive.csv
    if (preg_match('/^\d{8}_[A-Z]+ [\p{L}-]+(?:_([^_]+))?(?:_([^_]+))?__archive\.csv/u', $fileName, $matches)) {
        // Priorité au 2e type si présent
        $type = isset($matches[2]) ? strtolower($matches[2]) : (isset($matches[1]) ? strtolower($matches[1]) : '');

        switch ($type) {
            case 'priv':
                return 'Préventif';
            case 'work':
                return 'Correctif';
            case 'pieces':
                return 'Pièces';
            default:
                return 'Autre';
        }
    }
    return 'Autre';
}


// --- Exécution des fonctions ---

$nameOptions = generateNameOptions($files, $uniqueNames);
$fileList = generateFileList($files);

echo json_encode(['nameOptions' => $nameOptions, 'fileList' => $fileList]);
?>
