<?php
$d0 = '../XbGv89Lm.json';
$input = json_decode(file_get_contents('php://input'), true);

if (!file_exists($d0)) {
    file_put_contents($d0, json_encode([]));
}

$users = json_decode(file_get_contents($d0), true);

// Liste des utilisateurs à forcer à la fin
$force_end = ['PRODUCTION .', 'STAGIAIRE BIH', 'Gestion'];

if (isset($input['action'], $input['username'])) {
    $username = $input['username'];

    switch ($input['action']) {
        case 'create':
            if (!isset($users[$username])) {
                $users[$username] = "";
                $users = trierUtilisateurs($users, $force_end);
                file_put_contents($d0, json_encode($users, JSON_PRETTY_PRINT));
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Utilisateur déjà existant.']);
            }
            break;

        case 'delete':
            if (isset($users[$username])) {
                unset($users[$username]);
                $users = trierUtilisateurs($users, $force_end);
                file_put_contents($d0, json_encode($users, JSON_PRETTY_PRINT));
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Utilisateur non trouvé.']);
            }
            break;

        default:
            echo json_encode(['success' => false, 'error' => 'Action non spécifiée ou incorrecte.']);
            break;
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Données manquantes ou action non spécifiée.']);
}

// Fonction pour trier les utilisateurs avec exceptions à la fin
function trierUtilisateurs(array $users, array $fin): array {
    $finFormate = array_flip($fin);
    $triés = [];
    $àFin = [];

    foreach ($users as $nom => $valeur) {
        if (isset($finFormate[$nom])) {
            $àFin[$nom] = $valeur;
        } else {
            $triés[$nom] = $valeur;
        }
    }

    ksort($triés, SORT_NATURAL | SORT_FLAG_CASE);

    return array_merge($triés, $àFin);
}
?>
