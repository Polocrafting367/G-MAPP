async function switPre(data) {
  const newCléType = (CléType === 'Priv') ? 'Work' : 'Priv';
  const utilisateurExclu = new URLSearchParams(window.location.search).get('user');

  if (!navigator.onLine) {
    await safeRedirectToStart(newCléType, utilisateurExclu, data);
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
  countdownText.textContent = "Merci de patienter...";
  connectionStatus.innerHTML = "Des données peuvent être transmises<br>Redirection automatique après :";

  let cancelled = false;
  cancelBtn.onclick = () => {
    cancelled = true;
    modal.style.display = "none";
  };

  confirmBtn.style.display = "none";

  // Créer le bouton force
  let forceBtn = document.getElementById("force-refresh");
  if (!forceBtn) {
    forceBtn = document.createElement("button");
    forceBtn.id = "force-refresh";
    forceBtn.textContent = "Continuer directement";
forceBtn.style.height = "auto";

    // Copier les classes du confirmBtn pour même style
    forceBtn.className = confirmBtn.className;

    // Insérer juste après cancelBtn
    cancelBtn.parentNode.insertBefore(forceBtn, confirmBtn.nextSibling);
  }
  forceBtn.style.display = "inline-block";

  let steps = 20;
  let currentStep = 0;
  let intervalId;

  forceBtn.onclick = async () => {
    clearInterval(intervalId);
    modal.style.display = "none";
    await safeRedirectToStart(newCléType, utilisateurExclu, data);
  };

  intervalId = setInterval(() => {
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
      safeRedirectToStart(newCléType, utilisateurExclu, data);
    }
  }, 150);
}


async function switArc() {
  const utilisateurExclu = new URLSearchParams(window.location.search).get('user');

    await safeRedirectToStart('Story', utilisateurExclu);

}


async function switRet() {
  const utilisateurExclu = new URLSearchParams(window.location.search).get('user');

    await safeRedirectToStart('Work', utilisateurExclu);

}


async function safeRedirectToStart(folderName, utilisateurExclu, fileParam = null) {
  const clé = utilisateurExclu + '_uver';
  localStorage.setItem(clé, folderName);

  // Prépare les données à envoyer au parent
  const message = {
    action: 'changeStart',
    mode: folderName,
    user: utilisateurExclu,
    fileParam: fileParam
  };

  // Envoie le message au parent
  if (window.parent) {
    window.parent.postMessage(message, '*');
  } else {
    console.error("❌ Pas de parent window disponible");
  }
}







function showOverlay() {
    const overlay = document.getElementById('debugOverlay');
    overlay.classList.add('show');
}

function closeOverlay() {
    const overlay = document.getElementById('debugOverlay');
    overlay.classList.remove('show');
}




        function Act() {
            reloadpp()
        }


function toggleOptionsMenu() {
  const optionsMenu = document.getElementById("optionsMenu");
  const optionsButton = document.getElementById("optionsButton");

  if (optionsMenu.style.display === "block") {
    optionsMenu.style.display = "none";
    optionsButton.classList.remove("active");
  } else {
    optionsMenu.style.display = "block";
    optionsButton.classList.add("active");
  }
}

// Gestion du clic en dehors du menu et du bouton
document.addEventListener("click", function(event) {
  const optionsMenu = document.getElementById("optionsMenu");
  const optionsButton = document.getElementById("optionsButton");
  if ( optionsButton) {
    // Si le clic n'est ni sur le menu, ni sur le bouton, on masque le menu
    if (
      event.target !== optionsButton
    ) {
      optionsMenu.style.display = "none";
      optionsButton.classList.remove("active");
    }
  }
});

// Gestion du clic sur le bouton de type "hamburger"
document.querySelectorAll('.hamburger-line').forEach(line => {
  line.addEventListener('click', function(event) {
    toggleOptionsMenu();
    event.stopPropagation(); // Empêche la propagation vers document
  });
});

// Ajout d'un gestionnaire pour chaque bouton interne du menu
document.querySelectorAll('#optionsMenu button').forEach(btn => {
  btn.addEventListener('click', function() {
    const optionsMenu = document.getElementById("optionsMenu");
    const optionsButton = document.getElementById("optionsButton");
    // Masquer le menu dès qu'on clique sur un bouton interne
    optionsMenu.style.display = "none";
    optionsButton.classList.remove("active");
  });
});
