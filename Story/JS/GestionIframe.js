let triColonneActuelle = null;
let triOrdreActuel = 'desc'; // Valeur par défaut
const lieuxOuverts = new Set();


window.addEventListener('message', async function(event) {
    

    const iframeData = event.data;
    try {
        if (!iframeData || !iframeData.type) {
            console.warn("Message reçu sans type valide :", iframeData);
            return;
        }
        
        switch (iframeData.type) {
            case 'enregistrement': {
                try {
                    // Récupérer les enregistrements depuis le localStorage
                    let enregistrementsData = await getPrefixedItem('enregistrements');
                    let enregistrements = [];
                    try {
                        enregistrements = JSON.parse(enregistrementsData || '[]');
                    } catch (parseErr) {
                        console.error("Erreur de parsing pour enregistrements :", parseErr);
                    }
                    
                    // Ajouter le nouvel enregistrement
                    enregistrements.push(ajouterInformationsSupplementaires(iframeData.data));
                    await setPrefixedItem('enregistrements', JSON.stringify(enregistrements));
                    
                    // Vérifier la préférence TABUL
                    const tabulValue = await getPrefixedItem('TABUL');
                    if (tabulValue === "true") {
                            setTimeout(afficherEnregistrements, 100);
                    } else {
                        setTimeout(async () => {
                            try {
                                const listeEnregistreeData = await getPrefixedItem('maListe');
                                let listeEnregistree = [];
                                try {
                                    listeEnregistree = JSON.parse(listeEnregistreeData || '[]');
                                } catch (err) {
                                    console.error("Erreur de parsing pour maListe :", err);
                                }
                                if (listeEnregistree.length === 0) {
                                    openTab('interventions');
                                }
                            } catch (error) {
                                console.error("Erreur lors de la récupération de maListe :", error);
                            }
                        }, 300);
                    }
                } catch (error) {
                    console.error("Erreur lors du traitement de 'enregistrement' :", error);
                }
                break;
            }
            case 'fermer': {
                try {
                    const iframeId = `lieu-${iframeData.data.replace(/\s+/g, '_')}`;
                    const iframeASupprimer = document.getElementById(iframeId);
                    if (iframeASupprimer) {
                        await gererFermetureIframe(iframeData.data);
                        await removePrefixedItem(iframeData.data);

                    }
                } catch (error) {
                    console.error("Erreur lors du traitement de 'fermer' :", error);
                }
                break;
            }
            case 'scannedText': {
                try {
                    gestdata(iframeData.content);
                } catch (error) {
                    console.error("Erreur lors du traitement de 'scannedText' :", error);
                }
                break;
            }
            case 'rename2': {
                try {
                    const parts = iframeData.data.split(' _ ');
                    if (parts.length < 8) {
                        console.error("Données rename2 invalides :", iframeData.data);
                    } else {
                        const [nouveauLieu, tempsAffiche, lieu, zoneTexteValue, zonePiecesValue, typeValue, causeValue, tempsArretValue] = parts;
                        await gererFermetureIframe(lieu);
                        setTimeout(async () => {
                            ouvrirIframe(nouveauLieu, tempsAffiche, zoneTexteValue, zonePiecesValue, typeValue, causeValue, tempsArretValue);
                        }, 100);
                    }
                } catch (error) {
                    console.error("Erreur lors du traitement de 'rename2' :", error);
                }
                break;
            }
            case 'rename4': {
                try {
                    const parts = iframeData.data.split(' _ ');
                    if (parts.length < 4) {
                        console.error("Données rename4 invalides :", iframeData.data);
                    } else {
                        const [lieu, tempsAffiche, index, pieces] = parts;
                        await gererFermetureIframe(lieu);
                        setTimeout(async () => {
                            UsePreconfig(lieu, tempsAffiche, index, pieces);
                        }, 200);
                    }
                } catch (error) {
                    console.error("Erreur lors du traitement de 'rename4' :", error);
                }
                break;
            }
            case 'pieces': {
                try {
                    const parts = iframeData.data.split(' _ ');
                    if (parts.length < 2) {
                        console.error("Données pieces invalides :", iframeData.data);
                    } else {
                        const [lieu, ZoneTexte3] = parts;
                        ouvrirModalModifierPiece(lieu, ZoneTexte3);
                    }
                } catch (error) {
                    console.error("Erreur lors du traitement de 'pieces' :", error);
                }
                break;
            }
            case 'Desconec': {
                try {
                    localStorage.removeItem('AUTOUSER');
                    window.location.href = '../Log.html';
                } catch (error) {
                    console.error("Erreur lors du traitement de 'Desconec' :", error);
                }
                break;
            }
            case 'suppcook': {
                try {
                    const iframeId = `iframe-${iframeData.data.replace(/\s+/g, '_')}`;
                    const iframeASupprimer = document.getElementById(iframeId);
                    if (iframeASupprimer) {
                        iframeASupprimer.remove();
                    }
                } catch (error) {
                    console.error("Erreur lors du traitement de 'suppcook' :", error);
                }
                break;
            }
            default:
                //console.warn("Type de message inconnu :", iframeData.type);
        }
    } catch (error) {
        console.error("Erreur globale dans le traitement du message :", error);
    }
});







// Fonction pour supprimer un lieu du localStorage
async function supprimerRestolieu(lieuASupprimer) {
    const listeEnregistreeData = await getPrefixedItem('maListe');
    let listeEnregistree = JSON.parse(listeEnregistreeData || '[]');

    const index = listeEnregistree.indexOf(lieuASupprimer);
    if (index !== -1) {
        listeEnregistree.splice(index, 1);
        setPrefixedItem('maListe', JSON.stringify(listeEnregistree));
    }
}
async function gererFermetureIframe(lieu) {
    const iframe = lieu;
    const iframeASupprimer = document.getElementById(iframe);
    const boutonLancerChrono = document.getElementById(`lancer-chrono-btn-${lieu}`);
    await supprimerRestolieu(lieu);

    // On remet le bouton en état si il existe
    if (boutonLancerChrono) {
        boutonLancerChrono.classList.remove('non-cliquable');



        // Modifier le contenu de l'attribut "onclick" pour revenir à la fonction d'origine
        boutonLancerChrono.setAttribute('onclick', `ouvrirIframe('${lieu.replace(/_/g, ' ')}')`);

        // Réactiver les boutons de préconfiguration associés
        const preconfButtons = document.querySelectorAll(`[id^="relancer-preconf-btn-${lieu}"]`);
        preconfButtons.forEach(button => {
            button.classList.remove('button-grise'); // Retire la classe qui grise les boutons
            button.disabled = false; // Réactive les boutons
        });
    }

    // Supprimer l'iframe si elle existe
    if (iframeASupprimer) {
        await supprimerBlocComplet(iframe, lieu); // Attendre que l'iframe soit supprimée
    }
}



function ouvrirBranchesPourLieu(lieu) {
    const lieuxList = document.getElementById('lieux-list');
    const lieuxItems = lieuxList.querySelectorAll('.place-card');

    // Parcourir la liste des lieux pour trouver celui correspondant à l'iframe
    for (const lieuItem of lieuxItems) {
        const lieuName = lieuItem.querySelector('.pastille').getAttribute('data-texte');

        if (lieu === lieuName) {
            // Ouvrir les branches jusqu'à cet élément
            let parent = lieuItem.parentElement;
            while (parent && parent !== lieuxList) {
                if (parent.tagName === 'UL') {
                    parent.style.display = 'block';
                }
                parent = parent.parentElement;
            }
            break; // Sortir de la boucle dès qu'on trouve le lieu correspondant
        }
    }
}




async function chargerIframesDepuisLocalStorage() {





        setTimeout(() => {
            const chronoButton = document.getElementById('ChronoButton');
            chronoButton.setAttribute('annim', 'true');
            openTab('creer')
        }, 500);
    

}



function mettreAJourBoutonChrono(nombreChronosActifs) {
    const chronoButton = document.getElementById('ChronoButton');
    if (chronoButton) {
        chronoButton.textContent = `${nombreChronosActifs} Chrono${nombreChronosActifs !== 1 ? 's' : ''}`;
    }
}



async function dejaCree(nomLieu) {

    const tabulValue = await getPrefixedItem('TABUL');
        openTab('Chrono');
    

    const chronoContainer = document.getElementById(`lieu-${nomLieu.replace(/\s+/g, '_')}`);

    if (!chronoContainer) {
        return;
    }

    // Ajouter une animation de surbrillance
    chronoContainer.style.transition = 'background-color 0.5s ease';
    chronoContainer.style.backgroundColor = 'yellow';

    // Réinitialiser après l'animation
    setTimeout(() => {
        chronoContainer.style.backgroundColor = '';
    }, 1500);

}

// Fonction de normalisation robuste
function normaliserNomLieu(nom) {
  return nom
    .normalize("NFD")                  // décompose accents
    .replace(/[\u0300-\u036f]/g, '')  // supprime accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');            // remplace espaces par "_"
}


async function afficherLieuDansIframe(nomLieu) {
    supprimerTableauInterventions();
    if (!interventionsData || interventionsData.length === 0) {
        alert("Données d'interventions non chargées.");
        console.warn("⚠️ interventionsData est vide ou non initialisé.");
        return;
    }

    // Vérifie si déjà affiché (évite doublon)
    const existing = document.getElementById(`lieu-${nomLieu.replace(/\s+/g, '_')}`);
    if (existing) {
        alert("Ce lieu est déjà affiché.");
        return;
    }

    const interventionsPourLieu = interventionsData.filter(entry => {
        const machine = (entry['Désignation machine'] || '').trim().toLowerCase();
        return machine === nomLieu.trim().toLowerCase();
    });




    nombreChronosActifs++;
    Restolieu(nomLieu);

    const chronosContainer = document.getElementById('chronosContainer');
    const container = document.createElement('div');
    container.className = 'groupe-container';
    container.id = `lieu-${nomLieu.replace(/\s+/g, '_')}`;

    // Titre + bouton fermeture
    const titre = document.createElement('div');
    titre.className = 'titre-lieu';
    titre.innerHTML = `
        ${nomLieu} (${interventionsPourLieu.length})
        <button onclick="fermerChronoLieu('${container.id}')" style="margin-left: 10px; background: #c0392b; color: white; border: none; border-radius: 5px; padding: 2px 8px; cursor: pointer;">
            ✖ Fermer
        </button>
    `;
    container.appendChild(titre);


    const tableau = document.createElement('table');
    tableau.className = 'intervention-table';

    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Date</th>
            <th>Résumé</th>
            <th>Durée (h)</th>
            <th>Heures</th>
            <th>Personnel</th>
        </tr>`;
    tableau.appendChild(thead);

    const tbody = document.createElement('tbody');
    interventionsPourLieu.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry['Date intervention'] || ''}</td>
            <td>${entry['Résumé intervention'] || ''}</td>
            <td>${parseFloat(entry['Durée arrêt (h)'] || 0).toFixed(2)}</td>
            <td>${parseFloat(entry["Nombre d'heures"] || 0).toFixed(2)}</td>
            <td>${entry['Personnel'] || ''}</td>
        `;
        tbody.appendChild(row);
    });

    tableau.appendChild(tbody);
    tableauContainer.appendChild(tableau);

    container.appendChild(tableau);
    chronosContainer.appendChild(container);


}

function collecterInterventionsRecursivement(nomLieu, hierarchyNode, interventionsData, résultat = []) {
    const nomNormalisé = normaliserNomLieu(nomLieu).toLowerCase();

    const locales = interventionsData.filter(entry =>
        normaliserNomLieu(entry['Désignation machine'] || '').toLowerCase() === nomNormalisé
    );

    résultat.push(...locales);

    if (!hierarchyNode || typeof hierarchyNode !== 'object') return résultat;

    for (const sousLieu in hierarchyNode) {
        if (hierarchyNode.hasOwnProperty(sousLieu)) {
            collecterInterventionsRecursivement(sousLieu, hierarchyNode[sousLieu], interventionsData, résultat);
        }
    }

    return résultat;
}

function trouverNoeudDansArborescence(nomLieu, arbre) {
    for (const clé in arbre) {
        if (!arbre.hasOwnProperty(clé)) continue;

        if (normaliserNomLieu(clé).toLowerCase() === normaliserNomLieu(nomLieu).toLowerCase()) {
            return arbre[clé];
        }

        const sousNoeud = arbre[clé];
        if (typeof sousNoeud === 'object') {
            const trouvé = trouverNoeudDansArborescence(nomLieu, sousNoeud);
            if (trouvé) return trouvé;
        }
    }
    return null;
}



function getInterventionsPourLieu(nomLieu, recursive = true) {
  const hierarchyNode = trouverNoeudDansArborescence(nomLieu, arborescence);

  if (recursive) {
    return collecterInterventionsRecursivement(nomLieu, hierarchyNode, interventionsData);
  } else {
    return interventionsData.filter(entry => {
      const designation = entry['Désignation machine'] || '';
      // Match exact sans normalisation ambiguë
      return designation.trim() === nomLieu.trim();
    });
  }
}




function collecterTousLesLieux(nomLieu, hierarchyNode, résultat = []) {
    const nomNormalisé = normaliserNomLieu(nomLieu);
    résultat.push(nomNormalisé);

    if (!hierarchyNode || typeof hierarchyNode !== 'object') return résultat;

    for (const sousNom in hierarchyNode) {
        if (hierarchyNode.hasOwnProperty(sousNom)) {
            collecterTousLesLieux(sousNom, hierarchyNode[sousNom], résultat);
        }
    }

    return résultat;
}

async function fermerChronoLieu(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const nomLieu = containerId.replace(/^lieu-/, '').replace(/_/g, ' ');

    // Trouver tous les lieux associés à ce noeud dans l’arborescence
    const hierarchyNode = trouverNoeudDansArborescence(nomLieu, arborescence);
    const lieuxÀSupprimer = collecterTousLesLieux(nomLieu, hierarchyNode);

    // Supprimer chaque lieu du Set
    lieuxÀSupprimer.forEach(nom => {
        lieuxOuverts.delete(normaliserNomLieu(nom));
    });

    // Fermeture logique spécifique
    await gererFermetureIframe(nomLieu);
    await removePrefixedItem(nomLieu);

    container.remove();
}



function handleUserChoice(action, remember, nomLieu, maxCompteur, onCreer) {
    if (remember) {
        setPrefixedItem('userChoice', action);
    }
    switch (action) {
        case 'reprendre':
            dejaCree(nomLieu);
            break;
        case 'pause':
            mettreEnPauseSpecifiques();
            break;
        case 'creer':
            onCreer(`${nomLieu} [${maxCompteur + 1}]`);
            break;
        case 'Annul':

            break;
    }
    const modal = document.getElementById('modalChrono');
    modal.style.display = 'none';
}

async function verifierEtAgirSelonChoixPrecedent(nomLieu, maxCompteur, onCreer) {
    let savedChoiceRaw = await getPrefixedItem('userChoice');
    let savedChoice;

    try {
        savedChoice = JSON.parse(savedChoiceRaw);
    } catch (e) {
        savedChoice = savedChoiceRaw;
    }

    if (savedChoice === 'aucun') {
        afficherDialogue(nomLieu, maxCompteur, onCreer);
        return;
    }

    if (savedChoice === null || savedChoice === '') {
        savedChoice = 'pause';
    }

    handleUserChoice(savedChoice, false, nomLieu, maxCompteur, onCreer);
}


function afficherDialogue(nomLieu, maxCompteur, onCreer) {
    const modal = document.getElementById('modalChrono');
    modal.querySelector('.modal-content p').textContent = `${nomLieu} existe déjà ${maxCompteur + 1} fois. Choisissez une action:`;
    modal.style.display = 'block'; // Afficher la modal

    const rememberCheckbox = document.getElementById('rememberChoiceCheckbox');

    document.getElementById('reprendreChronoBtn').onclick = function() {
        handleUserChoice('reprendre', rememberCheckbox.checked, nomLieu, maxCompteur, onCreer);
    };
    document.getElementById('pauseChronoBtn').onclick = function() {
        handleUserChoice('pause', rememberCheckbox.checked, nomLieu, maxCompteur, onCreer);
    };
    document.getElementById('creerNouveauChronoBtn').onclick = function() {
        handleUserChoice('creer', rememberCheckbox.checked, nomLieu, maxCompteur, onCreer);
    };
        document.getElementById('annulerNouveauChronoBtn').onclick = function() {
                    handleUserChoice('Annul', rememberCheckbox.checked, nomLieu, maxCompteur, onCreer);
    };
}


function mettreEnPauseSpecifiques() {
    const allIframes = document.querySelectorAll('iframe');
    allIframes.forEach(iframe => {
        if (iframe.id.includes("Controle")) {
            envoyerPauseIframe(iframe.id);
        }
    });
    openTab('Chrono');
}


function envoyerPauseIframe(idIframe) {
    const iframe = document.getElementById(idIframe);
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'Pause' }, '*');
    } else {
    }
}






function ouvrirModalPreconf(nomLieuAffiche) {
    const LieuOK = nomLieuAffiche.replace(/\[\d+\]$/, '').trim();
    const preconf = preConfigurations[LieuOK];

    if (preconf) {
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = ''; // Videz le contenu de modalBody
        const textBody = document.getElementById('modalTitle');
        textBody.innerHTML = nomLieuAffiche; // Videz le contenu de modalBody

        preconf.forEach((config, index) => {
            const button = document.createElement('button');
            button.textContent = config.titre;
            button.style.marginBottom = '10px'; // Espacement entre les boutons

            button.addEventListener('click', () => {
                const iframeId = nomLieuAffiche;
                fermerModalModifierLieu();
                const iframe = document.getElementById(iframeId);

                if (!iframe) {
                    console.error("Iframe introuvable avec l'ID:", iframeId);
                } else {
                    // Envoyer le message à l'iframe si elle est accessible
                    iframe.contentWindow.postMessage({
                        type: 'Rename3',
                        lieu: nomLieuAffiche,
                        index: index
                    }, '*');
                }

                // Fermer la modal après le clic
                document.getElementById('modalPreconf').style.display = 'none';
            });

            modalBody.appendChild(button);
        });

        // Ouvrir la modal
        document.getElementById('modalPreconf').style.display = 'block';
    }
}

async function ajouterTitreEtIframe(nomLieuAffiche, temps, Text1, Text2, liste1, liste2, arret) {

  // Récupération du conteneur principal et du nom d'utilisateur dans l'URL
  const chronosContainer = document.getElementById('chronosContainer');
  const username = new URLSearchParams(window.location.search).get('user');
const themeValue = await getPrefixedItem('themeGlassEnabled');

  // Désactivation du bouton de lancement si présent
  const btnLancer = document.getElementById(`lancer-chrono-btn-${nomLieuAffiche}`);
  if (btnLancer) {
    btnLancer.classList.add('non-cliquable');
  }

  // Construction de l'URL pour l'iframe
  const baseUrl = "HTML/chrono.html";
  const params = {
    lieu: nomLieuAffiche,
    theme: themeValue,
    user: username,
    temps,
    liste1,
    liste2,
    Text1,
    Text2,
    arret
  };
  const queryString = Object.entries(params)
    .filter(([, valeur]) => valeur)
    .map(([cle, valeur]) => `${cle}=${encodeURIComponent(valeur)}`)
    .join("&");
  const url = `${baseUrl}?${queryString}`;

  // Création du conteneur du groupe et du titre
  const containerGroupe = document.createElement('div');
  containerGroupe.id = `lieu-${nomLieuAffiche.replace(/\s+/g, '_')}`;
  containerGroupe.className = 'groupe-container';

  const divTitre = document.createElement('div');
  divTitre.className = 'titre-lieu';
  divTitre.textContent = nomLieuAffiche;

  // Bouton de pré-configuration (si applicable)
  const lieuSansIndex = nomLieuAffiche.replace(/\[\d+\]$/, '').trim();
  if (preConfigurations && preConfigurations[lieuSansIndex]) {
    const btnPreconf = document.createElement('button-pre');
    btnPreconf.textContent = "📜";
    btnPreconf.style.backgroundColor = "green";
    btnPreconf.addEventListener('click', () => ouvrirModalPreconf(nomLieuAffiche));
    divTitre.appendChild(btnPreconf);
  }

  // Bouton de modification du lieu
  const btnModifier = document.createElement('button');
  btnModifier.textContent = "✏️";
  btnModifier.addEventListener('click', () => ouvrirModalModifierLieu(nomLieuAffiche));
  divTitre.appendChild(btnModifier);

  // Création de l'iframe
  const iframe = document.createElement('iframe');
  iframe.id = nomLieuAffiche;

  // Chargement du contenu de l'iframe depuis IndexedDB avec injection du <base>
  try {
    console.warn("Création iframe pour : " + nomLieuAffiche + " || Avec les élements || Temps : " + temps +" || Type : "+ Text1+" || Cause : "+  Text2+" || Pièces : "+  liste1+" || Résumer : "+  liste2+" || TPS Arret : "+  arret);
    const contenuChrono = await getFileFromDB('HTML/chrono.html');
    if (contenuChrono) {
      setTimeout(() => {
        const docIframe = iframe.contentDocument || iframe.contentWindow.document;
        if (docIframe) {
          docIframe.open();
          // Injection de la balise <base> pour la résolution des ressources relatives
          docIframe.write(`<base href="${url}">` + contenuChrono);
       
          docIframe.close();
        } else {
          console.error("❌ Impossible d'accéder au document de l'iframe.");
        }
      }, 50);
    } else {
      console.error("❌ Le fichier chrono.html est introuvable dans IndexedDB.");
    }
  } catch (erreur) {
    console.error("❌ Erreur lors du chargement de l'iframe :", erreur);
  }

  // Assemblage final des éléments dans le DOM
  containerGroupe.appendChild(divTitre);
  containerGroupe.appendChild(iframe);
  chronosContainer.appendChild(containerGroupe);



  afficherPopupAideCustom(
   ".groupe-container",
      `Il et de nouveau possible d'utiliser le '+' dans le résumer d'intervention`,
      'pop_plus_inter',
      3
    ); 
}





async function Restolieu(nomLieu) {
    // Attendre que `getPrefixedItem` retourne la valeur
    const listeEnregistreeData = await getPrefixedItem('maListe');
    let listeEnregistree = JSON.parse(listeEnregistreeData || '[]'); // Si `null`, remplace par un tableau vide

    // Ajouter le nouveau nom d'iframe seulement s'il n'existe pas déjà
    if (!listeEnregistree.includes(nomLieu)) {
        listeEnregistree.push(nomLieu);
        //setPrefixedItem('maListe', JSON.stringify(listeEnregistree));
    }
}


function filtrerChronos() {
  const globalContainer = document.getElementById('chronosContainerGlob');

  // Si le conteneur global est visible (non vide), on l’actualise
  if (globalContainer && globalContainer.children.length > 0) {
    afficherToutesLesInterventions(); 
  }

  // Toujours filtrer les groupes individuels
  appliquerFiltrageAuxGroupes();
}


function appliquerFiltrageAuxGroupes() {
  const searchTerm = document.getElementById("searchResume").value.toLowerCase();
  const startDateStr = document.getElementById("startDate").value;
  const endDateStr = document.getElementById("endDate").value;
  const selectedPersonnel = document.getElementById("personnelFilter").value.trim();

  const parseInputDate = str => str ? new Date(str) : null;
  const parseDate = str => {
    if (!str || str.length !== 8) return null;
    const y = str.slice(0, 4), m = str.slice(4, 6), d = str.slice(6, 8);
    return new Date(`${y}-${m}-${d}`);
  };

  const startDate = parseInputDate(startDateStr);
  const endDate = parseInputDate(endDateStr);

  const tables = document.querySelectorAll('.intervention-table');

  tables.forEach(table => {
    const fullData = JSON.parse(table.dataset.source || '[]');

    const filteredData = fullData.filter(entry => {
      const resume = (entry['Résumé intervention'] || '').toLowerCase();
      const dateStr = entry['Date intervention'] || '';
      const date = parseDate(dateStr);

      // 🧠 Nettoyage + extraction propre du personnel
      const personnelField = entry['Personnel'];
      const personnelList = Array.isArray(personnelField)
        ? personnelField.map(p => p.trim())
        : (typeof personnelField === 'string' && personnelField.trim() !== '')
          ? [personnelField.trim()]
          : [];

      const matchTexte = !searchTerm || resume.includes(searchTerm);
      const matchDate = (!startDate || (date && date >= startDate)) &&
                        (!endDate || (date && date <= endDate));

      const matchPersonnel =
        selectedPersonnel === "" || // "-- Tous --" → ne filtre rien
        (selectedPersonnel === "__VIDE__" && personnelList.length === 0) ||
        personnelList.includes(selectedPersonnel);

      return matchTexte && matchDate && matchPersonnel;
    });

    // Mise à jour de la table
    table._data = filteredData;
const container = table.closest('.groupe-container');
if (container) {
  const titre = container.querySelector('.titre-lieu');
  if (titre) {
    // Remplace seulement le compteur entre parenthèses
    titre.innerHTML = titre.innerHTML.replace(/\(\d+\)/, `(${filteredData.length})`);
  }
}


    if (typeof table._renderVisibleRows === 'function') {
      table._renderVisibleRows(); // ⏩ force l'affichage
    }
  });
}




function supprimerTableauInterventions() {
  const container = document.getElementById('chronosContainerGlob');
  if (!container) {
    console.warn("⚠️ chronosContainerGlob introuvable.");
    return;
  }
  container.innerHTML = '';
  container.style.display = 'none';
}


function remplirFiltrePersonnelDepuisGlobalUserData() {
remplirFiltrePersonnelDepuisInterventions();

}


function showLoadingModal() {
  const modal = document.getElementById("modalLoading");
  modal?.classList.remove("modal-hidden");
  modal?.classList.add("modal-visible");
}

function hideLoadingModal() {
  const modal = document.getElementById("modalLoading");
  modal?.classList.remove("modal-visible");
  modal?.classList.add("modal-hidden");
}


function setupVirtualTable(interventions, tbody, containerHeight = 400) {
  const table = tbody.closest('table');
  const thead = table.querySelector('thead');
  if (!table || !thead || !table.parentNode) return;

  const container = document.createElement('div');
  container.className = 'virtual-scroll-container';
  container.style.height = containerHeight + 'px';
  container.style.overflowY = 'auto';
  container.style.position = 'relative';

  const fakeTable = document.createElement('table');
  fakeTable.className = table.className;
  fakeTable.appendChild(thead);
  table.parentNode.insertBefore(fakeTable, table);
  table.innerHTML = '';
  table.appendChild(tbody);
  fakeTable.parentNode.insertBefore(container, fakeTable.nextSibling);

  tbody.classList.add('virtual-scroll-tbody');
  container.appendChild(table);

  const spacer = document.createElement('div');
  spacer.style.position = 'relative';
  container.appendChild(spacer);

  const inner = document.createElement('div');
  inner.style.position = 'absolute';
  inner.style.top = '0';
  inner.style.left = '0';
  inner.style.right = '0';
    inner.id = 'tabl';

  spacer.appendChild(inner);
  inner.appendChild(table);

  const rowHeights = [];
  const cumulativeOffsets = [0];

  const bufferRows = 2;
  const rowEstimate = 60;
poolSize = Math.ceil(400 / rowEstimate) + 20
  if (poolSize % 2 !== 0) poolSize++;

  const pool = [];
  for (let i = 0; i < poolSize; i++) {
    const row = document.createElement('tr');
    for (let j = 0; j < 6; j++) {
      row.appendChild(document.createElement('td'));
    }
    tbody.appendChild(row);
    pool.push(row);
  }

  function getCellValue(entry, colIndex) {
    switch (colIndex) {
      case 0: return entry['Désignation machine'] || '';
      case 1: return entry['Date intervention'] || '';
      case 2: return entry['Résumé intervention'] || '';
      case 3: return parseFloat(entry['Durée arrêt (h)'] || 0).toFixed(2);
      case 4: return parseFloat(entry["Nombre d'heures"] || 0).toFixed(2);
      case 5: return entry['Personnel'] || '';
      default: return '';
    }
  }

  function ensureHeightsUpTo(index) {
    for (let i = rowHeights.length; i <= index && i < table._data.length; i++) {
const tempRow = document.createElement('tr');
for (let j = 0; j < 6; j++) {
  const td = document.createElement('td');
  td.textContent = getCellValue(table._data[i], j);
  tempRow.appendChild(td);
}

      tbody.appendChild(tempRow);
let h = tempRow.offsetHeight;
if (!h || table._data[i]._ghost) {
  h = 35; // Hauteur fixe si ligne vide ou fantôme
}
      tbody.removeChild(tempRow);
      rowHeights[i] = h;
      cumulativeOffsets[i + 1] = (cumulativeOffsets[i] || 0) + h;
    }
    spacer.style.height = (cumulativeOffsets[table._data.length] || 0) + 'px';
  }

  function binarySearchOffset(scrollTop) {
    let low = 0, high = cumulativeOffsets.length - 1;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (cumulativeOffsets[mid] <= scrollTop) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return Math.max(0, low - 1);
  }

function renderVisibleRows() {
  const scrollTop = container.scrollTop;
  let start = binarySearchOffset(scrollTop);
  if (start % 2 !== 0) start--;

  ensureHeightsUpTo(start + poolSize);

  const offsetY = cumulativeOffsets[start] || 0;
  inner.style.transform = `translateY(${offsetY}px)`;

  for (let i = 0; i < poolSize; i++) {
    const dataIndex = start + i;
    const row = pool[i];

    if (dataIndex >= table._data.length) {
      // Seulement masquer/vider si hors de la zone d'affichage
      row.style.display = 'none';
      for (let j = 0; j < 6; j++) {
        row.children[j].textContent = '';
      }
      row.classList.remove('ghost-row');
      continue;
    }

    const entry = table._data[dataIndex];
    row.style.display = '';

    for (let j = 0; j < 6; j++) {
      row.children[j].textContent = getCellValue(entry, j);
    }

    if (entry._ghost) {
      row.classList.add('ghost-row');
    } else {
      row.classList.remove('ghost-row');
    }
  }
}


  


// Ajout de lignes fantômes si peu d'interventions
// ✅ Ajoute des entrées fantômes si trop peu d’interventions
const minimumRowsForScroll = 5;
if (table._data?.length < minimumRowsForScroll) {
  const missing = minimumRowsForScroll - table._data.length;
  for (let i = 0; i < missing; i++) {
    interventions.push({
      'Désignation machine': '',
      'Date intervention': '',
      'Résumé intervention': '',
      'Durée arrêt (h)': '',
      "Nombre d'heures": '',
      'Personnel': '',
      _ghost: true // Marque fantôme pour style plus tard
    });
  }
}
// 🟢 Pré-mesure de 100 premières lignes pour un scroll fluide immédiat

// Si le tableau est dans un display:none → décaler ensureHeightsUpTo
if (container.offsetHeight === 0) {
  setTimeout(() => ensureHeightsUpTo(100), 50); // ← important : délai de rendu DOM
} else {
  ensureHeightsUpTo(100);
}



let scrollPending = false;
container.addEventListener('scroll', () => {
  if (!scrollPending) {
    scrollPending = true;
    requestAnimationFrame(() => {
      renderVisibleRows();
      scrollPending = false;
    });
  }
});
  renderVisibleRows();

  // Marquer les données source pour le tri dynamique
  table.dataset.source = JSON.stringify(interventions);
  table._renderVisibleRows?.(); // Forcer mise à jour
  table.dataset.virtual = 'true';

  // ✅ Ajout : stocke le renderer directement sur la table
  table._renderVisibleRows = renderVisibleRows;


}


function getInterventionsFiltrées(data) {
  const searchTerm = document.getElementById("searchResume").value.toLowerCase();
  const startDateStr = document.getElementById("startDate").value;
  const endDateStr = document.getElementById("endDate").value;
  const selectedPersonnel = document.getElementById("personnelFilter")?.value?.trim();

  const parseInputDate = str => str ? new Date(str) : null;
  const parseRowDate = str => {
    if (!str || str.length !== 8) return null;
    const y = str.slice(0, 4), m = str.slice(4, 6), d = str.slice(6, 8);
    return new Date(`${y}-${m}-${d}`);
  };

  const startDate = parseInputDate(startDateStr);
  const endDate = parseInputDate(endDateStr);

  return data.filter(entry => {
    const resume = (entry['Résumé intervention'] || '').toLowerCase();
    const dateStr = entry['Date intervention'] || '';
    const date = parseRowDate(dateStr);

    // ✅ Extraction unique et propre du champ Personnel
    const personnelField = entry['Personnel'];
    const personnelList = Array.isArray(personnelField)
      ? personnelField.map(p => p.trim())
      : (typeof personnelField === 'string' && personnelField.trim() !== '')
        ? [personnelField.trim()]
        : [];

    const matchTexte = !searchTerm || resume.includes(searchTerm);
    const matchDate = (!startDate || (date && date >= startDate)) &&
                      (!endDate || (date && date <= endDate));

    const matchPersonnel =
      selectedPersonnel === "" || // -- Tous --
      (selectedPersonnel === "__VIDE__" && personnelList.length === 0) ||
      personnelList.includes(selectedPersonnel);

    return matchTexte && matchDate && matchPersonnel;
  });
}



document.addEventListener('click', function (e) {
  if (e.target.tagName !== 'TH') return;

  const th = e.target;
  const table = th.closest('table');
  if (!table || !table.classList.contains('intervention-table')) return;

  const index = Array.from(th.parentNode.children).indexOf(th);
  const isDate = th.textContent.includes('Date');
  const isNumber = th.textContent.includes('Durée') || th.textContent.includes('Heures');
  const isText = !isDate && !isNumber;

  const currentOrder = th.dataset.order === 'asc' ? 'asc' : 'desc';
  const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';

  table.querySelectorAll('th').forEach(header => {
    header.textContent = header.textContent.replace(/[▲▼]/g, '').trim();
    header.removeAttribute('data-order');
  });

  th.dataset.order = newOrder;
  const arrow = newOrder === 'asc' ? ' ▲' : ' ▼';
  th.textContent = th.textContent.trim() + arrow;

  triColonneActuelle = th.textContent.replace(/[▲▼]/g, '').trim();
  triOrdreActuel = newOrder;

  const tbody = table.querySelector('tbody');
  if (!tbody) return;

  // Si virtualisé → on trie les données source
  if (table.dataset.virtual === 'true') {
    let data;
    try {
data = table._data;
    } catch (err) {
      console.error("❌ Erreur de parsing des données virtualisées :", err);
      return;
    }

    const parseDate = (str) => {
      if (/^\d{8}$/.test(str)) {
        const y = str.slice(0, 4), m = str.slice(4, 6), d = str.slice(6, 8);
        return new Date(`${y}-${m}-${d}`);
      }
      return new Date(str);
    };

    data.sort((a, b) => {
      const aText = getCellText(a, index);
      const bText = getCellText(b, index);

if (isDate) return newOrder === 'asc'
  ? a._ts - b._ts
  : b._ts - a._ts;
      if (isNumber) return newOrder === 'asc' ? parseFloat(aText) - parseFloat(bText) : parseFloat(bText) - parseFloat(aText);
      return newOrder === 'asc' ? aText.localeCompare(bText) : bText.localeCompare(aText);
    });

if (typeof table._renderVisibleRows === 'function') {
  table._renderVisibleRows(); // 🔁 Force la mise à jour des lignes visibles
}


    table.dataset.source = JSON.stringify(data);
if (typeof table._renderVisibleRows === 'function') {
  table._renderVisibleRows(); // ✅ Force le rendu des lignes après tri
}


    return;
  }

  // Sinon, tri DOM classique
  const rows = Array.from(tbody.querySelectorAll('tr'));
  rows.sort((a, b) => {
    const aText = a.children[index]?.textContent.trim() || '';
    const bText = b.children[index]?.textContent.trim() || '';

    if (isDate) {
      const dateA = parseDate(aText);
      const dateB = parseDate(bText);
      return newOrder === 'asc' ? dateA - dateB : dateB - dateA;
    }

    if (isNumber) {
      const numA = parseFloat(aText.replace(',', '.')) || 0;
      const numB = parseFloat(bText.replace(',', '.')) || 0;
      return newOrder === 'asc' ? numA - numB : numB - numA;
    }

    return newOrder === 'asc' ? aText.localeCompare(bText) : bText.localeCompare(aText);
  });

  rows.forEach(row => tbody.appendChild(row));
});

function getCellText(entry, colIndex) {
  switch (colIndex) {
    case 0: return entry['Désignation machine'] || '';
    case 1: return entry['Date intervention'] || '';
    case 2: return entry['Résumé intervention'] || '';
    case 3: return parseFloat(entry['Durée arrêt (h)'] || 0).toFixed(2);
    case 4: return parseFloat(entry["Nombre d'heures"] || 0).toFixed(2);
    case 5: return entry['Personnel'] || '';
    default: return '';
  }
}

function parseDate(str) {
  if (/^\d{8}$/.test(str)) {
    const y = str.slice(0, 4);
    const m = str.slice(4, 6);
    const d = str.slice(6, 8);
    return new Date(`${y}-${m}-${d}`);
  }
  return new Date(str); // fallback générique
}

function appliquerTriInitialSur(tableId, colonneTexte = 'Date', ordre = 'desc') {
  const table = document.getElementById(tableId);
  if (!table) return;

  const ths = table.querySelectorAll('thead th');
  for (const th of ths) {
    if (th.textContent.includes(colonneTexte)) {
      th.dataset.order = ordre === 'asc' ? 'desc' : 'asc'; // inverse pour forcer le clic
      th.click(); // déclenche le tri
      break;
    }
  }
}

function refreshVirtualTable(table) {
  const container = table.closest('.virtual-scroll-container');
  if (!container) return;

  const tbody = table.querySelector('tbody');
  const data = JSON.parse(table.dataset.source || '[]');

  const getCellValue = (entry, colIndex) => {
    switch (colIndex) {
      case 0: return entry['Désignation machine'] || '';
      case 1: return entry['Date intervention'] || '';
      case 2: return entry['Résumé intervention'] || '';
      case 3: return parseFloat(entry['Durée arrêt (h)'] || 0).toFixed(2);
      case 4: return parseFloat(entry["Nombre d'heures"] || 0).toFixed(2);
      case 5: return entry['Personnel'] || '';
      default: return '';
    }
  };

  const pool = tbody.querySelectorAll('tr');
  const poolSize = pool.length;

  const rowHeights = new Array(data.length).fill(13); // estimation

  const cumulativeOffsets = [0];
  for (let i = 0; i < data.length; i++) {
    cumulativeOffsets[i + 1] = cumulativeOffsets[i] + rowHeights[i];
  }

  container.querySelector('div').style.height = cumulativeOffsets[data.length] + 'px';

  const scrollTop = container.scrollTop;
  let start = 0;
  while (start < cumulativeOffsets.length && cumulativeOffsets[start] < scrollTop) {
    start++;
  }
  start = Math.max(0, start - 1);
  if (start % 2 !== 0) start--;

  const offsetY = cumulativeOffsets[start] || 0;
  container.querySelector('.virtual-scroll-tbody').parentElement.style.transform = `translateY(${offsetY}px)`;

const bufferEnd = start + poolSize;

for (let i = 0; i < poolSize; i++) {
  const dataIndex = start + i;
  const row = pool[i];

  // ⚠️ Ne supprime pas trop tôt
  if (dataIndex >= table._data.length) {
    if (dataIndex > bufferEnd + 2) { // ← tolérance
      row.style.display = 'none';
      for (let j = 0; j < 6; j++) {
        row.children[j].textContent = '';
      }
      row.classList.remove('ghost-row');
    }
    continue;
  }

  row.style.display = '';
const entry = table._data?.[dataIndex];
  for (let j = 0; j < 6; j++) {
    row.children[j].textContent = getCellValue(entry, j);
  }
  if (entry._ghost) {
    row.classList.add('ghost-row');
  } else {
    row.classList.remove('ghost-row');
  }
}}

function remplirFiltrePersonnelDepuisInterventions() {
  const select = document.getElementById("personnelFilter");
  if (!select) return;

  const currentValue = select.value; // 🔁 sauvegarder la sélection actuelle

  const tables = document.querySelectorAll('.intervention-table');
  const personnelsSet = new Set();

  tables.forEach(table => {
    const fullData = JSON.parse(table.dataset.source || '[]');
    fullData.forEach(entry => {
      const personnel = entry['Personnel'];
      if (typeof personnel === 'string') {
        personnelsSet.add(personnel.trim());
      } else if (Array.isArray(personnel)) {
        personnel.forEach(p => personnelsSet.add(p.trim()));
      }
    });
  });

  // Nettoyer le select
  select.innerHTML = `
    <option value="">-- Tous --</option>
    <option value="__VIDE__">(Sans personnel)</option>
  `;

  Array.from(personnelsSet).sort().forEach(nom => {
    if (nom) {
      const opt = document.createElement("option");
      opt.value = nom;
      opt.textContent = nom;
      select.appendChild(opt);
    }
  });

  // 🔁 Réappliquer la sélection précédente (ex: "")
  select.value = currentValue;

  // ✅ Déclenche le filtre après modification
  appliquerFiltrageAuxGroupes();
}


function afficherTableauInterventions({ nomLieu = "Toutes les interventions", data, containerId, filtrer = false, closable = false }) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const nomNormalisé = nomLieu.replace(/\s+/g, '_');
  const tableauId = filtrer ? `interventions-${nomNormalisé}` : 'intervention-table-global';

  if (!closable) container.innerHTML = ''; // uniquement pour global

  const bloc = document.createElement('div');
  bloc.className = 'groupe-container';
  bloc.id = `lieu-${nomNormalisé}`;

  const titre = document.createElement('div');
  titre.className = 'titre-lieu';
  titre.innerHTML = `${nomLieu} (${data.length})`;

  if (closable) {
    titre.innerHTML += `
      <button onclick="fermerChronoLieu('${bloc.id}')" style="margin-left:10px;background:#c0392b;color:white;border:none;border-radius:5px;padding:2px 8px;cursor:pointer;">
        ✖ Fermer
      </button>`;
  }

  bloc.appendChild(titre);

  const tableau = document.createElement('table');
  tableau.className = 'intervention-table';
  tableau.id = tableauId;
  tableau.innerHTML = `
    <thead>
      <tr>
        <th>Lieu</th>
        <th>Date ▼</th>
        <th>Résumé</th>
        <th>Durée (h)</th>
        <th>Heures</th>
        <th>Personnel</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = tableau.querySelector('tbody');
  tableau._data = data;
  tableau.dataset.source = JSON.stringify(data);

  const wrapper = document.createElement('div');
  wrapper.className = 'tableau-container';
  wrapper.style.margin = '10px 0';
  wrapper.appendChild(tableau);
  bloc.appendChild(wrapper);
  container.appendChild(bloc);

  setupVirtualTable(data, tbody, 400);

  setTimeout(() => {
    if (typeof tableau._renderVisibleRows === 'function') tableau._renderVisibleRows();
  }, 100);

  appliquerTriInitialSur(tableau.id, 'Date', 'desc');
}


function afficherToutesLesInterventions() {
  showLoadingModal();

  if (!interventionsData || interventionsData.length === 0) {
    alert("Aucune donnée d'intervention disponible.");
    return;
  }

  const interventionsFiltrees = getInterventionsFiltrées(interventionsData);

  interventionsFiltrees.forEach(entry => {
    const d = entry['Date intervention'];
    entry._ts = /^\d{8}$/.test(d) ? Date.parse(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`) : 0;
  });

  interventionsFiltrees.sort((a, b) => b._ts - a._ts);

afficherTableauInterventions({
  nomLieu: "Toutes les interventions",
  data: interventionsFiltrees,
  containerId: 'chronosContainerGlob',
  filtrer: false,
  closable: false
});

// Puis tu règles le style ensuite
document.getElementById('chronosContainerGlob').style.display = 'block';


  hideLoadingModal();
  remplirFiltrePersonnelDepuisInterventions();
}

async function ouvrirIframe(nomLieu) {
  showLoadingModal();
            const chronoButton = document.getElementById('ChronoButton');
            chronoButton.setAttribute('annim', 'false');

  const hierarchyNode = trouverNoeudDansArborescence(nomLieu, arborescence);
  if (!hierarchyNode) console.warn("Lieu introuvable dans l’arborescence :", nomLieu);

  const nomNormalisé = normaliserNomLieu(nomLieu);
  if (lieuxOuverts.has(nomNormalisé)) return;
  lieuxOuverts.add(nomNormalisé);

  supprimerTableauInterventions();

  if (!interventionsData || interventionsData.length === 0) {
    alert("Données d'interventions non chargées.");
    return;
  }

const toutesLesInterventionsBrutes = getInterventionsPourLieu(nomLieu, true); // ou false
const toutesLesInterventions = getInterventionsFiltrées(toutesLesInterventionsBrutes);

  toutesLesInterventions.forEach(entry => {
    const d = entry['Date intervention'];
    entry._ts = /^\d{8}$/.test(d) ? Date.parse(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`) : 0;
  });

  toutesLesInterventions.sort((a, b) => b._ts - a._ts);
  nombreChronosActifs++;
  Restolieu(nomLieu);


afficherTableauInterventions({
    nomLieu,
    data: toutesLesInterventions,
    containerId: 'chronosContainer',
    filtrer: true,
    closable: true
});

//document.getElementById('chronosContainer').style.display = 'none';


  openTab('Chrono');
  hideLoadingModal();

  setTimeout(() => {
    const c = document.getElementById(`lieu-${nomLieu.replace(/\s+/g, '_')}`);
    if (c) {
      c.style.backgroundColor = 'yellow';
      setTimeout(() => c.style.backgroundColor = '', 1500);
    }
  }, 100);

  remplirFiltrePersonnelDepuisInterventions();
}

async function ouvrirIframe2(nomLieu) {
  showLoadingModal();
            const chronoButton = document.getElementById('ChronoButton');

            chronoButton.setAttribute('annim', 'true');

  const hierarchyNode = trouverNoeudDansArborescence(nomLieu, arborescence);
  if (!hierarchyNode) console.warn("Lieu introuvable dans l’arborescence :", nomLieu);

  const nomNormalisé = normaliserNomLieu(nomLieu);
  if (lieuxOuverts.has(nomNormalisé)) return;
  lieuxOuverts.add(nomNormalisé);

  supprimerTableauInterventions();

  if (!interventionsData || interventionsData.length === 0) {
    alert("Données d'interventions non chargées.");
    return;
  }

const toutesLesInterventionsBrutes = getInterventionsPourLieu(nomLieu, false); // ou false
const toutesLesInterventions = getInterventionsFiltrées(toutesLesInterventionsBrutes);


  toutesLesInterventions.forEach(entry => {
    const d = entry['Date intervention'];
    entry._ts = /^\d{8}$/.test(d) ? Date.parse(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`) : 0;
  });

  toutesLesInterventions.sort((a, b) => b._ts - a._ts);
  nombreChronosActifs++;
  Restolieu(nomLieu);

  afficherTableauInterventions({
    nomLieu,
    data: toutesLesInterventions,
    containerId: 'chronosContainer',
    filtrer: true,
    closable: true
  });

//document.getElementById('chronosContainer').style.display = 'none';


  openTab('Chrono');
  hideLoadingModal();

  setTimeout(() => {
    const c = document.getElementById(`lieu-${nomLieu.replace(/\s+/g, '_')}`);
    if (c) {
      c.style.backgroundColor = 'yellow';
      setTimeout(() => c.style.backgroundColor = '', 1500);
    }
  }, 100);

  remplirFiltrePersonnelDepuisInterventions();
}
