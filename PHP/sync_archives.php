<?php
set_time_limit(0);

header("Content-Type: text/plain; charset=utf-8");
header("Access-Control-Allow-Origin: *");

// === Initialisation ===
$groupedData = [];
$nouvellesInterventions = [];

$isReload = isset($_GET['reload']) && $_GET['reload'] == '1';
$sourceDir = $isReload ? '../archive/FIN' : '../archive';
$doneDir = '../archive/FIN';
$outputJson = '../data/interventions.json';
$outputJSFile = '../Story/Préconf.js';
$arborescenceFile = realpath(__DIR__ . '/../Ressources/JS/Lieu.js');

// === Nettoyage si reload ===
if ($isReload) {
    foreach ([$outputJson, $outputJSFile] as $file) {
        if (file_exists($file)) unlink($file);
    }
} else if (file_exists($outputJson)) {
    $existingData = json_decode(file_get_contents($outputJson), true);
    if (is_array($existingData)) {
        foreach ($existingData as $entry) {
$entry['Date intervention'] = corrigerDateVersAAAAMMJJ($entry['Date intervention'] ?? '');
$date = normaliserDate($entry['Date intervention'] ?? '');
$key = ($entry['N° fiche corrective'] ?? '') . '|' . $date . '|' . ($entry['Désignation machine'] ?? '') . '|' . ($entry['Résumé intervention'] ?? '');
            $groupedData[$key] = $entry;
        }
    }
}

// === Lecture CSV ===
$csvFiles = glob("$sourceDir/*.csv");
if (empty($csvFiles)) die();

foreach ($csvFiles as $filePath) {
    $fileName = basename($filePath);
    $isPriv = stripos($fileName, 'Priv') !== false;

    if (($handle = fopen($filePath, 'r')) === false) continue;
    fread($handle, 3) !== "\xEF\xBB\xBF" && rewind($handle);

    if (!($header = fgetcsv($handle, 0, ';'))) {
        fclose($handle);
        continue;
    }

    $header = array_map('trim', $header);

    if (!$isPriv) {
        while (($row = fgetcsv($handle, 0, ';')) !== false) {
            if (count($row) !== count($header)) continue;
            $assoc = array_combine($header, $row);

$assoc['Date intervention'] = corrigerDateVersAAAAMMJJ($assoc['Date intervention'] ?? '');
$key = ($assoc['N° fiche corrective'] ?? '') . '|' . $assoc['Date intervention'] . '|' . ($assoc['Désignation machine'] ?? '') . '|' . ($assoc['Résumé intervention'] ?? '');




            if (!isset($groupedData[$key])) {
                $groupedData[$key] = [
                    'Date intervention' => $assoc['Date intervention'],
                    'Désignation machine' => $assoc['Désignation machine'] ?? '',
                    'Résumé intervention' => $assoc['Résumé intervention'] ?? '',
                    'Personnel' => [],
                    'Nombre d\'heures' => [],
                    'Durée arrêt (h)' => $assoc['Durée arrêt (h)'] ?? '',
                    'N° fiche corrective' => $assoc['N° fiche corrective'] ?? '',

                ];
            }

            $nouvellesInterventions[] = [
                'Date intervention' => $assoc['Date intervention'],
                'Désignation machine' => $assoc['Désignation machine'] ?? '',
                'Résumé intervention' => $assoc['Résumé intervention'] ?? '',
                'Personnel' => $assoc['Personnel'] ?? '',
                'Nombre d\'heures' => $assoc['Nombre d\'heures'] ?? '',
                'Durée arrêt (h)' => $assoc['Durée arrêt (h)'] ?? '',
                'N° fiche corrective' => $assoc['N° fiche corrective'] ?? '',

            ];

$personnel = $assoc['Personnel'] ?? '';
if ($personnel !== '' && !in_array($personnel, $groupedData[$key]['Personnel'])) {
    $groupedData[$key]['Personnel'][] = $personnel;
    $groupedData[$key]['Nombre d\'heures'][] = $assoc['Nombre d\'heures'] ?? '';
}

        }
    }

    fclose($handle);
    rename($filePath, "$doneDir/$fileName");
}

file_put_contents($outputJson, json_encode(array_values($groupedData), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
$interventionsData = array_values($groupedData);

if (!file_exists($arborescenceFile)) die();
$arboContent = file_get_contents($arborescenceFile);
preg_match('/const arborescence\s*=\s*(\{.*\});/s', $arboContent, $match) || die();
$arbo = json_decode($match[1], true);
if (!$arbo) die();

function normaliser($str) {
    return preg_replace('/\s+/', ' ', strtr(strtolower(trim($str)), [
        "é" => "e", "è" => "e", "ê" => "e", "ë" => "e",
        "à" => "a", "â" => "a", "ä" => "a",
        "î" => "i", "ï" => "i",
        "ô" => "o", "ö" => "o",
        "û" => "u", "ü" => "u",
    ]));
}

function collecterTousLieux($lieu, $noeud, &$résultat = []) {
    $résultat[] = normaliser($lieu);
    foreach ($noeud as $sous => $sousNoeud) collecterTousLieux($sous, $sousNoeud, $résultat);
    return $résultat;
}

function collecterRecursif($lieu, $noeud, $data) {
    $lieux = collecterTousLieux($lieu, $noeud);
    return array_filter($data, fn($entry) => in_array(normaliser($entry['Désignation machine'] ?? ''), $lieux));
}

function parcourir($noeud, &$preconf) {
    global $interventionsData;
    foreach ($noeud as $lieu => $sous) {
        $normalLieu = normaliser($lieu);
        $local = count(array_filter($interventionsData, fn($e) => normaliser($e['Désignation machine'] ?? '') === $normalLieu));
        $dataRec = collecterRecursif($lieu, $sous, $interventionsData);
        $preconf[$lieu] = [ 'local' => $local, 'total' => count($dataRec) ];
        if (is_array($sous)) parcourir($sous, $preconf);
    }
}


function corrigerDateVersAAAAMMJJ($dateStr) {
    // Nettoyage : enlever les /, - ou espaces
    $dateStr = preg_replace('/\D/', '', trim($dateStr));

    // Corriger les dates de longueur 7 (ex: 6032025)
    if (strlen($dateStr) === 7) {
        if (preg_match('/^(\d{1})(\d{2})(\d{4})$/', $dateStr, $m)) {
            $dateStr = '0' . $m[1] . $m[2] . $m[3]; // jour sur 1 chiffre
        } elseif (preg_match('/^(\d{2})(\d{1})(\d{4})$/', $dateStr, $m)) {
            $dateStr = $m[1] . '0' . $m[2] . $m[3]; // mois sur 1 chiffre
        }
    } elseif (strlen($dateStr) === 6) {
        // Ex: 51224 → 05/12/2024
        return '2024' . '1205';
    }

    // Détection automatique
    if (strlen($dateStr) === 8) {
        $a = substr($dateStr, 0, 4);
        $b = substr($dateStr, 4, 2);
        $c = substr($dateStr, 6, 2);

        // Cas AAAAMMJJ détecté
        if ($a > 1900 && $a < 2100) return $dateStr;

        // Sinon, on suppose JJMMAAAA
        $jj = substr($dateStr, 0, 2);
        $mm = substr($dateStr, 2, 2);
        $aaaa = substr($dateStr, 4, 4);
        return $aaaa . $mm . $jj;
    }

    // Si format inconnu, retourne tel quel
    return $dateStr;
}
function normaliserDate($dateStr) {
    // Supprimer les séparateurs et espaces
    $dateStr = preg_replace('/\D/', '', trim($dateStr));

    // Compléter avec des zéros si nécessaire
    if (strlen($dateStr) === 7) {
        // Jour ou mois sur 1 chiffre
        if (preg_match('/^(\d{1})(\d{2})(\d{4})$/', $dateStr, $m)) {
            $dateStr = '0' . $m[1] . $m[2] . $m[3]; // ex: 5122024 -> 05122024
        } elseif (preg_match('/^(\d{2})(\d{1})(\d{4})$/', $dateStr, $m)) {
            $dateStr = $m[1] . '0' . $m[2] . $m[3]; // ex: 6032025 -> 06032025
        } elseif (preg_match('/^(\d{1})(\d{1})(\d{4})$/', $dateStr, $m)) {
            $dateStr = '0' . $m[1] . '0' . $m[2] . $m[3]; // ex: 1312024 -> 01012024
        }
    }

    // Si au format JJMMAAAA
    if (preg_match('/^(\d{2})(\d{2})(\d{4})$/', $dateStr, $match)) {
        return $match[3] . $match[2] . $match[1]; // AAAAMMJJ
    }

    // Si au format AAAAMMJJ déjà bon
    if (preg_match('/^\d{8}$/', $dateStr)) {
        if (substr($dateStr, 0, 4) > 1900) return $dateStr;
    }

    return ''; // retour vide si illisible
}


$preconf = [];
parcourir($arbo, $preconf);

$js = "const preConfigurations = {\n";
foreach ($preconf as $lieu => $data) {
    $js .= "  \"" . addslashes($lieu) . "\": { local: {$data['local']}, total: {$data['total']} },\n";
}
$js .= "};\n";
file_put_contents($outputJSFile, $js);

echo json_encode([
    "success" => true,
    "message" => "Script terminé avec succès.",
    "statsCount" => count($preconf)
]);
exit;
