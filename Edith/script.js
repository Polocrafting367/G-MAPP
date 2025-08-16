document.getElementById('csvFileInput').addEventListener('change', handleFileSelect, false);

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.onload = function(fileEvent) {
        const text = fileEvent.target.result;
        parseCSVtoJSON(text);
    };
    reader.readAsText(file, 'UTF-8');
}

function transformPeriod(periodCode) {
    const periodMappings = {
        "J": "Journalier",
        "H": "Hebdomadaire",
        "M": "Mensuel",
        "T": "Trimestriel",
        "S": "Semestriel",
        "10M": "10 Mois",
        "A": "Annuel",
        "BA": "Bi Annuelle",
        "TA": "Tri Annuelle",
        "QA": "Quadri Annuelle",
        "C": "Compteur",
        "MA": "Multi Annuelle"
    };
    return periodMappings[periodCode] || periodCode; // Retourne la transformation ou le code original si non trouvé
}

function parseCSVtoJSON(csvText) {
    Papa.parse(csvText, {
        delimiter: ';',
        newline: '',
        quoteChar: '"',
        escapeChar: '"',
        skipEmptyLines: true,
        header: false,
        complete: function(results) {
            const data = results.data;
            const arborescence = {};
            const infoprev = {};

            data.forEach((fields, index) => {
                if (index === 0) return; // Skip header

                const period = transformPeriod(fields[0]); // Transform the period
                const binder = "Classeur " + fields[1]; // Prefix "Classeur" to binder
                const page = fields[2];
                const sectorMachine = fields[5];
                const ficheNumber = fields[3]; // Numéro de fiche
                const summary = replaceNewLines(fields[8]);
                const instructions = replaceNewLines(fields[9]);
                const remark = replaceNewLines(fields[10]);
                const theoreticalWorkTime = fields[22]; // Heure de travail théorique

                // Construire la structure pour arborescence
                if (!arborescence[period]) {
                    arborescence[period] = {};
                }
                if (!arborescence[period][binder]) {
                    arborescence[period][binder] = {};
                }

                const key = `${page} - ${sectorMachine}`;
                if (!arborescence[period][binder][key]) {
                    arborescence[period][binder][key] = {
                        "Résumé intervention": summary,
                        "Numéro de fiche": ficheNumber
                    };
                }

                // Construire la structure pour infoprev
                if (!infoprev[ficheNumber]) {
                    infoprev[ficheNumber] = {
                        "Machine": sectorMachine,
                        "Résumé intervention": summary,
                        "Instructions": instructions,
                        "Remarque": remark,
                        "Heure de travail théorique": theoreticalWorkTime
                    };
                }
            });

            // Générer les deux constantes pour le fichier JS
            const arborescenceStr = "const arborescence = " + JSON.stringify(arborescence, null, 2) + ";\n";
            const infoprevStr = "const infoprev = " + JSON.stringify(infoprev, null, 2) + ";\n";

            // Afficher dans la zone de texte pour vérification
            document.getElementById('jsonDataDisplay').textContent = arborescenceStr + infoprevStr;
        }
    });
}

function replaceNewLines(text) {
    return text.replace(/\r\n|\n|\r/g, ', '); // Remplace les sauts de ligne par ", "
}

function exportToJsonFile() {
    const dataStr = document.getElementById('jsonDataDisplay').textContent;
    const dataUri = 'data:application/javascript;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = 'lieu.js';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

  document.getElementById('updateButton').addEventListener('click', function() {
    // Récupère le contenu affiché dans l'élément 'jsonDataDisplay'
    const content = document.getElementById('jsonDataDisplay').textContent;
    
    // Prépare les données à envoyer via POST
    const formData = new FormData();
    formData.append('fileContent', content);

    // Envoie le contenu au fichier PHP updateLieuPrev.php
    fetch('updateLieuPrev.php', {
      method: 'POST',
      body: formData
    })
    .then(response => response.text())
    .then(result => {
      // Affiche le résultat renvoyé par le serveur
      alert(result);
    })
    .catch(error => {
      console.error('Erreur:', error);
    });
  });