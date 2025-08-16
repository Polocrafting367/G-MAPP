
async function chargerLieux() {
  const lieuxList = document.getElementById('lieux-list');
  lieuxList.innerHTML = ''; // Nettoyage

  function parcourirArborescence(arbre, parent, cheminParent = '', niveau = 0) {
    for (const lieu of Object.keys(arbre)) {
      const cheminComplet = cheminParent ? `${cheminParent} > ${lieu}` : lieu;
      const nomLieuBrut = lieu.trim();
      const nomLieuPourJS = lieu.replace(/'/g, "\\'");
      const stats = preConfigurations[nomLieuBrut] || { local: 0, total: 0 };
      const hasChildren = Object.keys(arbre[lieu]).length > 0;
      const displayStyle = (niveau === 0) ? 'block' : 'none';

      const lieuItem = document.createElement('li');
      const icon = hasChildren ? '▶' : '';

      let buttonsHTML = `
        <!-- 🆕 bouton gauche pour ouvrirIframe2 -->
        <button id="iframe2-btn-${nomLieuBrut}" data-lieu="${nomLieuBrut}"
          onclick="ouvrirIframe2('${nomLieuPourJS}')"
          style="width: 43px; height: 43px; position: absolute; top: -10px; right: 35px; border-radius: 8px;">
         
        </button>

        <!-- bouton classique pour ouvrirIframe -->
        <button id="lancer-chrono-btn-${nomLieuBrut}" data-lieu="${nomLieuBrut}"
          onclick="ouvrirIframe('${nomLieuPourJS}')"
          style="width: 43px; height: 43px; position: absolute; top: -10px; right: -13px; border-radius: 8px;">
          
        </button>`;

      if (Array.isArray(preConfigurations[nomLieuBrut])) {
        buttonsHTML += `<div class="button-container">`;
        preConfigurations[nomLieuBrut].forEach((config, index) => {
          buttonsHTML += `
            <button id="relancer-preconf-btn-${nomLieuBrut}-${index}" data-lieu="${nomLieuBrut}"
              onclick="relancerPreconfiguration('${nomLieuBrut}', ${index})">
              ${config.titre}
            </button>`;
        });
        buttonsHTML += `</div>`;
      }

      lieuItem.innerHTML = `
        <div class="place-card level-${niveau}" onclick="toggleNiveau(this, ${niveau})">
          <span class="pastille" data-texte="${nomLieuBrut}" style="display:${displayStyle}">
            ${icon} ${nomLieuBrut} (${stats.local}/${stats.total})
          </span>
          ${buttonsHTML}
          <div class="iframe-container" id="iframe-container-${nomLieuBrut}"></div>
        </div>`;

      parent.appendChild(lieuItem);

setTimeout(() => {
    injectSVG(`lancer-chrono-btn-${nomLieuBrut}`, loupe);
    injectSVG(`iframe2-btn-${nomLieuBrut}`, loupe2); // ✅ ajout ici
}, 0);


      if (hasChildren) {
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
        ouvrirIframe(lieu, tempsRéelCommencer,  config.liste1, config.liste2, config.Text1, Pièces,config.arret);
    }


}


function toggleNiveau(element, niveau) {
  const ulElement = element.nextElementSibling;
  if (!ulElement) return;

  const iconElement = element.querySelector('.pastille');
  const texteElement = iconElement.getAttribute('data-texte');

  const isExpanded = ulElement.style.display === 'block';
  ulElement.style.display = isExpanded ? 'none' : 'block';

  // 🔁 On récupère les stats à jour depuis l'attribut existant
  const statsMatch = iconElement.textContent.match(/\((\d+\/\d+)\)/);
  const statsText = statsMatch ? ` (${statsMatch[1]})` : '';

  // ✅ Conserve les stats visuellement
  iconElement.innerHTML = (isExpanded ? '▶ ' : '▼ ') + texteElement + statsText;

  const boutonLancerChrono = document.getElementById(`lancer-chrono-btn-${texteElement}`);
  if (boutonLancerChrono && element.classList.contains('non-cliquable')) {
    boutonLancerChrono.disabled = true;
  }

  if (!isExpanded) {
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


let nombreChronosActifs = 0;
