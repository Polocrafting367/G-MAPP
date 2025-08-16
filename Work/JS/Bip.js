// Variables globales
let buffer = "";
let shiftActive = false;
let isScanning = false;


// Fonction pour traiter les saisies (keydown ou input)
function handleKeydown(event) {
    const key = event.key; // Récupère la touche pressée

    // Ignorer les touches non identifiées
    if (!key || key === "Unidentified") {
        return;
    }

    // Si "Shift" est détecté, active le flag
    if (key === "Shift") {
        shiftActive = true;
        return; // Ignore Shift pour le buffer
    }

    // Ajout de la touche dans le buffer
    if (shiftActive) {
        buffer += key.toUpperCase(); // Ajoute la version majuscule
        shiftActive = false; // Réinitialise le flag
    } else {
        buffer += key.toLowerCase(); // Ajoute la version minuscule par défaut
    }

    processBuffer(); // Traite le buffer
}

function handleInput(event) {
    // Utilisé principalement pour les claviers virtuels sur mobile
    const data = event.data; // Récupère le dernier caractère ajouté

    if (data) {
        buffer += data; // Ajoute au buffer
        processBuffer(); // Traite le buffer
    }
}

function processBuffer() {
    const statusElement = document.getElementById('status');

    if (statusElement) {
        statusElement.textContent = buffer;
    }

    // Vérifiez si "scan-" est détecté
    if (buffer.includes("scan-")) {
        isScanning = true;

        // Supprime "scan-" du buffer
        buffer = buffer.substring(buffer.indexOf("scan-") + 5);
        if (statusElement) {
            statusElement.textContent = "Statut : Scan en cours...";
        }
    }

    // Vérifiez si "-fin" est détecté
    if (isScanning && buffer.includes("-fin")) {
        // Extrait le texte scanné entre "scan-" et "-fin"
        let scannedText = buffer.substring(0, buffer.indexOf("-fin"));

        // Nettoie le texte des touches non valides
        scannedText = scannedText.replace(/shift/gi, "").replace(/unidentified/gi, "");

        // Réinitialise le buffer
        buffer = buffer.substring(0, buffer.indexOf("-fin"));

        // Concatène le texte complet
        const fullText = "scan-" + scannedText + "-fin";

        // Vérifie l'existence de l'élément status
        if (statusElement) {
            gestdata(fullText); // Envoie les données scannées pour traitement
        } else {
            // Envoie un message à la page mère
            const message = {
                type: "scannedText", // Type du message
                content: fullText   // Données scannées
            };
            window.parent.postMessage(message, "*");        }

        isScanning = false; // Réinitialise l'état de scan
    }
}

// Écouteur pour les claviers physiques
document.addEventListener("keydown", handleKeydown);

// Écouteur pour les claviers virtuels
document.addEventListener("input", handleInput);

function gestdata(scannedText) {
    if (scannedText.startsWith('scan-') && scannedText.endsWith('-fin')) {
        let content = scannedText.slice(5, -4).trim();

        const processParams = (params) => {
            const paramF = params.get('f');
            const paramI = params.get('i');
            const paramP = params.get('p');

            if (paramF) {
                const cleanedF = nettoyerNomLieu(paramF);

                const confirmation = confirm(`Le code scanné correspond à une fiche **préventive**.\n\nSouhaitez-vous être redirigé vers les **interventions préventives** ?`);
                if (confirmation) {
                    switPre(cleanedF); // ✅ Utilisation directe ici
                } else {
                    console.log("Redirection annulée par l'utilisateur.");
                }
                return;
            }

            if (paramP) {
                const decodedP = nettoyerNomLieu(paramP);
                modalselect(decodedP);
                return;
            }

            if (paramI) {
                const decodedI = nettoyerNomLieu(paramI);
                ouvrirIframe(decodedI);
                setTimeout(() => openTab('Chrono'), 100);
                return;
            }

            afficherResult(`Le QR ne permet pas de créer une intervention: ${scannedText}`);
        };

        try {
            if (/^https?:\/\//i.test(content)) {
                const url = new URL(content);
                processParams(url.searchParams);

            } else if (/^\?/.test(content)) {
                if (content.startsWith("?&")) content = "?" + content.substring(2);
                else if (content.startsWith("&")) content = "?" + content.substring(1);

                const url = new URL(content, window.location.origin);
                processParams(url.searchParams);

            } else if (/^[\w.-]+\.\w+\/\?.+=/.test(content)) {
                const url = new URL("https://" + content);
                processParams(url.searchParams);

            } else {
                const nettoye = nettoyerNomLieu(content);
                ouvrirIframe(nettoye);
                setTimeout(() => openTab('Chrono'), 100);
            }

        } catch (error) {
            afficherResult(`Erreur dans le traitement du code scanné: ${scannedText}`);
            console.error(error);
        }
    }
}

function nettoyerNomLieu(input) {
    if (typeof input !== "string") return input;
    try {
        return decodeURIComponent(input.replace(/\+/g, ' '));
    } catch (e) {
        console.warn("Erreur de décodage :", input);
        return input;
    }
}




function displayUsernameAndLogout() {
    const username = getUsernameFromUrl();
    const interAc = getinterFromUrl('i'); // Récupère le paramètre 'i' s'il est présent
    const decodedparamP = getinterFromUrl('p'); // Récupère le paramètre 'p' s'il est présent
    const Export = getinterFromUrl('Export'); // Récupère le paramètre 'p' s'il est présent
 if (Export) {

  const enregistrements = document.getElementById("enregistrements");
  if (enregistrements) {
    // Calcule la nouvelle hauteur en soustrayant 130 pixels de la hauteur de la fenêtre
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
    les interventions peuvent être dupliquées (bien que la GMAO gère, merci de faire attention).</p>
    <button onclick="window.location.href='/G-MAPP/HTML/Gest.html?time=ok'">Revenir à la gestion des exportation</button>
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
    } else {
       

    }

    if (interAc) {
        // Si le paramètre 'i' est présent, ouvrir l'iframe
        setTimeout(() => {
            ouvrirIframe(interAc);
            openTab('Chrono');
        }, 200);
    }
    if (decodedparamP) {
        // Si le paramètre 'p' est présent, appeler modalselect avec decodedparamP
        setTimeout(() => {
            modalselect(decodedparamP);
        }, 200);
    }
}