const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
let currentJourIndex = (new Date().getDay() + 6) % 7;


async function loadPlanningData() {
  try {
    // 💡 Lecture depuis IndexedDB
    //console.log("✅ Planning chargé depuis IndexedDB :", planningData);

    // Init select
    const select = document.getElementById("technicienSelect");
    if (select && planningData.utilisateurs) {
      select.innerHTML = "";
      for (const nom in planningData.utilisateurs) {
        if (nom.toUpperCase() === "PAUSE") continue;
        const option = document.createElement("option");
        option.value = nom;
        option.textContent = `Tech ${nom}`;
        select.appendChild(option);
      }
    }

    // Init affichage jour
    const jourNom = jours[currentJourIndex];
    document.getElementById("jourAffichage").textContent = jourNom;
    document.getElementById("jourAffichageModal").textContent = jourNom;

    afficherJour(currentJourIndex);
    afficherPlanning();

  } catch (error) {
    console.error("❌ Erreur lecture Planning dans IndexedDB :", error);
    planningData = {};
  }
}





function changerJour(delta) {
  currentJourIndex = (currentJourIndex + delta + 7) % 7;
  const jourNom = jours[currentJourIndex];
  document.getElementById("jourAffichage").texqtContent = jourNom;
  document.getElementById("jourAffichageModal").textContent = jourNom;

  afficherJour(currentJourIndex);
  afficherPlanning();
}

function afficherJour(index) {
  const jourNom = jours[index];
  document.getElementById("jourAffichage").textContent = jourNom;

  const param = planningData.parametres[jourNom];
  const blocs = planningData.blocs[jourNom] || [];
  const machines = planningData.machines || [];

  const startHour = param?.startHour ?? 8;
  const totalHours = param?.totalHours ?? 8;
  const pauseStart = param?.pauseStart ?? 12;
  const pauseEnd = param?.pauseEnd ?? 13;
  const divisions = 4;
  const pas = 1 / divisions;
  const nbCol = Math.ceil(totalHours * divisions);

  const thead = document.getElementById("planningHead");
  const tbody = document.getElementById("planningBody");
  thead.innerHTML = "";
  tbody.innerHTML = "";

  const head1 = document.createElement("tr");
  const head2 = document.createElement("tr");
  head1.innerHTML = '<th rowspan="2">Machine</th>';
  for (let h = 0; h < Math.ceil(totalHours); h++) {
    const th = document.createElement("th");
    th.colSpan = divisions;
    th.textContent = `${(Math.floor(startHour + h)) % 24}h`;
    head1.appendChild(th);
    for (let d = 0; d < divisions; d++) {
      const td = document.createElement("th");
      td.textContent = "";
      head2.appendChild(td);
    }
  }
  thead.append(head1, head2);

  machines.forEach((nom, rowIndex) => {
    const tr = document.createElement("tr");
    const tdLabel = document.createElement("td");
    tdLabel.textContent = nom;
    tr.appendChild(tdLabel);

    let cursor = 0;
    while (cursor < nbCol) {
      const bloc = blocs.find(b => b.ligne === rowIndex && b.start === cursor);
      const td = document.createElement("td");
      const currentHour = startHour + Math.floor(cursor / divisions) + (cursor % divisions) * pas;

      if (bloc) {
        td.colSpan = bloc.end - bloc.start + 1;
        td.textContent = bloc.texte;
        if (bloc.user) {
          td.classList.add(bloc.user);
          td.style.backgroundColor = planningData.utilisateurs[bloc.user] || "";
        }
        td.classList.add("merged");
        if (bloc.codeFiche) {
          td.style.cursor = "pointer";
          td.addEventListener("click", () => ouvrirIframe(bloc.codeFiche));
        }
        cursor = bloc.end + 1;
      } else {
  // Détermine les types
  const isExtra = cursor >= nbCol;
  const isBeforeStart = cursor < ((startHour % 1) * divisions);

  if (isExtra || isBeforeStart) {
    td.classList.add("hors-duree");
  } else {
    td.classList.add("editable");
  }

  cursor++;
}

      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  });
}



async function afficherPlanning() {
  const user = document.getElementById("technicienSelect").value;
  const container = document.getElementById("cartesContainer");
  container.innerHTML = "";

  const aujourdHui = new Date();
  aujourdHui.setHours(0, 0, 0, 0);

  const lundi = new Date(aujourdHui);
  const correction = lundi.getDay() === 0 ? -6 : 1 - lundi.getDay();
  lundi.setDate(lundi.getDate() + correction);
  lundi.setHours(0, 0, 0, 0);

  const selectedDayIndex = currentJourIndex;
  const selectedDate = new Date(lundi);
  selectedDate.setDate(lundi.getDate() + selectedDayIndex);
  selectedDate.setHours(0, 0, 0, 0);

  const selectedJourNom = jours[selectedDayIndex];
  const param = planningData.parametres[selectedJourNom] || {};
  const machines = planningData.machines || [];
  const startHour = param.startHour ?? 8;

  // Parsing des fiches terminées
  let lieuxHebdo = [];
  try {
    const data = await getPrefixedItem('lieuxHebdo');
    lieuxHebdo = JSON.parse(data || '[]');
  } catch (e) {
    console.warn("Erreur parsing lieuxHebdo :", e);
  }

  const validations = new Map(); // codeFiche => [dates]
  lieuxHebdo.forEach(entry => {
    const date = new Date(entry.date);
    date.setHours(0, 0, 0, 0);
    const key = entry.code;
    if (!validations.has(key)) validations.set(key, []);
    validations.get(key).push(date);
  });
// ➕ Nouvelle Map avec validation la plus récente de cette semaine
const validationsHebdo = new Map();

for (const [code, dates] of validations.entries()) {
  const cetteSemaine = dates.filter(d => d >= lundi && d <= new Date(lundi.getTime() + 6 * 24 * 3600 * 1000));
  if (cetteSemaine.length > 0) {
    const plusRecente = cetteSemaine.reduce((max, d) => (d > max ? d : max), new Date(0));
    validationsHebdo.set(code, plusRecente);
  }
}

  // Initialisation
  // Initialisation
const blocFini = [];
let blocDuJour = [];
let blocRetard = [];

// Parcours des 7 jours de la semaine
for (let i = 0; i < 7; i++) {
  const jour = jours[i];
  const blocs = planningData.blocs[jour] || [];

  const dateJour = new Date(lundi);
  dateJour.setDate(lundi.getDate() + i);
  dateJour.setHours(0, 0, 0, 0);

  for (const b of blocs) {
    if (b.user !== user) continue; // ❗ Filtrage utilisateur immédiat

    const code = b.codeFiche;
const datesValide = validations.get(code) || [];
const validationDuJour = datesValide.find(d => d.getTime() === dateJour.getTime());
const validationAvantJour = datesValide.find(d => d.getTime() < dateJour.getTime());

if (dateJour.getTime() === selectedDate.getTime()) {
  if (validationDuJour) {
    blocFini.push(b); // ✔ validée aujourd’hui → terminé
  } else if (validationAvantJour) {
    blocDuJour.push(b); // 🟡 validée trop tôt → à refaire
  } else {
    blocDuJour.push(b); // ❗ jamais faite → à faire
  }
}
else if (dateJour < selectedDate) {
  // En retard si jamais validée ou validée après ce jour
  const validApres = datesValide.find(d => d.getTime() > dateJour.getTime());
  if (!validationDuJour && !validApres) {
    const precedent = blocRetard.find(r => r.codeFiche === code);
    if (!precedent || dateJour > precedent.__dateJour) {
      if (precedent) blocRetard = blocRetard.filter(r => r !== precedent);
      blocRetard.push({ ...b, jour, __dateJour: new Date(dateJour) });
    }
  }
}


  }
}

// Épuration finale des retards : supprimer si une validation >= à la date d’origine
blocRetard = blocRetard.filter(b => {
  const dates = validations.get(b.codeFiche) || [];
  const plusRecente = dates.reduce((max, d) => (d > max ? d : max), new Date(0));
  return plusRecente.getTime() < b.__dateJour.getTime();
});


// Ne pas afficher les retards s’ils sont déjà validés ce jour
const codesFiniJour = new Set(blocFini.map(b => b.codeFiche));
blocRetard = blocRetard.filter(b => !codesFiniJour.has(b.codeFiche));


  // Génération UI
  const creerSection = (titre, id) => {
    const section = document.createElement("div");
    section.innerHTML = `
      <h3 style="cursor:pointer;" onclick="toggleSection('${id}')">
        ${titre} <span id="toggle-icon-${id.replace("Content", "")}">▼</span>
      </h3>
      <div class="section-wrapper">
        <div class="section-placeholder" id="placeholder-${id}"></div>
        <div id="${id}" class="section-content"></div>
      </div>`;
    return section;
  };

  const createCarte = (b, isFini = false, isRetard = false) => {
    const carte = document.createElement("div");
    carte.className = "carte-intervention" + (isFini ? " fini" : "");
carte.style.backgroundColor = isFini
  ? lightenColor(planningData.utilisateurs[user] || "#cccccc", 40)
  : (isRetard ? "#ffd6d6" : (planningData.utilisateurs[user] || "#cccccc"));

    const titre = `${isRetard ? b.jour + " : " : ""}${b.texte}`;
    const resume = getResumeFiche(b.codeFiche);
    const truncated = resume.length > 60 ? resume.slice(0, 57) + "..." : resume;
    const duree = (b.end - b.start + 1) * 15;
    const heureStr = `${convertTime(b.start, startHour)} - ${convertTime(b.end + 1, startHour)}`;

    carte.innerHTML = `
      <strong>${machines[b.ligne]}</strong><br>
      ${titre}<br>
      ${heureStr}<br>
      <em class="resume-ligne">${truncated}</em>
      <div class="boutons-container">
        ${!isFini ? `<button onclick="ouvrirIframe('${b.codeFiche}')">Lancer</button>` : ""}
        <button onclick="afficherResumeModal('${b.codeFiche}', \`${resume}\`, ${duree}, \`${titre}\`)">Résumé</button>
      </div>`;

    return carte;
  };

  const renderCartes = (bloc, id, max, isFini = false, isRetard = false) => {
    const content = document.getElementById(id);
    content.innerHTML = "";
bloc
  .filter(b => b.texte && b.texte.trim() !== "." && b.codeFiche && b.codeFiche.trim() !== "")
  .slice(0, max)
  .forEach(b => content.appendChild(createCarte(b, isFini, isRetard)));
    if (bloc.length > max) {
      const btn = document.createElement("button");
      btn.textContent = "Voir tout";
      btn.onclick = () => {
        btn.remove();
bloc
  .filter(b => b.texte && b.texte.trim() !== "." && b.codeFiche && b.codeFiche.trim() !== "")
  .slice(max)
  .forEach(b => content.appendChild(createCarte(b, isFini, isRetard)));
        changerCouleur();
      };
      content.appendChild(btn);
    }
  };

  // Affichage des sections
  container.append(
    creerSection("Aujourd'hui", "aujourdhuiContent"),
    creerSection("🔴 Retards", "retardContent"),
    creerSection("✔ Terminé", "termineContent")
  );

  blocRetard.sort((a, b) => b.__dateJour - a.__dateJour);

  renderCartes(blocDuJour, "aujourdhuiContent", 3);
  renderCartes(blocRetard, "retardContent", 3, false, true);
  renderCartes(blocFini, "termineContent", 3, true);

  if (blocDuJour.length > 0) {
    openSection("aujourdhuiContent");
    closeSection("retardContent");
    closeSection("termineContent");
  } else {
    openSection("retardContent");
    openSection("termineContent");
    closeSection("aujourdhuiContent");
  }

  changerCouleur();
}


function toggleSection(activeId) {
  const sections = ["aujourdhuiContent", "retardContent", "termineContent"];
  const icons = {
    "aujourdhuiContent": "toggle-icon-aujourdhui",
    "retardContent": "toggle-icon-retard", 
    "termineContent": "toggle-icon-termine"
  };

  sections.forEach(sectionId => {
    const content = document.getElementById(sectionId);
    const icon = document.getElementById(icons[sectionId]);
    const wrapper = content.closest(".section-wrapper");
    const placeholder = document.getElementById(`placeholder-${sectionId}`);

    if (sectionId === activeId) {
      const isVisible = content.style.display !== "none";
      content.style.display = isVisible ? "none" : "block";
      icon.textContent = isVisible ? "▲" : "▼";

      if (wrapper) wrapper.classList.toggle("fermee", isVisible);
      if (placeholder) {
        placeholder.innerHTML = '';
        if (isVisible) ajouterCarteVide(sectionId);
      }
    } else {
      content.style.display = "none";
      icon.textContent = "▲";
      if (wrapper) wrapper.classList.add("fermee");
      if (placeholder) ajouterCarteVide(sectionId);
    }
  });
}


function openSection(sectionId) {
  const section = document.getElementById(sectionId);
  const wrapper = section.closest(".section-wrapper");
  const placeholder = document.getElementById(`placeholder-${sectionId}`);
  const icon = document.getElementById(`toggle-icon-${sectionId.split('Content')[0]}`);

  section.style.display = "block";
  if (wrapper) wrapper.classList.remove("fermee");
  if (placeholder) placeholder.innerHTML = '';
  if (icon) icon.textContent = "▼";
}




function closeSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  section.style.display = "none";

  const icon = document.getElementById(`toggle-icon-${sectionId.split('Content')[0]}`);
  if (icon) icon.textContent = "▲";

  const wrapper = section.closest(".section-wrapper");
  const placeholder = document.getElementById(`placeholder-${sectionId}`);

  // Vérifie si la section a des cartes
  const hasCartes = section.querySelector(".carte-intervention");
  if (hasCartes && wrapper && placeholder) {
    wrapper.classList.add("fermee");
    ajouterCarteVide(sectionId);
  } else {
    if (wrapper) wrapper.classList.remove("fermee");
    if (placeholder) placeholder.innerHTML = '';
  }
}



function getResumeFiche(codeFiche) {
  for (const niveau1 of Object.values(arborescence)) {
    for (const niveau2 of Object.values(niveau1)) {
      for (const [key, value] of Object.entries(niveau2)) {
        if (value["Numéro de fiche"] === codeFiche) {
          return value["Résumé intervention"] || "";
        }
      }
    }
  }
  return "Résumé non trouvé.";
}

function afficherResumeModal(codeFiche, resume, duree, afficheTexte) {
  let modal = document.getElementById("modalResume");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modalResume";
    modal.style = "position:fixed; top:20%; left:10%; width:80%; background:#fff; border:2px solid #000; padding:1em; z-index:9999;";
    document.body.appendChild(modal);
  }
modal.innerHTML = `
  <h3>Fiche n° ${codeFiche}</h3>
  <p>${afficheTexte}</p>
  <p>${resume}</p>
  <p><strong>Durée estimée :</strong> ${Math.floor(duree / 60)}h${(duree % 60).toString().padStart(2, "0")}min</p>
  <button onclick="document.getElementById('modalResume').style.display='none'">Fermer</button>
  <button onclick="ouvrirIframe('${codeFiche}')">Lancer chrono</button>
`;

  modal.style.display = "block";
}



function convertTime(index, startHour = 0) {
  const heure = startHour + Math.floor(index / 4);
  const minutes = (index % 4) * 15;
  return `${Math.floor(heure % 24)}h${minutes.toString().padStart(2, "0")}`;
}

function ouvrirModalplann() {
  document.getElementById("modalPlanning").style.display = "block";
}

function fermerModalplann() {
  document.getElementById("modalPlanning").style.display = "none";
}

document.getElementById("technicienSelect").addEventListener("change", function() {
  afficherPlanning();
});


function ajouterCarteVide(sectionId) {
  const content = document.getElementById(sectionId);
  const placeholder = document.getElementById(`placeholder-${sectionId}`);
  const wrapper = content?.closest(".section-wrapper");
  if (!content || !placeholder || !wrapper) return;

  // Ne rien faire si la section ne contient aucune carte
  const aDesCartes = content.querySelector(".carte-intervention");
  if (!aDesCartes) {
    wrapper.classList.remove("fermee");
    placeholder.innerHTML = '';
    return;
  }

  // Couleur selon la section et le technicien
  const user = document.getElementById("technicienSelect")?.value || "A";
  let couleurFond = "#ffd6d6"; // Retard par défaut
if (sectionId === "termineContent") {

couleurFond = lightenColor(planningData.utilisateurs[user] || "#cccccc", 40);

} else if (sectionId === "aujourdhuiContent") {
  couleurFond = planningData.utilisateurs[user] || "#cccccc";
}


  // Création de la carte vide
  const carte = document.createElement("div");
  carte.className = "carte-intervention carte-vide";
  carte.style.backgroundColor = couleurFond;

  const overlay = document.createElement("div");
  overlay.className = "carte-vide-overlay";

  carte.appendChild(overlay);
  placeholder.innerHTML = '';
  placeholder.appendChild(carte);

  wrapper.classList.add("fermee");
}

function lightenColor(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + percent);
  const g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
  const b = Math.min(255, (num & 0x0000FF) + percent);
  return `rgb(${r}, ${g}, ${b})`;
}



function ouvrirModalExportpng() {

  const jourNom = jours[currentJourIndex];
  const param = planningData.parametres[jourNom] || {};
  const startHour = parseFloat(param.startHour ?? 8) -0.5;
  const totalHours = parseFloat(param.totalHours ?? 8);
  const endBase = startHour + totalHours - 0.5;

  const start = startHour;
  const end = startHour + totalHours;

  // Remplissage des champs de la modal
  document.getElementById("exportStartHour").value = start;
  document.getElementById("exportEndHour").value = end;

  exportEndHourOrigine = endBase;
  valeurInitialeExport = endBase - startHour - 0.5; // ✅ Sauvegarde globale
defautstart = startHour;
  genererPreviewExport();
  document.getElementById("modalExportpng").style.display = "block";
}





function genererPreviewExport() {
  const start = parseFloat(document.getElementById("exportStartHour").value) - 4.75;
  const end = parseFloat(document.getElementById("exportEndHour").value) + (start - defautstart) + .25;
  if (isNaN(start) || isNaN(end) || start >= end) {
    alert("Plage horaire invalide.");
    return;
  }

  const baseStart = 0;
  const startIndex = Math.round((start - baseStart) * 4);
  const endIndex = Math.round((end - baseStart - start) * 4);

  const preview = document.getElementById("previewExport");
  preview.innerHTML = "";

  const sourceTable = document.getElementById("planningTable");
  const tableClone = sourceTable.cloneNode(true);
  tableClone.id = "planningTableExport";
  tableClone.style.marginBottom = "10px";

  tableClone.querySelectorAll("button").forEach(btn => btn.remove());

  const allRows = tableClone.querySelectorAll("tr");

  allRows.forEach((row) => {
    let colIndex = 0;
    const cells = Array.from(row.querySelectorAll("td, th"));
    cells.forEach(cell => {
      const span = cell.colSpan || 1;
      const isHorsPlage = colIndex + span <= startIndex || colIndex >= endIndex;
      if (cell.cellIndex > 0 && isHorsPlage) {
        cell.remove();
      }
      colIndex += span;
    });
  });

// Supprimer colonne excédentaire si besoin
const currentEnd = parseFloat(document.getElementById("exportEndHour").value);   // durée actuelle
const currentStart = parseFloat(document.getElementById("exportStartHour").value); // heure de début
const currentFinHeure = currentStart + currentEnd;
const referenceHeureFin = defautstart + 0.5 + valeurInitialeExport;


if (
  valeurInitialeExport !== null &&
  currentEnd < referenceHeureFin &&
  allRows.length >= 2
) {
  const secondHeaderRow = allRows[1];
  const ths = secondHeaderRow.querySelectorAll("th");
  if (ths.length > 0) {
    ths[ths.length - 1].remove();
  }
} else {
}




  // ➕ Création d’un conteneur central (tableau + pied)
  const exportWrapper = document.createElement("div");
  exportWrapper.style.display = "flex";
  exportWrapper.style.flexDirection = "column";
  exportWrapper.style.alignItems = "center";
  exportWrapper.style.width = "fit-content";
  exportWrapper.style.margin = "0 auto";

  exportWrapper.appendChild(tableClone);

  // ➕ Ligne de légende alignée sous le tableau
  const footerBar = document.createElement("div");
  footerBar.style.display = "flex";
  footerBar.style.justifyContent = "space-between";
  footerBar.style.alignItems = "center";
  footerBar.style.width = tableClone.offsetWidth + "px"; // ⚠️ à recalculer dynamiquement après insertion si besoin
  footerBar.style.fontSize = "14px";
  footerBar.style.gap = "10px";

  // 📌 Correction dynamique si offsetWidth = 0 (table pas encore insérée dans le DOM)
  setTimeout(() => {
    footerBar.style.width = tableClone.offsetWidth + "px";
  }, 0);

  // ⬅️ Légende techniciens
  const legend = document.createElement("div");
  legend.style.display = "flex";
  legend.style.flexWrap = "wrap";
  legend.style.alignItems = "center";
  legend.style.gap = "12px";

const users = planningData.utilisateurs || {};
  for (const [nom, couleur] of Object.entries(users)) {
    if (nom.toUpperCase() === "PAUSE") continue;

    const item = document.createElement("div");
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.gap = "5px";

    const colorBox = document.createElement("div");
    colorBox.style.width = "16px";
    colorBox.style.height = "16px";
    colorBox.style.backgroundColor = couleur;
    colorBox.style.border = "1px solid #000";

    const label = document.createElement("span");
    label.textContent = nom;

    item.appendChild(colorBox);
    item.appendChild(label);
    legend.appendChild(item);
  }

  // 🟨 Titre centré
  const titre = document.createElement("div");
  const jourNom = jours[currentJourIndex];
  titre.textContent = `Planning préventif - ${jourNom.toUpperCase()}`;
  titre.style.flex = "1";
  titre.style.textAlign = "center";

  // ⏱️ Date à droite
  const date = new Date();
  const dateStr = date.toLocaleDateString("fr-FR");
  const dateExport = document.createElement("div");
  dateExport.textContent = dateStr;
  dateExport.style.whiteSpace = "nowrap";

  footerBar.appendChild(legend);
  footerBar.appendChild(titre);
  footerBar.appendChild(dateExport);

  exportWrapper.appendChild(footerBar);
  preview.appendChild(exportWrapper);
}


async function imprimerpng() {
  const sourceElement = document.querySelector("#previewExport > div");

  if (!sourceElement) {
    alert("Aucun contenu à exporter.");
    return;
  }

  const jourAffichageSpan = document.getElementById("jourAffichageModal");
  const jourNom = jourAffichageSpan ? jourAffichageSpan.textContent.toUpperCase() : "JOUR";
  const date = new Date();
  const jour = String(date.getDate()).padStart(2, "0");
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const annee = String(date.getFullYear()).slice(2);
  const nomFichier = `Planning-Prev-${jourNom}-${jour}-${mois}-${annee}.png`;

// 🎯 Scale dynamique entre 3 (large écran) et 8 (petit tableau)
const baseWidth = sourceElement.scrollWidth;
const minScale = 4;
const maxScale = 8;

// Seuils de largeur entre lesquels on ajuste le scale
const minWidth = 600;  // petite div → gros zoom
const maxWidth = 1800; // très large div → petit zoom

if (baseWidth <= minWidth) {
  scaleFactor = maxScale;
} else if (baseWidth >= maxWidth) {
  scaleFactor = minScale;
} else {
  const ratio = (baseWidth - minWidth) / (maxWidth - minWidth);
  scaleFactor = maxScale - ratio * (maxScale - minScale);
}

  const width = sourceElement.scrollWidth;
  const height = sourceElement.offsetHeight;

  // ✅ Clone sans gonfler sa taille logique
  const clone = sourceElement.cloneNode(true);
  clone.style.position = "absolute";
 clone.style.left = "-99999px";
  clone.style.top = "0";
  clone.style.background = "white";
  clone.style.transform = `scale(${scaleFactor})`;
  clone.style.transformOrigin = "top";
  clone.style.width = width + "px";
  clone.style.height = height + "px";
  clone.style.overflow = "visible";

  document.body.appendChild(clone);

  try {
    const blob = await domtoimage.toBlob(clone, {
      bgcolor: "white",
      width: width * scaleFactor,
      height: height * scaleFactor,
 
    });

    const blobUrl = URL.createObjectURL(blob);
    document.body.removeChild(clone);

    // 🔍 Affichage modal
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100vw";
    container.style.height = "100vh";
    container.style.background = "rgba(0,0,0,0.95)";
    container.style.zIndex = "9999";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";
    container.style.padding = "20px";
    container.style.boxSizing = "border-box";

    const title = document.createElement("p");
    title.textContent = `Prévisualisation : ${nomFichier}`;
    const scaleInfo = document.createElement("p");
scaleInfo.textContent = `Facteur de zoom : ${scaleFactor.toFixed(2)}x`;
scaleInfo.style.color = "#ccc";
scaleInfo.style.fontSize = "0.9em";
scaleInfo.style.marginBottom = "15px";
scaleInfo.style.textAlign = "center";

    title.style.color = "white";
    title.style.fontWeight = "bold";
    title.style.marginBottom = "10px";
    title.style.textAlign = "center";

    const img = document.createElement("img");
    img.src = blobUrl;
    img.alt = nomFichier;
    img.style.maxWidth = "90vw";
    img.style.maxHeight = "70vh";
    img.style.border = "2px solid white";
    img.style.marginBottom = "15px";

    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "10px";

    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = "📥 Télécharger";
    downloadBtn.style.padding = "10px 20px";
    downloadBtn.onclick = () => {
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = nomFichier;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Fermer";
    closeBtn.style.padding = "10px 20px";
    closeBtn.onclick = () => {
      URL.revokeObjectURL(blobUrl);
      document.body.removeChild(container);
    };

    buttonContainer.appendChild(downloadBtn);
    buttonContainer.appendChild(closeBtn);

    container.appendChild(title);
    container.appendChild(scaleInfo); 
    container.appendChild(img);
    container.appendChild(buttonContainer);
    document.body.appendChild(container);

  } catch (err) {
    console.error("Erreur lors de la capture :", err);
    alert("Erreur lors de la capture de l'image.");
    if (document.body.contains(clone)) document.body.removeChild(clone);
  }
}


document.getElementById("exportStartHour").addEventListener("keydown", function(e) {
  if (e.key === "," || e.key === "." || e.key === "e") {
    e.preventDefault();
  }
});

document.getElementById("exportEndHour").addEventListener("keydown", function(e) {
  if (e.key === "," || e.key === "." || e.key === "e") {
    e.preventDefault();
  }
});

