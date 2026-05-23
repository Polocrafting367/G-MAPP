const typeInput = document.getElementById("typeInput");
const causeInput = document.getElementById("causeInput");
const typeList = document.getElementById("typeList");
const causeList = document.getElementById("causeList");

lieuData.types.forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    typeList.appendChild(option);
});

lieuData.causes.forEach(cause => {
    const option = document.createElement("option");
    option.value = cause;
    causeList.appendChild(option);
});

// Utiliser les valeurs de typeInput et causeInput dans le reste du code








var lieu = getURLParameter('lieu');

    const temps = getURLParameter('temps');


// Utiliser la variable "lieu" comme nécessaire dans votre code



 document.addEventListener('DOMContentLoaded', init);


