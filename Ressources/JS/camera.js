let html5QrCode;
let isCameraRunning = false;

function onScanSuccess(decodedText, decodedResult) {
    // Arrêter la caméra après le scan réussi
    if (isCameraRunning) {
        html5QrCode.stop().then(() => {
            isCameraRunning = false;
        }).catch(err => {
            console.error("Erreur en arrêtant la caméra : ", err);
        });
    }

    // Décodage du texte ou de l'URL pour obtenir la valeur normale
    const decodedTextNormal = decodeURIComponent(decodedText);

    document.getElementById('result').innerText = `QR Code Scanné: ${decodedTextNormal}`;

    try {
        // Ajouter le préfixe 'http://' si l'URL ne commence pas avec 'http://' ou 'https://'
        let urlText = decodedText;
        if (!urlText.startsWith('http://') && !urlText.startsWith('https://')) {
            urlText = 'http://' + urlText;
        }

        // Extraction des paramètres 'i' et 'p' de l'URL
        const url = new URL(urlText);
        const interValue = url.searchParams.get('i');
        const paramP = url.searchParams.get('p');

        if (interValue) {
            // Décodage de la valeur du paramètre 'inter'
            const decodedInterValue = decodeURIComponent(interValue);

            // Appel de la fonction Restolieu avec la valeur extraite
            ouvrirIframe(decodedInterValue);
            setTimeout(function() {
                openTab('Chrono');
            }, 100);
        } else if (paramP) {
            const decodedparamP = decodeURIComponent(paramP);
            // Si le paramètre "p" est présent, appeler la fonction "modalselect()"
            modalselect(decodedparamP);
        } else {
            document.getElementById('result').innerText = `Le QR ne permet pas de créer une nouvelle intervention: ${decodedTextNormal}`;
        }
    } catch (error) {
        console.error("Erreur lors de l'analyse de l'URL : ", error);
        document.getElementById('result').innerText = `Erreur lors de l'analyse de l'URL : ${decodedTextNormal}`;
    }
}


function onScanFailure(error) {
    console.warn(`Échec du scan: ${error}`);
}

function startCamera() {




    let butt = document.getElementById('start_cam');
    butt.style.display = 'none';

    html5QrCode = new Html5Qrcode("reader");

    // Vérifie que l'objet html5QrCode est initialisé
    if (!html5QrCode) {
        console.error("html5QrCode n'est pas encore initialisé.");
        return;
    }

    if (!isCameraRunning) {
        // Obtenir les caméras disponibles
        Html5Qrcode.getCameras().then(devices => {
            if (devices && devices.length) {
                let backCamera = devices.find(device => {
                    let labelLower = device.label.toLowerCase();
                    return labelLower.includes('back') || labelLower.includes('arrière') || labelLower.includes('bakc');
                });
                let cameraId = backCamera ? backCamera.id : devices[0].id;

                // Créer un select pour que l'utilisateur puisse choisir la caméra
                let cameraSelection = document.getElementById('cameraSelection');
                cameraSelection.innerHTML = ''; // Effacer les options précédentes
                devices.forEach(device => {
                    let option = document.createElement('option');
                    option.value = device.id;
                    option.text = device.label || `Caméra ${devices.indexOf(device) + 1}`;
                    cameraSelection.appendChild(option);
                });

                // Sélectionner la caméra arrière par défaut si elle existe
                if (backCamera) {
                    cameraSelection.value = backCamera.id;
                }

                // Démarrer la caméra par défaut
                html5QrCode.start(
                    cameraId, {
                        fps: 5, // Nombre d'images par seconde
                        qrbox: {
                            width: 300,
                            height: 300
                        } // Taille de la zone de scan
                    },
                    onScanSuccess,
                    onScanFailure
                ).then(() => {
                    isCameraRunning = true;
                }).catch(err => {
                    console.error("Erreur en démarrant la caméra:", err);
                });

                // Permettre le changement de caméra à partir du select
                cameraSelection.onchange = () => {
                    let selectedCameraId = cameraSelection.value;
                    if (isCameraRunning) {
                        // Arrêter la caméra en cours avant de démarrer la nouvelle
                        html5QrCode.stop().then(() => {
                            isCameraRunning = false;
                            html5QrCode.start(
                                selectedCameraId, {
                                    fps: 5, // Nombre d'images par seconde
                                    qrbox: {
                                        width: 300,
                                        height: 300
                                    } // Taille de la zone de scan
                                },
                                onScanSuccess,
                                onScanFailure
                            ).then(() => {
                                isCameraRunning = true;
                            }).catch(err => {
                                console.error("Erreur en redémarrant la caméra:", err);
                            });
                        }).catch(err => {
                            console.error("Erreur en arrêtant la caméra :", err);
                        });
                    }
                };
            }
        }).catch(err => {
            console.error("Erreur avec les caméras:", err);
        });
    }
}

function stopCamera() {
    let butt = document.getElementById('start_cam');
    butt.style.display = 'block'
    if (isCameraRunning && html5QrCode) {
        html5QrCode.stop().then(() => {
            isCameraRunning = false;
        }).catch(err => {
            console.error("Erreur en arrêtant la caméra : ", err);
        });
    }
}


document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Si l'onglet est masqué, arrêtez la caméra
        stopCamera();
    }
});