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
        const icon = (Object.keys(arbre[lieu]).length > 0) ? '▶' : ' ';
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


function searchLieu2(arbre) {
    const clearButton2 = document.getElementById('clearButton2'); // Bouton de nettoyage de la seconde barre de recherche
    const searchInput2 = document.getElementById('searchInput2'); // Champ de texte de la seconde barre de recherche
    const searchTerm2 = normalizeString2(searchInput2.value.toLowerCase());

    const arborescenceLieux = document.getElementById('arborescenceLieux'); // L'élément contenant la liste des lieux dans la modal
    const lieuxItems2 = arborescenceLieux.querySelectorAll('li'); // Tous les éléments `li` de la liste des lieux

    // Afficher ou masquer le bouton de nettoyage en fonction de la valeur de la recherche
    clearButton2.style.display = searchInput2.value.trim() !== '' ? 'block' : 'none';

    // Parcourir la liste des lieux
    for (let i = 0; i < lieuxItems2.length; i++) {
        const lieuItem2 = lieuxItems2[i];
        const placeCard2 = lieuItem2.querySelector('.place-card');

        if (placeCard2) {
            const placeCardText2 = normalizeString2(placeCard2.innerText.toLowerCase());
            const matchesSearch2 = placeCardText2.includes(searchTerm2);

            // Masquer ou afficher la place-card en fonction de la correspondance
            placeCard2.style.display = matchesSearch2 ? 'block' : 'none';
        }

        const lieuName2 = normalizeString2(lieuItem2.innerText.toLowerCase());
        const searchTerms2 = searchTerm2.split(/\s+/);
        const matchesSearch2 = searchTerms2.every(term => lieuName2.includes(term));

        if (matchesSearch2) {
            // Afficher l'élément trouvé
            lieuItem2.style.display = 'block';
            lieuItem2.classList.add('active');

            // Ouvrir les branches jusqu'à cet élément
            let parent2 = lieuItem2.parentElement;
            while (parent2 && parent2 !== arborescenceLieux) {
                if (parent2.tagName === 'UL') {
                    parent2.style.display = 'block';
                }
                parent2 = parent2.parentElement;
            }
        } else {
            // Cacher les éléments qui ne correspondent pas
            lieuItem2.style.display = 'none';
            lieuItem2.classList.remove('active');
        }
    }

    // Refermer toutes les branches si la zone de recherche est vide
    if (searchTerm2 === '') {
        const allBranches2 = arborescenceLieux.querySelectorAll('ul');
        allBranches2.forEach(branch => {
            branch.style.display = 'none';
        });
    }
}

function clearSearchInput2() {
    const searchInput2 = document.getElementById('searchInput2');
    searchInput2.value = '';

    // Cacher le bouton après avoir effacé la zone de texte
    const clearButton2 = document.getElementById('clearButton2');

    searchLieu2(); // Relancer la recherche avec une zone de texte vide
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
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Fond gris semi-transparent
    overlay.style.zIndex = '999'; // En dessous de la modal
    document.body.appendChild(overlay);

    // Création de la modal
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '5%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, 0%)';
    modal.style.backgroundColor = '#dadada';
    modal.style.border = '1px solid #ccc';
    modal.style.padding = '10px';
    modal.style.borderRadius = '10px';
    modal.style.zIndex = '1000'; // Au-dessus de l'overlay
    modal.style.width = '90%';
    modal.style.boxShadow = '0px 4px 10px rgba(0, 0, 0, 0.1)';

    // Titre de la modal
    const title = document.createElement('h3');
    title.textContent = 'Modifier les pièces sorties';
    title.style.cssText = 'color: black !important; margin-bottom: 10px;';


    modal.appendChild(title);

    // Conteneur des pièces existantes
    const piecesContainer = document.createElement('div');
    piecesContainer.style.border = '1px solid #ccc';
    piecesContainer.style.borderRadius = '5px';
    piecesContainer.style.padding = '10px';
    piecesContainer.style.marginBottom = '10px';
    piecesContainer.style.display = 'flex';
    piecesContainer.style.flexWrap = 'wrap';
    piecesContainer.style.gap = '10px';
    piecesContainer.style.backgroundColor = '#f9f9f9';

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
        const ref = refInput.value.trim();
        const qty = parseInt(qtyInput.value, 10);

        if (!ref || isNaN(qty) || qty <= 0) {
            alert('Veuillez entrer une référence valide et une quantité.');
            return;
        }

        addPieceToContainer(piecesContainer, ref, qty);
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

    // Ajouter des pièces au conteneur
    function addPieceToContainer(container, ref, qty) {
        if (!ref || isNaN(qty) || qty <= 0) return;

        const pieceElement = document.createElement('div');
        pieceElement.dataset.ref = ref;
        pieceElement.dataset.qty = qty;
        pieceElement.style.padding = '5px 10px';
        pieceElement.style.backgroundColor = '#f8f9fa';
        pieceElement.style.border = '1px solid #ccc';
        pieceElement.style.borderRadius = '5px';
        pieceElement.style.display = 'flex';
        pieceElement.style.alignItems = 'center';
        pieceElement.style.gap = '10px';

        const pieceText = document.createElement('span');
        pieceText.textContent = `${ref} Q=${qty}`;

        const editButton = document.createElement('button');
        editButton.textContent = '✏️';
        editButton.style.backgroundColor = '#ffc107';
        editButton.style.color = 'black';
        editButton.style.border = 'none';
        editButton.style.borderRadius = '5px';
        editButton.style.padding = '5px';
        editButton.style.cursor = 'pointer';

        editButton.addEventListener('click', () => {
            refInput.value = ref;
            qtyInput.value = qty;
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
        deleteButton.addEventListener('click', () => {
            container.removeChild(pieceElement);
        });

        pieceElement.appendChild(pieceText);
        pieceElement.appendChild(editButton);
        pieceElement.appendChild(deleteButton);
        container.appendChild(pieceElement);
    }
}




let lieuGlobal = null; // Ou placez ici la valeur initiale si nécessaire
function ouvrirModalModifierPiece(Lieu, Pièces) {
    // Affecter le lieu passé en argument à la variable globale
    lieuGlobal = Lieu;

    const modal = document.getElementById('modifierPieceModal');
    modal.style.display = 'block';

    // Réinitialiser les champs et les listes
    resetModal();

    // Mettre à jour le texte de la modal avec le nom du lieu
    const texteModal = document.getElementById('texteModal');
    if (texteModal) {
        //texteModal.innerText = `Choisissez les pièces à ajouter pour : ${Lieu}`;
        texteModal.innerText = `Magasin portatif (BETA)`;
    } else {
        console.error('L\'élément texteModal est introuvable dans le DOM');
    }

    // Déclarer `piecesParsed` en dehors de la condition pour qu'elle soit accessible
    let piecesParsed = [];

    if (!Pièces || typeof Pièces !== 'string' || Pièces.trim() === '') {
        // Si Pièces est vide ou contient uniquement des espaces, ne rien faire
    } else {
        // Nettoyer et parser Pièces
        piecesParsed = Pièces.split(',').map(piece => {
            const cleanedPiece = piece.replace(/[\[\]]/g, ''); // Retirer les crochets
            const [id, qtt] = cleanedPiece.split(':');

            if (id && qtt) {
                return {
                    id: id.trim(),
                    qtt: parseInt(qtt.trim(), 10)
                };
            } else {
                console.error(`Format invalide pour la pièce: ${piece}`);
                return null;
            }
        }).filter(piece => piece !== null); // Filtrer les pièces invalides

    }

    // Utiliser la fonction `parcourirArborescenceSansPreconfigurationIterative` pour gérer l'affichage des pièces
    const arborescencePieces = document.getElementById('arborescencePieces');
    const nomPieceActuel = "NomDeLaPiece"; // Exemple de valeur par défaut, remplacez par la logique appropriée
    parcourirArborescenceSansPreconfigurationIterative(pieces, arborescencePieces, '', 0, nomPieceActuel, []);

    // Vérifier si `piecesParsed` est bien un tableau valide
    if (Array.isArray(piecesParsed) && piecesParsed.length > 0) {
        const selectedPiecesList = document.getElementById('selectedPiecesList');
        selectedPiecesList.innerHTML = ''; // Vider la liste précédente

        piecesParsed.forEach(piece => {
            if (piece && typeof piece === 'object' && piece.id && piece.qtt !== undefined) {
                const idPiece = piece.id;
                const qtt = piece.qtt;

                // Ajouter chaque pièce comme une bulle
                const bubble = document.createElement('div');
                bubble.classList.add('piece-bubble');
                bubble.dataset.id = idPiece; // Ajouter l'ID à data-id

                const bubbleContent = document.createElement('span');
                bubbleContent.innerText = `ID: ${idPiece}`;

                const quantitySelector = document.createElement('input');
                quantitySelector.type = 'number';
                quantitySelector.value = qtt;
                quantitySelector.min = 1;

                const deleteButton = document.createElement('button');
                deleteButton.innerText = '🗑️';
                deleteButton.onclick = () => supprimerPiece(idPiece); // Suppression de la pièce

                bubble.appendChild(bubbleContent);
                bubble.appendChild(quantitySelector);
                bubble.appendChild(deleteButton);

                // Ajouter la bulle à la liste des pièces sélectionnées
                selectedPiecesList.appendChild(bubble);
            } else {
                console.error('La pièce n\'est pas au format attendu ou est invalide :', piece);
            }
        });
    } else {
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
        arborescencePieces.innerHTML = ''; // Réinitialiser uniquement si nécessaire
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




// Fonction pour ajouter une pièce sélectionnée
function choisirpieces(lieu, idPiece) {

    // Créer une nouvelle bulle pour la pièce
    const selectedPiecesList = document.getElementById('selectedPiecesList');

    const bubble = document.createElement('div');
    bubble.classList.add('piece-bubble');
    bubble.dataset.id = idPiece;

    const bubbleContent = document.createElement('span');
    bubbleContent.innerText = `ID: ${idPiece}`;

    const quantitySelector = document.createElement('input');
    quantitySelector.type = 'number';
    quantitySelector.value = 1;
    quantitySelector.min = 1;

    const deleteButton = document.createElement('button');
    deleteButton.innerText = '🗑️';
    deleteButton.onclick = () => supprimerPiece(idPiece);

    bubble.appendChild(bubbleContent);
    bubble.appendChild(quantitySelector);
    bubble.appendChild(deleteButton);

    selectedPiecesList.appendChild(bubble);
}



// Fonction pour fermer la modal des pièces
function fermerModalModifierPiece() {
    const modal = document.getElementById('modifierPieceModal');
    modal.style.display = 'none';
}

function enregistrerModifications() {
    // Récupère la liste des pièces sélectionnées
    const selectedPiecesList = document.getElementById('selectedPiecesList');
    const pieces = selectedPiecesList.getElementsByClassName('piece-bubble'); // Récupère toutes les bulles des pièces sélectionnées

    const piecesData = [];

    // Récupérer les ID et quantités des pièces sélectionnées
    for (let i = 0; i < pieces.length; i++) {
        const piece = pieces[i];
        const idPiece = piece.dataset.id; // ID de la pièce
        const quantity = piece.querySelector('input[type="number"]').value; // Quantité de la pièce

        // Vérifier si la quantité est un nombre valide avant de l'ajouter
        if (quantity && !isNaN(quantity) && quantity > 0) {
            piecesData.push(`${idPiece}:${quantity}`); // Ajouter l'ID et la quantité sous la forme ID:QTT
        }
    }

    // Créer la chaîne formatée ID:QTT,ID:QTT,... ou un tableau vide si aucune pièce
    const piecesDataString = piecesData.length > 0 ? "[" + piecesData.join(',') + "]" : "[]";

    // Récupérer toutes les iframes
    const iframes = document.getElementsByTagName('iframe');

    // Envoyer les données à toutes les iframes via postMessage
    for (let iframe of iframes) {
        iframe.contentWindow.postMessage({
            type: "modifierPieces",
            lieu: lieuGlobal,
            pieces: piecesDataString
        }, '*'); // '*' pour autoriser l'envoi à toutes les iframes
    }

    // Optionnel : Fermer la modale après enregistrement
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
                    lieuItem.innerHTML = `
                    <div class="place-card level-${niveau}">
                        <span>${lieu}</span>
                        <button onclick="choisirpieces('${lieu}', '${idPiece}', this)">👆</button>
                    </div>`;

                } else {
                    console.error(`ID manquant pour le lieu : ${lieu}`);
                }
            } else {
                lieuItem.innerHTML = `
                    <div class="place-card level-${niveau}" onclick="toggleNiveau2(this, ${niveau})">
                        <span>▶ ${lieu}</span>
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


function searchLieu3() {
    const searchInput = document.getElementById('searchInput3');
    const searchTerm = normalizeString(searchInput.value.toLowerCase());

    const clearButton = document.getElementById('clearButton2');
    clearButton.style.display = searchTerm.trim() !== '' ? 'block' : 'none';

    const arborescencePieces = document.getElementById('arborescencePieces');

    // Si le champ de recherche est vide, réinitialiser l'arborescence
    if (searchTerm === '') {
        // Réinitialiser tous les éléments visibles
        const lieuxItems = arborescencePieces.querySelectorAll('li');
        lieuxItems.forEach(lieuItem => {
            lieuItem.style.display = 'block'; // S'assurer que tous les éléments sont visibles
        });

        // Fermer toutes les branches
        const allBranches = arborescencePieces.querySelectorAll('ul');
        allBranches.forEach(branch => {
            branch.style.display = 'none';
        });

        // Réinitialiser les icônes des éléments de niveau supérieur
        const allPlaceCards = arborescencePieces.querySelectorAll('.place-card');
        allPlaceCards.forEach(placeCard => {
            const iconElement = placeCard.querySelector('span');
            if (iconElement) {
                const texteElement = iconElement.textContent.trim();
                iconElement.textContent = texteElement;
            }
        });

        return; // Sortir de la fonction
    }

    // Masquer tous les éléments au départ
    const lieuxItems = arborescencePieces.querySelectorAll('li');
    lieuxItems.forEach(lieuItem => {
        lieuItem.style.display = 'none';
    });

    // Rechercher uniquement dans les derniers niveaux (avec un bouton "Sélectionner")
    const lastLevelItems = Array.from(arborescencePieces.querySelectorAll('li')).filter(lieuItem => {
        return lieuItem.querySelector('button');
    });

    lastLevelItems.forEach(lieuItem => {
        const placeCard = lieuItem.querySelector('.place-card');
        if (placeCard) {
            const placeCardText = normalizeString(placeCard.innerText.toLowerCase());
            const matchesSearch = placeCardText.includes(searchTerm);

            if (matchesSearch) {
                // Afficher l'élément et tous ses parents
                let current = lieuItem;
                while (current && current !== arborescencePieces) {
                    current.style.display = 'block';

                    // Ouvrir le parent ul
                    const parentUl = current.parentElement;
                    if (parentUl && parentUl.tagName.toLowerCase() === 'ul') {
                        parentUl.style.display = 'block';
                    }

                    // Mettre à jour l'icône pour montrer l'état ouvert
                    const placeCardDiv = current.querySelector('.place-card');
                    const iconElement = placeCardDiv ? placeCardDiv.querySelector('span') : null;
                    if (iconElement) {
                        const texteElement = iconElement.textContent.trim();
                        iconElement.textContent = texteElement;
                    }

                    current = current.parentElement.closest('li');
                }
            }
        }
    });
}



function clearSearchInput3() {
    const searchInput = document.getElementById('searchInput3');
    searchInput.value = ''; // Vider le champ de recherche

    searchLieu3();


}


function toggleNiveau2(element, niveau) {
    const ulElement = element.parentElement.querySelector('ul');
    if (ulElement) {
        const isHidden = ulElement.style.display === 'none' || ulElement.style.display === '';
        ulElement.style.display = isHidden ? 'block' : 'none';

        const iconElement = element.querySelector('span');
        if (iconElement) {
            // Modifier l'icône (▶ ou ▼)
            const texteElement = iconElement.textContent.trim().substring(1).trim();
            iconElement.textContent = (isHidden ? '▼' : '▶') + ' ' + texteElement;
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
    scannerInput.focus();
});

// Bouton pour fermer la modal
document.getElementById("closeScannerModal").addEventListener("click", function () {
    document.getElementById("scannerModal").style.display = "none";
});

document.getElementById("scannerInput").addEventListener("input", function (e) {
    // Utilisation d'une expression régulière pour extraire le code-barres
    const inputText = e.target.value;
    const barcodePattern = /scan-(\d+)-fin/;
    const match = barcodePattern.exec(inputText);

    if (match) {
        const barcode = match[1]; // Capture le groupe de chiffres
        cherBarre(barcode);
        e.target.value = ""; // Réinitialise l'input après la capture
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
    const result = findPieceByBarcode(pieces, barcode);
    if (result) {
        choisirpieces("OK", result.id);
        document.getElementById("scannerModal").style.display = "none";

    } else {
        alert("Code-barres introuvable !");
    }
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


    