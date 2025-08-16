async function chargerLieux() {
    const lieuxList = document.getElementById('lieux-list');

    // Attendre la résolution de getPrefixedItem avant de continuer

    // Vérifier si lieuxEnregistres est une chaîne de caractères avant d'utiliser split

function parcourirArborescence(arbre, parent, cheminParent = '', niveau = 0) {
    for (const lieu in arbre) {
        const cheminComplet = cheminParent + (cheminParent ? ' > ' : '') + lieu;
        const detailsLieu = arbre[lieu];
        const nomLieuBrut = lieu.trim();

        if (nomLieuBrut === "" || nomLieuBrut === "-") {
    continue;
}
        const nomLieuPourJS = nomLieuBrut.replace(/'/g, "\\'");

        const lieuItem = document.createElement('li');
const hasChildren = typeof detailsLieu === "object" &&
    Object.keys(detailsLieu).some(key => {
        const val = detailsLieu[key];
        return typeof val === "object" 
            && val !== null 
            && Object.keys(val).length > 0 
            && !["Résumé intervention", "Numéro de fiche"].includes(key);
    });
        const icon = hasChildren ? '▶' : ''; // Afficher "▶" uniquement si des enfants existent
        const displayStyle = (niveau === 0) ? 'block' : 'none';

        // Préparer le contenu HTML du lieu
        let buttonsHTML = `<div class="place-card level-${niveau}" onclick="toggleNiveau(this, ${niveau})">
            <span class="pastille" data-texte="${nomLieuBrut}" style="display:${displayStyle}">${icon} ${nomLieuBrut}</span>`;

        // Ajouter une section pour le résumé d'intervention si disponible
        if (detailsLieu && typeof detailsLieu === "object" && "Résumé intervention" in detailsLieu) {
            buttonsHTML += `<p class="resume-intervention" style="display: block; margin-top: 5px; ">${detailsLieu["Résumé intervention"]}</p>`;
        }

        // Ajouter le bouton de chronomètre uniquement pour les éléments du dernier niveau
        if (!hasChildren && detailsLieu && "Numéro de fiche" in detailsLieu) {
            const ficheNumber = detailsLieu["Numéro de fiche"];
            buttonsHTML += `
            <button id="lancer-chrono-btn-${nomLieuBrut}" data-lieu="${nomLieuPourJS}" onclick="ouvrirIframe('${ficheNumber}')" 
                style="width: 40px; height: 41px; position: absolute; top: -10px; right: -13px; border-radius: 8px; background-color: rgb(20, 19, 57); color: rgb(255, 255, 255); display: none;">
                <img src="" alt="Icône chrono" style="width: 20px; height: 20px; position: absolute; bottom: 10px; right: 9px;">
            </button>`;
        }

        buttonsHTML += `<div class="iframe-container" id="iframe-container-${nomLieuPourJS}"></div></div>`;

        lieuItem.innerHTML = buttonsHTML;
        parent.appendChild(lieuItem);

            setTimeout(() => {
                injectSVG(`lancer-chrono-btn-${nomLieuBrut}`, chrono);
            }, 0);

        // Appel récursif pour les sous-lieux uniquement
        if (hasChildren) {
            const sousLieuxList = document.createElement('ul');
            sousLieuxList.style.display = 'none'; // Les sous-lieux sont initialement masqués

            // Ajouter les sous-lieux tout en ignorant "Résumé intervention"
            Object.keys(detailsLieu)
                .filter(key => typeof detailsLieu[key] === "object" && !["Résumé intervention", "Numéro de fiche"].includes(key))
                .forEach(key => {
                    parcourirArborescence({ [key]: detailsLieu[key] }, sousLieuxList, cheminComplet, niveau + 1);
                });

            lieuItem.appendChild(sousLieuxList);
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
        ouvrirIframe(lieu, tempsRéelCommencer,  config.liste1, config.liste2, config.Text1, Pièces,config.arret);
    }


}
function toggleNiveau(element, niveau) {
    const ulElement = element.nextElementSibling;

    // Vérifie si un élément UL existe et a des enfants
    if (ulElement && ulElement.tagName === 'UL' && ulElement.children.length > 0) {
        const isHidden = ulElement.style.display === 'none' || ulElement.style.display === '';
        ulElement.style.display = isHidden ? 'block' : 'none';

        // Gère l'icône de l'élément (▶ ou ▼)
        const iconElement = element.querySelector('.pastille');
        const texteElement = iconElement.getAttribute('data-texte');
        iconElement.innerHTML = isHidden ? '▼ ' + texteElement : '▶ ' + texteElement;
    }
}



let nombreChronosActifs = 0;