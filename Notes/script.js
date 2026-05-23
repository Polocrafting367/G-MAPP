document.addEventListener('DOMContentLoaded', function() {
    fetchTasks();
});

function fetchTasks() {
    const folderId = new URLSearchParams(window.location.search).get('folders');
    if (!folderId) {
        console.error("Aucun ID de dossier ('folders') trouvé dans l'URL.");
        return;
    }

    const url = `loadTasks.php?folders=${encodeURIComponent(folderId)}`;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
            return response.json();
        })
        .then(tasks => {
            if (Array.isArray(tasks)) {

                // Nettoyage des tâches invalides (fire and forget)
                tasks.filter(task => {
                    return (!task.id || task.id === 'undefined') ||
                           ((!task.note || !task.note.trim()) && (!task.intervenant || !task.intervenant.trim()) && (!task.dateButoir || !task.dateButoir.trim()));
                }).forEach(task => {
                    fetch('deleteTask.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: task.id, folderId: folderId }),
                    }).catch(err => console.error('Erreur suppression auto :', err));
                });

                // Garder uniquement les valides pour l'affichage
                tasks = tasks.filter(task => task.id && task.id !== 'undefined' && (task.note?.trim() || task.intervenant?.trim() || task.dateButoir?.trim()));

                const taskList = document.getElementById('taskList');
                taskList.innerHTML = '';

                tasks.sort((a, b) => a.position - b.position);

                // OPTIMISATION : Utilisation d'un DocumentFragment pour minimiser les reflows
                const fragment = document.createDocumentFragment();
                tasks.forEach(task => {
                    const row = createTaskRow(task);
                    fragment.appendChild(row);
                });
                taskList.appendChild(fragment); // Une seule insertion dans le DOM

                setupDragAndDrop();
            } else {
                console.error("Données inattendues reçues :", tasks);
            }
        })
        .catch(error => console.error("Erreur lors du chargement des tâches :", error));
}

function createTaskRow(task) {
    const row = document.createElement('tr');
    row.setAttribute('data-id', task.id);
    row.setAttribute('data-importance', task.importance || '1');
    row.setAttribute('data-task', JSON.stringify(task));
    row.className = `importance-${task.importance}`;
    row.style.userSelect = 'auto !important'; // webkitUserDrag n'est plus nécessaire ici
    
    if (task.completed) row.classList.add('completed');

    // --- Ordre (Drag Handle) ---
    const orderCell = document.createElement('td');
    orderCell.className = 'small-col move-icon';
    orderCell.innerHTML = '<i class="fa-solid fa-grip-vertical"></i>';
    // Le TD devient draggable, pas juste l'icône
    orderCell.draggable = true; 
    
    // Listeners Drag & Drop (Desktop)
    orderCell.addEventListener('dragstart', handleDragStart);
    
    // Listeners Touch (Mobile)
    orderCell.addEventListener('touchstart', handleTouchStart, { passive: false });
    orderCell.addEventListener('touchmove', handleTouchMove, { passive: false });
    orderCell.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    row.appendChild(orderCell);

    // --- Reste de la fonction (identique) ---
    const importanceCell = document.createElement('td');
    importanceCell.className = 'icon-col';
    importanceCell.innerHTML = `<span class="icon"><i class="fa-solid fa-circle-info"></i></span>`;
    importanceCell.onclick = () => showImportanceSelector(row, task.id);
    row.appendChild(importanceCell);

    const checkboxCell = document.createElement('td');
    checkboxCell.className = 'checkbox-wrapper-19';
if (task.importance !== 'section') {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `checkbox-${task.id}`;
        checkbox.checked = task.completed;
        const label = document.createElement('label');
        label.setAttribute('for', checkbox.id);
        label.className = 'check-box';
        checkbox.onclick = () => toggleCompletion(task.id, row);
        
        checkboxCell.appendChild(checkbox);
        checkboxCell.appendChild(label);
    }
    row.appendChild(checkboxCell);

    const noteCell = createEditableCell('note-col', task.note || '', 'Cliquez pour ajouter une note');
    row.appendChild(noteCell);
    const intervenantCell = createEditableCell('intervenant-col', task.intervenant || '', '-');
    row.appendChild(intervenantCell);
    const dateButoirCell = createEditableCell('date-butoir-col', task.dateButoir || '', '-');
    row.appendChild(dateButoirCell);

    const realiseParCell = document.createElement('td');
    realiseParCell.className = 'realise-col';
    realiseParCell.innerText = task.realisePar || '';
    row.appendChild(realiseParCell);

    const dateInterventionCell = document.createElement('td');
    dateInterventionCell.className = 'date-col';
    dateInterventionCell.setAttribute('data-type', 'intervention');
    dateInterventionCell.innerText = task.dateIntervention || '';
    row.appendChild(dateInterventionCell);

    const dateEnregistrementCell = document.createElement('td');
    dateEnregistrementCell.className = 'date-col-max';
    dateEnregistrementCell.innerText = task.dateEnregistrement || new Date().toISOString().split('T')[0];
    row.appendChild(dateEnregistrementCell);

    const paramCell = document.createElement('td');
    paramCell.className = 'action-col';
    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteButton.className = 'btn-delete';
    deleteButton.onclick = () => { if (window.confirm('Supprimer ?')) deleteTask(task.id); };
    paramCell.appendChild(deleteButton);
    row.appendChild(paramCell);

const triggerAutoSave = () => {
        // On ne sauvegarde que si le bouton est en mode 'save' (donc qu'il y a eu modif)
        if (deleteButton.getAttribute('data-mode') === 'save') {
            saveTask(task.id, noteCell.innerText, intervenantCell.innerText, dateButoirCell.innerText);
        }
    };
    
[noteCell, intervenantCell, dateButoirCell].forEach((cell) => {
        // 1. Détecter la frappe (Input) pour changer l'icône visuellement
        cell.oninput = () => {
            if (deleteButton.getAttribute('data-mode') !== 'save') {
                deleteButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>';
                deleteButton.style.backgroundColor = 'green';
                deleteButton.style.color = 'white';
                deleteButton.setAttribute('data-mode', 'save');
                
                // Le clic manuel fonctionne toujours
                deleteButton.onclick = () => saveTask(task.id, noteCell.innerText, intervenantCell.innerText, dateButoirCell.innerText);
            }
        };

        // 2. Sauvegarde automatique quand on quitte la cellule (Blur)
        cell.addEventListener('blur', triggerAutoSave);
        
        // Optionnel : Sauvegarder aussi si on appuie sur "Entrée" (évite le saut de ligne)
        cell.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Empêche le saut de ligne
                cell.blur(); // Force le "blur" qui va déclencher la sauvegarde ci-dessus
            }
        });
    });

    return row;
}
// Helper pour créer les cellules éditables (DRY)
function createEditableCell(className, text, placeholder) {
    const cell = document.createElement('td');
    cell.className = `${className} editable`;
    cell.contentEditable = true;
    cell.dataset.placeholder = placeholder;
    cell.innerText = text;
    return cell;
}

function showImportanceSelector(row, taskId) {
    // Fermer un éventuel sélecteur existant
    const existing = document.querySelector('.importance-selector');
    if (existing) existing.remove();

    const importanceSelector = document.createElement('div');
    importanceSelector.className = 'importance-selector';
    
    const levels = [
        { level: '1', color: '<i class="fa-regular fa-circle" style="color:#888"></i>', label: 'Normal' },
        { level: '2', color: '<i class="fa-solid fa-triangle-exclamation" style="color:#f1c40f"></i>', label: 'Attention' },
        { level: '3', color: '<i class="fa-solid fa-circle-exclamation" style="color:#e74c3c"></i>', label: 'Important' },
   { level: 'section', color: '<i class="fa-solid fa-minus" style="color:#2c3e50; font-weight:bold;"></i>', label: 'Séparateur' },
    ];

    levels.forEach(({ level, color, label }) => {
        const button = document.createElement('button');
        button.innerHTML = color;
        button.title = label;
        button.onclick = () => {
            row.dataset.importance = level;
            row.className = `importance-${level}`;
            if (row.classList.contains('completed')) row.classList.add('completed'); // Garder l'état complété visuel
            
            updateTaskImportance(taskId, level);
            document.body.removeChild(importanceSelector);
            sortTasks('importance');
            saveRowOrder();
        };
        importanceSelector.appendChild(button);
    });

    const rect = row.getBoundingClientRect();
    importanceSelector.style.position = 'absolute';
    importanceSelector.style.top = `${rect.top + window.scrollY}px`; // Correction position scroll
    importanceSelector.style.left = `${rect.left + window.scrollX}px`;
    document.body.appendChild(importanceSelector);
    
    // Fermer si on clique ailleurs
    setTimeout(() => {
        document.addEventListener('click', function closeSelector(e) {
            if (!importanceSelector.contains(e.target) && !row.contains(e.target)) {
                importanceSelector.remove();
                document.removeEventListener('click', closeSelector);
            }
        });
    }, 0);
}

function updateTaskImportance(taskId, importance) {
    const folderId = new URLSearchParams(window.location.search).get('folders');
    fetch('updateImportance.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, importance, folderId }),
    })
    .then(res => { if(!res.ok) throw new Error(res.status); return res.json(); })
    .then(() => { updatePositions(); saveRowOrder(); })
    .catch(err => console.error('Erreur importance :', err));
}

function sortTasks(criteria) {
    const taskList = document.getElementById('taskList');
    const rows = Array.from(taskList.children);

    rows.sort((a, b) => {
        if (criteria === 'importance') {
            return b.dataset.importance - a.dataset.importance;
        } else if (criteria === 'date') {
            return new Date(b.querySelector('.date-col').innerText) - new Date(a.querySelector('.date-col').innerText);
        } else if (criteria === 'manual') {
            return a.dataset.id.localeCompare(b.dataset.id);
        }
    });
    
    // Fragment ici aussi pour optimiser le tri
    const fragment = document.createDocumentFragment();
    rows.forEach(row => fragment.appendChild(row));
    taskList.appendChild(fragment);
}

function addTask() {
    const folderId = new URLSearchParams(window.location.search).get('folders');
    const noteCell = document.querySelector('#addTaskRow td[contenteditable]:nth-child(4)');
    const intervenantCell = document.querySelector('#addTaskRow td[contenteditable]:nth-child(5)');
    const dateButoirCell = document.querySelector('#addTaskRow td[contenteditable]:nth-child(6)');

    const note = noteCell.innerText.trim();
    if (!note) { alert('Veuillez entrer une note.'); return; }

    const initials = new URLSearchParams(window.location.search).get('user')?.match(/\b\w/g)?.join('') || '';

    fetch('addTask.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            note, 
            intervenant: intervenantCell.innerText.trim(), 
            dateButoir: dateButoirCell.innerText.trim(), 
            createdBy: initials, 
            importance: '1', 
            folderId 
        }),
    }).then(() => {
        fetchTasks();
        noteCell.innerText = '';
        intervenantCell.innerText = '';
        dateButoirCell.innerText = '';
    });
}

function toggleCompletion(taskId, taskRow) { // Note: taskRow passé en argument pour éviter querySelector
    const folderId = new URLSearchParams(window.location.search).get('folders');
    const checkbox = taskRow.querySelector('input[type="checkbox"]');
    const completed = checkbox.checked;
    const initials = new URLSearchParams(window.location.search).get('user')?.match(/\b\w/g)?.join('') || 'Inconnu';
    const currentDate = new Date().toISOString().split('T')[0];

    if (completed) {
        taskRow.classList.add('completed');
        taskRow.querySelector('.realise-col').innerText = initials;
        taskRow.querySelector('.date-col[data-type="intervention"]').innerText = currentDate;
    } else {
        taskRow.classList.remove('completed');
        taskRow.querySelector('.realise-col').innerText = '';
        taskRow.querySelector('.date-col[data-type="intervention"]').innerText = '';
    }

    fetch('toggleCompletion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId, id: taskId, completed, completedBy: initials, dateIntervention: completed ? currentDate : null }),
    }).then(() => fetchTasks()).catch(err => console.error('Erreur completion :', err));
}

function deleteTask(taskId) {
    const folderId = new URLSearchParams(window.location.search).get('folders');
    fetch('deleteTask.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, folderId }),
    }).then(() => fetchTasks());
}

function saveTask(taskId, note, intervenant, dateButoir) {
    const folderId = new URLSearchParams(window.location.search).get('folders');
    fetch('updateTask.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: taskId,
            note: note.trim(),
            intervenant: intervenant.trim(),
            dateButoir: dateButoir.trim(),
            folderId,
        }),
    })
    .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
    .then(() => {
        const row = document.querySelector(`tr[data-id="${taskId}"]`);
        const deleteButton = row.querySelector('.btn-delete');
        
        // Reset visuel du bouton
        deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';
        deleteButton.style.backgroundColor = 'transparent';
        deleteButton.style.color = '';
        deleteButton.removeAttribute('data-mode');
        
        deleteButton.onclick = () => {
            if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) deleteTask(taskId);
        };
    })
    .catch(error => console.error('Erreur save :', error));
}

function updatePositions() {
    const rows = document.querySelectorAll("#taskList tr");
    rows.forEach((row, index) => {
        let taskData = JSON.parse(row.getAttribute('data-task'));
        taskData.position = index + 1;
        row.setAttribute('data-task', JSON.stringify(taskData));
    });
}

function saveRowOrder() {
    const folderId = new URLSearchParams(window.location.search).get('folders');
    const rows = document.querySelectorAll("#taskList tr");
    const order = Array.from(rows).map((row, index) => ({
        id: row.dataset.id,
        position: index + 1
    }));

    fetch('saveOrder.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order, folderId }),
    }).catch(err => console.error("Erreur ordre :", err));
}

function setupDragAndDrop() {
    const taskList = document.getElementById('taskList');
    
    // On attache l'événement 'dragover' au conteneur (le tableau) 
    // au lieu de chaque ligne individuelle.
    taskList.removeEventListener('dragover', handleDragOver); // Nettoyage préventif
    taskList.removeEventListener('drop', handleDrop);
    
    taskList.addEventListener('dragover', handleDragOver);
    taskList.addEventListener('drop', handleDrop);
}
// --- DRAG AND DROP LOGIC ---

let draggedRow = null;
let movingRow = null;
let touchStartY = 0;

function handleDragStart(event) {
    // On stocke la ligne en cours de déplacement
    draggedRow = this.closest('tr');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', ''); // Requis pour Firefox
    
    // Petit délai pour l'effet visuel
    setTimeout(() => {
        if (draggedRow) draggedRow.classList.add('dragged');
    }, 0);
}
function handleDragOver(event) {
    event.preventDefault(); // OBLIGATOIRE pour autoriser le drop
    event.dataTransfer.dropEffect = 'move';

    const targetRow = event.target.closest('tr');
    const taskList = document.getElementById('taskList');

    // On s'assure qu'on survole bien une ligne et que ce n'est pas celle qu'on déplace
    if (targetRow && targetRow !== draggedRow && taskList.contains(targetRow)) {
        const rect = targetRow.getBoundingClientRect();
        const next = (event.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
        
        // Insertion en direct (live swap)
        taskList.insertBefore(draggedRow, next && targetRow.nextSibling || targetRow);
    }
}
function handleDrop(event) {
    event.preventDefault();
    if (draggedRow) {
        draggedRow.classList.remove('dragged');
        draggedRow = null;
        saveRowOrder(); // Sauvegarde finale
    }
}

function handleDragEnd() {
    if (draggedRow) {
        draggedRow.classList.remove('dragged');
        draggedRow = null;
        saveRowOrder();
    }
}

function handleTouchStart(event) {
    // Empêcher le scroll si on touche la poignée
    if (event.cancelable) event.preventDefault();
    
    movingRow = this.closest('tr');
    movingRow.classList.add('dragged');
}

function handleTouchMove(event) {
    if (!movingRow) return;
    if (event.cancelable) event.preventDefault(); // Empêche le scroll

    const touch = event.touches[0];
    const elementBehindFinger = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (!elementBehindFinger) return;

    const targetRow = elementBehindFinger.closest('tr');
    const taskList = document.getElementById('taskList');

    // Logique de déplacement similaire au Desktop
    if (targetRow && targetRow !== movingRow && taskList.contains(targetRow)) {
        const rect = targetRow.getBoundingClientRect();
        const next = (touch.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
        
        taskList.insertBefore(movingRow, next && targetRow.nextSibling || targetRow);
    }
}
function handleTouchEnd(event) {
    if (movingRow) {
        movingRow.classList.remove('dragged');
        movingRow = null;
        saveRowOrder();
    }
}