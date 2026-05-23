const THEMES = {
    // --- TES ANCIENS THÈMES (Inchangés) ---
    'bleu': { 
        tabInactive: '#002b56', tabActive: '#0056b3', btnStandard: '#3498db', 
        btnFolder: '#7599B0', btnDupe: '#752ed3', btnPiece: '#C0D008', 
        btnWarn: '#DD5500', btnGreen: 'green', btnRed: 'red'
    },
    'rouge': {
        tabInactive: '#560000', tabActive: '#b30000', btnStandard: '#c0392b',
        btnFolder: '#b07575', btnDupe: '#752ed3', btnPiece: '#C0D008',
        btnWarn: '#2c3e50', btnGreen: 'green', btnRed: '#000000'
    },
    'vert': {
        tabInactive: '#004d26', tabActive: '#008f39', btnStandard: '#27ae60',
        btnFolder: '#75b08a', btnDupe: '#752ed3', btnPiece: '#C0D008',
        btnWarn: '#d35400', btnGreen: '#0056b3', btnRed: 'red'
    },
    'orange': {
        tabInactive: '#5e3000', tabActive: '#d35400', btnStandard: '#e67e22',
        btnFolder: '#b09b75', btnDupe: '#752ed3', btnPiece: '#2980b9',
        btnWarn: '#2c3e50', btnGreen: 'green', btnRed: 'red'
    },
    'violet': {
        tabInactive: '#2c0056', tabActive: '#6c00b3', btnStandard: '#8e44ad',
        btnFolder: '#9575b0', btnDupe: '#2980b9', btnPiece: '#C0D008',
        btnWarn: '#ff9f43', btnGreen: 'green', btnRed: 'red'
    },

    // --- VERSIONS CORRIGÉES (Moins saturées) ---

    'rose': { // Vieux Rose / Mauve (Plus classe, moins agressif)
        tabInactive: '#4a1c2a', tabActive: '#ad1457', btnStandard: '#bc4b6e', 
        btnFolder: '#d88c9a', btnDupe: '#6a1b9a', btnPiece: '#C0D008', 
        btnWarn: '#2c3e50', btnGreen: 'green', btnRed: '#880e4f'
    },
    'turquoise': { // Bleu Canard / Teal (Plus profond)
        tabInactive: '#00363a', tabActive: '#00838f', btnStandard: '#00897b', 
        btnFolder: '#4db6ac', btnDupe: '#5e35b1', btnPiece: '#C0D008', 
        btnWarn: '#c62828', btnGreen: '#283593', btnRed: '#c62828'
    },
    'jaune': { // Ocre / Moutarde (Plus lisible)
        tabInactive: '#5c4002', tabActive: '#f57f17', btnStandard: '#dda118', 
        btnFolder: '#ffe082', btnDupe: '#2e7d32', btnPiece: '#2980b9', // Bleu ici car #C0D008 est invisible sur du jaune
        btnWarn: '#d84315', btnGreen: 'green', btnRed: '#c62828'
    },
    'choco': { // Remplacement du Gris par un ton Café/Bois
        tabInactive: '#3e2723', tabActive: '#6d4c41', btnStandard: '#8d6e63', 
        btnFolder: '#d7ccc8', btnDupe: '#5e35b1', btnPiece: '#C0D008', 
        btnWarn: '#d84315', btnGreen: 'green', btnRed: '#b71c1c'
    }
};

async function changerCouleurnew(nomThemeForce = null) {
    let nomTheme;

    // 1. CAS : Clic utilisateur (On force le thème et on sauvegarde)
    if (nomThemeForce) {
        nomTheme = nomThemeForce;
        // On sauvegarde proprement en JSON pour rester cohérent
        await setPrefixedItem('couleur', JSON.stringify(nomTheme));
    } 
    // 2. CAS : Démarrage (On récupère la sauvegarde)
    else {
        const rawTheme = await getPrefixedItem('couleur');

        // --- TON BLOC DE NETTOYAGE ---
        try {
            nomTheme = JSON.parse(rawTheme);
        } catch {
            // Si ce n'est pas du JSON valide, on prend la valeur brute
            nomTheme = rawTheme;
        }
    }

    // 3. CAS : Sécurité (Si rien trouvé ou thème inconnu dans la liste -> Bleu)
    if (!nomTheme || !THEMES[nomTheme]) {
        nomTheme = 'bleu';
    }

    // --- APPLICATION DU THEME (CSS) ---
    const MA_PALETTE = THEMES[nomTheme];

    let styleTag = document.getElementById('style-palette-perso');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'style-palette-perso';
        document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
        /* --- ONGLETS --- */
        .tab-button, .tab-button_z, .tab-button_u {
            background-color: ${MA_PALETTE.tabInactive}; color: #fff;
        }
        .tab-button.active, .tab-button_u.active, .tab-button_z.active {
            background-color: ${MA_PALETTE.tabActive};
        }

        /* --- BOUTONS --- */
        .options-menu, button {
            background-color: ${MA_PALETTE.btnStandard}; color: #fff; border: none;
        }
        .lieux-list li:not(:has(ul)) {
    border-left: 5px solid ${MA_PALETTE.btnStandard};
}
.note-tab-button.active{
            background-color: ${MA_PALETTE.tabActive};


}
        .note-tab-button{
            background-color: ${MA_PALETTE.tabInactive};

        
}
        /* --- EXCEPTIONS --- */
        #ChronoButton.active[annim="false"] { background: ${MA_PALETTE.tabActive}; }
        .lieux-list li:has(ul) > .place-card button[id^="lancer-chrono-btn"] { background-color: ${MA_PALETTE.btnFolder}; }
        .button-dupliquer { background-color: ${MA_PALETTE.btnDupe}; }
        .add-piece-btn { background: ${MA_PALETTE.btnPiece}; }
        .titre-lieu button[id^="clear-btn-"] { background-color: ${MA_PALETTE.btnWarn}; }
        .button-container button { background-color: ${MA_PALETTE.btnGreen}; }

        /* --- VALIDATION & SUPPRESSION --- */
        .add-tab-button, #ajouterTechnicienButton { background-color: ${MA_PALETTE.btnGreen}; }
        .button-tech, .button-wrapper button, button.non-cliquable, #enregistrerModifications {
            background-color: ${MA_PALETTE.btnGreen} !important;
        }
        .button-supprimer { background-color: ${MA_PALETTE.btnRed} !important; }
    `;

}

async function changerCouleur() {


}
function loadPageInIframe(url) {
    var iframe = document.getElementById("TUTORIEL");
    if (iframe) {
        iframe.src = url;
    } else {
        console.error("L'iframe TUTORIEL n'existe pas dans le DOM.");
    }
}

// Fonction pour gérer le changement d'état du bouton de cookie


// Fonction pour ouvrir le site web


// Vérifie si c'est la première visite
async function checkFirstVisit() {

    const firstVisit = await getPrefixedItem('Notification');

    await updateButtonStyles();


    if (!firstVisit) {

setTimeout(() => {

    showModal();
}, 300);



    }
}


function showModal() {
    var overlay = document.getElementById("overlay");
    var modal = document.getElementById("tutorialModaltuto");
    var iframe = document.getElementById("tutorialIframe");

    loadModalContent("tutorialModaltuto", "../Work/changelog.json");

    if (!iframe) {
        console.warn("❌ Iframe 'tutorialIframe' introuvable.");
        return;
    }

    if (!iframe.src || iframe.src === window.location.href) {
        iframe.src = "../Ressources/tuto/index.html";
    } else {
        iframe.src = "../Ressources/tuto/index.html";
    }

    iframe.style.display = "block";
    if (overlay) overlay.style.display = "block";
    if (modal) modal.style.display = "block"; 


        changerCouleur();

}

// 💡 La fonction de génération de date/temps est correcte, pas besoin de la modifier.
function genererDateEtTempsAleatoire() {
    const aujourdhui = new Date();
    const jour = String(aujourdhui.getDate()).padStart(2, '0');
    const mois = String(aujourdhui.getMonth() + 1).padStart(2, '0'); 
    const annee = aujourdhui.getFullYear();

    const dateFormatee = `${jour}/${mois}/${annee}`;

    const minMinutes = 10;
    const maxMinutes = 50;
    const minutesAleatoires = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;

    const secondesAleatoires = Math.floor(Math.random() * 60);
    const secondesFormatees = String(secondesAleatoires).padStart(2, '0') + 's';
    
    const tempsFormate = `${minutesAleatoires}m ${secondesFormatees}`;
    
    return `${dateFormatee} _ ${tempsFormate}`;
}



async function openWebsite() {
    
    // 1. Initialisation des données d'enregistrement
    const enregistrementsData = await getPrefixedItem('enregistrements');
    // On initialise enregistrements directement avec les données ou un tableau vide
    let enregistrements = JSON.parse(enregistrementsData || '[]'); // ✨ Correction de la portée/initialisation

    // 2. Génération de la date et du temps aléatoire
    const dateTempsPersonnalise = genererDateEtTempsAleatoire();

    // 3. Création de la nouvelle entrée et ajout au tableau
    // J'ai présumé que la fonction `ajouterInformationsSupplementaires` est disponible.
    // Si elle n'est pas disponible, retirez-la.
    const nouvelleEntree = ajouterInformationsSupplementaires(
        `${dateTempsPersonnalise} _ Lieux d'intervention _ ici et sauvegarder le contenu de l'intervention, tout y et modifiable _ [202402010001:1@Pièces] _ Alarme _ Autre _ 00:00`
    );
    enregistrements.push(nouvelleEntree);
    
    // 4. Sauvegarde des données mises à jour
    await setPrefixedItem('enregistrements', JSON.stringify(enregistrements));

    // --- Reste du code de la fonction openWebsite (Affichage UI) ---
    
    relancer("Démo G-MAPP","23m52s",'type de panne','cause de panne',"résumer d'intervention thechique, crée en une nouvelle via 'Ajouter' en haut","[202402010001:1@Pièces]","");

    // Affecte l'URL à l'iframe dans la modal
    var modal = document.getElementById("tutorialModaltuto");
    var iframe = modal.querySelector("iframe");
    if (iframe) {
        iframe.src = "Ressources/tuto/index.html";
    }

    // Cache la modal
    var overlay = document.getElementById("overlay");
    overlay.style.display = "none";
    modal.style.display = "none";

    const notifButton = document.getElementById('NotifButton');
    if (notifButton) {
        notifButton.style.display = 'none';
    }
}


// Lorsque le bouton "Open Website" est cliqué
async function fermerModalTuto() {
   await openWebsite();


}

// Exécuter la vérification de première visite au chargement de la page


// Vérifie l'état de la case à cocher au chargement de la page
function toggleDeveloppeur() {
    var developpeurSection = document.getElementById('developpeur');
    var toggleButton = document.getElementById('toggleDeveloppeur');

    if (developpeurSection.style.display === "none") {
        developpeurSection.style.display = "block";
        toggleButton.textContent = "Masquer les obtions"; // Change le bouton pour indiquer "fermer"
    } else {
        developpeurSection.style.display = "none";
        toggleButton.textContent = "Afficher les obtions"; // Change le bouton pour indiquer "ouvrir"
    }
}



function errorr(){

        const tabElement = document.getElementById('interventions' + "Tab");
    if (tabElement) {
        tabElement.style.display = "block";
    }



  const enregistrements = document.getElementById("enregistrements");
  if (enregistrements) {
    // Calcule la nouvelle hauteur en soustrayant 130 pixels de la hauteur de la fenêtre
    enregistrements.style.height = "auto";
       enregistrements.style.marginTop = "5px";
      enregistrements.style.backgroundColor = "LightCoral"; // ou une couleur valide
  }
  const containers = document.getElementsByClassName("container");
  if (containers.length > 0) {
    const newHeight = window.innerHeight - 10;
    Array.from(containers).forEach(container => {
      container.style.height = newHeight + "px";
         container.style.backgroundColor = "MistyRose"; // ou une couleur valide

    });
  }

            document.getElementById('enregistrements').innerHTML = `
                <p>Une erreur s'est produite, merci de vous reconnecter.</p>
                <button onclick="window.location.href='../index.html'">Reconnecter</button>
            `;
      const visuTab = document.getElementById("visuTab");
      if (visuTab) visuTab.style.display = "block";
        // Liste des éléments à supprimer
        const elementsToRemove = [
            ...document.getElementsByClassName('buttons-container'),
            ...document.getElementsByClassName('modal-content-tuto'),
            ...document.getElementsByClassName('tab'),
            document.getElementById('creerTab'),
            document.getElementById('ChronoTab'),
            document.getElementById('parametresTab'),
            document.getElementById('tutorialModal'),
            document.getElementById('tutorialModaltuto'),
            document.querySelector("button[onclick='exportServ()']"),

            document.getElementById('viewport'),
            document.getElementById('refresh-warning'),
            document.getElementById('cameraTab'),
            document.getElementById('modifierPieceModal'),
            document.getElementById('scannerModal'),
            document.getElementById("overlay"),
            document.getElementById("debugOverlay"),

            document.getElementById('addNoteModal'),
            document.getElementById('NoteTab'),
            document.getElementById('dataModal'),
            document.getElementById("modalPreconf"),
            document.getElementById("modalChrono")
        ];

        elementsToRemove.forEach(element => {
            if (element) element.remove();
        });

document.querySelectorAll("script").forEach(script => {
    script.remove();
});

}
function getUsernameFromUrl() {
    // Extraction de l'utilisateur à partir de l'URL et décodage des caractères encodés en URL (ex: %20 pour espace)
    const urlParams = new URLSearchParams(window.location.search);

    const user = urlParams.get('user');

    return user ? decodeURIComponent(user) : null; // Décodage des caractères encodés


}
function getinterFromUrl(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param) ? decodeURIComponent(urlParams.get(param)) : null;
}


async function displayUsernameAndLogout() {
    const username = getUsernameFromUrl();
    const interAc = getinterFromUrl('i');
    const decodedparamP = getinterFromUrl('p');
    const Export = getinterFromUrl('Export');
    const arch = getinterFromUrl('arch');
const paramF = getinterFromUrl('f');


    const timeParam = getinterFromUrl('time');



if (timeParam) {
  await setPrefixedItem('lastLoginTime', JSON.stringify(timeParam));
  console.log("Nouvelle connexion : " + timeParam);
} else {
  let actutime;

  try {
    actutime = JSON.parse(await getPrefixedItem('lastLoginTime'));
  } catch {
    actutime = await getPrefixedItem('lastLoginTime');
  }

  console.log("Dernière connexion : " + actutime);
}




if (paramF) {
    const cleanedF = nettoyerNomLieu(paramF); // si nécessaire
    const currentUrl = window.location.href.toLowerCase();

    if (currentUrl.includes("work")) {
        // On est dans l'environnement Work, on doit basculer vers Priv
        switPre(paramF); // appelle switPre avec le contenu de f
    } else {
        // On est déjà dans l’environnement correct
        setTimeout(() => {
            ouvrirIframe(cleanedF);
            openTab('Chrono');
        }, 200);
    }
}

if (arch) {
    openTab('creer');

    const elementsToRemoveOK = [
        document.getElementById('retourButton'),
        document.getElementById('optionsButton'),
        document.getElementById('visuButton'),
    ];

    elementsToRemoveOK.forEach(element => {
        if (element) element.remove();
    });

    // 🔒 Empêche de recréer le bouton s'il existe déjà
    if (!document.getElementById('retourButton3')) {
        const tabUnderContainer = document.getElementById('tabUnderContainer');
        if (tabUnderContainer) {
            const button = document.createElement('button');
            button.id = 'retourButton3';
            button.className = 'tab-button';
            button.innerText = '🔙 Quitter';
                button.onclick = function () {
                    window.location.href = "../HTML/Archive.html";
                };

            tabUnderContainer.appendChild(button);
        }
    }
}





    if (Export) {
        const enregistrements = document.getElementById("enregistrements");
        if (enregistrements) {
            const newHeight = window.innerHeight - 250;
            enregistrements.style.height = newHeight + "px";
        }
        const containers = document.getElementsByClassName("container");
        if (containers.length > 0) {
            const newHeight = window.innerHeight - 10;
            Array.from(containers).forEach(container => {
                container.style.height = newHeight + "px";
            });
        }

        openTab('interventions');
        document.getElementById('interventionsHeader').innerHTML = `
            <p>
                <strong>Environnement restreint,</strong> certaines modifications sont possibles.<br>
                Attention : si l'utilisateur est connecté au même moment, <br>
                les interventions peuvent être dupliquées (bien que la GMAO gère, merci de faire attention).
            </p>
            <button onclick="window.location.href='/G-MAPP/HTML/Gest.html?time=ok'">
                Revenir à la gestion des exportation
            </button>
        `;

        const elementsToRemoveOK = [
            ...document.getElementsByClassName('tab'),
            document.getElementById('creerTab'),
            document.getElementById('ChronoTab'),
            document.getElementById('parametresTab'),
            document.getElementById('tutorialModal'),
        ];

        elementsToRemoveOK.forEach(element => {
            if (element) element.remove();
        });
    }
if (username) {
    // --- ASSIGNATIONS ORIGINALES (Conservation des informations utilisateur) ---
    document.getElementById('user-info').innerHTML = `<h3>Bienvenue, ${username}</h3>`;
    document.getElementById('user-info2').innerHTML = `${username}`;

    const el3 = document.getElementById('user-info3');
    if (el3) el3.innerHTML = `<h1>Nouvelle intervention : <br> ${username}</h1>`;

    const el6 = document.getElementById('user-info6');
    if (el6) el6.innerHTML = `<h1>Afficher les intervention :`;

    const el4 = document.getElementById('user-info4');
    if (el4) el4.innerHTML = `<h1>Action préventive : <br> ${username}</h1>`;

    const el5 = document.getElementById('user-info5');
    if (el5) el5.innerHTML = `<h1>Planning du jour : <br> ${username}</h1>`;

    // --- VÉRIFICATION ANTI-DUPLICATION ET CRÉATION DU BANDEAU FIXE ---

    const existingBanner = document.getElementById('bottom-banner');

    if (!existingBanner) {
        // S'il n'existe pas, on procède à sa création.
        const BANNER_HEIGHT = 30;
        const banner = document.createElement('div');
        banner.id = 'bottom-banner';

        // Style CSS CRITIQUE (Positionnement et taille) injecté via JS
        // Les styles de display sont gérés par la feuille de style externe
        banner.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: ${BANNER_HEIGHT}px;
            background-color: white;
            z-index: 10;
            box-shadow: 0 -2px 8px rgba(0,0,0,0.15);
            transition: transform 0.3s ease-out;
        `;
let textadd = ''; 
const currentUrl = window.location.href.toLowerCase();
           if (CléType == "Work") {
            textadd += 'Correctif'
    }
           if (CléType =="Priv") {
            textadd += 'Préventif'
    }
               if (CléType =="Story") {
            textadd += 'Historique'
    }

        // INJECTION DIRECTE DU USERNAME DANS LE BANDEAU
        banner.innerHTML = textadd + ` : ${username}` ;

        // Ajoute le bandeau au corps du document
        document.body.appendChild(banner);
    } 
}
    if (interAc) {
        setTimeout(() => {
            ouvrirIframe(interAc);
            openTab('Chrono');
        }, 200);
    }

    if (decodedparamP) {
        setTimeout(() => {
            modalselect(decodedparamP);
        }, 200);
    }
}
let savedTheme = '';
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

async function ChargTheme() {



    const rawTheme = await getPrefixedItem("themeEnabled");
    const rawContrast = await getPrefixedItem("contrastEnabled");

    try {
        savedTheme = JSON.parse(rawTheme);
    } catch {
        savedTheme = rawTheme;
    }

    contrastEnabled = rawContrast === "true";

    removeAllThemes();

    if (savedTheme === "glass") {
        await loadThemeCSS("glassThemeStyle", "CSS/style_glass.css");
    } else if (savedTheme === "retro") {
        await loadThemeCSS("retroThemeStyle", "CSS/style_retro.css");
    }

    if (contrastEnabled) {
        await loadThemeCSS("contrastStyle", "CSS/style_constrast.css");
    }

    await applyContrastEffects();
}

async function handleThemeButtonClick(theme) {
    await setPrefixedItem("themeEnabled", JSON.stringify(theme));

    removeAllThemes();

    if (theme === "glass") {
        await loadThemeCSS("glassThemeStyle", "CSS/style_glass.css");
    } else if (theme === "retro") {
        await loadThemeCSS("retroThemeStyle", "CSS/style_retro.css");
    }

    if (contrastEnabled) {
        await loadThemeCSS("contrastStyle", "CSS/style_constrast.css");
    }

    await applyContrastEffects();
}

async function toggleContrastMode(enable) {
    contrastEnabled = enable;
    await setPrefixedItem("contrastEnabled", enable ? "true" : "false");
    await ChargTheme();
}

async function toggleContrast() {
    const next = !contrastEnabled;
    await toggleContrastMode(next);
    updateContrastButtonText(next);
}

function updateContrastButtonText(state) {
    const btn = document.getElementById("btnContrast");
    if (!btn) return;
    btn.textContent = state ? "Désactiver contraste" : "Activer contraste";
}


async function applyContrastEffects() {
    if (!contrastEnabled) return;

    document.querySelectorAll("button").forEach(btn => {
        if (btn.id.startsWith("lancer-chrono-btn")) {
            btn.classList.add("no-contrast-overlay");
            return;
        }
        if (btn.id.startsWith("iframe2-btn")) {
            btn.classList.add("no-contrast-overlay");
            return;
        }
        if (btn.querySelector("span")) return;

        const span = document.createElement("span");
        span.textContent = btn.textContent;
        span.style.position = "relative";
        span.style.zIndex = "1";
        btn.textContent = "";
        btn.appendChild(span);
    });
}

// Répond aux iframes qui demandent l'état contraste
window.addEventListener("message", (e) => {
    if (!e || !e.data) return;
    if (e.data.type === "request-contrast-state") {
        try {
            e.source.postMessage({ type: "contrast-state", enabled: (contrastEnabled === true) }, e.origin || "*");
        } catch {}
    }
});



async function toggleContrastMode(enable) {
    contrastEnabled = enable;
    await setPrefixedItem("contrastEnabled", enable ? "true" : "false");
    await ChargTheme();
    broadcastContrast(); // pousse true/false vers les iframes
}

function broadcastContrast() {
    const payload = { type: "contrast-state", enabled: (contrastEnabled === true) };
    document.querySelectorAll("iframe").forEach(fr => {
        try { fr.contentWindow.postMessage(payload, "*"); } catch {}
    });
}

window.addEventListener("message", (e) => {
    if (!e || !e.data) return;
    if (e.data.type === "request-contrast-state") {
        try { e.source.postMessage({ type: "contrast-state", enabled: (contrastEnabled === true) }, "*"); } catch {}
    }
});



window.addEventListener("DOMContentLoaded", async () => {
    await ChargTheme();
    updateContrastButtonText(contrastEnabled);
    broadcastContrast(); // état initial vers les iframes
});