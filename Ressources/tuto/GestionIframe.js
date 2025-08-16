

function chargerLieux() {
    const lieuxList = document.getElementById('lieux-list');
    const lieuxEnregistres = getPrefixedItem('lieuxEnregistres') || '';
    const lieuxEnregistresArray = lieuxEnregistres.split(',');

function parcourirArborescence(arbre, parent, cheminParent = '', niveau = 0) {
    for (const lieu in arbre) {
        const cheminComplet = cheminParent + (cheminParent ? ' > ' : '') + lieu;
        const nomLieuBrut = lieu.trim();
        const nomLieuPourJS = lieu.trim().replace(/'/g, "\\'");

        const lieuItem = document.createElement('li');
        const icon = (Object.keys(arbre[lieu]).length > 0) ? '▶' : ' ';
        const displayStyle = (niveau === 0) ? 'block' : 'none';

        // Créer le bouton principal pour lancer le chrono avec une icône
        let buttonsHTML = `
            <button id="lancer-chrono-btn-${nomLieuBrut}" data-lieu="${nomLieuBrut}" onclick="" style="width: 40px; height: 41px; position: absolute; top: -12px; right: -12px; border-radius: 8px; display: block;">
                <img src="chrono.png" alt="Icône chrono" style="width: 20px; height: 20px; position: absolute; bottom: 10px; right: 9px;">
            </button>`;

        // Initialiser la hauteur par défaut de la place-card
        let placeCardHeight = 28;  // Hauteur par défaut sans boutons supplémentaires

        lieuItem.innerHTML = `
            <div class="place-card level-${niveau}" onclick="toggleNiveau(this, ${niveau})" style="min-height: ${placeCardHeight}px;">
                <span class="pastille" data-texte="${nomLieuBrut}" style="display:${displayStyle}">${icon} ${nomLieuBrut}</span>
                ${buttonsHTML}
                <div class="iframe-container" id="iframe-container-${nomLieuBrut}"></div>
            </div>`;
        parent.appendChild(lieuItem);

        if (Object.keys(arbre[lieu]).length > 0) {
            const sousLieuxList = document.createElement('ul');
            sousLieuxList.style.display = 'none';
            lieuItem.appendChild(sousLieuxList);
            parcourirArborescence(arbre[lieu], sousLieuxList, cheminComplet, niveau + 1);
        }
    }
}

parcourirArborescence(arborescence, lieuxList);


}


function toggleNiveau(element, niveau) {
    const ulElement = element.nextElementSibling;
    if (ulElement) {
        ulElement.style.display = (ulElement.style.display === 'none' || ulElement.style.display === '') ? 'block' : 'none';
        const iconElement = element.querySelector('.pastille');
        const texteElement = iconElement.getAttribute('data-texte');
        iconElement.innerHTML = (ulElement.style.display === 'none') ? '▶ ' + texteElement : '▼ ' + texteElement;

        const boutonLancerChrono = document.getElementById(`lancer-chrono-btn-${texteElement}`);
        if (boutonLancerChrono && element.classList.contains('non-cliquable')) {
            boutonLancerChrono.disabled = true;
        }

        if (ulElement.style.display === 'block') {
            const sousNiveaux = ulElement.querySelectorAll('.pastille');
            sousNiveaux.forEach(sousNiveau => {
                sousNiveau.style.display = 'block';
                const ulSousNiveau = sousNiveau.nextElementSibling;
                if (ulSousNiveau) {
                    ulSousNiveau.style.display = 'none';
                }
            });
        }
    }
}

let nombreChronosActifs = 0;


function ajouterTitreEtIframe(nomLieu, temps, liste1, liste2, Text1, Text2, arret) {
    const chronosContainer = document.getElementById('chronosContainer');

    const groupeContainer = document.createElement('div');
    groupeContainer.setAttribute('id', `lieu-${nomLieu.toLowerCase().replace(/\s+/g, '_')}`);
    groupeContainer.setAttribute('class', 'groupe-container');

    const titreLieuContainer = document.createElement('div');
    titreLieuContainer.setAttribute('class', 'titre-lieu');
    titreLieuContainer.textContent = nomLieu;

    // Ajouter le bouton "Modifier"
    const modifierButton = document.createElement('button');
    modifierButton.textContent = "Modifier";
    modifierButton.addEventListener('click', () => {
        // Ouvrir la modal ici

        ouvrirModalModifierLieu(nomLieu);
    });

    // Ajouter le bouton "Modifier" à côté du titre
    titreLieuContainer.appendChild(modifierButton);

    const iframe = document.createElement('iframe');
    iframe.id = `iframe-${nomLieu.replace(/\s+/g, '_')}`;
    
    let url = `chrono.html?lieu=${nomLieu}&theme=${getPrefixedItem('theme')}`;

    if (temps) {
        url += `&temps=${temps}&liste1=${liste1}&liste2=${liste2}&Text1=${Text1}&Text2=${Text2}&arret=${arret}`;
    }

    iframe.src = url;

    groupeContainer.appendChild(titreLieuContainer);
    groupeContainer.appendChild(iframe);

    chronosContainer.appendChild(groupeContainer);

    if (groupeContainer) {
        const iframesImbriquées = document.querySelectorAll('iframe');
        for (let i = 0; i < iframesImbriquées.length; i++) {
            if (iframesImbriquées[i] !== iframe) {
                iframesImbriquées[i].contentWindow.postMessage('NouvelleIframeCréée', '*');
            }
        }
    }
}


function getStoragePrefix() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('user');
    return username ? `${username}_` : '';
}
function setPrefixedItem(key, value) {
    const prefix = getStoragePrefix();
    localStorage.setItem(prefix + key, value);
}

function getPrefixedItem(key) {
    const prefix = getStoragePrefix();
    return localStorage.getItem(prefix + key);
}

function removePrefixedItem(key) {
    const prefix = getStoragePrefix();
    localStorage.removeItem(prefix + key);
    
}

let restt = getPrefixedItem('currentTab');

document.addEventListener("DOMContentLoaded", function () {
    chargerLieux();

let restt = getPrefixedItem('currentTab');









});




function openTab(tabName) {
    const chronoButton = document.getElementById('ChronoButton');
    const currentAnnimValue = chronoButton.getAttribute('annim');
    const newAnnimValue = 'false';
    chronoButton.setAttribute('annim', newAnnimValue);

    var i, tabcontent, tabbuttons;

    // Cacher tous les onglets
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Retirer la classe "active" de tous les boutons
    tabbuttons = document.getElementsByClassName("tab-button");
    for (i = 0; i < tabbuttons.length; i++) {
        tabbuttons[i].classList.remove("active");
    }

    // Afficher l'onglet sélectionné
    document.getElementById(tabName + "Tab").style.display = "block";

    // Ajouter la classe "active" au bouton correspondant
    document.getElementById(tabName + "Button").classList.add("active");

    // Stocker l'onglet actuel dans le localStorage
    setPrefixedItem('currentTab', tabName);

    // Appeler afficherEnregistrements si le tabName est "interventions"


    

}
