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