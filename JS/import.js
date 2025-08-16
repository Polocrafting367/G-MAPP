// Fonction pour trier chaque niveau de l'arborescence par ordre alphabétique
function sortTree(tree) {
    const entries = Object.entries(tree);
    entries.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

    const sortedTree = {};
    entries.forEach(([key, value]) => {
        sortedTree[key] = typeof value === 'object' ? sortTree(value) : value;
    });

    return sortedTree;
}

// Fonction pour nettoyer les clés lues du CSV
function cleanString(str) {
    return str ? str.trim().replace(/^"|"$/g, '').replace(/ +/g, ' ') : ''; // Supprime les guillemets, espaces inutiles et doublons
}

// Fonction pour convertir l'objet en une chaîne JSON formatée proprement
function objectToFormattedString(obj) {
    return JSON.stringify(obj, null, 2)
        .replace(/"([^"]+)":/g, '"$1":') // Garder les guillemets autour des clés, JSON standard
        .replace(/},\n\s*}/g, '}\n  }') // Assurer la bonne mise en forme des objets fermés
        .replace(/},\n\s*{/g, '},\n\n  {'); // Ajouter des espaces cohérents entre les sections si nécessaire
}

// Fonction pour créer et télécharger un fichier
function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}



document.getElementById('importButton').addEventListener('click', () => {
    const fileInput = document.getElementById('csvFileInput');
    if (!fileInput.files.length) {
        alert('Veuillez sélectionner un fichier CSV.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const csvData = event.target.result;
        const lines = csvData.split('\n');
        const headers = lines[0].split(';').map(header => cleanString(header));

        const tree = {};
        lines.slice(1).forEach((line, index) => {
            if (line.trim()) {
                const columns = line.split(';').map(col => cleanString(col));
                const sectorPathIndex = headers.indexOf('Secteur (Arborescence complète)');
                const designationIndex = headers.indexOf('Désignation');

                if (sectorPathIndex === -1 || designationIndex === -1) {
                    console.error(`Les indices de colonne ne sont pas valides. Vérifiez les noms de colonnes.`);
                    return;
                }

                const sectorPath = columns[sectorPathIndex];
                const designation = columns[designationIndex];

                if (sectorPath) {
                    if (designation) {
                        const pathParts = sectorPath.split(' \\ ').map(part => cleanString(part));
                        let currentLevel = tree;

                        pathParts.forEach(part => {
                            if (!currentLevel[part]) {
                                currentLevel[part] = {};
                            }
                            currentLevel = currentLevel[part];
                        });
                        currentLevel[designation] = {};
                    } else {
                        console.warn(`Ligne ${index + 2} : Désignation manquante. Ligne complète : ${line}`);
                    }
                } else {
                    console.warn(`Ligne ${index + 2} : Secteur manquant. Ligne complète : ${line}`);
                }
            }
        });

        // Trier l'arborescence avant la prévisualisation
        const sortedTree = sortTree(tree);

        // Générer le contenu formaté pour l'affichage et l'exportation
        const formattedContent = `const arborescence = ${objectToFormattedString(sortedTree)};`;
        document.getElementById('previewContent').textContent = formattedContent;
        document.getElementById('previewModal').style.display = 'block';

        // Ajout de la logique de confirmation
document.getElementById('confirmButton').onclick = function() {
    fetch('saveLieu.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/javascript',
        },
        body: formattedContent
    }).then(response => {
        if (response.ok) {
            response.text().then(text => alert(text)); // Affiche le message de réponse
        } else {
            alert('Erreur lors de la mise à jour du fichier Lieu.js.');
        }
        document.getElementById('previewModal').style.display = 'none';
    });
};

        // Ajout de la logique d'exportation
        document.getElementById('exportButton').onclick = function() {
            downloadFile('Lieu.js', formattedContent);
        };

        document.getElementById('cancelButton').onclick = function() {
            document.getElementById('previewModal').style.display = 'none';
        };
    };

    reader.readAsText(file, 'ISO-8859-1');
});




// Fermer la modal lorsque l'utilisateur clique sur la croix
document.querySelector('.close').onclick = function() {
    document.getElementById('previewModal').style.display = 'none';
};

// Fermer la modal si l'utilisateur clique en dehors de celle-ci
window.onclick = function(event) {
    if (event.target === document.getElementById('previewModal')) {
        document.getElementById('previewModal').style.display = 'none';
    }
};
