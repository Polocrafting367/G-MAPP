function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }


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
  lieuxList.classList.toggle('is-searching', terms.length > 0);

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



function redresseChevrons(scope = document.body) {
  scope.querySelectorAll('polygon[points="5,20 95,20 50,95"]').forEach(poly => {
    poly.setAttribute('points', '20,5 95,50 20,95');
  });
}




function clearSearchInput() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  searchInput.value = '';
  const clearButton = document.getElementById('clearButton');
  if (clearButton) clearButton.style.display = 'none';
  searchLieu();
  redresseChevrons(); 
}

function clearSearchInput2() {
  const searchInput2 = document.getElementById('searchInput2');
  if (!searchInput2) return;
  searchInput2.value = '';
  searchLieu2();
  redresseChevrons();
}

function clearSearchInput3() {
  const searchInput = document.getElementById('searchInput3');
  if (!searchInput) return;
  searchInput.value = '';
  searchLieu3();
  redresseChevrons(); 
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
                <label style="display: none !important;" for="joursInput">Jours :</label>
                <input style="display: none !important;" type="number" id="joursInput" min="0" max="30" value="0"><br>
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

function ajusterIframe(iframe) {
  if (!iframe) return;

  const piecesActives = localStorage.getItem('DEV_PIECES') === 'true';
  // pars en **nombre**, pas en string
  let heightPx = piecesActives ? 352 : 300;

  // assure-toi que contrastEnabled est bien un booléen global défini
  if (typeof contrastEnabled !== 'undefined' && contrastEnabled) {
    heightPx += 35;
  }

  // applique
  iframe.style.height = `${heightPx}px`;
  // si tu veux aussi l’attribut HTML height (certains UA/iframes l’utilisent)
  iframe.setAttribute('height', String(heightPx));
}



function showGlobalEditBar() { editionGlobaleActive = true; const b = document.getElementById("globalEditBar"); if (b) b.style.display = "flex"; }
function hideGlobalEditBar() { const b = document.getElementById("globalEditBar"); if (b) b.style.display = "none"; }

/* commit de TOUTES les entrées visibles (date, résumé, temps) dans le draft puis persistance */
async function onSaveAll() {
  // Pièces
document.querySelectorAll('input[data-edit="pieces"]').forEach(input => {
  const id = input.getAttribute("data-id");
  if (!id) return;
  const txt = input.value || "";
  for (let i = 0; i < enregistrementsDraft.length; i++) {
    if (enregistrementsDraft[i].id === id) {
      enregistrementsDraft[i].zoneTexte3 = txt;
    }
  }
});

  // Dates
  document.querySelectorAll('input[data-edit="date"]').forEach(input => {
    const id = input.getAttribute("data-id");
    const val = input.value;
    if (!id || !val) return;
    const [yyyy, mm, dd] = val.split('-');
    const formatted = `${dd}/${mm}/${yyyy}`;
    for (let i = 0; i < enregistrementsDraft.length; i++) {
      if (enregistrementsDraft[i].id === id) enregistrementsDraft[i].date = formatted;
    }
  });
  // Résumés
  document.querySelectorAll('input[data-edit="resume"]').forEach(input => {
    const id = input.getAttribute("data-id");
    if (!id) return;
    const txt = remplacerPlusUnicode(input.value || "");
    for (let i = 0; i < enregistrementsDraft.length; i++) {
      if (enregistrementsDraft[i].id === id) enregistrementsDraft[i].zoneTexte2 = txt;
    }
  });
  // Temps technicien
  document.querySelectorAll('input[data-edit="temps"]').forEach(input => {
    const id = input.getAttribute("data-id");
    const tech = input.getAttribute("data-tech");
    if (!id || !tech || !input.value) return;
    const [h, m] = input.value.split(':');
    // récupère j et s existants (si présents) depuis le draft
    const sample = enregistrementsDraft.find(e => e.id === id && e.Tech === tech);
    let jours = "", secondes = "";
    if (sample && sample.temps) {
      const m2 = /(?:(\d+)j)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/.exec(sample.temps);
      if (m2 && m2[1]) jours = `${m2[1]}j `;
      if (m2 && m2[4]) secondes = `${m2[4]}s`;
    }
    const nouvelleValeurTemps = `${jours}${parseInt(h)}h ${parseInt(m)}m `.trim();
    for (let i = 0; i < enregistrementsDraft.length; i++) {
      const e = enregistrementsDraft[i];
      if (e.id === id && e.Tech === tech) e.temps = nouvelleValeurTemps;
    }
  });

  await setPrefixedItem('enregistrements', JSON.stringify(enregistrementsDraft));
  editionGlobaleActive = false;
  await afficherEnregistrements(); // re-render complet → remplace inputs par texte
}

/* annule tout : on jette les inputs et on recharge depuis la DB */
async function onCancelAll() {
  editionGlobaleActive = false;
  await afficherEnregistrements(); // recharge → vue propre sans inputs
}


async function afficherEnregistrements() {
  initGlobalEditBar();
  editionGlobaleActive = false;

  if (editionGlobaleActive) {
    showGlobalEditBar();
  } else {
    hideGlobalEditBar();
  }

  const enregistrementsDiv = document.getElementById('enregistrements');
  enregistrementsDiv.innerHTML = '';

  const enregistrementsString = await getPrefixedItem('enregistrements');
  enregistrementsCache = enregistrementsString ? JSON.parse(enregistrementsString) : [];

  if (!editionGlobaleActive) {
    enregistrementsDraft = deepClone(enregistrementsCache);
  }

  const urlParams = new URLSearchParams(window.location.search);
  const isExport = urlParams.get('Export') === 'true';

  const enregistrements = enregistrementsDraft;

  const enregistrementsGroupes = {};
  enregistrements.forEach(enregistrement => {
    if (!enregistrementsGroupes[enregistrement.id]) enregistrementsGroupes[enregistrement.id] = [];
    enregistrementsGroupes[enregistrement.id].push(enregistrement);
  });

  for (const [id, groupeEnregistrements] of Object.entries(enregistrementsGroupes)) {
    const groupeDiv = document.createElement('div');
    groupeDiv.className = 'groupe-enregistrements';
    groupeDiv.id = `groupe-${id}`;

    const titreGroupe = document.createElement('h3');
    groupeDiv.appendChild(titreGroupe);

    const techniciensDejaAjoutes = groupeEnregistrements.filter(enreg => enreg.Tech);

    groupeEnregistrements.forEach((enregistrement, index) => {
      const enregistrementDiv = document.createElement('div');
      enregistrementDiv.className = "AFregis";

      if (index === 0) {
        const ficheNumber = `${enregistrement.zoneTexte1}`;

const code = findCodeByFicheNumber(ficheNumber);

titreGroupe.textContent = code || enregistrement.zoneTexte1;
        afficherPopupAideCustom(
          enregistrementDiv,
          `Cliquez sur la <strong>date</strong>, le <strong>résumé</strong> ou le <strong>temps</strong> pour une modif rapide.`,
          'pop_edit'
        );

      /* ============================
   LIGNE 1 : Date + Résumé (version "techText-like")
============================ */
const dateResumeContainer = document.createElement('div');
//dateResumeContainer.style.display = 'flex';
dateResumeContainer.style.alignItems = 'center';
dateResumeContainer.style.gap = '8px';
dateResumeContainer.style.flexWrap = 'wrap';
dateResumeContainer.style.marginBottom = '10px';

/* bouton ✏️ (date) */
const editDateButton = document.createElement('button');
editDateButton.type = 'button';
editDateButton.textContent = '✏️';
editDateButton.className = 'button-edith';
editDateButton.style.marginRight = '10px';
editDateButton.addEventListener('click', () => {
  afficherModalEditionDate(enregistrement, enregistrementsDraft);
  showGlobalEditBar();
});

/* input date caché */
const dateInput = document.createElement('input');
dateInput.type = 'date';
{
  const [jour, mois, annee] = enregistrement.date.split('/');
  dateInput.value = `${annee}-${String(mois).padStart(2,'0')}-${String(jour).padStart(2,'0')}`;
  const { minDate, maxDate } = calculerBornesDate();
  dateInput.min = minDate; dateInput.max = maxDate;
}
dateInput.setAttribute('data-edit','date');
dateInput.setAttribute('data-id', enregistrement.id);
dateInput.style.setProperty('width','auto','important');
dateInput.style.display = 'none';

/* input résumé caché */
const resumeInput = document.createElement('input');
resumeInput.type = 'text';
resumeInput.value = enregistrement.zoneTexte2 || '';
resumeInput.setAttribute('data-edit','resume');
resumeInput.setAttribute('data-id', enregistrement.id);
resumeInput.style.display = 'none';

/* === merge façon techText : UN SEUL SPAN, avec sous-spans === */
const line = document.createElement('span');
//line.style.display = 'flex';
line.style.alignItems = 'center';
line.style.gap = '8px';
line.style.width = '100%'; // laisse le résumé se dilater/réduire

// On évite innerHTML pour le résumé (sécurité & accents)
const meta = document.createElement('span'); // "date -", ne se casse pas
meta.style.display = 'inline-flex';
meta.style.alignItems = 'center';
meta.style.gap = '8px';
meta.style.whiteSpace = 'nowrap';

const dateSpan = document.createElement('span');
dateSpan.style.cursor = 'pointer';
dateSpan.textContent = enregistrement.date;

const sep = document.createElement('span');
sep.textContent = ' -  ';

meta.appendChild(dateSpan);
meta.appendChild(sep);

// Résumé : prend la place restante, wrap progressif
const resumeSpan = document.createElement('span');
resumeSpan.style.cursor = 'pointer';
resumeSpan.style.flex = '1 1 auto';
resumeSpan.style.minWidth = '0';                 // CRUCIAL en flex
resumeSpan.style.whiteSpace = 'normal';
resumeSpan.style.overflowWrap = 'anywhere';
resumeSpan.textContent = enregistrement.zoneTexte2 || '';

line.appendChild(meta);
line.appendChild(resumeSpan);

/* interactions (switch affichage <-> input) */
dateSpan.addEventListener('click', () => {
  dateSpan.style.display = 'none';
  // on met l'input date juste après meta pour rester sur la même ligne si possible
  meta.parentNode.insertBefore(dateInput, meta.nextSibling);
  dateInput.style.display = 'inline-block';
  showGlobalEditBar();
  dateInput.focus();
  dateInput.select();
});

resumeSpan.addEventListener('click', () => {
  resumeSpan.style.display = 'none';
  // on insère l'input à la place du résumé
  line.appendChild(resumeInput);
  resumeInput.style.display = 'inline-block';
  showGlobalEditBar();
  resumeInput.focus();
  resumeInput.select();
});

/* ordre d'insertion final */
dateResumeContainer.appendChild(editDateButton);
dateResumeContainer.appendChild(line);
dateResumeContainer.appendChild(dateInput);
dateResumeContainer.appendChild(resumeInput);
enregistrementDiv.appendChild(dateResumeContainer);

const enabled = localStorage.getItem('DEV_PIECES') === 'true';

function hasNonEmptyPieces(zoneTexte3) {
  if (zoneTexte3 == null) return false;
  const s = String(zoneTexte3).trim();
  if (!s) return false;         // vide / espaces
  if (s === '[]') return false; // tableau vide encodé en string
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed.length > 0;
  } catch (e) {
    // ce n'est pas du JSON valide => s'il reste du texte, on considère non-vide
  }
  return s.length > 0;
}

const hasText = hasNonEmptyPieces(enregistrement.zoneTexte3);

if (enabled || hasText) {
  const piecesRow = buildPiecesRow(enregistrement);
  enregistrementDiv.appendChild(piecesRow);

  // rendre les capsules (si données déjà présentes)
  refreshPiecesRow(enregistrement.id, enregistrement.zoneTexte3 || '[]');

  // Si on affiche "de force" (flag OFF mais données présentes) => bordure rouge
  if (!enabled && hasText) {
    const caps = piecesRow.querySelector('.capsules, [id^="capsules-container"]');
    if (caps) {
      caps.classList.add('capsules--warning');
      caps.setAttribute('title', 'Affiché car des pièces existent (DEV_PIECES désactivé)');
      // optionnel si tu préfères inline :
      // caps.style.borderColor = '#e11d48';
    }
  }
}

        techniciensDejaAjoutes.forEach((techEnregistrement) => {
          const techDiv = document.createElement('div');
          techDiv.style.display = 'flex';
          techDiv.style.alignItems = 'center';

          const boutonsContainer = document.createElement('div');
          boutonsContainer.style.marginRight = '10px';
          boutonsContainer.style.display = 'flex';
          boutonsContainer.style.gap = '5px';

          const boutonSupprimerTech = document.createElement('button');
          boutonSupprimerTech.type = 'button'; // évite la soumission d’un éventuel <form>
          boutonSupprimerTech.textContent = '🗑️';
          boutonSupprimerTech.className = 'button-supprimer';
          boutonSupprimerTech.addEventListener('click', async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const ok = window.confirm(`Supprimer le technicien ${techEnregistrement.Tech} ?`);
            if (!ok) return;

            // suppression robuste par (id, Tech) plutôt que comparerEnregistrements
            const idx = enregistrementsDraft.findIndex(e => e.id === enregistrement.id && e.Tech === techEnregistrement.Tech);
            if (idx !== -1) {
              enregistrementsDraft.splice(idx, 1);
              showGlobalEditBar();
              // Persistance immédiate pour éviter le "retour" au prochain render
              await setPrefixedItem('enregistrements', JSON.stringify(enregistrementsDraft));
              await afficherEnregistrements();
            }
          });

          const boutonEditerTech = document.createElement('button');
          boutonEditerTech.type = 'button';
          boutonEditerTech.textContent = '✏️';
          boutonEditerTech.className = 'button-edith';
          boutonEditerTech.addEventListener('click', () => {
            afficherModalEditionTechnicien(techEnregistrement, enregistrementsDraft);
            showGlobalEditBar();
          });

          boutonsContainer.appendChild(boutonSupprimerTech);
          boutonsContainer.appendChild(boutonEditerTech);
          techDiv.appendChild(boutonsContainer);

          const techText = document.createElement('span');
          const tempsOriginal = techEnregistrement.temps || "";
          techText.innerHTML = `<span class="temps-editable" style="cursor:pointer">${tempsOriginal}</span> - ${techEnregistrement.Tech}`;
          techDiv.appendChild(techText);

          const spanTemps = techText.querySelector('.temps-editable');

          const inputTemps = document.createElement('input');
          inputTemps.type = 'time';
          inputTemps.min = '00:00';
          inputTemps.style.width = '100px';
          inputTemps.setAttribute('data-edit', 'temps');
          inputTemps.setAttribute('data-id', enregistrement.id);
          inputTemps.setAttribute('data-tech', techEnregistrement.Tech);
          inputTemps.style.display = 'none';

          spanTemps.addEventListener('click', () => {
            const m = /(?:(\d+)j)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/.exec(techEnregistrement.temps || "");
            const heures = m && m[2] ? String(m[2]).padStart(2, '0') : '00';
            const minutes = m && m[3] ? String(m[3]).padStart(2, '0') : '00';
            inputTemps.value = `${heures}:${minutes}`;
            spanTemps.replaceWith(inputTemps);
            inputTemps.style.display = 'inline-block';
            showGlobalEditBar();
          });

          enregistrementDiv.appendChild(techDiv);
        });

        const boutonsDiv = document.createElement('div');
        boutonsDiv.style.display = 'flex';

        const boutonAjouterTechnicien = document.createElement('button');
        boutonAjouterTechnicien.type = 'button';
        boutonAjouterTechnicien.textContent = '+ Tech.';
        boutonAjouterTechnicien.className = 'button-tech';
        boutonAjouterTechnicien.style.marginRight = '5px';
        boutonAjouterTechnicien.addEventListener('click', () => {
          afficherModalTechniciens(enregistrement);
          showGlobalEditBar();
        });

        boutonsDiv.appendChild(boutonAjouterTechnicien);

        if (techniciensDejaAjoutes.length === 1 && !isExport) {
          const boutonRestaurer = document.createElement('button');
          boutonRestaurer.type = 'button';
          boutonRestaurer.textContent = 'Restaurer';
          boutonRestaurer.className = 'button-restaurer';
          boutonRestaurer.style.marginRight = '5px';
          boutonRestaurer.addEventListener('click', async () => {
            relancer(
              enregistrement.zoneTexte1,
              enregistrement.temps,
              enregistrement.zoneTexte4,
              enregistrement.zoneTexte5,
              enregistrement.zoneTexte2,
              enregistrement.zoneTexte3,
              enregistrement.zoneTexte6
            );
            const indexASupprimer = enregistrementsDraft.findIndex(e => e.id === enregistrement.id && e.Tech === enregistrement.Tech);
            if (indexASupprimer !== -1) {
              enregistrementsDraft.splice(indexASupprimer, 1);
              showGlobalEditBar();
              await setPrefixedItem('enregistrements', JSON.stringify(enregistrementsDraft));
              await afficherEnregistrements();
            }
          });
          boutonsDiv.appendChild(boutonRestaurer);

        }

          const boutonDupliquer = document.createElement('button');
          boutonDupliquer.type = 'button';
          boutonDupliquer.textContent = 'Dupliquer'; // ou 'Relancer'
          boutonDupliquer.className = 'button-dupliquer'; // Pensez à ajouter du CSS pour cette classe (ex: vert ou bleu)
          boutonDupliquer.style.marginRight = '5px';
          
          boutonDupliquer.addEventListener('click', () => {
            // On fait exactement la même chose que restaurer...
relancer(
       enregistrement.zoneTexte1,
       "00:00",                    // <--- Mettre "00:00" au lieu de "" (Format attendu)
       enregistrement.zoneTexte4,
       enregistrement.zoneTexte5,
       enregistrement.zoneTexte2,
       "[]",                       // <--- "[]" est généralement OK, sinon essayez ""
       enregistrement.zoneTexte6
    );
            
            // ... MAIS on ne supprime PAS l'enregistrement de la liste.
            // On peut ajouter un petit message visuel si besoin, ou simplement laisser le chrono s'ouvrir.
          });
          
          boutonsDiv.appendChild(boutonDupliquer);

        enregistrementDiv.appendChild(boutonsDiv);
      }

      groupeDiv.appendChild(enregistrementDiv);
    });

    enregistrementsDiv.appendChild(groupeDiv);
  }

  setTimeout(() => { changerCouleur(); }, 100);

  if (editionGlobaleActive) showGlobalEditBar();

applyContrastEffects() 
}


function findCodeByFicheNumber(ficheNumber) {
  // Nettoyage du suffixe [n] avant recherche
  ficheNumber = ficheNumber.replace(/\[\d+\]$/, '').trim();

  for (const periode in arborescence) {
    const classeurs = arborescence[periode];
    for (const classeur in classeurs) {
      const interventions = classeurs[classeur];
      for (const titre in interventions) {
        const intervention = interventions[titre];
        if (intervention["Numéro de fiche"] === ficheNumber) {
          const periodCode = getPeriodCode(periode);

          let classeurNumber = "";
          const matchClasseur = classeur.match(/\d+/);
          if (matchClasseur) {
            classeurNumber = matchClasseur[0];
          }

          let titreNumber = "";
          const matchTitre = titre.match(/^\s*(\d+)/);
          if (matchTitre) {
            titreNumber = matchTitre[1];
          }

          let cleanedTitle = titre;
          if (titre.includes('-')) {
            cleanedTitle = titre.substring(titre.indexOf('-') + 1).trim();
          }

          return periodCode + classeurNumber + "-" + titreNumber + " _ " + cleanedTitle;
        }
      }
    }
  }
  return null;
}


function remplacerPlusUnicode(texte) {
    return texte.replace(/\+/g, '＋');
}

function getPeriodCode(periode) {
  // cas particuliers où le code ne correspond pas au premier caractère
  switch (periode) {
    case "10 Mois":
      return "10M";
    case "Bi Annuelle":
      return "BA";
    case "Tri Annuelle":
      return "TA";
    case "Quadri Annuelle":
      return "QA";
    case "Multi Annuelle":
      return "MA";
    default:
      // Pour les autres, on récupère le premier caractère
      return periode.charAt(0);
  }
}

function initGlobalEditBar() {
  if (document.getElementById("globalEditBar")) return;
  const host = document.getElementById("interventionsTab");
  if (!host) return;

  const bar = document.createElement("div");
  bar.id = "globalEditBar";

  const btnSaveAll = document.createElement("button");
  btnSaveAll.type = 'button';
  btnSaveAll.id = "btnSaveAll";
  btnSaveAll.className = "button";
  btnSaveAll.style.display = "inline-block";
  btnSaveAll.style.backgroundColor = "rgb(180, 60, 60)";
  btnSaveAll.style.color = "#fff";
  btnSaveAll.innerHTML = `<span style="position:relative;z-index:1;">💾 Sauvegarder tout</span>`;
  btnSaveAll.addEventListener("click", onSaveAll);

  const btnCancelAll = document.createElement("button");
  btnCancelAll.type = 'button';
  btnCancelAll.id = "btnCancelAll";
  btnCancelAll.className = "button";
  btnCancelAll.style.display = "inline-block";
  btnCancelAll.textContent = "Annuler tout";
  btnCancelAll.addEventListener("click", onCancelAll);

  bar.appendChild(btnSaveAll);
  bar.appendChild(btnCancelAll);
  host.appendChild(bar);
}






function afficherModalEditionTechnicien(technicien, enregistrements) {
  const modalDiv = document.createElement('div');
  modalDiv.className = 'modal';
  modalDiv.style.display = 'block';

  // Vérifier si les données sont chargées
  if (!globalUserData) {
    console.error('Les données JSON ne sont pas disponibles. Assurez-vous qu’elles ont été chargées.');
    return;
  }

  // Convertir globalUserData en objet (si vous avez besoin de parcourir les propriétés)
  let data;
  try {
    data = JSON.parse(globalUserData);
  } catch (error) {
    console.error('Erreur lors du parsing du JSON:', error);
    return;
  }

  modalDiv.innerHTML = `
    <div class="modal-content">
      <span class="close-button" onclick="fermerModal(this)">&times;</span>
      <h2>Modifier le technicien</h2>
      <label for="technicienSelect">Technicien :</label>
      <select id="technicienSelect"></select>
      
      <h3>Temps passé</h3>
      <label style="display: none !important; margin-top: 10px;">Jours :</label>
      <input type="number" id="joursInput" min="0" max="30" value="0" style="display: none !important; margin-bottom: 10px;">
      <label style="display: block; margin-top: 10px;">Heure/Minute :</label>
      <input type="time" id="tempsInput" min="00:00" max="23:59" value="00:00" style="display: block; margin-bottom: 10px;">

      <button id="modifierTechnicienButton">Modifier</button>
    </div>
  `;

  const technicienSelect = modalDiv.querySelector('#technicienSelect');
  const techniciensExistants = getTechniciensExistants(enregistrements, technicien.id, technicien.Tech);

  // Parcourir les données JSON pour remplir le select
  for (const [nom, hash] of Object.entries(data)) {
    if (nom !== "Gestion" && (nom === technicien.Tech || !techniciensExistants.includes(nom))) {
      const option = document.createElement('option');
      option.value = hash;
      option.textContent = nom;
      if (nom === technicien.Tech) {
        option.selected = true;
      }
      technicienSelect.appendChild(option);
    }
  }

  // Extraire et définir les valeurs de temps actuelles
  const temps = extraireTemps(technicien.temps);
  const joursInput = modalDiv.querySelector('#joursInput');
  const tempsInput = modalDiv.querySelector('#tempsInput');

  joursInput.value = temps.jours;
  const heuresStr = temps.heures.toString().padStart(2, '0');
  const minutesStr = temps.minutes.toString().padStart(2, '0');
  tempsInput.value = `${heuresStr}:${minutesStr}`;

  modalDiv.querySelector('#modifierTechnicienButton').addEventListener('click', async () => {
    const selectedTechnicianName = technicienSelect.options[technicienSelect.selectedIndex].text;
    const jours = parseInt(joursInput.value, 10) || 0;
    const [heures, minutes] = tempsInput.value.split(':').map(Number);

    let nouveauTemps = '';

    // Vérification et assemblage du temps
    if (jours > 0) {
      nouveauTemps += `${jours}j `;
    }
    if (heures > 0 || nouveauTemps) {
      nouveauTemps += `${heures}h `;
    }
    if (minutes > 0 || nouveauTemps) {
      nouveauTemps += `${minutes}m`;
    }

    if (!nouveauTemps) {
      nouveauTemps = '0s';
    }

    // Trouver et mettre à jour l'enregistrement
    const index = enregistrements.findIndex(e => comparerEnregistrements(e, technicien));
    if (index !== -1) {
      enregistrements[index].Tech = selectedTechnicianName;
      enregistrements[index].temps = nouveauTemps.trim();
      await setPrefixedItem('enregistrements', JSON.stringify(enregistrements));
      afficherEnregistrements(); // Affichage mis à jour
    }

    fermerModal(modalDiv);
  });

  document.body.appendChild(modalDiv);
  changerCouleur();
}



// parse "[ID1:2@A/1/C/03, ID2:1@B/2/A/07]" ou "ID1:2@..., ID2:1@..."
function parsePiecesPayload(payloadStr) {
  if (!payloadStr || typeof payloadStr !== 'string') return [];
  const s = payloadStr.trim().replace(/^\[/, '').replace(/\]$/, '');
  if (!s) return [];
  return s.split(',')
    .map(x => x.trim())
    .filter(Boolean)
    .map(chunk => {
      const [left, placeRaw = ''] = chunk.split('@');
      const [idRaw, qtyRaw = ''] = (left || '').split(':');
      const id = (idRaw || '').trim();
      const qty = parseInt((qtyRaw || '').trim(), 10) || 1;
      const place = (placeRaw || '').trim();
      if (!id) return null;
      return { id, qty, place };
    })
    .filter(Boolean);
}

// Optionnel : si tu veux récupérer la place via l’objet global "pieces" quand elle manque
function getPlaceById(id) {
  try {
    const p = findPieceById(pieces, id); // tu as déjà findPieceById(obj, id) dans ton code
    return p && typeof p.place === 'string' && p.place.trim() ? p.place.trim() : null;
  } catch { return null; }
}


function buildPiecesRow(enregistrement) {
  // conteneur parent (même structure que ton #pieces-row existant)
  const row = document.createElement('div');
  row.className = 'pieces-row';
  row.id = `pieces-row-${enregistrement.id}`;

  // zone capsules
  const capsules = document.createElement('div');
  capsules.className = 'capsules';
  capsules.id = `capsules-container-${enregistrement.id}`;

  // bouton +
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'add-piece-btn';
  addBtn.textContent = '✏️';
  addBtn.setAttribute('aria-label', 'Ajouter / modifier les pièces');
  addBtn.addEventListener('click', () => {
    // Ouverture depuis Gestion.js → on tag le contexte
    window.modalContext = { origin: 'gestion', targetId: enregistrement.id };
    window.cibleId = enregistrement.id;
    ouvrirModalModifierPiece(enregistrement.zoneTexte1, enregistrement.zoneTexte3 || '[]');
  });
  row.appendChild(addBtn);
  row.appendChild(capsules);

  // --- Rendu des capsules à partir de zoneTexte3 ---
  const arr = parsePiecesPayload(enregistrement.zoneTexte3 || '');
  arr.forEach(({ id: pid, qty, place }) => {
    const placeFinal = (place && place.trim()) ? place.trim() : (getPlaceById(pid) || 'Place inconnue');
    const node = createPrettyCapsule(placeFinal, qty);
    node.style.cursor = 'pointer';
    node.addEventListener('click', () => {
      // réouvrir la modale sur ce groupe
      //window.modalContext = { origin: 'gestion', targetId: enregistrement.id };
      //ouvrirModalModifierPiece(enregistrement.zoneTexte1, enregistrement.zoneTexte3 || '[]');
    });
    capsules.appendChild(node);
  });

  return row;
}



function createPrettyCapsule(place, qty) {
  const root = document.createElement('div');
  root.className = 'capsule';



  // place (mono)
  const placeNode = document.createElement('span');
  placeNode.className = 'capsule-place';
  placeNode.textContent = place;
  placeNode.title = place;
  root.appendChild(placeNode);

  // badge quantité
  if (qty != null && String(qty).trim() !== '') {
    const qBadge = document.createElement('span');
    qBadge.className = 'capsule-qty';
    qBadge.textContent = `Q=${qty}`;
    root.appendChild(qBadge);
  }

  return root;
}
window.onPiecesModified = async function ({ id, pieces }) {
  // 1) MAJ du draft (et persistance immédiate)
  const groupe = enregistrementsDraft.filter(e => e.id === id);
  if (groupe.length) {
    // convention: zoneTexte3 porté par l’enregistrement d’en-tête
    groupe[0].zoneTexte3 = pieces;
    await setPrefixedItem('enregistrements', JSON.stringify(enregistrementsDraft));
  } else {
    console.warn('[onPiecesModified] groupe introuvable pour id =', id);
  }

  // 2) Rafraîchir la ligne des capsules sans tout rerendre si possible
  if (!refreshPiecesRow(id, pieces)) {
    // fallback si le container n’existe pas encore
    await afficherEnregistrements();
  }
};


function refreshPiecesRow(id, payload) {
  const capsules = document.getElementById(`capsules-container-${id}`);
  if (!capsules) return false;

  // vide
  while (capsules.firstChild) capsules.removeChild(capsules.firstChild);

  const arr = parsePiecesPayload(payload || '');
  arr.forEach(({ id: pid, qty, place }) => {
    const placeFinal = (place && place.trim()) ? place.trim() : (getPlaceById(pid) || 'Place inconnue');
    const node = createPrettyCapsule(placeFinal, qty);
    node.style.cursor = 'pointer';
    node.addEventListener('click', () => {
      // réouvrir la modale sur ce groupe
      const header = enregistrementsDraft.find(e => e.id === id);
      const libelle = header ? header.zoneTexte1 : '';
      ouvrirModalModifierPiece(libelle, payload || '[]');
    });
    capsules.appendChild(node);
  });

  return true;
}

