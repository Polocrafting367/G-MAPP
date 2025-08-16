//load

window.onload = function() {
    // Fonction pour obtenir les paramètres de l'URL
    function getUrlParams() {
        const params = {};
        const queryString = window.location.search;
        if (queryString) {
            const pairs = queryString.substring(1).split("&");
            for (let i = 0; i < pairs.length; i++) {
                const pair = pairs[i].split("=");
                params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
            }
        }
        return params;
    }

    // Obtenez les paramètres de l'URL
    const params = getUrlParams();


};
 
// bind une seule fois sur l'événement correct
(function bindSearchOnce(){
    const searchInput = document.getElementById('searchInput');
    if (!searchInput || searchInput.__boundInput) return;
    searchInput.addEventListener('input', () => searchLieu());
    searchInput.__boundInput = true;
})();

function searchLieu(arbre) {
    const clearButton = document.getElementById('clearButton');
    const searchInput  = document.getElementById('searchInput');
    const lieuxList    = document.getElementById('lieux-list');
    if (!searchInput || !lieuxList) return;

    const termFold = normalizeString(searchInput.value);
    const terms = termFold.split(/\s+/).filter(Boolean); // multi-termes: tous doivent être contenus

    if (clearButton) clearButton.style.display = termFold !== '' ? 'block' : 'none';

    const lieuxItems = lieuxList.querySelectorAll('li');

    // cache des textes normalisés
    for (let i = 0; i < lieuxItems.length; i++) {
        const li = lieuxItems[i];
        if (!li.__foldText) li.__foldText = normalizeString(li.textContent || '');
        const pc = li.querySelector('.place-card');
        if (pc && !pc.__foldText) pc.__foldText = normalizeString(pc.textContent || '');
    }

    for (let i = 0; i < lieuxItems.length; i++) {
        const li = lieuxItems[i];
        const pc = li.querySelector('.place-card');

        const matchLi = terms.length === 0 || terms.every(t => li.__foldText.includes(t));
        if (pc) {
            const matchPc = terms.length === 0 || terms.every(t => pc.__foldText.includes(t));
            pc.style.display = matchPc ? 'block' : 'none';
        }

        if (matchLi) {
            li.style.display = 'block';
            li.classList.add('active');
            // ouvre les branches parentes
            let p = li.parentElement;
            while (p && p !== lieuxList) {
                if (p.tagName === 'UL') p.style.display = 'block';
                p = p.parentElement;
            }
        } else {
            li.style.display = 'none';
            li.classList.remove('active');
        }
    }

    if (terms.length === 0) {
        const allBranches = lieuxList.querySelectorAll('ul');
        allBranches.forEach(b => { b.style.display = 'none'; });
    }
}

function clearSearchInput() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    searchInput.value = '';
    const clearButton = document.getElementById('clearButton');
    if (clearButton) clearButton.style.display = 'none';
    searchLieu();
}

//Gestion sauvegarde

function extraireTemps(tempsString) {
    const regexTemps = /(?:(\d+)j)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/;
    const match = regexTemps.exec(tempsString || '0s');
    return {
        jours: parseInt(match?.[1], 10) || 0,
        heures: parseInt(match?.[2], 10) || 0,
        minutes: parseInt(match?.[3], 10) || 0,
        secondes: parseInt(match?.[4], 10) || 0
    };
}

function getTechniciensExistants(enregistrements, idGroupe, technicienActuel = null) {
    return enregistrements
        .filter(enr => enr.id === idGroupe && enr.Tech && enr.Tech !== technicienActuel)
        .map(enr => enr.Tech);
}


function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}




function fermerModal(buttonElement) {
    // Remonter au parent ayant la classe 'modal'
    const modalElement = buttonElement.closest('.modal');

    if (modalElement && modalElement.parentNode) {
        modalElement.style.display = 'none';
        modalElement.parentNode.removeChild(modalElement); // Assurez-vous que modalElement est bien un enfant de son parent
    }
}


async function afficherModalTechniciens(enregistrement, techniciensExclus = []) {
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal';
    modalDiv.style.display = 'block';

    // Récupérer le temps depuis l'enregistrement
    const tempsDejaEnregistre = enregistrement.temps || '';
    const tempsFormatte = formatTimeForInput(tempsDejaEnregistre);

    // Vérifier si les données JSON sont disponibles dans la variable globale
    const jsonData = JSON.parse(globalUserData);
;
    if (!jsonData) {
        console.error('Les données JSON ne sont pas disponibles. Assurez-vous qu’elles ont été chargées.');
        return;
    }

    // Créer le contenu de la modal
    modalDiv.innerHTML = `
        <div class="modal-content">
            <span class="close-button" onclick="fermerModal(this)">&times;</span>
            <h2>Sélectionnez un technicien supplémentaire</h2>
            <label for="technicienSelect">Technicien :</label>
            <select id="technicienSelect"></select>
            
            <h3>Temps passé</h3>
            <div class="temps-selection">
                <label for="joursInput">Jours :</label>
                <input type="number" id="joursInput" min="0" max="30" value="0"><br><br>
                <label for="tempsInput">Heure/Minute :</label>
                <input type="time" id="tempsInput" min="00:00" max="23:59" value="00:01">
            </div>
            <br>
            <button id="ajouterTechnicienButton">Ajouter</button>
        </div>
    `;

    // Pré-remplir le champ "tempsInput" avec le temps récupéré depuis l'enregistrement
    const tempsInput = modalDiv.querySelector('#tempsInput');
    if (tempsFormatte) {
        tempsInput.value = tempsFormatte;
    }

    // Récupérer la liste des techniciens existants
    const technicienSelect = modalDiv.querySelector('#technicienSelect');
    const enregistrementsData = await getPrefixedItem('enregistrements');
    const enregistrements = JSON.parse(enregistrementsData || '[]');
    const techniciensExistants = getTechniciensExistants(enregistrements, enregistrement.id);

    // Ajouter les techniciens au menu déroulant
    for (const [nom, hash] of Object.entries(jsonData)) {
        if (nom !== "Gestion" && !techniciensExistants.includes(nom)) {
            const option = document.createElement('option');
            option.value = hash;
            option.textContent = nom;
            technicienSelect.appendChild(option);
        }
    }

    // Gérer l'ajout du technicien
    modalDiv.querySelector('#ajouterTechnicienButton').addEventListener('click', async () => {
        const selectedTechnicianName = technicienSelect.options[technicienSelect.selectedIndex].text;
        const jours = parseInt(modalDiv.querySelector('#joursInput').value, 10) || 0;
        const [heures, minutes] = modalDiv.querySelector('#tempsInput').value.split(':').map(Number);

        // Calculer le temps au format "Xj Xh Xm"
        let nouveauTemps = '';
        if (jours > 0) nouveauTemps += `${jours}j `;
        if (heures > 0 || nouveauTemps) nouveauTemps += `${heures}h `;
        if (minutes > 0 || nouveauTemps) nouveauTemps += `${minutes}m`;
        if (!nouveauTemps) nouveauTemps = '0s';

        // Créer un nouvel enregistrement avec le technicien ajouté
        const newEnregistrement = {
            ...enregistrement,
            Tech: selectedTechnicianName,
            temps: nouveauTemps.trim()
        };

        // Ajouter l'enregistrement au stockage
        const updatedEnregistrementsData = await getPrefixedItem('enregistrements');
        let enregistrements = JSON.parse(updatedEnregistrementsData || '[]');
        enregistrements.push(newEnregistrement);
        await setPrefixedItem('enregistrements', JSON.stringify(enregistrements));

        afficherEnregistrements();
        fermerModal(modalDiv);
    });

    // Ajouter la modal au DOM
    document.body.appendChild(modalDiv);
}

// Fonction pour formater le temps de l'enregistrement au format HH:MM
function formatTimeForInput(temps) {
    const heuresMatch = temps.match(/(\d+)h/);
    const minutesMatch = temps.match(/(\d+)m/);

    const heures = heuresMatch ? parseInt(heuresMatch[1], 10) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;

    // Formater au format HH:MM
    const heuresStr = heures.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');

    return `${heuresStr}:${minutesStr}`;
}



function relancer(nomLieu, temps, liste1, liste2, Text1, Text2, arret) {

console.warn("Lieu : " + nomLieu + " || Temps : " + temps +" || Type : "+ liste1+" || Cause : "+  liste2+" || Pièces : "+  Text1+" || Résumer : "+  Text2+" || TPS Arret : "+  arret);
    // Ensuite, vous pouvez exécuter votre logique pour ouvrir l'iframe
    ouvrirIframe(nomLieu, temps, liste1, liste2, Text1, Text2, arret);
            setTimeout(() => {
            openTab('Chrono')
                    }, 100);
}



function creerFenetreModale(enregistrement) {
    const modalDiv = document.createElement('div');
    modalDiv.classList.add('modal');


    return modalDiv;
}

function creerInputAvecLabel(labelText, inputType, valeurInitiale) {
    const label = document.createElement('label');
    label.textContent = labelText;

    const input = document.createElement('input');
    input.type = inputType;
    input.value = valeurInitiale;

    return {
        label,
        input
    };
}


async function mettreAJourEnregistrement(enregistrement, date, temps, zoneTexte1, zoneTexte2, zoneTexte3) {


    // Récupérer le tableau d'enregistrements depuis le stockage local
    const enregistrementsString = await getPrefixedItem('enregistrements');
    let enregistrements = JSON.parse(enregistrementsString);

    // Vérifier si enregistrements est défini
    if (!enregistrements) {
        enregistrements = [];
    }

    // Mettre à jour l'enregistrement spécifique dans le tableau
    const indexAUpdater = enregistrements.findIndex(e => comparerEnregistrements(e, enregistrement));

    if (indexAUpdater !== -1) {
        enregistrements[indexAUpdater].date = date;
        enregistrements[indexAUpdater].temps = temps;
        enregistrements[indexAUpdater].zoneTexte1 = zoneTexte1;
        enregistrements[indexAUpdater].zoneTexte2 = zoneTexte2;
        enregistrements[indexAUpdater].zoneTexte3 = zoneTexte3;


        // Réenregistrer le tableau mis à jour dans le stockage local
        setPrefixedItem('enregistrements', JSON.stringify(enregistrements));

    }


}

function creerBoutonValider(callbackValider, callbackAnnuler) {
    const boutonValider = document.createElement('button');
    boutonValider.textContent = 'Valider';
    boutonValider.addEventListener('click', callbackValider);

    // Create Cancel button
    const boutonAnnuler = document.createElement('button');
    boutonAnnuler.textContent = 'Annuler';
    boutonAnnuler.addEventListener('click', callbackAnnuler);
    boutonAnnuler.id = 'dell';


    return {
        boutonValider,
        boutonAnnuler
    };
}



async function mettreAJourAffichage() {

    afficherEnregistrements();


}



function comparerEnregistrements(enregistrement1, enregistrement2) {
    return (
        enregistrement1.date === enregistrement2.date &&
        enregistrement1.temps === enregistrement2.temps &&
        enregistrement1.zoneTexte1 === enregistrement2.zoneTexte1 &&
        enregistrement1.zoneTexte2 === enregistrement2.zoneTexte2 &&
        enregistrement1.zoneTexte3 === enregistrement2.zoneTexte3 &&
        enregistrement1.Tech === enregistrement2.Tech // Assure que le technicien est unique
    );
}



function calculerBornesDate() {
    //console.log(date_LM)
    const text = date_LM?.trim();

    // Si vide ou invalide
    if (!text) {
        console.error("❌ date_LM est vide ou non défini.");
        throw new Error("date_LM est vide ou non défini");
    }

    const maxDateObj = new Date(text);
    if (isNaN(maxDateObj.getTime())) {
        console.error("❌ date_LM invalide :", text);
        throw new Error("date_LM invalide : " + text);
    }

    const maxDateMs = maxDateObj.getTime();
    const oneDayMs = 3 * 24 * 60 * 60 * 1000;
    const add = maxDateMs - oneDayMs;

    const minDateObj = new Date(add);
    if (isNaN(minDateObj.getTime())) {
        console.error("❌ minDateObj invalide après soustraction.");
        throw new Error("minDateObj invalide");
    }

    const minDate = minDateObj.toISOString().split('T')[0];
    const todayFormatted = new Date().toISOString().split('T')[0];

    return { minDate, maxDate: todayFormatted };
}


function reloadpp() {

        window.parent.postMessage({ type: 'Reload' }, '*');

}

async function updateButtonStyles() {
    let userChoiceRaw = await getPrefixedItem('userChoice');
    let userChoice;

    try {
        userChoice = JSON.parse(userChoiceRaw);
    } catch (e) {
        userChoice = userChoiceRaw;
    }

    // Si null ou vide => forcer "pause"
    if (userChoice === null || userChoice === '') {
        userChoice = 'pause';
    }

    const buttonIds = {
        'reprendre': 'setDefaultReprendreBtn',
        'pause': 'setDefaultPauseBtn',
        'creer': 'setDefaultCreerBtn'
    };

    Object.values(buttonIds).forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.style.filter = '';
    });

    const deleteBtn = document.getElementById('deletePreferenceBtnST');
    if (deleteBtn) deleteBtn.style.filter = '';

    if (userChoice === 'aucun') {
        if (deleteBtn) deleteBtn.style.filter = 'invert(1)';
    } else if (buttonIds[userChoice]) {
        const selectedButtonId = buttonIds[userChoice];
        const selectedBtn = document.getElementById(selectedButtonId);
        if (selectedBtn) selectedBtn.style.filter = 'invert(1)';
    }
}





document.getElementById('setDefaultReprendreBtn').addEventListener('click', async function() {
    setPrefixedItem('userChoice', '"reprendre"');
    await updateButtonStyles(); // Mise à jour de l'apparence des boutons
});



document.getElementById('setDefaultPauseBtn').addEventListener('click', async function() {
    setPrefixedItem('userChoice', '"pause"');
    await updateButtonStyles();
});

document.getElementById('setDefaultCreerBtn').addEventListener('click', async function() {
    setPrefixedItem('userChoice', '"creer"');
    await updateButtonStyles();
});

document.getElementById('deletePreferenceBtnST').addEventListener('click', async function() {
    await setPrefixedItem('userChoice', '"aucun"');
    await updateButtonStyles();
});
