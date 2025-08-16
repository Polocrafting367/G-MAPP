const urlParams = new URLSearchParams(window.location.search);



document.addEventListener('DOMContentLoaded', async function() {
  try {
    const response = await fetch('../Update.txt');
    if (!response.ok) throw new Error('Erreur lors du chargement du fichier Update.txt');
    const data = await response.text();
    document.getElementById('credits').innerHTML = data.replace(/\n/g, '<br>');
  } catch (error) {
    console.error(error);
  }

const carousel = document.getElementById('verticalCarousel');

carousel.querySelectorAll('.user-card').forEach(card => {
  let pressTimer = null; // Déclaré ici pour chaque carte

  // Souris
  card.addEventListener("mousedown", e => {
    pressTimer = setTimeout(() => {
      card.alreadyResetMode = true;
      showResetButton(card);
    }, 800);
  });

  card.addEventListener("mouseup", e => {
    clearTimeout(pressTimer);
  });

  card.addEventListener("mouseleave", e => {
    clearTimeout(pressTimer);
  });

  // Tactile
  card.addEventListener("touchstart", e => {
    pressTimer = setTimeout(() => {
      card.alreadyResetMode = true;
      showResetButton(card);
    }, 800);
  });

  card.addEventListener("touchend", e => {
    clearTimeout(pressTimer);
  });

  card.addEventListener("touchcancel", e => {
    clearTimeout(pressTimer);
  });
});

});


function showResetButton(card) {
  // Mettre la carte en mode expanded
  document.querySelectorAll('.user-card').forEach(c => {
    c.classList.add("dimmed");
    let lo = c.querySelector(".login-options");
    if (lo) c.removeChild(lo);
  });

  card.classList.remove("dimmed");
  card.classList.add("expanded");
  card.style.backgroundImage = "";

  // Masquer boutons d’origine
  const buttons = card.querySelectorAll('.action-button');
  buttons.forEach(btn => btn.style.display = 'none');

  let resetBtn = card.querySelector('.reset-button');
  let cancelBtn = card.querySelector('.cancel-reset-button');

  if (!resetBtn) {
    resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset paramètres actifs';
    resetBtn.className = 'reset-button';
    resetBtn.style.bottom = '45px';
resetBtn.onclick = () => {
    const username = card.getAttribute('data-username');
    if (!username) {
        alert('Nom utilisateur manquant.');
        return;
    }
    const dynamicKey = username + '_device_id';
        console.log(dynamicKey)

    removeUserDeviceId(username, dynamicKey, () => {
        alert('Paramètres supprimés.');
        resetBtn.remove();
        cancelBtn.remove();
        card.alreadyResetMode = false;
        // Rétablir les autres cartes
        document.querySelectorAll('.user-card').forEach(c => {
            c.classList.remove("dimmed");
            c.classList.remove("expanded");
            c.style.backgroundImage = "url('../IMG/user.png')";
        });
    });
};

    card.appendChild(resetBtn);
  }

  if (!cancelBtn) {
    cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Annuler';
    cancelBtn.className = 'cancel-reset-button';
    cancelBtn.style.marginTop = '5px';
    cancelBtn.onclick = () => {
      // Réafficher boutons d’origine
      buttons.forEach(btn => btn.style.display = '');

      // Supprimer boutons reset et annuler
      resetBtn.remove();
      cancelBtn.remove();

      // Rétablir état normal
      card.alreadyResetMode = false;

      // Rétablir les autres cartes
      document.querySelectorAll('.user-card').forEach(c => {
        c.classList.remove("dimmed");
        c.classList.remove("expanded");
        c.style.backgroundImage = "url('../IMG/user.png')";
      });
    };
    card.appendChild(cancelBtn);
  }
}

function removeUserDeviceId(username, key, callback) {
  const dynamicuser = username + '_';

  fetch('../Ressources/PHP/removeData.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ username: dynamicuser, key: key })
  })
  .then(response => response.json())
  .then(data => {
    console.log(data);

    // Réinitialiser AUTOUSER
    localStorage.removeItem("AUTOUSER");

    // Ajouter les valeurs comme une connexion normale
    localStorage.setItem("rememberedUser", username);
    localStorage.setItem("AUTOUSER", username);
    localStorage.setItem(username + '_uver', "Work");

    // Construire URL finale
    const now = new Date();
    const timeStr = now.getFullYear() + '-' +
      (now.getMonth() + 1).toString().padStart(2, '0') + '-' +
      now.getDate().toString().padStart(2, '0') + '_' +
      now.getHours().toString().padStart(2, '0') + ':' +
      now.getMinutes().toString().padStart(2, '0') + ':' +
      now.getSeconds().toString().padStart(2, '0');
    const encodedTime = encodeURIComponent(timeStr);


    const url = '../Ressources/index.html?user=' + encodeURIComponent(username) + '&mode=Work' + '&reset=true' + '&time=' + encodedTime;
    window.location.href = url;

    callback();
  })
  .catch(error => {
    console.error(error);
    alert('Erreur suppression.');
    callback();
  });
}




// Chargement des utilisateurs depuis le fichier JSON
let users = {};
fetch("../XbGv89Lm.json")
  .then(response => response.json())
  .then(data => {
    users = data;
    createUserCards();
  });
function createUserCards() {
  const carouselContainer = document.getElementById("verticalCarousel");
  const managerContainer = document.getElementById("managerContainer");

  carouselContainer.innerHTML = "";
  managerContainer.innerHTML = "";

  Object.keys(users).forEach(username => {
    if (username === "Gestion") {
      const managerCard = document.createElement("div");
      managerCard.className = "manager-card";
      managerCard.setAttribute("data-username", username);

      const mTitle = document.createElement("h3");
      mTitle.innerText = username;
      managerCard.appendChild(mTitle);

      const mBtn = document.createElement("button");
      mBtn.innerText = "Se connecter";
      mBtn.addEventListener("click", function(event) {
        event.stopPropagation();
        activateGestionLogin();
      });
      managerCard.appendChild(mBtn);

      managerContainer.appendChild(managerCard);
    } else {
      const card = document.createElement("div");
      card.className = "user-card";
      card.setAttribute("data-username", username);
      card.style.backgroundImage = "url('../IMG/user.png')";
      card.style.backgroundRepeat = "no-repeat";
      card.style.backgroundPosition = "center";
      card.style.backgroundSize = "cover";

      const title = document.createElement("h2");
      title.innerText = username;
      card.appendChild(title);

      card.alreadyResetMode = false;
      card.longPressTriggered = false;

      // --- Click normal (ouvre ou ferme la carte)
      card.addEventListener("click", function(e) {
        if (card.longPressTriggered) return; // Ignore si long press déjà déclenché

        e.stopPropagation();
        if (card.alreadyResetMode) return;

        if (card.classList.contains("expanded")) {
          card.classList.remove("expanded");
          let loginOptions = card.querySelector(".login-options");
          if (loginOptions) card.removeChild(loginOptions);
          card.style.backgroundImage = "url('../IMG/user.png')";
          document.querySelectorAll('.user-card').forEach(c => c.classList.remove("dimmed"));
        } else {
          document.querySelectorAll('.user-card').forEach(c => {
            c.style.backgroundImage = "url('../IMG/user.png')";
            c.classList.remove("expanded");
            c.classList.add("dimmed");
            let lo = c.querySelector(".login-options");
            if (lo) c.removeChild(lo);
          });

          card.classList.remove("dimmed");
          card.classList.add("expanded");
          card.style.backgroundImage = "";

          const loginOptions = document.createElement("div");
          loginOptions.className = "login-options";
          const buttons = [];

          const btnCorrectif = document.createElement("button");
          btnCorrectif.innerText = "Correctif";
          btnCorrectif.className = "action-button";
          btnCorrectif.addEventListener("click", function(ev) {
            ev.stopPropagation();
            loginUser(username);
          });
          buttons.push(btnCorrectif);

          const btnLoginPrev = document.createElement("button");
          btnLoginPrev.innerText = "Préventif";
          btnLoginPrev.className = "action-button";
          btnLoginPrev.addEventListener("click", function(ev) {
            ev.stopPropagation();
            loginUserPrev(username);
          });
          buttons.push(btnLoginPrev);

          const btnCintre = document.createElement("button");
          btnCintre.innerText = "Cintre";
          btnCintre.style.backgroundColor = "#06A0BC";
          btnCintre.className = "action-button";
          btnCintre.addEventListener("click", function(ev) {
            ev.stopPropagation();
            loginCintre(username);
          });
          buttons.push(btnCintre);

          buttons.forEach(button => {
            button.style.opacity = "0";
            loginOptions.appendChild(button);
          });

          card.appendChild(loginOptions);

          setTimeout(() => {
            buttons.forEach((button, index) => {
              setTimeout(() => {
                button.style.opacity = "1";
                button.style.transform = "translateY(0)";
                button.style.transition = "opacity 0.5s ease-out, transform 0.5s ease-out";
              }, index * 100);
            });
          }, 10);
        }
      });

      // --- Appui long pour reset
      let pressTimer = null;

      function startPress() {
        card.longPressTriggered = false;
        pressTimer = setTimeout(() => {
          card.longPressTriggered = true;
          card.alreadyResetMode = true;
          showResetButton(card);
        }, 800);
      }

      function cancelPress() {
        clearTimeout(pressTimer);
      }

      // Souris
      card.addEventListener("mousedown", startPress);
      card.addEventListener("mouseup", cancelPress);
      card.addEventListener("mouseleave", cancelPress);

      // Tactile
      card.addEventListener("touchstart", startPress, { passive: true });
      card.addEventListener("touchend", cancelPress);
      card.addEventListener("touchcancel", cancelPress);

      carouselContainer.appendChild(card);
    }
  });

  adjustCarousel();
}


function loginCintre(username) {
localStorage.removeItem("rememberedUser");
localStorage.removeItem("AUTOUSER");
  window.location.href = '../Cintres/index.html?&user=' + encodeURIComponent(username);
}

function loginUser(username) {
  localStorage.setItem("rememberedUser", username);
  localStorage.setItem("AUTOUSER", username);
  localStorage.setItem(username + '_uver', "Work");

  const now = new Date();
  const timeStr = now.getFullYear() + '-' +
    (now.getMonth() + 1).toString().padStart(2, '0') + '-' +
    now.getDate().toString().padStart(2, '0') + '_' +
    now.getHours().toString().padStart(2, '0') + ':' +
    now.getMinutes().toString().padStart(2, '0') + ':' +
    now.getSeconds().toString().padStart(2, '0');
  const encodedTime = encodeURIComponent(timeStr);

  if (username === "Gestion") {
    localStorage.removeItem("AUTOUSER");
    window.location.href = '../HTML/Gest.html?time=' + encodedTime;
  } else {
    const currentUrl = new URL(window.location.href);
    const params = new URLSearchParams(currentUrl.search);
    const interLieu = params.get('i') || params.get('p');
    const paramType = params.has('i') ? 'i' : (params.has('p') ? 'p' : null);

    let targetUrl = '../Ressources/index.html?user=' + encodeURIComponent(username) + '&mode=Work' + '&time=' + encodedTime ;

    if (interLieu && paramType) {
      targetUrl += '&' + paramType + '=' + encodeURIComponent(interLieu);
    }

    window.location.href = targetUrl;
  }
}


function loginUserPrev(username) {
  localStorage.setItem("rememberedUser", username);
  localStorage.setItem("AUTOUSER", username);
  localStorage.setItem(username + '_uver', "Priv");

  const now = new Date();
  const timeStr = now.getFullYear() + '-' +
    (now.getMonth() + 1).toString().padStart(2, '0') + '-' +
    now.getDate().toString().padStart(2, '0') + '_' +
    now.getHours().toString().padStart(2, '0') + ':' +
    now.getMinutes().toString().padStart(2, '0') + ':' +
    now.getSeconds().toString().padStart(2, '0');
  const encodedTime = encodeURIComponent(timeStr);

  const currentUrl = new URL(window.location.href);
  const params = new URLSearchParams(currentUrl.search);
  const interLieu = params.get('i') || params.get('p');
  const paramType = params.has('i') ? 'i' : (params.has('p') ? 'p' : null);

  let targetUrl = '../Ressources/index.html?user=' + encodeURIComponent(username) + '&mode=Priv' + '&time=' + encodedTime ;

  if (interLieu && paramType) {
    targetUrl += '&' + paramType + '=' + encodeURIComponent(interLieu);
  }

  window.location.href = targetUrl;
}



function activateGestionLogin() {
    // Réduire la hauteur du carousel vertical
    const carouselContainer = document.getElementById("verticalCarousel");
    carouselContainer.style.height = "calc(100% - 230px)";

    const managerContainer = document.getElementById("managerContainer");
    managerContainer.style.height = "230px";

    // Sélectionner le conteneur du gestionnaire (on suppose qu'il n'y a qu'une seule carte)
    const managerCard = managerContainer.querySelector(".manager-card");
    if (!managerCard) return;

    // Supprimer tous les éléments du managerCard sauf le titre (supposé être le premier enfant)
    while (managerCard.childNodes.length > 1) {
        managerCard.removeChild(managerCard.lastChild);
    }

    // Créer un conteneur pour la nouvelle interface de connexion
    const formContainer = document.createElement("div");
    formContainer.className = "gestion-login-form";

    // Créer le champ de saisie pour le mot de passe
    const pwdInput = document.createElement("input");
    pwdInput.type = "password";
    pwdInput.id = "password-input";
    pwdInput.placeholder = "Entrez le mot de passe";
    pwdInput.className = "gestion-password-input";
    pwdInput.style.opacity = "0"; // On cache avant animation
    formContainer.appendChild(pwdInput);

    // Créer les boutons
    const buttons = [];

    const connectBtn = document.createElement("button");
    connectBtn.innerText = "Se connecter";
    connectBtn.className = "gestion-connect-btn";
    connectBtn.style.opacity = "0"; // On cache avant animation
    connectBtn.addEventListener("click", function(event) {
        event.stopPropagation();
        if (pwdInput.value.trim() !== "") {
            if (users["Gestion"] && users["Gestion"] === pwdInput.value.trim()) {
                loginUser("Gestion");
            } else {
                alert("Mot de passe incorrect.");
            }
        } else {
            alert("Veuillez saisir le mot de passe.");
        }
    });
    buttons.push(connectBtn);

    const cancelBtn = document.createElement("button");
    cancelBtn.innerText = "Annuler";
    cancelBtn.className = "gestion-cancel-btn";
    cancelBtn.style.opacity = "0"; // On cache avant animation
    cancelBtn.addEventListener("click", function(event) {
        event.stopPropagation();
        hideGestionLogin(managerCard, formContainer);
    });
    buttons.push(cancelBtn);

    // Ajouter les boutons et l'input dans le conteneur de formulaire
    formContainer.appendChild(pwdInput);
    buttons.forEach(button => formContainer.appendChild(button));

    // Ajouter le conteneur de formulaire à la carte gestionnaire
    managerCard.appendChild(formContainer);

    // Appliquer l'animation d'affichage
    setTimeout(() => {
        formContainer.classList.add("show");
        setTimeout(() => {
            pwdInput.style.opacity = "1";
            pwdInput.style.transform = "translateY(0)";
    pwdInput.focus(); // Met le focus sur le champ de texte
        }, 200); // Le champ apparaît après 200ms

  pwdInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
          if (pwdInput.value.trim() !== "") {
              if (users["Gestion"] && users["Gestion"] === pwdInput.value.trim()) {
                  loginUser("Gestion");
              } else {
                  alert("Mot de passe incorrect.");
              }
          } else {
              alert("Veuillez saisir le mot de passe.");
          }
        }
    });
        buttons.forEach((button, index) => {
            setTimeout(() => {
                button.style.opacity = "1";
                button.style.transform = "translateY(0)";
            }, (index + 1) * 200); // Décalage de 300ms entre chaque bouton
        });
    }, 10);
}

/**
 * Fonction pour cacher et supprimer le formulaire avec une animation
 */
function hideGestionLogin(managerCard, formContainer, carouselContainer, managerContainer) {
    formContainer.classList.add("hide");

    // Restaurer la hauteur des conteneurs
    carouselContainer = document.getElementById("verticalCarousel");
    managerContainer = document.getElementById("managerContainer");
    carouselContainer.style.height = "calc(100% - 85px)";
    managerContainer.style.height = "86px";

    setTimeout(() => {
        // Supprimer le formulaire après l'animation
        if (formContainer.parentNode) {
            formContainer.parentNode.removeChild(formContainer);
        }

        // Restaurer le bouton de connexion avec une animation
        const mBtn = document.createElement("button");
        mBtn.innerText = "Se connecter";
        mBtn.className = "gestion-reconnect-btn"; // Ajout de la classe pour l'animation
        mBtn.style.opacity = "0"; // Commence caché
        mBtn.style.transform = "translateY(-10px)"; // Légèrement au-dessus

        // Ajouter le bouton dans le DOM
        managerCard.appendChild(mBtn);

        // Ajouter l'événement de clic
        mBtn.addEventListener("click", function(event) {
            event.stopPropagation();
            activateGestionLogin();
        });

        // Appliquer l'animation après un court délai
        setTimeout(() => {
            mBtn.style.opacity = "1";
            mBtn.style.transform = "translateY(0)";
            mBtn.style.transition = "opacity 0.4s ease-out, transform 0.4s ease-out";
        }, 50); // Petit délai avant d'activer l'animation
    }, 350); // Temps d'attente correspondant à la durée de l'animation de disparition du formulaire
}

// Fonction pour ajuster le scale des cartes dans le carousel vertical (démo)
function adjustCarousel() {
  const carousel = document.getElementById('verticalCarousel');
  const carouselRect = carousel.getBoundingClientRect();
  const carouselCenter = carouselRect.top + carouselRect.height / 2;
  const cards = carousel.getElementsByClassName('user-card');
  for (let card of cards) {
    const cardRect = card.getBoundingClientRect();
    const cardCenter = cardRect.top + cardRect.height / 2;
    const distance = Math.abs(carouselCenter - cardCenter);
    // Ici, vous pouvez appliquer un effet de scale en fonction de la distance (si souhaité)
  }
}

// Recalculer le scale lors du scroll du carousel vertical
document.getElementById('verticalCarousel').addEventListener('scroll', adjustCarousel);

// Fonctions de la modal tutoriel
function openWebsite() {
  document.getElementById("tutorialModal").style.display = "none";
}
function openmodal() {
  loadPageInIframe("../Ressources/tuto/index.html");
  document.getElementById("tutorialModal").style.display = "block";
}
function loadPageInIframe(url) {
  document.getElementById("iframeContainer").innerHTML = '<iframe id="TUTORIEL" src="' + url + '"></iframe>';
}

// Optionnel : écoute sur toute la carte (si souhaité)
// document.querySelectorAll('.user-card').forEach(card => {
//   card.addEventListener('click', function() {
//     const username = card.getAttribute('data-username');
//     loginUser(username);
//   });
// });
