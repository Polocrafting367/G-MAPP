function remplacerPlusUnicode(texte) {
    return texte.replace(/\+/g, '＋');
}




/* ====================== EDIT GLOBAL ====================== */
let enregistrementsCache = [];      // état persistant (DB)
let enregistrementsDraft = [];      // état de travail (modifiable)
let editionGlobaleActive = false;   // affiche la barre

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }







async function afficherModalEditionDate(enregistrement, enregistrements) {
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal';
    modalDiv.style.display = 'block';

    // Convertir la date au format YYYY-MM-DD pour l'input date
    const dateParts = enregistrement.date.split('/');
    const dateFormatted = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;

    // Date maximale et minimale
    const text = date_LM;  // Assume `date_LM` is defined and holds the max allowable date as string
    const maxDate = text.trim(); 
    const maxDateObj = new Date(maxDate);
    const maxDateMs = maxDateObj.getTime();
    const oneDayMs = 3 * 24 * 60 * 60 * 1000;
    const add = maxDateMs - oneDayMs;
    const minDateObj = new Date(add);
    const minDate = minDateObj.toISOString().split('T')[0];
    const todayFormatted = new Date().toISOString().split('T')[0];

    
    modalDiv.innerHTML = `
        <div class="modal-content">
            <span class="close-button" onclick="fermerModal(this)">&times;</span>
            <h2>Modifier les détails</h2>
            <div>
                <label for="dateInput">Date : (Ne pas revenir avant le ${minDate})</label>
                <input type="date" id="dateInput" value="${dateFormatted}" min="${minDate}" max="${todayFormatted}">
            </div>
<div style="margin-top:10px; display: flex;    gap: 10px;width:95%; ">
           <div style="width:100%;" >
                <label for="typePanneSelect">Type :</label>
                <div id="typePanneHolder"></div>
            </div>
            <div style="width:100%;">
                <label for="causePanneSelect">Cause :</label>
                <div id="causePanneHolder"></div>
            </div>
      </div>
                  <div>
                <label for="tempsArretInput">Temps d'arrêt (hh:mm) :</label>
                <input type="time" id="tempsArretInput" value="${enregistrement.zoneTexte6}">
            </div>
              <div>
                <label for="resumeInput">Résumé :</label>
                <input type="text" id="resumeInput" value="${enregistrement.zoneTexte2}">
            </div>

            <br>
            <button id="modifierDateButton">Modifier</button>
        </div>
    `;

    document.body.appendChild(modalDiv);
// Injection des <select> avec les bonnes valeurs par défaut
const typeSelect  = createSelect('typePanneSelect',  lieuData.types,  enregistrement.zoneTexte4);
const causeSelect = createSelect('causePanneSelect', lieuData.causes, enregistrement.zoneTexte5);

modalDiv.querySelector('#typePanneHolder').appendChild(typeSelect);
modalDiv.querySelector('#causePanneHolder').appendChild(causeSelect);

    // Ajout de l'événement pour modifier les valeurs
modalDiv.querySelector('#modifierDateButton').addEventListener('click', async () => {
    const newDate = modalDiv.querySelector('#dateInput').value;
    if (new Date(newDate) < new Date(minDate) || new Date(newDate) > new Date(todayFormatted)) {
        alert("La date sélectionnée est hors des limites autorisées.");
        return;
    }
    // On applique le remplacement au moment de lire les inputs :
    const newResume = remplacerPlusUnicode(modalDiv.querySelector('#resumeInput').value);
    const newTempsArret = modalDiv.querySelector('#tempsArretInput').value;
const newType  = remplacerPlusUnicode(modalDiv.querySelector('#typePanneSelect').value);
    const newCause = remplacerPlusUnicode(modalDiv.querySelector('#causePanneSelect').value);
    const [year, month, day] = newDate.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    const groupeEnregistrements = enregistrements.filter(e => e.id === enregistrement.id);
    groupeEnregistrements.forEach(enreg => {
        enreg.date = formattedDate;
        enreg.zoneTexte2 = newResume;
        enreg.zoneTexte4 = newType;
        enreg.zoneTexte5 = newCause;
        enreg.zoneTexte6 = newTempsArret;
    });

    await setPrefixedItem('enregistrements', JSON.stringify(enregistrements));
    afficherEnregistrements();
    fermerModal(modalDiv);
});

    changerCouleur();
}





function createSelect(id, options, selectedValue) {
  const s = document.createElement('select');
  s.id = id;
  options.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    if (v === selectedValue) opt.selected = true;
    s.appendChild(opt);
  });
  // si la valeur existante n'est pas dans la liste, on l’ajoute pour ne rien perdre
  if (selectedValue && !options.includes(selectedValue)) {
    const opt = document.createElement('option');
    opt.value = selectedValue;
    opt.textContent = selectedValue + " (ancien)";
    opt.selected = true;
    s.appendChild(opt);
  }
  return s;
}

