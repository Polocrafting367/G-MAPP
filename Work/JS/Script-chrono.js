let lieu = ''; // Variable globale
let temps = ''; // Si vous voulez aussi que temps soit global
let theme = ''; // Nouvelle variable globale pour le thème
function remplacerPlusUnicode(texte) {
    return texte.replace(/\+/g, '＋');  // Remplace U+002B par U+FF0B
}



const typeInput = document.getElementById("typeInput");
const causeInput = document.getElementById("causeInput");
const typeListFix = document.getElementById("typeListFix");
const causeListFix = document.getElementById("causeListFix");


// Utiliser les valeurs de typeInput et causeInput dans le reste du code
document.getElementById('clearTypeBtn').addEventListener('click', () => {
    document.getElementById('typeDropdown').value = '';
    updateLocalStorage();
});

document.getElementById('clearCauseBtn').addEventListener('click', () => {
    document.getElementById('causeDropdown').value = '';
    updateLocalStorage();
});


var isPaused;
var startTime;
var pauseStartTime;
var totalPauseDuration;
var elapsedTime;
var interval; // Déclarer interval au niveau global


const tempsArretsInput = document.getElementById("tempsArretsInput");
function removeAllThemes() {
    ["glassThemeStyle", "retroThemeStyle"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });
}
async function handleThemeButtonClick(theme) {
    await setPrefixedItem("themeGlassEnabled", theme);

    removeAllThemes();

    if (theme === "glass") {
        await loadThemeCSS("glassThemeStyle", "CSS/style_glass.css");
    } else if (theme === "retro") {
        await loadThemeCSS("retroThemeStyle", "CSS/style_retro.css");
    }
}
async function loadThemeCSS(styleId, path) {
  try {
    // Essaie directement depuis IndexedDB
    const css = await getFileFromDB(path);

    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.textContent = css;
    console.log(`✅ CSS chargé depuis IndexedDB : ${path}`);
  } catch (error) {
    console.error(`❌ Impossible de charger CSS depuis IndexedDB (${path}) :`, error);

    // Si la lecture échoue, on ne tente PAS de fallback, on sort
    return;
  }
}


  async function getFileContent(fileName) {
    try {
      return await getFileFromDB(fileName);
    } catch (error) {
      console.warn(`${error}. Tentative via fetch pour ${fileName}...`);
      try {
        const response = await fetch(fileName);
        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}`);
        }
        return await response.text();
      } catch (fetchError) {
        throw new Error(`Impossible de charger ${fileName} via fetch: ${fetchError}`);
      }
    }
  }
  async function getFileFromDB(fileName) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("MyAppDB", 1);
      request.onsuccess = event => {
        const db = event.target.result;
        const transaction = db.transaction("files", "readonly");
        const store = transaction.objectStore("files");
        const getRequest = store.get(fileName);

        getRequest.onsuccess = () => {
          if (getRequest.result) {
            resolve(getRequest.result);
          } else {
            reject(`Fichier non trouvé dans IndexedDB : ${fileName}`);
          }
        };
        getRequest.onerror = () => reject(`Erreur de récupération du fichier : ${fileName}`);
      };
      request.onerror = () => reject("Erreur d'accès à IndexedDB");
    });
  }
// Utiliser la variable "lieu" comme nécessaire dans votre code

async function init(lieux, tempsx) {
    lieu = lieux;
    temps = tempsx;
    const startInitTime = new Date().getTime();
theme = getURLParameter('theme');
console.log('if'+ theme)
if (theme) {
    await handleThemeButtonClick(theme);
}

    // Démarrer la récupération des données sans attendre indéfiniment
    const getDataPromise = getPrefixedItem(lieu);
    // Créer un timeout (ici 100 ms, ajustable selon vos besoins)
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 100));

    // Essayer d'obtenir les données ou attendre 100 ms maximum
    let savedData = await Promise.race([getDataPromise, timeoutPromise]);

    if (savedData) {
        // Les données sont disponibles rapidement, on restaure sans décalage
        await restoreChronoData(0);
    } else {
        // Aucune donnée reçue dans le délai imparti : on initialise le chrono avec les données par défaut ou issues de l'URL
        const tempsParam = getURLParameter('temps');
        const liste1 = getURLParameter('Text1');
        const liste2 = getURLParameter('Text2');
        const Text1 = getURLParameter('liste1');
        const Text2 = getURLParameter('liste2');
        const tempbox = getURLParameter('arret');

        console.log("iframe RestoCréa pour : " + lieux + " || Avec les éléments || Temps : " + tempsParam + " || Pièces : " + liste1 + " || Résumer : " + liste2 + " || Type : " + Text1 + " || Cause : " + Text2 + " || TPS Arret : " + tempbox);

        if (tempsParam !== "") {
            const tempsActuel = new Date().getTime();
            elapsedTime = 0;
            isPaused = false;
            startTime = tempsActuel - convertirTempsEnMillisecondes(tempsParam);
            pauseStartTime = 0;
            totalPauseDuration = 0;
            zoneTexte.value = Text1;
            zonePieces.value = Text2;
            typeDropdown.value = liste1;
            causeDropdown.value = liste2;
            tempsArretsInput.value = tempbox;
            updateCapsules();

            const chronoData = {
                isPaused: isPaused,
                startTime: startTime,
                pauseStartTime: pauseStartTime,
                totalPauseDuration: totalPauseDuration,
                elapsedTime: elapsedTime,
                texteZone: zoneTexte.value,
                piecesSortie: zonePieces.value,
                type: typeDropdown.value,
                cause: causeDropdown.value,
                arret: tempsArretsInput.value
            };
            await setPrefixedItem(lieu, JSON.stringify(chronoData));
        } else {
            const tempsActuel = new Date().getTime();
            elapsedTime = 0;
            isPaused = false;
            startTime = tempsActuel;
            pauseStartTime = 0;
            totalPauseDuration = 0;
            zoneTexte.value = '';
            zonePieces.value = '';

            const chronoData = {
                isPaused: isPaused,
                startTime: startTime,
                pauseStartTime: pauseStartTime,
                totalPauseDuration: totalPauseDuration,
                elapsedTime: elapsedTime,
                texteZone: '',
                piecesSortie: '',
                type: '',
                cause: '',
                arret: ''
            };
            await setPrefixedItem(lieu, JSON.stringify(chronoData));
        }

        // Lorsque la récupération se termine, mettre à jour le chrono en prenant en compte le délai écoulé
        getDataPromise.then(async (data) => {
            if (data) {
                const diffTime = new Date().getTime() - startInitTime;
                await restoreChronoData(diffTime);
            }
        });
    }
}




function convertirTempsEnMillisecondes(temps) {
    const regex = /(\d+)([jhrsm])/g;
    let match;
    let tempsEnMillisecondes = 0;

    while ((match = regex.exec(temps)) !== null) {
        const valeur = parseInt(match[1], 10);
        const unite = match[2];

        switch (unite) {
            case 'j':
                tempsEnMillisecondes += valeur * 24 * 60 * 60 * 1000;
                break;
            case 'h':
                tempsEnMillisecondes += valeur * 60 * 60 * 1000;
                break;
            case 'm':
                tempsEnMillisecondes += valeur * 60 * 1000;
                break;
            case 's':
                tempsEnMillisecondes += valeur * 1000;
                break;
            default:
                // Ignorer les unités inconnues
                break;
        }
    }

    return tempsEnMillisecondes;
}


function getURLParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}



async function restoreChronoData(differenceTemps) {

    // Récupérer les données du localStorage
    const savedData = await getPrefixedItem(lieu); // Attendre la résolution

    // Récupérer les valeurs des paramètres de l'URL
    const tempsURL = getURLParameter('temps');
    const liste1URL = getURLParameter('liste1');
    const liste2URL = getURLParameter('liste2');
    const Text1URL = getURLParameter('Text1');
    const Text2URL = getURLParameter('Text2');
    const arretURL = getURLParameter('arret');

    if (savedData || differenceTemps) {
        // Parser les données JSON
        const chronoData = JSON.parse(savedData || '{}'); // Si `null`, remplace par un objet vide

        if (chronoData) {

            // Restaurer les variables du chrono à partir du localStorage
            isPaused = chronoData.isPaused;
            startTime = chronoData.startTime;
            pauseStartTime = chronoData.pauseStartTime;
            totalPauseDuration = chronoData.totalPauseDuration;
            elapsedTime = chronoData.elapsedTime;

            var zoneTexte = document.getElementById('zone-texte');
            if (chronoData.texteZone) {
                zoneTexte.value = chronoData.texteZone;
            }

            var zonePieces = document.getElementById('zone-pieces');
            if (chronoData.piecesSortie) {
                zonePieces.value = chronoData.piecesSortie;
                updateCapsules(); 
            }

            var typeDropdown = document.getElementById("typeDropdown");
            var causeDropdown = document.getElementById("causeDropdown");
            const tempsArretsInput = document.getElementById("tempsArretsInput");
            if (chronoData.type) {
                typeDropdown.value = chronoData.type;
            }

            if (chronoData.cause) {
                causeDropdown.value = chronoData.cause;
            }

            // Si des valeurs sont présentes dans l'URL, les utiliser pour restaurer les données du chrono
            if (tempsURL !== '') {
                elapsedTime = convertirTempsEnMillisecondes(tempsURL);
                startTime = new Date().getTime() - elapsedTime;
                displayTime(elapsedTime);
            }

            if (!isPaused) {
                const currentTime = new Date().getTime();
                elapsedTime = currentTime - startTime;
                displayTime(elapsedTime);
            }

            if (liste1URL) {
                typeDropdown.value = liste1URL;
            }

            if (liste2URL) {
                causeDropdown.value = liste2URL;
            }

            if (Text1URL) {
                zoneTexte.value = Text1URL;
            }

            if (Text2URL) {
                zonePieces.value = Text2URL;
                updateCapsules();
            }


            if (chronoData.arret) {
                tempsArretsInput.value = chronoData.arret;
            }

            await setPrefixedItem(lieu, JSON.stringify(chronoData));
            // Si le chrono est en pause, mettre à jour l'affichage en conséquence
            if (isPaused) {
                var currentTime = new Date().getTime();
                var pauseDuration = currentTime - pauseStartTime;
                totalPauseDuration += pauseDuration;
                startTime += pauseDuration;
                pauseStartTime = currentTime;
                clearInterval(interval);
                var listItem = document.querySelector('.active-chrono');
                listItem.classList.add('paused');
                var pauseResumeButton = listItem.querySelector('.modal-button[onclick="pauseResumeChrono()"]');
                pauseResumeButton.textContent = 'Reprendre';
                pauseResumeButton.style.backgroundColor = 'green';
                document.querySelector('.chrono-status').textContent = 'En pause';
                document.querySelector('.chrono-status').style.color = 'yellow';
                displayTime(elapsedTime);
            }
        }
    } else {

        // Si aucune donnée n'est présente dans le localStorage et aucune valeur n'est présente dans l'URL,
        // initialiser les données du chrono avec les valeurs de l'URL
        const tempsActuel = new Date().getTime();
        elapsedTime = 0;
        isPaused = false;
        startTime = tempsActuel;
        pauseStartTime = 0;
        totalPauseDuration = 0; // Initialiser la durée totale de pause à 0

        // Récupérer les données du localStorage
        const savedData = await getPrefixedItem(lieu);

        // Si aucune donnée n'est présente dans le localStorage et aucune valeur n'est présente dans l'URL,
        // initialiser les données du chrono avec les valeurs de l'URL
        if (!savedData && temps === '') {
            // Initialiser les données du chrono avec les valeurs de l'URL
            zoneTexte.value = '';
            zonePieces.value = '';
            typeDropdown.value = '';
            causeDropdown.value = '';
            tempsArretsInput.value = '';
        }

        if (savedData) {
            // Restaurer les données du chrono
            restoreChronoData(0);
        } else {
            // Si aucune donnée n'est présente dans le localStorage, initialiser les données du chrono avec les valeurs de l'URL

            if (tempsURL !== '') {

                const tempsActuel = new Date().getTime();
                elapsedTime = 0;
                isPaused = false;
                startTime = tempsActuel - convertirTempsEnMillisecondes(tempsURL);
                pauseStartTime = 0;
                totalPauseDuration = 0;
                zoneTexte.value = Text1URL;
                zonePieces.value = Text2URL;
                typeDropdown.value = liste1URL;
                causeDropdown.value = liste2URL;
                tempsArretsInput.value = arretURL;
                updateCapsules();
                // Créer l'objet chronoData avec les valeurs initiales
                const chronoData = {
                    isPaused: isPaused,
                    startTime: startTime,
                    pauseStartTime: pauseStartTime,
                    totalPauseDuration: totalPauseDuration,
                    elapsedTime: elapsedTime,
                    texteZone: zoneTexte.value,
                    piecesSortie: zonePieces.value,
                    type: typeDropdown.value,
                    cause: causeDropdown.value,
                    arret: tempsArretsInput.value

                };

                // Enregistrer les données du chrono dans le localStorage
                await setPrefixedItem(lieu, JSON.stringify(chronoData));
            } else {

                const tempsActuel = new Date().getTime();
                elapsedTime = 0;
                isPaused = false;
                startTime = tempsActuel;
                pauseStartTime = 0;
                totalPauseDuration = 0;
                zoneTexte.value = '';
                zonePieces.value = '';
                tempsArretsInput.value = '';

                // Créer l'objet chronoData avec les valeurs initiales
                const chronoData = {
                    isPaused: isPaused,
                    startTime: startTime,
                    pauseStartTime: pauseStartTime,
                    totalPauseDuration: totalPauseDuration,
                    elapsedTime: elapsedTime,
                    texteZone: '',
                    piecesSortie: '',
                    type: '',
                    cause: '',
                    arret: ''
                };

                // Enregistrer les données du chrono dans le localStorage
                await setPrefixedItem(lieu, JSON.stringify(chronoData));
            }
        }
    }


    function getURLParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(location.search);

        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }
}


// Mettre à jour l'URL dans un élément HTML
function updateChrono() {

    if (!isPaused) {
        const currentTime = new Date().getTime();
        elapsedTime = currentTime - startTime;
        displayTime(elapsedTime);



    }
}

// Exemple d'élément HTML à ajouter dans votre page
// <div id="urlDisplay"></div>


interval = setInterval(updateChrono, 1000);


async function pauseResumeChrono() {
    const listItem = document.querySelector('.active-chrono');
    const pauseResumeButton = listItem.querySelector('.modal-button[onclick="pauseResumeChrono()"]');
    const tempsArretInput = document.getElementById("tempsArretsInput");
    const tempsArretValue = tempsArretInput.value;


    if (!isPaused) {
        isPaused = true;
        listItem.classList.add('paused');
        pauseStartTime = new Date().getTime();
        clearInterval(interval);

        // Ajouter les valeurs de type et de cause
        const typeDropdown = document.getElementById("typeDropdown");
        const causeDropdown = document.getElementById("causeDropdown");
        const typeValue = typeDropdown.value;
        const causeValue = causeDropdown.value;
        const arretValue = tempsArretsInput.value;
        const chronoData = {
            isPaused: isPaused,
            startTime: startTime,
            pauseStartTime: pauseStartTime,
            totalPauseDuration: totalPauseDuration,
            elapsedTime: elapsedTime,
            texteZone: zoneTexte.value,
            piecesSortie: zonePieces.value,
            type: typeValue,
            cause: causeValue,
            arret: arretValue
        };

        await setPrefixedItem(lieu, JSON.stringify(chronoData));

        // Modifier le bouton pour afficher "Reprendre"
        pauseResumeButton.textContent = 'Reprendre';
        pauseResumeButton.style.backgroundColor = 'green';
        document.querySelector('.chrono-status').textContent = 'En pause';
        document.querySelector('.chrono-status').style.color = 'yellow';
    } else {
        isPaused = false;
        listItem.classList.remove('paused');
        listItem.classList.remove('STOP');
        document.querySelector('.chrono-status').textContent = 'En cours';
        document.querySelector('.chrono-status').style.color = 'limegreen';
        const pauseDuration = new Date().getTime() - pauseStartTime;
        totalPauseDuration += pauseDuration; // Ajouter la durée de la pause à la durée totale
        startTime += pauseDuration;
        interval = setInterval(updateChrono, 1000);

        // Ajouter les valeurs de type et de cause
        const typeDropdown = document.getElementById("typeDropdown");
        const causeDropdown = document.getElementById("causeDropdown");
        const typeValue = typeDropdown.value;
        const causeValue = causeDropdown.value;
        const arretValue = tempsArretsInput.value;
        const chronoData = {
            isPaused: isPaused,
            startTime: startTime,
            pauseStartTime: pauseStartTime,
            totalPauseDuration: totalPauseDuration,
            elapsedTime: elapsedTime,
            texteZone: zoneTexte.value,
            piecesSortie: zonePieces.value,
            type: typeValue,
            cause: causeValue,
            arret: arretValue
        };



        // Modifier le bouton pour afficher "Pause"
        pauseResumeButton.textContent = 'Pause';
        pauseResumeButton.style.backgroundColor = 'yellow';

        await setPrefixedItem(lieu, JSON.stringify(chronoData));

        // Afficher un log
    }
}

async function saveRecord() {


    const savedData = await getPrefixedItem(lieu); // Assurez-vous d'utiliser `await`

    const listItem = document.querySelector('.active-chrono');
    const pauseResumeButton = listItem.querySelector('.modal-button[onclick="pauseResumeChrono()"]');
    const tempsArretInput = document.getElementById("tempsArretsInput");
    const tempsArretValue = tempsArretInput.value;

    // Vérifier si la chronologie est en pause
    if (isPaused === false) {
        isPaused = true;
        pauseStartTime = new Date().getTime();
        clearInterval(interval);
    }

    // Récupérer les valeurs des listes déroulantes de type et de cause
    const typeValue = document.getElementById('typeDropdown').value;
    const causeValue = document.getElementById('causeDropdown').value;
    const arretValue = document.getElementById('tempsArretsInput').value;

    // Récupérer les valeurs des champs de texte
    const zoneTexteValue = document.getElementById('zone-texte').value.trim(); // Assurez-vous de bien cibler l'élément
    const zonePiecesValue = document.getElementById('zone-pieces').value.trim();

    // Vérifier si la zone de texte contient un point-virgule


    // Vérifier si les champs obligatoires sont renseignés
    if (
        zoneTexteValue.trim() === '' ||
        typeValue.trim() === '' ||
        causeValue.trim() === '' ||
        zoneTexteValue.includes('_') ||
        zoneTexteValue.includes('&') ||
        zoneTexteValue.includes('%') ||
        zoneTexteValue.includes('#') ||
        zoneTexteValue.includes('|') ||
        zoneTexteValue.includes(';')

    ) {
        // Afficher un message d'erreur et empêcher l'enregistrement
        alert("Vérifier que tous les champs obligatoires (Texte, Type, Cause) soit remplis. \nSans utiliser les caractères spéciaux suivants : \n _ & % # + | ;");



        listItem.classList.add('STOP');
        document.querySelector('.chrono-status').textContent = 'Info manquantes';
        document.querySelector('.chrono-status').style.color = 'white';
        pauseResumeButton.textContent = 'Reprendre';
        pauseResumeButton.style.backgroundColor = 'green';
        isPaused = true;
        pauseStartTime = new Date().getTime();
        clearInterval(interval);

        const chronoData = {
            isPaused: isPaused,
            startTime: startTime,
            pauseStartTime: pauseStartTime,
            totalPauseDuration: totalPauseDuration,
            elapsedTime: elapsedTime,
            texteZone: zoneTexte.value,
            piecesSortie: zonePieces.value,
            type: typeValue,
            cause: causeValue,
            arret: arretValue
        };

        await setPrefixedItem(lieu, JSON.stringify(chronoData));
        return;
    }

    // Créer l'objet chronoData avec les données de la chronologie et les informations de type et de cause
    const chronoData = {
        isPaused: isPaused,
        startTime: startTime,
        pauseStartTime: pauseStartTime,
        totalPauseDuration: totalPauseDuration,
        elapsedTime: elapsedTime,
        texteZone: zoneTexteValue,
        piecesSortie: zonePiecesValue,
        type: typeValue,
        cause: causeValue,
        arret: arretValue
    };

    await setPrefixedItem(lieu, JSON.stringify(chronoData));

    // Marquer la chronologie comme STOP
    listItem.classList.add('STOP');
    document.querySelector('.chrono-status').textContent = 'Sauvegarde échouée, réessayez.';
    document.querySelector('.chrono-status').style.color = 'white';
    pauseResumeButton.textContent = 'Reprendre';
    pauseResumeButton.style.backgroundColor = 'green';

    // Si les valeurs nécessaires sont renseignées, procéder à l'enregistrement
    const tempsAffiche = document.getElementById('chrono').textContent;
    const currentDate = new Date();

    const lieuSansCompteur = retirerSuffixeCompteur(lieu);

    const formattedDate = `${pad(currentDate.getDate())}/${pad(currentDate.getMonth() + 1)}/${currentDate.getFullYear()}`;
    
const texteZoneNettoye = remplacerPlusUnicode(zoneTexteValue);

const enregistrement = `${formattedDate} _ ${tempsAffiche} _ ${lieuSansCompteur} _ ${texteZoneNettoye} _ ${zonePiecesValue} _ ${typeValue} _ ${causeValue} _ ${tempsArretValue}`;


console.log(elapsedTime)
console.log(2 * 60 * 60 * 1000)
// Vérification si temps < 2 heures
if (elapsedTime > 2 * 60 * 60 * 1000) {
const afftime = (elapsedTime / (60 * 60 * 1000)).toFixed(1);
const confirmer = confirm("Le temps semble élevé : " + afftime + " h. OK pour continuer ?");

    if (!confirmer) {
        // Mise en pause et indication visuelle
        isPaused = true;
        pauseStartTime = new Date().getTime();
        clearInterval(interval);
        listItem.classList.add('STOP');
        document.querySelector('.chrono-status').textContent = 'Mis en attente';
        document.querySelector('.chrono-status').style.color = 'orange';
        pauseResumeButton.textContent = 'Reprendre';
        pauseResumeButton.style.backgroundColor = 'green';

        const chronoData = {
            isPaused: isPaused,
            startTime: startTime,
            pauseStartTime: pauseStartTime,
            totalPauseDuration: totalPauseDuration,
            elapsedTime: elapsedTime,
            texteZone: zoneTexteValue,
            piecesSortie: zonePiecesValue,
            type: typeValue,
            cause: causeValue,
            arret: arretValue
        };

        await setPrefixedItem(lieu, JSON.stringify(chronoData));
        return; // Ne pas enregistrer
    }
}

        sendEventToParent('enregistrement', enregistrement);

        setTimeout(async () => {
            sendEventToParent('fermer', lieu);

        }, 100);
   
}

function retirerSuffixeCompteur(lieu) {
    return lieu.replace(/\[\d+\]$/, ''); // Retire les suffixes du type [1], [2], [3], etc.
}

async function cancelChrono() {
    const confirmation = confirm("Voulez-vous vraiment fermer le chrono ?");

    if (confirmation) {
 
            sendEventToParent('fermer', lieu);


 
    }
}

function togglePause(isPausing, statusText, buttonColor) {
    const pauseResumeButton = document.querySelector('.modal-button[onclick="pauseResumeChrono()"]');
    const listItem = document.querySelector('.active-chrono');
    const chronoStatus = document.querySelector('.chrono-status');

    if (isPausing) {
        isPaused = true;
        pauseStartTime = new Date().getTime();
        clearInterval(interval);
    } else {
        isPaused = false;
        // Ajoutez ici toute logique nécessaire pour reprendre
    }

    listItem.classList.toggle('STOP', isPausing);
    chronoStatus.textContent = statusText;
    chronoStatus.style.color = 'white';
    pauseResumeButton.textContent = isPausing ? 'Reprendre' : 'Pause';
    pauseResumeButton.style.backgroundColor = buttonColor;
}


function displayTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const remainingSeconds = seconds % 60;
    const remainingMinutes = minutes % 60;
    const remainingHours = hours % 24;

    let formattedTime = '';

    if (days > 0) {
        formattedTime += `${days}j `;
    }
    if (remainingHours > 0 || days > 0) {
        formattedTime += `${pad(remainingHours)}h `;
    }
    if (remainingMinutes > 0 || remainingHours > 0 || days > 0) {
        formattedTime += `${pad(remainingMinutes)}m `;
    }
    if (remainingSeconds > 0 || remainingMinutes > 0 || remainingHours > 0 || days > 0) {
        formattedTime += `${pad(remainingSeconds)}s `;
    }
    if (milliseconds < 1000) {
        formattedTime += '0s';
    }

    document.getElementById('chrono').textContent = formattedTime.trim();
}



function pad(number) {
    return number < 10 ? `0${number}` : number;
}


function sendEventToParent(eventType, eventData) {
    const message = {
        type: eventType,
        data: eventData
    };

    // Envoyer le message à la fenêtre parente
    window.parent.postMessage(message, '*');
}


const zoneTexte = document.getElementById('zone-texte');
const zonePieces = document.getElementById('zone-pieces');
// Variables globales pour stocker les valeurs des zones de texte et des listes déroulantes
let texteZoneValue = '';
let piecesSortieValue = '';
let typeValue = '';
let causeValue = '';
let arretValue = '';


// Fonction pour mettre à jour les données dans le localStorage avec les valeurs actuelles
async function updateLocalStorage() {

    // Récupérer les valeurs actuelles des listes déroulantes
    typeValue = typeDropdown.value;
    causeValue = causeDropdown.value;
    texteZoneValue = zoneTexte.value;
    piecesSortieValue = zonePieces.value;
    const arretValue = tempsArretsInput.value;


    const chronoData = {
        isPaused: isPaused,
        startTime: startTime,
        pauseStartTime: pauseStartTime,
        totalPauseDuration: totalPauseDuration,
        elapsedTime: elapsedTime,
        texteZone: texteZoneValue,
        piecesSortie: piecesSortieValue,
        type: typeValue,
        cause: causeValue,
        arret: arretValue // Ajouter la valeur de tempsArretsInput dans l'objet chronoData
    };

//console.log("📥 Clé utilisée :", lieu);
//console.log("📤 Données envoyées :", JSON.stringify(chronoData));

    await setPrefixedItem(lieu, JSON.stringify(chronoData));
}


// Gestionnaire d'événements pour la première zone de texte (texteZone)
zoneTexte.addEventListener('input', function() {
    texteZoneValue = zoneTexte.value;
    updateLocalStorage();
});

// Gestionnaire d'événements pour la deuxième zone de texte (zonePieces)
zonePieces.addEventListener('input', function() {
    piecesSortieValue = zonePieces.value;
    updateLocalStorage();
});


function normalizeString(str) { return norm(str); } // pour compat, si tu veux


zoneTexte.addEventListener('keydown', function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
    }
});

zoneTexte.addEventListener('blur', () => {
    // Exemple de vérification spécifique
    if (zoneTexte.value.trim() === '') {
        zoneTexte.value = '';
    }
});
function updateFloatingList(input, list, data) {
  const searchValue = norm(input.value);
  list.innerHTML = '';

  let hasMatch = false;
  data.forEach(item => {
    if (norm(item).includes(searchValue)) {
      const li = document.createElement('li');
      li.textContent = item;
      li.onclick = () => {
        input.value = item;           // valeur “propre”
        input.classList.remove("not-in-list");
        list.style.display = 'none';
        updateLocalStorage();
      };
      list.appendChild(li);
      hasMatch = true;
    }
  });

  if (!hasMatch) {
    const li = document.createElement('li');
    li.textContent = 'Aucun résultat';
    li.style.color = 'gray';
    li.style.cursor = 'default';
    list.appendChild(li);
  }
  list.style.display = 'block';
}


function ensureVisibleForKeyboard(input, list) {
 setTimeout(() => {
    window.parent.postMessage({ type: 'centerIframe', content: lieu }, '*');
  }, 50);
}


function setActiveItem(list, index) {
  const items = Array.from(list.querySelectorAll('li'));
  items.forEach((li,i)=>li.classList.toggle('active', i===index));
  const active = items[index];
  if (!active) return;
  const ar = active.getBoundingClientRect();
  const lr = list.getBoundingClientRect();
  if (ar.bottom > lr.bottom) list.scrollTop += (ar.bottom - lr.bottom);
  if (ar.top < lr.top)       list.scrollTop -= (lr.top - ar.top);
}

function attachKeyboardNavigation(input, list) {
  if (!input) return;
  input._navIndex = -1;

  input.addEventListener('keydown', (e) => {
    const items = Array.from(list.querySelectorAll('li'));
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      input._navIndex = Math.min(items.length - 1, input._navIndex + 1);
      setActiveItem(list, input._navIndex);
      list.style.display = 'block';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      input._navIndex = Math.max(0, input._navIndex - 1);
      setActiveItem(list, input._navIndex);
      list.style.display = 'block';
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = input._navIndex >= 0 ? input._navIndex : 0;
      const li = items[idx];
      const txt = li?.textContent?.trim();
      if (txt && txt !== 'Aucun résultat') {
        input.value = txt;
        list.style.display = 'none';
        updateLocalStorage();
      }
    } else if (e.key === 'Escape') {
      list.style.display = 'none';
    }
  });

  // clic dans la liste (sans perdre le focus)
  list.addEventListener('mousedown', ev => ev.preventDefault());
  list.addEventListener('click', ev => {
    const li = ev.target.closest('li');
    if (!li) return;
    const txt = li.textContent.trim();
    if (txt && txt !== 'Aucun résultat') {
      input.value = txt;
      list.style.display = 'none';
      updateLocalStorage();
    }
  });
}


function validateInputValue(input, data) {
  const v = norm(input.value);
  const found = data.some(item => norm(item) === v);

  if (!found) {
    // Au lieu d'effacer, on laisse la valeur + on peut marquer visuellement
    // input.value = "";  // ❌ évite d'effacer
    input.classList.add("not-in-list");
  } else {
    input.classList.remove("not-in-list");
  }
}

// 2) Ouvrir / filtrer + auto-scroll sur focus/clic
typeDropdown.addEventListener('input', () => {
  updateFloatingList(typeDropdown, typeListFix, lieuData.types);
  ensureVisibleForKeyboard(typeDropdown, typeListFix);
});
typeDropdown.addEventListener('focus', () => {
  updateFloatingList(typeDropdown, typeListFix, lieuData.types);
  ensureVisibleForKeyboard(typeDropdown, typeListFix);
  });
typeDropdown.addEventListener('click', () => {
  updateFloatingList(typeDropdown, typeListFix, lieuData.types);
  ensureVisibleForKeyboard(typeDropdown, typeListFix);
});
typeDropdown.addEventListener('blur', () => {
  validateInputValue(typeDropdown, lieuData.types);
  setTimeout(() => { typeListFix.style.display = 'none'; }, 10);
});

causeDropdown.addEventListener('input', () => {
  updateFloatingList(causeDropdown, causeListFix, lieuData.causes);
  ensureVisibleForKeyboard(causeDropdown, causeListFix);
});
causeDropdown.addEventListener('focus', () => {
  updateFloatingList(causeDropdown, causeListFix, lieuData.causes);
  ensureVisibleForKeyboard(causeDropdown, causeListFix);
  });
causeDropdown.addEventListener('click', () => {
  updateFloatingList(causeDropdown, causeListFix, lieuData.causes);
  ensureVisibleForKeyboard(causeDropdown, causeListFix);
});
causeDropdown.addEventListener('blur', () => {
  validateInputValue(causeDropdown, lieuData.causes);
  setTimeout(() => { causeListFix.style.display = 'none'; }, 10);
});

// 3) Navigation clavier — ATTACHER UNE SEULE FOIS
attachKeyboardNavigation(typeDropdown,  typeListFix);
attachKeyboardNavigation(causeDropdown, causeListFix);


document.getElementById("updateTimeButton").addEventListener("click", async function() {
    // Récupérer le texte affiché dans le chrono
const chronoText = document.getElementById("chrono").textContent.trim();

// Extraire les composantes (jours, heures, minutes, secondes)
const jours = /(\d+)j/.exec(chronoText)?.[1] || 0;
const heures = /(\d+)h/.exec(chronoText)?.[1] || 0;
const minutes = /(\d+)m/.exec(chronoText)?.[1] || 0;
const secondes = /(\d+)s/.exec(chronoText)?.[1] || 0;

let tempsActuel = "";

if (jours > 0 || heures > 0 || minutes > 0) {
    tempsActuel = `${jours > 0 ? jours + "j " : ""}${heures > 0 ? heures + "h " : ""}${minutes > 0 ? minutes + "m" : ""}`.trim();
} else if (secondes > 0) {
    tempsActuel = "< 1min";
} else {
    tempsActuel = "0m";
}

// Afficher dans le prompt
const tempsSaisi = prompt(`Temps actuel : ${tempsActuel}\nChanger le temps pour 'Xh Ym'.`);


    if (tempsSaisi) {
        const tempsEnMillisecondes = convertirTempsEnMillisecondes(tempsSaisi);

        if (tempsEnMillisecondes >= 0) {
            const currentTime = new Date().getTime();
            startTime = currentTime - tempsEnMillisecondes;
            elapsedTime = tempsEnMillisecondes;

            displayTime(elapsedTime);

            const chronoData = {
                isPaused,
                startTime,
                pauseStartTime,
                totalPauseDuration,
                elapsedTime,
                texteZone: texteZoneValue,
                piecesSortie: piecesSortieValue,
                type: typeValue,
                cause: causeValue,
                arret: arretValue
            };

            await setPrefixedItem(lieu, JSON.stringify(chronoData));
        } else {
            alert("Le format du temps saisi est incorrect. Veuillez réessayer.");
        }
    }
});



function UsePreconfig(lieu, Temps, index) {

    const typeValue = document.getElementById('typeDropdown').value;
    const causeValue = document.getElementById('causeDropdown').value;
    let arretValue = document.getElementById('tempsArretsInput').value; // Changer en 'let'

    const zoneTexteValue = document.getElementById('zone-texte').value.trim();
    const zonePiecesValue = document.getElementById('zone-pieces').value.trim();
    // Vérifier si arretValue est égal à '00:00' et le réinitialiser à une chaîne vide
    if (arretValue === '00:00') {
        arretValue = '';
    }

    // Vérifier si toutes les valeurs sont vides
    if (!typeValue && !causeValue && !arretValue && !zoneTexteValue) {
        // Si toutes les valeurs sont vides, enregistrer directement
        enregistrerConfiguration(lieu, Temps, index, zonePiecesValue);
    } else {
        // Sinon, demander confirmation pour remplacer les valeurs existantes
        if (confirm("Attention, l'un des champs est déjà renseigné. Voulez-vous remplacer par la configuration par défaut ?")) {
            enregistrerConfiguration(lieu, Temps, index, zonePiecesValue);
        }
    }
}

async function enregistrerConfiguration(lieu, Temps, index, Pièces) {
    const enregistrement = `${lieu} _ ${Temps} _ ${index} _ ${Pièces}`;
    const savedData = await getPrefixedItem(lieu);

    if (savedData) {

       
            sendEventToParent('rename4', enregistrement);
    
    }
}


async function envoyerChronoDataAuParent(Nouveaulieu) {
    const savedData = await getPrefixedItem(lieu); // Attendre la résolution

    const listItem = document.querySelector('.active-chrono');
    const pauseResumeButton = listItem.querySelector('.modal-button[onclick="pauseResumeChrono()"]');
    const tempsArretInput = document.getElementById("tempsArretsInput");
    const tempsArretValue = tempsArretInput.value;

    // Récupérer les valeurs des listes déroulantes de type et de cause
    const typeValue = document.getElementById('typeDropdown').value;
    const causeValue = document.getElementById('causeDropdown').value;
    const arretValue = document.getElementById('tempsArretsInput').value;

    // Récupérer les valeurs des champs de texte
    const zoneTexteValue = document.getElementById('zone-texte').value.trim(); // Assurez-vous de bien cibler l'élément
    const zonePiecesValue = document.getElementById('zone-pieces').value.trim();

    const tempsAffiche = document.getElementById('chrono').textContent;
    const currentDate = new Date();

    const formattedDate = `${pad(currentDate.getDate())}/${pad(currentDate.getMonth() + 1)}/${currentDate.getFullYear()}`;
    const enregistrement = `${Nouveaulieu} _ ${tempsAffiche} _ ${lieu} _ ${zoneTexteValue} _ ${zonePiecesValue} _ ${typeValue} _ ${causeValue} _ ${tempsArretValue}`;

    if (savedData) {
        
            sendEventToParent('rename2', enregistrement);

      

    }
}


async function SendPiece() {
    const zonePiecesValue = document.getElementById('zone-pieces').value.trim();

    const enregistrement = `${lieu} _ ${zonePiecesValue}`;

    sendEventToParent("pieces", enregistrement)

}


// Ajouter un écouteur pour recevoir les messages dans l'iframe
window.addEventListener('message', async function(event) {
    // Demander confirmation avant de traiter le message
    console.warn("Message dans iframe : " +lieu +" : " +event.data)

    // Si l'utilisateur accepte le message, procéder aux vérifications
    if (event.data.type === "Pause") { // Vérifier 'type' au lieu de 'action'
        pauseResumeChrono(); // Fonction qui met en pause le chrono
    }
    // Vérifier le type du message
    switch (event.data.type) {



        case "modifierPieces":
            const lieuamod = event.data.lieu; // Le lieu envoyé
            const piecesDataString = event.data.pieces; // Les pièces sous forme de ID:QTT,ID:QTT,...

            // Utiliser votre fonction globale pour vérifier si le lieu correspond
            if (lieuamod === lieu) {

                // Si le lieu correspond, appliquer les modifications
                const zonePieces = document.getElementById("zone-pieces");

                // Vérifier si l'élément existe avant de le modifier
                if (zonePieces) {
                    // Modifier la valeur de la zone de texte sans toucher au contenu de la chaîne
                    zonePieces.value = piecesDataString;
                    updateCapsules();
                    // Créer et déclencher un événement "input" pour simuler la modification humaine
                    const inputEvent = new Event('input', {
                        bubbles: true, // Permet de propager l'événement
                        cancelable: true // Permet d'annuler l'événement
                    });
                    zonePieces.dispatchEvent(inputEvent); // Déclenche l'événement sur l'élément
                } else {
                    console.error('Element "zone-pieces" non trouvé.');
                }
            } else {
            }
            break;
        case 'Rename':

            const contenuMessageRename = event.data;
            const Nouveaulieu = contenuMessageRename.lieu; // Si le message contient une propriété 'lieu'

            envoyerChronoDataAuParent(Nouveaulieu);
            break;
        case 'setURL':

        console.log(`🔄 Changement de l'URL vers : ${event.data.url}`);
        window.location.href = event.data.url;


            break;

        case 'Rename3':
            const contenuMessageRename3 = event.data;
            const tempsAffiche = document.getElementById('chrono').textContent;
            const index = contenuMessageRename3.index; // Récupérer l'index du message


            // Utiliser l'index avec la fonction UsePreconfig si nécessaire
            UsePreconfig(contenuMessageRename3.lieu, tempsAffiche, index);

            break;


     case 'Pause':
            if (!isPaused) {
                pauseResumeChrono();
            }
            break;

        case 'Reprendre':
            if (isPaused) {
                pauseResumeChrono();
            }
            break;
    }
});


     function updateCapsules() {
                    // Récupérer le contenu de la zone de texte
                    let content = document.getElementById('zone-pieces').value;

                    // Nettoyer tout le contenu précédent des capsules
                    let capsulesContainer = document.getElementById('capsules-container');
                    capsulesContainer.innerHTML = '';

                    // Diviser le contenu en parties (par exemple, chaque élément séparé par une virgule)
                    let piecesArray = content.split(','); // Divise le texte par les virgules

                    // Pour chaque élément, extraire la référence et la quantité et créer une "capsule"
                    piecesArray.forEach(piece => {
                        // Nettoyer l'élément (enlever les espaces inutiles et les crochets)
                        let cleanedPiece = piece.trim().replace(/[\[\]]/g, '').split(':');

                        // Vérifier que l'élément a bien une référence et une quantité
                        if (cleanedPiece.length === 2) {
                            let reference = cleanedPiece[0].trim(); // Référence de la pièce
                            let quantity = cleanedPiece[1].trim(); // Quantité de la pièce

                            // Formater le texte de la capsule : "Référence : Quantité"
                            let formattedText = `${reference} Q=${quantity}`;

                            // Créer un élément div pour la capsule
                            let capsule = document.createElement('div');
                            capsule.textContent = formattedText; // Le texte formaté

                            // Ajouter des styles pour rendre la capsule agréable à voir
                            capsule.style.padding = '3px 6px';
                            capsule.style.backgroundColor = 'blue';
                            capsule.style.color = 'white';
                            capsule.style.borderRadius = '5px';
                            capsule.style.margin = '1px';
                            capsule.style.fontSize = '16px';
                            capsule.style.whiteSpace = 'nowrap'; // Assurer que chaque capsule reste sur la même ligne

                            // Ajouter la capsule au conteneur
                            capsulesContainer.appendChild(capsule);
                        }
                    });
                }



// helper: debounce générique
function debounce(fn, delay = 150) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// n'appeler que si l'élément est VRAIMENT actif
function ensureIfActive(el) {
  if (document.activeElement === el) {
    ensureVisibleForKeyboard(el);
  }
}


// 1) Au focus (tap/clic qui donne le focus)
zoneTexte.addEventListener('focus', () => {
  // petit délai iOS utile quand le clavier apparaît
  setTimeout(() => ensureIfActive(zoneTexte), 200);
});

// 2) Pendant la saisie (mais seulement si encore focus)
zoneTexte.addEventListener('input', debounce(() => ensureIfActive(zoneTexte), 150));

// Optionnel: si tu veux couvrir la nav clavier
zoneTexte.addEventListener('keydown', debounce(() => ensureIfActive(zoneTexte), 150));

// 3) Pas besoin de click/touchstart: ils peuvent se déclencher pendant un scroll

// 🔧 Normalisation robuste
function norm(s) {
  return (s ?? "")
    .normalize("NFD")                 // sépare les accents
    .replace(/[\u0300-\u036f]/g, "")  // enlève les accents
    .replace(/\u00A0/g, " ")          // remplace espace insécable par espace normal
    .replace(/\s+/g, " ")             // compresse les espaces multiples
    .trim()
    .toLowerCase();
}
