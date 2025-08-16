document.getElementById('resetNotifButton').addEventListener('click', async () => {
  if (confirm("Voulez-vous vraiment réinitialiser toutes les notifications ?")) {
    await removePrefixedItem('popup_aide_global');

    await removePrefixedItem('Notification');
    await removePrefixedItem('NotificationEtModal');

    alert("✅ Notifications réinitialisées.");
  }
});



// Liste temporaire des popups affichées (mémoire vive uniquement)
const popupsActives = new Set();



async function afficherPopupAideCustom(target, texte, cleStorage, maxAffichages = 7) {
  let state = await getPopupState();

  if (state[cleStorage] === 'fermé') return;

  let compteur = parseInt(state[cleStorage] || '0', 10);
  if (compteur >= maxAffichages) {
    state[cleStorage] = 'fermé';
    await setPopupState(state);
    return;
  }
  state[cleStorage] = String(compteur + 1);
  await setPopupState(state);

  let elementCible = null;
  if (typeof target === 'string') {
    if (target.startsWith('#')) {
      elementCible = document.getElementById(target.substring(1));
    } else if (target.startsWith('.')) {
      const collection = document.getElementsByClassName(target.substring(1));
      elementCible = collection.length > 0 ? collection[0] : null;
    } else {
      elementCible = document.querySelector(target);
    }
  } else if (target instanceof HTMLElement) {
    elementCible = target;
  }

  if (!elementCible) {
    console.warn("Cible introuvable :", target);
    return;
  }

  if (popupsActives.has(elementCible)) {
    console.log("Popup déjà affichée pour cette cible");
    return;
  }

  popupsActives.add(elementCible);

  const popup = document.createElement('div');
  popup.className = 'popup-aide';
  popup.innerHTML = `
    <span class="popup-aide-close" title="Ne plus afficher">&times;</span>
    <div class="popup-aide-body">${texte}</div>
  `;

  elementCible.appendChild(popup);

  const dureeAffichage = 7000;
setTimeout(() => {
    // 1. Mesure la hauteur actuelle
    const currentHeight = popup.offsetHeight + "px";

    // 2. Applique cette hauteur fixe avant transition
    popup.style.height = currentHeight;

    // 3. Oblige le navigateur à prendre en compte cette hauteur (reflow forcé)
    popup.offsetHeight;  // forcer un reflow

    // 4. Applique la transition et réduit à 0
    popup.style.transition = "height 500ms ease, opacity 500ms ease";
    popup.style.height = "0px";
    popup.style.opacity = "0";

    // 5. Supprime après la transition
    setTimeout(() => {
        popup.remove();
        popupsActives.delete(elementCible);
    }, 500);
}, dureeAffichage);


  popup.querySelector('.popup-aide-close').addEventListener('click', async () => {
    popup.remove();
    popupsActives.delete(elementCible);
    state = await getPopupState();
    state[cleStorage] = 'fermé';
    await setPopupState(state);
  });
}


async function getPopupState() {
  const data = await getPrefixedItem('popup_aide_global');
  if (!data) return {};

  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("❌ Erreur de parsing JSON:", e);
      return {};
    }
  }

  // Si déjà objet
  return data;
}


async function setPopupState(state) {
  await setPrefixedItem('popup_aide_global', JSON.stringify(state));
}


//afficherPopupAideCustom(
//      ".scrollable-tabs",
 //     `Il est maintenant possible de réorganiser les notes via le <>`,
 //     'pop_note_tab',
 //     7
 //   ); 