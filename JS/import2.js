document.getElementById("processBtn").addEventListener("click", () => {
    const fileInput = document.getElementById("csvFile");
    const outputDiv = document.getElementById("output");

    if (fileInput.files.length === 0) {
        outputDiv.textContent = "Veuillez sélectionner un fichier CSV.";
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
        // Conversion de Windows-1252 en chaîne UTF-8
        const csvContent = new TextDecoder("windows-1252").decode(event.target.result);

        // Traitement du contenu CSV
        const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== ""); // Enlève les lignes vides
        const pieces = {};


    const header = lines[0].split(";").map(h => h.trim());
  const expectedHeaders = ["Référence interne", "Désignation", "Emplacement (Arborescence complète)", "Code-barres"];
    const headersAreValid = expectedHeaders.every((field, index) => header[index] === field);

    if (!headersAreValid) {
        outputDiv.textContent = "L'entête doit contenir :'Référence interne', 'Désignation', 'Emplacement (Arborescence complète)', 'Code-barres' ";
        return;
    }
        // Ignore la première ligne (en-tête)
    const dataLines = lines.slice(1);

        // Tri en fonction des critères : "A" et "Rangée" en premier
        dataLines.sort((a, b) => {
            const locA = a.split(";")[2]?.replace(/(^"|"$)/g, "").trim();
            const locB = b.split(";")[2]?.replace(/(^"|"$)/g, "").trim();

            const isAorRangeA = locA.startsWith("A") || locA.includes("Rangée");
            const isAorRangeB = locB.startsWith("A") || locB.includes("Rangée");

            if (isAorRangeA && !isAorRangeB) return -1; // "A" ou "Rangée" en premier
            if (!isAorRangeA && isAorRangeB) return 1;
            return locA.localeCompare(locB); // Ordre alphabétique
        });

        // Fonction de nettoyage des caractères spéciaux
function cleanString(str) {
    // Remplacer des caractères indésirables par des caractères valides
    return str
        .replace(/½/g, "\u00BD")  // Remplacer ½ par son code Unicode
        .replace(/“|”/g, '"')     // Remplacer les guillemets typographiques
        .replace(/‘|’/g, "'")     // Remplacer les apostrophes typographiques
        .replace(/[^a-zA-Z0-9\s\-\/\.\,\;éèêëàâäùûüôöîïÉÈÊËÀÂÄÙÛÜÔÖÎÏ]/g, ""); // Enlever les caractères non valides tout en gardant les accents et les majuscules
}



        dataLines.forEach(line => {
            const columns = line.split(";").map(col => col.replace(/(^"|"$)/g, "").trim());
            const [id, description, location, barcode] = columns; // Ajout du code-barres

            if (!location) {
                return; // Ignore les lignes sans emplacement
            }

            const path = location.split("\\").map(part => part.trim()); // Divise l'arborescence
            let current = pieces;

            // Création de la structure hiérarchique
            path.forEach((key, index) => {
                const baseKey = key.replace(/\s+bis$/, ""); // Supprime " bis" pour la clé principale
                if (!current[baseKey]) {
                    current[baseKey] = {}; // Crée l'objet si non existant
                }
                current = current[baseKey];
            });

            // Nettoie la description avant de l'ajouter
            const cleanedDescription = cleanString(description.replace(/\s+bis$/, "")); // Nettoie " bis" du nom
            if (!current[cleanedDescription]) {
                current[cleanedDescription] = { id, barcode }; // Ajoute aussi le code-barres
            } else {
                // Fusionne si la description existe déjà (ex : "bis")
                current[cleanedDescription] = { id, barcode }; // Assurez-vous de mettre à jour le code-barres aussi
            }
        });

        outputDiv.textContent = JSON.stringify(pieces, null, 4); // Affiche un JSON formaté
        document.getElementById("sendBtn").disabled = false;
    };

    // Lecture du fichier avec encodage Windows-1252
    reader.readAsArrayBuffer(file);
});

document.getElementById("sendBtn").addEventListener("click", () => {
    const jsonOutput = document.getElementById("output").textContent;

    if (jsonOutput) {
        // Préparer les données pour le fichier JS
        const jsContent = `const pieces = ${jsonOutput};`;

        // Envoyer la requête POST à savePièces.php
        fetch('savePièces.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/javascript'
            },
            body: jsContent
        })
        .then(response => {
            if (response.ok) {
                alert("Fichier Pièces.js mis à jour avec succès !");
            } else {
                return response.text().then(text => {
                    throw new Error(text);
                });
            }
        })
        .catch(error => {
            console.error("Erreur lors de l'import :", error.message);
            alert("Une erreur s'est produite lors de la mise à jour du fichier Pièces.js.");
        });
    } else {
        alert("Aucune donnée JSON à envoyer !");
    }
});
