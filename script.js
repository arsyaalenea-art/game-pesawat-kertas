const PRESET = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Jakarta",
  "Asia/Tokyo",
  "Australia/Sydney"
];

const STORAGE_KEY = "multi-tz-clocks.zones";

const presetSelect = document.getElementById("presetZones");
const addPresetBtn = document.getElementById("addPreset");
const addCustomBtn = document.getElementById("addCustom");
const customInput = document.getElementById("customZone");
const clocksEl = document.getElementById("clocks");
const localTzEl = document.getElementById("localTz");

function loadZones(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) return JSON.parse(raw);
  } catch(e){}
  return PRESET.slice(0,5);
}
function saveZones(zones){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(zones));
}

function populatePresets(){
  PRESET.forEach(tz=>{
    const opt = document.createElement("option");
    opt.value = tz; opt.textContent = tz;
    presetSelect.appendChild(opt);
  });
}

function makeCard(zone){
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.zone = zone;

  const tzTitle = document.createElement("div");
  tzTitle.className = "tz";
  tzTitle.textContent = zone;

  const timeEl = document.createElement("div");
  timeEl.className = "time";
  timeEl.textContent = "--:--:--";

  const dateEl = document.createElement("div");
  dateEl.className = "date";
  dateEl.textContent = "";

  const meta = document.createElement("div");
  meta.className = "meta";

  const tzInfo = document.createElement("div");
  tzInfo.className = "muted";
  tzInfo.style.color = "var(--muted)";
  tzInfo.textContent = "";

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove";
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", ()=>{
    removeZone(zone);
  });

  meta.appendChild(tzInfo);
  meta.appendChild(removeBtn);

  card.appendChild(tzTitle);
  card.appendChild(timeEl);
  card.appendChild(dateEl);
  card.appendChild(meta);

  return {card, timeEl, dateEl, tzInfo};
}

function updateClockFor(zone, els, now){
  // time and date formatting in this timezone
  try {
    const timeFmt = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false, timeZone: zone
    });
    const dateFmt = new Intl.DateTimeFormat(undefined, {
      weekday: "short", year: "numeric", month: "short", day: "numeric",
      timeZone: zone
    });
    els.timeEl.textContent = timeFmt.format(now);
    els.dateEl.textContent = dateFmt.format(now);

    // Try to extract short timezone name (e.g. "GMT+7" or "PDT")
    let tzName = zone;
    try {
      const parts = new Intl.DateTimeFormat(undefined, {timeZone: zone, timeZoneName: "short"}).formatToParts(now);
      const tzPart = parts.find(p => p.type === "timeZoneName");
      if(tzPart && tzPart.value) tzName = tzPart.value;
    } catch(e){}
    els.tzInfo.textContent = tzName;
  } catch (err) {
    // invalid zone: show error
    els.timeEl.textContent = "— invalid zone —";
    els.dateEl.textContent = "";
    els.tzInfo.textContent = "";
  }
}

function renderZones(){
  clocksEl.innerHTML = "";
  const zones = loadZones();
  zones.forEach(zone => {
    const {card, timeEl, dateEl, tzInfo} = makeCard(zone);
    clocksEl.appendChild(card);
    // Attach elements for updating
    card._els = {timeEl, dateEl, tzInfo};
  });
  // Update immediately after render
  tick();
}

function tick(){
  const now = new Date();
  localTzEl.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || "local";

  // update each card
  const cards = clocksEl.querySelectorAll(".card");
  cards.forEach(card => {
    const zone = card.dataset.zone;
    updateClockFor(zone, card._els, now);
  });
}

function addZone(zone){
  if(!zone) return;
  const zones = loadZones();
  if(zones.includes(zone)) return;
  zones.push(zone);
  saveZones(zones);
  renderZones();
}

function removeZone(zone){
  let zones = loadZones();
  zones = zones.filter(z => z !== zone);
  saveZones(zones);
  renderZones();
}

addPresetBtn.addEventListener("click", ()=>{
  const tz = presetSelect.value;
  addZone(tz);
});

addCustomBtn.addEventListener("click", ()=>{
  const tz = customInput.value.trim();
  if(!tz) return;
  addZone(tz);
  customInput.value = "";
});

// initial
populatePresets();
renderZones();
setInterval(tick, 1000);
