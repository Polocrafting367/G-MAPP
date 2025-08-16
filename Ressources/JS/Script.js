
function closeMM() {
    const modal = document.getElementById('dataModal');
    if (modal) {
        modal.style.display = 'none';
    } else {
        console.error("L'élément dataModal n'a pas été trouvé dans le DOM.");
    }
}


async function afficherEnregistrements() {
    const enregistrementsDiv = document.getElementById('enregistrements');

    // Effacer le contenu existant
    enregistrementsDiv.innerHTML = '';

    const enregistrementsString = await getPrefixedItem('enregistrements');

    try {
        let enregistrements = JSON.parse(enregistrementsString);

        // Regrouper les enregistrements par ID
        const enregistrementsGroupes = {};
        enregistrements.forEach(enregistrement => {
            if (!enregistrementsGroupes[enregistrement.id]) {
                enregistrementsGroupes[enregistrement.id] = [];
            }
            enregistrementsGroupes[enregistrement.id].push(enregistrement);
        });

        // Afficher les enregistrements groupés
        for (const [id, groupeEnregistrements] of Object.entries(enregistrementsGroupes)) {
            const groupeDiv = document.createElement('div');
            groupeDiv.className = 'groupe-enregistrements';
            groupeDiv.id = `groupe-${id}`;

            // Ajouter un titre ou une indication pour chaque groupe
            const titreGroupe = document.createElement('h3');
            groupeDiv.appendChild(titreGroupe);

            // Calculer le nombre de techniciens dans le groupe
            const techniciensDejaAjoutes = groupeEnregistrements.filter(enreg => enreg.Tech);

            // Afficher les interventions dans le groupe
            groupeEnregistrements.forEach((enregistrement, index) => {
                const enregistrementDiv = document.createElement('div');
                enregistrementDiv.className = "AFregis"; // Ajouter la classe à l'enregistrementDiv

                // Afficher la première intervention avec tous les détails
                if (index === 0) {
                    titreGroupe.textContent = `${enregistrement.zoneTexte1}`;

                    let enregistrementTexte = `${enregistrement.date} - ${enregistrement.zoneTexte2}`;
                    enregistrementDiv.textContent = enregistrementTexte;

                    // Afficher tous les techniciens sous l'intervention principale avec leur temps et un bouton "Supprimer"
                    techniciensDejaAjoutes.forEach((techEnregistrement) => {
                        const techDiv = document.createElement('div');
                        techDiv.style.display = 'flex';
                        techDiv.style.alignItems = 'center';

                        // Créer le bouton "Supprimer"
                        const boutonSupprimerTech = document.createElement('button');
                        boutonSupprimerTech.textContent = 'Supprimer';
                        boutonSupprimerTech.className = 'button-supprimer'; // Ajouter la classe de style
                        boutonSupprimerTech.style.marginRight = '10px'; // Ajouter une marge à droite pour séparer le bouton du texte
                        boutonSupprimerTech.addEventListener('click', () => {
                            const confirmation = window.confirm(`Êtes-vous sûr de vouloir supprimer le technicien ${techEnregistrement.Tech} ?`);
                            if (confirmation) {
                                const indexASupprimer = enregistrements.findIndex(e => comparerEnregistrements(e, techEnregistrement));
                                if (indexASupprimer !== -1) {
                                    enregistrements.splice(indexASupprimer, 1);
                                    setPrefixedItem('enregistrements', JSON.stringify(enregistrements));
                                    afficherEnregistrements();
                                }
                            }
                        });

                        // Ajouter le bouton avant le texte du technicien
                        techDiv.appendChild(boutonSupprimerTech);

                        // Créer le texte pour le temps et le nom du technicien
                        const techText = document.createElement('span');
                        techText.textContent = `${techEnregistrement.temps} - ${techEnregistrement.Tech}`;

                        // Ajouter le texte au conteneur
                        techDiv.appendChild(techText);

                        enregistrementDiv.appendChild(techDiv);
                    });

                    const boutonsDiv = document.createElement('div');
                    boutonsDiv.style.display = 'flex'; // Utiliser flexbox pour aligner les boutons sur une ligne

                    // Bouton "+ Tech." pour ajouter un technicien supplémentaire
                    const boutonAjouterTechnicien = document.createElement('button');
                    boutonAjouterTechnicien.textContent = '+ Tech.';
                    boutonAjouterTechnicien.className = 'button-tech'; // Ajouter la classe de style
                    boutonAjouterTechnicien.style.marginRight = '5px'; // Ajouter une marge à droite pour séparer les boutons
                    boutonAjouterTechnicien.addEventListener('click', () => {
                        const techniciensDejaAjoutes = groupeEnregistrements.map(enreg => enreg.Tech).filter(tech => tech);
                        afficherModalTechniciens(enregistrement, techniciensDejaAjoutes);
                    });

                    boutonsDiv.appendChild(boutonAjouterTechnicien);

                    // Afficher le bouton "Restaurer" uniquement s'il n'y a qu'un seul technicien
                    if (techniciensDejaAjoutes.length === 1) {
                        const boutonRestaurer = document.createElement('button');
                        boutonRestaurer.textContent = 'Restaurer';
                        boutonRestaurer.className = 'button-restaurer'; // Ajouter la classe de style
                        boutonRestaurer.style.marginRight = '5px'; // Ajouter une marge à droite pour séparer les boutons
                        boutonRestaurer.addEventListener('click', () => {
                            // Logique de restauration
                            relancer(
                                enregistrement.zoneTexte1,
                                enregistrement.temps,
                                enregistrement.zoneTexte2,
                                enregistrement.zoneTexte3,
                                enregistrement.zoneTexte4,
                                enregistrement.zoneTexte5,
                                enregistrement.zoneTexte6
                            );

                            // Supprimer automatiquement l'intervention après restauration
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
    } catch (error) {}
}





function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}





function relancer(nomLieu, temps, liste1, liste2, Text1, Text2, arret) {


    // Ensuite, vous pouvez exécuter votre logique pour ouvrir l'iframe
    ouvrirIframe(nomLieu, temps, liste1, liste2, Text1, Text2, arret);
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
        enregistrement1.zoneTexte3 === enregistrement2.zoneTexte3
    );
}


function getCurrentTime() {
    // Implémentez ici la logique pour obtenir le temps actuel
    // Vous pouvez utiliser la classe Date de JavaScript ou une bibliothèque externe
    const now = new Date();
    return `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} - ${now.getHours()}h${now.getMinutes()}m${now.getSeconds()}s`;
}

let timers = {};
let lieuxState = {};

let globalPauseState = false;

function formatTime(time) {
    return time < 10 ? '0' + time : time;
}


async function openTab(tabName) {
  // Masquer le menu d'options, s'il existe
  const optionsMenu = document.getElementById("optionsMenu");
  if (optionsMenu) {
    optionsMenu.style.display = "none";
    optionsMenu.classList.remove("active");
  }

  // Masquer tous les onglets
  const tabContents = document.getElementsByClassName("tabcontent");
  Array.from(tabContents).forEach(tc => tc.style.display = "none");

  // Retirer la classe "active" de tous les boutons (groupes)
  const tabButtonGroups = ["tab-button", "tab-button_u", "tab-button_z"];
  tabButtonGroups.forEach(group => {
    const buttons = document.getElementsByClassName(group);
    Array.from(buttons).forEach(btn => btn.classList.remove("active"));
  });

  // Afficher l'onglet sélectionné
  const currentTabElement = document.getElementById(tabName + "Tab");
  if (currentTabElement) {
    currentTabElement.style.display = "block";
  } else {
    console.error("Tab element not found for ID:", tabName + "Tab");
  }

  // Ajouter la classe "active" au bouton correspondant
  const currentButtonElement = document.getElementById(tabName + "Button");
  if (currentButtonElement) {
    currentButtonElement.classList.add("active");
  } else {
    console.error("Button element not found for ID:", tabName + "Button");
  }
Array.from(document.querySelectorAll('.tab-button, .tab-button_u, .tab-button_z'))
  .forEach(btn => {
    const isPriv = (CléType === 'Priv');
    btn.classList.toggle('priv', isPriv);
  });

  // Logique spécifique aux onglets
  switch (tabName) {
    case "interventions": {
      setTimeout(afficherEnregistrements, 100);
      const visuTab = document.getElementById("visuTab");
      if (visuTab) visuTab.style.display = "block";
      const tabulSlider = document.getElementById("tabulSlider");
      const tabulValue = tabulSlider ? tabulSlider.checked : false;
        await setPrefixedItem("TABUL", "true");

          afficherPopupAideCustom(
      ".button-wrapper",
      `à la fin de chaque journé merci de terminer les intervention`,
      'pop_inter_info',
      7
    );      
      break;
    }
    case "camera": {
      setTimeout(startCamera, 100);
      break;
    }

    case "creer": {
      const visuTab = document.getElementById("visuTab");
      if (visuTab) visuTab.style.display = "block";
      const tabulSlider = document.getElementById("tabulSlider");
      const tabulValue = tabulSlider ? tabulSlider.checked : false;
      await setPrefixedItem("TABUL", "false");


      break;
    }
    case "Chrono": {
      const visuTab = document.getElementById("visuTab");
      if (visuTab) visuTab.style.display = "block";
      const tabulSlider = document.getElementById("tabulSlider");
      const tabulValue = tabulSlider ? tabulSlider.checked : false;
      await setPrefixedItem("TABUL", "false");

afficherPopupAideCustom(
     "#chronosContainer",
      `Un theme constrasté et disponible dans les paramètres <br> ou directement ici > <button onclick="toggleContrast()">Contraste élevé</button>
`,
      'pop_Contrast_info',
      5
    ); 

      break;
    }

case "visu": {
  const autoUser = localStorage.getItem("AUTOUSER");
  const univ = localStorage.getItem(autoUser + "_uver") || "Work";

  const visuTab = document.getElementById("visuTab");
  if (visuTab) visuTab.classList.add("active");

  const chronoTab = document.getElementById("ChronoTab");
  if (chronoTab) chronoTab.style.display = "block";

  const interventionsTab = document.getElementById("interventionsTab");
  if (interventionsTab) interventionsTab.style.display = "block";

  if (univ === "Priv") {
    const plannTab = document.getElementById("plannTab");
    if (plannTab) plannTab.style.display = "block";
  } else if (univ === "Work" || univ === "Story") {
    const creerTab = document.getElementById("creerTab");
    if (creerTab) creerTab.style.display = "block";
  }

  await setPrefixedItem("TABUL", "true");
  break;
}


    case "plann": {
          await setPrefixedItem("TABUL", "false");

              const visuTab = document.getElementById("visuTab");
      if (visuTab) visuTab.style.display = "block";
    const jourNom = jours[currentJourIndex];
    changerJour(0);
     //getPrefixedItemPrev('lieuxHebdo')
      break;
    }
    default: {
      setTimeout(stopCamera, 100);
      break;
    }
  }

  changerCouleur();
  //setPrefixedItem("currentTab", tabName);
}





function mettreAJourListeDeroulante(nouveauLieu) {
    const lieuxDropdown = document.getElementById('lieuxDropdown');

    // Vérifier si nouveauLieu est différent de "[]"
    if (nouveauLieu.trim() !== '' && nouveauLieu !== "[]") {
        // Ajouter le nouvel élément à la liste déroulante
        const option = document.createElement('option');
        option.value = nouveauLieu;
        option.textContent = nouveauLieu;
        lieuxDropdown.appendChild(option);
    }
}




function parcourirArborescenceEtCreerIframes(arbre, parent) {
    for (const lieu in arbre) {
        const iframeContainer = document.createElement('div');
        const iframe = document.createElement('iframe');
        const nomLieu = lieu.toLowerCase().replace(/\s+/g, '-');

        iframe.id = `iframe-${nomLieu}`;
        iframe.src = `chrono.html?lieu=${lieu}`;

        iframeContainer.appendChild(iframe);
        parent.appendChild(iframeContainer);

        if (Object.keys(arbre[lieu]).length > 0) {
            parcourirArborescenceEtCreerIframes(arbre[lieu], iframeContainer);
        }
    }
}



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
    if (!dateStr) return "N/A";
    const [day, month, year] = dateStr.split('/').map(part => part.padStart(2, '0'));
    return `${year}${month}${day}`;
}


function convertToHours(timeStr, applyMinTime = false) {
    if (!timeStr) return "0";

    // Regex pour capturer les heures (hh) et minutes (mm) sous la forme hh:mm
    const regex = /(\d{2}):(\d{2})/;
    const matches = timeStr.match(regex);

    let hours = 0;

    if (matches) {
        const hh = parseInt(matches[1], 10); // Extraction des heures
        const mm = parseInt(matches[2], 10); // Extraction des minutes

        // Conversion : heures + (minutes converties en fraction d'heure)
        hours = hh + (mm / 60);
    }

    // Si applyMinTime est vrai, on applique la règle du minimum de 1 minute
    if (applyMinTime) {
        const minHours = 1 / 60; // 1 minute = 1/60 d'heure
        return Math.max(hours, minHours).toFixed(3);
    }

    return hours.toFixed(3); // Pas de minimum appliqué
}

exportInterventions = async function(exportType) {
    const currentDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const enregistrementsString = await getPrefixedItem('enregistrements');

    if (!enregistrementsString) {
        alert("Aucun enregistrement trouvé.");
        return;
    }

    let enregistrements;
    try {
        enregistrements = JSON.parse(enregistrementsString);
    } catch (e) {
        alert("Erreur lors du parsing des enregistrements.");
        return;
    }

    const url = new URL(window.location.href);
    const user = decodeURIComponent(url.searchParams.get('user')) || "Utilisateur inconnu";

    // Ajout d'un timestamp pour récupérer le fichier JSON de manière unique
    const timestamp = new Date().getTime();
    const jsonFileUrl = `user/${user}.json?timestamp=${timestamp}`;

    fetch(jsonFileUrl)
        .then(response => response.json())
        .then(jsonData => {
            // Traitement du JSON récupéré si nécessaire
        })
        .catch(error => {
            console.error("Erreur lors de la récupération du fichier JSON :", error);
        });

    let csvContent = "Date intervention;Désignation machine;Type de panne;Cause;Résumé intervention;Durée arrêt (h);Personnel;Nombre d'heures;Heure de fin;\n";

    enregistrements.forEach(record => {
        if (record) {

            const dateIntervention = record.date ? formatDate(record.date) : "N/A";
            const designationMachine = record.zoneTexte1 || "N/A";
            const typeDePanne = record.zoneTexte4 || "N/A";
            const cause = record.zoneTexte5 || "N/A";
            const resumeIntervention = record.zoneTexte2 || "N/A";
            const dureeArret = record.zoneTexte6 ? convertToHours(record.zoneTexte6) : "0";
            const nombreHeures = record.temps ? convertToHours(record.temps, true) : "0";
            const HeurDébut = record.heureEnregistrement || "N/A";

            // Vérifier si l'enregistrement a un technicien spécifique
            const personnel = record.Tech ? record.Tech : user;

            // Construction de la ligne CSV
            csvContent += `${dateIntervention};${designationMachine};${typeDePanne};${cause};${resumeIntervention};${dureeArret};${personnel};${nombreHeures};${HeurDébut}\n`;
        }
    });

    const bom = "\uFEFF";
    const finalContent = bom + csvContent;

    if (exportType === 'server') {
        const formData = new FormData();
        formData.append("user", user);
        formData.append("csvContent", finalContent);

        fetch("../PHP/save_interventions.php", {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    removePrefixedItem('enregistrements');
                    alert("Les interventions ont été enregistrées sur le serveur et supprimées localement.");
                    reloadpp()
                } else {
                    alert("Erreur lors de l'enregistrement sur le serveur : " + data.error);
                }
            })
            .catch(error => {
                alert("Erreur lors de l'envoi au serveur.");
            });
    } else if (exportType === 'local') {
        const fileName = `${currentDate}_${user}_${enregistrements.length}_inter.csv`;
        const blob = new Blob([finalContent], {
            type: 'text/csv;charset=utf-8;'
        });
        const urlBlob = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = urlBlob;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}



