window.cibleId = window.cibleId || null;
window.modalContext = window.modalContext || { origin: null, targetId: null, sourceWindow: null };
window.cibleId = window.cibleId || null;


async function ouvrirModalModifierLieu(nomLieuActuel) {
    const modal = document.getElementById('modifierLieuModal');
    modal.style.display = 'block';

    // Charger l'arborescence des lieux ici
    const arborescenceLieux = document.getElementById('arborescenceLieux');
    arborescenceLieux.innerHTML = ''; // Vider la liste

    // Utiliser await pour attendre la résolution de getPrefixedItem
    const listeEnregistreeData = await getPrefixedItem('maListe');
    const listeEnregistree = JSON.parse(listeEnregistreeData || '[]'); // Si `null`, utilise un tableau vide


    parcourirArborescenceSansPreconfiguration(arborescence, arborescenceLieux, '', 0, nomLieuActuel, listeEnregistree);
changerCouleur();
}

function fermerModalModifierLieu() {
    const modal = document.getElementById('modifierLieuModal');
    modal.style.display = 'none';
}

function parcourirArborescenceSansPreconfiguration(arbre, parent, cheminParent = '', niveau = 0, nomLieuActuel, listeEnregistree = []) {


    for (const lieu in arbre) {
        const cheminComplet = cheminParent + (cheminParent ? ' > ' : '') + lieu;
        const nomLieuBrut = lieu.trim();
        const nomLieuPourJS = lieu.trim().replace(/'/g, "\\'");

        const lieuItem = document.createElement('li');
        const icon = (Object.keys(arbre[lieu]).length > 0) ? '>' : ' ';
        const displayStyle = (niveau === 0) ? 'block' : 'none';

        let buttonHTML = '';
        if (nomLieuBrut === nomLieuActuel || listeEnregistree.includes(nomLieuBrut)) {
            // Si c'est le lieu actuel ou s'il est dans la liste enregistrée, désactiver le bouton
            const message = nomLieuBrut === nomLieuActuel ? 'Lieu actuel' : 'Lieu bloqué';
            buttonHTML = `<button disabled style="margin-left: 10px;">⛔</button>`;
        } else {
            // Sinon, afficher le bouton de sélection
            buttonHTML = `<button onclick="choisirLieu('${nomLieuPourJS}', '${nomLieuActuel}')" style="margin-left: 10px;">👆</button>`;
        }

        lieuItem.innerHTML = `
            <div class="place-card level-${niveau}" onclick="toggleNiveau(this, ${niveau})">
                <span class="pastille" data-texte="${nomLieuBrut}" style="display:${displayStyle}">${icon} ${nomLieuBrut}</span>
                ${buttonHTML}
            </div>`;
        parent.appendChild(lieuItem);

        if (Object.keys(arbre[lieu]).length > 0) {
            const sousLieuxList = document.createElement('ul');
            sousLieuxList.style.display = 'none';
            lieuItem.appendChild(sousLieuxList);
            parcourirArborescenceSansPreconfiguration(arbre[lieu], sousLieuxList, cheminComplet, niveau + 1, nomLieuActuel, listeEnregistree);
        }
    }
}





function normalizeForRegexBase(str) {
  // minuscules + accents retirés
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function buildNeedleRegex(rawInput) {
  const s = normalizeForRegexBase(rawInput).trim();
  if (!s) return null;

  // découpe lettres/chiffres (sans enlever les séparateurs ici)
  const tokens = s.match(/[\p{L}]+|\d+/gu) || [];
  if (!tokens.length) return null;

  const SEP = String.raw`[\/_\-\s\\]*`; // séparateurs optionnels

  const parts = tokens.map(tok => {
    if (/^\d+$/.test(tok)) {
      // autorise des zéros de tête devant ce nombre
      // ex: "1" -> "0*1", "01" -> "0*01"
      return String.raw`0*${tok}`;
    }
    // lettres telles quelles (déjà normalisées)
    // on échappe pour sécurité (même si lettres uniquement après normalisation)
    return tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });

  const pattern = parts.join(SEP);
  return new RegExp(pattern, 'i'); // i = case-insensitive (déjà en minuscules, mais safe)
}

function searchLieu2(arbre) {
    const clearButton = document.getElementById('clearButton2');
    const searchInput  = document.getElementById('searchInput2');
    const lieuxList    = document.getElementById('arborescenceLieux');
    if (!searchInput || !lieuxList) return;

    const termFold = normalizeString(searchInput.value);
    const terms = termFold.split(/\s+/).filter(Boolean); // multi-termes: tous doivent être contenus

    if (clearButton) clearButton.style.display = termFold !== '' ? 'block' : 'none';
  lieuxList.classList.toggle('is-searching', terms.length > 0);

    const lieuxItems = lieuxList.querySelectorAll('li');

    // cache des textes normalisés
    for (let i = 0; i < lieuxItems.length; i++) {
        const li = lieuxItems[i];
        if (!li.__foldText) li.__foldText = normalizeString(li.textContent || '');
        const pc = li.querySelector('.place-card');
        if (pc && !pc.__foldText) pc.__foldText = normalizeString(pc.textContent || '');
    }

    for (let i = 0; i < lieuxItems.length; i++) {
        const li = lieuxItems[i];
        const pc = li.querySelector('.place-card');

        const matchLi = terms.length === 0 || terms.every(t => li.__foldText.includes(t));
        if (pc) {
            const matchPc = terms.length === 0 || terms.every(t => pc.__foldText.includes(t));
            pc.style.display = matchPc ? 'block' : 'none';
        }

        if (matchLi) {
            li.style.display = 'block';
            li.classList.add('active');
            // ouvre les branches parentes
            let p = li.parentElement;
            while (p && p !== lieuxList) {
                if (p.tagName === 'UL') p.style.display = 'block';
                p = p.parentElement;
            }
        } else {
            li.style.display = 'none';
            li.classList.remove('active');
        }
    }

    if (terms.length === 0) {
        const allBranches = lieuxList.querySelectorAll('ul');
        allBranches.forEach(b => { b.style.display = 'none'; });
    }
}
function searchLieu3(arbre) {
  const clearButton = document.getElementById('clearButton3');
  const searchInput = document.getElementById('searchInput3');
  const lieuxList   = document.getElementById('arborescencePieces');
  if (!searchInput || !lieuxList) return;

  const termFold = normalizeString(searchInput.value);
  const terms = termFold.split(/\s+/).filter(Boolean);

  if (clearButton) clearButton.style.display = termFold !== '' ? 'block' : 'none';
  lieuxList.classList.toggle('is-searching', terms.length > 0);

  const lieuxItems = lieuxList.querySelectorAll('li');

  // Cache des textes normalisés
  for (let i = 0; i < lieuxItems.length; i++) {
    const li = lieuxItems[i];
    if (!li.__foldText) li.__foldText = normalizeString(li.textContent || '');
    const pc = li.querySelector('.place-card');
    if (pc && !pc.__foldText) pc.__foldText = normalizeString(pc.textContent || '');
  }

  // 🔄 Nettoyage des styles appliqués précédemment aux .place-card (parents)
  lieuxList.querySelectorAll('.place-card').forEach(pcEl => {
    pcEl.style.removeProperty('padding');
    pcEl.style.removeProperty('min-height');
    pcEl.style.removeProperty('display');
  });

  for (let i = 0; i < lieuxItems.length; i++) {
    const li = lieuxItems[i];
    const pc = li.querySelector('.place-card');

    const matchLi = terms.length === 0 || terms.every(t => li.__foldText.includes(t));
    // ⚠️ On ne touche PAS au styling du .place-card de l’élément trouvé
    // donc on ne lui met pas de padding/minHeight/display ici.
    // (on garde le cache _foldText ci-dessus seulement)

    if (matchLi) {
      li.style.display = 'block';
      li.classList.add('active');

      // Ouvre les branches parentes + applique le style aux .place-card des PARENTS
      let p = li.parentElement;
      while (p && p !== lieuxList) {
        if (p.tagName === 'UL') {
          p.style.display = 'block';
          const parentLi = p.parentElement; // le LI parent de cette UL
          if (parentLi && parentLi.tagName === 'LI') {
            parentLi.style.display = 'block';
            const parentPc = parentLi.querySelector('.place-card');
            if (parentPc) {
              parentPc.style.padding = "10px 0 0 10px";
              parentPc.style.display = "block"; // ou inline/flex/grid selon ton besoin
parentPc.style.setProperty("height", "15px", "important"); // ✅
pc.style.minHeight = "0px"; // ✅ correct


            }
          }
        }
        p = p.parentElement;
      }
    } else {
      li.style.display = 'none';
      li.classList.remove('active');
    }
  }

  // Quand pas de terme, on replie et on nettoie les styles parent appliqués
  if (terms.length === 0) {
    const allBranches = lieuxList.querySelectorAll('ul');
    allBranches.forEach(b => { b.style.display = 'none'; });

    // (optionnel) s'assurer que tout est clean
    lieuxList.querySelectorAll('.place-card').forEach(pcEl => {
      pcEl.style.removeProperty('padding');
      pcEl.style.removeProperty('min-height');
      pcEl.style.removeProperty('display');
    });
  }
}



function normalizeString2(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Supprimer les accents
}


function choisirLieu(nomLieu, nomLieuActuel) {
    // Fermer la modal
    fermerModalModifierLieu();

    // Convertir le nom actuel en un format d'ID valide
    const iframeId = nomLieuActuel;
    // Sélectionner l'iframe cible
    const iframe = document.getElementById(iframeId);

    if (!iframe) {
        console.error("Iframe introuvable avec l'ID:", iframeId);
    } else {

        // Vérifiez si l'iframe est accessible
        if (iframe.contentWindow) {
            // Envoyer un message à l'iframe avec le nom du lieu
            iframe.contentWindow.postMessage({
                type: 'Rename',
                lieu: nomLieu
            }, '*'); // Le second paramètre '*' peut être remplacé par le domaine cible pour plus de sécurité
        }
    }
}


function convertToIdFormat(str) {

    // Si vos IDs sont sensibles à la casse, supprimez la conversion en minuscules
    return str.trim().replace(/\s+/g, '_');

}

function closeModal() {
    const modal = document.getElementById('modalPreconf');
    if (modal) {
        modal.style.display = 'none';
    } else {
        console.error("Modal 'modalPreconf' not found in the DOM.");
    }
}

function modalselect(lieuGroupe, Prev) {
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = "";

    const lieux = Regroups[lieuGroupe];

    if (!lieux) {
        alert("Le regroupement demandé est introuvable : " + lieuGroupe);
        return;
    }

    modalTitle.innerText = lieuGroupe;

    // Cas 1 : si c'est un tableau (avec groupes via "--")
    if (Array.isArray(lieux)) {
        let currentCode = null;
        let groupContainer = null;

        lieux.forEach(item => {
            if (item.startsWith("--")) {
                currentCode = item.replace("--", "");
                const labelFreq = convertirAbreviation(currentCode);

                const separator = document.createElement('div');
                separator.innerHTML = `<hr>
<div style="text-align:center;font-weight:bold;font-size:1.2em;">${labelFreq}<hr></div>`;
                modalBody.appendChild(separator);

                groupContainer = document.createElement('div');
                modalBody.appendChild(groupContainer);
                return;
            }

            const button = document.createElement('button');
            let displayText = item;

            if (Prev) {
                const converted = findCodeByFicheNumber(item);
                displayText = converted ? converted : "[Introuvable: " + item + "]";
            }

            button.innerText = displayText;
            button.style.cssText = "margin-bottom: 5px;";
            button.onclick = function () {
                ouvrirIframe(item);
                closeModal();
            };

            if (groupContainer) {
                groupContainer.appendChild(button);
            } else {
                modalBody.appendChild(button);
            }
        });
    }

    // Cas 2 : si c'est un objet (clé = nom du lieu)
    else if (typeof lieux === 'object') {
        Object.keys(lieux).forEach(nomLieu => {
            const button = document.createElement('button');

            let displayText = nomLieu;
            if (Prev) {
                const converted = findCodeByFicheNumber(nomLieu);
                displayText = converted ? converted : "[Introuvable: " + nomLieu + "]";
            }

            button.innerText = displayText;
            button.style.cssText = "margin-bottom: 5px;";
            button.onclick = function () {
                ouvrirIframe(nomLieu);
                closeModal();
            };

            modalBody.appendChild(button);
        });
    }

    // Cas non géré
    else {
        alert("Le format du regroupement est invalide : " + lieuGroupe);
        return;
    }

    document.getElementById('modalPreconf').style.display = "block";
    changerCouleur();
}


function convertirAbreviation(code) {
    switch (code) {
        case "JH": return "Journalier";
        case "H": return "Hebdomadaire";
        case "M": return "Mensuel";
        case "A": return "Annuel";
        case "BA": return "Bi-Annuelle";
        case "TA": return "Tri-Annuelle";
        case "QA": return "Quadri-Annuelle";
        case "MA": return "Multi-Annuelle";
        case "10M": return "10 Mois";
        default: return code;
    }
}




function afficherModalEditionPieces(enregistrement, enregistrements) {
    // Création de l'overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Fond gris semi-transparent
    overlay.style.zIndex = '999'; // En dessous de la modal
    document.body.appendChild(overlay);

    // Création de la modal
    const modal = document.createElement('div');


    // Titre de la modal
    const title = document.createElement('h3');
    title.textContent = 'Modifier les pièces sorties';
    title.style.cssText = 'color: black !important; margin-bottom: 10px;';


    modal.appendChild(title);

    // Conteneur des pièces existantes
    const piecesContainer = document.createElement('div');


    // Charger les pièces existantes
    const pieces = enregistrement.zoneTexte3
        .slice(1, -1)
        .split(',')
        .map(piece => piece.split(':'));
    pieces.forEach(([ref, qty]) => {
        addPieceToContainer(piecesContainer, ref, qty);
    });

    modal.appendChild(piecesContainer);

    // Section pour modifier une pièce
    const editSection = document.createElement('div');
    editSection.style.display = 'flex';
    editSection.style.alignItems = 'center';
    editSection.style.gap = '10px';

    const refInput = document.createElement('input');
    refInput.type = 'text';
    refInput.placeholder = 'réf interne type : 201901300019';
    refInput.style.flex = '1';
    refInput.style.padding = '5px';
    refInput.style.border = '1px solid #ccc';
    refInput.style.borderRadius = '5px';

    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.min = '1';
    qtyInput.value = '1';
    qtyInput.style.width = '80px';
    qtyInput.style.padding = '5px';
    qtyInput.style.border = '1px solid #ccc';
    qtyInput.style.borderRadius = '5px';

    const editButton = document.createElement('button');
    editButton.textContent = 'Modifier';
    editButton.style.backgroundColor = '#28a745';
    editButton.style.color = 'white';
    editButton.style.border = 'none';
    editButton.style.borderRadius = '5px';
    editButton.style.padding = '5px 10px';
    editButton.style.cursor = 'pointer';

editButton.addEventListener('click', () => {
  const refRaw = (refInput.value || '').trim();
  const qty = parseInt(qtyInput.value, 10);

  // Mode "liste" si on détecte '@' ou une virgule
  const looksLikeList = /@|,|\[|\]/.test(refRaw);

  if (looksLikeList) {
    const arr = parsePiecesPayload(refRaw);
    if (!arr.length) {
      alert('Aucune entrée valide au format ID:QTT@PLACE');
      return;
    }
    arr.forEach(({ id, qty, place }) => createPieceBubble(id, qty, place));
    refInput.value = '';
    qtyInput.value = '1';
    return;
  }

  // Mode simple (ID + quantité, place auto)
  if (!refRaw || isNaN(qty) || qty <= 0) {
    alert('Veuillez entrer une référence valide et une quantité.');
    return;
  }
  createPieceBubble(refRaw, qty);
  refInput.value = '';
  qtyInput.value = '1';
});

    editSection.appendChild(refInput);
    editSection.appendChild(qtyInput);
    editSection.appendChild(editButton);

    modal.appendChild(editSection);

    // Boutons Enregistrer et Annuler
    const actionButtons = document.createElement('div');
    actionButtons.style.marginTop = '20px';
    actionButtons.style.display = 'flex';
    actionButtons.style.justifyContent = 'flex-end';
    actionButtons.style.gap = '10px';

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Enregistrer';
    saveButton.style.backgroundColor = '#007BFF';
    saveButton.style.color = 'white';
    saveButton.style.border = 'none';
    saveButton.style.padding = '5px 10px';
    saveButton.style.borderRadius = '5px';
    saveButton.style.cursor = 'pointer';
    saveButton.addEventListener('click', async () => {
        const updatedPieces = Array.from(piecesContainer.children).map(child =>
            child.dataset.ref + ':' + child.dataset.qty
        );
        enregistrement.zoneTexte3 = updatedPieces.length > 0 ? `[${updatedPieces.join(',')}]` : '[]';
        await setPrefixedItem('enregistrements', JSON.stringify(enregistrements));
        document.body.removeChild(modal);
        document.body.removeChild(overlay); // Supprimer l'overlay
        afficherEnregistrements();
    });

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Annuler';
    cancelButton.style.backgroundColor = '#ccc';
    cancelButton.style.color = 'black';
    cancelButton.style.border = 'none';
    cancelButton.style.padding = '5px 10px';
    cancelButton.style.borderRadius = '5px';
    cancelButton.style.cursor = 'pointer';
    cancelButton.addEventListener('click', () => {
        if (refInput.value.trim() || qtyInput.value !== '1') {
            const confirmation = confirm(
                'Vous avez des modifications en cours. Êtes-vous sûr de vouloir quitter sans enregistrer ?'
            );
            if (!confirmation) return;
        }
        document.body.removeChild(modal);
        document.body.removeChild(overlay); // Supprimer l'overlay
    });

    actionButtons.appendChild(cancelButton);
    actionButtons.appendChild(saveButton);

    modal.appendChild(actionButtons);
    document.body.appendChild(modal);

  function addPieceToContainer(container, ref, qty) {
    if (!ref || isNaN(qty) || qty <= 0) return;

    // récupère la place via l’objet "pieces"
    const pieceObj = findPieceById(pieces, ref);
    const place = pieceObj && pieceObj.place ? pieceObj.place : '';

    const pieceElement = document.createElement('div');
    pieceElement.classList.add('piece-bubble');
    pieceElement.dataset.id = ref;          // ID caché
    pieceElement.dataset.qty = qty;
    pieceElement.dataset.place = place || '';

    pieceElement.style.padding = '5px 10px';
    pieceElement.style.backgroundColor = '#f8f9fa';
    pieceElement.style.border = '1px solid #ccc';
    pieceElement.style.borderRadius = '5px';
    pieceElement.style.display = 'flex';
    pieceElement.style.alignItems = 'center';
    pieceElement.style.gap = '10px';

    const pieceText = document.createElement('span');
    pieceText.textContent = place ? `${place}  (Q=${qty})` : `Place inconnue  (Q=${qty})`;

    const editButton = document.createElement('button');
    editButton.textContent = '✏️';
    editButton.style.backgroundColor = '#ffc107';
    editButton.style.color = 'black';
    editButton.style.border = 'none';
    editButton.style.borderRadius = '5px';
    editButton.style.padding = '5px';
    editButton.style.cursor = 'pointer';
    editButton.addEventListener('click', () => {
        const refInput = document.querySelector('input[type="text"]');
        const qtyInput = document.querySelector('input[type="number"]');
        if (refInput) refInput.value = ref;
        if (qtyInput) qtyInput.value = qty;
        container.removeChild(pieceElement);
    });

    const deleteButton = document.createElement('button');
    deleteButton.textContent = '🗑️';
    deleteButton.style.backgroundColor = '#dc3545';
    deleteButton.style.color = 'white';
    deleteButton.style.border = 'none';
    deleteButton.style.borderRadius = '5px';
    deleteButton.style.padding = '5px';
    deleteButton.style.cursor = 'pointer';
    deleteButton.addEventListener('click', () => container.removeChild(pieceElement));

    pieceElement.appendChild(pieceText);
    pieceElement.appendChild(editButton);
    pieceElement.appendChild(deleteButton);
    container.appendChild(pieceElement);
}


}


function parsePiecesPayload(payloadStr) {
  // accepte: "[PIE1:2@A/1/C/03, PIE2:1@B/2/A/07]" ou "PIE1:2@..., PIE2:1@..."
  if (!payloadStr || typeof payloadStr !== 'string') return [];
  const s = payloadStr.trim().replace(/^\[/, '').replace(/\]$/, '');
  if (!s) return [];
  return s.split(',')
    .map(x => x.trim())
    .filter(Boolean)
    .map(chunk => {
      // "ID:QTT@PLACE"
      const [left, placeRaw=''] = chunk.split('@');
      const [idRaw, qtyRaw=''] = (left || '').split(':');
      const id = (idRaw || '').trim();
      const qty = parseInt((qtyRaw || '').trim(), 10) || 1;
      const place = (placeRaw || '').trim();
      if (!id) return null;
      return { id, qty, place };
    })
    .filter(Boolean);
}


let lieuGlobal = null; // Ou placez ici la valeur initiale si nécessaire

// helper pour laisser le navigateur peindre avant le travail lourd
function __afterPaint() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame !== 'function') {
      setTimeout(resolve, 0);
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

async function ouvrirModalModifierPiece(Lieu, Pièces) {
  // mémorise le lieu courant
  lieuGlobal = Lieu;

  // ouvre la modal immédiatement
  const modal = document.getElementById('modifierPieceModal');
  if (modal) modal.style.display = 'block';

  // loader léger dans la modal
  let __loader = document.getElementById('__loaderModifierPiece');
  if (!__loader) {
    __loader = document.createElement('div');
    __loader.id = '__loaderModifierPiece';
    __loader.setAttribute('aria-live', 'polite');
    __loader.style.cssText = 'padding:8px;font-size:12px;opacity:0.8';
    __loader.textContent = 'Chargement…';
    modal?.appendChild(__loader);
  }
  __loader.style.display = 'block';

  // Désactiver Bip.js et activer le scanner fantôme pour cette modal
  if (typeof pauseBip === 'function') pauseBip();
  attachModifierScannerForModifierPiece?.();

  // Réinitialiser les champs et les listes
  resetModal?.();

  // Titre
  const texteModal = document.getElementById('texteModal');
  const enregistrerModifications = document.getElementById('enregistrerModifications');

  if (!lieuGlobal || lieuGlobal === undefined) {
    if (texteModal) texteModal.innerText = 'Magasin portatifs';
    if (typeof selectedPiecesContainer !== 'undefined') selectedPiecesContainer.style.display = "none";
    if (typeof btnScannerBoite !== 'undefined') btnScannerBoite.style.display = "none";
    if (enregistrerModifications) enregistrerModifications.textContent = "Fermer";
  } else if (texteModal) {
    texteModal.innerText = 'Sortie de pièces : ' + lieuGlobal;
    if (typeof selectedPiecesContainer !== 'undefined') selectedPiecesContainer.style.display = "block";
    if (typeof btnScannerBoite !== 'undefined') btnScannerBoite.style.display = "block";
    if (enregistrerModifications) enregistrerModifications.textContent = "Enregistrer";
  } else {
    console.error("L'élément #texteModal est introuvable.");
  }

  // Laisse le navigateur peindre la modal + loader avant de faire le travail coûteux
  await __afterPaint();

  // --- parsing au nouveau format ---
  let piecesParsed = [];
  try {
    if (typeof Pièces === 'string' && Pièces.trim() !== '') {
      piecesParsed = parsePiecesPayload(Pièces);
    }
  } catch (e) {
    console.warn('parsePiecesPayload a échoué :', e);
    piecesParsed = [];
  }

  // --- remplir l’arborescence des pièces (côté gauche) sans recharger si déjà construite pour ce lieu ---
  try {
    const arborescencePieces = document.getElementById('arborescencePieces');
    const nomPieceActuel = "NomDeLaPiece";
    if (arborescencePieces) {
      const dejaConstruitPourLieu = arborescencePieces.getAttribute('data-lieu') === String(lieuGlobal || '');
      const estVide = arborescencePieces.children.length === 0;

      if (!dejaConstruitPourLieu || estVide) {
        arborescencePieces.innerHTML = '';
        parcourirArborescenceSansPreconfigurationIterative?.(
          pieces,            // objet global "pieces"
          arborescencePieces,
          '',
          nomPieceActuel,
          []
        );
        arborescencePieces.setAttribute('data-lieu', String(lieuGlobal || ''));
      }
    }
  } catch (e) {
    console.warn('Impossible de construire arborescencePieces :', e);
  }

  // --- afficher les bulles à partir des données initiales ---
  try {
    if (Array.isArray(piecesParsed) && piecesParsed.length > 0) {
      const selectedPiecesList = document.getElementById('selectedPiecesList');
      if (selectedPiecesList) {
        selectedPiecesList.innerHTML = '';
        const batchSize = 50;
        for (let i = 0; i < piecesParsed.length; i += batchSize) {
          const slice = piecesParsed.slice(i, i + batchSize);
          slice.forEach(({ id, qty, place }) => {
            const placeFinal = (place && place.trim()) ? place.trim() : (getPlaceById?.(id) || '');
            createPieceBubble(id, qty, placeFinal);
          });
          // respiration UI entre lots
          // eslint-disable-next-line no-await-in-loop
          await __afterPaint();
        }
      }
    }
  } catch (e) {
    console.warn('Affichage des bulles impossible :', e);
  } finally {
    if (__loader) __loader.style.display = 'none';
  }
}


// Fonction pour réinitialiser la modal
function resetModal() {
    // Réinitialiser la liste des pièces sélectionnées
    const selectedPiecesList = document.getElementById('selectedPiecesList');
    if (selectedPiecesList) {
        selectedPiecesList.innerHTML = '';
    }

    // Réinitialiser les champs de texte ou autres données
    const refInput = document.querySelector('input[type="text"]');
    if (refInput) {
        refInput.value = '';
    }

    const qtyInput = document.querySelector('input[type="number"]');
    if (qtyInput) {
        qtyInput.value = '1';
    }

    // Garder les données d'arborescence intactes
    const arborescencePieces = document.getElementById('arborescencePieces');
    if (arborescencePieces) {
        clearSearchInput3()
        //arborescencePieces.innerHTML = ''; // Réinitialiser uniquement si nécessaire
    }
}




// Fonction de suppression de pièce
function supprimerPiece(idPiece) {
    const selectedPiecesList = document.getElementById('selectedPiecesList');
    const pieces = selectedPiecesList.querySelectorAll('.piece-bubble');

    pieces.forEach(piece => {
        // Vérifier si l'élément contient l'ID de la pièce à supprimer
        if (piece.dataset.id === idPiece) {
            selectedPiecesList.removeChild(piece); // Retirer la bulle de la liste
        }
    });
}



function choisirpieces(lieu, idPiece) {
  const existing = findBubbleById(idPiece);   // ✅ plus de "const existing =" en double
  if (existing) {
    const qty = existing.querySelector('input[type="number"]');
    qty.value = (parseInt(qty.value, 10) || 0) + 1;
  } else {
    createPieceBubble(idPiece, 1);
  }
}



function fermerModalModifierPiece() {
  const modal = document.getElementById('modifierPieceModal');

  // Nettoyage + réactiver Bip.js
  if (typeof detachModifierScanner === 'function') detachModifierScanner();
  if (typeof resumeBip === 'function') resumeBip();

  if (modal) modal.style.display = 'none';
}

function enregistrerModifications() {
  const selectedPiecesList = document.getElementById('selectedPiecesList');
  if (!selectedPiecesList) {
    console.warn('[enregistrerModifications] #selectedPiecesList introuvable');
    fermerModalModifierPiece();
    return;
  }

  const bubbles = selectedPiecesList.getElementsByClassName('piece-bubble');
  const items = [];
  for (let i = 0; i < bubbles.length; i++) {
    const b = bubbles[i];
    const id = (b.dataset.id || '').trim();
    const place = (b.dataset.place || '').trim();
    const qty = parseInt((b.querySelector('input[type="number"]')?.value || '0'), 10);
    if (!id || isNaN(qty) || qty <= 0) continue;
    items.push(`${id}:${qty}@${place}`);
  }
  const payload = items.length ? `[${items.join(', ')}]` : '[]';

  const ctx = window.modalContext || { origin: null, targetId: null, sourceWindow: null };
  const idOrLieu = ctx.targetId || window.lieuGlobal || '';

  // ---- ROUTAGE ----
  if (ctx.origin === 'gestion') {
    // ➜ Mise à jour locale (Gestion.js)
    if (typeof window.onPiecesModified === 'function') {
      window.onPiecesModified({ id: idOrLieu, pieces: payload });
    }
  } else if (ctx.origin === 'iframe') {
    // ➜ Retour uniquement à l’iframe qui a lancé la modale (via son contentWindow)
    if (ctx.sourceWindow && typeof ctx.sourceWindow.postMessage === 'function') {
      ctx.sourceWindow.postMessage({
        type: 'modifierPieces',
        lieu: window.lieuGlobal || idOrLieu, // ⚠️ les iframes s’identifient par le lieu
        pieces: payload
      }, '*');
    }
  } else {
    console.warn('[enregistrerModifications] Contexte inconnu, aucune diffusion.');
  }

  // reset + close
  window.modalContext = { origin: null, targetId: null, sourceWindow: null };
  fermerModalModifierPiece();
}






function normalizeString(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9\s]/g, "");
}

function parcourirArborescenceSansPreconfigurationIterative(arbre, parent, cheminParent = '', nomLieuActuel, listeEnregistree = []) {
    const stack = [{
        node: arbre,
        parent: parent,
        chemin: cheminParent,
        niveau: 0
    }];
    const visitedNodes = new WeakSet();

    while (stack.length > 0) {
        const {
            node,
            parent,
            chemin,
            niveau
        } = stack.pop();

        if (visitedNodes.has(node)) {
            console.warn("Référence cyclique détectée !");
            continue;
        }
        visitedNodes.add(node);

        if (!node || typeof node !== 'object') continue;

        for (const lieu in node) {
            const currentNode = node[lieu];
            const cheminComplet = chemin + (chemin ? ' > ' : '') + lieu;

            const lieuItem = document.createElement('li');

            // Vérifier si le nœud est un dernier niveau avec un ID valide
            const isLastLevel = currentNode && typeof currentNode === 'object' && currentNode.hasOwnProperty('id');

            if (isLastLevel) {
                const idPiece = currentNode.id; // Récupère l'ID de la pièce

                // Si l'ID existe, créer le bouton, sinon logguer une erreur
if (idPiece) {
  const lieuItemDiv = document.createElement('div');
  lieuItemDiv.className = `place-card level-${niveau}`;

  const span = document.createElement('span');
  span.textContent = lieu;
  lieuItemDiv.appendChild(span);

  const btn = document.createElement('button');
  btn.textContent = '👆';
  btn.addEventListener('click', function () {
    choisirpieces(lieu, idPiece, btn);
  });
  lieuItemDiv.appendChild(btn);

  lieuItem.innerHTML = ''; // nettoie si besoin
  lieuItem.appendChild(lieuItemDiv);
} else {
  console.error(`ID manquant pour le lieu : ${lieu}`);
}

            } else {
                lieuItem.innerHTML = `
                    <div class="place-card level-${niveau}" onclick="toggleNiveau2(this, ${niveau})">
                        <span>> ${lieu}</span>
                    </div>`;
            }

            parent.appendChild(lieuItem);

            // Ajouter les enfants uniquement si ce n'est pas un dernier niveau
            if (!isLastLevel && currentNode && typeof currentNode === 'object') {
                const sousLieuxList = document.createElement('ul');
                sousLieuxList.style.display = 'none';
                lieuItem.appendChild(sousLieuxList);
                stack.push({
                    node: currentNode,
                    parent: sousLieuxList,
                    chemin: cheminComplet,
                    niveau: niveau + 1
                });
            }
        }
    }
}







function toggleNiveau2(element, niveau) {
    const ulElement = element.parentElement.querySelector('ul');
    if (ulElement) {
        const isHidden = ulElement.style.display === 'none' || ulElement.style.display === '';
        ulElement.style.display = isHidden ? 'block' : 'none';

        const iconElement = element.querySelector('span');
        if (iconElement) {
            // Modifier l'icône (> ou ∨)
            const texteElement = iconElement.textContent.trim();
            iconElement.textContent = (isHidden ? '∨' : '>') + ' ' + texteElement;
        }
    }
}



let isMouseDown = false;
let startX2;
let scrollLeft2;

const container = document.querySelector('#selectedPiecesContainer');
const content = document.querySelector('#selectedPiecesList');

container.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    startX2 = e.pageX - content.offsetLeft;
    scrollLeft2 = content.scrollLeft; // Correction ici
    container.style.cursor = 'grabbing';
});

container.addEventListener('mouseleave', () => {
    isMouseDown = false;
    container.style.cursor = 'grab';
});

container.addEventListener('mouseup', () => {
    isMouseDown = false;
    container.style.cursor = 'grab';
});

container.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const scroll = (x - startX2) * 2; // Multiplier pour rendre le glissement plus rapide
    content.scrollLeft = scrollLeft2 - scroll; // Correction ici
});



function loadModalContent(modalId, jsonPath) {
    fetch(jsonPath)
        .then(response => response.json())
        .then(data => {
            // Sélectionner les éléments nécessaires dans la modal
            const modal = document.querySelector(`#${modalId}`);
            const titleElement = modal.querySelector(".modal-content-tuto h1");
            const scrollContainer = modal.querySelector(".modal-content-tuto div[style*='overflow-y: auto']");

            // Injecter le titre
            if (titleElement) {
                titleElement.innerText = data.title;
            }

            // Construire le contenu HTML
            let contentHtml = `<h1 style="font-size: 16px; color: blue;">${data.accessInfo}</h1>`;
            contentHtml += `<p style="font-size: 16px; color: black; line-height: 1.5;">${data.intro}</p>`;

            // Ajouter les sections dynamiques
            data.sections.forEach(section => {
                contentHtml += `<h2>${section.title}</h2><ul>`;
                section.content.forEach(item => {
                    contentHtml += `<li><strong>${item.heading}</strong>: ${item.description}`;
                    if (item.image) {
                        contentHtml += `<br><img src="${item.image}" alt="${item.heading}" style="width: 100%; max-width: 600px;">`;
                    }
                    if (item.subpoints) {
                        contentHtml += "<ul>";
                        item.subpoints.forEach(point => {
                            contentHtml += `<li>${point}</li>`;
                        });
                        contentHtml += "</ul>";
                    }
                    contentHtml += `</li>`;
                });
                contentHtml += `</ul>`;
            });

            // Ajouter la conclusion
            contentHtml += `<p style="font-size: 16px; color: black; line-height: 1.5;">${data.closing}</p>`;

            // Injecter le contenu dans le conteneur défilant
            if (scrollContainer) {
                scrollContainer.innerHTML = contentHtml;
            }
        })
        .catch(error => console.error(`Erreur lors du chargement du contenu de ${jsonPath} :`, error));
}



// Bouton pour ouvrir la modal
document.getElementById("btnScannerBoite").addEventListener("click", function () {
    const modal = document.getElementById("scannerModal");
    modal.style.display = "block";
changerCouleur();
    // Focus sur l'input masqué
    const scannerInput = document.getElementById("scannerInput");
    //scannerInput.focus();
});

// Bouton pour fermer la modal
document.getElementById("closeScannerModal").addEventListener("click", function () {
    document.getElementById("scannerModal").style.display = "none";
});

document.getElementById("scannerInput").addEventListener("input", function (e) {
  const barcode = extractBarcode(e.target.value);
  if (barcode) {
    cherBarre(barcode);   // ou addOrIncrementByBarcode(barcode) selon ton choix
    e.target.value = "";
  }
});

function findPieceByBarcode(obj, barcode) {
    for (const key in obj) {
        if (typeof obj[key] === 'object') {
            if (obj[key].barcode === barcode) {
                return obj[key];  // Retourne l'objet si trouvé
            } else {
                const result = findPieceByBarcode(obj[key], barcode);
                if (result) return result;  // Continue la recherche dans les sous-objets
            }
        }
    }
    return null;  // Retourne null si rien n'est trouvé
}

function cherBarre(barcode) {
  addOrIncrementByBarcode(barcode);
  const sm = document.getElementById("scannerModal");
  if (sm) sm.style.display = "none";
}




async function afficherModalTechniciens(enregistrement, techniciensExclus = []) {
    // Récupérer le nom de l'utilisateur dans l'URL (par exemple, "?user=NomUtilisateur")
    const urlParams = new URLSearchParams(window.location.search);
    const utilisateurExclu = urlParams.get('user');



    // Charger les techniciens depuis le fichier JSON
    fetch('../users.json')
        .then(response => response.json())
        .then(data => {
            // Créer et afficher la modal
            const modalDiv = document.createElement('div');
            modalDiv.className = 'modal';
            modalDiv.style.display = 'block'; // Afficher la modal
            modalDiv.innerHTML = `
                <div class="modal-content">
                    <span class="close-button" onclick="fermerModal(this)">&times;</span>
                    <h2>Sélectionnez un technicien supplémentaire</h2>
                    <label for="technicienSelect">Technicien :</label>
                    <select id="technicienSelect"></select>
                    
                    <h3>Temps passé</h3>
                    <div class="temps-selection">
                        <label for="joursSelect">J:</label>
                        <select id="joursSelect"></select>
                        <label for="heuresSelect">H:</label>
                        <select id="heuresSelect"></select>
                        <label for="minutesSelect">M:</label>
                        <select id="minutesSelect"></select>
                        <label for="secondesSelect">S:</label>
                        <select id="secondesSelect"></select>
                    </div>
                    
                    <button id="ajouterTechnicienButton">Ajouter</button>
                </div>
            `;

            // Remplir la liste déroulante avec les techniciens (exclure "Gestion", l'utilisateur de l'URL et les techniciens déjà ajoutés)
            const technicienSelect = modalDiv.querySelector('#technicienSelect');
            for (const [nom, hash] of Object.entries(data)) {
                if (nom !== "Gestion" && !techniciensExclus.includes(nom)) { // Exclure "Gestion", l'utilisateur et les techniciens déjà ajoutés
                    const option = document.createElement('option');
                    option.value = hash;
                    option.textContent = nom;
                    technicienSelect.appendChild(option);
                }
            }

            // Extraire les jours, heures, minutes et secondes du temps de l'enregistrement (ex : "5j 5h 32m 2s")
            const regexTemps = /(?:(\d+)j)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/;
            const match = regexTemps.exec(enregistrement.temps);

            let joursParDefaut = 0,
                heuresParDefaut = 0,
                minutesParDefaut = 0,
                secondesParDefaut = 0;
            if (match) {
                joursParDefaut = parseInt(match[1], 10) || 0; // Jours
                heuresParDefaut = parseInt(match[2], 10) || 0; // Heures
                minutesParDefaut = parseInt(match[3], 10) || 0; // Minutes
                secondesParDefaut = parseInt(match[4], 10) || 0; // Secondes
            }

            // Remplir la liste des jours avec la valeur par défaut
            const joursSelect = modalDiv.querySelector('#joursSelect');
            for (let i = 0; i <= 30; i++) { // Sélection de 0 à 30 jours
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i;
                if (i === joursParDefaut) option.selected = true; // Sélectionner les jours par défaut
                joursSelect.appendChild(option);
            }

            // Remplir la liste des heures avec la valeur par défaut
            const heuresSelect = modalDiv.querySelector('#heuresSelect');
            for (let i = 0; i <= 23; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i;
                if (i === heuresParDefaut) option.selected = true; // Sélectionner l'heure par défaut
                heuresSelect.appendChild(option);
            }

            // Remplir la liste des minutes avec la valeur par défaut
            const minutesSelect = modalDiv.querySelector('#minutesSelect');
            for (let i = 0; i < 60; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i.toString().padStart(2, '0'); // Ajouter un zéro au début si nécessaire
                if (i === minutesParDefaut) option.selected = true; // Sélectionner les minutes par défaut
                minutesSelect.appendChild(option);
            }

            // Remplir la liste des secondes avec la valeur par défaut
            const secondesSelect = modalDiv.querySelector('#secondesSelect');
            for (let i = 0; i < 60; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i.toString().padStart(2, '0'); // Ajouter un zéro au début si nécessaire
                if (i === secondesParDefaut) option.selected = true; // Sélectionner les secondes par défaut
                secondesSelect.appendChild(option);
            }

            // Gestionnaire pour le bouton "Ajouter"
            modalDiv.querySelector('#ajouterTechnicienButton').addEventListener('click', () => {
                const selectedTechnicianName = technicienSelect.options[technicienSelect.selectedIndex].text;
                const jours = parseInt(joursSelect.value, 10);
                const heures = parseInt(heuresSelect.value, 10);
                const minutes = parseInt(minutesSelect.value, 10);
                const secondes = parseInt(secondesSelect.value, 10);

                // Construire la chaîne de temps en omettant les parties à 0 sauf pour les secondes
                let nouveauTemps = '';
                if (jours > 0) {
                    nouveauTemps += `${jours}j `;
                }
                if (heures > 0 || nouveauTemps) { // Inclure les heures si elles sont non nulles ou si les jours sont déjà présents
                    nouveauTemps += `${heures}h `;
                }
                if (minutes > 0 || nouveauTemps) { // Inclure les minutes si elles sont non nulles ou si les jours ou les heures sont déjà présents
                    nouveauTemps += `${minutes}m `;
                }
                // Toujours inclure les secondes, même si elles sont égales à 0
                nouveauTemps += `${secondes}s`;

                // Créer la duplication de l'intervention avec l'ajout du technicien et du nouveau temps
                const newEnregistrement = {
                    ...enregistrement,
                    Tech: selectedTechnicianName, // Ajout du nom du technicien
                    temps: nouveauTemps.trim() // Remplacer l'ancien temps par le nouveau, en supprimant les espaces de fin
                };

                // Ajouter l'enregistrement dupliqué dans localStorage
                const enregistrementsString = getPrefixedItem('enregistrements');
                let enregistrements = JSON.parse(enregistrementsString) || [];
                enregistrements.push(newEnregistrement);
                setPrefixedItem('enregistrements', JSON.stringify(enregistrements));

                // Mettre à jour l'affichage
                afficherEnregistrements();

                // Fermer la modal
                fermerModal(modalDiv);
            });

            document.body.appendChild(modalDiv);
        })
        .catch(error => {
            console.error('Erreur lors du chargement des techniciens:', error);
        });
}





function fermerModal(buttonElement) {
    // Remonter au parent ayant la classe 'modal'
    const modalElement = buttonElement.closest('.modal');

    if (modalElement && modalElement.parentNode) {
        modalElement.style.display = 'none';
        modalElement.parentNode.removeChild(modalElement); // Assurez-vous que modalElement est bien un enfant de son parent
    }
}


    // --- scanner fantôme pour modifierPieceModal ---
let detachModifierScanner = null;

function attachModifierScannerForModifierPiece() {
  // Crée un input invisible qui reçoit le focus (les douchettes USB tapent au clavier)
  let input = document.getElementById('modifierScannerInput');
  if (!input) {
    input = document.createElement('input');
    input.id = 'modifierScannerInput';
    input.type = 'text';
    input.autocomplete = 'off';
    input.style.position = 'fixed';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    input.style.width = '1px';
    input.style.height = '1px';
    input.tabIndex = -1;
    document.body.appendChild(input);
  }
  input.value = '';
  //input.focus();

const onInput = function (e) {
  const txt = e.target.value;

  // tolère scan-123-fin, scan-http://123-fin, scan-https://123-fin
  const m = /^scan-(?:https?:\/\/)?(\d+)-fin$/i.exec((txt || '').trim());
  const barcode = m ? m[1] : null;

  if (barcode) {
    // ✅ clé : on passe par la logique qui cherche la bulle par ID et propose “+1 ?”
    addOrIncrementByBarcode(barcode);
    e.target.value = ''; // prêt pour le prochain scan
  }
};



  // attache
  input.addEventListener('input', onInput);

  // fonction de nettoyage (détacher + enlever l’input)
  detachModifierScanner = function () {
    input.removeEventListener('input', onInput);
    // optionnel: supprimer l'input pour éviter les fuites
    if (input && input.parentNode) input.parentNode.removeChild(input);
    detachModifierScanner = null;
  };
}

function getSelectedPiecesList() {
  return document.getElementById('selectedPiecesList');
}

function createPieceBubble(idPiece, qty, placeOverride = null) {
  const selectedPiecesList = document.getElementById('selectedPiecesList');
  if (!selectedPiecesList) {
    console.warn('[createPieceBubble] #selectedPiecesList introuvable');
    return null;
  }

  const safeId = String(idPiece ?? '').trim();
  const addQty = Math.max(1, parseInt(qty, 10) || 1);

  // si déjà présent → on incrémente seulement la quantité
  const existing = selectedPiecesList.querySelector(
    `.piece-bubble[data-id="${CSS.escape(safeId)}"]`
  );
  if (existing) {
    const q = existing.querySelector('input[type="number"]');
    const current = parseInt(q.value, 10) || 0;
    q.value = current + addQty;
    existing.style.outline = '2px solid #28a745';
    setTimeout(() => { existing.style.outline = ''; }, 350);
    return existing;
  }

  // place (override > lookup > vide)
  const pieceObj = findPieceById(pieces, safeId);
  const placeLookup = pieceObj && pieceObj.place ? String(pieceObj.place) : '';
  const place = placeOverride && placeOverride.trim() ? placeOverride.trim() : placeLookup;

  const bubble = document.createElement('div');
  bubble.classList.add('piece-bubble');
  bubble.dataset.id = safeId;          // ID caché
  bubble.dataset.place = place || '';


  const label = document.createElement('span');
  label.textContent = place ? `${place}` : `Place inconnue`;

const quantityInput = document.createElement('input');
quantityInput.type = 'number';
quantityInput.min = '1';
quantityInput.value = addQty;
quantityInput.style.width = '50px';
quantityInput.style.textAlign = 'center';

// ✅ On laisse l’utilisateur taper librement
quantityInput.addEventListener('blur', () => {
  const v = parseInt(quantityInput.value, 10);
  // Si vide, NaN, ou < 1 → remet à 1
  if (isNaN(v) || v < 1) {
    quantityInput.value = 1;
  }
});

// (optionnel) empêche d’entrer des valeurs négatives via la molette
quantityInput.addEventListener('wheel', e => {
  if (document.activeElement === quantityInput) e.preventDefault();
});


  const deleteButton = document.createElement('button');
  deleteButton.textContent = '🗑️';
  deleteButton.style.backgroundColor = '#dc3545';
  deleteButton.style.color = 'white';
  deleteButton.style.border = 'none';
  deleteButton.style.borderRadius = '5px';
  deleteButton.style.padding = '5px';
  deleteButton.style.cursor = 'pointer';
  deleteButton.addEventListener('click', () => supprimerPiece(safeId));

  bubble.appendChild(label);
  bubble.appendChild(quantityInput);
  bubble.appendChild(deleteButton);

  selectedPiecesList.appendChild(bubble);
  return bubble;
}


function addOrIncrementPiece(idPiece, incrementIfExists = 1) {
  const existing = findBubbleById(idPiece);   // ✅ corrigé

  if (existing) {
    const qtyInput = existing.querySelector('input[type="number"]');
    const current = parseInt(qtyInput.value, 10) || 0;

    const doit = confirm(
      `La pièce ${idPiece} est déjà dans la liste (Q=${current}).\n\nVoulez-vous ajouter +${incrementIfExists} ?`
    );
    if (doit) {
      qtyInput.value = current + incrementIfExists;
      existing.style.outline = '2px solid #28a745';
      setTimeout(() => { existing.style.outline = ''; }, 400);
    }
    return;
  }
  createPieceBubble(idPiece, 1);
}



function findPieceById(obj, id) {
  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      if (obj[key].id === id) return obj[key];
      const r = findPieceById(obj[key], id);
      if (r) return r;
    }
  }
  return null;
}
function addOrIncrementByBarcode(barcode) {
  const selectedPiecesList = document.getElementById('selectedPiecesList');
  if (!selectedPiecesList) return;

  const scannedPiece = findPieceByBarcode(pieces, barcode);
  if (!scannedPiece) { alert("Code-barres introuvable !"); return; }

  const id = (scannedPiece.id || '').trim();  // ✅ bonne variable

  const existing = findBubbleById(id);        // ✅ pas "idPiece" ici
  if (existing) {
    const qtyInput = existing.querySelector('input[type="number"]');
    const current = parseInt(qtyInput.value, 10) || 0;

    const ok = confirm(
      `La pièce (ID=${id}, barcode=${barcode}) est déjà dans la liste (Q=${current}).\n\nVoulez-vous ajouter +1 ?`
    );
    if (ok) {
      qtyInput.value = current + 1;
      existing.style.outline = '2px solid #28a745';
      setTimeout(() => { existing.style.outline = ''; }, 350);
    }
    return;
  }
  createPieceBubble(id, 1);
}


function extractBarcode(input) {
  // Accepte: brut, "scan-123-fin", "scan-http://123-fin", "scan-https://123-fin"
  const s = String(input ?? '').trim();
  const m = /(\d+)/.exec(s);
  return m ? m[1] : null;
}

function cssEscapeSafe(str) {
  if (window.CSS && typeof CSS.escape === 'function') return CSS.escape(str);
  return String(str).replace(/["\\]/g, '\\$&').replace(/\0/g, '\uFFFD');
}

function findBubbleById(id) {
  const selectedPiecesList = document.getElementById('selectedPiecesList');
  if (!selectedPiecesList) return null;
  return selectedPiecesList.querySelector(
    `.piece-bubble[data-id="${cssEscapeSafe(String(id))}"]`
  );
}

function getPlaceById(id) {
  const p = findPieceById(pieces, id); // tu as déjà findPieceById(obj, id)
  return p && typeof p.place === 'string' && p.place.trim() ? p.place.trim() : null;
}

function findPieceById(obj, id) {
  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      if (obj[key].id === id) return obj[key];
      const r = findPieceById(obj[key], id);
      if (r) return r;
    }
  }
  return null;
}
