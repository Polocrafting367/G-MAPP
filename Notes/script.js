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

                // Suppression des tâches invalides
                const tasksToDelete = tasks.filter(task => {
                    const idInvalide = !task.id || task.id === 'undefined';
                    const contenuVide = (!task.note || task.note.trim() === '') &&
                                        (!task.intervenant || task.intervenant.trim() === '') &&
                                        (!task.dateButoir || task.dateButoir.trim() === '');
                    return idInvalide || contenuVide;
                });

                tasksToDelete.forEach(task => {
                    fetch('deleteTask.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: task.id, folderId: folderId }),
                    }).catch(err => console.error('Erreur suppression tâche inutile :', err));
                });

                // Ne conserver que les tâches valides
                tasks = tasks.filter(task => {
                    const idValide = task.id !== undefined && task.id !== null && task.id !== 'undefined';
                    const contenuValide = task.note?.trim() || task.intervenant?.trim() || task.dateButoir?.trim();
                    return idValide && contenuValide;
                });

                const taskList = document.getElementById('taskList');
                taskList.innerHTML = '';

                tasks.sort((a, b) => a.position - b.position);
                tasks.forEach(task => {
                    const row = createTaskRow(task);
                    taskList.appendChild(row);
                });

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
    row.setAttribute('data-task', JSON.stringify(task)); // stocker toutes les données de la tâche
    row.className = `importance-${task.importance}`;
    row.style.webkitUserDrag = 'none !important' ; // ou bien supprimer avec `row.style.webkitUserDrag = '';`
    row.style.userSelect = 'auto !important';
    if (task.completed) {
        row.classList.add('completed');
    }
    // Ordre (↕)
    const orderCell = document.createElement('td');
    orderCell.className = 'small-col move-icon';
    orderCell.innerHTML = '↕'; 
    orderCell.draggable = true;
    orderCell.addEventListener('touchstart', handleTouchStart, false);
orderCell.addEventListener('touchmove', handleTouchMove, false);
orderCell.addEventListener('touchend', handleTouchEnd, false);

orderCell.addEventListener('dragstart', handleDragStart);

    row.appendChild(orderCell);

    // Importance (ℹ️)
    const importanceCell = document.createElement('td');
    importanceCell.className = 'icon-col';
    importanceCell.innerHTML = `<span class="icon">ℹ️</span>`;
    importanceCell.onclick = () => showImportanceSelector(row, task.id);
    row.appendChild(importanceCell);

    // Checkbox
const checkboxCell = document.createElement('td');
checkboxCell.className = 'checkbox-wrapper-19';
const checkbox = document.createElement('input');
checkbox.type = 'checkbox';
checkbox.id = `checkbox-${task.id}`; // Assure un ID unique pour chaque checkbox
checkbox.checked = task.completed;

// Création du label qui sera cliquable
const label = document.createElement('label');
label.setAttribute('for', checkbox.id);
label.className = 'check-box'; // Classe pour le style du label

// Ajouter l'écouteur d'événement sur la checkbox, pas sur le label
checkbox.onclick = () => toggleCompletion(task.id, row); // Passer également la ligne à la fonction

// Assemble tous les éléments dans la cellule du tableau
checkboxCell.appendChild(checkbox);
checkboxCell.appendChild(label);
row.appendChild(checkboxCell);


    // Note
    const noteCell = document.createElement('td');
    noteCell.className = 'note-col editable';
    noteCell.contentEditable = true;
    noteCell.dataset.placeholder = 'Cliquez pour ajouter une note';
    noteCell.innerText = task.note || '';
    row.appendChild(noteCell);

    // Intervenant
    const intervenantCell = document.createElement('td');
    intervenantCell.className = 'intervenant-col editable';
    intervenantCell.contentEditable = true;
    intervenantCell.dataset.placeholder = '-';
    intervenantCell.innerText = task.intervenant || '';
    row.appendChild(intervenantCell);
    // Date Butoir
    const dateButoirCell = document.createElement('td');
    dateButoirCell.className = 'date-butoir-col editable';
    dateButoirCell.contentEditable = true;
    dateButoirCell.dataset.placeholder = '-';
    dateButoirCell.innerText = task.dateButoir || '';
    row.appendChild(dateButoirCell);

    // Réalisé par
    const realiseParCell = document.createElement('td');
    realiseParCell.className = 'realise-col';
    realiseParCell.innerText = task.realisePar || '';
    row.appendChild(realiseParCell);

    // Date d'intervention
    const dateInterventionCell = document.createElement('td');
    dateInterventionCell.className = 'date-col';
    dateInterventionCell.setAttribute('data-type', 'intervention');
    dateInterventionCell.innerText = task.dateIntervention || '';
    row.appendChild(dateInterventionCell);

    // Date d'enregistrement
    const dateEnregistrementCell = document.createElement('td');
    dateEnregistrementCell.className = 'date-col-max';
    dateEnregistrementCell.innerText = task.dateEnregistrement || new Date().toISOString().split('T')[0];
    row.appendChild(dateEnregistrementCell);


    // Paramètre
    const paramCell = document.createElement('td');
    paramCell.className = 'action-col';
    const deleteButton = document.createElement('button');
    deleteButton.innerText = '🗑️';
    deleteButton.style.backgroundColor = 'red';
    deleteButton.onclick = () => {
        const confirmation = window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?');
        if (confirmation) {
            deleteTask(task.id);
        }
    };
    paramCell.appendChild(deleteButton);
    row.appendChild(paramCell);

    // Détecter les modifications
    [noteCell, intervenantCell, dateButoirCell].forEach((cell) => {
        cell.oninput = () => {
            deleteButton.innerText = '✅';
            deleteButton.style.backgroundColor = 'green';

            deleteButton.onclick = () =>

                saveTask(task.id, noteCell.innerText, intervenantCell.innerText, dateButoirCell.innerText);
        };
    });
    //enableRowDragAndDrop(row);

    return row;
}


function showImportanceSelector(row, taskId) {
    const importanceSelector = document.createElement('div');
    importanceSelector.className = 'importance-selector';
    const levels = [
        { level: '1', color: '⬜', label: 'Normal' },
        { level: '2', color: '🟨', label: 'Attention' },
        { level: '3', color: '🟥', label: 'Important' },
    ];

    levels.forEach(({ level, color, label }) => {
        const button = document.createElement('button');
        button.innerText = color;
        button.title = label;
        button.onclick = () => {
            row.dataset.importance = level;
            row.className = `importance-${level}`; // Mettre à jour la classe de la ligne
            updateTaskImportance(taskId, level);
            document.body.removeChild(importanceSelector); // Fermer le sélecteur
            sortTasks('importance'); // Trier après modification
            saveRowOrder(); // Sauvegarder l'ordre après le changement d'importance
        };
        importanceSelector.appendChild(button);
    });

    importanceSelector.style.position = 'absolute';
    importanceSelector.style.top = `${row.getBoundingClientRect().top}px`;
    importanceSelector.style.left = `${row.getBoundingClientRect().left}px`;
    document.body.appendChild(importanceSelector);
}


function updateTaskImportance(taskId, importance) {
    const folderId = new URLSearchParams(window.location.search).get('folders');

    fetch('updateImportance.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, importance, folderId }), // Ajouter folderId dans le body
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }
        return response.json();
    })
    .then(() => {
        updatePositions();
        saveRowOrder();
    })
    .catch(error => {
        console.error('Erreur lors de la mise à jour de l\'importance :', error);
    });
}



function sortTasks(criteria) {
    const taskList = document.getElementById('taskList');
    const rows = Array.from(taskList.children);

    rows.sort((a, b) => {
        if (criteria === 'importance') {
            return b.dataset.importance - a.dataset.importance; // Rouge > Jaune > Blanc
        } else if (criteria === 'date') {
            return new Date(b.querySelector('.date-col').innerText) - new Date(a.querySelector('.date-col').innerText);
        } else if (criteria === 'manual') {
            return a.dataset.id.localeCompare(b.dataset.id); // Tri par ordre ajouté
        }
    });

    // Réorganiser les lignes dans le DOM
    rows.forEach((row) => taskList.appendChild(row));
}

function addTask() {
    const folderId = new URLSearchParams(window.location.search).get('folders');
    const noteCell = document.querySelector('#addTaskRow td[contenteditable]:nth-child(4)');
    const intervenantCell = document.querySelector('#addTaskRow td[contenteditable]:nth-child(5)');
    const dateButoirCell = document.querySelector('#addTaskRow td[contenteditable]:nth-child(6)');

    const note = noteCell.innerText.trim();
    const intervenant = intervenantCell.innerText.trim();
    const dateButoir = dateButoirCell.innerText.trim();

    if (!note) {
        alert('Veuillez entrer une note.');
        return;
    }

    const initials = new URLSearchParams(window.location.search)
        .get('user')
        .match(/\b\w/g)
        .join('');

    fetch('addTask.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            note, intervenant, dateButoir, createdBy: initials, importance: '1', folderId // Ajouter folderId
        }),
    }).then(() => {
        fetchTasks();
        noteCell.innerText = '';
        intervenantCell.innerText = '';
        dateButoirCell.innerText = '';
    });
}


function toggleCompletion(taskId) {
        const folderId = new URLSearchParams(window.location.search).get('folders');

    const taskRow = document.querySelector(`tr[data-id="${taskId}"]`);
    const checkbox = taskRow.querySelector('input[type="checkbox"]');
    const completed = checkbox.checked;

    // Récupérer les initiales de l'utilisateur depuis l'URL
    const initials = new URLSearchParams(window.location.search).get('user')?.match(/\b\w/g)?.join('') || 'Inconnu';

    const currentDate = new Date().toISOString().split('T')[0];

    // Mettre à jour l'interface utilisateur immédiatement
    if (completed) {
        taskRow.classList.add('completed');
        taskRow.querySelector('.realise-col').innerText = initials;
        taskRow.querySelector('.date-col[data-type="intervention"]').innerText = currentDate;
    } else {
        taskRow.classList.remove('completed');
        taskRow.querySelector('.realise-col').innerText = '';
        taskRow.querySelector('.date-col[data-type="intervention"]').innerText = '';
    }

    // Envoyer la mise à jour au serveur
    fetch('toggleCompletion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            folderId,
            id: taskId, 
            completed, 
            completedBy: initials, 
            dateIntervention: completed ? currentDate : null 
        }),
    })
    .then(() => {
        fetchTasks(); // Recharger les tâches pour s'assurer que toutes les mises à jour sont reflétées
    })
    .catch((error) => {
        console.error('Erreur lors de la mise à jour de l\'état complété :', error);
    });
}


function deleteTask(taskId) {
    const folderId = new URLSearchParams(window.location.search).get('folders');

    fetch('deleteTask.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, folderId }), // Ajouter folderId
    }).then(() => {
        fetchTasks();
    });
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
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}`);
            }
            return response.json();
        })
        .then((updatedTask) => {

            // Réinitialiser le bouton en "Supprimer"
            const row = document.querySelector(`tr[data-id="${taskId}"]`);
            const deleteButton = row.querySelector('td:last-child button');
            deleteButton.innerText = '🗑️';
            deleteButton.style.backgroundColor = 'red';
            deleteButton.onclick = () => {
                const confirmation = window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?');
                if (confirmation) {
                    deleteTask(taskId);
                }
            };
        })
        .catch((error) => {
            console.error('Erreur lors de la sauvegarde de la tâche :', error);
        });
}






function updatePositions() {
    const rows = document.querySelectorAll("#taskList tr");
    rows.forEach((row, index) => {
        let taskData = JSON.parse(row.getAttribute('data-task'));
        taskData.position = index + 1;
        row.setAttribute('data-task', JSON.stringify(taskData)); // Mise à jour de l'attribut avec la nouvelle position
    });
}


function saveRowOrder() {
    const folderId = new URLSearchParams(window.location.search).get('folders');

    const rows = document.querySelectorAll("#taskList tr");
    const order = Array.from(rows).map((row, index) => ({
        id: row.dataset.id,
        position: index + 1
    }));

    // Créer un objet englobant pour inclure l'ordre des rangées et l'ID du dossier
    const payload = {
        order: order,
        folderId: folderId // Assurer que folderId est une partie de l'objet envoyé
    };

    fetch('saveOrder.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), // Envoyer l'objet complet en tant que JSON
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }
    })
    .catch(error => {
        console.error("Erreur lors de la sauvegarde de l'ordre des lignes :", error);
    });
}



function setupDragAndDrop() {
    const taskList = document.getElementById('taskList');
    const moveIcons = taskList.querySelectorAll('.small-col.move-icon');
    moveIcons.forEach(icon => {
        icon.addEventListener('dragstart', handleDragStart);
        icon.addEventListener('dragover', handleDragOver);
        icon.addEventListener('drop', handleDrop);
        icon.addEventListener('dragend', handleDragEnd);
    });
}


let draggedRow = null;





function enableRowDragAndDrop(row) {
    row.addEventListener('dragstart', handleDragStart);
    row.addEventListener('dragover', handleDragOver);
    row.addEventListener('drop', handleDrop);
    row.addEventListener('dragend', handleDragEnd);
}



// Pour garder la position lors du déplacement sur mobile
let touchStartY = 0;
let touchRowIndex = 0;



function handleDragStart(event) {
    event.dataTransfer.setData('text/plain', ''); // Ajouter le type MIME pour Firefox
        movingRow = event.currentTarget.closest('tr'); // Définir la tâche en mouvement

    draggedRow = this.parentNode; // Fait référence à la ligne entière depuis la cellule
    this.classList.add('dragged'); // Ajouter la classe 'dragged' à la cellule ou à la ligne selon le style souhaité
        movingRow.classList.add('dragged');

}


function handleDragOver(event) {
    event.preventDefault(); // Nécessaire pour permettre le drop
    const targetRow = event.target.closest('tr');
    
    if (targetRow) {
        const taskList = document.getElementById('taskList');
        const draggingRect = draggedRow.getBoundingClientRect();
        const targetRect = targetRow.getBoundingClientRect();
        
        if (event.clientY < (targetRect.top + targetRect.height / 2)) {
            // Si la souris est dans la première moitié de la ligne cible, placer avant
            taskList.insertBefore(draggedRow, targetRow);
        } else {
            // Sinon, placer après
            taskList.insertBefore(draggedRow, targetRow.nextSibling);
        }
    } else {
        // Si aucune ligne n'est ciblée (par exemple, si la souris est au-dessus ou en dessous de toutes les lignes)
        // cela permet de gérer les cas où la liste est vide ou la souris se trouve au-delà du premier ou dernier élément
        taskList.appendChild(draggedRow);
    }
}


function handleDrop(event) {
    event.preventDefault();
    // Si nécessaire, ajoutez ici la logique pour gérer la chute
    saveRowOrder(); // Assurez-vous que l'ordre des lignes est enregistré après la chute
}




let touchStartPosition = null;
let movingRow = null;
let originalRow = null;


function handleDragEnd() {
    if (draggedRow) {
        draggedRow.classList.remove('dragged');
        draggedRow = null; // Réinitialiser après le glissement
        saveRowOrder(); // Sauvegarder l'ordre
    }
}
// Gestion des événements tactiles pour mobile

function handleTouchStart(event) {
    event.preventDefault();
    movingRow = this.closest('tr'); // Récupérer la ligne contenant la cellule touchée
    movingRow.classList.add('dragged');
    touchStartPosition = { y: event.touches[0].clientY, x: event.touches[0].clientX };
}

function handleTouchMove(event) {
    event.preventDefault();
    const currentY = event.touches[0].clientY;
    const taskList = document.getElementById('taskList');
    const rows = Array.from(taskList.children);

    for (let i = 0; i < rows.length; i++) {
        const rowRect = rows[i].getBoundingClientRect();
        if (currentY < rowRect.top + rowRect.height / 2) {
            taskList.insertBefore(movingRow, rows[i]);
            break;
        }
        if (i === rows.length - 1) {
            taskList.appendChild(movingRow);
        }
    }
}

function updateRowPosition(relativeY, rows, taskList) {
    let closestRow = null;
    let closestDistance = Infinity;

    for (const row of rows) {
        const rowRect = row.getBoundingClientRect();
        const rowMiddle = rowRect.top - taskListRect.top + taskList.scrollTop + (rowRect.height / 2);
        const distance = Math.abs(relativeY - rowMiddle);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestRow = row;
        }
    }

    if (closestRow && draggedRow) {
        taskList.insertBefore(placeholder, (relativeY < touchStartY) ? closestRow : closestRow.nextSibling);
    }

    touchStartY = relativeY;
}

function handleTouchEnd(event) {
    event.preventDefault();
    if (movingRow) {
        movingRow.classList.remove('dragged');
        movingRow = null; // Réinitialiser la référence
        saveRowOrder(); // Sauvegarder le nouvel ordre après le déplacement
    }
}

function findClosestRow(container, y) {
    return Array.from(container.querySelectorAll('tr')).reduce((closest, row) => {
        const box = row.getBoundingClientRect();
        const offset = y - (box.top + box.height / 2);
        if (Math.abs(offset) < Math.abs(closest.offset)) {
            return { offset: offset, element: row };
        }
        return closest;
    }, { offset: Number.POSITIVE_INFINITY, element: null }).element;
}

function updatePlaceholderPosition(event) {
    const touchY = event.touches[0].clientY;
    const taskList = document.getElementById('taskList');
    const rows = Array.from(taskList.children);
    let closestRow = null;
    let closestDistance = Infinity;

    for (const row of rows) {
        const rowRect = row.getBoundingClientRect();
        const rowMiddle = rowRect.top + (rowRect.height / 2);
        const distance = Math.abs(touchY - rowMiddle);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestRow = row;
        }
    }

    if (closestRow) {
        if (touchY < closestRow.getBoundingClientRect().top + closestRow.getBoundingClientRect().height / 2) {
            taskList.insertBefore(placeholder, closestRow);
        } else {
            taskList.insertBefore(placeholder, closestRow.nextSibling);
        }
    }
}
