(function(_0x3c9a92, _0x5cfc9a) {
    const _0x5e5c37 = _0x30ee
      , _0x731548 = _0x3c9a92();
    while (!![]) {
        try {
            const _0x5ab420 = parseInt(_0x5e5c37(0xe5)) / 0x1 * (-parseInt(_0x5e5c37(0xd1)) / 0x2) + -parseInt(_0x5e5c37(0xce)) / 0x3 + parseInt(_0x5e5c37(0xc7)) / 0x4 + -parseInt(_0x5e5c37(0xbc)) / 0x5 * (parseInt(_0x5e5c37(0xdc)) / 0x6) + -parseInt(_0x5e5c37(0x100)) / 0x7 + -parseInt(_0x5e5c37(0xb8)) / 0x8 + parseInt(_0x5e5c37(0xb3)) / 0x9 * (parseInt(_0x5e5c37(0xe6)) / 0xa);
            if (_0x5ab420 === _0x5cfc9a)
                break;
            else
                _0x731548['push'](_0x731548['shift']());
        } catch (_0x4b8023) {
            _0x731548['push'](_0x731548['shift']());
        }
    }
}(_0x5e77, 0x5ea9b));
function checkDateTimeInURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const timeParam = urlParams.get('time');

    if (!timeParam) {
        alert('Erreur, merci de vous connecter.');
        window.location.href = window.location.origin + '/G-MAPP/index.html';
        return;
    }

    // Si le paramètre vaut "ok", on ne fait pas la vérification de date
    if (timeParam === "ok") {
        return;
    }

    // Sinon, on s'attend à un format "YYYY-MM-DD_HH:MM:SS"
    const parts = timeParam.split('_');
    if (parts.length !== 2) {
        alert('Paramètre de date invalide.');
        window.location.href = window.location.origin + '/G-MAPP/index.html';
        return;
    }

    const datePart = parts[0]; // ex: "2025-03-14"
    const timePart = parts[1]; // ex: "10:53:33"

    const dateComponents = datePart.split('-').map(Number);
    const timeComponents = timePart.split(':').map(Number);

    if (dateComponents.length !== 3 || timeComponents.length !== 3) {
        alert('Paramètre de date invalide.');
        window.location.href = window.location.origin + '/G-MAPP/index.html';
        return;
    }

    const parsedDate = new Date(
        dateComponents[0],
        dateComponents[1] - 1, // Les mois commencent à 0 en JS
        dateComponents[2],
        timeComponents[0],
        timeComponents[1],
        timeComponents[2]
    );

    const now = new Date();
    // Calcul de la différence en minutes
    const diffInMinutes = Math.abs(now - parsedDate) / (1000 * 60);

    // Si la différence est supérieure à 1 minute (par exemple), on considère que le temps est expiré
    if (diffInMinutes > 1) {
        alert('Temps expiré.');
        window.location.href = window.location.origin + '/G-MAPP/index.html';
    }
}


checkDateTimeInURL();
async function fetchUsers() {
    const _0x197a03 = _0x30ee;
    try {
        const _0x55772d = await fetch(_0x197a03(0xf9))
          , _0x3fcd7f = await _0x55772d['json']()
          , _0x16ec5d = Object[_0x197a03(0xe0)](_0x3fcd7f)['map'](_0x24ee31 => ({
            'username': _0x24ee31,
            'password': _0x3fcd7f[_0x24ee31]
        }));
        displayUsers(_0x16ec5d),
        populateUserSelect(_0x16ec5d);
    } catch (_0x40e010) {
        console[_0x197a03(0xda)](_0x197a03(0xc6), _0x40e010);
    }
}



// Fonction pour charger les données d'un utilisateur et mettre à jour son conteneur
async function loadUserData(user, userDiv) {
    try {
        // Lancer en parallèle les requêtes pour accélérer le chargement
        const [
            interventionsData,
            nonExportedCount,
            prevCSVData,
            nonExportedPrevCount
        ] = await Promise.all([
            // CSV des interventions exportées
            fetchCSV(`../data/user/${user.username}_Work.csv`)
                .catch(error => []), // en cas d'erreur, renvoyer un tableau vide

            // Interventions non exportées depuis le JSON
            (async () => {
                let count = 0;
                try {
                    const jsonResponse = await fetch(`../data/${user.username}_/Work_enregistrements.json`);
                    if (jsonResponse.status === 404) {
                        count = 0;
                    } else if (jsonResponse.ok) {
                        const textData = await jsonResponse.text();
                        count = (textData.match(/zoneTexte1/g) || []).length;
                    }
                } catch (error) {
                    count = 0;
                }
                return count;
            })(),

            // CSV des fiches préventives exportées
            fetchCSV(`../data/user/${user.username}_Priv.csv`)
                .catch(error => []),

            // Fiches préventives non exportées depuis le JSON dédié
            (async () => {
                let count = 0;
                try {
                    const jsonPrevResponse = await fetch(`../data/${user.username}_/Priv_enregistrements.json`);
                    if (jsonPrevResponse.status === 404) {
                        count = 0;
                    } else if (jsonPrevResponse.ok) {
                        const textPrevData = await jsonPrevResponse.text();
                        count = (textPrevData.match(/zoneTexte1/g) || []).length;
                    }
                } catch (error) {
                    count = 0;
                }
                return count;
            })()
        ]);

        const interventionsCount = interventionsData.length;
        const fichesPrevCount = prevCSVData.length;

        // Construire le message à afficher
        let message = `${interventionsCount} intervention(s) exportée(s)<br>${nonExportedCount} intervention(s) non exportée(s)<br><br>${fichesPrevCount} Fiches Prev. exportée(s)<br>${nonExportedPrevCount} Fiches Prev. non exportée(s)`;

        // Construire les boutons conditionnels
        let buttonsHtml = "";
        if (interventionsCount > 0) {
            buttonsHtml += `<button onclick="toggleInterventions('${user.username}')">Voir interventions exportées</button>`;
        }
        if (nonExportedCount > 0) {
            buttonsHtml += `<button style="background-color: Teal;" onclick="window.location.href='../Ressources/index.html?&user=${user.username}&mode=Work&Export=true'">Voir interventions non exportées</button>`;
        }
        buttonsHtml += `<br>`;
        if (fichesPrevCount > 0) {
            buttonsHtml += `<button onclick="toggleInterventionsPrev('${user.username}')">Voir Fiches Prev exportées</button>`;
        }
        if (nonExportedPrevCount > 0) {
            buttonsHtml += `<button style="background-color: Teal;" onclick="window.location.href='../Ressouces/index.html?&user=${user.username}&mode=Priv&Export=true'">Voir Fiches Prev non exportées</button>`;
        }

        // Mettre à jour le contenu du conteneur utilisateur
        userDiv.innerHTML = `
            <h3>${user.username}</h3>
            <p>${message}</p>
            ${buttonsHtml}
            <div id="${user.username}-interventions" style="display:none;">
                ${generateInterventionTable(interventionsData)}
            </div>
            <div id="${user.username}-interventions-prev" style="display:none;">
                ${generateInterventionTablePrev(prevCSVData)}
            </div>
        `;
    } catch (error) {
        console.error(`Erreur lors de la récupération des données pour ${user.username}:`, error);
        userDiv.innerHTML += `<p style="color:red;">Erreur lors du chargement des données.</p>`;
    }
}



async function fetchCSV(url) {
    const response = await fetch(url);
    // Si le serveur renvoie un vrai 404, on renvoie un tableau vide
    if (response.status === 404) {
        return [];
    }
    if (!response.ok) {
        throw new Error(`Erreur lors du chargement du CSV: ${response.statusText}`);
    }
    
    // Vérifier le Content-Type de la réponse
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
        // La réponse semble être une page HTML, on considère que ce n'est pas un CSV valide
        return [];
    }
    
    const csvText = await response.text();
    
    // Vérifier si le contenu ressemble à du HTML (par exemple, commence par <html> ou <!DOCTYPE html>)
    if (csvText.trim().startsWith('<!DOCTYPE html') || csvText.trim().startsWith('<html')) {
        return [];
    }
    
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];
    const headers = lines[0].split(';').map(h => h.trim());
    const data = lines.slice(1).map(line => {
        const values = line.split(';').map(v => v.trim());
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index];
        });
        return obj;
    });
    return data;
}


async function displayUsers(users) {
    const userSection = document.getElementById('userSection');
    userSection.innerHTML = ''; // Réinitialiser la section utilisateur

    users.forEach(user => {
        if (user.username !== 'Gestion') {
            // Créer le conteneur de l'utilisateur avec un message "chargement..."
            const userDiv = document.createElement('div');
            userDiv.className = 'user-info';
            userDiv.innerHTML = `<h3>${user.username}</h3><p>Chargement...</p>`;
            userSection.appendChild(userDiv);

            // Charger les données de cet utilisateur en arrière-plan (de manière parallèle)
            loadUserData(user, userDiv);
        }
    });
}

function generateInterventionTable(coreData, workData) {
    // Si aucune donnée n'est fournie
    if ((!coreData || coreData.length === 0) && (!workData || workData.length === 0)) {
        return "<p>Aucune intervention trouvée.</p>";
    }

    // Début de la table avec les en-têtes modifiées (sans Origine et ID)
    let tableHTML = `
        <table class="intervention-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Désignation</th>
                    <th>Type</th>
                    <th>Cause</th>
                    <th>Résumé</th>
                    <th style="display:none;">Pièces</th>
                    <th>Durée arrêt (h)</th>
                    <th>Personnel</th>
                    <th>Nombre d'heures</th>
                    <th>Numéro d'intervention</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Fonction utilitaire pour obtenir les cellules à partir d'une ligne
    function getCells(row) {
        if (typeof row === 'string') {
            return row.split(';').map(cell => cell.trim());
        } else if (Array.isArray(row)) {
            return row;
        } else if (typeof row === 'object' && row !== null) {
            return Object.values(row);
        }
        return [];
    }

    // Chaque ligne CSV contient les données dans l'ordre suivant :
    // 0: ID, 1: Date, 2: Désignation, 3: Type, 4: Cause, 5: Résumé,
    // 6: Pièces, 7: Durée arrêt (h), 8: Personnel, 9: Nombre d'heures, 10: Numéro d'intervention
    // On souhaite supprimer le 0 (ID) et ne pas ajouter de colonne "Origine".
    // La colonne "Pièces" (index 6) sera insérée mais masquée via CSS.
    function processRows(data, rowClass) {
        let rowsHTML = "";
        data.forEach(row => {
            const cells = getCells(row);
            rowsHTML += `<tr class="${rowClass}">`;
            // On affiche uniquement les colonnes d'indices : 1,2,3,4,5,6,7,8,9,10
            // Pour l'indice 6 (Pièces), on ajoute un style pour masquer la cellule.
            const indicesToShow = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            indicesToShow.forEach(i => {
                if (i === 6) {
                    // Colonne Pièces masquée
                    rowsHTML += `<td style="display:none;">${cells[i] !== undefined ? cells[i] : ""}</td>`;
                } else {
                    rowsHTML += `<td>${cells[i] !== undefined ? cells[i] : ""}</td>`;
                }
            });
            rowsHTML += `</tr>`;
        });
        return rowsHTML;
    }

    // Ajouter les lignes issues de coreData
    if (coreData && coreData.length > 0) {
        tableHTML += processRows(coreData, "zebra-row");
    }
    // Ajouter les lignes issues de workData
    if (workData && workData.length > 0) {
        tableHTML += processRows(workData, "normal-row");
    }

    // Fin de la table
    tableHTML += `
            </tbody>
        </table>
    `;

    return tableHTML;
}


function generateInterventionTablePrev(coreData, workData) {
    // Si aucune donnée n'est fournie
    if ((!coreData || coreData.length === 0) && (!workData || workData.length === 0)) {
        return "<p>Aucune intervention trouvée.</p>";
    }

    // Début de la table avec les entêtes modifiées
    let tableHTML = `
        <table class="intervention-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Numéro de fiche</th>
                    <th>Résumé</th>
                    <th>Durée arrêt (h)</th>
                    <th>Personnel</th>
                    <th>Nombre d'heures</th>
                    <th>Numéro d'export</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Fonction utilitaire pour obtenir les cellules d'une ligne
    function getCells(row) {
        if (typeof row === 'string') {
            return row.split(';').map(cell => cell.trim());
        } else if (Array.isArray(row)) {
            return row;
        } else if (typeof row === 'object' && row !== null) {
            return Object.values(row);
        }
        return [];
    }

    // Fonction pour générer une ligne de tableau à partir d'une ligne CSV
    // On extrait uniquement les colonnes aux indices souhaités :
    // 0: ID, 1: Date, 2: Désignation (Numéro de fiche), 5: Résumé,
    // 7: Durée arrêt (h), 8: Personnel, 9: Nombre d'heures, 10: Numéro d'intervention (Numéro d'export)
    function processRows(rows) {
        let rowsHTML = "";
        const indices = [ 1, 2, 5, 7, 8, 9, 10];
        rows.forEach(row => {
            const cells = getCells(row);
            rowsHTML += "<tr>";
            indices.forEach(i => {
                rowsHTML += `<td>${cells[i] !== undefined ? cells[i] : ""}</td>`;
            });
            rowsHTML += "</tr>";
        });
        return rowsHTML;
    }

    // Ajouter les données "Core" si présentes
    if (coreData && coreData.length > 0) {
        tableHTML += processRows(coreData);
    }

    // Ajouter les données "Work" si présentes
    if (workData && workData.length > 0) {
        tableHTML += processRows(workData);
    }

    // Fin de la table
    tableHTML += `
            </tbody>
        </table>
    `;

    return tableHTML;
}


async function fetchCSVLines(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Erreur lors du chargement du CSV: ${response.statusText}`);
    }
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    return lines; // Retourne un tableau de chaînes
}

function toggleInterventions(_0x537b7c) {
    const _0x43851e = _0x30ee
      , _0x4a4a12 = document['getElementById'](_0x537b7c + _0x43851e(0xf6));
    _0x4a4a12[_0x43851e(0xc3)]['display'] = _0x4a4a12[_0x43851e(0xc3)][_0x43851e(0xb2)] === 'none' ? _0x43851e(0xd7) : 'none';
}
function toggleInterventionsPrev(user) { 
    const _0x43851e = _0x30ee,
          element = document.getElementById(user + '-interventions-prev');
    element.style.display = element.style.display === 'none' ? 'block' : 'none';
}

function _0x30ee(_0x288c1a, _0x3b796c) {
    const _0x5e7798 = _0x5e77();
    return _0x30ee = function(_0x30eed9, _0x3c908e) {
        _0x30eed9 = _0x30eed9 - 0xae;
        let _0x33bd4d = _0x5e7798[_0x30eed9];
        return _0x33bd4d;
    }
    ,
    _0x30ee(_0x288c1a, _0x3b796c);
}
function _0x5e77() {
    const _0x46cafd = ['display', '9RWFKgK', 'Échec\x20de\x20la\x20communication\x20avec\x20le\x20serveur', 'interventionsList', 'interventions', 'application/json', '5317528iVPKsB', 'Temps\x20de\x20connextion\x20dépassé.\x20Veuillez\x20vous\x20reconnecter.', 'value', 'createElement', '70235FxNTIR', 'feedback', 'Erreur\x20lors\x20de\x20la\x20modification', 'La\x20mise\x20à\x20jour\x20du\x20serveur\x20a\x20échoué', '</td>', 'getElementById', 'Vraiment\x20supprimé\x20?\x20cela\x20n\x27efface\x20pas\x20les\x20dernière\x20inter\x20et\x20les\x20archives', 'style', 'userSelect', 'action', 'Erreur\x20lors\x20de\x20la\x20récupération\x20des\x20utilisateurs:', '1855056eDAvaw', 'newUsername', '../PHP/manageUsers.php', '<p>Aucune\x20intervention\x20trouvée.</p>', '</h2>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p>', 'time', 'user-window', '76389YiMbBW', 'success', 'split', '698894yBtXSb', 'Erreur:', 'json', '\x0a\x20\x20\x20\x20\x20\x20\x20\x20<table\x20class=\x22intervention-table\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<thead>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<tr>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th>Date\x20intervention</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th>Désignation\x20machine</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th>Type\x20de\x20panne</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th>Cause</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th>Résumé\x20intervention</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th>Durée\x20arrêt\x20(h)</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th>Personnel</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<th>Nombre\x20d\x27heures</th>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</tr>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</thead>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<tbody>\x0a\x20\x20\x20\x20', 'get', 'confirm', 'block', '-interventions\x22\x20style=\x22display:none;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20', 'forEach', 'error', 'Êtes-vous\x20sûr\x20de\x20vouloir\x20créer?', '270CeWaMZ', 'appendChild', 'href', 'delete', 'keys', 'username', 'create', '</tr>', 'Erreur\x20lors\x20de\x20la\x20création.', '2iykRoT', '23529250QBbDbE', 'textContent', 'Erreur\x20lors\x20de\x20la\x20récupération\x20des\x20interventions\x20pour\x20', 'option', '\x20interventions\x20depuis\x20le\x20dernier\x20export</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20onclick=\x22toggleInterventions(\x27', 'password', 'POST', '../PHP/G-MAPPs.php', 'Utilisateur\x20supprimé\x20avec\x20succès!', 'Erreur\x20lors\x20de\x20la\x20création\x20de\x20l’utilisateur:\x20', 'innerHTML', 'Content-Type', 'message', 'modify', 'trim', 'length', '-interventions', '<td>', 'Gestion', '../XbGv89Lm.json', 'abs', 'Modifier\x20le\x20mot\x20de\x20passe\x20?', 'Erreur\x20lors\x20de\x20la\x20modification:\x20', 'Nouvel\x20utilisateur\x20créé\x20!', '../index.html', 'Erreur\x20lors\x20de\x20la\x20suppression\x20de\x20l’utilisateur:\x20', '2854509PPOdkM', 'location', '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<h2>', 'className', 'stringify'];
    _0x5e77 = function() {
        return _0x46cafd;
    }
    ;
    return _0x5e77();
}
function populateUserSelect(_0x25f6d6) {
    const _0x445508 = _0x30ee
      , _0xc24739 = document[_0x445508(0xc1)]('userSelect');
    _0xc24739[_0x445508(0xf0)] = '',
    _0x25f6d6[_0x445508(0xd9)](_0x427063 => {
        const _0x2b6f21 = _0x445508;
        if (_0x427063[_0x2b6f21(0xe1)] !== 'Gestion') {
            const _0x7fb702 = document[_0x2b6f21(0xbb)]('option');
            _0x7fb702[_0x2b6f21(0xba)] = _0x427063[_0x2b6f21(0xe1)],
            _0x7fb702[_0x2b6f21(0xe7)] = _0x427063['username'],
            _0xc24739[_0x2b6f21(0xdd)](_0x7fb702);
        }
    }
    );
}
function populateUserSelect(_0x11a3d5) {
    const _0x3329e7 = _0x30ee
      , _0x54e766 = document[_0x3329e7(0xc1)](_0x3329e7(0xc4));
    _0x54e766[_0x3329e7(0xf0)] = '',
    _0x11a3d5[_0x3329e7(0xd9)](_0x23fcb4 => {
        const _0x55fd0b = _0x3329e7;
        if (_0x23fcb4['username'] !== 'Gestion') {
            const _0x43cb2c = document[_0x55fd0b(0xbb)](_0x55fd0b(0xe9));
            _0x43cb2c[_0x55fd0b(0xba)] = _0x23fcb4['username'],
            _0x43cb2c[_0x55fd0b(0xe7)] = _0x23fcb4[_0x55fd0b(0xe1)],
            _0x54e766['appendChild'](_0x43cb2c);
        }
    }
    );
}
async function modifierMotDePasse() {
    const username = document.getElementById('userSelect').value;
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    if (!username) {
        alert('Veuillez sélectionner un utilisateur.');
        return;
    }

    try {
        const response = await fetch('../PHP/manageUsers.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'modify',
                username: username,
                oldPassword: oldPassword, // Peut être vide
                newPassword: newPassword, // Peut être vide
            }),
        });

        const result = await response.json();
        document.getElementById('feedback').textContent = result.success
            ? 'Mot de passe modifié avec succès.'
            : `Erreur : ${result.error || 'Action impossible.'}`;
    } catch (error) {
        console.error('Erreur lors de la modification :', error);
    }
}

async function supprimerUtilisateur() {
    const username = document.getElementById('userSelect').value;
    const oldPassword = document.getElementById('oldPassword').value;

    if (!username) {
        alert('Veuillez sélectionner un utilisateur.');
        return;
    }

    const confirmation = confirm(`Confirmer la suppression de l'utilisateur "${username}" ?`);
    if (!confirmation) return;

    try {
        const response = await fetch('../PHP/manageUsers.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'delete',
                username: username,
                oldPassword: oldPassword,
            }),
        });

        const result = await response.json();
        document.getElementById('feedback').textContent = result.success
            ? 'Utilisateur supprimé avec succès.'
            : `Erreur : ${result.error || 'Action impossible.'}`;
    } catch (error) {
        console.error('Erreur lors de la suppression :', error);
    }
}


async function creerUtilisateur() {
    const confirmation = window.confirm('Êtes-vous sûr de vouloir créer?');
    if (!confirmation) return;

    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('createPassword').value.trim();
    const feedbackEl = document.getElementById('feedback');


if (!username) {
    feedbackEl.textContent = 'Nom d’utilisateur requis.';
    return;
}


    try {
        const response = await fetch('../PHP/manageUsers.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create',
                username: username,
                password: password
            })
        });

        const result = await response.json();

        if (result.success) {
            feedbackEl.textContent = 'Nouvel utilisateur créé !';
            fetchUsers(); // Recharge la liste
        } else {
            feedbackEl.textContent = result.error || 'La mise à jour du serveur a échoué';
        }
    } catch (err) {
        console.error('Erreur lors de la création de l’utilisateur:', err);
        feedbackEl.textContent = 'Erreur : ' + err.message;
    }
}

fetchUsers();
function genererInterventions() {
    // Télécharger les interventions
    fetch('../PHP/generate_interventions.php')
        .then(response => {
if (!response.ok) {
    return response.text().then(text => {
        throw new Error(text || 'Erreur lors de la génération du fichier des interventions');
    });
}

            // Récupérer le nom du fichier depuis l'en-tête Content-Disposition
            const disposition = response.headers.get('Content-Disposition');
            let filename = 'interventions.csv'; // Valeur par défaut si le nom n'est pas trouvé
            if (disposition && disposition.includes('filename=')) {
                filename = disposition.split('filename=')[1].replace(/"/g, '');
            }
            return response.blob().then(blob => ({ blob, filename }));
        })
        .then(({ blob, filename }) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename; // Utilise le nom récupéré
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            // Télécharger les pièces après la fin du premier téléchargement
            //return fetch('../PHP/generate_pieces.php');
            // Code temporaires :
return Promise.resolve({
    ok: true,
    headers: new Headers({ 'Content-Disposition': 'filename=pieces.csv' }),
    blob: () => Promise.resolve(new Blob())
});
        })
        .then(response => {
if (!response.ok) {
    return response.text().then(text => {
        throw new Error(text || 'Erreur lors de la génération du fichier des interventions');
    });
}

            // Récupérer le nom du fichier depuis l'en-tête Content-Disposition
            const disposition = response.headers.get('Content-Disposition');
            let filename = 'pieces.csv'; // Valeur par défaut si le nom n'est pas trouvé
            if (disposition && disposition.includes('filename=')) {
                filename = disposition.split('filename=')[1].replace(/"/g, '');
            }
            return response.blob().then(blob => ({ blob, filename }));
        })
.then(({ blob, filename }) => {
    // const url = window.URL.createObjectURL(blob);
    // const a = document.createElement('a');
    // a.style.display = 'none';
    // a.href = url;
    // a.download = filename; // Utilise le nom récupéré
    // document.body.appendChild(a);
    // a.click();
    // window.URL.revokeObjectURL(url);

    // Continuer la chaîne de promesses sans télécharger le fichier
    return fetch('../PHP/create_date_file.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: new Date().toISOString().split('T')[0] })
    });
})

        .then(response => {
if (!response.ok) {
    return response.text().then(text => {
        throw new Error(text || 'Erreur lors de la génération du fichier des interventions');
    });
}

            lancerScriptPHP('../PHP/sync_archives.php');
            alert('Tous les fichiers ont été générés avec succès!');

        })
        .catch(error => {
            console.error(error);
            alert('Erreur de génération (aucun fichier trouver ou autre).');
        });

}

function lancerScriptPHP(url, onSuccessMessage = 'Script exécuté avec succès.', onErrorMessage = 'Erreur lors de l\'exécution du script des archives.') {
  
 const messageDiv = document.createElement('div');
      messageDiv.innerText = '✅ Données mises à jour. Rechargement en cours...';
      messageDiv.style.position = 'fixed';
      messageDiv.style.top = '50%';
      messageDiv.style.left = '50%';
      messageDiv.style.transform = 'translate(-50%, -50%)';
      messageDiv.style.backgroundColor = '#2ecc71';
      messageDiv.style.color = 'white';
      messageDiv.style.padding = '20px';
      messageDiv.style.borderRadius = '8px';
      messageDiv.style.fontSize = '18px';
      messageDiv.style.zIndex = 9999;
      document.body.appendChild(messageDiv);

  
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error(onErrorMessage);
      return response.json(); // JSON attendu
    })
    .then(result => {
      console.log("✅", result.message || "OK");

      // 🔵 Afficher un message temporaire
     
      // 🔁 Redirection après 2 secondes
      setTimeout(() => {
        window.location.href = 'Gest.html?time=ok';
      }, 2000);
    })
    .catch(error => {
      console.error(error);
      alert(error.message || onErrorMessage);
    });
}



function genererInterventionstest() {
    fetch('../PHP/G-MAPPstest.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur de génération (aucun fichier trouver ou autre)');
            }
            return response.json();
        })
        .then(data => {
            // Télécharger les interventions
            const interventionsBlob = new Blob([data.interventions], { type: 'text/csv;charset=utf-8;' });
            const interventionsUrl = window.URL.createObjectURL(interventionsBlob);
            const interventionsLink = document.createElement('a');
            interventionsLink.style.display = 'none';
            interventionsLink.href = interventionsUrl;
            interventionsLink.download = 'interventions_test.csv'; // Nom du fichier pour le test
            document.body.appendChild(interventionsLink);
            interventionsLink.click();
            window.URL.revokeObjectURL(interventionsUrl);

            // Télécharger les pièces
            const piecesBlob = new Blob([data.pieces], { type: 'text/csv;charset=utf-8;' });
            const piecesUrl = window.URL.createObjectURL(piecesBlob);
            const piecesLink = document.createElement('a');
            piecesLink.style.display = 'none';
            piecesLink.href = piecesUrl;
            piecesLink.download = 'pieces_test.csv'; // Nom du fichier pour le test
            document.body.appendChild(piecesLink);
            piecesLink.click();
            window.URL.revokeObjectURL(piecesUrl);
        })
        .catch(error => {
            console.error(error);
            alert('Erreur de génération (aucun fichier trouver ou autre) de test.');
        });
}


function genererInterventionsZeb() {
    // Télécharger les interventions
    fetch('../PHP/generate_interventionsZeb.php')
        .then(response => {
if (!response.ok) {
    return response.text().then(text => {
        throw new Error(text || 'Erreur lors de la génération du fichier des interventions');
    });
}

            // Récupérer le nom du fichier depuis l'en-tête Content-Disposition
            const disposition = response.headers.get('Content-Disposition');
            let filename = 'interventions.csv'; // Valeur par défaut si le nom n'est pas trouvé
            if (disposition && disposition.includes('filename=')) {
                filename = disposition.split('filename=')[1].replace(/"/g, '');
            }
            return response.blob().then(blob => ({ blob, filename }));
        })
        .then(({ blob, filename }) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename; // Utilise le nom récupéré
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            // Télécharger les pièces après la fin du premier téléchargement

// return fetch('../PHP/generate_piecesZeb.php');

// Code temporaire :
return Promise.resolve({
    ok: true,
    headers: new Headers({ 'Content-Disposition': 'filename=pieces.csv' }),
    blob: () => Promise.resolve(new Blob())
}); 

       })
        .then(response => {
if (!response.ok) {
    return response.text().then(text => {
        throw new Error(text || 'Erreur lors de la génération du fichier des interventions');
    });
}

            // Récupérer le nom du fichier depuis l'en-tête Content-Disposition
            const disposition = response.headers.get('Content-Disposition');
            let filename = 'pieces.csv'; // Valeur par défaut si le nom n'est pas trouvé
            if (disposition && disposition.includes('filename=')) {
                filename = disposition.split('filename=')[1].replace(/"/g, '');
            }
            return response.blob().then(blob => ({ blob, filename }));
        })
.then(({ blob, filename }) => {
    // const url = window.URL.createObjectURL(blob);
    // const a = document.createElement('a');
    // a.style.display = 'none';
    // a.href = url;
    // a.download = filename; // Utilise le nom récupéré
    // document.body.appendChild(a);
    // a.click();
    // window.URL.revokeObjectURL(url);

    // Continuer la chaîne de promesses sans télécharger le fichier
    return fetch('../PHP/create_date_file.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: new Date().toISOString().split('T')[0] })
    });
})

        .then(response => {
if (!response.ok) {
    return response.text().then(text => {
        throw new Error(text || 'Erreur lors de la génération du fichier des interventions');
    });
}


            lancerScriptPHP('../PHP/sync_archives.php');
            alert('Tous les fichiers ont été générés avec succès!');

        })
        .catch(error => {
            console.error(error);
            alert('Erreur de génération (aucun fichier trouver ou autre).');
        });


}

function genererInterventionstestZeb() {
    fetch('../PHP/G-MAPPstestZeb.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur de génération (aucun fichier trouver ou autre)');
            }
            return response.json();
        })
        .then(data => {
            // Télécharger les interventions
            const interventionsBlob = new Blob([data.interventions], { type: 'text/csv;charset=utf-8;' });
            const interventionsUrl = window.URL.createObjectURL(interventionsBlob);
            const interventionsLink = document.createElement('a');
            interventionsLink.style.display = 'none';
            interventionsLink.href = interventionsUrl;
            interventionsLink.download = 'interventions_test.csv'; // Nom du fichier pour le test
            document.body.appendChild(interventionsLink);
            interventionsLink.click();
            window.URL.revokeObjectURL(interventionsUrl);

            // Télécharger les pièces
            const piecesBlob = new Blob([data.pieces], { type: 'text/csv;charset=utf-8;' });
            const piecesUrl = window.URL.createObjectURL(piecesBlob);
            const piecesLink = document.createElement('a');
            piecesLink.style.display = 'none';
            piecesLink.href = piecesUrl;
            piecesLink.download = 'pieces_test.csv'; // Nom du fichier pour le test
            document.body.appendChild(piecesLink);
            piecesLink.click();
            window.URL.revokeObjectURL(piecesUrl);
        })
        .catch(error => {
            console.error(error);
            alert('Erreur de génération (aucun fichier trouver ou autre) de test.');
        });
}


function genererInterventionsAll() {
genererInterventions()
genererInterventionsZeb()
    
}


document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("../Dev.txt");
    const txt = await res.text();
    const [mode, heures] = txt.trim().split(/\r?\n/);
    document.getElementById("devToggle").checked = mode.trim().toLowerCase() === "true";
    document.getElementById("heureInput").value = parseInt(heures) || 144;
  } catch (e) {
    console.error("Erreur de lecture Dev.txt", e);
  }
});

async function sauvegarderDevTxt() {
  const mode = document.getElementById("devToggle").checked ? "true" : "false";
  const heures = document.getElementById("heureInput").value || 144;

  const formData = new FormData();
  formData.append("content", `${mode}\n${heures}`);

  try {
const res = await fetch("../PHP/saveDev.php", {
      method: "POST",
      body: formData
    });
    const result = await res.text();
    document.getElementById("statusMessage").textContent = "✅ Sauvegardé";
    setTimeout(() => document.getElementById("statusMessage").textContent = "", 3000);
  } catch (e) {
    console.error("Erreur d'enregistrement", e);
    document.getElementById("statusMessage").textContent = "❌ Échec de la sauvegarde";
  }
}

