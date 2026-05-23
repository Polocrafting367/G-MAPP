
async function supprimerTousLesCookies() {
    const username = getUsernameFromURL(); // Récupérer le nom d'utilisateur depuis l'URL

    const confirmation = window.confirm(
        "Êtes-vous sûr de vouloir supprimer tous les cookies pour l'utilisateur : \n" + username
    );

    if (confirmation) {


        // Supprime les cookies et autres éléments de stockage
        localStorage.removeItem('rememberedUser');
        localStorage.removeItem('rememberedPassword');
        localStorage.removeItem('AUTOUSER');
        localStorage.removeItem('device_id');

        removePrefixedItemold('angleCouleur');
        removePrefixedItemold('luminosite');
        // Appelle la fonction de suppression de fichier
        await supprimerFichierServeur(username);

        // Confirmation et redirection
        alert("Tous les cookies ont été supprimés et le fichier associé a été supprimé.");
        window.location.href = '../Log.html'; // Redirige vers la page de connexion
    }
}

async function supprimerFichierServeur(username) {
    try {
        const response = await fetch('/G-MAPP/Work/PHP/deleteUserData.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: `${username}_`
            })
        });

        const responseText = await response.text(); // Lire la réponse en texte

        const data = JSON.parse(responseText); // Convertir en JSON
        if (!response.ok || data.status !== 'success') {
            console.error("Erreur lors de la suppression du fichier sur le serveur.", data.message);
            alert("Erreur lors de la suppression du fichier sur le serveur.");
        }
    } catch (error) {
        console.error("Erreur lors de l'appel au serveur :", error);
        alert("Erreur lors de la suppression du fichier sur le serveur.");
    }
}




// Fonction pour parcourir récursivement l'arborescence et supprimer les données localStorage pour chaque lieu
function parcourirEtSupprimer(arbre, username) {
    for (const lieu in arbre) {
        const storageKey = `${lieu}`; // Générer la clé pour chaque lieu

        removePrefixedItem(storageKey); // Supprimer l'élément dans localStorage
        if (Object.keys(arbre[lieu]).length > 0) {
            parcourirEtSupprimer(arbre[lieu], username); // Appel récursif pour les sous-lieux
        }
    }
}

// Fonction pour récupérer le nom d'utilisateur depuis l'URL
function getUsernameFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('user');
}
// Fonction pour compter le nombre total d'iframes à créer dans l'arborescence



function nettoyerCRH() {
  const output = document.getElementById("cleanCRHResult");
  const btn = document.getElementById("btnCleanCRH");
  const username = getUsernameFromURL();
  console.log('username : ' + username)

  btn.disabled = true;
  btn.textContent = "Nettoyage en cours...";

  fetch(`/G-MAPP/Ressources/PHP/clean_crh.php?user=${encodeURIComponent(username)}`)
    .then(res => res.text())
    .then(text => {
      output.textContent = text;
    })
    .catch(err => {
      output.textContent = "Erreur lors de l'appel : " + err.message;
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "Nettoyer fichiers CRH";
    });
}
