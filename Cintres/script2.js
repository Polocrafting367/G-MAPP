// Référence aux boutons du panneau de contrôle
const btnChangerCode = document.getElementById('btnChangerCode');
const btnCombinerCode = document.getElementById('btnCombinerCode');
const btnSupprimerCode = document.getElementById('btnSupprimerCode');

// Référence à la modale et ses éléments
const modalChangerCode = document.getElementById('modalChangerCode');
const modalClose = document.querySelector('.modal-close');
const modalValider = document.getElementById('modalValider');
const modalAnnuler = document.getElementById('modalAnnuler');
const inputNouveauCode = document.getElementById('nouveauCode');

// Pour éviter que le système de scan principal capture le nouveau code,
// vous pouvez désactiver temporairement l'écoute du clavier lors de l'ouverture de la modale.
function disableGlobalScan() {
  document.removeEventListener('keydown', globalScanHandler);
}
function enableGlobalScan() {
  document.addEventListener('keydown', globalScanHandler);
}

// Exemple de globalScanHandler (celui qui gère le scan principal)
function globalScanHandler(e) {
  // Votre code de scan principal ici...
}

// Ouvrir la modale "Changer code"
btnChangerCode.addEventListener('click', () => {
  modalChangerCode.style.display = 'block';
  modalOpen = true; // Indiquer que la modale est ouverte
  console.log(modalOpen)
  inputNouveauCode.value = ''; // Réinitialiser le champ
  inputNouveauCode.focus();
});

modalClose.addEventListener('click', () => {
  modalChangerCode.style.display = 'none';
  modalOpen = false; // La modale est fermée
    console.log(modalOpen)

});

modalAnnuler.addEventListener('click', () => {
  modalChangerCode.style.display = 'none';
  modalOpen = false; // La modale est fermée
    console.log(modalOpen)

});

modalValider.addEventListener('click', () => {
  let nouveauCode = inputNouveauCode.value.trim();

  // Extraction du contenu entre "scan-" et "-fin"
  if (nouveauCode.includes("scan-") && nouveauCode.includes("-fin")) {
    let startIdx = nouveauCode.indexOf("scan-") + 5;
    let endIdx = nouveauCode.indexOf("-fin");
    if (endIdx > startIdx) {
      nouveauCode = nouveauCode.substring(startIdx, endIdx);
    }
  }

  if (nouveauCode === "") {
    alert("Veuillez saisir un nouveau code.");
    return;
  }
  
  // Vérifier si le nouveau code existe déjà
  fetch(`check_code.php?code=${encodeURIComponent(nouveauCode)}`)
    .then(response => response.json())
    .then(data => {
      if (data.exists) {
        // Le code existe déjà : ouvrir la modal de combinaison
        modalChangerCode.style.display = 'none';
        modalCombinerCode.style.display = 'block';
        modalOpen = true;
        // Remplir les champs de la modal de combinaison
        inputCodeActuel.value = currentScannedCode || "";
        inputNouveauCodeCombine.value = nouveauCode;
        // Sélectionner par défaut le nouveau code (le second)
        let radios = document.getElementsByName('bestCode');
        radios.forEach(radio => {
          radio.checked = (radio.value === "nouveau");
        });
      } else {
        // Le code n'existe pas : poursuivre le changement de code
        fetch(`changer_code.php?ancien_code=${encodeURIComponent(currentScannedCode)}&nouveau_code=${encodeURIComponent(nouveauCode)}&user=${encodeURIComponent(userParam)}`)
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              alert("Code changé avec succès !");
              document.getElementById('scanned-code').textContent = nouveauCode;
              if (data.historique) {
                displayHistory(data.historique);
              }
            } else {
              alert("Erreur lors du changement de code : " + data.message);
            }
            modalChangerCode.style.display = 'none';
            modalOpen = false;
            enableGlobalScan();
          })
          .catch(error => {
            console.error("Erreur dans le changement de code:", error);
            modalChangerCode.style.display = 'none';
            modalOpen = false;
            enableGlobalScan();
          });
      }
    })
    .catch(error => {
      console.error("Erreur lors de la vérification du code :", error);
    });
});


// Références pour le modal de combinaison de code
const modalCombinerCode = document.getElementById('modalCombinerCode');
const modalCombinerClose = document.getElementById('modalCombinerClose');
const modalCombinerValider = document.getElementById('modalCombinerValider');
const modalCombinerAnnuler = document.getElementById('modalCombinerAnnuler');
const inputNouveauCodeCombine = document.getElementById('nouveauCodeCombine');
const inputCodeActuel = document.getElementById('codeActuel');


// Fonction d'extraction pour traiter les codes de la forme "scan-...-fin"
function extractCode(text) {
  let code = text.trim();
  if (code.includes("scan-") && code.includes("-fin")) {
    let startIdx = code.indexOf("scan-") + 5;
    let endIdx = code.indexOf("-fin");
    if (endIdx > startIdx) {
      code = code.substring(startIdx, endIdx);
    }
  }
  return code;
}

// Ouvrir la modal de combinaison de code
btnCombinerCode.addEventListener('click', () => {
  modalCombinerCode.style.display = 'block';
  modalOpen = true;
  // Désactiver le scan global si nécessaire (voir méthode précédente)
  // Remplir le champ "code actuel" avec le code scanné actuel
  inputCodeActuel.value = currentScannedCode || "";
  // Réinitialiser le champ du nouveau code
  inputNouveauCodeCombine.value = "";
  // Réinitialiser la sélection radio
  let radios = document.getElementsByName('bestCode');
  radios.forEach(radio => radio.checked = false);
  inputNouveauCodeCombine.focus();
});

// Fermer la modal de combinaison lorsque l'on clique sur la croix
modalCombinerClose.addEventListener('click', () => {
  modalCombinerCode.style.display = 'none';
  modalOpen = false;
});

// Fermer la modal sur Annuler
modalCombinerAnnuler.addEventListener('click', () => {
  modalCombinerCode.style.display = 'none';
  modalOpen = false;
});




modalValider.addEventListener('click', () => {
  let nouveauCode = inputNouveauCode.value.trim();

  // Extraction du contenu entre "scan-" et "-fin"
  if (nouveauCode.includes("scan-") && nouveauCode.includes("-fin")) {
    let startIdx = nouveauCode.indexOf("scan-") + 5;
    let endIdx = nouveauCode.indexOf("-fin");
    if (endIdx > startIdx) {
      nouveauCode = nouveauCode.substring(startIdx, endIdx);
    }
  }

  if (nouveauCode === "") {
    alert("Veuillez saisir un nouveau code.");
    return;
  }
  
  // Vérifier si le nouveau code existe déjà
  fetch(`check_code.php?code=${encodeURIComponent(nouveauCode)}`)
    .then(response => response.json())
    .then(data => {
      if (data.exists) {
        // Si le code existe déjà, on ouvre la modal de combinaison
        modalChangerCode.style.display = 'none';
        modalCombinerCode.style.display = 'block';
        modalOpen = true;
        // Remplir les champs de la modal de combinaison
        inputCodeActuel.value = currentScannedCode || "";
        inputNouveauCodeCombine.value = nouveauCode;
        // Sélectionner par défaut le nouveau code (le second)
        let radios = document.getElementsByName('bestCode');
        radios.forEach(radio => {
          radio.checked = (radio.value === "nouveau");
        });
      } else {
        // Si le code n'existe pas, poursuivre le changement de code normalement
        fetch(`changer_code.php?ancien_code=${encodeURIComponent(currentScannedCode)}&nouveau_code=${encodeURIComponent(nouveauCode)}&user=${encodeURIComponent(userParam)}`)
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              document.getElementById('scanned-code').textContent = nouveauCode;
              if (data.historique) {
                displayHistory(data.historique);
              }
            } else {
              alert("Erreur lors du changement de code : " + data.message);
            }
            modalChangerCode.style.display = 'none';
            modalOpen = false;
            enableGlobalScan();
          })
          .catch(error => {
            console.error("Erreur dans le changement de code:", error);
            modalChangerCode.style.display = 'none';
            modalOpen = false;
            enableGlobalScan();
          });
      }
    })
    .catch(error => {
      console.error("Erreur lors de la vérification du code :", error);
    });
});


modalCombinerValider.addEventListener('click', () => {
  // Extraire le nouveau code
  let nouveauCodeRaw = inputNouveauCodeCombine.value;
  let nouveauCode = extractCode(nouveauCodeRaw);
  
  // Récupérer le code actuel (déjà affiché dans le champ)
  let codeActuel = extractCode(inputCodeActuel.value);

  if (codeActuel === "" || nouveauCode === "") {
    alert("Veuillez renseigner les deux codes.");
    return;
  }
  
  // Vérifier qu'une option a été sélectionnée
  const bestCodeRadio = document.querySelector('input[name="bestCode"]:checked');
  if (!bestCodeRadio) {
    alert("Veuillez sélectionner le code en meilleur état.");
    return;
  }
  // bestChoice est soit "actuel" soit "nouveau"
  const bestChoice = bestCodeRadio.value;

  // Lancer la requête AJAX pour combiner les fichiers et créer un événement de combinaison
  fetch(`combiner_code.php?code_actuel=${encodeURIComponent(codeActuel)}&nouveau_code=${encodeURIComponent(nouveauCode)}&best_choice=${encodeURIComponent(bestChoice)}&user=${encodeURIComponent(userParam)}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert("Codes combinés avec succès !");
        // Mettre à jour l'affichage du code scanné en fonction du meilleur code sélectionné
        document.getElementById('scanned-code').textContent = bestChoice === "actuel" ? codeActuel : nouveauCode;
        // Rafraîchir l'historique
        if (data.historique) {
          displayHistory(data.historique);
        }
      } else {
        alert("Erreur lors de la combinaison : " + data.message);
      }
      modalCombinerCode.style.display = 'none';
      modalOpen = false;
      enableGlobalScan();
    })
    .catch(error => {
      console.error("Erreur dans la combinaison de code:", error);
      modalCombinerCode.style.display = 'none';
      modalOpen = false;
      enableGlobalScan();
    });
});



const accentValue = urlParams.get('value'); // Exemple : "162"

if (accentValue) {
  // Définir des couleurs en HSL avec des niveaux de luminosité différents
  const accentLight  = `hsl(${accentValue}, 70%, 80%)`; // Variante claire
  const accentNormal = `hsl(${accentValue}, 70%, 50%)`; // Variante normale
  const accentDark   = `hsl(${accentValue}, 70%, 30%)`; // Variante foncée

  // Mettre à jour les variables CSS
  document.documentElement.style.setProperty('--accent-color-light', accentLight);
  document.documentElement.style.setProperty('--accent-color', accentNormal);
  document.documentElement.style.setProperty('--accent-color-dark', accentDark);
}
