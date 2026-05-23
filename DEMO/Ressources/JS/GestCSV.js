


// Appeler cette fonction au chargement de la page


function getInterventions() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('user');

    // Ajoutez un timestamp à l'URL pour éviter la mise en cache
    const url = `../data/user/${username}_${CléType}.csv?timestamp=${new Date().getTime()}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                alert("Aucune donnée à afficher");
                throw new Error('Erreur lors du chargement du fichier CSV');
            }
            return response.text();
        })
        .then(data => {
            if (!data.trim()) {
                // Vérifie si le fichier est vide
                alert("Aucune donnée à afficher");
                return;
            }
            openNewTabWithTable(data);
        })
        .catch(error => {
            console.error('Erreur :', error);
        });
}

function openNewTabWithTable(data) {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('user');

    // Construire le contenu HTML du tableau
    const rows = data.split('\n');
    let htmlContent = `<h1>Interventions de ${username}</h1><table>`;

    rows.forEach((row, index) => {
        const cols = row.split(';'); // Séparateur utilisé dans les données
        htmlContent += '<tr>';
        cols.forEach(col => {
            if (index === 0) {
                htmlContent += `<th>${col}</th>`;
            } else {
                htmlContent += `<td>${col}</td>`;
            }
        });
        htmlContent += '</tr>';
    });

    htmlContent += '</table>';

    // Récupérer l'élément modalContent
    const modalContent = document.getElementById('modalContent');
    if (!modalContent) {
        console.error("L'élément modalContent n'a pas été trouvé dans le DOM.");
        return;
    }
    modalContent.innerHTML = htmlContent;

    // Afficher la modale
    const modal = document.getElementById('dataModal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        console.error("L'élément dataModal n'a pas été trouvé dans le DOM.");
    }

    // Fermer la modale lorsque l'utilisateur clique sur "X"
    const closeModal = document.querySelector('.modal .close');
    if (closeModal) {
        closeModal.onclick = function() {
            modal.style.display = 'none';
        };
    }

    // Fermer la modale si l'utilisateur clique en dehors de celle-ci
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}



function ajouterInformationsSupplementaires(data) {
    // Récupérer le paramètre "user" depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const user = urlParams.get('user') || 'Utilisateur inconnu'; // Valeur par défaut si "user" n'est pas présent

    const parties = data.split('_').map(partie => partie.trim());
    const id = generateUniqueId();

    // Obtenir l'heure actuelle au format HH:mm:ss
    const maintenant = new Date();
    const heureEnregistrement = `${maintenant.getHours().toString().padStart(2, '0')}:${maintenant.getMinutes().toString().padStart(2, '0')}:${maintenant.getSeconds().toString().padStart(2, '0')}`;

    // Retourner l'objet avec toutes les informations, y compris "Tech" pour l'utilisateur et l'heure d'enregistrement
    return {
        id,
        date: parties[0],
        temps: parties[1],
        zoneTexte1: parties[2],
        zoneTexte2: parties[3],
        zoneTexte3: parties[4],
        zoneTexte4: parties[5],
        zoneTexte5: parties[6],
        zoneTexte6: parties[7],
        Tech: user, // Ajouter l'utilisateur comme technicien
        heureEnregistrement // Ajouter l'heure d'enregistrement
    };
}



let searchActive = false; // Variable pour suivre l'état de la recherche

// Importez la bibliothèque "unorm" si elle n'est pas déjà incluse dans votre projet
// Exemple : <script src="https://unpkg.com/unorm@1.4.1"></script>

function normalizeString(str) {
    return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}


let isChronosActif = true; // Variable pour suivre l'état actuel



// Appeler cette fonction pour exporter vers le serveur
function exportServ() {
    exportInterventions('server');
}

// Appeler cette fonction pour télécharger localement
function exportToTxt() {
    exportInterventions('local');
}

// Fonction pour convertir les dates au format YYYYMMDD
function formatDate(dateStr) {
    if (!dateStr) return "0";
    const [day, month, year] = dateStr.split('/').map(part => part.padStart(2, '0'));
    return `${year}${month}${day}`;
}


function convertToHours(timeStr) {
    if (!timeStr) return 0;

    // Regex pour capturer les heures et minutes
    const regex = /(\d{1,2}):(\d{2})/;
    const matches = timeStr.match(regex);

    if (matches) {
        const hh = parseInt(matches[1], 10); // Extraction des heures
        const mm = parseInt(matches[2], 10); // Extraction des minutes

        // Conversion : heures + (minutes converties en fraction d'heure)
        return hh + mm / 60;
    }

    return 0; // Si le format est invalide, on retourne 0
}


function convertToHourssnd(timeString) {
    // Variables pour stocker les valeurs extraites
    let days = 0,
        hours = 0,
        minutes = 0,
        seconds = 0;

    // Regex pour capturer les jours, heures, minutes et secondes (meilleure gestion des espaces)
    const regex = /(?:(\d+)j)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/;
    const match = timeString.match(regex);

    if (match) {
        // Si les valeurs existent, les convertir en nombres, sinon 0
        days = match[1] ? parseInt(match[1]) : 0;
        hours = match[2] ? parseInt(match[2]) : 0;
        minutes = match[3] ? parseInt(match[3]) : 0;
        seconds = match[4] ? parseInt(match[4]) : 0;
    }

    // Conversion en heures
    let totalHours = (days * 24) + hours + (minutes / 60) + (seconds / 3600);

    // Si le total est inférieur à 1 minute, on considère que c'est au moins 1 minute
    if (totalHours < 1 / 60) {
        totalHours = 1 / 60; // correspond à 1 minute, soit environ 0.0167 heures
    }

    return totalHours.toFixed(3); // Limite à 3 décimales pour l'affichage
}



exportInterventions = async function(exportType) {
    const enregistrementsString = await getPrefixedItem('enregistrements');

    if (!enregistrementsString) {
        console.warn("[WARN] Aucun enregistrement trouvé.");
        alert("Aucun enregistrement trouvé.");
        return;
    }

    let enregistrements;
    try {
        enregistrements = JSON.parse(enregistrementsString);
    } catch (e) {
        console.error("[ERROR] Erreur lors du parsing des enregistrements :", e);
        alert("Erreur lors du parsing des enregistrements.");
        return;
    }

    const url = new URL(window.location.href);
    const user = decodeURIComponent(url.searchParams.get('user')) || "Utilisateur inconnu";

    let csvContent = "ID;Date intervention;Désignation machine;Type de panne;Cause;Résumé intervention;Pièces;Durée arrêt (h);Personnel;Temps\n";

    enregistrements.forEach((record) => {
        if (record) {
            const id = record.id || "0";
            const dateIntervention = record.date ? formatDate(record.date) : "0";
            const designationMachine = record.zoneTexte1 || "0";
            const typeDePanne = record.zoneTexte4 || "0";
            const cause = record.zoneTexte5 || "0";
            const resumeIntervention = record.zoneTexte2 || "0";
            const piecesEnregistre = record.zoneTexte3 || "";
            const dureeArret = record.zoneTexte6 ? convertToHours(record.zoneTexte6) : "0";
            const personnel = record.Tech ? record.Tech : user;
            const nombreHeures = record.temps ? convertToHourssnd(record.temps) : "0";

            csvContent += `${id};${dateIntervention};${designationMachine};${typeDePanne};${cause};${resumeIntervention};${piecesEnregistre};${dureeArret};${personnel};${nombreHeures}\n`;
        }
    });

    const bom = "\uFEFF";
    const finalContent = bom + csvContent;

    if (exportType === 'server') {
        const formData = new FormData();
        formData.append("user", user);
        formData.append("csvContent", finalContent);
        formData.append("cleType", CléType);

        try {

            const response = await fetch("PHP/save_interventions.php", {
              method: "POST",
              body: formData,
            });

            const responseText = await response.text(); // Lire la réponse brute

            const result = JSON.parse(responseText); // Parser en JSON
            if (result.success) {
                alert("Les interventions ont été enregistrées.");
                await removePrefixedItem('enregistrements');
                setTimeout(afficherEnregistrements, 500);

            } else {
                console.warn("[WARN] Erreur lors de l'enregistrement sur le serveur :", result.error);
                alert("Erreur serveur : " + result.error);
            }
        } catch (error) {
            console.error("[ERROR] Erreur réseau ou JSON :", error);
            console.error("Erreur réseau ou JSON : " + error.message);
        }


    }
};


async function exportBRUTTxt() {
    // Récupérer l'enregistrement
    const enregistrements = await getPrefixedItem('enregistrements');

    if (!enregistrements) {
        console.error('Aucun enregistrement trouvé');
        return;
    }

    // Conversion en JSON si ce n'est pas déjà fait
    const parsedEnregistrements = JSON.parse(enregistrements);

    // Transformer chaque enregistrement en une chaîne formatée brute
    const contenuFormate = parsedEnregistrements.map(enregistrement => {
        return JSON.stringify(enregistrement, null, 2); // Formater chaque enregistrement comme une chaîne JSON brute
    }).join("\n"); // Joindre tous les enregistrements avec une nouvelle ligne entre eux

    // Créer un Blob avec le contenu brut
    const blob = new Blob([contenuFormate], {
        type: 'text/plain'
    });

    // Créer un lien temporaire pour télécharger le fichier
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'enregistrements_brut.txt'; // Nom du fichier
    document.body.appendChild(a);
    a.click();

    // Nettoyer le lien temporaire
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}