<?php
// saveData.php — chevauchement semaine de bascule mois (robuste, basé sur la date serveur)

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json; charset=utf-8');

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Payload JSON invalide']);
        exit;
    }

    $key   = $input['key']   ?? null;
    $value = $input['value'] ?? null;

    if (!$key || $value === null) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Champs "key" et "value" requis']);
        exit;
    }

    // Normaliser $value -> tableau d'objets {date, code}
    if (is_string($value)) {
        $decoded = json_decode($value, true);
        if ($decoded !== null) $value = $decoded;
    }
    if (isset($value['date'], $value['code'])) {
        $incoming = [$value];
    } elseif (is_array($value)) {
        $incoming = $value;
    } else {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Format "value" non reconnu']);
        exit;
    }

    // Helpers
    $ymFromIso = function (string $iso): ?string {
        if (preg_match('/^(\d{4}-\d{2})-\d{2}/', $iso, $m)) return $m[1]; // "YYYY-MM"
        return null;
    };
    $dateFromIso = function (string $iso): ?DateTime {
        try { $d = new DateTime($iso); $d->setTime(0,0,0,0); return $d; } catch (Exception $e) { return null; }
    };
    $mondayOf = function (DateTime $d): DateTime {
        $w = (int)$d->format('N'); // 1=lundi..7=dimanche
        $res = clone $d;
        $res->modify('-'.($w-1).' day');
        $res->setTime(0,0,0,0);
        return $res;
    };
    $sundayOf = function (DateTime $d) use (&$mondayOf): DateTime {
        $m = $mondayOf($d);
        $m->modify('+6 day');
        $m->setTime(23,59,59,999000);
        return $m;
    };

    // === Référence sur la DATE SERVEUR (robuste) ===
    $tz = new DateTimeZone('Europe/Paris');
    $today = new DateTime('today', $tz);  // base locale
    $firstOfCurrent = new DateTime($today->format('Y-m-01'), $tz);

    $currYM = $firstOfCurrent->format('Y-m');
    $prevYM = (clone $firstOfCurrent)->modify('-1 day')->format('Y-m');

    // Semaine (lundi→dimanche) qui contient le 1er du MOIS COURANT
    $overlapMon = $mondayOf($firstOfCurrent);
    $overlapSun = (function(DateTime $d) use ($sundayOf){ return $sundayOf($d); })($firstOfCurrent);
    $inOverlapWeek = ($today >= $overlapMon && $today <= $overlapSun);

    // Dossier / fichier
    $dataDir = __DIR__ . '/../../data';
    if (!is_dir($dataDir)) mkdir($dataDir, 0777, true);
    $filePath = $dataDir . '/' . basename($key) . '.json';

    // Charger existant
    $existing = [];
    if (is_file($filePath)) {
        $raw = file_get_contents($filePath);
        $dec = $raw !== false ? json_decode($raw, true) : null;
        if (is_array($dec)) $existing = $dec;
    }

    // Index (YYYY-MM|code) → 1 enregistrement (date la plus récente)
    $byKey = [];

    // 1) Conserver de l'existant:
    //    - Hors chevauchement: uniquement $currYM
    //    - En chevauchement: $currYM + $prevYM
    foreach ($existing as $e) {
        if (!isset($e['date'], $e['code'])) continue;
        $ym = $ymFromIso((string)$e['date']);
        if (!$ym) continue;

        $keep = ($ym === $currYM) || ($inOverlapWeek && $ym === $prevYM);
        if (!$keep) continue;

        $code = (string)$e['code'];
        $k = $ym . '|' . $code;
        // on garde tel quel; si doublon on remplace par le plus récent ci-dessous
        $byKey[$k] = ['date' => (string)$e['date'], 'code' => $code];
    }

    // 2) Intégrer les entrées entrantes:
    //    - Hors chevauchement: n'accepter que $currYM
    //    - En chevauchement: accepter $currYM et $prevYM
    $addedOrUpdated = 0;

    foreach ($incoming as $e) {
        if (!isset($e['date'], $e['code']) || !is_string($e['date']) || !is_string($e['code'])) continue;

        $ym = $ymFromIso($e['date']);
        if (!$ym) continue;

        if ($inOverlapWeek) {
            if (!($ym === $currYM || $ym === $prevYM)) continue;
        } else {
            if ($ym !== $currYM) continue;
        }

        $newDate = $e['date'];
        $dNew = $dateFromIso($newDate);
        if (!$dNew) continue;

        $k = $ym . '|' . $e['code'];
        if (!isset($byKey[$k])) {
            $byKey[$k] = ['date' => $newDate, 'code' => $e['code']];
            $addedOrUpdated++;
        } else {
            $dOld = $dateFromIso($byKey[$k]['date']);
            if (!$dOld || $dNew > $dOld) {
                $byKey[$k] = ['date' => $newDate, 'code' => $e['code']];
                $addedOrUpdated++;
            }
        }
    }

    // 3) Liste finale, on n'écrit que les mois autorisés ici aussi (sécurité)
    $final = array_values(array_filter($byKey, function($row) use ($ymFromIso, $currYM, $prevYM, $inOverlapWeek) {
        $ym = $ymFromIso((string)$row['date']) ?? '';
        if ($inOverlapWeek) return ($ym === $currYM || $ym === $prevYM);
        return ($ym === $currYM);
    }));

    // Tri par date croissante
    usort($final, function ($a, $b) { return strcmp($a['date'], $b['date']); });

    $json = json_encode($final, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'json_encode a échoué']);
        exit;
    }

    $ok = file_put_contents($filePath, $json, LOCK_EX);
    if ($ok === false) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Impossible d’écrire le fichier']);
        exit;
    }

    echo json_encode([
        'status'           => 'success',
        'kept_months'      => $inOverlapWeek ? [$prevYM, $currYM] : [$currYM],
        'overlap_week'     => [
            'active' => $inOverlapWeek,
            'monday' => $overlapMon->format('Y-m-d'),
            'sunday' => $overlapSun->format('Y-m-d'),
        ],
        'total'            => count($final),
        'added_or_updated' => $addedOrUpdated,
        'file'             => basename($filePath),
    ]);
    exit;
}
