
// --- Configuration par défaut ---
const defaultButtons = [
  { id: 'visuButton', type: 'tab-button_u',  container: 'tab_under', label: '🖥️ VisuPC', labelU: '🖥️', labelZ: '🖥️ VisuPC', onclick: "openTab('visu')", hidden: true },
  //{ id: 'visu2Button', type: 'tab-button_u',  container: 'tab_under', label: '🖥️ Visu2PC', labelU: '🖥️2', labelZ: '🖥️ Visu2PC', onclick: "openTab('visu2')", hidden: true },

  { id: 'creerButton', type: 'tab-button', container: 'tab_under', label: 'Ajouter Correctif', labelU: '➕', labelZ: '➕ Ajouter Correctif', onclick: "openTab('creer')" },
  //{ id: 'plannButton', type: 'tab-button', container: 'tab_under', label: 'Planning', labelU: '📅', labelZ: '📅 Planning', onclick: "openTab('plann')" },
  { id: 'ChronoButton', type: 'tab-button', container: 'tab_under', label: 'Chronos', labelU: '🕧', labelZ: '🕧 Chronos', onclick: "openTab('Chrono')" },
  //{ id: 'retourButton', type: 'tab-button_u', container: 'tab_under', label: '🔙', labelU: '🔙', labelZ: '🔙', onclick: "switRet()" },
  { id: 'interventionsButton', type: 'tab-button', container: 'tab_under', label: 'Interv fini', labelU: '📝', labelZ: '📝 Interv fini', onclick: "openTab('interventions')" },
   // { id: 'ArchiveButton', type: 'tab-button_z', container: 'optionMenu', label: 'Archives', labelU: '🗃️', labelZ: '🗃️ Archives', onclick: "switArc()", hidden: true },
  { id: 'MagaButton', type: 'tab-button_z', container: 'optionMenu', label: 'Magasin', labelU: '🗄️', labelZ: '🗄️ Magasin', onclick: "ouvrirModalModifierPiece()" },
  //{ id: 'NoteButton', type: 'tab-button_z', container: 'optionMenu', label: 'Note', labelU: '📜', labelZ: '📜 Note', onclick: "openTab('Note')" },
  { id: 'NotifButton', type: 'tab-button_u', container: 'tab_under', label: 'Notif', labelU: '🔔', labelZ: '🔔 Notif', onclick: "showModal()", hidden: false },
  //{ id: 'cameraButton', type: 'tab-button_z', container: 'optionMenu', label: 'Camera', labelU: '📷', labelZ: '📷 Camera', onclick: "openTab('camera')" },
  //{ id: 'CintresButton', type: 'tab-button_z', container: 'optionMenu', label: 'Cintres', labelU: '📶', labelZ: '📶 Cintres', onclick: "Gocintre()" },
   // { id: 'retourButton2', type: 'tab-button_z', container: 'optionMenu', label: '🔙 Quitter', labelU: '🔙 Quitter', labelZ: '🔙 Quitter', onclick: "switRet()", hidden: true },
  //{ id: 'switPreButton', type: 'tab-button_z', container: 'optionMenu', label: 'Preventif', labelU: '↔️', labelZ: '↔️ Preventif', onclick: "switPre()", hidden: true },
  { id: 'parametresButton', type: 'tab-button_z', container: 'optionMenu', label: 'Paramètres', labelU: '⚙️', labelZ: '⚙️ Paramètres', onclick: "openTab('parametres')" },
  //{ id: 'decoButton', type: 'tab-button_z', container: 'optionMenu', label: 'Déconnexion', labelU: '🚪', labelZ: '🚪 Déconnexion', onclick: "deco()" , hidden: true },
  { id: 'debugButton', type: 'tab-button_z', container: 'optionMenu', label: 'Debug', labelU: '🖥️', labelZ: '🖥️ Debug', onclick: "showOverlay()", hidden: true },
  { id: 'actuButton', type: 'tab-button_z', container: 'optionMenu', label: 'Actu', labelU: '🔄', labelZ: '🔄 Actualiser', onclick: "Act()", hidden: true },
  { id: 'actuDAButton', type: 'tab-button_z', container: 'optionMenu', label: 'ActuDA', labelU: '🔄', labelZ: '🔄 ACT DATA', onclick: "ActDATA()", hidden: false }
];
// Conserver la configuration initiale pour permettre l'annulation
let buttons = JSON.parse(JSON.stringify(defaultButtons));
let originalConfig = JSON.parse(JSON.stringify(defaultButtons));

async function initConfig() {
  const savedConfigStr = await getPrefixedItem("buttonConfig");

  let savedConfig;
  try {
    if (typeof savedConfigStr === "string" && savedConfigStr.trim() !== "") {
      savedConfig = JSON.parse(savedConfigStr);
    } else {
      savedConfig = [];
    }
  } catch (e) {
    console.error("Erreur lors du parsing JSON config boutons :", e);
    savedConfig = [];
  }

  // Sécurisation obligatoire
  if (!Array.isArray(savedConfig)) {
    savedConfig = [];
  }

  let mergedConfig = savedConfig.slice();
  defaultButtons.forEach(defaultBtn => {
    if (!mergedConfig.find(btn => btn.id === defaultBtn.id)) {
      mergedConfig.push(defaultBtn);
    }
  });

  buttons = mergedConfig;
  originalConfig = JSON.parse(JSON.stringify(buttons));

  const switPreButton = buttons.find(btn => btn.id === 'switPreButton');
  const creerButton = buttons.find(btn => btn.id === 'creerButton');
  const interventionsButton = buttons.find(btn => btn.id === 'interventionsButton');
  const plannBtn = buttons.find(btn => btn.id === 'plannButton');
  const archiveBtn = buttons.find(btn => btn.id === 'ArchiveButton');
  const retourButton = buttons.find(btn => btn.id === 'retourButton');
  const retourButton2 = buttons.find(btn => btn.id === 'retourButton2');
const visu2Button = buttons.find(btn => btn.id === 'visu2Button');


const isPriv = (CléType === 'Priv');
const isStory = (CléType === 'Story');
const isWork = (CléType === 'Work');



  document.querySelectorAll('.tab-button, .tab-button_u, .container, .options-menu').forEach(el => {
    el.classList.toggle('priv', isPriv);
  });

  if (switPreButton) {
  if (isPriv) {
    switPreButton.labelZ = '↔️ Correctif';
    switPreButton.label = 'Correctif';
    if (plannBtn) plannBtn.hidden = false;
    if (archiveBtn) archiveBtn.hidden = true;

    if (retourButton) retourButton.hidden = true;
    if (retourButton2) retourButton2.hidden = true;
    if (interventionsButton) interventionsButton.hidden = false;
    switPreButton.hidden = true;
    creerButton.type = 'tab-button_u';

  } else if (isStory) {
    switPreButton.labelZ = '↔️ Correctif';
    switPreButton.label = 'Correctif';
    if (plannBtn) plannBtn.hidden = true;
    if (archiveBtn) archiveBtn.hidden = true;
    if (interventionsButton) interventionsButton.hidden = true;
    switPreButton.hidden = true;
    if (retourButton) retourButton.hidden = false;
    if (retourButton2) retourButton2.hidden = false;
    creerButton.type = 'tab-button';
    creerButton.labelZ = 'Lieu';
    creerButton.label = 'Lieu';

  } else { // Work ou autres
    switPreButton.labelZ = '↔️ Préventifs';
    switPreButton.label = 'Préventifs';
    if (archiveBtn) archiveBtn.hidden = true;
    if (plannBtn) plannBtn.hidden = true;
    if (retourButton) retourButton.hidden = true;
    switPreButton.hidden = true;
    if (interventionsButton) interventionsButton.hidden = false;
    if (retourButton2) retourButton2.hidden = true;
    creerButton.type = 'tab-button';
  }
  }

  // NE sauvegarder que si savedConfig non vide
  if (savedConfig.length !== 0) {
    await setPrefixedItem("buttonConfig", JSON.stringify(buttons));
  } else {
    console.log("ℹ️ Aucune configuration précédente, pas de sauvegarde forcée.");
  }

  renderButtons();
  populateButtonSelect();

}

// ----- handleResize -----
function handleResize(e) {
  const visuButton = document.getElementById("visuButton");
  const visu2Button = document.getElementById("visu2Button");

  if (visuButton) {
    if (e.matches) {
      visuButton.style.setProperty("display", "block", "important");
      visuButton.style.setProperty("filter", "invert(1)", "important");
    } else {
      visuButton.style.removeProperty("display");
      visuButton.style.removeProperty("filter");
    }
  }

  if (visu2Button) {
    const isPriv = (CléType === "Priv");
    if (isPriv) {
      if (e.matches) {
        visu2Button.style.setProperty("display", "block", "important");
        visu2Button.style.setProperty("filter", "invert(1)", "important");
      } else {
        visu2Button.style.removeProperty("display");
        visu2Button.style.removeProperty("filter");
      }
    } else {
      // Si Work ou Story => forcé masqué
      visu2Button.style.setProperty("display", "none", "important");
      visu2Button.style.removeProperty("filter");
    }
  }
}

// ----- mediaQuery setup -----
const mediaQuery = window.matchMedia("(min-width: 1000px)");
handleResize(mediaQuery);
mediaQuery.addEventListener("change", handleResize);

// Applique une première fois

// Écoute les changements
mediaQuery.addEventListener("change", handleResize);



function renderButtons() {
  // Réinitialisation du container supérieur
  const tabUnderContainer = document.getElementById('tabUnderContainer');
  if (tabUnderContainer) tabUnderContainer.innerHTML = '';

  // Réinitialisation du menu latéral avec user-info
  const optionsMenu = document.getElementById('optionsMenu');
  if (optionsMenu) optionsMenu.innerHTML = '<div id="user-info2"></div>';

  buttons.forEach(btn => {
    const div = document.createElement('div');
    div.id = btn.id;
    div.className = btn.type;
    div.setAttribute('onclick', btn.onclick);

    // Ajout de la classe "hidden" si le bouton est masqué
    if (btn.hidden) {
      div.classList.add('hidden');
    }

    // Choix du label selon le type
    if (btn.type === "tab-button_z") {
      div.innerHTML = btn.labelZ;
    } else if (btn.type === "tab-button_u") {
      div.innerHTML = btn.labelU;
    } else {
      div.innerHTML = btn.label;
    }

    // Ajout dans le bon container
    if (btn.container === 'tab_under' && tabUnderContainer) {
      tabUnderContainer.appendChild(div);
    } else if (btn.container === 'optionMenu' && optionsMenu) {
      optionsMenu.appendChild(div);
    }
  });

  displayUsernameAndLogout();
  handleResize(mediaQuery);

}

// --- Remplissage de la liste déroulante des boutons ---
function populateButtonSelect() {
  const buttonSelect = document.getElementById("buttonSelect");
  if (!buttonSelect) return;

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.text = "Sélectionner bouton à personnaliser";
  defaultOption.disabled = true;
  defaultOption.selected = true;

  buttonSelect.innerHTML = "";
  buttonSelect.appendChild(defaultOption);

  buttons.forEach(btn => {
    const option = document.createElement("option");
    option.value = btn.id;
    option.text = btn.label;
    buttonSelect.appendChild(option);
  });
}


// --- Gestion des événements sur le panneau de configuration ---

document.getElementById("buttonSelect").addEventListener("change", function(){
  const btn = buttons.find(b => b.id === this.value);
  if (!btn) return;

  if (btn.container === "tab_under") {
    document.getElementById("placementSelect").value = "top";
    document.getElementById("sizeConfig").style.display = "block";
    document.getElementById("sizeSelect").value = (btn.type === "tab-button") ? "large" : "small";
  } else {
    document.getElementById("placementSelect").value = "side";
    document.getElementById("sizeConfig").style.display = "none";
  }

  document.getElementById("visibilityConfig").style.display = "block";
  document.getElementById("visibilityCheckbox").checked = !btn.hidden;
});

document.getElementById("visibilityCheckbox").addEventListener("change", function() {
  const id = document.getElementById("buttonSelect").value;
  const btn = buttons.find(b => b.id === id);
  if (!btn) return;

  btn.hidden = !this.checked;
  renderButtons();
});

function setButtonVisibility(id, isVisible) {
  const btn = buttons.find(b => b.id === id);
  if (btn) {
    btn.hidden = !isVisible;
    renderButtons();
  }
}


// Lors du changement du placement
document.getElementById("placementSelect").addEventListener("change", function(){
  const id = document.getElementById("buttonSelect").value;
  const btn = buttons.find(b => b.id === id); // ✅ correction
  if (!btn) return;

  if (this.value === "top") {
    btn.container = "tab_under";
    btn.type = "tab-button";
    document.getElementById("sizeConfig").style.display = "block";
  } else {
    btn.container = "optionMenu";
    btn.type = "tab-button_z";
    document.getElementById("sizeConfig").style.display = "none";
  }
  renderButtons();
});


document.getElementById("sizeSelect").addEventListener("change", function(){
  const id = document.getElementById("buttonSelect").value;
  const btn = buttons.find(b => b.id === id); // ✅ correction
  if (!btn) return;

  if (btn.container === "tab_under") {
    btn.type = (this.value === "large") ? "tab-button" : "tab-button_u";
  }
  renderButtons();
});


// Bouton de déplacement vers le haut dans la liste
document.getElementById("moveUp").addEventListener("click", function(){
  const index = parseInt(document.getElementById("buttonSelect").value);
  if (index > 0) {
    [buttons[index-1], buttons[index]] = [buttons[index], buttons[index-1]];
    populateButtonSelect();
    document.getElementById("buttonSelect").value = index - 1;
    renderButtons();
  }
});

// Bouton de déplacement vers le bas dans la liste
document.getElementById("moveDown").addEventListener("click", function(){
  const index = parseInt(document.getElementById("buttonSelect").value);
  if (index < buttons.length - 1) {
    [buttons[index+1], buttons[index]] = [buttons[index], buttons[index+1]];
    populateButtonSelect();
    document.getElementById("buttonSelect").value = index + 1;
    renderButtons();
  }
});

// Bouton Valider : sauvegarde asynchrone via localStorage
document.getElementById("validate").addEventListener("click", async function(){
  const configStr = JSON.stringify(buttons);
  await setPrefixedItem("buttonConfig", configStr);
  originalConfig = JSON.parse(JSON.stringify(buttons));
  alert("Configuration sauvegardée !");
});

// Bouton Annuler : restauration de la dernière configuration sauvegardée
document.getElementById("cancel").addEventListener("click", function(){
  buttons = JSON.parse(JSON.stringify(originalConfig));
  populateButtonSelect();
  renderButtons();
  alert("Modifications annulées.");
});


// Bouton Réinitialiser : vérifie si "buttonConfig" existe, le supprime le cas échéant, et restaure la configuration par défaut
document.getElementById("resetPrefs").addEventListener("click", async function() {
  const existingConfig = await getPrefixedItem("buttonConfig");
  if (existingConfig) {
    await removePrefixedItem("buttonConfig");
  }
  buttons = JSON.parse(JSON.stringify(defaultButtons));
  originalConfig = JSON.parse(JSON.stringify(defaultButtons));
  populateButtonSelect();
  renderButtons();
  alert("Préférences réinitialisées !");
});



    function Act() {
        reloadpp()
    }


async function Gocintre() {
  const urlParams = new URLSearchParams(window.location.search);
  const utilisateurExclu = urlParams.get('user');

  let angle = getPrefixedItemold('angleCouleur');

  if (!angle) angle = '0'; // Valeur par défaut
  if (typeof angle !== 'string') angle = angle.toString();
  angle = angle.replace(/[^\d.-]/g, ''); // Supprime tout sauf chiffres, point, tiret

  if (angle === '') angle = '0';

  top.location.href = '../Cintres/index.html?user=' 
    + encodeURIComponent(utilisateurExclu)
    + '&value=' + encodeURIComponent(angle);
}
