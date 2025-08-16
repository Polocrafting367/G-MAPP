Avoir un server compatible PHP

Copier le dossier 'intervention' à la racine du server (Il n est pas possible de le renomer à moins de mettre a jours les différent script!)

Mettre à la racine du server au minimum (sur la page index.html ou son script) 
le code suivant pour géré la redirection automatique des QR code vers la bonne page:"




// Exécuter le script dès que possible pour la redirection
(function () {
    const currentUrl = new URL(window.location.href);
    const params = new URLSearchParams(currentUrl.search);
    const interLieu = params.get('i');
    const intergroup = params.get('p');

       if (interLieu) {
        window.location.href = `G-MAPP/index.html?i=${interLieu}`;
    } else if (intergroup) {
        window.location.href = `G-MAPP/index.html?p=${intergroup}`;
    }



 
})();

document.addEventListener("DOMContentLoaded", function () {
    const currentUrl = new URL(window.location.href);
    const params = new URLSearchParams(currentUrl.search);
    const interLieu = params.get('i');
    const intergroup = params.get('p');

    // Affiche la modal uniquement si `i` ou `p` est présent
    if (interLieu || intergroup) {
        document.getElementById('loadingModal').style.display = 'flex';
        addRedirectButton(interLieu, intergroup)
        tryRedirect()
    }
});



"Pour plus de sécurité vous pouvez ajouter un script "redirect.js" ainsi qu une modal de chargement sur la page principal :

<script src="redirect.js"></script>
<div id="loadingModal" style="
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    display: none; /* Masqué par défaut */
    align-items: center;
    justify-content: center;
    z-index: 1000;
">
    <div style="text-align: center;">
        <div style="font-size: 2em; color: #333; font-weight: bold;">Tentative de redirection automatique...</div>
    </div>
</div>


et donc le contenu de "redirect.js" :"




// Exécuter le script dès que possible pour la redirection
(function () {
    const currentUrl = new URL(window.location.href);
    const params = new URLSearchParams(currentUrl.search);
    const interLieu = params.get('i');
    const intergroup = params.get('p');

       if (interLieu) {
        window.location.href = `G-MAPP/index.html?i=${interLieu}`;
    } else if (intergroup) {
        window.location.href = `G-MAPP/index.html?p=${intergroup}`;
    }



 
})();



document.addEventListener("DOMContentLoaded", function () {
    const currentUrl = new URL(window.location.href);
    const params = new URLSearchParams(currentUrl.search);
    const interLieu = params.get('i');
    const intergroup = params.get('p');

    // Affiche la modal uniquement si `i` ou `p` est présent
    if (interLieu || intergroup) {
        document.getElementById('loadingModal').style.display = 'flex';
        addRedirectButton(interLieu, intergroup)
        tryRedirect()
    }
});







// Fonction de redirection
function tryRedirect() {
    const currentUrl = new URL(window.location.href);
    const params = new URLSearchParams(currentUrl.search);
    const interLieu = params.get('i');
    const intergroup = params.get('p');

    // Rediriger si les paramètres sont présents
    if (interLieu) {
        window.location.href = `G-MAPP/index.html?i=${interLieu}`;
    } else if (intergroup) {
        window.location.href = `G-MAPP/index.html?p=${intergroup}`;
    }
}

// Fonction pour afficher le bouton de redirection manuelle
function addRedirectButton(interLieu, intergroup) {
    const modalContent = document.getElementById('loadingModal').firstElementChild;
    const button = document.createElement('button');
    button.innerText = 'Redirection';
    button.style.marginTop = '20px';
    button.style.padding = '10px 20px';
    button.style.fontSize = '1em';
    button.style.cursor = 'pointer';
    button.onclick = function() {
        // Redirection manuelle si le bouton est cliqué
        if (interLieu) {
            window.location.href = `G-MAPP/index.html?i=${interLieu}`;
        } else if (intergroup) {
            window.location.href = `G-MAPP/index.html?p=${intergroup}`;
        }
    };
    modalContent.appendChild(button);
}


"