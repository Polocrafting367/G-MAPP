


async function changerCouleur() {
    // Récupérer les valeurs actuelles d'angle et de luminosité depuis localStorage
    const angle = await getPrefixedItem('angleCouleur');
    const luminosite = await getPrefixedItem('luminositeCouleur');

    if (angle | luminosite) {
        // Appliquer les styles basés sur angle et luminosité
        const couleur = `hsl(${angle}, 100%, ${luminosite}%)`;
        const luminositeButt = `hsl(${angle}, 50%, ${luminosite}%)`;
        const couleurTexteBoutons = luminosite < 60 ? '#fff' : '#000';

document.querySelectorAll('button').forEach(function(bouton) {
    // Vérifie si le bouton n'a pas la classe 'note-tab-button'
    if (!bouton.classList.contains('note-tab-button')) {
        bouton.style.backgroundColor = luminositeButt;
        bouton.style.color = couleurTexteBoutons;
    }
});

        document.querySelectorAll('#optionsMenu').forEach(function(bouton) {
            bouton.style.backgroundColor = luminositeButt;
        });
        // Couleur pour les tab-buttons
        var minLuminositeFoncee = 0;
        var maxLuminositeClaire = 10;

        var luminositeFoncee = 'hsl(' + angle + ', 100%, ' + Math.max(luminosite - 30, minLuminositeFoncee) + '%)';
        var luminositeClaire = 'hsl(' + angle + ', 100%, ' + Math.max(luminosite - 10, maxLuminositeClaire) + '%)';

        document.querySelectorAll('.tab-button,.note-tab-button, .tab-button_u, .tab-button_z').forEach(function(tabButton) {
            tabButton.style.backgroundColor = tabButton.classList.contains('active') ? luminositeClaire : luminositeFoncee;

        });

        // Couleur de fond du body avec limitation uniquement dans les basses luminosités
        var bgLuminosite = Math.max(luminosite, 15); // Limite inférieure de 15%, sans limite supérieure
        var bodyBackgroundColor = 'hsl(0, 0%, ' + (bgLuminosite + 40) + '%)'; // Couleur de fond du body
        document.body.style.backgroundColor = bodyBackgroundColor;

        // Appliquer la même couleur de fond aux éléments .modal-content
        document.querySelectorAll('.modal-content').forEach(function(element) {
            element.style.backgroundColor = bodyBackgroundColor;
        });

        // Couleur transparente pour les éléments en fonction de la luminosité
        var couleurTransparente = luminosite > 40 ?
            'hsla(' + angle + ', 100%, ' + luminosite * 1.7 + '%, 0.4)' // Blanc clair et transparent si luminosité > 60
            :
            'hsla(' + angle + ', 100%, ' + luminosite * 0.3 + '%, 0.4)'; // Couleur sombre transparente sinon

        // Définir la couleur du texte en fonction de la luminosité
        var couleurTexteElements = luminosite > 40 ? '#000' : couleurTexteBoutons;

        // Appliquer la couleur transparente aux conteneurs
        document.querySelectorAll('.container').forEach(function(container) {
            container.style.backgroundColor = couleurTransparente;
            container.style.color = couleurTexteElements;
        });
        document.querySelectorAll(' .titre-lieu').forEach(function(container) {
            container.style.color = couleurTexteElements;
        });

        // Appliquer aux éléments spécifiques
        var elementsSpecifiques = document.querySelectorAll('#note-content, .searchInput, #enregistrements, .lieux-list, .groupe-container');
        elementsSpecifiques.forEach(function(element) {
            element.style.backgroundColor = couleurTransparente;
            element.style.color = couleurTexteElements;
        });

        // Ajuster couleur pour #enregistrements, li, .lieux-list immédiatement
        document.querySelectorAll('#enregistrements, li, .lieux-list').forEach(function(element) {
            element.style.backgroundColor = couleurTransparente;
            element.style.color = couleurTexteElements;
        });

        // Appliquer couleur transparente pour .groupe-enregistrements avec un délai de 200 ms
        setTimeout(() => {
            document.querySelectorAll('.groupe-enregistrements').forEach(function(element) {
                element.style.backgroundColor = couleurTransparente;
                element.style.color = couleurTexteElements;
            });
        }, 200);

        // Ajuster la couleur du texte globalement en fonction de la luminosité
        document.body.style.color = luminosite < 30 ? '#fff' : '#000';
    }
    await applyContrastEffects();
}
let luminosite = "";

async function changerCouleurAvecLuminosite() {

    // Récupérer et enregistrer la nouvelle luminosité
    luminosite = document.getElementById('sliderLuminosite').value;
    await setPrefixedItem('luminositeCouleur', luminosite);

    const angle = document.getElementById('colorSlider').value;

    //setPrefixedItem('angleCouleur', angle);
    await setPrefixedItem('angleCouleur', angle);
    // Appliquer les styles
    changerCouleur();
}
async function updateAngleCouleur(angle) {
    // Mettre à jour angleCouleur dans localStorage et serveur
    //setPrefixedItemold('angleCouleur', angle);
    await setPrefixedItem('angleCouleur', angle);


    luminosite = document.getElementById('sliderLuminosite').value;
    //setPrefixedItemold('luminosite', luminosite);
    await setPrefixedItem('luminositeCouleur', luminosite);
    // Appliquer les styles
    changerCouleur();
}



async function supprimerCouleurs() {
    // Suppression de angleCouleur et luminositeCouleur dans le stockage
    try {
        // Supprime d'abord depuis le serveur
        await removePrefixedItem('angleCouleur');
        await removePrefixedItem('luminositeCouleur');




        // Ajoutez un léger délai pour être sûr
        setTimeout(() => reloadpp(), 100);
    } catch (error) {
        console.error("Erreur lors de la suppression des couleurs :", error);
        alert("Erreur lors de la suppression des couleurs.");
    }
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



async function openWebsite() {
    // Enregistre la première visite dans le localStorage pour éviter de réafficher la modal
    await setPrefixedItem('Notification', true);

afficherPopupAideCustom(
      ".tab_under",
      `Ouvir le menu ☰ pour plus d'option`,
      'pop_menu_tab',
      2
   ); 
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
function fermerModalTuto() {
    // Enregistre la première visite dans le localStorage pour éviter de réafficher la modal

    // Cache la modal
    var overlay = document.getElementById("overlay");
    var modal = document.getElementById("tutorialModaltuto"); // Corrigé ici
    overlay.style.display = "none";
    modal.style.display = "none";


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

window.addEventListener("DOMContentLoaded", async () => {
    await ChargTheme();
    updateContrastButtonText(contrastEnabled);
});

async function applyContrastEffects() {
    if (!contrastEnabled) return;

    document.querySelectorAll("button").forEach(btn => {
        if (btn.id.startsWith("lancer-chrono-btn")) {
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
