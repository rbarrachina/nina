const RADIUS_METERS = 40;
const FINAL_KEY = "SHERLOCKED";
const STORAGE_KEY = "expedient-23-progress";
const WELCOME_KEY = "expedient-23-welcome-seen";
const URL_PARAMS = new URLSearchParams(window.location.search);
const TEST_MODE = URL_PARAMS.get("test") === "1";
const COMPLETE_TEST_MODE = TEST_MODE && URL_PARAMS.get("complete") === "1";
const RESET_MODE = URL_PARAMS.get("reset") === "1";

const CASE_CENTER = [41.3715, 2.1487];

const scenes = [
  {
    id: "avia-bizcochos",
    number: 4,
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
    number: 1,
    title: "La finestra coneguda",
    letter: "S",
    lat: 41.371453,
    lng: 2.145783,
    image: "assets/finestra-escola.png",
    clue:
      "Detectiva Nina, possiblement has mirat moltes vegades per aquesta finestra. Busca on està ubicada i quan hi arribis, les parets et diran el nom que necessites.",
    question: "Escriu el nom de l'escola exactament com apareix a la paret.",
    answers: ["magòria"],
    exactAnswer: true,
  },
  {
    id: "forn-1925",
    number: 2,
    title: "El rastre de la farina",
    letter: "K",
    lat: 41.3709426,
    lng: 2.1459405,
    clue:
      "Detectiva Nina, segueix el rastre de la farina. Hi ha un establiment del barri que porta dècades fent pa i treballa la germana de la Noa.",
    question: "El rètol conserva una data important. Escriu l'any de creació del forn.",
    answers: ["1925"],
  },
  {
    id: "carrer-chopin",
    number: 3,
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
    number: 5,
    title: "El límit del barri",
    letter: "O",
    lat: 41.372341426287754,
    lng: 2.145986591864896,
    clue:
      "Detectiva Nina, el cas et porta fins al límit del barri. En ocasions hem anat a sopar i es diu La C***A.",
    question: "Al costat de La Choza hi ha un portal. Escriu aquest número.",
    answers: ["300"],
  },
  {
    id: "coberts-cinc-anys",
    number: 6,
    title: "La pista dels 5 anys",
    letter: "D",
    lat: 41.371668,
    lng: 2.146604,
    clue:
      "Detectiva Nina, aquest rastre ve de quan tenies 5 anys. Vas entrar a l'edifici cada dia de dilluns a divendres, encara que potser no sabies que un dia seria una escena del cas.",
    question: "Mira els rètols del restaurant del costat on hem dinat alguna vegada. Quants coberts hi ha en total?",
    answers: ["9"],
  },
  {
    id: "caixaforum-arbre",
    number: 9,
    title: "L'arbre de vidre",
    letter: "H",
    lat: 41.371312,
    lng: 2.150112,
    clue:
      "Detectiva Nina, al límit del barri hi ha una gran escultura que te forma d'arbre. Un arbre metàl·lic amb un sostre de vidre i unes branques que sostenen el secret. Troba'l.",
    question: "Observa l'arbre artificial. Quantes branques aguanten el sostre de vidre?",
    answers: ["16"],
  },
  {
    id: "pendent-8",
    number: 7,
    title: "La bústia groga",
    letter: "L",
    lat: 41.371652009137016,
    lng: 2.145064183825752,
    image: "assets/bustia-282.png",
    clue:
      "Detectiva Nina, busca aquesta bústia groga.",
    question: "Quan la trobis, mira el portal del costat. Quin número hi apareix?",
    answers: ["282"],
  },
  {
    id: "pendent-9",
    number: 10,
    title: "El logo repetit",
    letter: "C",
    lat: 41.370706016384126,
    lng: 2.14892137067909,
    image: "assets/jam-session.jpeg",
    hiddenOnMap: true,
    clue:
      "Detectiva Nina, aquest logo apareix en diferents llocs del barri. Posa't davant i sabràs que estàs al carrer dels ...",
    question: "Completa el nom del carrer on has trobat aquest logo.",
    answers: ["MONTFAR"],
  },
  {
    id: "pendent-10",
    number: 8,
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
  localStorage.removeItem(WELCOME_KEY);
}

let progress = COMPLETE_TEST_MODE ? loadCompleteTestProgress() : loadProgress();
let userPosition = null;
let selectedSceneId = scenes[0].id;
let sceneSheetOpen = false;
let map;
let userMarker;
let locationWatchId = null;
let hasCenteredOnUser = false;
let activeEvidenceDrag = false;
let selectedEvidenceId = null;
let nativeDragId = null;
let ignoreEvidenceTapUntil = 0;
let finalPrizeShown = false;
let finalGiftViewed = false;
const sceneMarkers = new Map();
let sceneQueueControl;

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
  showWelcomeMessage();
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

  addSceneQueueControl();
  syncSceneMarkers();
}

function addSceneMarker(scene) {
  if (sceneMarkers.has(scene.id)) return;

  const position = [scene.lat, scene.lng];

  const marker = L.marker(position, {
    icon: L.divIcon({
      className: "",
      html: `<span class="case-marker ${isCompleted(scene.id) ? "done" : ""}">${getSceneNumber(scene)}</span>`,
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

  if (locationWatchId !== null) {
    if (userPosition) renderUserPosition(true);
    return;
  }

  elements.mapStatus.textContent = "Demanant posició...";
  locationWatchId = navigator.geolocation.watchPosition(
    handlePositionUpdate,
    () => {
      elements.mapStatus.textContent = "GPS no autoritzat";
      locationWatchId = null;
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 }
  );
}

function handlePositionUpdate(position) {
  userPosition = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
  };
  renderUserPosition(!hasCenteredOnUser);
  const newlyLocatedIds = discoverNearbyScenes();
  syncSceneMarkers();
  renderSceneQueue();
  if (sceneSheetOpen && newlyLocatedIds.includes(selectedSceneId)) {
    renderScene(getSelectedScene());
  }
  elements.mapStatus.textContent = `GPS actiu · precisió ${Math.round(userPosition.accuracy)} m`;
}

function discoverNearbyScenes() {
  if (!userPosition) return [];
  let changed = false;
  const newlyLocatedIds = [];
  scenes.forEach((scene) => {
    if (!isSceneUnlocked(scene) || isSceneLocated(scene) || !hasCoordinates(scene)) return;
    if (distanceMeters(userPosition, scene) <= RADIUS_METERS) {
      progress.located.push(scene.id);
      newlyLocatedIds.push(scene.id);
      changed = true;
    }
  });
  if (changed) saveProgress();
  return newlyLocatedIds;
}

function syncSceneMarkers() {
  scenes.forEach((scene) => {
    const shouldShow = hasCoordinates(scene) && (isSceneLocated(scene) || isCompleted(scene.id));
    const marker = sceneMarkers.get(scene.id);

    if (shouldShow && !marker) {
      addSceneMarker(scene);
      return;
    }

    if (!shouldShow && marker) {
      marker.remove();
      sceneMarkers.delete(scene.id);
    }
  });
}

function renderAll() {
  renderProgress();
  renderSceneQueue();
  syncSceneMarkers();
  renderEmptyScene();
}

function renderEmptyScene() {
  sceneSheetOpen = false;
  elements.scenePanel.classList.remove("sheet-open");
  elements.scenePanel.onclick = null;
  elements.scenePanel.innerHTML = `
    <div class="empty-state">
      <p class="label">Escenes</p>
      <h2>Selecciona un número desbloquejat</h2>
      <p>Quan siguis dins del radi de 40 metres, l'enigma apareixerà al mapa i podràs resoldre'l.</p>
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
  const sceneNumber = getSceneNumber(scene);
  const isDone = isCompleted(scene.id);
  const canOpen = canOpenScene(scene);
  const isUnlocked = isSceneUnlocked(scene);
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

  const distanceNote = fragment.querySelector(".distance-note");
  distanceNote.textContent = distanceCopy(scene, canOpen);

  if (canLocateInTest(scene)) {
    const testLocateButton = document.createElement("button");
    testLocateButton.className = "test-locate-button";
    testLocateButton.type = "button";
    testLocateButton.textContent = "Localitzar en prova";
    testLocateButton.addEventListener("click", () => locateSceneForTesting(scene));
    distanceNote.append(testLocateButton);
  }

  if (isUnlocked && canOpen && !scene.pending) {
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

function renderUserPosition(shouldCenter = false) {
  const latLng = [userPosition.lat, userPosition.lng];
  if (!userMarker) {
    userMarker = L.marker(latLng, {
      icon: L.divIcon({
        className: "",
        html: '<span class="user-marker" aria-label="La teva ubicació">🕵️‍♀️</span>',
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      }),
    }).addTo(map);
  } else {
    userMarker.setLatLng(latLng);
  }
  if (shouldCenter) {
    map.setView(latLng, Math.max(map.getZoom(), 16));
    hasCenteredOnUser = true;
  }
}

function addSceneQueueControl() {
  const QueueControl = L.Control.extend({
    onAdd: () => {
      const container = L.DomUtil.create("div", "scene-queue-control");
      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
      return container;
    },
  });

  sceneQueueControl = new QueueControl({ position: "topleft" });
  sceneQueueControl.addTo(map);
  renderSceneQueue();
}

function renderSceneQueue() {
  if (!sceneQueueControl) return;
  const container = sceneQueueControl.getContainer();
  if (!container) return;
  container.replaceChildren();

  getScenesByNumber().forEach((scene) => {
    const button = document.createElement("button");
    const unlocked = isSceneUnlocked(scene);
    const located = isSceneLocated(scene) || isCompleted(scene.id);
    button.type = "button";
    button.className = [
      "scene-queue-button",
      unlocked ? "is-unlocked" : "is-locked",
      located ? "is-located" : "",
      isCompleted(scene.id) ? "is-done" : "",
    ]
      .filter(Boolean)
      .join(" ");
    button.textContent = String(getSceneNumber(scene));
    button.setAttribute("aria-label", unlocked ? `Obrir enigma ${getSceneNumber(scene)}` : `Enigma ${getSceneNumber(scene)} bloquejat`);
    button.disabled = !unlocked;

    if (unlocked) {
      button.addEventListener("click", () => {
        selectedSceneId = scene.id;
        sceneSheetOpen = true;
        renderScene(scene);
      });
    }

    container.append(button);
  });
}

function showWelcomeMessage() {
  const overlay = document.querySelector("#welcomeOverlay");
  if (!overlay) return;
  if (!RESET_MODE && localStorage.getItem(WELCOME_KEY) === "1") {
    overlay.remove();
    return;
  }

  document.querySelector("#welcomeStartButton")?.addEventListener("click", () => {
    localStorage.setItem(WELCOME_KEY, "1");
    overlay.remove();
  });
}

function canLocateInTest(scene) {
  return TEST_MODE && isSceneUnlocked(scene) && !isSceneLocated(scene) && !isCompleted(scene.id);
}

function locateSceneForTesting(scene) {
  if (!canLocateInTest(scene)) return;
  progress.located.push(scene.id);
  saveProgress();
  syncSceneMarkers();
  renderSceneQueue();
  renderScene(scene);
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
    renderSceneQueue();
    syncSceneMarkers();
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

  finalPrizeShown = true;
  elements.finalFeedback.textContent = "";
  elements.finalFeedback.className = "feedback good";
  showFinalPrizeIntro(finalGiftViewed);
}

function showFinalPrizeIntro(showGift = false) {
  if (document.querySelector(".final-prize-overlay")) return;

  const overlay = document.createElement("div");
  overlay.className = "final-prize-overlay";
  document.body.append(overlay);

  const closePrize = () => overlay.remove();
  const renderGift = () => {
    finalGiftViewed = true;
    overlay.innerHTML = `
      <article class="final-prize-card gift-card">
        <button class="final-prize-close" type="button" aria-label="Tancar">×</button>
        <p class="label">Premi desbloquejat</p>
        <h2>Felicitats</h2>
        <img class="final-prize-image" src="assets/pastis-nina-23.png" alt="Pastís d'aniversari de la Nina">
        <p>Torna a casa a bufar espelmes.</p>
      </article>
    `;
    overlay.querySelector(".final-prize-close").addEventListener("click", closePrize);
  };

  if (showGift) {
    renderGift();
    return;
  }

  overlay.innerHTML = `
    <article class="final-prize-card">
      <button class="final-prize-close" type="button" aria-label="Tancar">×</button>
      <h2>Felicitats!</h2>
      <p>Has superat el repte i has resolt totes les pistes del cas.</p>
      <p>Fes una captura de pantalla de la imatge del regal com a comprovació de premi i envia-la als teus pares.</p>
      <button class="final-prize-button" type="button">Veure regal</button>
    </article>
  `;

  overlay.querySelector(".final-prize-close").addEventListener("click", closePrize);
  overlay.querySelector(".final-prize-button").addEventListener("click", renderGift);
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
  if (!isSceneUnlocked(scene)) return "bloquejada";
  if (!isSceneLocated(scene)) return "per localitzar";
  if (canOpen) return "oberta";
  return "bloquejada";
}

function distanceCopy(scene, canOpen) {
  if (!isSceneUnlocked(scene)) return "Aquest enigma encara no està desbloquejat.";
  if (scene.pending) return "Aquesta escena encara no té el contingut definit.";
  if (!hasCoordinates(scene)) {
    return TEST_MODE
      ? "Mode de prova actiu: escena oberta sense coordenades."
      : "Falten les coordenades d'aquesta escena per activar el radi de 40 metres.";
  }
  if (!userPosition) return "Activa el GPS per comprovar si ets dins del radi de 40 metres.";

  const distance = distanceMeters(userPosition, scene);
  if (!isSceneLocated(scene)) {
    return `Estàs a ${Math.round(distance)} m. Acosta't fins a 40 m perquè l'enigma aparegui al mapa.`;
  }
  if (canOpen) return `Estàs a ${Math.round(distance)} m. L'escena es pot investigar.`;
  return `Estàs a ${Math.round(distance)} m. Acosta't fins a 40 m per obrir el repte.`;
}

function canOpenScene(scene) {
  if (isCompleted(scene.id)) return true;
  if (scene.pending) return false;
  if (!isSceneUnlocked(scene)) return false;
  return isSceneLocated(scene);
}

function hasCoordinates(scene) {
  return Number.isFinite(scene.lat) && Number.isFinite(scene.lng);
}

function getSelectedScene() {
  return scenes.find((scene) => scene.id === selectedSceneId) || scenes[0];
}

function getScenesByNumber() {
  return [...scenes].sort((first, second) => getSceneNumber(first) - getSceneNumber(second));
}

function getSceneById(sceneId) {
  return scenes.find((scene) => scene.id === sceneId);
}

function isCompleted(sceneId) {
  return progress.completed.includes(sceneId);
}

function getSceneNumber(scene) {
  return scene.number ?? scenes.findIndex((item) => item.id === scene.id) + 1;
}

function isSceneUnlocked(scene) {
  return getSceneNumber(scene) <= getUnlockedSceneLimit();
}

function getUnlockedSceneLimit() {
  if (COMPLETE_TEST_MODE) return scenes.length;
  return Math.min(scenes.length, 2 + progress.completed.length);
}

function isSceneLocated(scene) {
  return Array.isArray(progress.located) && progress.located.includes(scene.id);
}

function updateMarker(scene) {
  const marker = sceneMarkers.get(scene.id);
  if (!marker) {
    syncSceneMarkers();
    return;
  }
  marker.setIcon(
    L.divIcon({
      className: "",
      html: `<span class="case-marker done">${getSceneNumber(scene)}</span>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })
  );
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
    if (stored && Array.isArray(stored.completed)) {
      return {
        ...stored,
        located: Array.isArray(stored.located) ? stored.located : [],
      };
    }
  } catch {
    // Ignore invalid local state.
  }
  return { completed: [], located: [] };
}

function loadCompleteTestProgress() {
  return {
    completed: scenes.map((scene) => scene.id),
    located: scenes.map((scene) => scene.id),
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
