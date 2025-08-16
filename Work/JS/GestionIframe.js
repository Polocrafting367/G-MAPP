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
                        await removePrefixedItem(iframeData.data + '_CRH');

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

// PARENT
case 'centerIframe': {
  const nomLieu = iframeData.content ?? iframeData.data;
  setTimeout(() => {
    try {
      // On ne veut QUE le déplacement (pas de surbrillance ni de "Reprendre")
      dejaCree(nomLieu, { highlight: false, resume: false });
    } catch (error) {
      console.error("Erreur lors du traitement de 'centerIframe' :", error);
    }
  }, 250);
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


async function supprimerBlocComplet(iframeId, nomLieu) {
    const blocCompletId = `lieu-${nomLieu.replace(/\s+/g, '_')}`;
    const blocComplet = document.getElementById(blocCompletId);

    if (blocComplet) {
        blocComplet.remove();
    }

    nombreChronosActifs--;
    const chronoButton = document.getElementById('ChronoButton');
    chronoButton.textContent = `${nombreChronosActifs} Chrono${nombreChronosActifs !== 1 ? 's' : ''}`;

}

// Fonction pour supprimer un lieu du localStorage
async function supprimerRestolieu(lieuASupprimer) {
    const listeEnregistreeData = await getPrefixedItem('maListe');
    let listeEnregistree = JSON.parse(listeEnregistreeData || '[]');

    const index = listeEnregistree.indexOf(lieuASupprimer);
    if (index !== -1) {
        listeEnregistree.splice(index, 1);
        await setPrefixedItem('maListe', JSON.stringify(listeEnregistree));
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

function mettreAJourBoutonChrono(nombreChronosActifs) {
    const chronoButton = document.getElementById('ChronoButton');
    if (chronoButton) {
        chronoButton.textContent = `${nombreChronosActifs} Chrono${nombreChronosActifs !== 1 ? 's' : ''}`;
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
    // Récupérer les données de la liste
    const listeEnregistreeData = await getPrefixedItem('maListe');
    const listeEnregistree = JSON.parse(listeEnregistreeData || '[]'); // Si `null`, remplace par un tableau vide


    for (const lieu of listeEnregistree) {

        // Ouvrir l'iframe et les branches associées
        ajouterTitreEtIframe(lieu);
        //await ouvrirIframeDepuisEnregistrement(lieu); // Utiliser `await` ici aussi
        //ouvrirBranchesPourLieu(lieu);
                nombreChronosActifs++; // Incrémenter le compteur

        setTimeout(() => {
    mettreAJourBoutonChrono(nombreChronosActifs);
            const chronoButton = document.getElementById('ChronoButton');
            chronoButton.setAttribute('annim', 'false');
            openTab('Chrono')
        }, 500);

    }




    // Si la liste est vide, ouvrir un onglet pour créer des chronos
    if (listeEnregistree.length === 0) {
        setTimeout(() => {
            const chronoButton = document.getElementById('ChronoButton');
            chronoButton.setAttribute('annim', 'true');
            openTab('creer')
        }, 500);
    }

    // Mettre à jour le bouton "Chrono" à la fin
}





// PARENT
async function dejaCree(nomLieu, opts = {}) {
  const { highlight = true, resume = true, scroll = true } = opts;

  const tabulValue = await getPrefixedItem('TABUL');
  if (tabulValue !== "true") {
    openTab('Chrono');
  }

  const chronoContainer = document.getElementById(`lieu-${String(nomLieu || '').replace(/\s+/g, '_')}`);
  if (!chronoContainer) return;

  // 1) Scroll uniquement si demandé
  if (scroll) {
    chronoContainer.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }

  // 2) Surbrillance jaune optionnelle
  if (highlight) {
    chronoContainer.style.transition = 'background-color 0.5s ease';
    chronoContainer.style.backgroundColor = 'yellow';
    setTimeout(() => { chronoContainer.style.backgroundColor = ''; }, 1500);
  }

  // 3) Envoyer "Reprendre" à l'iframe liée optionnellement
  if (resume) {
    const allIframes = document.querySelectorAll('iframe');
    allIframes.forEach(iframe => {
      if (iframe.id.includes(nomLieu)) {
        iframe.contentWindow.postMessage({ type: 'Reprendre' }, '*');
      }
    });
  }
}


// Fonction de normalisation robuste
function normaliserNomLieu(nom) {
    return nom
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Supprimer accents si besoin
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

async function ouvrirIframe(nomLieu, temps, liste1, liste2, Text1, Text2, arret) {
    toggleAnimations();


            const chronoButton = document.getElementById('ChronoButton');
            chronoButton.setAttribute('annim', 'false');

    const listeEnregistreeData = await getPrefixedItem('maListe');
    let listeEnregistree = JSON.parse(listeEnregistreeData || '[]');
    let nomLieuAffiche = nomLieu;
    let maxCompteur = 0;

    const nomLieuNormalise = normaliserNomLieu(nomLieu);

    // Étape 1 — Vérifier si le nom exact existe (après normalisation)
    const nomLieuExiste = listeEnregistree.some(nom => normaliserNomLieu(nom) === nomLieuNormalise);

    // Étape 2 — Chercher les duplications suffixées
    listeEnregistree.forEach(nom => {
        const nomNormaliseSansSuffixe = normaliserNomLieu(nom.replace(/\s\[\d+\]$/, ''));
        if (nomNormaliseSansSuffixe === nomLieuNormalise) {
            const suffixMatch = nom.match(/\[(\d+)\]$/);
            if (suffixMatch) {
                const numero = parseInt(suffixMatch[1], 10);
                if (numero > maxCompteur) {
                    maxCompteur = numero;
                }
            }
        }
    });



    function handleNewChrono(nouveauNomLieu) {
    // Mettre en pause les autres iframes existants
    document.querySelectorAll('iframe').forEach(existingIframe => {
        if (existingIframe.contentWindow) {
            existingIframe.contentWindow.postMessage({ type: 'Pause' }, '*');
        }
    });

        nombreChronosActifs++;
        nomLieuAffiche = nouveauNomLieu;
        mettreAJourBoutonChrono(nombreChronosActifs);
        Restolieu(nomLieuAffiche);
        ajouterTitreEtIframe(nomLieuAffiche, temps, Text1, Text2, liste1, liste2, arret);
        setTimeout(() => {
            dejaCree(nomLieuAffiche);
        }, 100);
    }

    if (nomLieuExiste || maxCompteur > 0) {
        verifierEtAgirSelonChoixPrecedent(nomLieu, maxCompteur, handleNewChrono);
    } else {

            // Mettre en pause les autres iframes existants
    document.querySelectorAll('iframe').forEach(existingIframe => {
        if (existingIframe.contentWindow) {
            existingIframe.contentWindow.postMessage({ type: 'Pause' }, '*');
        }
    });
        nombreChronosActifs++;
await removePrefixedItem(nomLieuAffiche + '_CRH');
        mettreAJourBoutonChrono(nombreChronosActifs);
        Restolieu(nomLieuAffiche);
        ajouterTitreEtIframe(nomLieuAffiche, temps, Text1, Text2, liste1, liste2, arret);
        setTimeout(() => {
            dejaCree(nomLieuAffiche);
        }, 100);
    }
}



async function handleUserChoice(action, remember, nomLieu, maxCompteur, onCreer) {
    if (remember) {
        await setPrefixedItem('userChoice', action);
    }

    switch (action) {
        case 'reprendre':
            dejaCree(nomLieu);
            break;
        case 'pause':
            mettreEnPauseSpecifiques(nomLieu);
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


function mettreEnPauseSpecifiques(nomLieu) {
    const allIframes = document.querySelectorAll('iframe');

    allIframes.forEach(iframe => {
        if (iframe.id.includes(nomLieu)) {
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
const themeValue = savedTheme;
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
    console.warn("Lieu : " + nomLieuAffiche + " ||  Temps : " + temps +" || Type : "+ Text1+" || Cause : "+  Text2+" || Pièces : "+  liste1+" || Résumer : "+  liste2+" || TPS Arret : "+  arret);
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


function toggleAnimations() {
    const chronoButton = document.getElementById('ChronoButton');
    const annimValue = chronoButton.getAttribute('annim');

    if (annimValue === 'true') {
        activateAnimations();
    } else {
        deactivateAnimations();
        chronoButton.setAttribute('annim', 'true');
    }
}

function activateAnimations() {
    const chronoButton = document.getElementById('ChronoButton');
    chronoButton.classList.add('active');
}

function deactivateAnimations() {
    const chronoButton = document.getElementById('ChronoButton');
    chronoButton.classList.remove('active');
}

async function Restolieu(nomLieu) {
    // Attendre que `getPrefixedItem` retourne la valeur
    const listeEnregistreeData = await getPrefixedItem('maListe');
    let listeEnregistree = JSON.parse(listeEnregistreeData || '[]'); // Si `null`, remplace par un tableau vide

    // Ajouter le nouveau nom d'iframe seulement s'il n'existe pas déjà
    if (!listeEnregistree.includes(nomLieu)) {
        listeEnregistree.push(nomLieu);
        await setPrefixedItem('maListe', JSON.stringify(listeEnregistree));
    }
}