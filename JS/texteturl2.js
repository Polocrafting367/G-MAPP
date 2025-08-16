
window.onload = function() {
    // Change l'URL affichée dans la barre de navigation pour "intervention"

    // Récupérer l'URL actuelle
    const currentUrl = new URL(window.location.href);

    // Extraire les paramètres 'i' et 'p' de l'URL
    const params = new URLSearchParams(currentUrl.search);
    const interLieu = params.get('i') || params.get('p'); // Prend 'i' ou 'p' selon celui qui est présent
    const paramType = params.has('i') ? 'i' : (params.has('p') ? 'p' : null); // Détermine si 'i' ou 'p' est utilisé

    // Sélectionner l'élément avec la classe 'title-bar-text'
    const titleElement = document.getElementsByClassName('title-bar-text')[0]; // Accès au premier élément de la collection

    if (interLieu) {
        // Modifier le contenu de l'élément
        titleElement.innerHTML = `Connexion à intervention pour :<br>Crée ou choisir intervention: '${interLieu}'<br> N'hésitez pas à cocher<br> "se souvenir de moi"`;
    }

};
