const RADIUS_METERS = 40;
const FINAL_KEY = "SHERLOCKED";
const STORAGE_KEY = "expedient-23-progress";
const URL_PARAMS = new URLSearchParams(window.location.search);
const TEST_MODE = URL_PARAMS.get("test") === "1";
const COMPLETE_TEST_MODE = TEST_MODE && URL_PARAMS.get("complete") === "1";
const RESET_MODE = URL_PARAMS.get("reset") === "1";

const CASE_CENTER = [41.3715, 2.1487];

const scenes = [
  {
    id: "avia-bizcochos",
    title: "La testimoni dolça",
    letter: "E",
    lat: 41.370645,
    lng: 2.147323,
    clue:
      "Ves a la casa de la persona que fa els millors bizcochos del barri. Quan hi arribis, demana-li la clau del cas.",
    question: "Introdueix el codi secret que t'ha revelat la testimoni.",
    answers: ["1947"],
  },
  {
    id: "finestra-escola",
    title: "La finestra coneguda",
    letter: "S",
    lat: 41.371453,
    lng: 2.145783,
    image: "assets/finestra-escola.png",
    clue:
      "Detectiva Nina, torna a una finestra coneguda. Busca el lloc on segur que vas treure el cap moltes vegades. Quan hi arribis, les parets et diran el nom que necessites.",
    question: "Escriu el nom de l'escola exactament com apareix a la paret.",
    answers: ["magòria"],
    exactAnswer: true,
  },
  {
    id: "forn-1925",
    title: "El rastre de la farina",
    letter: "K",
    lat: 41.3709426,
    lng: 2.1459405,
    clue:
      "Detectiva Nina, segueix el rastre de la farina. Hi ha un establiment del barri que porta dècades deixant pistes calentes. Busca el forn i observa bé el seu rètol.",
    question: "El rètol conserva una data important. Escriu l'any de creació del forn.",
    answers: ["1925"],
  },
  {
    id: "carrer-chopin",
    title: "El pianista silenciós",
    letter: "R",
    lat: 41.370674,
    lng: 2.146564,
    clue:
      "Detectiva Nina, al barri s'hi amaga un pianista. No toca cap nota, però té un carrer amb el seu nom. Troba'l i situa't al mig del carrer, on la música queda escrita a les plaques.",
    question: "Escriu el cognom del pianista que dona nom al carrer.",
    answers: ["CHOPIN", "CARRER CHOPIN", "CARRER DE CHOPIN"],
  },
  {
    id: "la-choza",
    title: "El límit del barri",
    letter: "O",
    lat: 41.372341426287754,
    lng: 2.145986591864896,
    clue:
      "Detectiva Nina, el cas et porta fins al límit del barri. Busca el lloc on de vegades anem a sopar i observa què té just al costat.",
    question: "Al costat de La Choza hi ha un número que no passa desapercebut. Escriu el número del carrer.",
    answers: ["300"],
  },
  {
    id: "coberts-cinc-anys",
    title: "La pista dels 5 anys",
    letter: "D",
    lat: 41.371668,
    lng: 2.146604,
    clue:
      "Detectiva Nina, aquest rastre ve de quan tenies 5 anys. Vas entrar a l'edifici moltes vegades, encara que potser no sabies que un dia seria una escena del cas.",
    question: "Mira els rètols dels restaurants del costat. Quants coberts hi ha en total?",
    answers: ["9"],
  },
  {
    id: "caixaforum-arbre",
    title: "L'arbre de vidre",
    letter: "H",
    lat: 41.371312,
    lng: 2.150112,
    clue:
      "Detectiva Nina, al límit del barri hi ha un arbre que no ha crescut de la terra. Té un sostre de vidre i unes branques que sostenen el secret. Troba'l.",
    question: "Observa l'arbre artificial. Quantes branques aguanten el sostre de vidre?",
    answers: ["16"],
  },
  {
    id: "pendent-8",
    title: "La bústia groga",
    letter: "L",
    lat: 41.371652009137016,
    lng: 2.145064183825752,
    image: "assets/bustia-282.png",
    clue:
      "Detectiva Nina, busca aquesta bústia groga. El cas s'ha amagat en un racó de carrer que sembla normal, però no ho és.",
    question: "Quan la trobis, mira el portal del costat. Quin número hi apareix?",
    answers: ["282"],
  },
  {
    id: "pendent-9",
    title: "El logo repetit",
    letter: "C",
    lat: 41.370706016384126,
    lng: 2.14892137067909,
    image: "assets/logo-jam-session.png",
    hiddenOnMap: true,
    clue:
      "Detectiva Nina, aquest logo apareix en diferents situacions del barri. Però aquest està situat al carrer dels...",
    question: "Completa el nom del carrer on has trobat aquest logo.",
    answers: ["MONTFAR"],
  },
  {
    id: "pendent-10",
    title: "El senyal blau",
    letter: "E",
    lat: 41.37352305794842,
    lng: 2.147558658700648,
    image: "assets/senyal-hotel-7.png",
    hiddenOnMap: true,
    clue:
      "Detectiva Nina, troba aquest senyal blau. Quan hi siguis, situa't just a sota i mira l'hotel que tens al davant.",
    question: "Quants pisos té l'hotel que hi ha davant?",
    answers: ["7"],
  },
];

if (RESET_MODE) {
  localStorage.removeItem(STORAGE_KEY);
}

let progress = COMPLETE_TEST_MODE ? loadCompleteTestProgress() : loadProgress();
let userPosition = null;
let selectedSceneId = scenes[0].id;
let sceneSheetOpen = false;
let map;
let userMarker;
let activeEvidenceDrag = false;
let selectedEvidenceId = null;
let nativeDragId = null;
let ignoreEvidenceTapUntil = 0;
let finalPrizeShown = false;
const sceneMarkers = new Map();

const elements = {
  locateButton: document.querySelector("#locateButton"),
  mapStatus: document.querySelector("#mapStatus"),
  lettersList: document.querySelector("#lettersList"),
  scenePanel: document.querySelector("#scenePanel"),
  sceneTemplate: document.querySelector("#sceneTemplate"),
  finalCheck: document.querySelector("#finalCheck"),
  finalFeedback: document.querySelector("#finalFeedback"),
};

init();

function init() {
  initMap();
  bindEvents();
  renderAll();
  locateUser();
  registerServiceWorker();
}

function bindEvents() {
  elements.locateButton.addEventListener("click", locateUser);
  elements.lettersList.addEventListener("mouseup", onEvidenceTap);
  elements.lettersList.addEventListener("touchend", onEvidenceTap);
  elements.finalCheck?.addEventListener("click", onFinalCheck);
}

function initMap() {
  map = L.map("map", { zoomControl: false }).setView(CASE_CENTER, 15);
  L.control.zoom({ position: "bottomleft" }).addTo(map);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 20,
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);

  scenes.forEach((scene, index) => {
    if (scene.hiddenOnMap && !TEST_MODE) return;
    addSceneMarker(scene, index);
  });
}

function addSceneMarker(scene, index) {
  if (sceneMarkers.has(scene.id)) return;

  const position = hasCoordinates(scene)
    ? [scene.lat, scene.lng]
    : offsetPosition(CASE_CENTER, index);

  const marker = L.marker(position, {
    icon: L.divIcon({
      className: "",
      html: `<span class="case-marker ${isCompleted(scene.id) ? "done" : ""}">${index + 1}</span>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    }),
  }).addTo(map);

  marker.on("click", () => {
    selectedSceneId = scene.id;
    sceneSheetOpen = true;
    renderScene(scene);
  });
  marker.bindPopup(scene.title);
  sceneMarkers.set(scene.id, marker);
}

function locateUser() {
  if (!("geolocation" in navigator)) {
    elements.mapStatus.textContent = "Aquest dispositiu no permet usar GPS al navegador";
    return;
  }

  elements.mapStatus.textContent = "Demanant posició...";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      userPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
      renderUserPosition();
      revealNearbyHiddenMarkers();
      if (sceneSheetOpen) renderScene(getSelectedScene());
      elements.mapStatus.textContent = `GPS actiu · precisió ${Math.round(userPosition.accuracy)} m`;
    },
    () => {
      elements.mapStatus.textContent = "GPS no autoritzat";
      if (sceneSheetOpen) renderScene(getSelectedScene());
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 }
  );
}

function revealNearbyHiddenMarkers() {
  if (!userPosition) return;
  scenes.forEach((scene, index) => {
    if (!scene.hiddenOnMap || sceneMarkers.has(scene.id) || !hasCoordinates(scene)) return;
    if (distanceMeters(userPosition, scene) <= RADIUS_METERS) {
      addSceneMarker(scene, index);
    }
  });
}

function renderAll() {
  renderProgress();
  renderEmptyScene();
}

function renderEmptyScene() {
  sceneSheetOpen = false;
  elements.scenePanel.classList.remove("sheet-open");
  elements.scenePanel.onclick = null;
  elements.scenePanel.innerHTML = `
    <div class="empty-state">
      <p class="label">Escenes</p>
      <h2>Selecciona una pista del mapa</h2>
      <p>Quan siguis dins del radi de 40 metres podràs obrir el repte.</p>
    </div>
  `;
}

function renderProgress() {
  const completedCount = progress.completed.length;
  ensureLetterOrder();
  elements.lettersList.replaceChildren();

  for (let index = 0; index < scenes.length; index += 1) {
    const scene = getSceneById(progress.letterOrder[index]);
    const item = document.createElement("button");
    item.className = `letter ${scene ? "" : "empty"}`;
    item.textContent = scene?.letter || "·";
    item.type = "button";
    item.dataset.index = String(index);
    if (scene) {
      item.draggable = false;
      item.dataset.id = scene.id;
      item.setAttribute("aria-label", `Lletra ${scene.letter}`);
      item.classList.toggle("selected", scene.id === selectedEvidenceId);
    } else {
      item.draggable = false;
      item.setAttribute("aria-label", `Posició buida ${index + 1}`);
    }
    bindEvidenceSlot(item);
    elements.lettersList.append(item);
  }

  elements.finalCheck.classList.toggle("is-hidden", completedCount !== scenes.length);
}

function renderScene(scene) {
  const fragment = elements.sceneTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".scene-card");
  const sceneNumber = scenes.findIndex((item) => item.id === scene.id) + 1;
  const isDone = isCompleted(scene.id);
  const canOpen = canOpenScene(scene);
  const image = fragment.querySelector(".scene-image");
  const challenge = fragment.querySelector(".challenge");
  const form = fragment.querySelector(".answer-form");
  const input = fragment.querySelector("input");
  const feedback = fragment.querySelector(".feedback");
  const closeButton = fragment.querySelector(".sheet-close");

  elements.scenePanel.classList.add("sheet-open");
  fragment.querySelector(".scene-number").textContent = `Escena ${sceneNumber}`;
  fragment.querySelector(".scene-title").textContent = scene.title;
  fragment.querySelector(".scene-state").textContent = stateLabel(scene, isDone, canOpen);
  fragment.querySelector(".scene-clue").textContent = scene.clue;
  fragment.querySelector(".scene-question").textContent = scene.question;

  if (scene.image) {
    image.src = scene.image;
    image.alt = `Pista visual de ${scene.title}`;
    image.classList.remove("is-hidden");
  }

  fragment.querySelector(".distance-note").textContent = distanceCopy(scene, canOpen);

  if (canOpen && !scene.pending) {
    challenge.classList.remove("is-hidden");
  }

  if (isDone) {
    input.disabled = true;
    form.querySelector("button").disabled = true;
    feedback.textContent = `Evidència validada. Lletra recuperada: ${scene.letter}`;
    feedback.className = "feedback good";
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    checkSceneAnswer(scene, input.value, feedback);
  });
  closeButton.addEventListener("click", renderEmptyScene);
  elements.scenePanel.onclick = onSceneBackdropClick;

  elements.scenePanel.replaceChildren(card);
}

function onSceneBackdropClick(event) {
  if (event.target === elements.scenePanel) {
    renderEmptyScene();
  }
}

function renderUserPosition() {
  const latLng = [userPosition.lat, userPosition.lng];
  if (!userMarker) {
    userMarker = L.marker(latLng, {
      icon: L.divIcon({
        className: "",
        html: '<span class="user-marker"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
    }).addTo(map);
  } else {
    userMarker.setLatLng(latLng);
  }
  map.setView(latLng, Math.max(map.getZoom(), 16));
}

function checkSceneAnswer(scene, value, feedback) {
  if (!canOpenScene(scene)) {
    feedback.textContent = "Encara no ets prou a prop de l'escena.";
    feedback.className = "feedback bad";
    return;
  }

  if (scene.answers.length === 0) {
    feedback.textContent = "Aquesta resposta encara s'ha d'afegir.";
    feedback.className = "feedback bad";
    return;
  }

  const normalizer = scene.exactAnswer ? normalizeExactAnswer : normalizeAnswer;
  const normalized = normalizer(value);
  const valid = scene.answers.some((answer) => normalizer(answer) === normalized);

  if (!valid) {
    feedback.textContent = "La pista no quadra. Torna a observar l'escena.";
    feedback.className = "feedback bad";
    return;
  }

  const newlyCompleted = !isCompleted(scene.id);
  if (newlyCompleted) {
    progress.completed.push(scene.id);
    saveProgress();
  }

  feedback.textContent = "Correcte. Evidència validada.";
  feedback.className = "feedback good";
  if (!newlyCompleted) {
    renderProgress();
    renderScene(scene);
    return;
  }

  showLetterReveal(scene.letter, () => {
    updateMarker(scene);
    renderProgress();
    renderEmptyScene();
  });
}

function showLetterReveal(letter, onDone) {
  const overlay = document.createElement("div");
  overlay.className = "letter-reveal-overlay";
  overlay.setAttribute("role", "status");
  overlay.innerHTML = `
    <div class="letter-reveal-card">
      <div class="reveal-ring" aria-hidden="true"></div>
      <p class="label">Evidència recuperada</p>
      <div class="reveal-letter">${letter}</div>
      <p class="reveal-copy">Nova lletra desbloquejada</p>
      <div class="reveal-sparks" aria-hidden="true">
        ${Array.from({ length: 10 }, (_, index) => `<span style="--i:${index}"></span>`).join("")}
      </div>
    </div>
  `;
  document.body.append(overlay);

  window.setTimeout(() => {
    overlay.classList.add("leaving");
  }, 1450);

  window.setTimeout(() => {
    overlay.remove();
    onDone();
  }, 1800);
}

function bindEvidenceSlot(tile) {
  tile.addEventListener("focus", () => {
    ignoreEvidenceTapUntil = Date.now() + 250;
    handleEvidenceClick(tile);
  });

  tile.addEventListener("dragstart", (event) => {
    if (!tile.dataset.id) {
      event.preventDefault();
      return;
    }
    nativeDragId = tile.dataset.id;
    tile.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", nativeDragId);
  });

  tile.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    elements.lettersList
      .querySelectorAll(".drop-target, .gap-before, .gap-after")
      .forEach((item) => item.classList.remove("drop-target", "gap-before", "gap-after"));
    tile.classList.add("drop-target");
  });

  tile.addEventListener("drop", (event) => {
    event.preventDefault();
    const fromId = nativeDragId || event.dataTransfer.getData("text/plain");
    moveEvidenceByIdToIndex(fromId, Number(tile.dataset.index));
    nativeDragId = null;
  });

  tile.addEventListener("dragend", () => {
    nativeDragId = null;
    renderProgress();
  });

  tile.addEventListener("pointerdown", (event) => {
    if (!tile.dataset.id) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    startEvidenceDrag(tile, event, {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moveEvent: "pointermove",
      upEvent: "pointerup",
      getPoint: (moveEvent) => ({ x: moveEvent.clientX, y: moveEvent.clientY }),
    });
  });

  tile.addEventListener("mousedown", (event) => {
    if (!tile.dataset.id) return;
    if (event.button !== 0) return;
    startEvidenceDrag(tile, event, {
      startX: event.clientX,
      startY: event.clientY,
      moveEvent: "mousemove",
      upEvent: "mouseup",
      getPoint: (moveEvent) => ({ x: moveEvent.clientX, y: moveEvent.clientY }),
    });
  });

  tile.addEventListener(
    "touchstart",
    (event) => {
      if (!tile.dataset.id) return;
      const touch = event.touches[0];
      if (!touch) return;
      startEvidenceDrag(tile, event, {
        startX: touch.clientX,
        startY: touch.clientY,
        moveEvent: "touchmove",
        upEvent: "touchend",
        getPoint: (moveEvent) => {
          const nextTouch = moveEvent.touches[0] || moveEvent.changedTouches[0];
          return { x: nextTouch.clientX, y: nextTouch.clientY };
        },
      });
    },
    { passive: false }
  );
}

function handleEvidenceClick(tile) {
  const sceneId = tile.dataset.id;
  const targetIndex = Number(tile.dataset.index);

  if (!sceneId && selectedEvidenceId) {
    moveEvidenceByIdToIndex(selectedEvidenceId, targetIndex);
    selectedEvidenceId = null;
    return;
  }

  if (!sceneId) return;

  if (!selectedEvidenceId) {
    selectedEvidenceId = sceneId;
    renderProgress();
    return;
  }

  if (selectedEvidenceId === sceneId) {
    selectedEvidenceId = null;
    renderProgress();
    return;
  }

  moveEvidenceByIdToIndex(selectedEvidenceId, targetIndex);
  selectedEvidenceId = null;
}

function startEvidenceDrag(tile, event, config) {
  if (activeEvidenceDrag) return;
  activeEvidenceDrag = true;

    const startIndex = Number(tile.dataset.index);
    const startX = config.startX;
    const startY = config.startY;
    let dropIndex = startIndex;
    let didMove = false;

    if (config.pointerId !== undefined && tile.setPointerCapture) {
      tile.setPointerCapture(config.pointerId);
    }
    tile.classList.add("dragging");
    elements.finalFeedback.textContent = "";

    const onPointerMove = (moveEvent) => {
      moveEvent.preventDefault();
      const point = config.getPoint(moveEvent);
      const deltaX = point.x - startX;
      const deltaY = point.y - startY;
      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
        didMove = true;
      }
      tile.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(1.03)`;

      const target = document
        .elementFromPoint(point.x, point.y)
        ?.closest(".letter");

      elements.lettersList
        .querySelectorAll(".drop-target, .shift-left, .shift-right")
        .forEach((item) => item.classList.remove("drop-target", "shift-left", "shift-right"));

      const targetIndex = target
        ? Number(target.dataset.index)
        : getNearestEvidenceIndex(point.x, point.y);
      if (!Number.isFinite(targetIndex) || targetIndex === dropIndex) return;

      showEvidenceGap(startIndex, targetIndex);
      dropIndex = targetIndex;
    };

    const onPointerUp = () => {
      if (config.pointerId !== undefined && tile.releasePointerCapture) {
        try {
          tile.releasePointerCapture(config.pointerId);
        } catch {
          // Pointer capture may already be gone if the browser ended the gesture.
        }
      }
      window.removeEventListener(config.moveEvent, onPointerMove);
      window.removeEventListener(config.upEvent, onPointerUp);
      tile.style.transform = "";
      tile.classList.remove("dragging");
      activeEvidenceDrag = false;

      if (!didMove) {
        return;
      }

      if (dropIndex !== startIndex) {
        moveEvidence(startIndex, dropIndex);
      }
      ignoreEvidenceTapUntil = Date.now() + 250;
    };

    window.addEventListener(config.moveEvent, onPointerMove, { passive: false });
    window.addEventListener(config.upEvent, onPointerUp, { once: true });
}

function onEvidenceTap(event) {
  if (Date.now() < ignoreEvidenceTapUntil) return;
  const tile = event.target.closest(".letter");
  if (!tile || !elements.lettersList.contains(tile)) return;
  handleEvidenceClick(tile);
}

function showEvidenceGap(startIndex, targetIndex) {
  const tiles = [...elements.lettersList.querySelectorAll(".letter")];
  const targetTile = tiles[targetIndex];
  if (!targetTile) return;

  targetTile.classList.add("drop-target");
  if (targetIndex > startIndex) {
    tiles.forEach((item, index) => {
      if (index > startIndex && index <= targetIndex) {
        item.classList.add("shift-left");
      }
    });
    return;
  }

  if (targetIndex < startIndex) {
    tiles.forEach((item, index) => {
      if (index >= targetIndex && index < startIndex) {
        item.classList.add("shift-right");
      }
    });
  }
}

function getNearestEvidenceIndex(pointerX, pointerY) {
  const tiles = [...elements.lettersList.querySelectorAll(".letter")];
  let nearestIndex = null;
  let nearestDistance = Infinity;

  tiles.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(pointerX - centerX, pointerY - centerY);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = Number(item.dataset.index);
    }
  });

  return nearestIndex;
}

function moveEvidence(fromIndex, toIndex) {
  if (fromIndex === toIndex) return;
  elements.lettersList
    .querySelectorAll(".drop-target, .shift-left, .shift-right")
    .forEach((item) => item.classList.remove("drop-target", "shift-left", "shift-right"));
  const previousPositions = captureLetterPositions();
  const slots = normalizeLetterSlots(progress.letterOrder);
  const sceneId = slots[fromIndex];
  if (!sceneId) return;

  if (!slots[toIndex]) {
    slots[toIndex] = sceneId;
    slots[fromIndex] = null;
  } else if (fromIndex < toIndex) {
    for (let index = fromIndex; index < toIndex; index += 1) {
      slots[index] = slots[index + 1];
    }
    slots[toIndex] = sceneId;
  } else {
    for (let index = fromIndex; index > toIndex; index -= 1) {
      slots[index] = slots[index - 1];
    }
    slots[toIndex] = sceneId;
  }

  progress.letterOrder = slots;
  saveProgress();
  renderProgress();
  animateLetterMove(previousPositions);
}

function moveEvidenceById(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return;
  const fromIndex = progress.letterOrder.indexOf(fromId);
  const toIndex = progress.letterOrder.indexOf(toId);
  if (fromIndex === -1 || toIndex === -1) return;
  moveEvidence(fromIndex, toIndex);
}

function moveEvidenceByIdToIndex(fromId, toIndex) {
  if (!fromId || !Number.isFinite(toIndex)) return;
  const fromIndex = progress.letterOrder.indexOf(fromId);
  if (fromIndex === -1) return;
  moveEvidence(fromIndex, toIndex);
}

function captureLetterPositions() {
  const positions = new Map();
  elements.lettersList.querySelectorAll(".letter:not(.empty)").forEach((tile) => {
    positions.set(tile.dataset.id, tile.getBoundingClientRect());
  });
  return positions;
}

function animateLetterMove(previousPositions) {
  elements.lettersList.querySelectorAll(".letter:not(.empty)").forEach((tile) => {
    const previous = previousPositions.get(tile.dataset.id);
    if (!previous) return;
    const current = tile.getBoundingClientRect();
    const deltaX = previous.left - current.left;
    const deltaY = previous.top - current.top;
    if (deltaX === 0 && deltaY === 0) return;

    tile.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    requestAnimationFrame(() => {
      tile.style.transform = "";
    });
  });
}

function onFinalCheck() {
  evaluateFinalOrder(true);
}

function evaluateFinalOrder(showFailure) {
  const answer = progress.letterOrder
    .map((sceneId) => getSceneById(sceneId)?.letter || "")
    .join("");
  if (answer !== FINAL_KEY) {
    if (showFailure) {
      elements.finalFeedback.textContent = "Aquesta no és la paraula correcta.";
      elements.finalFeedback.className = "feedback bad";
    }
    return;
  }

  if (finalPrizeShown) return;
  finalPrizeShown = true;
  elements.finalFeedback.textContent = "Ordre correcte. Expedient tancat.";
  elements.finalFeedback.className = "feedback good";
  showFinalPrizeIntro();
}

function showFinalPrizeIntro() {
  const overlay = document.createElement("div");
  overlay.className = "final-prize-overlay";
  overlay.innerHTML = `
    <article class="final-prize-card">
      <button class="final-prize-close" type="button" aria-label="Tancar">×</button>
      <h2>Felicitats!</h2>
      <p>Has superat el repte i has resolt totes les pistes del cas.</p>
      <p>Fes una captura de pantalla de la imatge del regal com a comprovació de premi i envia-la als teus pares.</p>
      <button class="final-prize-button" type="button">Veure regal</button>
    </article>
  `;
  document.body.append(overlay);

  overlay.querySelector(".final-prize-close").addEventListener("click", () => {
    overlay.remove();
  });

  overlay.querySelector(".final-prize-button").addEventListener("click", () => {
    overlay.innerHTML = `
      <article class="final-prize-card gift-card">
        <button class="final-prize-close" type="button" aria-label="Tancar">×</button>
        <p class="label">Premi desbloquejat</p>
        <h2>Felicitats</h2>
        <img class="final-prize-image" src="assets/pastis-nina-23.png" alt="Pastís d'aniversari de la Nina">
        <p>Torna a casa a bufar espelmes.</p>
      </article>
    `;
    overlay.querySelector(".final-prize-close").addEventListener("click", () => {
      overlay.remove();
    });
  });
}

function ensureLetterOrder() {
  const completedIds = progress.completed.filter((sceneId) => getSceneById(sceneId));
  const currentSlots = normalizeLetterSlots(progress.letterOrder);

  const knownCompleted = currentSlots.filter((sceneId) => completedIds.includes(sceneId));
  const newCompleted = completedIds.filter((sceneId) => !knownCompleted.includes(sceneId));
  let nextSlots = currentSlots.map((sceneId) => (completedIds.includes(sceneId) ? sceneId : null));

  newCompleted.forEach((sceneId) => {
    const emptyIndex = nextSlots.findIndex((slot) => slot === null);
    if (emptyIndex !== -1) {
      nextSlots[emptyIndex] = sceneId;
    }
  });

  if (nextSlots.join("|") !== currentSlots.join("|")) {
    progress.letterOrder = nextSlots;
    saveProgress();
  }
}

function normalizeLetterSlots(value) {
  const slots = Array.isArray(value) ? [...value] : [];
  while (slots.length < scenes.length) slots.push(null);
  return slots.slice(0, scenes.length).map((sceneId) => (getSceneById(sceneId) ? sceneId : null));
}

function stateLabel(scene, isDone, canOpen) {
  if (scene.pending) return "pendent";
  if (isDone) return "resolta";
  if (canOpen) return "oberta";
  return "bloquejada";
}

function distanceCopy(scene, canOpen) {
  if (scene.pending) return "Aquesta escena encara no té el contingut definit.";
  if (!hasCoordinates(scene)) {
    return TEST_MODE
      ? "Mode de prova actiu: escena oberta sense coordenades."
      : "Falten les coordenades d'aquesta escena per activar el radi de 40 metres.";
  }
  if (!userPosition) return "Activa el GPS per comprovar si ets dins del radi de 40 metres.";

  const distance = distanceMeters(userPosition, scene);
  if (canOpen) return `Estàs a ${Math.round(distance)} m. L'escena es pot investigar.`;
  return `Estàs a ${Math.round(distance)} m. Acosta't fins a 40 m per obrir el repte.`;
}

function canOpenScene(scene) {
  if (isCompleted(scene.id)) return true;
  if (scene.pending) return false;
  if (TEST_MODE) return true;
  if (!hasCoordinates(scene) || !userPosition) return false;
  return distanceMeters(userPosition, scene) <= RADIUS_METERS;
}

function hasCoordinates(scene) {
  return Number.isFinite(scene.lat) && Number.isFinite(scene.lng);
}

function getSelectedScene() {
  return scenes.find((scene) => scene.id === selectedSceneId) || scenes[0];
}

function getSceneById(sceneId) {
  return scenes.find((scene) => scene.id === sceneId);
}

function isCompleted(sceneId) {
  return progress.completed.includes(sceneId);
}

function updateMarker(scene) {
  const marker = sceneMarkers.get(scene.id);
  if (!marker) return;
  const index = scenes.findIndex((item) => item.id === scene.id);
  marker.setIcon(
    L.divIcon({
      className: "",
      html: `<span class="case-marker done">${index + 1}</span>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })
  );
}

function offsetPosition(center, index) {
  const angle = (index / scenes.length) * Math.PI * 2;
  const radius = 0.0025;
  return [center[0] + Math.sin(angle) * radius, center[1] + Math.cos(angle) * radius];
}

function distanceMeters(from, to) {
  const earthRadius = 6371000;
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function normalizeAnswer(value) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,;:!?'"`´’]/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function normalizeExactAnswer(value) {
  return value
    .trim()
    .replace(/\s+/g, " ");
}

function loadProgress() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored && Array.isArray(stored.completed)) return stored;
  } catch {
    // Ignore invalid local state.
  }
  return { completed: [] };
}

function loadCompleteTestProgress() {
  return {
    completed: scenes.map((scene) => scene.id),
    letterOrder: scenes.map((scene) => scene.id),
  };
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function registerServiceWorker() {
  if (TEST_MODE && "serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
    return;
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}
