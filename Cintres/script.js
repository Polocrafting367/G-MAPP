window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'scan') {
        alert('iframe: ' + event.data.detail);
        scannedText = "scan-https://" + event.data.detail + "-fin";
        processScannedCode(scannedText);
    }
});




/* script.js */
console.log("Script démarré, écoute du clavier pour scanner...");

let inputBuffer = "";
let currentScannedCode = null;
let currentState = { puce: false, mecanique: false, ok: false };
// Récupérer le paramètre "user" depuis l'URL
const urlParams = new URLSearchParams(window.location.search);
const userParam = urlParams.get('user') || 'Systeme';

/**
 * Réinitialise l'état courant et réactive tous les boutons.
 */
function resetState() {
  currentState = { puce: false, mecanique: false, ok: false };
  document.querySelectorAll('.status-button').forEach(button => {
    button.classList.remove('active');
    button.disabled = false;
  });
}

/**
 * Ecoute le clavier pour détecter la séquence "scan-...-fin"
 */
let modalOpen = false;

document.addEventListener('keydown', (e) => {
  // Si la modal est ouverte, ne pas traiter les touches
  if (modalOpen) return;
  
  // Ajouter la touche pressée dans le buffer
  inputBuffer += e.key;
  console.log("Buffer:", inputBuffer);

  // Si le buffer contient "-fin", on extrait le code
  if (inputBuffer.includes("-fin")) {
    // Trouver l'index de la dernière occurrence de "-fin"
    const endIdx = inputBuffer.lastIndexOf("-fin");
    // Extraire les 6 caractères juste avant "-fin"
    const scannedCode = inputBuffer.substring(endIdx - 6, endIdx);
    
    if (scannedCode.length === 6) {
      console.log("Code scanné détecté :", scannedCode);
      document.getElementById('scanned-code').textContent = scannedCode;
      processScannedCode(scannedCode);
    } else {
      console.log("Le code extrait n'a pas 6 caractères, réinitialisation du buffer.");
    }
    // Réinitialiser le buffer après extraction
    inputBuffer = "";
  }
});



function processScannedCode(code) {
  currentScannedCode = code;
  resetState();
  fetch("scan.php?code=" + encodeURIComponent(code) + "&user=" + encodeURIComponent(userParam))
    .then(response => response.json())
    .then(data => {
      if (data.exists) {
        console.log("Fichier existant retrouvé :", data);
        displayHistory(data.historique);

        // Afficher création, créateur et dernière lecture
        if (data.creation_date && data.creator) {
          document.getElementById('creation-date').textContent = data.creation_date;
          document.getElementById('creator').textContent = data.creator;
        }
        if (data.historique && data.historique.length > 0) {
          const lastEvent = data.historique[data.historique.length - 1];
          document.getElementById('last-read').textContent = getElapsedTime(data.last_read);
        }

        if (data.current_state) {
          currentState = data.current_state;
          updateButtonUI();
        }
      } else {
        console.log("Nouveau code enregistré, en attente de choix de réparation.");
        // Au lieu d'afficher un message, on affiche l'historique (même s'il est vide)
        displayHistory(data.historique);

        if (data.creation_date) {
          document.getElementById('creation-date').textContent = data.creation_date;
        }
        if (data.creator) {
          document.getElementById('creator').textContent = data.creator;
        }
        if (data.historique && data.historique.length > 0) {
          const lastEvent = data.historique[data.historique.length - 1];
          document.getElementById('last-read').textContent = getElapsedTime(lastEvent.date);
        }
      }
    })
    .catch(error => console.error("Erreur dans processScannedCode:", error));
}


/**
 * Affiche l'historique sous forme de cartes.
 * Chaque événement (assumé être un objet avec au moins une date et une action)
 * est affiché dans une "carte" dans le div #history-content.
 */
function displayHistory(historyArray) {
  const historyContent = document.getElementById('history-content');
  historyContent.innerHTML = '';

  if (!Array.isArray(historyArray) || historyArray.length === 0) {
    historyContent.innerHTML = '<p>Aucun historique trouvé.</p>';
    return;
  }

  // Inverser l'historique pour que le dernier événement apparaisse en premier
  const reversedHistory = [...historyArray].reverse();
  const defaultCount = 5;
  const eventsToDisplay = reversedHistory.slice(0, defaultCount);

  // Fonction pour créer et ajouter une carte événement
  function addEventCard(event) {
    // Conteneur principal de la carte
    const card = document.createElement('div');
    card.className = 'event-card';

    // En-tête : Date
    const header = document.createElement('div');
    header.className = 'event-header';
    const dateDiv = document.createElement('div');
    dateDiv.className = 'event-date';
    dateDiv.textContent = `Scan : ${event.date || ''}`;
    header.appendChild(dateDiv);

    // Action
    const actionDiv = document.createElement('div');
    actionDiv.className = 'event-action';
    actionDiv.textContent = event.action ? event.action : 'Action :';
    card.appendChild(header);
    card.appendChild(actionDiv);

    // Affichage conditionnel des états
    if (event.state && (event.state.puce !== undefined || event.state.mecanique !== undefined || event.state.ok !== undefined)) {
      const statesDiv = document.createElement('div');
      statesDiv.className = 'event-states';
      statesDiv.appendChild(createCheckbox('Puce Changé', event.state?.puce));
      statesDiv.appendChild(createCheckbox('Mécanique', event.state?.mecanique));
      statesDiv.appendChild(createCheckbox('Cintre OK', event.state?.ok));
      card.appendChild(statesDiv);
    }

    // Pied de carte : Code et User
    const footerDiv = document.createElement('div');
    footerDiv.className = 'event-footer';
    const codeDiv = document.createElement('div');
    codeDiv.className = 'event-code';
    codeDiv.textContent = `Code : ${event.code || ''}`;
    const userDiv = document.createElement('div');
    userDiv.className = 'event-user';
    userDiv.textContent = `User : ${event.user || ''}`;
    footerDiv.appendChild(codeDiv);
    footerDiv.appendChild(userDiv);
    card.appendChild(footerDiv);

    historyContent.appendChild(card);
  }

  // Afficher les 5 premiers événements
  eventsToDisplay.forEach(addEventCard);

  // Si plus de 5 événements, ajouter le bouton "Afficher plus"
  if (reversedHistory.length > defaultCount) {
    const showMoreButton = document.createElement('button');
    showMoreButton.textContent = 'Afficher plus';
    showMoreButton.className = 'control-button';
    showMoreButton.style.margin = '10px auto';
    showMoreButton.style.display = 'block';
    showMoreButton.addEventListener('click', () => {
      // Vider la zone et afficher tous les événements
      historyContent.innerHTML = '';
      reversedHistory.forEach(addEventCard);
    });
    historyContent.appendChild(showMoreButton);
  }
}


/**
 * Crée un label contenant une case à cocher non interactive et le texte associé.
 */
function createCheckbox(labelText, isChecked) {
  const label = document.createElement('label');
  label.className = 'checkbox-label';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = !!isChecked;
  checkbox.disabled = true; // Rend la case non interactive

  const textSpan = document.createElement('span');
  textSpan.textContent = ` ${labelText}`;

  label.appendChild(checkbox);
  label.appendChild(textSpan);

  return label;
}


const mapping = {
  "puce changé": "puce",
  "réparation mecanique": "mecanique",
  "cintre ok": "ok"
};
/**
 * Met à jour l’interface des boutons selon l'état currentState.
 */
function updateButtonUI() {
  // Première passe : gestion de la classe "active"
  document.querySelectorAll('.status-button').forEach(button => {
    let btnText = button.textContent.trim().toLowerCase();
    // Utilise le mapping si disponible, sinon on garde le texte tel quel
    let key = mapping[btnText] ? mapping[btnText] : btnText;
    if (currentState[key]) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
      button.disabled = false;
    }
  });
  
  // Désactiver certains boutons en fonction de l'état
  if (currentState.ok) {
    document.querySelectorAll('.status-button').forEach(button => {
      let btnText = button.textContent.trim().toLowerCase();
      let key = mapping[btnText] ? mapping[btnText] : btnText;
      if (key === "puce" || key === "mecanique") {
        button.disabled = true;
      }
    });
  } else if (currentState.puce || currentState.mecanique) {
    document.querySelectorAll('.status-button').forEach(button => {
      let btnText = button.textContent.trim().toLowerCase();
      let key = mapping[btnText] ? mapping[btnText] : btnText;
      if (key === "ok") {
        button.disabled = true;
      }
    });
  }
}

/**
 * Ajoute un écouteur à chaque bouton de statut.
 * Au clic :
 * - Si le bouton est déjà actif, l'état est réinitialisé (action "clear").
 * - Sinon, le bouton est activé, l'état est mis à jour et l'historique est modifié.
 */
document.querySelectorAll('.status-button').forEach(button => {
  button.addEventListener('click', function() {
    let btnText = this.textContent.trim().toLowerCase();
    let key = mapping[btnText] || btnText;
    if (currentState[key] === true) {
      console.log("Déactivation de", key, "→ réinitialisation de l'état");
      resetState();
      updateStatus("clear");
    } else {
      currentState[key] = true;
      console.log("Activation de", key, "→ état mis à jour :", currentState);
      if (key === "ok") {
        currentState.puce = false;
        currentState.mecanique = false;
      } else {
        currentState.ok = false;
      }
      updateButtonUI();
      updateStatus("update");
    }
  });
});

function getElapsedTime(lastReadStr) {
  // Convertir "YYYY-MM-DD HH:mm:ss" en format ISO (YYYY-MM-DDTHH:mm:ss)
  const lastReadDate = new Date(lastReadStr.replace(' ', 'T'));
  const now = new Date();
  let diffMs = now - lastReadDate; // Différence en millisecondes

  // Si diffMs est négatif, forcer à zéro
  if (diffMs < 0) diffMs = 0;
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let elapsed = "";

  // Calculer années, mois et jours si le nombre de jours est significatif
  if (diffDays >= 365) {
    const years = Math.floor(diffDays / 365);
    const remainingDaysAfterYears = diffDays % 365;
    const months = Math.floor(remainingDaysAfterYears / 30);
    const days = remainingDaysAfterYears % 30;
    
    elapsed += years + " an" + (years > 1 ? "s" : "");
    if (months > 0 || days > 0) {
      elapsed += ", ";
    }
    if (months > 0) {
      elapsed += months + " mois";
      if (days > 0) {
        elapsed += " et ";
      }
    }
    if (days > 0) {
      elapsed += days + " jour" + (days > 1 ? "s" : "");
    }
  } else if (diffDays >= 30) {
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    elapsed += months + " mois";
    if (days > 0) {
      elapsed += " et " + days + " jour" + (days > 1 ? "s" : "");
    }
  } else if (diffDays > 0) {
    // Moins de 30 jours, afficher jours et éventuellement heures
    elapsed += diffDays + " jour" + (diffDays > 1 ? "s" : "");
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (diffHours > 0) {
      elapsed += " et " + diffHours + " heure" + (diffHours > 1 ? "s" : "");
    }
  } else {
    // Si moins d'un jour, afficher les heures ou minutes
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (diffHours > 0) {
      elapsed += diffHours + " heure" + (diffHours > 1 ? "s" : "");
    } else if (diffMinutes > 0) {
      elapsed += diffMinutes + " minute" + (diffMinutes > 1 ? "s" : "");
    } else {
      elapsed = "moins d'une minute";
    }
  }
  
  return elapsed.trim();
}

/**
 * Envoie une requête vers update_status.php pour mettre à jour l'historique dans le même fichier.
 * Selon l'action ("update" pour une mise à jour ou "clear" pour une réinitialisation),
 * l'historique est mis à jour et réaffiché sous forme de cartes.
 */
function updateStatus(action) {
  if (!currentScannedCode) {
    console.warn("Aucun code scanné pour mise à jour.");
    return;
  }
  
  if (action === "update") {
    const url = `update_status.php?code=${encodeURIComponent(currentScannedCode)}&user=${encodeURIComponent(userParam)}&puce=${currentState.puce}&mecanique=${currentState.mecanique}&ok=${currentState.ok}`;
    fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log("Mise à jour ok :", data);
        if (data.success) {
          displayHistory(data.historique);
          if (data.creation_date && data.creator) {
            document.getElementById('creation-date').textContent = data.creation_date;
            document.getElementById('creator').textContent = data.creator;
          }
          if (data.last_read) {
document.getElementById('last-read').textContent = getElapsedTime(data.last_read);
          }
        } else {
          console.error("Erreur de mise à jour :", data.message);
        }
      })
      .catch(error => console.error("Erreur dans updateStatus:", error));
  } else if (action === "clear") {
    const url = `update_status.php?code=${encodeURIComponent(currentScannedCode)}&user=${encodeURIComponent(userParam)}&clear=1`;
    fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log("Clear update ok :", data);
        if (data.success) {
          displayHistory(data.historique);
          if (data.creation_date && data.creator) {
            document.getElementById('creation-date').textContent = data.creation_date;
            document.getElementById('creator').textContent = data.creator;
          }
          if (data.last_read) {
document.getElementById('last-read').textContent = getElapsedTime(data.last_read);
          }
        } else {
          console.error("Erreur de mise à jour clear :", data.message);
        }
      })
      .catch(error => console.error("Erreur dans updateStatus clear:", error));
  }
}

