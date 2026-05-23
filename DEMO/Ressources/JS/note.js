let activeTab = null;
let saveTimeout = null; // Variable pour le debounce

async function selectTab(noteId) {
    activeTab = noteId;

        const noteData = await getPrefixedItem(noteId);
        note = JSON.parse(noteData || '{}');
  

    const noteContentElement = document.getElementById('note-content');
    const noteDisplay = document.getElementById('note-display');
    let iframe = document.getElementById('note-iframe');

    if (note.useIframe) {
        if (!iframe) {
            iframe = createIframeElement();
            noteDisplay.appendChild(iframe);
        }
        iframe.src = note.iframeUrl;
        iframe.style.display = 'block';
        if (noteContentElement) noteContentElement.style.display = 'none';
    } else {
        if (iframe) iframe.style.display = 'none';
        if (noteContentElement) {
            noteContentElement.style.display = 'block';
            noteContentElement.value = note.content || '';
        }
    }

    updateActiveTabButton(noteId);
    changerCouleur();
}

async function initializeNotes() {
  const user = getUserFromUrl();
  const localStorageKey = `${user}_notesIndex`;

  try {
    if (navigator.onLine) {
      // En ligne : fetch les données et les stocker en localStorage
      const response = await fetch(`/G-MAPP/Ressources/PHP/rebuildNotesIndex.php?user=${encodeURIComponent(user)}`);
      const result = await response.json();

      if (result.success) {
        const notesIndex = result.notesIndex;

        // Sauvegarder dans localStorage (stringify)
        setPrefixedItem('notesIndex',JSON.stringify(notesIndex))

        if (notesIndex.length === 0) {
          afficherMessageVide();
        } else {
          renderTabs(notesIndex);
        }
      } else {
        console.error("Erreur reconstruction index:", result.error);
        afficherMessageVide(true);
      }
    } else {
      // Hors ligne : lecture locale depuis localStorage
      const localData = await getPrefixedItem('notesIndex');
;
      if (localData) {
        const notesIndex = JSON.parse(localData);
        if (notesIndex.length === 0) {
          afficherMessageVide();
        } else {
          renderTabs(notesIndex);
        }
      } else {
        console.warn("⚠️ Pas de données locales disponibles");
        afficherMessageVide(true);
      }
    }
  } catch (error) {
    console.error("Erreur serveur ou locale:", error);
    afficherMessageVide(true);
  }
}

function afficherMessageVide(erreur) {
    const tabButtons = document.getElementById('tab-buttons');
    tabButtons.innerHTML = '';

    const message = document.createElement('div');
    if (erreur) {message.textContent = "Une erreur c'est produite";
        message.style.color = 'darkred';
            message.style.fontStyle = 'bold';


} else
    {
        message.textContent = "Aucune note. Cliquez pour en créer une. →";
            message.onclick = () => addNewTab();
                message.style.fontStyle = 'italic';


}
    message.classList.add('empty-note-message');
    message.style.cursor = 'pointer';
    message.style.padding = '10px';
    message.style.textAlign = 'center';

    tabButtons.appendChild(message);

    const noteContent = document.getElementById('note-content');
    if (noteContent) noteContent.value = '';
    const noteIframe = document.getElementById('note-iframe');
    if (noteIframe) noteIframe.style.display = 'none';
}



function getUserFromUrl() {
    const queryParams = new URLSearchParams(window.location.search);
    return queryParams.get('user');
}
function createIframeElement() {
    const noteDisplay = document.getElementById('note-display');
    const iframe = document.createElement('iframe');
    iframe.id = 'note-iframe';
    iframe.style = "width: 100%; height: 100%; border: none;";
    noteDisplay.appendChild(iframe);
    return iframe;
}
function showAddOptions() {
    document.getElementById('addNoteModal').style.display = 'flex';
}
// Gestionnaires d'événements pour les boutons de la modal
document.getElementById('createNoteBtn').addEventListener('click', function() {
    addNewTab();  // Crée une nouvelle note
    closeAddNoteModal();  // Fermer la modal après la sélection
});

document.getElementById('openChoiceBtn').addEventListener('click', function() {
    addNewTab(true);  // Crée une nouvelle note avec une iframe
    closeAddNoteModal();  // Fermer la modal après la sélection
});

// Fonction pour fermer la modal
function closeAddNoteModal() {
    document.getElementById('addNoteModal').style.display = 'none';
}
function openChoiceIframe() {
    const user = getUserFromUrl();
    const uniqueKey = `${encodeURIComponent(user)}_key_${Math.random().toString(36).substr(2, 9)}`;  // Génération d'une clé unique

    const iframe = createIframeElement();
    iframe.src = `../Notes/index.html?&user=${encodeURIComponent(user)}&folders=${uniqueKey}`;
    document.getElementById('note-display').appendChild(iframe);
}

async function addNewTab(useIframe = false) {
    const noteId = `note_${Date.now()}`;
    const newNote = {
        title: "Nouvelle Note",
        content: "",
        useIframe: useIframe,
        iframeUrl: ""
    };

    if (useIframe) {
        const user = getUserFromUrl();
        const uniqueKey = `${encodeURIComponent(user)}_key_${Math.random().toString(36).substr(2, 9)}`;
        newNote.iframeUrl = `../Notes/index.html?&user=${encodeURIComponent(user)}&folders=${uniqueKey}`;
    }

    await setPrefixedItem(noteId, JSON.stringify(newNote));
    const notesIndex = await getNotesIndex() || [];
    notesIndex.push(noteId);
    await saveNotesIndex(notesIndex);

    let notesOrder = await getNotesOrder() || [];
    notesOrder.push(noteId);
    await saveNotesOrder(notesOrder);

//notesCache[noteId] = newNote;
await renderTabs(notesIndex);
await selectTab(noteId);

}


function showCommonIframe() {
    const user = getUserFromUrl();

    // Masquer tous les éléments de texte ou autres contenus interactifs
    const noteContentElement = document.getElementById('note-content');
    if (noteContentElement) {
        noteContentElement.style.display = 'none'; // Cache la zone de texte principale
    }

    // Si d'autres éléments doivent être cachés, ajoutez-les ici
    // Exemple: const anotherElement = document.getElementById('another-element-id');
    // if (anotherElement) {
    //     anotherElement.style.display = 'none';
    // }

    const noteDisplay = document.getElementById('note-display');
    let iframe = document.getElementById('note-iframe');
    if (!iframe) {
        iframe = createIframeElement();
        noteDisplay.appendChild(iframe);
    }

    // Configuration de l'iframe avant de la rendre visible
    iframe.onload = function() {
        const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
        const someElement = iframeDocument.getElementById('some-element-id');
    };
    iframe.style.display = 'block';
    iframe.src = `../Notes/?&folders=notes&user=${encodeURIComponent(user)}`; // S'assurer que cette URL est chargée après avoir défini `onload`
    updateActiveTabButton('Comm-butt')
}



// Récupère l'index des notes (seulement les IDs) depuis le stockage
async function getNotesIndex() {
    const notesIndexData = await getPrefixedItem('notesIndex');
    try {
        return JSON.parse(notesIndexData || '[]');
    } catch {
        return null; // Si l'index est corrompu, renvoie null
    }
}


// Sauvegarde l'index des notes de manière atomique
async function saveNotesIndex(notesIndex) {
    await setPrefixedItem('notesIndex', JSON.stringify(notesIndex));
}

async function getNotesOrder() {
    const data = await getPrefixedItem('notesOrder');
    try {
        return JSON.parse(data || '[]');
    } catch {
        return null;
    }
}

async function saveNotesOrder(order) {
    await setPrefixedItem('notesOrder', JSON.stringify(order));
}


async function renderTabs(notesIndex) {
    const tabButtons = document.getElementById('tab-buttons');
    tabButtons.innerHTML = '';

            const noteIframe = document.getElementById('note-display');
            if (noteIframe) noteIframe.style.display = 'block';

    let savedOrder = await getNotesOrder();
    if (!savedOrder || !Array.isArray(savedOrder) || savedOrder.length === 0) {
        savedOrder = [...notesIndex];
        await saveNotesOrder(savedOrder);
    }
    const validIds = savedOrder.filter(id => notesIndex.includes(id));

    for (const noteId of validIds) {
   
            const noteData = await getPrefixedItem(noteId);
            note = JSON.parse(noteData || '{}');
       

        const title = note.title || "Sans titre";
        const tabButton = document.createElement('button');
        tabButton.classList.add('note-tab-button');
        tabButton.textContent = title;
        tabButton.onclick = () => selectTab(noteId);
        tabButton.setAttribute("data-note-id", noteId);

        if (note.useIframe) {
            const editButton = createEditButton(noteId);
            tabButton.appendChild(editButton);
        }

        // Bouton de déplacement
        const moveButton = document.createElement('span');
        moveButton.innerHTML = '<>';
        moveButton.style.cursor = 'pointer';
        moveButton.onclick = (e) => {
            e.stopPropagation();
            enterMoveMode(tabButton, noteId, title);
        };
        tabButton.appendChild(moveButton);

        const deleteButton = createDeleteButton(noteId);
        tabButton.appendChild(deleteButton);

        tabButton.onclick = () => selectTab(noteId);
        tabButtons.appendChild(tabButton);
    }

    if (validIds.length > 0) {
        activeTab = validIds[0];
        selectTab(activeTab);
        const firstButton = document.querySelector(`.note-tab-button[data-note-id="${activeTab}"]`);
        if (firstButton) firstButton.classList.add('active');
    }
    changerCouleur();
      afficherPopupAideCustom(
      ".scrollable-tabs",
      `Il est maintenant possible de réorganiser les notes via le <>`,
      'pop_note_tab',
      3
    );
}

async function enterMoveMode(tabButton, noteId, title) {
    const currentTitle = tabButton.querySelector('span').textContent;
    tabButton.innerHTML = title;

    const moveLeft = document.createElement('button');
    moveLeft.textContent = '◀';
    moveLeft.onclick = async (e) => {
        e.stopPropagation();
        await moveTab(noteId, -1);
    };

    const exitButton = document.createElement('button');
    exitButton.textContent = ' ';
exitButton.onclick = async () => {
    const notesIndex = await getNotesIndex();
    renderTabs(notesIndex);
};

    const moveRight = document.createElement('button');
    moveRight.textContent = '▶';
    moveRight.onclick = async (e) => {
        e.stopPropagation();
        await moveTab(noteId, 1);
    };




    tabButton.appendChild(moveLeft);
        tabButton.appendChild(exitButton);

    tabButton.appendChild(moveRight);

    // Gestion du clic hors du bouton
async function outsideClickListener(e) {
    if (!tabButton.contains(e.target)) {
        const notesIndex = await getNotesIndex();
        renderTabs(notesIndex);
        document.removeEventListener('click', outsideClickListener);
    }
}

    document.addEventListener('click', outsideClickListener);
}


async function moveTab(noteId, direction) {
    let notesIndex = await getNotesIndex();
    let savedOrder = await getNotesOrder();
    if (!savedOrder || savedOrder.length === 0) {
        savedOrder = [...notesIndex];
    }

    const currentIndex = savedOrder.indexOf(noteId);
    const newIndex = currentIndex + direction;

    if (newIndex < 0 || newIndex >= savedOrder.length) return;

    savedOrder.splice(currentIndex, 1);
    savedOrder.splice(newIndex, 0, noteId);

    await saveNotesOrder(savedOrder);
    renderTabs(notesIndex);
}

function editTabTitle(noteId, useIframe) {
    const tabButton = document.querySelector(`.note-tab-button[data-note-id="${noteId}"]`);
    if (!tabButton) {
        console.error('Tab button not found for noteId:', noteId);
        return;
    }

    // Extraire seulement le titre en enlevant les icônes et espaces inutiles
    const currentTitle = tabButton.childNodes[0].nodeValue.trim();

    // Création du champ de saisie pour le titre
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentTitle;
    input.onblur = () => {
        const newTitle = input.value.trim();
        updateTabTitle(noteId, newTitle);
        tabButton.innerHTML = ''; // Nettoyer le contenu du bouton

        // Reconstruire le contenu de l'onglet
        const textNode = document.createTextNode(newTitle); // Créer un noeud texte pour le titre
        tabButton.appendChild(textNode);
        if (useIframe) {
            const editButton = createEditButton(noteId); // Recréer le bouton d'édition
            tabButton.appendChild(editButton);
        }
        const deleteButton = createDeleteButton(noteId); // Recréer le bouton de suppression
        tabButton.appendChild(deleteButton);
    };
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            input.blur(); // Déclenche la perte de focus pour enregistrer
        }
    };

    // Remplacer le contenu actuel du bouton par le champ de saisie
    tabButton.innerHTML = '';
    tabButton.appendChild(input);
    input.focus();
}
// Fonction pour créer un bouton d'édition
function createEditButton(noteId) {
    const button = document.createElement('span');
    button.innerHTML = '&#9998;'; // Icone crayon pour l'édition
    button.onclick = (e) => {
        e.stopPropagation(); // Empêcher l'activation de l'onglet lors du clic sur le bouton d'édition
        editTabTitle(noteId, true);
    };
    return button;
}

// Fonction pour créer un bouton de suppression
function createDeleteButton(noteId) {
    const button = document.createElement('span');
    button.textContent = '✕';
    button.onclick = (e) => {
        e.stopPropagation(); // Empêcher l'activation de l'onglet lors du clic sur le bouton de suppression
        deleteTab(noteId);
    };
    return button;
}


function deleteButton(noteId) {
    const deleteBtn = document.createElement('span');
    deleteBtn.textContent = ' ✕';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteTab(noteId);
    };
    return deleteBtn;
}


// Met à jour uniquement l'onglet actif sans recharger tous les onglets
function updateActiveTabButton(noteId) {
    const tabButtons = document.querySelectorAll('.note-tab-button');
    tabButtons.forEach(button => {
        if (button.getAttribute("data-note-id") === noteId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}


// Met à jour uniquement le titre de l'onglet actif
function updateTabTitle(noteId, newTitle) {

        note.title = newTitle;
        setPrefixedItem(noteId, JSON.stringify(note)); // Mettre à jour la note dans le stockage
        const tabButton = document.querySelector(`.note-tab-button[data-note-id="${noteId}"]`);
        if (tabButton) {
            tabButton.childNodes[0].textContent = newTitle; // Mettre à jour le texte du titre
        
    }
}




// Fonction pour sauvegarder la note active avec un délai avant d'envoyer au serveur
function saveCurrentNote() {
    if (activeTab) {
        const noteContent = document.getElementById('note-content').value;
        const firstLine = noteContent.split('\n')[0];
        const title = firstLine.slice(0, 15) || "Nouvelle Note";

        // Mettre à jour l'affichage du titre immédiatement
        updateTabTitle(activeTab, title);

        // Annule l'ancien timeout pour éviter les sauvegardes redondantes
        clearTimeout(saveTimeout);

        // Configure un nouveau timeout pour enregistrer après 500 ms d'inactivité
        saveTimeout = setTimeout(async () => {
            // Prépare et enregistre la note actuelle avec le titre et le contenu
            const note = {
                title: title,
                content: noteContent
            };
            await setPrefixedItem(activeTab, JSON.stringify(note));
        }, 500);

    }
}

async function deleteTab(noteId) {
    if (confirm("Supprimer cette note ?")) {
        await removePrefixedItem(noteId); // Supprime la note du stockage

        // Si la note supprimée est affichée, vider son contenu
        if (activeTab === noteId) {
            const noteContent = document.getElementById('note-content');
            if (noteContent) noteContent.value = '';
            const noteIframe = document.getElementById('note-display');
            if (noteIframe) noteIframe.style.display = 'none';
        }

        let notesIndex = await getNotesIndex() || [];
        notesIndex = notesIndex.filter(id => id !== noteId); // Mise à jour index
        await saveNotesIndex(notesIndex);

        if (notesIndex.length === 0) {
afficherMessageVide()
        } else {
            activeTab = notesIndex[0];
            await renderTabs(notesIndex);
            await selectTab(activeTab);
        }
    }
}




// Activer le défilement par glissement dans .scrollable-tabs
const scrollableTabs = document.querySelector('.scrollable-tabs');

let isDragging = false;
let startX;
let scrollLeft;

scrollableTabs.addEventListener('mousedown', (e) => {
    isDragging = true;
    scrollableTabs.classList.add('dragging');
    startX = e.pageX - scrollableTabs.offsetLeft;
    scrollLeft = scrollableTabs.scrollLeft;
});

scrollableTabs.addEventListener('mouseleave', () => {
    isDragging = false;
    scrollableTabs.classList.remove('dragging');
});

scrollableTabs.addEventListener('mouseup', () => {
    isDragging = false;
    scrollableTabs.classList.remove('dragging');
});

scrollableTabs.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollableTabs.offsetLeft;
    const walk = (x - startX) * 2; // Ajustez la vitesse de défilement ici
    scrollableTabs.scrollLeft = scrollLeft - walk;
});