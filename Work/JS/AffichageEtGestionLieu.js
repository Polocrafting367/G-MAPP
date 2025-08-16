
async function chargerLieux() {
    const lieuxList = document.getElementById('lieux-list');

    // Attendre la résolution de getPrefixedItem avant de continuer

    // Vérifier si lieuxEnregistres est une chaîne de caractères avant d'utiliser split

    function parcourirArborescence(arbre, parent, cheminParent = '', niveau = 0) {
        for (const lieu in arbre) {
            const cheminComplet = cheminParent + (cheminParent ? ' > ' : '') + lieu;
            const nomLieuBrut = lieu.trim();
            const nomLieuPourJS = lieu.trim().replace(/'/g, "\\'");

            const lieuItem = document.createElement('li');
            const icon = (Object.keys(arbre[lieu]).length > 0) ? '▶' : ' ';
            const displayStyle = (niveau === 0) ? 'block' : 'none';

            // Conteneur des boutons
            let buttonsHTML = `
                <button id="lancer-chrono-btn-${nomLieuBrut}" data-lieu="${nomLieuBrut}" onclick="ouvrirIframe('${nomLieuPourJS}')" 
                    style="width: 43px; height: 43px; position: absolute; top: -10px; right: -13px; border-radius: 8px;">
                </button>`;

            // Si des préconfigurations existent, créer les boutons avec `flex-wrap: wrap`
            if (preConfigurations[nomLieuBrut]) {
                buttonsHTML += `<div class="button-container">`;
                preConfigurations[nomLieuBrut].forEach((config, index) => {
                    buttonsHTML += `
                        <button id="relancer-preconf-btn-${nomLieuBrut}-${index}" data-lieu="${nomLieuBrut}" onclick="relancerPreconfiguration('${nomLieuBrut}', ${index})">
                            ${config.titre}
                        </button>`;
                });
                buttonsHTML += `</div>`;
            }

            lieuItem.innerHTML = `
                <div class="place-card level-${niveau}" onclick="toggleNiveau(this, ${niveau})">
                    <span class="pastille" data-texte="${nomLieuBrut}" style="display:${displayStyle}">${icon} ${nomLieuBrut}</span>
                    ${buttonsHTML}
                    <div class="iframe-container" id="iframe-container-${nomLieuBrut}"></div>
                </div>`;
            parent.appendChild(lieuItem);

          setTimeout(() => {
                injectSVG(`lancer-chrono-btn-${nomLieuBrut}`, chrono);
            }, 0);

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

// Appeler la fonction `chargerLieux`
chargerLieux();


function relancerPreconfiguration(nomLieu, index) {
    const config = preConfigurations[nomLieu][index];


    if (config) {
        // Lancer la préconfiguration avec les valeurs stockées
        ouvrirIframe(nomLieu, config.temps, config.Text1, config.Text2, config.liste1, config.liste2, config.arret);
    }
}

function UsePreconfig(lieu, tempsRéelCommencer, index, Pièces) {
    const LieuOK = lieu.replace(/\[\d+\]$/, '').trim();
    const config = preConfigurations[LieuOK][index];
    if (config) {
        // Lancer la préconfiguration avec les valeurs stockées
        ouvrirIframe(lieu, tempsRéelCommencer,   config.Text1, Pièces,config.liste1, config.liste2,config.arret);
    }


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
