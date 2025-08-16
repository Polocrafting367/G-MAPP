  const openScannerBtn = document.getElementById('open-scanner');
  const closeScannerBtn = document.getElementById('close-scanner');
  const scannerModal = document.getElementById('scanner-modal');
  const cameraPreview = document.getElementById('camera-preview');
  const cameraSelect = document.getElementById('camera-select');
  const manualValidateBtn = document.getElementById('manual-valider');
  const manualInput = document.getElementById('manual-input');
  const scannedCodeSpan = document.getElementById('scanned-code');

  let currentStream = null;
  let codeProcessed = false; // Pour éviter de traiter plusieurs fois le même code

  // Ouvrir la modal, vider la zone de texte et démarrer la caméra
  openScannerBtn.addEventListener('click', () => {
    scannerModal.style.display = 'block';
    manualInput.value = '';  // Vider la zone de texte à chaque ouverture
    codeProcessed = false;
    loadCameras();
    setTimeout(() => {
      startCamera(cameraSelect.value);
    }, 500);
  });

  // Bouton de fermeture manuel de la modal
  closeScannerBtn.addEventListener('click', closeModal);

  // Lors du clic sur le bouton de validation manuelle
  manualValidateBtn.addEventListener('click', () => {
    const code = manualInput.value.trim();
    if (code !== "") {
      codeProcessed = true;
      handleScannedCode(code);
    }
  });

  // Ferme la modal et arrête la caméra
  function closeModal() {
    scannerModal.style.display = 'none';
    stopCamera();
  }

  // Arrêter le flux vidéo
  function stopCamera() {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }
  }

  // Démarrer la caméra avec le deviceId sélectionné
  function startCamera(deviceId) {
    const constraints = {
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined
      }
    };
    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        currentStream = stream;
        cameraPreview.srcObject = stream;
        // Lancer le scan continu si BarcodeDetector est supporté
        if ('BarcodeDetector' in window) {
          const formats = ['ean_13', 'code_128', 'qr_code'];
          const barcodeDetector = new BarcodeDetector({ formats });
          scanBarcode(barcodeDetector);
        } else {
          console.log("L'API BarcodeDetector n'est pas supportée par votre navigateur.");
        }
      })
      .catch(err => {
        console.error("Erreur lors de l'accès à la caméra : ", err);
      });
  }

  // Scan continu du flux vidéo pour détecter un code-barres
  function scanBarcode(detector) {
    codeProcessed = false;
    const scan = () => {
      if (scannerModal.style.display !== 'none' && cameraPreview.readyState === 4 && !codeProcessed) {
        detector.detect(cameraPreview)
          .then(barcodes => {
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              codeProcessed = true;
              handleScannedCode(code);
            }
          })
          .catch(err => console.error("Erreur lors de la détection du code-barres : ", err));
      }
      if (!codeProcessed) {
        requestAnimationFrame(scan);
      }
    };
    scan();
  }

  // Charger la liste des caméras disponibles
  function loadCameras() {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        cameraSelect.innerHTML = '';
        videoDevices.forEach(device => {
          const option = document.createElement('option');
          option.value = device.deviceId;
          option.text = device.label || `Caméra ${cameraSelect.length + 1}`;
          // Sélection par défaut si le libellé contient 'back', 'arrière' ou 'bakc'
          option.selected = isDefaultCamera(device.label);
          cameraSelect.appendChild(option);
        });
      })
      .catch(err => console.error("Erreur lors du chargement des caméras : ", err));
  }

  // Détermine si la caméra est la caméra arrière par défaut
  function isDefaultCamera(label) {
    if (!label) return false;
    const labelLower = label.toLowerCase();
    return labelLower.includes('back') || labelLower.includes('arrière') || labelLower.includes('bakc');
  }

  // Traite le code scanné ou saisi manuellement, met à jour l'affichage et ferme la modal
  function handleScannedCode(code) {
    // Mise à jour de la zone d'affichage avec le code
    scannedCodeSpan.textContent = code + " ";
    // Réinsérer le bouton d'ouverture pour réutiliser le scanner si besoin
    const openBtn = document.createElement('button');
    openBtn.id = "open-scanner";
    openBtn.textContent = "📷";
    openBtn.addEventListener('click', () => {
      scannerModal.style.display = 'block';
      manualInput.value = ''; // Vider la zone de saisie lors de la réouverture
      codeProcessed = false;
      loadCameras();
      setTimeout(() => {
        startCamera(cameraSelect.value);
      }, 500);
    });
    scannedCodeSpan.appendChild(openBtn);

    // Appeler la fonction de traitement du code
    processScannedCode(code);
    // Fermer la modal et arrêter la caméra
    closeModal();
  }