setTimeout(() => {
  document.body.classList.remove("invisible-theme");
}, 50);

let forceThemeMode = false;
let sliderUsed = false;

function applyCurrentDateTheme() {
  const today = new Date();
  const special = isSpecialEventDay(today);
  if (special) {
    applyTheme(special);
    document.getElementById("monthDisplay").textContent = `${special.name} (auto)`;
  } else {
    const monthIndex = today.getMonth();
    const theme = monthThemes[monthIndex];
    applyTheme(theme);
    document.getElementById("monthDisplay").textContent = `${theme.name} (auto)`;
  }
}

const monthThemes = [
  { name: "Janvier", bg: "#0A132E", circles: ["rgba(0, 120, 255, 0.8)", "rgba(0, 200, 255, 0.6)", "rgba(120, 100, 255, 0.5)"] },
  { name: "Février", bg: "#123946", circles: ["rgba(0, 255, 200, 0.8)", "rgba(0, 180, 160, 0.6)", "rgba(100, 255, 240, 0.5)"] },
  { name: "Mars", bg: "#2A4238", circles: ["rgba(255, 170, 220, 0.8)", "rgba(200, 255, 200, 0.6)", "rgba(255, 105, 180, 0.5)"] },
  { name: "Avril", bg: "#3E604B", circles: ["rgba(120, 255, 160, 0.8)", "rgba(255, 150, 210, 0.6)", "rgba(255, 100, 160, 0.5)"] },
  { name: "Mai", bg: "#5B7E3C", circles: ["rgba(255, 255, 100, 0.8)", "rgba(255, 200, 100, 0.6)", "rgba(255, 150, 220, 0.5)"] },
  { name: "Juin", bg: "#8B6E00", circles: ["rgba(255, 200, 0, 0.8)", "rgba(255, 240, 100, 0.6)", "rgba(255, 255, 160, 0.5)"] },
  { name: "Juillet", bg: "#CC8E00", circles: ["rgba(255, 180, 80, 0.8)", "rgba(80, 180, 255, 0.6)", "rgba(255, 120, 180, 0.5)"] },
  { name: "Août", bg: "#D76A00", circles: ["rgba(255, 140, 60, 0.8)", "rgba(120, 200, 255, 0.6)", "rgba(255, 80, 120, 0.5)"] },
  { name: "Septembre", bg: "#8E3C00", circles: ["rgba(255, 120, 40, 0.8)", "rgba(255, 60, 60, 0.6)", "rgba(255, 180, 100, 0.5)"] },
  { name: "Octobre", bg: "#5B1E2D", circles: ["rgba(220, 80, 100, 0.8)", "rgba(170, 60, 130, 0.6)", "rgba(255, 120, 180, 0.5)"] },
  { name: "Novembre", bg: "#3A1A2D", circles: ["rgba(160, 40, 100, 0.8)", "rgba(120, 60, 160, 0.6)", "rgba(200, 80, 150, 0.5)"] },
  { name: "Décembre", bg: "#101933", circles: ["rgba(0, 140, 255, 0.8)", "rgba(80, 180, 255, 0.6)", "rgba(180, 220, 255, 0.5)"] }
];
const specialEvents = [
  { id: "newYear", name: "🎉 Nouvel An", date: { month: 0, day: 1 }, bg: "#000000", circles: ["rgba(255, 0, 0, 1)", "rgba(0, 255, 255, 0.9)", "rgba(255, 255, 0, 0.8)"] },
  { id: "polarWinter", name: "❄️ Hiver Polaire", date: { month: 0, day: 15 }, bg: "#001C40", circles: ["rgba(150, 220, 255, 0.9)", "rgba(200, 240, 255, 0.7)", "rgba(255, 255, 255, 0.5)"] },
  { id: "valentines", name: "💖 Saint-Valentin", date: { month: 1, day: 14 }, bg: "#660022", circles: ["rgba(255, 20, 147, 0.95)", "rgba(255, 105, 180, 0.8)", "rgba(255, 182, 193, 0.6)"] },
  { id: "carnival", name: "🎭 Carnaval", date: { month: 1, day: 15 }, bg: "#333300", circles: ["rgba(255, 0, 255, 1)", "rgba(0, 255, 0, 0.9)", "rgba(255, 255, 0, 0.8)"] },
  { id: "spring", name: "🌸 Printemps", date: { month: 2, day: 20 }, bg: "#204020", circles: ["rgba(150, 255, 180, 0.9)", "rgba(200, 255, 220, 0.7)", "rgba(240, 255, 255, 0.5)"] },
  { id: "labor", name: "🛠 Fête du Travail", date: { month: 4, day: 1 }, bg: "#550000", circles: ["rgba(255,70,70,0.9)", "rgba(255,150,150,0.7)", "rgba(255,220,220,0.5)"] },
  { id: "music", name: "🎵 Fête de la Musique", date: { month: 5, day: 21 }, bg: "#0A174E", circles: ["rgba(0, 255, 255, 1)", "rgba(255, 0, 255, 0.9)", "rgba(255, 255, 0, 0.8)"] },
  { id: "bastille", name: "🇫🇷 14 Juillet", date: { month: 6, day: 14 }, bg: "#002266", circles: ["rgba(255,255,255,0.9)", "rgba(255,0,0,0.7)", "rgba(0,0,255,0.6)"] },
  { id: "summerHeat", name: "🔥 Été Caniculaire", date: { month: 6, day: 21 }, bg: "#AA3300", circles: ["rgba(255, 80, 0, 0.9)", "rgba(255, 150, 50, 0.7)", "rgba(255, 240, 200, 0.5)"] },
  { id: "backToSchool", name: "🎒 Rentrée", date: { month: 8, day: 1 }, bg: "#004455", circles: ["rgba(255,200,0,0.9)", "rgba(0,100,255,0.7)", "rgba(255,255,200,0.5)"] },
  { id: "autumn", name: "🍁 Automne Doré", date: { month: 8, day: 23 }, bg: "#663300", circles: ["rgba(255, 120, 0, 0.9)", "rgba(255, 180, 50, 0.7)", "rgba(255, 230, 150, 0.5)"] },
  { id: "halloween", name: "🎃 Halloween", date: { month: 9, day: 31 }, bg: "#220000", circles: ["rgba(255, 100, 0, 0.9)", "rgba(200, 0, 0, 0.7)", "rgba(50, 0, 0, 0.5)"] },
  { id: "fullMoon", name: "🌕 Pleine Lune", date: { month: 4, day: 5 }, bg: "#111122", circles: ["rgba(200, 200, 255, 0.9)", "rgba(150, 150, 200, 0.7)", "rgba(255, 255, 255, 0.5)"] },
  {
    id: "xmas", name: "🎄 Noël", date: { month: 11, day: 25 }, bg: "#770000",
    circles: ["rgba(255, 255, 255, 0.9)", "rgba(180, 0, 0, 0.7)", "rgba(255, 215, 100, 0.6)"]
  }
];


function isSpecialEventDay(testDate = new Date()) {
  const todayYear = testDate.getFullYear();
  const todayTime = testDate.getTime();
  const rangeDays = 3;

  for (const event of specialEvents) {
    const eventDate = new Date(todayYear, event.date.month, event.date.day);
    const diffInDays = Math.abs((eventDate.getTime() - todayTime) / (1000 * 60 * 60 * 24));

    if (diffInDays <= rangeDays) {
      return event;
    }
  }
  return null;
}


function applyTheme(theme) {
  document.body.style.backgroundColor = theme.bg;
  document.documentElement.style.setProperty("--circle1-color", theme.circles[0]);
  document.documentElement.style.setProperty("--circle2-color", theme.circles[1]);
  document.documentElement.style.setProperty("--circle3-color", theme.circles[2]);
}

function updateBySlider(value) {
  sliderUsed = true; // dès que le slider est utilisé

  const dayOfYear = parseInt(value);
  const testDate = dayOfYearToDate(new Date().getFullYear(), dayOfYear);
  const special = isSpecialEventDay(testDate);

  if (special) {
    applyTheme(special);
    document.getElementById("monthDisplay").textContent = `${special.name} (simulation)`;
  } else {
    const monthIndex = testDate.getMonth();
    const theme = monthThemes[monthIndex];
    applyTheme(theme);
    document.getElementById("monthDisplay").textContent = `${theme.name} (simulation)`;
  }
}


// Convertir jour de l'année → date réelle
function dayOfYearToDate(year, dayOfYear) {
  const date = new Date(year, 0);
  date.setDate(dayOfYear);
  return date;
}




updateBySlider(0);

// Color Picker et gestion manuelle
function valid() {
  document.getElementById("show-palette-btn1").disabled = false;
  document.getElementById("show-palette-btn2").disabled = false;
  document.getElementById("show-palette-btn3").disabled = false;
  document.getElementById("couleursfond").disabled = false;
  document.getElementById("changeColorBtn").disabled = false;
  document.getElementById("changeColorBtn1").disabled = false;
  document.getElementById("color-palette").style.display = "none";
  document.getElementById("red-slider").value = 0;
  document.getElementById("green-slider").value = 0;
  document.getElementById("blue-slider").value = 255;
  document.getElementById("alpha").value = 50;
  document.getElementById("val").innerHTML = "Annuler";
  document.getElementById("rd").innerHTML = "0";
  document.getElementById("vt").innerHTML = "0";
  document.getElementById("bu").innerHTML = "255";
  document.getElementById("tr").innerHTML = "0.5";
  document.getElementById("show-palette-btn1").style.color = "black";
  document.getElementById("show-palette-btn2").style.color = "black";
  document.getElementById("show-palette-btn3").style.color = "black";
}

let temp = 0;

function updateCircleColor(circleId) {
  const red = document.getElementById("red-slider").value;
  const green = document.getElementById("green-slider").value;
  const blue = document.getElementById("blue-slider").value;
  const alpha = (document.getElementById("alpha").value) / 100;
  document.getElementById("rd").innerHTML = red;
  document.getElementById("vt").innerHTML = green;
  document.getElementById("bu").innerHTML = blue;
  document.getElementById("tr").innerHTML = alpha;
  const selectedColor = `rgba(${red},${green},${blue},${alpha})`;
  document.documentElement.style.setProperty(`--circle${circleId}-color`, selectedColor);
  document.getElementById("val").innerHTML = "Valider";
}

function AFF(circleId) {
  temp = circleId;
  document.getElementById("color-palette").style.display = "block";
  document.getElementById("show-palette-btn1").disabled = true;
  document.getElementById("show-palette-btn2").disabled = true;
  document.getElementById("show-palette-btn3").disabled = true;
  document.getElementById("couleursfond").disabled = true;
  document.getElementById("changeColorBtn").disabled = true;
  document.getElementById("changeColorBtn1").disabled = true;
  if (circleId == 1) document.getElementById("show-palette-btn1").style.color = "white";
  if (circleId == 2) document.getElementById("show-palette-btn2").style.color = "white";
  if (circleId == 3) document.getElementById("show-palette-btn3").style.color = "white";
}
applyCurrentDateTheme();
