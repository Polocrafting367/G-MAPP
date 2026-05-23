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

// tout en haut, près de tes autres const
const typeDropdown  = document.getElementById('typeDropdown');
const causeDropdown = document.getElementById('causeDropdown');

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
let savedTheme = "";
let contrastEnabled = false;

function removeAllThemes() {
    ["glassThemeStyle", "retroThemeStyle", "contrastStyle"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });
}

async function loadThemeCSS(styleId, path) {
    try {
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
        return;
    }
}

/* ---------- CONTRASTE : APPLY / REMOVE + PERSIST ---------- */
function removeContrastCSS() {
    const node = document.getElementById("contrastStyle");
    if (node) node.remove();
}
async function applyContrastCSS() {
    if (!document.getElementById("contrastStyle")) {
        await loadThemeCSS("contrastStyle", "CSS/style_constrast.css");
    }
}
function removeContrastEffects() {
    document.querySelectorAll("button").forEach(btn => {
        btn.classList.remove("no-contrast-overlay");
        const m = btn.querySelector("span[data-contrast-span='1']");
        if (m) { btn.textContent = m.textContent; }
    });
}
async function applyContrastEffects() {
    document.querySelectorAll("button").forEach(btn => {
        if (btn.id && btn.id.startsWith("lancer-chrono-btn")) {
            btn.classList.add("no-contrast-overlay");
            return;
        }
        if (btn.querySelector("span[data-contrast-span='1']")) return;
        const span = document.createElement("span");
        span.setAttribute("data-contrast-span", "1");
        span.textContent = btn.textContent;
        span.style.position = "relative";
        span.style.zIndex = "1";
        btn.textContent = "";
        btn.appendChild(span);
    });
}
async function setContrastState(enabled, persist) {
  contrastEnabled = !!enabled;
  // NEW: expose l’état au CSS
  document.documentElement.classList.toggle('contrast-on', contrastEnabled);

  if (contrastEnabled) {
    await applyContrastCSS();
    await applyContrastEffects();
  } else {
    removeContrastEffects();
    removeContrastCSS();
  }
  if (persist) {
    try { await setPrefixedItem("contrastEnabled", contrastEnabled ? "true" : "false"); } catch {}
  }
}

/* ---------- LECTURE ETAT CONTRASTE ---------- */
function waitParentContrast(timeoutMs = 800) {
    return new Promise(resolve => {
        let settled = false;
        function onMsg(e) {
            if (!e || !e.data || e.data.type !== "contrast-state") return;
            settled = true;
            window.removeEventListener("message", onMsg);
            resolve(!!e.data.enabled);
        }
        window.addEventListener("message", onMsg);
        try { window.parent && window.parent.postMessage({ type: "request-contrast-state" }, "*"); } catch {}
        setTimeout(() => {
            if (settled) return;
            window.removeEventListener("message", onMsg);
            resolve(null); // parent muet → fallback DB
        }, timeoutMs);
    });
}

async function readContrastFromDB() {
    try {
        const raw = await getPrefixedItem("contrastEnabled");
        return (raw === true || raw === "true");
    } catch { return false; }
}

/* ---------- INIT THEME + CONTRASTE ---------- */
async function ChargTheme() {
    const rawTheme = await getPrefixedItem("themeEnabled").catch(() => "");
    try { savedTheme = JSON.parse(rawTheme); } catch { savedTheme = rawTheme; }

    removeAllThemes(); // retire tout, y compris un contraste collé

    if (savedTheme === "glass") {
        await loadThemeCSS("glassThemeStyle", "CSS/style_glass.css");
    } else if (savedTheme === "retro") {
        await loadThemeCSS("retroThemeStyle", "CSS/style_retro.css");
    }

    // 1) on demande au parent (source de vérité)
    const fromParent = await waitParentContrast();
    if (fromParent !== null) {
        await setContrastState(fromParent, true); // applique + PERSISTE dans l’IndexedDB de l’iframe
        return;
    }

    // 2) fallback DB locale si le parent est muet
    const fromDB = await readContrastFromDB();
    await setContrastState(fromDB, false);
}

/* ---------- ECOUTE MISE A JOUR EN DIRECT ---------- */
window.addEventListener("message", async (e) => {
    if (!e || !e.data || e.data.type !== "contrast-state") return;
    await setContrastState(!!e.data.enabled, true); // applique + synchronise la clé locale
});

/* ---------- ACTION UTILISATEUR ---------- */
async function handleThemeButtonClick(theme) {
    await setPrefixedItem("themeGlassEnabled", theme);
    await setPrefixedItem("themeEnabled", JSON.stringify(theme));
    await ChargTheme();
}

/* ---------- BOOT ---------- */
window.addEventListener("DOMContentLoaded", async () => {
    await ChargTheme();
});


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
enablePieces();

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
        const liste1 = getURLParameter('liste1'); // type
        const liste2 = getURLParameter('liste2'); // cause
        const Text1  = getURLParameter('Text1');  // zoneTexte
        const Text2  = getURLParameter('Text2');  // zonePieces
        const tempbox = getURLParameter('arret');

console.log(
  `iframe RestoCréa pour : ${lieux} || Avec les éléments` +
  ` || Temps : ${tempsParam}` +
  ` || Type : ${liste1}` +
  ` || Cause : ${liste2}` +
  ` || Pièces : ${Text2}` +
  ` || Résumé : ${Text1}` +    // ou l’inverse selon ton intention
  ` || TPS Arrêt : ${tempbox}`
);
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
  if (!temps) return 0;

  // On autorise des formats variés : "1h 30", "1h30", "27m 58", "3h 5", "56"
  const str = String(temps).toLowerCase();

  // Règle de défaut contextuelle :
  // - si unité manquante après 'h' => minutes
  // - si unité manquante après 'm' => secondes
  // - sinon (début ou autre)       => minutes
  let lastContextUnit = null; // 'h' | 'm' | 'j' | 's' | null

  let total = 0;
  const re = /(\d+)\s*([jhrsm]?)/g; // nombre + unité optionnelle
  let m;

  while ((m = re.exec(str)) !== null) {
    const value = parseInt(m[1], 10);
    let unit = m[2]; // peut être vide

    if (!unit) {
      if (lastContextUnit === 'h') unit = 'm';
      else if (lastContextUnit === 'm') unit = 's';
      else unit = 'm'; // défaut global : minutes
    } else {
      lastContextUnit = unit; // met à jour le contexte seulement si unité explicite
    }

    switch (unit) {
      case 'j': total += value * 24 * 60 * 60 * 1000; break;
      case 'h': total += value * 60 * 60 * 1000; break;
      case 'm': total += value * 60 * 1000; break;
      case 's': total += value * 1000; break;
      default:  /* ignore */ break;
    }
  }

  return total; // 0 si rien de valide trouvé (comportement inchangé)
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


function updateFloatingList(input, list, data, onPick) {
  if (!input || !list) return;

  // Sécurise la source de données
  const dataset =
    Array.isArray(data) ? data :
    (input === typeDropdown ? getRawTypes() : getRawCauses());

  const items = Array.isArray(dataset) ? dataset : [];

  const searchValue = norm(input.value || '');
  list.innerHTML = '';

  let hasMatch = false;
  items.forEach(item => {
    if (norm(item).includes(searchValue)) {
      const li = document.createElement('li');
      li.textContent = item;

      li.addEventListener('click', () => {
        const txt = li.textContent.trim();
        if (!txt || txt === 'Aucun résultat') return;
        if (typeof onPick === 'function') onPick(item);
        else {
          input.value = item;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        list.style.display = 'none';
        queueMicrotask(() => {
          input.focus({ preventScroll: true });
          const len = input.value.length;
          try { input.setSelectionRange(len, len); } catch {}
        });
        updateLocalStorage();
      });

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

  wireListPointer(list, input, ({ text }) => {
    if (typeof onPick === 'function') onPick(text);
    else {
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    list.style.display = 'none';
    updateLocalStorage();
  });

  openOnly(list);
}


async function saveRecord() {
  const savedData = await getPrefixedItem(lieu);

  const listItem = document.querySelector('.active-chrono');
  const pauseResumeButton = listItem.querySelector('.modal-button[onclick="pauseResumeChrono()"]');

  if (isPaused === false) {
    isPaused = true;
    pauseStartTime = new Date().getTime();
    clearInterval(interval);
  }

  // --- UI courante
  const typeEl        = document.getElementById('typeDropdown');
  const causeEl       = document.getElementById('causeDropdown');
  const zoneTexteEl   = document.getElementById('zone-texte');
  const zonePiecesEl  = document.getElementById('zone-pieces');
  const arretEl       = document.getElementById('tempsArretsInput');

  const typeRaw    = (typeEl?.value ?? '').trim();
  const causeRaw   = (causeEl?.value ?? '').trim();
  const zoneText   = (zoneTexteEl?.value ?? '').trim();
  const piecesTxt  = (zonePiecesEl?.value ?? '').trim();
  const arretValue = (arretEl?.value ?? '').trim();

  // ★ 1) Remplacement automatique des '+' par le plein-chasse (U+FF0B)
  //    On ne modifie pas l'UI, seulement la valeur utilisée pour valider / sauvegarder.
  const zoneTextFixed = remplacerPlusUnicode(zoneText);

  // --- LISTES BRUTES Rais.js
  const rawFromRais =
    (typeof lieuData !== 'undefined' && lieuData) ? lieuData :
    (typeof window !== 'undefined' && window.lieuData ? window.lieuData : null);

  const allowedTypes  = Array.isArray(rawFromRais?.types)  ? rawFromRais.types  : [];
  const allowedCauses = Array.isArray(rawFromRais?.causes) ? rawFromRais.causes : [];

  // --- Canonisation Type/Cause (si listes dispo)
  const toCanonMap = (arr) => new Map(arr.map(x => [norm(x), x]));
  let typeCanon  = typeRaw;
  let causeCanon = causeRaw;

  if (allowedTypes.length) {
    const m = toCanonMap(allowedTypes);
    typeCanon = m.get(norm(typeRaw)) ?? '';
  }
  if (allowedCauses.length) {
    const m = toCanonMap(allowedCauses);
    causeCanon = m.get(norm(causeRaw)) ?? '';
  }

  // --- Reset styles d'erreur
  typeEl?.classList?.remove('input-invalid');
  causeEl?.classList?.remove('input-invalid');
  zoneTexteEl?.classList?.remove('input-invalid');

  const mustCheckType  = allowedTypes.length  > 0;
  const mustCheckCause = allowedCauses.length > 0;

  const badType  = mustCheckType  && !typeCanon;
  const badCause = mustCheckCause && !causeCanon;

  // --- Règles Résumé
  // ★ 2) On valide sur la version corrigée (zoneTextFixed) ; le '+' original n’entrera plus en conflit.
  const forbiddenChars = /[_&%#|;"]/; // _ & % # | ; " +
  const badResume = (zoneTextFixed === '') || forbiddenChars.test(zoneTextFixed);

  // --- Si erreur(s)
  if (badType || badCause || badResume) {
    if (badType)  { typeEl.value  = ''; typeEl.classList?.add('input-invalid'); }
    if (badCause) { causeEl.value = ''; causeEl.classList?.add('input-invalid'); }
    if (badResume){               zoneTexteEl.classList?.add('input-invalid'); } // on NE vide PAS le résumé

    const parts = [];
    if (badType)  parts.push('Type');
    if (badCause) parts.push('Cause');
    if (badResume)parts.push('Résumé');

    // Texte de statut
    let statusLabel = '';
    if (parts.length === 3) {
      statusLabel = parts.slice(0, -1).join(', ') + ' et ' + parts.slice(-1);
    } else {
      if (parts.length === 1) {
        statusLabel = 'Erreur ' + parts[0];
      } else if (parts.length === 2) {
        statusLabel = 'Erreur ' + parts.join(' et ');
      } else {
        statusLabel = 'Erreur ' + parts.slice(0, -1).join(', ') + ' et ' + parts.slice(-1);
      }
    }

    const alertLines = [];
    if (badType && badCause) alertLines.push('Type/Cause vide ou incorrect');
    else if (badType)        alertLines.push('Type vide ou incorrect');
    else if (badCause)       alertLines.push('Cause vide ou incorrect');

    if (badResume) {
      alertLines.push(
        'Résumé vide ou incorrect car :',
        '_  &  %  #  |  ;  "',
        'Innutilisable !'
      );
    }

    alert(alertLines.join('\n'));

    listItem.classList.add('STOP');
    document.querySelector('.chrono-status').textContent = statusLabel;
    document.querySelector('.chrono-status').style.color = 'white';
    pauseResumeButton.textContent = 'Reprendre';
    pauseResumeButton.style.backgroundColor = 'green';
    isPaused = true;
    pauseStartTime = new Date().getTime();
    clearInterval(interval);

    await setPrefixedItem(lieu, JSON.stringify({
      isPaused, startTime, pauseStartTime, totalPauseDuration, elapsedTime,
      // ★ 3) On persiste aussi la version corrigée
      texteZone: zoneTextFixed,
      piecesSortie: piecesTxt,
      type: typeEl.value,
      cause: causeEl.value,
      arret: arretValue
    }));
    return;
  }

  // --- OK : remettre la forme canonique si trouvée
  if (typeCanon)  typeEl.value  = typeCanon;
  if (causeCanon) causeEl.value = causeCanon;

  // --- Persistance avant construction de la ligne
  const chronoData = {
    isPaused,
    startTime,
    pauseStartTime,
    totalPauseDuration,
    elapsedTime,
    // ★ 4) Toujours stocker la version corrigée
    texteZone: zoneTextFixed,
    piecesSortie: piecesTxt,
    type: typeCanon,
    cause: causeCanon,
    arret: arretValue
  };
  await setPrefixedItem(lieu, JSON.stringify(chronoData));

  listItem.classList.add('STOP');
  document.querySelector('.chrono-status').textContent = 'Enregistrement…';
  document.querySelector('.chrono-status').style.color = 'white';
  pauseResumeButton.textContent = 'Reprendre';
  pauseResumeButton.style.backgroundColor = 'green';

  // --- Construction de la ligne à envoyer
  const tempsAffiche = document.getElementById('chrono').textContent;
  const currentDate  = new Date();
  const lieuSansCompteur = retirerSuffixeCompteur(lieu);
  const formattedDate = `${pad(currentDate.getDate())}/${pad(currentDate.getMonth() + 1)}/${currentDate.getFullYear()}`;

  // ★ 5) Enregistrement avec la version corrigée (et re-sécurité via ta fonction)
  const texteZoneNettoye = remplacerPlusUnicode(zoneTextFixed);

  const enregistrement = `${formattedDate} _ ${tempsAffiche} _ ${lieuSansCompteur} _ ${texteZoneNettoye} _ ${piecesTxt} _ ${typeCanon} _ ${causeCanon} _ ${arretValue}`;

  // --- Vérif temps > 2h
  if (elapsedTime > 2 * 60 * 60 * 1000) {
    const afftime = (elapsedTime / (60 * 60 * 1000)).toFixed(1);
    const confirmer = confirm("Le temps semble élevé : " + afftime + " h. OK pour continuer ?");
    if (!confirmer) {
      isPaused = true;
      pauseStartTime = new Date().getTime();
      clearInterval(interval);
      listItem.classList.add('STOP');
      document.querySelector('.chrono-status').textContent = 'Mis en attente';
      document.querySelector('.chrono-status').style.color = 'orange';
      pauseResumeButton.textContent = 'Reprendre';
      pauseResumeButton.style.backgroundColor = 'green';

      await setPrefixedItem(lieu, JSON.stringify({
        isPaused, startTime, pauseStartTime, totalPauseDuration, elapsedTime,
        texteZone: zoneTextFixed, piecesSortie: piecesTxt, type: typeCanon, cause: causeCanon, arret: arretValue
      }));
      return;
    }
  }

  // --- Envoi au parent + fermeture
  sendEventToParent('enregistrement', enregistrement);
  setTimeout(() => { sendEventToParent('fermer', lieu); }, 100);
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
      openOnly(list);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      input._navIndex = Math.max(0, input._navIndex - 1);
      setActiveItem(list, input._navIndex);
      openOnly(list);
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
     input.value = "";  
  } 
}

// TYPE
typeDropdown.addEventListener('input', () => {
  if (isExactIn(getRawTypes(), typeDropdown.value)) { closeAllLists(); return; }
  updateFloatingList(typeDropdown, typeListFix, getRawTypes());
  ensureVisibleForKeyboard(typeDropdown, typeListFix);
});
typeDropdown.addEventListener('blur', () => {
  if (isInteractingWithList) return;
  validateInputValue(typeDropdown, getRawTypes());
  setTimeout(() => { typeListFix.style.display = 'none'; }, 10);
});
typeDropdown.addEventListener('focus', () => {
  if (isExactIn(getRawTypes(), typeDropdown.value)) { closeAllLists(); return; }
  updateFloatingList(typeDropdown, typeListFix, getRawTypes());
  ensureVisibleForKeyboard(typeDropdown, typeListFix);
});
typeDropdown.addEventListener('click', () => {
  updateFloatingList(typeDropdown, typeListFix, getRawTypes());
  ensureVisibleForKeyboard(typeDropdown, typeListFix);
});

// CAUSE
causeDropdown.addEventListener('input', () => {
  if (isExactIn(getRawCauses(), causeDropdown.value)) { closeAllLists(); return; }
  updateFloatingList(causeDropdown, causeListFix, getRawCauses());
  ensureVisibleForKeyboard(causeDropdown, causeListFix);
});
causeDropdown.addEventListener('blur', () => {
  if (isInteractingWithList) return;
  validateInputValue(causeDropdown, getRawCauses());
  setTimeout(() => { causeListFix.style.display = 'none'; }, 10);
});
causeDropdown.addEventListener('focus', () => {
  if (isExactIn(getRawCauses(), causeDropdown.value)) { closeAllLists(); return; }
  updateFloatingList(causeDropdown, causeListFix, getRawCauses()); // ← pas "cause" !
  ensureVisibleForKeyboard(causeDropdown, causeListFix);
});
causeDropdown.addEventListener('click', () => {
  updateFloatingList(causeDropdown, causeListFix, getRawCauses());
  ensureVisibleForKeyboard(causeDropdown, causeListFix);
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

// --- helpers mini “shield” (bloque les clics de fond quelques ms) ---
function addShield() {
  const s = document.createElement('div');
  s.id = 'ghost-shield';
  s.style.position = 'fixed';
  s.style.inset = '0';
  s.style.zIndex = '2147483646';   // juste sous ta liste (qui est à 2147483647)
  s.style.background = 'transparent';
  s.style.pointerEvents = 'auto';  // capture tout
  document.body.appendChild(s);
  return s;
}
function removeShield() {
  document.getElementById('ghost-shield')?.remove();
}

// --- wireListPointer avec shield intégré ---
function wireListPointer(list, input, onPick) {
  if (!list || list._wired) return;
  list._wired = true;

  // Toujours au-dessus et “cliquable”
  list.style.position = list.style.position || 'absolute';
  list.style.zIndex = list.style.zIndex || '2147483647';
  list.style.pointerEvents = 'auto';
  list.style.touchAction = 'manipulation';

  const THRESHOLD = 6;
  let press = null;
  let dragging = false;
  let startY = 0;
  let startScrollTop = 0;
  let cancelNextClick = false;

  // util: si on clique sur la barre de scroll, laisser le natif
  function isOverScrollbarY(el, e){
    const r = el.getBoundingClientRect();
    const w = el.offsetWidth - el.clientWidth; // largeur scroll vertical
    if (w <= 0) return false;
    return (e.clientX >= r.right - w - 1);
  }

  const onPointerDown = (e) => {
    // garder le natif si on clique la barre de scroll
    if (isOverScrollbarY(list, e)) return;
    if (e.button !== 0) return; // gauche uniquement

    // cible robuste même si textNode
    const target = e.target && e.target.nodeType === 1 ? e.target : e.target?.parentElement;
    const li = target?.closest('li');
    if (!li) return;

    isInteractingWithList = true;
    press = { x: e.clientX ?? 0, y: e.clientY ?? 0, startItem: li, moved: false };

    // ⚠️ NE PAS preventDefault ici → permet le clic simple souris
    dragging = false; // on n’active le drag qu’après THRESHOLD
  };

  const onPointerMove = (e) => {
    if (!press) return;

    const dx = Math.abs((e.clientX ?? 0) - press.x);
    const dy = Math.abs((e.clientY ?? 0) - press.y);
    if (dx > THRESHOLD || dy > THRESHOLD) {
      press.moved = true;

      if (!dragging) {
        // on démarre le drag maintenant
        dragging = true;
        startY = e.clientY ?? 0;
        startScrollTop = list.scrollTop;
        try { list.setPointerCapture?.(e.pointerId); } catch {}
        list.classList.add('is-dragging');
        // éviter sélection de texte pendant le drag
        list._prevUserSelect = list.style.userSelect;
        list.style.userSelect = 'none';
      }
    }

    if (dragging) {
      const currentY = e.clientY ?? 0;
      list.scrollTop = startScrollTop + (startY - currentY);

      // edge autoscroll (optionnel)
      const r = list.getBoundingClientRect();
      const margin = 24;
      if (currentY < r.top + margin)    list.scrollTop -= 8;
      if (currentY > r.bottom - margin) list.scrollTop += 8;

      e.preventDefault(); // uniquement pendant le drag
    }
  };

  const onPointerUp = (e) => {
    const p = press;
    press = null;

    if (dragging) {
      dragging = false;
      list.classList.remove('is-dragging');
      try { list.releasePointerCapture?.(e.pointerId); } catch {}
      list.style.userSelect = list._prevUserSelect ?? '';
      list._prevUserSelect = undefined;
    }

    // relâcher le flag après le cycle (évite blur/fermeture)
    setTimeout(() => { isInteractingWithList = false; }, 0);

    if (!p) return;

    if (p.moved) {
      // on a glissé → annuler le clic natif qui suivrait
      cancelNextClick = true;
      e.preventDefault();
      return;
    }

    // clic simple → sélectionne l'item
    const txt = p.startItem.textContent.trim();
    if (!txt || txt === 'Aucun résultat') return;

    if (typeof onPick === 'function') onPick({ text: txt, el: p.startItem, event: e });
    else {
      input.value = txt;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // --- MINI SHIELD : bloque les clics de fond le temps de fermer proprement
    const shield = addShield();
    setTimeout(() => {
      list.style.display = 'none';   // ferme sans risquer un click-through
      removeShield();
    }, 80); // 50–120 ms suffisent, inutile d'aller à 500

    queueMicrotask(() => {
      input.focus({ preventScroll: true });
      const len = input.value.length;
      try { input.setSelectionRange(len, len); } catch {}
    });

    updateLocalStorage();
    // pas de preventDefault ici: clic traité proprement
  };

  const onClickCapture = (e) => {
    if (cancelNextClick) {
      cancelNextClick = false;
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const onWheel = (e) => {
    // laisse scroller la liste, mais ne propage pas au parent
    e.stopPropagation();
  };

  list.addEventListener('pointerdown', onPointerDown, { passive: true });
  list.addEventListener('pointermove', onPointerMove, { passive: false });
  list.addEventListener('pointerup',   onPointerUp,   { passive: false });
  list.addEventListener('pointercancel', () => {
    press = null;
    if (dragging) {
      dragging = false;
      list.classList.remove('is-dragging');
      list.style.userSelect = list._prevUserSelect ?? '';
      list._prevUserSelect = undefined;
    }
    isInteractingWithList = false;
  }, { passive: true });

  list.addEventListener('click', onClickCapture, true);
  list.addEventListener('wheel', onWheel, { passive: true });
}


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

case 'removeallcontent': {
  const ok = confirm(
    "Confirmez la remise à zéro ?"

  );
  if (!ok) break;

  await resetIframeContent();
  break;
}


    }
});

function updateCapsules() {
  const textarea  = document.getElementById('zone-pieces');
  const container = document.getElementById('capsules-container');
  if (!container) return;

  container.innerHTML = '';

  const content = (textarea?.value || '').trim();
  if (!content) return;

  // pièces séparées par des virgules
  content
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .forEach(rawItem => {
      // Nettoyage de base
      let token = rawItem.replace(/^[\[\(]\s*|\s*[\]\)]$/g, '');

      // Découpe place (après @) / avant @
      const atPos  = token.lastIndexOf('@');
      const before = atPos >= 0 ? token.slice(0, atPos).trim() : token;
      let place    = atPos >= 0 ? token.slice(atPos + 1).trim() : '';

      // Quantité : Q=... ou ref:qty
      let qty = null;
      const qMatch = before.match(/Q\s*=\s*([0-9]+(?:[.,][0-9]+)?)/i);
      if (qMatch) qty = qMatch[1].replace(',', '.');

      if (!qty) {
        const parts = before.split(':');
        if (parts.length === 2 && /^\s*[0-9]+(?:[.,][0-9]+)?\s*$/.test(parts[1])) {
          qty = parts[1].trim().replace(',', '.');
        }
      }

      // Si pas de @, on affiche la partie "identifiant" en place
      if (!place) {
        const idPart = before.includes(':') ? before.split(':')[0] : before;
        place = idPart.trim();
      }

      if (!place) return;

      // ✅ capsule stylée (voir createPrettyCapsule fourni plus haut)
      const capsule = createPrettyCapsule(place, qty);
      container.appendChild(capsule);
    });
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


/* --- config --- */
const FORBIDDEN = ["Annuler","Reprendre","Enregistrer"];

function norm(s){
  return (s ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"") // accents
    .replace(/[\u2019\u2018\u02BC]/g, "'")           // ’ ‘ ʼ -> '
    .replace(/\p{Zs}+/gu, " ")                        // espaces Unicode -> espace
    .replace(/\s+/g," ")                              // compacter
    .trim()
    .toLowerCase();
}

function getListArray(selectorOrUl, arr){
  if (Array.isArray(arr) && arr.length) return arr.slice();

  const root = document.querySelector(selectorOrUl);
  if (!root) {
    console.warn('[canon] getListArray: rien trouvé pour', selectorOrUl);
    return [];
  }

  // <ul><li>...</li></ul>
  const lis = root.matches('ul') ? root.querySelectorAll('li') : root.querySelectorAll('ul li');
  if (lis.length){
    return Array.from(lis).map(li => li.textContent.trim()).filter(Boolean);
  }

  // <datalist><option value="..."></datalist>
  const optionsInDataList = root.matches('datalist') ? root.querySelectorAll('option') : root.querySelectorAll('datalist option');
  if (optionsInDataList.length){
    return Array.from(optionsInDataList).map(o => (o.getAttribute('value') ?? o.textContent).trim()).filter(Boolean);
  }

  // <select><option>...</option></select>
  const optionsInSelect = root.matches('select') ? root.querySelectorAll('option') : root.querySelectorAll('select option');
  if (optionsInSelect.length){
    return Array.from(optionsInSelect).map(o => (o.getAttribute('value') ?? o.textContent).trim()).filter(Boolean);
  }

  console.warn('[canon] getListArray: pas d’items dans', selectorOrUl);
  return [];
}


// construit une table norm -> forme canonique
function makeCanonMap(items){
  const map = new Map();
  items.forEach(it => map.set(norm(it), it));
  return map;
}

// Normalisation robuste : accents, espaces Unicode, apostrophes typographiques

function attachImmediateCanonicalize(input, items){
  if (!input) return;

  // Map norm -> forme canonique
  const canon = new Map(items.map(it => [norm(it), it]));

  input.addEventListener('input', () => {
    const v  = input.value ?? "";
    const vn = norm(v);

    // 1) filtre des mots interdits
    if (FORBIDDEN.some(w => vn.includes(norm(w)))){
      input.value = "";
      input.setSelectionRange?.(0, 0);
      return;
    }

    // 2) si tout le champ correspond -> remplacer immédiatement
    const exact = canon.get(vn);
    if (exact && v !== exact){
      input.value = exact;
      input.setSelectionRange?.(exact.length, exact.length);
      return;
    }

    // 3) sinon on corrige près du caret : groupes de tokens (2..4) puis 1 token
    const caret = input.selectionStart ?? v.length;

    // tokens = séquences de lettres/chiffres + . - ' (ASCII) + ’ (typographique)
    const re = /[\p{L}\p{N}.\-'\u2019]+/gu;
    const tokens = [...v.matchAll(re)].map(m => ({
      text: m[0],
      start: m.index,
      end: m.index + m[0].length
    }));
    if (!tokens.length) return;

    // token qui couvre le caret, sinon le dernier avant
    let endIdx = tokens.findIndex(t => caret >= t.start && caret <= t.end);
    if (endIdx === -1){
      endIdx = tokens.findLastIndex(t => t.end <= caret);
      if (endIdx === -1) endIdx = tokens.length - 1;
    }

    // Essayer des groupes (jusqu'à 4 tokens) finissant sur endIdx
    const MAX_GROUP = 4;
    for (let size = Math.min(MAX_GROUP, endIdx + 1); size >= 2; size--){
      const startIdx = endIdx - size + 1;
      const start = tokens[startIdx].start;
      const end   = tokens[endIdx].end;
      const slice = v.slice(start, end);
      const nslice = norm(slice);
      const repl = canon.get(nslice);
      if (repl){
        const newValue = v.slice(0, start) + repl + v.slice(end);
        input.value = newValue;
        const newCaret = start + repl.length;
        input.setSelectionRange?.(newCaret, newCaret);
        return;
      }
    }

    // 4) sinon, tenter 1 seul token (mot courant)
    const chosen = tokens[endIdx];
    const repl1 = canon.get(norm(chosen.text));
    if (repl1 && repl1 !== chosen.text){
      const newValue = v.slice(0, chosen.start) + repl1 + v.slice(chosen.end);
      input.value = newValue;
      const newCaret = chosen.start + repl1.length;
      input.setSelectionRange?.(newCaret, newCaret);
    }
  });

  // Pour IME/accents : relancer après composition
  input.addEventListener('compositionend', () => {
    input.dispatchEvent(new Event('input'));
  });
}

(function(){
  function initOnce(){
    const typeEl  = document.getElementById('typeDropdown');
    const causeEl = document.getElementById('causeDropdown');

const types  = getListArray('#typeListFix',  window.lieuData?.types ?? (typeof lieuData !== 'undefined' ? lieuData.types  : undefined));
const causes = getListArray('#causeListFix', window.lieuData?.causes ?? (typeof lieuData !== 'undefined' ? lieuData.causes : undefined));


    attachImmediateCanonicalize(typeEl,  types);
    attachImmediateCanonicalize(causeEl, causes);

    // si vide, retente brièvement (cas d’injection tardive)
    if (types.length === 0 || causes.length === 0){
      setTimeout(() => {
        const t2 = getListArray('#typeListFix',  window.lieuData?.types);
        const c2 = getListArray('#causeListFix', window.lieuData?.causes);
        if (t2.length || c2.length){
          console.log('[canon] ré-init car listes trouvées plus tard', { t2: t2.length, c2: c2.length });
          attachImmediateCanonicalize(typeEl,  t2);
          attachImmediateCanonicalize(causeEl, c2);
        }
      }, 300);
    }
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initOnce);
  } else {
    initOnce();
  }
})();



const PRESS_MOVE_THRESHOLD = 6;    // px de tolérance


let isInteractingWithList = false;



const DROPDOWN_LISTS = [typeListFix, causeListFix]; let openListRef = null;

function openOnly(list) { if (!list) return; closeAllLists(list); list.style.display = 'block'; openListRef = list; }

function closeAllLists(except = null) { DROPDOWN_LISTS.forEach(l => { if (l && l !== except) l.style.display = 'none'; }); if (!except) openListRef = null; }


// --- helpers : lis directement les données brutes du fichier Rais.js ---
function getRawTypes() {
  // si Rais.js a bien défini const lieuData = { types:[...], causes:[...] }
  // (top-level const est visible par nom, mais pas en window.lieuData)
  try {
    if (typeof lieuData !== 'undefined' && Array.isArray(lieuData.types)) {
      return lieuData.types;
    }
  } catch {}
  // FALLBACK (optionnel) si jamais Rais.js n'est pas chargé
  return ["Aiguillage","Alarme","ZZ.Type"];
}
function getRawCauses() {
  try {
    if (typeof lieuData !== 'undefined' && Array.isArray(lieuData.causes)) {
      return lieuData.causes;
    }
  } catch {}
  return ["Aiguillage","Arrêt d'urgence","Automatisme","ZZ.Cause"];
}



// ——— utils existants ———
const FORBIDDEN_CHARS_RE = /[_&%#|;"]/g;
function esc(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function highlightForbiddenHTML(text){
  if (!text) return "";
  let out = "", last = 0, m;
  FORBIDDEN_CHARS_RE.lastIndex = 0;
  while ((m = FORBIDDEN_CHARS_RE.exec(text))){
    const i = m.index;
    out += esc(text.slice(last, i));
    out += `<span class="bad">${esc(m[0])}</span>`;
    last = i + m[0].length;
  }
  out += esc(text.slice(last));
  return out;
}

// ——— NEW: copie métriques (appelée souvent) ———
function copyMetrics(textarea, mirror){
  const cs = getComputedStyle(textarea);
  mirror.style.font          = cs.font;
  mirror.style.lineHeight    = cs.lineHeight;
  mirror.style.letterSpacing = cs.letterSpacing;

  mirror.style.padding      = cs.padding;
  mirror.style.borderRadius = cs.borderRadius;

  mirror.style.width  = cs.width === 'auto' ? `${textarea.clientWidth}px` : cs.width;
  mirror.style.height = cs.height === 'auto' ? `${textarea.clientHeight}px` : cs.height;
  mirror.style.boxSizing = cs.boxSizing;

  // NEW: couleurs
  mirror.style.color = cs.color;
  // on garde background transparent pour superposer proprement
}


function attachForbiddenHighlighter(textarea, { rearm = false } = {}) {
  if (!textarea) return;

  // créer une structure de gestion si absente
  if (!textarea._hl) {
    textarea._hl = {
      mounted: false,
      enabled: false,
      sync: () => {},
      mirror: null,
      ro: null,
      mo: null
    };
  }
  const hl = textarea._hl;

  if (!hl.mounted) {
    const wrap = document.createElement('div');
    wrap.className = 'highlight-wrap';

    const mirror = document.createElement('div');
    mirror.className = 'highlight-mirror';
    hl.mirror = mirror;

    // insertion dans le DOM
    textarea.parentNode.insertBefore(wrap, textarea);
    wrap.appendChild(mirror);
    textarea.classList.add('highlight-target');
    wrap.appendChild(textarea);

    // fonction de sync
    hl.sync = () => {
      copyMetrics(textarea, mirror);
      const t = textarea.value;
      mirror.innerHTML = hl.enabled
        ? highlightForbiddenHTML(t) + (t.endsWith("\n") ? " " : "")
        : esc(t) + (t.endsWith("\n") ? " " : "");
      mirror.scrollTop = textarea.scrollTop;
      mirror.scrollLeft = textarea.scrollLeft;
    };

    // écouteurs
    let composing = false;
    textarea.addEventListener('compositionstart', () => (composing = true));
    textarea.addEventListener('compositionend', () => {
      composing = false;
      hl.sync();
    });
    textarea.addEventListener('input', () => {
      if (!composing) hl.sync();
    });
    textarea.addEventListener('scroll', () => {
      mirror.scrollTop = textarea.scrollTop;
      mirror.scrollLeft = textarea.scrollLeft;
    });

    // resize observer
    hl.ro = new ResizeObserver(() => hl.sync());
    hl.ro.observe(textarea);

    // mutation observer (si changement de classes globales)
    hl.mo = new MutationObserver(() => hl.sync());
    hl.mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    hl.mounted = true;
  } else if (!rearm) {
    return;
  }

  // activer directement le highlight
  hl.enabled = true;
  hl.sync();
}


function isExactIn(arr, v) {
  const nv = norm(v);
  return arr.some(x => norm(x) === nv);
}

/* ========= PATCH HIGHLIGHT – À COLLER TOUT EN BAS ========= */



// 2) Sécuriser les deux boutons qui plantaient si absents au moment du bind
document.getElementById('clearTypeBtn')?.addEventListener('click', () => {
  const el = document.getElementById('typeDropdown');
  if (el) el.value = '';
  (typeof updateLocalStorage === 'function') && updateLocalStorage();
});
document.getElementById('clearCauseBtn')?.addEventListener('click', () => {
  const el = document.getElementById('causeDropdown');
  if (el) el.value = '';
  (typeof updateLocalStorage === 'function') && updateLocalStorage();
});

// 3) Boot une fois le DOM prêt : montage du surlignage + sync
(function bootHighlight(){
  async function start() {
    try { await (typeof ChargTheme === 'function' ? ChargTheme() : Promise.resolve()); } catch {}

    const ta = document.getElementById('zone-texte');
    if (!ta) { console.error('[highlight] #zone-texte introuvable'); return; }

    if (typeof attachForbiddenHighlighter === 'function') {
      attachForbiddenHighlighter(ta);           // active direct (ta version l’active sans timer)
      ta._hl && (ta._hl.enabled = true, ta._hl.sync());
    } else {
      console.error('[highlight] attachForbiddenHighlighter indisponible');
    }

    // Si le texte change (restauration, saisie…), on resynchronise l’overlay
    ta.addEventListener('input', () => ta._hl?.sync());
    // Si des scripts externes modifient la valeur sans évènement, on force de temps en temps:
    setTimeout(() => ta._hl?.sync(), 50);
    setTimeout(() => ta._hl?.sync(), 250);
    setTimeout(() => ta._hl?.sync(), 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();


async function resetIframeContent() {
  // 1) Couper le chrono en cours
  try { clearInterval(interval); } catch {}
  
  // 2) Vider les champs
  try {
    const zoneTexteEl  = document.getElementById('zone-texte');
    const zonePiecesEl = document.getElementById('zone-pieces');
    const typeEl       = document.getElementById('typeDropdown');
    const causeEl      = document.getElementById('causeDropdown');
    const arretEl      = document.getElementById('tempsArretsInput');

    if (zoneTexteEl)  zoneTexteEl.value  = '';
    if (zonePiecesEl) zonePiecesEl.value = '';
    if (typeEl)       typeEl.value       = '';
    if (causeEl)      causeEl.value      = '';
    if (arretEl)      arretEl.value      = '';

    // Capsules visuelles
    try { updateCapsules(); } catch {}
  } catch (e) {
    console.warn('reset: champs', e);
  }

  // 3) Remettre le chrono à zéro (état + affichage + redémarrage)
  try {
    isPaused = false;
    const now = Date.now();
    startTime = now;
    pauseStartTime = 0;
    totalPauseDuration = 0;
    elapsedTime = 0;
    displayTime(0);
    interval = setInterval(updateChrono, 1000);
  } catch (e) {
    console.warn('reset: chrono', e);
  }

  // 4) UI (boutons/états)
  try {
    const listItem = document.querySelector('.active-chrono');
    const pauseResumeButton = listItem?.querySelector('.modal-button[onclick="pauseResumeChrono()"]');
    const status = document.querySelector('.chrono-status');

    listItem?.classList?.remove('paused', 'STOP');
    if (status) {
      status.textContent = 'En cours';
      status.style.color = 'limegreen';
    }
    if (pauseResumeButton) {
      pauseResumeButton.textContent = 'Pause';
      pauseResumeButton.style.backgroundColor = 'yellow';
    }
  } catch (e) {
    console.warn('reset: UI', e);
  }

  // 5) Persister l’état « vierge » pour cette iframe
  try {
    const chronoData = {
      isPaused,
      startTime,
      pauseStartTime,
      totalPauseDuration,
      elapsedTime,
      texteZone: '',
      piecesSortie: '',
      type: '',
      cause: '',
      arret: '0'
    };
    await setPrefixedItem(lieu, JSON.stringify(chronoData));
  } catch (e) {
    console.warn('reset: storage', e);
  }
}

function enablePieces(){
  const enabled = localStorage.getItem('DEV_PIECES') === 'true';
  const row   = document.getElementById('pieces-row');
  const label = document.getElementById('label-pieces');

  if (row && label){
    row.style.display = enabled ? '' : 'none';
       // cache/affiche la ligne (capsules + bouton)
    label.style.display = enabled ? 'inline-block' : 'none';
  }
}
