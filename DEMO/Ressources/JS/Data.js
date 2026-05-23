const LS_FASTSTART_OVERRIDE = 'DEV_FASTSTART_OVERRIDE';
const LIEUX_PHP = {
  get: '/G-MAPP/Ressources/PHP/lieuxHebdo_get.php',
  set: '/G-MAPP/Ressources/PHP/lieuxHebdo_set.php'
};
function isLieuxHebdoKeyString(k){
  // k peut être "lieuxHebdo" ou "Work_lieuxHebdo" ou "Comm_lieuxHebdo_CRH" etc.
  return typeof k === 'string' && k.toLowerCase().includes('lieuxhebdo');
}
// Remplacement de : /G-MAPP/Ressources/PHP/lieuxHebdo_get.php
async function fetchLieuxHebdoFromSecondary(username, key) {
  // On construit une clé unique pour le localStorage
  const localKey = `${username}_${key}`;
  
  const val = localStorage.getItem(localKey);
  
  if (val) {
    try {
      return JSON.parse(val);
    } catch (e) {
      console.warn("Erreur de parsing JSON pour LieuxHebdo, retour tableau vide.");
      return [];
    }
  }
  return [];
}

// Remplacement de : /G-MAPP/Ressources/PHP/lieuxHebdo_set.php
async function pushLieuxHebdoToSecondary(prefix, keyOnServer, valueToSend) {
  try {
    // Si la clé contient déjà le préfixe, on ne le rajoute pas, sinon on concatène
    // (Dans ton code original, keyOnServer semble parfois déjà inclure le contexte)
    const localKey = keyOnServer.startsWith(prefix) ? keyOnServer : `${prefix}_${keyOnServer}`;
    
    // On s'assure que ce soit une string avant de stocker
    const stringValue = typeof valueToSend === 'string' ? valueToSend : JSON.stringify(valueToSend);
    
    localStorage.setItem(localKey, stringValue);
    return true; // Succès simulé
  } catch (e) {
    console.error("Erreur écriture localStorage (Quota dépassé ?):", e);
    return false;
  }
}



// Flag pour message reçu
if (typeof window.createMessageReceived === "undefined") {
  window.createMessageReceived = false;
}
window.isAppIDInitialized = false;

// Liste des clés filtrées
window.filterKeys = window.filterKeys || [
  "userChoice", "TABUL", "uver", "notesIndex", "note",
  "lastLoginTime", "luminositeCouleur", "buttonConfig",
  "angleCouleur", "popup_aide_global", "themeEnabled", "Notification", "contrastEnabled"
];

// Paramètres d'URL
window.urlParams = window.urlParams || new URLSearchParams(window.location.search);

// Utilisateur extrait de l'URL
window.utilisateurExclu = window.utilisateurExclu || window.urlParams.get('user');

// Clé dérivée
window.clé = window.clé || (window.utilisateurExclu + '_uver');

// Type de clé
window.CléType = window.CléType || "";

Promise.resolve(localStorage.getItem(window.clé)).then(val => {
  window.switPreMode = window.switPreMode || val || 'Work';
  CléType = window.switPreMode;

  window.addEventListener('online', async () => {
    await syncroactiv();
  });
});


// Session expirée ?
window.sessionExpired = window.sessionExpired || false;

// Paramètres de déconnexion
window.tempsDeDeconnexion = window.tempsDeDeconnexion || 480; // en minutes
window.extensionMinutes = window.extensionMinutes || 60;      // en minutes

// Objets de synchronisation et stockage en mémoire
window.inMemoryStorage = window.inMemoryStorage || {};
window.syncManager = window.syncManager || { keys: [], operations: [] };

// Qualité de connexion
window.connectionQuality = navigator.onLine ? 3000 : 0;

// Gestion de la session
window.isVerifyingSession = window.isVerifyingSession || false;
window.currentDeviceId = window.currentDeviceId || "";
window.lastFetchTime = window.lastFetchTime || 0;
window.fetchInterval = window.fetchInterval || 5000;

// Dernier statut de connexion
if (typeof window.lastConnectionStatus === "undefined") {
  window.lastConnectionStatus = true;
}

// Clés pour localStorage
window.LOCAL_SUMMARY_KEY = window.LOCAL_SUMMARY_KEY || 'localStorageKeysSummary';
window.LOCAL_BUFFER_KEY = window.LOCAL_BUFFER_KEY || 'localStorageSyncBuffer';



const dbName = "MyAppDBdata";
const storeName = "myStoredata";
let dbInstance = null;
let dbOpenPromise = null;

async function openDB() {
  if (dbInstance) return dbInstance;
  if (dbOpenPromise) return dbOpenPromise;

  dbOpenPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onerror = () => reject("Erreur ouverture IndexedDB");
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
  });

  return dbOpenPromise;
}



async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onerror = () => reject("Erreur lecture");
    request.onsuccess = () => resolve(request.result);
  });
}

async function idbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(value, key);
    request.onerror = () => reject("Erreur écriture");
    request.onsuccess = () => resolve();
  });
}

async function idbRemove(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    request.onerror = () => reject("Erreur suppression");
    request.onsuccess = () => resolve();
  });
}


async function syncroactiv() {
  connectionQuality = await testConnection();
  updateIndicators(connectionQuality, { error: false });

  if (connectionQuality < 1500) {
    console.warn("Connexion trop faible, synchronisation différée.");
    return;
  }

  // Tempo supplémentaire (0,5 s) avant de lancer la vidange
  await new Promise(r => setTimeout(r, 500));

  const allTypes = ['Priv', 'Work', 'Story', 'Comm'];
  const prefix = getStoragePrefix();

  for (const type of allTypes) {
    let baseQueueKey = `${type}_processQueue`;
    let queueKeyToUse = baseQueueKey;

    if (window.crhono === true) {
      const crhKey = `${type}_CRH_processQueue`;
      const crhQueue = await idbGet(prefix + crhKey);
      if (crhQueue && crhQueue !== "[]") {
        queueKeyToUse = crhKey;
      }
    }

    const finalQueueKey = `${prefix}${queueKeyToUse}`;
    let localQueue = JSON.parse(await idbGet(finalQueueKey) || "[]");

    if (localQueue.length > 0) {
      syncManager.operations = localQueue;

      try {
        await processQueue(true);
      } catch (error) {
        console.warn(`Erreur pendant processQueue (${finalQueueKey}) :`, error);
      }

      await idbSet(finalQueueKey, JSON.stringify(syncManager.operations));
    }
  }
}




window.addEventListener('offline', () => {
  console.log('Connexion perdue');
  connectionQuality = 0;
  updateIndicators(connectionQuality, { error: true });
});



async function checkSessionValidity() {
  const raw = await getPrefixedItem("lastLoginTime");

  let actutime;
  try {
    actutime = JSON.parse(raw);
  } catch {
    actutime = raw;
  }

  const alwaysStay = localStorage.getItem('alwaysStayLogged') === 'true';
  const autoLogoutDisabled = await getPrefixedItem("disableAutoLogout");

  const now = new Date();
  //console.log("storedTime : " + actutime);

  if (typeof actutime === "string" && actutime.includes('_')) {
    const loginDate = new Date(actutime.replace('_', 'T'));
    if (isNaN(loginDate)) {
      console.warn("⚠️ Date de session invalide.");
      await showAutoLogoutModal(); 
      return false;
    }

    const diffMs = now - loginDate;
    const diffMinutes = diffMs / (1000 * 60);

    // 🔐 Cas 1 : autoLogoutDisabled actif
    if (autoLogoutDisabled === 'true') {
      if (diffMinutes > tempsDeDeconnexion) {
        const hoursToAdd = 10000;
        now.setTime(now.getTime() - (tempsDeDeconnexion - (hoursToAdd * 60)) * 60 * 1000);

        const extendedTime = now.getFullYear() + '-' +
          (now.getMonth() + 1).toString().padStart(2, '0') + '-' +
          now.getDate().toString().padStart(2, '0') + '_' +
          now.getHours().toString().padStart(2, '0') + ':' +
          now.getMinutes().toString().padStart(2, '0') + ':' +
          now.getSeconds().toString().padStart(2, '0');

        await setPrefixedItem('lastLoginTime', JSON.stringify(extendedTime));
        return false;
      } else {
        return true;
      }
    }

    // Cas normal : déconnexion si le temps est dépassé
    if (diffMinutes > tempsDeDeconnexion && !sessionExpired) {
      sessionExpired = true;
      await showAutoLogoutModal();
      return false;
    }

  } else {
    console.warn("🕒 Aucune date de session trouvée ou format invalide.");

    if (syncManager.operations.length > 0) {
      // Données à synchroniser, on attend
    } else {
      await showAutoLogoutModal();
    }

    return false;
  }

  return true;
}



function scheduleDeconnectionIfQueueEmpty() {
  const interval = setInterval(() => {
    if (syncManager.operations.length === 0) {
      console.warn("✅ File d'attente vidée. Déconnexion...");
      clearInterval(interval);
      deco();
    } else {
      console.log(`⏳ ${syncManager.operations.length} opérations restantes, attente avant déconnexion...`);
    }
  }, 3000);
}


async function showAutoLogoutModal() {
  const modal = document.getElementById('autoLogoutModal');
  const countdownEl = document.getElementById('logoutCountdown');
  const progressBar = document.getElementById('logoutProgressBar');
  const extendBtn = document.getElementById('extendSessionBtn');
  const logoutBtn = document.getElementById('logoutNowBtn');
const stayLoggedBtn = document.getElementById('stayLoggedBtn');

  // 🔒 Sécurité : si l’un des éléments est introuvable, on ne fait rien
  if (!modal || !countdownEl || !progressBar || !extendBtn || !logoutBtn) {
    console.warn("❌ Modal de déconnexion non trouvé dans le DOM. Vérifie que le HTML est bien présent.");
    return;
  }

const ua = navigator.userAgent.toLowerCase();
const isZebraTC22or27 = ua.includes("tc22") || ua.includes("tc27") || ua.includes("tc56dj");

// Masquer complètement le bouton si c'est un appareil Zebra non compatible
if (stayLoggedBtn) {
  if (isZebraTC22or27) {
    stayLoggedBtn.style.display = "none";
  } else {
    stayLoggedBtn.style.display = "none";

    // Activer le comportement si l'utilisateur clique dessus
stayLoggedBtn.onclick = async () => {
  localStorage.setItem('alwaysStayLogged', 'true');
  alert("🔓 Vous resterez connecté sur cet appareil.");
  stayLoggedBtn.disabled = true;
  stayLoggedBtn.textContent = "✅ Activé pour cet appareil";
  stayLoggedBtn.style.opacity = "0.7";
  stayLoggedBtn.style.cursor = "default";
};

  }
}



  let timeLeft = 300; // 5 minutes
  modal.style.display = 'flex';

  const interval = setInterval(() => {
    timeLeft--;
    countdownEl.textContent = timeLeft;
    progressBar.style.width = `${(timeLeft / 300) * 100}%`;

    if (timeLeft <= 0) {
      clearInterval(interval);
      modal.style.display = 'none';
      deco();
    }
  }, 1000);

extendBtn.onclick = async () => {
  clearInterval(interval);
  modal.style.display = 'none';



const totalMinutesToSubtract = tempsDeDeconnexion - extensionMinutes;

const now = new Date();
now.setTime(now.getTime() - totalMinutesToSubtract * 60 * 1000); // ← fiable même si > 60min

const extendedTime = now.getFullYear() + '-' +
  (now.getMonth() + 1).toString().padStart(2, '0') + '-' +
  now.getDate().toString().padStart(2, '0') + '_' +
  now.getHours().toString().padStart(2, '0') + ':' +
  now.getMinutes().toString().padStart(2, '0') + ':' +
  now.getSeconds().toString().padStart(2, '0');

  await setPrefixedItem('lastLoginTime', JSON.stringify(extendedTime));
  //console.log(extendedTime)
storedTime = extendedTime
console.log("⏳ Nouvelle session recalée à :", extendedTime);

};


  logoutBtn.onclick = () => {
    clearInterval(interval);
    modal.style.display = 'none';
    deco();
  };
}


async function fetchAndUpdatePrefixedItem(prefixedKey, key, prefix) {
  // Ici, 'prefixedKey' est déjà la clé complète (ex: User_Work_MaClef)
  const val = localStorage.getItem(prefixedKey);

  if (val !== null && val !== undefined) {
    window.inMemoryStorage[prefixedKey] = val;
    return val;
  }
  
  // Fallback : vide si introuvable
  window.inMemoryStorage[prefixedKey] = "";
  return "";
}





function removeFromQueue(operationKey) {
  const index = syncManager.keys.indexOf(operationKey);
  if (index !== -1) {
    syncManager.keys.splice(index, 1);
    console.log(`Opération ${operationKey} retirée de la file d'attente.`);
  }
}

// Remplacement de : /G-MAPP/Ressources/PHP/removeData.php
async function removePrefixedItemInBackground(key, prefix = null) {
  try {
    prefix = prefix || getStoragePrefix();
    const prefixedKey = key.startsWith(prefix) ? key : prefix + key;

    localStorage.removeItem(prefixedKey);

    // ✅ Nettoyage de la queue locale
    const localQueueKey = getLocalQueueKey(); 
    let localQueue = JSON.parse(await idbGet(localQueueKey) || "[]");
    localQueue = localQueue.filter(op => !(op.type === 'delete' && op.key === key));
    await idbSet(localQueueKey, JSON.stringify(localQueue));

  } catch (error) {
    console.error(`Erreur suppression local pour ${key}:`, error);
  }
}
async function processQueue(fromSyncro = false) {
  // Comme nous sommes en mode "LocalStorage Only", nous n'envoyons rien au PHP.
  // Cependant, nous devons vider la queue IndexedDB pour que l'indicateur de synchro (point jaune/rouge) repasse au vert/blanc.
  
  const allTypes = ['Priv', 'Work', 'Story', 'Comm'];
  const username = getStoragePrefix();

  for (const type of allTypes) {
    // On définit les clés de queue
    let queueKeys = [`${username}${type}_processQueue`];
    if (window.crhono === true) {
      queueKeys.push(`${username}${type}_CRH_processQueue`);
    }

    for (const finalQueueKey of queueKeys) {
      // On vide simplement la queue
      await idbSet(finalQueueKey, "[]");
    }
  }
  
  // On vide aussi le tableau en mémoire
  window.syncManager.operations = [];
}

async function processQueueForType(type, isCRH = false, username) {
  let queueKeyType = `${type}_processQueue`;
  if (isCRH) {
    queueKeyType = `${type}_CRH_processQueue`;
  }

  const prefix = getStoragePrefix();
  const finalQueueKey = `${prefix}${queueKeyType}`;

  const localQueue = JSON.parse(await idbGet(finalQueueKey) || "[]");

  if (localQueue.length > 0) {
    //console.log(`🔄 Reprise du processQueue local (${finalQueueKey}) avec ${localQueue.length} opérations`);
  } else {
    //console.log(`✅ Aucun processQueue local à traiter pour ${finalQueueKey}`);
  }

  let updatedQueue = [...localQueue];

  for (const op of localQueue) {
    try {
      if (op.type === 'set') {
        const valueToSend = op.value;

        const response = await fetchWithRetry('/G-MAPP/Ressources/PHP/saveData.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username,
            key: op.key,
            value: valueToSend
          })
        });

        if (response && response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            updatedQueue = updatedQueue.filter(o => !(o.type === 'set' && o.key === op.key));
          } else {
            console.error(`Erreur serveur pour set ${op.key}:`, data.message);
          }
        } else {
          console.error(`Erreur HTTP pour set ${op.key}:`, response ? response.status : 'no response');
        }
      }

      else if (op.type === 'delete') {
        const response = await fetchWithRetry('/G-MAPP/Ressources/PHP/removeData.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username,
            key: op.key
          })
        });

        if (response && response.ok) {
          const data = await response.json();
          if (data.status === 'success' || data.status === 'file_not_found') {
            updatedQueue = updatedQueue.filter(o => !(o.type === 'delete' && o.key === op.key));
            console.log(`✅ Clé ${op.key} supprimée ou déjà absente, retirée du tampon (delete)`);
          } else {
            console.error(`Erreur serveur pour delete ${op.key}:`, data.message);
          }
        } else {
          console.error(`Erreur HTTP pour delete ${op.key}:`, response ? response.status : 'no response');
        }
      }

    } catch (error) {
      console.error(`Erreur réseau pour ${op.key}:`, error);
    }
  }

syncManager.operations = updatedQueue;
await idbSet(finalQueueKey, JSON.stringify(updatedQueue));
}



// Remplacement de : /G-MAPP/Ressources/PHP/saveData.php
async function updatePrefixedItemInBackground(prefixedKey, key, prefix) {
  try {
    const valueToSend = window.inMemoryStorage[prefixedKey];
    
    if (valueToSend !== undefined) {
      localStorage.setItem(prefixedKey, valueToSend);
      
      // ✅ On simule le succès du réseau pour nettoyer la queue locale (IndexedDB)
      // C'est important pour que la synchro ne tourne pas en boucle pour rien.
      const isCommKey = key.startsWith("Comm_");
      const type = isCommKey ? "Comm" : window.CléType;
      
      let baseQueueKey = `${type}_processQueue`;
      if (window.crhono === true) baseQueueKey = `${type}_CRH_processQueue`;
      const finalQueueKey = `${prefix}${baseQueueKey}`;

      let localQueue = JSON.parse(await idbGet(finalQueueKey) || "[]");
      // On retire l'opération de la file d'attente car elle est "sauvegardée"
      localQueue = localQueue.filter(op => !(op.type === 'set' && op.key === key));
      await idbSet(finalQueueKey, JSON.stringify(localQueue));
    }
  } catch (error) {
    console.error(`Erreur update local pour ${key}:`, error);
  }
}

async function createDeviceId() {
  try {
    const browserInfo = navigator.userAgent;

    // Lire deviceName directement dans localStorage
    const deviceName = localStorage.getItem('DEVICE_NAME') || 'unknownDevice';

    return `${browserInfo}-${deviceName}`;
  } catch (error) {
    console.error("Erreur lors de la création de l'ID d'appareil:", error);
    return `${navigator.userAgent}-unknownDevice`;
  }
}


let inMemoryDeviceId = null;

async function getDeviceId() {
  let storedDeviceId = await getPrefixedItemNoVerify('device_id');

  if (!storedDeviceId) {
    const deviceId = await createDeviceId();
    await setPrefixedItemNoVerify('device_id', deviceId);
    return deviceId;
  } else {
    return storedDeviceId;
  }
}


// Préfixe de stockage basé sur l'URL
function getStoragePrefix() {
  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get('user');
  return username ? `${username}_` : '';
}

async function setPrefixedItemold(key, value) {
  const prefix = getStoragePrefix();
  await idbSet(prefix + key, value);
}

async function getPrefixedItemold(key) {
  const prefix = getStoragePrefix();
  return await idbGet(prefix + key);
}

async function removePrefixedItemold(key) {
  const prefix = getStoragePrefix();
  await idbRemove(prefix + key);
}


// Affichage d'une fenêtre de rafraîchissement en cas de besoin
async function showRefreshWarning() {
  const warningModal = document.getElementById('refresh-warning');
  if (!warningModal) {
    console.warn('La fenêtre modale "refresh-warning" n\'est pas présente sur cette page.');
    return;
  }
  const connectionStatus = document.getElementById('connection-status');
  const countdown = document.getElementById('countdown');
  const confirmButton = document.getElementById('confirm-refresh');
  const cancelButton = document.getElementById('cancel-refresh');

  warningModal.style.display = 'flex';

  let connectionQuality = await testConnection();
  let remainingTime = 4;
  let previousConnectionState = connectionQuality > 1500;

  function updateConnectionStatus() {
    connectionStatus.textContent = `État de la connexion : ${
      connectionQuality > 1500
        ? 'Bonne connexion'
        : connectionQuality > 0
        ? 'Connexion moyenne'
        : 'Pas de connexion'
    }`;
  }

  const connectionInterval = setInterval(async () => {
    connectionQuality = await testConnection();
    updateConnectionStatus();
    if (connectionQuality > 1500) {
      if (!previousConnectionState) { remainingTime = 4; }
      previousConnectionState = true;
      confirmButton.disabled = false;
      confirmButton.style.cursor = 'pointer';
    } else {
      previousConnectionState = false;
      confirmButton.disabled = true;
      confirmButton.style.cursor = 'not-allowed';
      countdown.textContent = 'Veuillez vous déplacer vers un endroit où la connexion est meilleure pour réessayer.';
    }
  }, 3000);

  const countdownInterval = setInterval(() => {
    if (connectionQuality > 1500) {
      remainingTime--;
      countdown.textContent = `Patientez au moins ${remainingTime} secondes pour synchroniser les données automatiquement.`;
      if (remainingTime <= 0) {
        clearInterval(countdownInterval);
        countdown.textContent = `Les données devraient être synchronisées. vous pouvez actualiser`;
      }
    }
  }, 3000);

  cancelButton.onclick = () => {
    warningModal.style.display = 'none';
    clearInterval(connectionInterval);
    clearInterval(countdownInterval);
  };

  confirmButton.onclick = () => {
    reloadpp()
  };

  updateConnectionStatus();
}

// window.addEventListener("beforeunload", function(event) {
//   const warningModal = document.getElementById('refresh-warning');
//   if (!warningModal) {
//     console.warn('Aucune fenêtre modale à afficher sur cette page.');
//     return;
//   }
//   event.preventDefault();
//   event.returnValue = "";
//   showRefreshWarning();
// });

// Chargement de toutes les clés depuis le serveur
// Remplacement de : /G-MAPP/Ressources/PHP/getAllKeys.php
async function loadAllKeys() {
  const prefix = getStoragePrefix();
  if (!prefix) return;

  // On parcourt tout le localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    
    // Si la clé commence par le préfixe de l'utilisateur (ex: "Toto_")
    if (key && key.startsWith(prefix)) {
      // On charge la valeur en mémoire
      const val = localStorage.getItem(key);
      window.inMemoryStorage[key] = val;
      
      // Optionnel : Mettre à jour le sommaire local si tu l'utilises
      updateLocalSummary(key);
    }
  }
  console.log("✅ Toutes les clés locales chargées en mémoire.");
}
window.sessionManager = {
  isVerifyingSession: false,
  sessionVerifiedPromise: null,
};


// Récupération de l'IP locale pour l'ID de l'appareil
function getLocalIP() {
  return new Promise((resolve, reject) => {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch((error) => reject('Error setting local description:', error));

    pc.onicecandidate = (event) => {
      if (!event || !event.candidate) return;
      const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
      const match = ipRegex.exec(event.candidate.candidate);
      if (match) {
        const ipAddress = match[1];
        resolve(ipAddress);
      } else {
        reject("Aucune adresse IP trouvée");
      }
      pc.onicecandidate = null;
    };
  });
}

async function setPrefixedItemNoVerify(key, value) {
  const prefix = getStoragePrefix();
  const prefixedKey = prefix + key;
  
  try {
    // Si value est un objet, on stringify. Sinon on stocke tel quel.
    const valToStore = typeof value === 'object' ? JSON.stringify(value) : value;
    
    localStorage.setItem(prefixedKey, valToStore);
    
    // On met aussi à jour IndexedDB pour rester cohérent avec le reste de ton code
    await idbSet(prefixedKey, valToStore);
  } catch (error) {
    console.error("Erreur setNoVerify localStorage:", error);
  }
}



async function removePrefixedItemNoVerify(key) {
  const prefix = getStoragePrefix();
  const prefixedKey = prefix + key;
  localStorage.removeItem(prefixedKey);
}
async function getPrefixedItemNoVerify(key) {
  const prefix = getStoragePrefix();
  const prefixedKey = prefix + key;
  
  const val = localStorage.getItem(prefixedKey);
  
  if (val) {
    try {
      // Ton ancien code PHP renvoyait un JSON { value: ... }
      // Ici on retourne directement la valeur brute ou parsée selon le besoin.
      // Vu l'usage pour device_id, on retourne la string brute souvent.
      return val; 
    } catch {
      return null;
    }
  }
  return null;
}


async function initializeAppID() {
  if (!window.isAppIDInitialized) {
    const deviceId = await createDeviceId();
    window.currentDeviceId = deviceId;
    window.isAppIDInitialized = true;
    //console.log("Device local initialisé:", window.currentDeviceId);

  }
}


function stripQuotes(str) {
  if (typeof str === "string" && str.length >= 2) {
    if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
      return str.slice(1, -1);
    }
  }
  return str;
}

async function verifySession(forceLogoutOnMismatch = false) {
  if (!window.isAppIDInitialized) {
    await initializeAppID();
  }

  if (window.sessionManager.isVerifyingSession) {
    console.log('return')
    return window.sessionManager.sessionVerifiedPromise;
  }

  window.sessionManager.isVerifyingSession = true;
  window.sessionManager.sessionVerifiedPromise = new Promise(async (resolve, reject) => {
    try {
      let storedDevice1 = await getDeviceId(); // serveur
      const current = currentDeviceId;         // créé localement

      storedDevice = stripQuotes(storedDevice1);
      const currentClean = stripQuotes(current);

      // ⏩ FAST-START OVERRIDE: si actif, on ignore toute détection de conflit
      const fastStartOverride =
        localStorage.getItem(LS_FASTSTART_OVERRIDE) === 'true' || window.fastStart === true;

      if (fastStartOverride) {
        console.log('⏩ Fast start override actif : on ignore la vérif d’ID appareil.');
        // (optionnel) consommer l’override une seule fois :
        // localStorage.removeItem(LS_FASTSTART_OVERRIDE);
        resolve(true);
        return;
      }

      // === Comportement normal : on vérifie le conflit ===
      if (storedDevice !== null && storedDevice !== currentClean) {
        console.warn("⚠️ ID d'appareil différent détecté.");
        if (forceLogoutOnMismatch === true) {
          window.parent.postMessage({ type: 'variHRActive' }, '*');
        } else {
          window.parent.postMessage({ type: 'deviceConflict' }, '*');

          const conflictResponse = await new Promise(innerResolve => {
            function handleMessage(event) {
              if (event.data && event.data.type === 'acceptConflict') {
                (async () => {
                  await setPrefixedItemNoVerify('device_id', currentDeviceId);
                  storedDevice = currentDeviceId;
                  window.removeEventListener('message', handleMessage);
                  innerResolve(true);
                })();
              } else if (event.data && event.data.type === 'rejectConflict') {
                window.removeEventListener('message', handleMessage);
                innerResolve(false);
              }
            }
            window.addEventListener('message', handleMessage);
          });

          if (!conflictResponse) {
            console.warn("❌ Conflit non accepté, arrêt sans déco forcée.");
            resolve(false);
            return;
          }
        }
      }

      resolve(true);
    } catch (error) {
      console.error("Erreur lors de la vérification de session :", error);
      reject(error);
    } finally {
      window.sessionManager.isVerifyingSession = false;
    }
  });

  return window.sessionManager.sessionVerifiedPromise;
}







async function fetchWithRetry(url, options = {}, retries = 3, backoff = 300) {
  // Si on est hors ligne, inutile de tenter
if (!navigator.onLine || connectionQuality <= 0) {
  console.log(`⛔ Offline — on ne fetch pas ${key}`);
  return await idbGet(prefixedKey) || "";
}

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
    } catch (error) {
      // Supprimer ce log bruyant si hors ligne
      if (navigator.onLine) {
        console.error(`Tentative ${i + 1} échouée pour ${url}:`, error);
      }
    }
    await new Promise(resolve => setTimeout(resolve, backoff));
    backoff *= 2;
  }
  return null;
}

async function testConnection() {
  try {


    if (!navigator.onLine) {
      connectionQuality = 0;
      return connectionQuality;
    }

    const startTime = performance.now();
    await fetch('void.html', { cache: 'no-store' });
    const latency = performance.now() - startTime;

    connectionQuality = Math.max(0, 3000 - latency);
    //console.log(connectionQuality)
    return connectionQuality;
  } catch (error) {
    console.error('Erreur lors de la tentative de connexion :', error);
    connectionQuality = 0;
    return connectionQuality;
  }
}





function updateIndicators(quality, syncStatus) {
  const reseauLines = document.querySelectorAll('.reseau');
  if (reseauLines.length > 0) {
    if (!navigator.onLine) {
      // Plus rien : hors ligne total
      reseauLines.forEach(line => (line.style.backgroundColor = 'black'));
    } else if (quality > 2500) {
      // Parfait
      reseauLines.forEach(line => (line.style.backgroundColor = 'white'));
    } else if (quality > 1500) {
      // Ça va
      reseauLines.forEach(line => (line.style.backgroundColor = 'orange'));
    } else if (quality > 0) {
      // C'est compliqué
      reseauLines.forEach(line => (line.style.backgroundColor = 'red'));
    } else {
      // Cas rare : en ligne mais qualité = 0, on met noir
      reseauLines.forEach(line => (line.style.backgroundColor = 'black'));
    }
  }

  const synchroLine = document.querySelector('.synchro');
  if (synchroLine) {
    if (!syncStatus.error && syncStatus.toUpdate === 0 && syncStatus.toDelete === 0) {
      synchroLine.style.backgroundColor = 'white';
    } else if (syncStatus.error) {
      synchroLine.style.backgroundColor = 'violet';
    } else {
      synchroLine.style.backgroundColor = 'yellow';
    }
  }
}


async function start() {
  await loadAllKeys();

  const localQueueKey = `${CléType}_processQueue`;
  let localQueue = JSON.parse(await idbGet(localQueueKey) || "[]");

  if (connectionQuality <= 0) {
    // Hors ligne : charger toutes les clés du sommaire dans inMemoryStorage
    const summary = JSON.parse(await idbGet(LOCAL_SUMMARY_KEY) || "[]");
for (const k of summary) {
  const val = await idbGet(k);
  if (val !== null) {
    inMemoryStorage[k] = val;
  }
}


    console.log("✅ Hors ligne — clés chargées en mémoire");
  } else {
    // En ligne : traiter uniquement le processQueue
    if (localQueue.length > 0) {
await processQueue(true);
      // 💥 La queue est déjà mise à jour dans processQueue(), donc pas besoin d'enregistrer à nouveau
    }
  }

  // Ne jamais modifier ni supprimer les clés locales ou le sommaire
  await monitorConnectionAndSync();
  await testConnection();
}

async function monitorConnectionAndSync() {
  setInterval(async () => {
    if (!navigator.onLine) {
      connectionQuality = 0;
      updateIndicators(connectionQuality, { error: true });
      return;
    }

checkSessionValidity();

    const sessionValid = await verifySession(true);
    if (!sessionValid) {
      console.warn("Déconnexion forcée car session invalide (ID appareil).");
      return;
    }

    await testConnection();

    if (connectionQuality > 0) {
      const localQueueKey = `${CléType}_processQueue`;
      let localQueue = JSON.parse(await idbGet(localQueueKey) || "[]");
      if (localQueue.length > 0) {
        syncManager.operations = localQueue;
        await processQueue();
        await idbSet(localQueueKey, JSON.stringify(syncManager.operations));
      }
    }

    updateIndicators(connectionQuality, {
      toUpdate: syncManager.operations.filter(op => op.type === 'set').length,
      toDelete: syncManager.operations.filter(op => op.type === 'delete').length,
      error: false
    });
  }, 5000);
}



async function updateLocalSummary(prefixedKey, remove = false) {
  let summary = JSON.parse(await idbGet(LOCAL_SUMMARY_KEY) || "[]");
  if (remove) {
    summary = summary.filter(key => key !== prefixedKey);
  } else if (!summary.includes(prefixedKey)) {
    summary.push(prefixedKey);
  }
  await idbSet(LOCAL_SUMMARY_KEY, JSON.stringify(summary));
}


async function deco() {
  await removePrefixedItemNoVerify('device_id');
  localStorage.removeItem('AUTOUSER'); // Supprime 'AUTOUSER' du localStorage

  console.log("🔄 Envoi d'un message au parent pour déconnexion");

  // Vérifie la connexion immédiatement
  if (!navigator.onLine) {
    window.parent.postMessage({ type: 'decoParent' }, '*');
    return;
  }

  const modal = document.getElementById("refresh-warning");
  const countdownText = document.getElementById("countdown");
  const connectionStatus = document.getElementById("connection-status");
  const cancelBtn = document.getElementById("cancel-refresh");
  const confirmBtn = document.getElementById("confirm-refresh");

  let progressBar = document.getElementById("progress-bar");
  if (!progressBar) {
    progressBar = document.createElement("div");
    progressBar.id = "progress-bar";
    progressBar.style.height = "8px";
    progressBar.style.backgroundColor = "#4caf50";
    progressBar.style.transition = "width 0.2s linear";
    modal.querySelector("#refresh-warning-content").appendChild(progressBar);
  }
  progressBar.style.width = "100%";

  modal.style.display = "flex";
  confirmBtn.style.display = "none";
  countdownText.textContent = "Merci de patienter...";
  connectionStatus.innerHTML = "Des données peuvent être transmises<br>Déconnextion automatique après :";

  let cancelled = false;
  cancelBtn.onclick = () => {
    cancelled = true;
    modal.style.display = "none";
  };

  let steps = 20;
  let currentStep = 0;

  const intervalId = setInterval(() => {
    if (cancelled) {
      clearInterval(intervalId);
      return;
    }

    currentStep++;
    const percent = 100 - (currentStep / steps) * 100;
    progressBar.style.width = `${percent}%`;

    const secondsLeft = Math.ceil((steps - currentStep) * 0.2);
    countdownText.textContent = `${secondsLeft} seconde${secondsLeft > 1 ? "s" : ""}...`;

    if (currentStep >= steps) {
      clearInterval(intervalId);
      modal.style.display = "none";
      window.parent.postMessage({ type: 'decoParent' }, '*');
    }
  }, 150);
}


window.addEventListener('message', async function(event) {
  const data = event.data;
  if (!data) return;


  if (data.type === 'decoParent') {
//console.log('iframe chrono veut déco')
}


});


async function getPrefixedItem(key) {
  const prefix = getStoragePrefix();
  const isCommKey = filterKeys.some(filter => key.includes(filter));
  let finalKey = isCommKey ? "Comm_" + key : `${CléType}_` + key;
  if (window.crhono === true) finalKey += "_CRH";

  const prefixedKey = prefix + finalKey;

  // ✅ Décide si on force le fetch online (uniquement pour lieuxHebdo)
  const canOnline = navigator.onLine && connectionQuality > 0;
  const isLieux = isLieuxHebdoKeyString(finalKey);
  const forceOnlineFetch = isLieux && canOnline;

  // 🔁 1) Chemin ONLINE prioritaire pour lieuxHebdo
  if (forceOnlineFetch) {
    try {
      const fetchedValue = await fetchLieuxHebdoFromSecondary(prefix, finalKey); // <- PHP secondaire
      if (fetchedValue !== null && fetchedValue !== undefined && fetchedValue !== "") {
        const stringVal = (typeof fetchedValue === "string") ? fetchedValue : JSON.stringify(fetchedValue);
        await idbSet(prefixedKey, stringVal);
        updateLocalSummary(prefixedKey);
        inMemoryStorage[prefixedKey] = stringVal;
        return stringVal; // ← on renvoie la valeur fraiche du serveur
      }
      // si le serveur ne renvoie rien → on tombera en fallback local
    } catch (e) {
      console.warn("fetch lieuxHebdo online KO, fallback local :", e);
    }
  }

  // 🧠 2) Fallback RAM (sauf si on a tenté et raté le online pour lieuxHebdo)
  if (!forceOnlineFetch && inMemoryStorage.hasOwnProperty(prefixedKey) && inMemoryStorage[prefixedKey] !== "") {
    return inMemoryStorage[prefixedKey];
  }

  // 💾 3) Fallback hors-ligne ou qualité réseau faible → IDB
  if (!canOnline) {
    const localVal = await idbGet(prefixedKey);
    if (localVal !== null && localVal !== "") {
      inMemoryStorage[prefixedKey] = localVal;
      return localVal;
    }
    console.warn(`❌ Hors ligne et clé ${prefixedKey} introuvable.`);
    return "";
  }

  // 🌐 4) Online normal (toutes les autres clés non-lieuxHebdo)
  try {
    const fetchedValue = await fetchAndUpdatePrefixedItem(prefixedKey, finalKey, prefix);
    if (fetchedValue !== null && fetchedValue !== undefined && fetchedValue !== "") {
      const stringVal = (typeof fetchedValue === "string") ? fetchedValue : JSON.stringify(fetchedValue);
      await idbSet(prefixedKey, stringVal);
      updateLocalSummary(prefixedKey);
      inMemoryStorage[prefixedKey] = stringVal;
      return stringVal;
    }
  } catch (e) {
    console.error(`⚠️ Fetch failed for ${prefixedKey}:`, e);
  }

  return "";
}





async function setPrefixedItem(key, value, alreadyPrefixed = false) {
  //console.log('🟩demande de set :', key, value);

  const isCommKey = filterKeys.some(filter => key.includes(filter));
  if (!alreadyPrefixed) {
    key = isCommKey ? "Comm_" + key : `${CléType}_` + key;
    if (window.crhono === true) {
      key = key + "_CRH";
    }
  }

  const prefix = getStoragePrefix();
  const prefixedKey = prefix + key;

  let stringValue;
  if (typeof value === "object") {
    try {
      stringValue = JSON.stringify(value);
    } catch (e) {
      console.error("❌ Impossible de JSON.stringify l'objet :", value);
      return false;
    }
  } else if (typeof value === "string") {
    try {
      JSON.parse(value); // si ça passe, déjà JSON
      stringValue = value;
    } catch {
      stringValue = value;
    }
  } else {
    stringValue = String(value);
  }

  // ✅ RAM
  inMemoryStorage[prefixedKey] = stringValue;

  // ✅ Local
  await idbSet(prefixedKey, stringValue);
  updateLocalSummary(prefixedKey);

  // ✅ Queue locale
const localQueueKey = isCommKey ? getLocalQueueKey('Comm') : getLocalQueueKey();
  let localQueue = JSON.parse(await idbGet(localQueueKey) || "[]");
  const existingIndex = localQueue.findIndex(op => op.type === 'set' && op.key === key);
  if (existingIndex !== -1) {
    localQueue[existingIndex].value = stringValue;
  } else {
    localQueue.push({ type: 'set', key, value: stringValue });
  }
  await idbSet(localQueueKey, JSON.stringify(localQueue));

  updateIndicators(connectionQuality, { totalKeys: localQueue.length });

  updatePrefixedItemInBackground(prefixedKey, key, prefix);

  return true;
}



async function removePrefixedItem(key, alreadyPrefixed = false) {
  //console.log('🟥 demande supp : ' + key)
  const isCommKey = filterKeys.some(filter => key.includes(filter));
  if (!alreadyPrefixed) {
    key = isCommKey ? "Comm_" + key : `${CléType}_` + key;
    if (window.crhono === true) {
      key = key + "_CRH";
    }
  }

  const prefix = getStoragePrefix();
  const prefixedKey = prefix + key;

  // ✅ Mémoires
  delete inMemoryStorage[prefixedKey];

  // ✅ Local
  await idbRemove(prefixedKey);
  updateLocalSummary(prefixedKey, true);

  // ✅ Queue locale
const localQueueKey = isCommKey ? getLocalQueueKey('Comm') : getLocalQueueKey();
  let localQueue = JSON.parse(await idbGet(localQueueKey) || "[]");
  if (!localQueue.find(op => op.type === 'delete' && op.key === key)) {
    localQueue.push({ type: 'delete', key });
  }
  await idbSet(localQueueKey, JSON.stringify(localQueue));

  updateIndicators(connectionQuality, { totalKeys: localQueue.length });

  if (navigator.onLine && connectionQuality > 0) {
    removePrefixedItemInBackground(key, prefix);
  }

  return true;
}



function parseValue(val) {
  if (!val) return "";

  if (typeof val === "string") {
    return val.trim(); // On retourne directement la string nettoyée
  }

  try {
    // Si val est un objet ou un tableau → on le convertit en string
    return JSON.stringify(val);
  } catch (e) {
    console.warn("⚠️ Impossible de convertir en string :", val);
    return "";
  }
}

function getLocalQueueKey(type = null) {
  const username = window.utilisateurExclu || "defaultUser";
  const keyType = type || window.CléType || "Work";

  let baseKey = `${username}_${keyType}_processQueue`;

  if (window.crhono === true) {
    baseKey = `${username}_${keyType}_CRH_processQueue`;
  }

  return baseKey;
}
