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
async function afficherEnregistrements() {
  const enregistrementsDiv = document.getElementById('enregistrements');
  enregistrementsDiv.innerHTML = '';
  const enregistrementsString = await getPrefixedItem('enregistrements');

  // Vérifier le paramètre Export dans l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const isExport = urlParams.get('Export') === 'true';

  try {
    let enregistrements = enregistrementsString ? JSON.parse(enregistrementsString) : [];

    const enregistrementsGroupes = {};
    enregistrements.forEach(enregistrement => {
      if (!enregistrementsGroupes[enregistrement.id]) {
        enregistrementsGroupes[enregistrement.id] = [];
      }
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
        enregistrementDiv.className = 'AFregis';

        if (index === 0) {
          const ficheNumber = enregistrement.zoneTexte1;
          const titreIntervention = findCodeByFicheNumber(ficheNumber);
          titreGroupe.textContent = `${ficheNumber} _ ${titreIntervention || ''}`;
afficherPopupAideCustom(
  enregistrementDiv, 
  `Cliquez sur la <strong>date</strong>, le <strong>résumé</strong> ou le <strong>temps</strong> pour une modif rapide.`,
  'pop_edit'
);

          const dateResumeContainer = document.createElement('div');
          dateResumeContainer.style.display = 'flex';
          dateResumeContainer.style.alignItems = 'center';
          dateResumeContainer.style.gap = '8px';
          dateResumeContainer.style.flexWrap = 'wrap';
          dateResumeContainer.style.marginBottom = '10px';

          const editDateButton = document.createElement('button');
          editDateButton.textContent = '✏️';
          editDateButton.className = 'button-edith';
          editDateButton.style.marginRight = '10px';
          editDateButton.addEventListener('click', () => {
            afficherModalEditionDate(enregistrement, enregistrements);
          });

          const dateSpan = document.createElement('span');
          dateSpan.textContent = enregistrement.date;
          dateSpan.style.cursor = 'pointer';


          const resumeSpan = document.createElement('span');
          resumeSpan.textContent = enregistrement.zoneTexte2;
          resumeSpan.style.cursor = 'pointer';


          const saveButton = document.createElement('button');
          saveButton.textContent = '💾 Sauvegarder';
          saveButton.className = 'button';
          saveButton.style.display = 'none';

          const cancelButton = document.createElement('button');
          cancelButton.textContent = 'Annuler les modifications';
          cancelButton.className = 'button';
          cancelButton.style.display = 'none';

          function showEditButtons() {
            saveButton.style.display = 'inline-block';
            cancelButton.style.display = 'inline-block';
          }

          function restoreView() {
            if (dateInput.parentNode) dateInput.replaceWith(dateSpan);
            if (resumeInput.parentNode) resumeInput.replaceWith(resumeSpan);
            saveButton.style.display = 'none';
            cancelButton.style.display = 'none';
          }

const dateInput = document.createElement('input');
dateInput.type = 'date';
const [jour, mois, annee] = enregistrement.date.split('/');
dateInput.value = `${annee}-${mois.padStart(2, '0')}-${jour.padStart(2, '0')}`;

const { minDate, maxDate } = calculerBornesDate();
dateInput.min = minDate;
dateInput.max = maxDate;
dateInput.style.setProperty('width', 'auto', 'important');


          const resumeInput = document.createElement('input');
          resumeInput.type = 'text';
          resumeInput.value = enregistrement.zoneTexte2;

          dateSpan.addEventListener('click', () => {
            dateSpan.replaceWith(dateInput);
            showEditButtons();
          });

          resumeSpan.addEventListener('click', () => {
            resumeSpan.replaceWith(resumeInput);
            showEditButtons();
          });

saveButton.addEventListener('click', async () => {
    const newDate = dateInput.value;
    let newResume = resumeInput.value;
    const [yyyy, mm, dd] = newDate.split('-');
    const formattedDate = `${dd}/${mm}/${yyyy}`;

    // Nettoyer le + avant de stocker
    newResume = remplacerPlusUnicode(newResume);

    enregistrement.date = formattedDate;
    enregistrement.zoneTexte2 = newResume;

    const groupe = enregistrements.filter(e => e.id === enregistrement.id);
    groupe.forEach(e => {
      e.date = formattedDate;
      e.zoneTexte2 = newResume;
    });

    await setPrefixedItem('enregistrements', JSON.stringify(enregistrements));
    afficherEnregistrements();
});


          cancelButton.addEventListener('click', () => {
            restoreView();
          });

          dateResumeContainer.appendChild(editDateButton);
          dateResumeContainer.appendChild(dateSpan);
          dateResumeContainer.appendChild(document.createTextNode(' - '));
          dateResumeContainer.appendChild(resumeSpan);
          dateResumeContainer.appendChild(saveButton);
          dateResumeContainer.appendChild(cancelButton);
          enregistrementDiv.appendChild(dateResumeContainer);

          techniciensDejaAjoutes.forEach((techEnregistrement) => {
            const techDiv = document.createElement('div');
            techDiv.style.display = 'flex';
            techDiv.style.alignItems = 'center';

            const boutonsContainer = document.createElement('div');
            boutonsContainer.style.marginRight = '10px';
            boutonsContainer.style.display = 'flex';
            boutonsContainer.style.gap = '5px';

            const boutonSupprimerTech = document.createElement('button');
            boutonSupprimerTech.textContent = '🗑️';
            boutonSupprimerTech.className = 'button-supprimer';
            boutonSupprimerTech.addEventListener('click', async () => {
              const confirmation = window.confirm(`Êtes-vous sûr de vouloir supprimer le technicien ${techEnregistrement.Tech} ?`);
              if (confirmation) {
                const indexASupprimer = enregistrements.findIndex(e => comparerEnregistrements(e, techEnregistrement));
                if (indexASupprimer !== -1) {
                  enregistrements.splice(indexASupprimer, 1);
                  await setPrefixedItem('enregistrements', JSON.stringify(enregistrements));
                  afficherEnregistrements();
                }
              }
            });

            const boutonEditerTech = document.createElement('button');
            boutonEditerTech.textContent = '✏️';
            boutonEditerTech.className = 'button-edith';
            boutonEditerTech.addEventListener('click', () => {
              afficherModalEditionTechnicien(techEnregistrement, enregistrements);
            });

            boutonsContainer.appendChild(boutonSupprimerTech);
            boutonsContainer.appendChild(boutonEditerTech);
            techDiv.appendChild(boutonsContainer);
const techText = document.createElement('span');
const tempsOriginal = techEnregistrement.temps;
techText.innerHTML = `<span class="temps-editable" style="cursor:pointer">${tempsOriginal}</span> - ${techEnregistrement.Tech}`;
techDiv.appendChild(techText);

const spanTemps = techText.querySelector('.temps-editable');

// Input time natif
const inputTemps = document.createElement('input');
inputTemps.type = 'time';
inputTemps.id = 'tempsInput';
inputTemps.min = '00:00';
inputTemps.style.width = '100px';
inputTemps.style.display = 'none';

// Boutons
const saveBtnTemps = document.createElement('button');
saveBtnTemps.textContent = '💾 Sauvegarder';
saveBtnTemps.className = 'button';
saveBtnTemps.style.display = 'none';

const cancelBtnTemps = document.createElement('button');
cancelBtnTemps.textContent = 'Annuler';
cancelBtnTemps.className = 'button';
cancelBtnTemps.style.display = 'none';

// Affichage de l'input au clic sur le temps
spanTemps.addEventListener('click', () => {
  const match = tempsOriginal.match(/(\d+)h\s*(\d+)m/);
  if (match) {
    const heures = String(match[1]).padStart(2, '0');
    const minutes = String(match[2]).padStart(2, '0');
    inputTemps.value = `${heures}:${minutes}`;
  } else {
    inputTemps.value = '00:00';
  }
  spanTemps.replaceWith(inputTemps);
  inputTemps.style.display = 'inline-block';
  saveBtnTemps.style.display = 'inline-block';
  cancelBtnTemps.style.display = 'inline-block';
});

// Sauvegarde
spanTemps.addEventListener('click', () => {
  const regex = /(?:(\d+)j)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/;
  const match = regex.exec(techEnregistrement.temps);

  const heures = match && match[2] ? String(match[2]).padStart(2, '0') : '00';
  const minutes = match && match[3] ? String(match[3]).padStart(2, '0') : '00';

  inputTemps.value = `${heures}:${minutes}`;

  spanTemps.replaceWith(inputTemps);
  inputTemps.style.display = 'inline-block';
  saveBtnTemps.style.display = 'inline-block';
  cancelBtnTemps.style.display = 'inline-block';
});




// Annulation
cancelBtnTemps.addEventListener('click', () => {
  inputTemps.replaceWith(spanTemps);
  saveBtnTemps.style.display = 'none';
  cancelBtnTemps.style.display = 'none';
});

// Conteneur des boutons sous la ligne
const editButtonsTempsContainer = document.createElement('div');
editButtonsTempsContainer.style.marginTop = '5px';
editButtonsTempsContainer.style.display = 'flex';
editButtonsTempsContainer.style.gap = '5px';
editButtonsTempsContainer.style.flexWrap = 'wrap';

editButtonsTempsContainer.appendChild(saveBtnTemps);
editButtonsTempsContainer.appendChild(cancelBtnTemps);

enregistrementDiv.appendChild(techDiv);
enregistrementDiv.appendChild(editButtonsTempsContainer);


          });

          const boutonsDiv = document.createElement('div');
          boutonsDiv.style.display = 'flex';

          const boutonAjouterTechnicien = document.createElement('button');
          boutonAjouterTechnicien.textContent = '+ Tech.';
          boutonAjouterTechnicien.className = 'button-tech';
          boutonAjouterTechnicien.style.marginRight = '5px';
          boutonAjouterTechnicien.addEventListener('click', () => {
            afficherModalTechniciens(enregistrement);
          });

          boutonsDiv.appendChild(boutonAjouterTechnicien);

          if (techniciensDejaAjoutes.length === 1 && !isExport) {
            const boutonRestaurer = document.createElement('button');
            boutonRestaurer.textContent = 'Restaurer';
            boutonRestaurer.className = 'button-restaurer';
            boutonRestaurer.style.marginRight = '5px';
            boutonRestaurer.addEventListener('click', () => {
              relancer(
                enregistrement.zoneTexte1,
                enregistrement.temps,
                enregistrement.zoneTexte2,
                enregistrement.zoneTexte3,
                enregistrement.zoneTexte4,
                enregistrement.zoneTexte5,
                enregistrement.zoneTexte6
              );

              const indexASupprimer = enregistrements.findIndex(e => comparerEnregistrements(e, enregistrement));
              if (indexASupprimer !== -1) {
                enregistrements.splice(indexASupprimer, 1);
                setPrefixedItem('enregistrements', JSON.stringify(enregistrements));
                afficherEnregistrements();
              }
            });
            boutonsDiv.appendChild(boutonRestaurer);
          }

          enregistrementDiv.appendChild(boutonsDiv);
        }

        groupeDiv.appendChild(enregistrementDiv);
      });

      enregistrementsDiv.appendChild(groupeDiv);
    }
  } catch (error) {
    console.error(error);
  }

  setTimeout(function () {
    changerCouleur();
  }, 100);
}


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
                <label for="dateInput">Date : (Merci de ne pas revenir avant le ${minDate})</label>
                <input type="date" id="dateInput" value="${dateFormatted}" min="${minDate}" max="${todayFormatted}">
            </div>
            <div>
                <label for="resumeInput">Résumé :</label>
                <input type="text" id="resumeInput" value="${enregistrement.zoneTexte2}">
            </div>
            <div>
                <label for="typePanneSelect">Compteur :</label>
                <input type="text" id="typePanneSelect" value="${enregistrement.zoneTexte4}"></input>
            </div>
            <div>
                <label for="causePanneSelect" style="display: none;">Cause de la panne :</label>
                <input id="causePanneSelect" style="display: none;"></input>
            </div>
            <div>
                <label for="tempsArretInput">Temps d'arrêt (hh:mm) :</label>
                <input type="time" id="tempsArretInput" value="${enregistrement.zoneTexte6}">
            </div>
            <br>
            <button id="modifierDateButton">Modifier</button>
        </div>
    `;

    document.body.appendChild(modalDiv);

    // Ajout de l'événement pour modifier les valeurs
modalDiv.querySelector('#modifierDateButton').addEventListener('click', async () => {
    const newDate = modalDiv.querySelector('#dateInput').value;
    if (new Date(newDate) < new Date(minDate) || new Date(newDate) > new Date(todayFormatted)) {
        alert("La date sélectionnée est hors des limites autorisées.");
        return;
    }
    // On applique le remplacement au moment de lire les inputs :
    const newResume = remplacerPlusUnicode(modalDiv.querySelector('#resumeInput').value);
    const newType = remplacerPlusUnicode(modalDiv.querySelector('#typePanneSelect').value);
    const newCause = remplacerPlusUnicode(modalDiv.querySelector('#causePanneSelect').value);
    const newTempsArret = modalDiv.querySelector('#tempsArretInput').value;

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

function fermerModal(modalElement) {
    modalElement.remove(); // Supprime l'élément modal du DOM
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
      <label style="display: block; margin-top: 10px;">Jours :</label>
      <input type="number" id="joursInput" min="0" max="30" value="0" style="display: block; margin-bottom: 10px;">
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

