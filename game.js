const words = [
  // Tempat dan jalan di kawasan Blok M serta sekitarnya.
  "Blok M", "Melawai", "Bulungan", "Mahakam", "Panglima Polim", "Kebayoran Baru",
  "Blok M Square", "Blok M Plaza", "Pasar Raya", "M Bloc Space", "Taman Literasi",
  "Little Tokyo", "Taman Ayodya", "Filosofi Kopi",
  // Transportasi dan aktivitas khas kawasan.
  "MRT", "MRT Blok M", "Terminal Blok M", "Transjakarta", "halte", "JakLingko",
  "trotoar", "pejalan kaki", "toko buku", "buku bekas", "musik live",
  "ruang kreatif", "kedai kopi", "kuliner malam", "Jalan Melawai",
  // Kuliner dan suasana nongkrong.
  "kopi susu", "roti bakar", "ramen", "takoyaki", "izakaya", "angkringan",
  // Ragam kuliner, transportasi, dan kegiatan di sekitar Blok M.
  "Barito", "Trunojoyo", "Jaksel", "kuliner", "nongkrong", "ngopi",
  "bakmi", "gyoza", "sushi", "udon", "donburi", "matcha", "onigiri",
  "yakitori", "kafe", "barista", "kedai", "literasi", "pameran", "konser",
  "stasiun", "peron", "transit", "bus", "taman", "komunitas",
  "kopi hitam", "kopi dingin", "es kopi", "teh tarik", "teh hangat",
  "susu jahe", "mie ayam", "sate ayam", "nasi gulai", "nasi kucing",
  "sate taichan", "jajanan malam", "warung tenda", "kedai ramen", "kedai matcha",
  "wisata kuliner", "berburu buku", "baca buku", "bursa buku", "piringan hitam",
  "musik akustik", "pentas seni", "ruang publik", "taman kota", "jalur pedestrian",
  "naik MRT", "naik bus", "kartu transit", "pintu stasiun", "halte bus",
  "Jalan Bulungan", "Jalan Mahakam", "Jalan Barito", "ngopi sore", "nongkrong sore"
];
const wordPools = [1, 2, 3].map((count) => words.filter((word) => word.split(" ").length === count));
const stages = {
  warmup: { label: "Tahap 1 · Pemanasan", singleChance: .75, doubleChance: .20, speed: .08 },
  challenge: { label: "Tahap 2 · Tantangan", singleChance: .20, doubleChance: .75, speed: .10 }
};
function stageForScore(value) {
  return value >= 10 ? stages.challenge : stages.warmup;
}
function pickWord(value, previous, random = Math.random) {
  const stage = stageForScore(value);
  const roll = random();
  const poolIndex = roll < stage.singleChance ? 0 : roll < stage.singleChance + stage.doubleChance ? 1 : 2;
  const candidates = wordPools[poolIndex].filter((word) => word !== previous);
  return candidates[Math.floor(random() * candidates.length)];
}
const byId = (id) => document.getElementById(id);
const enemy = byId("enemy");
const player = byId("player");
const wordDisplay = byId("word");
const input = byId("input");
const correctSound = new Audio("sfx/correct.mp3");
correctSound.volume = .2;
const backgroundMusic = new Audio("assets/audio/bgm.wav");
backgroundMusic.loop = true;
backgroundMusic.volume = .35;
const pauseDialog = byId("pause-dialog");
let paused = false;
let muted = false;
try { muted = localStorage.getItem("typing-battle-muted") === "true"; } catch { /* Session-only setting. */ }
const recordKey = "typing-battle-best";
let animationsEnabled = true;
const layout = { width: window.innerWidth, enemyWidth: 0, playerEdge: 0, wordWidth: 0 };
let currentWord = "";
let score = 0;
let hp = 3;
let bestScore = 0;
let running = false;
let enemyX = 0;
let lastTime = 0;
let animationTime = 0;
let composing = false;
try {
  const saved = Number(localStorage.getItem(recordKey));
  if (Number.isFinite(saved) && saved >= 0) bestScore = Math.floor(saved);
} catch { /* The game also works when browser storage is unavailable. */ }
byId("best-score").textContent = bestScore;

function updateBackgroundByTime() {
  const hour = new Date().getHours();
  const background = hour >= 5 && hour < 15 ? "BGpagi.png" : hour >= 15 && hour < 18 ? "BGsore.jpg" : "BGmalam.jpg";
  document.querySelector(".game-area").style.backgroundImage = `url("assets/${background}")`;
}
updateBackgroundByTime();
setInterval(updateBackgroundByTime, 60000);

function newWord() {
  currentWord = pickWord(score, currentWord);
  input.value = "";
  wordDisplay.replaceChildren();
  wordDisplay.setAttribute("aria-label", currentWord);
  for (const character of currentWord) {
    const span = document.createElement("span");
    span.className = "word-character";
    span.textContent = character;
    span.setAttribute("aria-hidden", "true");
    wordDisplay.append(span);
  }
  const overflow = document.createElement("span");
  overflow.className = "word-overflow";
  overflow.setAttribute("aria-hidden", "true");
  overflow.hidden = true;
  wordDisplay.append(overflow);
  updateTypingFeedback();
  announceGame();
}
function updateTypingFeedback() {
  const typed = Array.from(input.value);
  const target = Array.from(currentWord);
  let hasError = typed.length > target.length;
  wordDisplay.querySelectorAll(".word-character").forEach((span, index) => {
    const entered = index < typed.length;
    const correct = entered && typed[index] === target[index];
    const incorrect = entered && !correct;
    span.classList.toggle("correct", correct);
    span.classList.toggle("incorrect", incorrect);
    if (incorrect) hasError = true;
  });
  const overflow = wordDisplay.querySelector(".word-overflow");
  const extra = Math.max(0, typed.length - target.length);
  overflow.hidden = extra === 0;
  overflow.textContent = extra ? ` +${extra}` : "";
  input.setAttribute("aria-invalid", String(hasError));
}
function announceGame() {
  byId("game-status").textContent = `${stageForScore(score).label}. Skor ${score} kata. Nyawa ${hp}. Kata berikutnya: ${currentWord}.`;
}
function updateStage() {
  const challenging = score >= 10;
  byId("stage-label").textContent = stageForScore(score).label;
  byId("stage-hint").textContent = challenging
    ? "Lebih banyak frasa dua kata · Elang 25% lebih cepat!"
    : "Lebih banyak satu kata · Tantangan naik di skor 10";
  byId("stage-label").classList.toggle("challenge", challenging);
}
// Measure only when layout changes, never in the animation loop.
function measureLayout() {
  if (!running) return;
  const previousTravel = spawnPosition() - layout.playerEdge;
  const remaining = previousTravel > 0 ? Math.max(0, Math.min(1, (enemyX - layout.playerEdge) / previousTravel)) : 1;
  layout.width = document.documentElement.clientWidth;
  layout.enemyWidth = enemy.offsetWidth;
  layout.playerEdge = player.offsetLeft + player.offsetWidth * .65;
  layout.wordWidth = wordDisplay.offsetWidth;
  enemyX = layout.playerEdge + remaining * (spawnPosition() - layout.playerEdge);
  drawEnemy();
}
const layoutObserver = new ResizeObserver(measureLayout);
[document.documentElement, player, enemy, wordDisplay].forEach((element) => layoutObserver.observe(element));
// Mobile keyboards resize the visual viewport even when the layout viewport stays tall.
function updateViewport() {
  const viewport = window.visualViewport;
  if (viewport && viewport.scale !== 1) return;
  const height = viewport ? viewport.height : window.innerHeight;
  document.documentElement.style.setProperty("--play-height", `${height}px`);
  document.documentElement.style.setProperty("--play-top", `${viewport ? viewport.offsetTop : 0}px`);
  document.body.classList.toggle("compact-play", height <= 500);
  measureLayout();
}
window.visualViewport?.addEventListener("resize", updateViewport);
window.visualViewport?.addEventListener("scroll", updateViewport);
window.addEventListener("resize", updateViewport);
updateViewport();
function spawnPosition() {
  return layout.width - layout.enemyWidth - 16;
}
function drawEnemy() {
  const wordX = Math.max(8, Math.min(enemyX, layout.width - layout.wordWidth - 8));
  enemy.style.transform = `translateX(${enemyX}px)`;
  wordDisplay.style.transform = `translateX(${wordX}px)`;
}
function saveRecord() {
  if (score > bestScore) {
    bestScore = score;
    try { localStorage.setItem(recordKey, String(bestScore)); } catch { /* Keep the record for this session. */ }
    byId("best-score").textContent = bestScore;
  }
}
function showScreen(screen) {
  paused = false;
  if (pauseDialog.open) pauseDialog.close();
  document.body.classList.remove("paused");
  running = screen === "game-ui";
  ["menu", "game-ui", "result"].forEach((id) => { byId(id).hidden = id !== screen; });
  document.body.classList.toggle("playing", running);
  enemy.hidden = wordDisplay.hidden = !running;
  input.disabled = !running;
  composing = false;
  updateViewport();
  syncAudio();
}
function syncAudio() {
  correctSound.muted = backgroundMusic.muted = muted;
  document.querySelectorAll(".mute-toggle").forEach((button) => {
    button.textContent = muted ? "Aktifkan suara" : "Mute suara";
    button.setAttribute("aria-pressed", String(muted));
    button.setAttribute("aria-label", muted ? "Aktifkan BGM dan semua efek suara" : "Mute BGM dan semua efek suara");
  });
  if (muted || paused || !running || document.hidden) {
    backgroundMusic.pause();
    correctSound.pause();
    correctSound.currentTime = 0;
  } else {
    backgroundMusic.play().catch(() => { /* Retry on the next user interaction if autoplay is blocked. */ });
  }
}
function pauseGame() {
  if (!running || paused) return;
  paused = true;
  input.disabled = true;
  document.body.classList.add("paused");
  byId("pause-score").textContent = score;
  byId("pause-hp").textContent = hp;
  pauseDialog.showModal();
  byId("resume-button").focus();
  byId("game-status").textContent = "Permainan dijeda.";
  syncAudio();
}
function resumeGame() {
  if (!running || !paused || document.hidden) return;
  paused = false;
  pauseDialog.close();
  document.body.classList.remove("paused");
  input.disabled = false;
  lastTime = 0;
  syncAudio();
  announceGame();
  input.focus({ preventScroll: true });
}
function startGame() {
  score = 0;
  hp = 3;
  byId("score").textContent = score;
  byId("hp").textContent = hp;
  updateStage();
  showScreen("game-ui");
  newWord();
  measureLayout();
  enemyX = spawnPosition();
  drawEnemy();
  lastTime = 0;
  input.focus({ preventScroll: true });
}
function returnToMenu() {
  saveRecord();
  showScreen("menu");
  byId("game-status").textContent = "";
  byId("start-button").focus();
}
function endGame() {
  const isRecord = score > bestScore;
  saveRecord();
  byId("final-score").textContent = score;
  byId("result-message").textContent = isRecord ? "Rekor pribadi baru! Hebat, lanjutkan!" : `Rekor pribadi: ${bestScore} kata. Coba tantang lagi!`;
  showScreen("result");
  byId("game-status").textContent = `Permainan selesai. Skor ${score} kata. ${byId("result-message").textContent}`;
  byId("retry-button").focus();
}
function handleTyping(event) {
  if (!running || paused) return;
  updateTypingFeedback();
  if (composing || event?.isComposing) return;
  if (input.value !== currentWord) return;
  if (!muted) {
    correctSound.currentTime = 0;
    correctSound.play().catch(() => {});
  }
  score++;
  byId("score").textContent = score;
  if (score === 10) updateStage();
  enemyX = Math.min(spawnPosition(), enemyX + layout.width * .15);
  newWord();
  drawEnemy();
}
input.addEventListener("compositionstart", () => { composing = true; });
input.addEventListener("compositionend", () => {
  composing = false;
  handleTyping();
});
input.addEventListener("input", handleTyping);
byId("start-button").addEventListener("click", startGame);
byId("retry-button").addEventListener("click", startGame);
byId("menu-button").addEventListener("click", returnToMenu);
byId("home-button").addEventListener("click", returnToMenu);
byId("pause-button").addEventListener("click", pauseGame);
byId("resume-button").addEventListener("click", resumeGame);
byId("pause-home-button").addEventListener("click", returnToMenu);
pauseDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  resumeGame();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && running && !paused) {
    event.preventDefault();
    pauseGame();
  }
});
document.querySelectorAll(".mute-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    muted = !muted;
    try { localStorage.setItem("typing-battle-muted", String(muted)); } catch { /* Session-only setting. */ }
    syncAudio();
    if (running && !paused) input.focus({ preventScroll: true });
  });
});
syncAudio();
function updateSprites() {
  const enemyFrame = `assets/${!animationsEnabled ? "enemy1.png" : Math.floor(animationTime * 4) % 2 ? "enemy1.png" : "enemy2.png"}`;
  const playerFrame = `assets/${!animationsEnabled ? "Karakter2.png" : Math.floor(animationTime * 3) % 2 ? "Karakter1.png" : "Karakter2.png"}`;
  if (enemy.getAttribute("src") !== enemyFrame) enemy.src = enemyFrame;
  if (player.getAttribute("src") !== playerFrame) player.src = playerFrame;
}
function syncMotion() {
  document.body.classList.toggle("animations-enabled", animationsEnabled);
  document.querySelectorAll(".motion-toggle").forEach((button) => {
    button.textContent = `Animasi: ${animationsEnabled ? "aktif" : "nonaktif"}`;
    button.setAttribute("aria-pressed", String(animationsEnabled));
  });
  updateSprites();
}
document.querySelectorAll(".motion-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    animationsEnabled = !animationsEnabled;
    syncMotion();
    if (running && !paused) input.focus({ preventScroll: true });
  });
});
syncMotion();
document.addEventListener("visibilitychange", () => {
  lastTime = 0;
  if (document.hidden) pauseGame();
  syncAudio();
});
function tick(time) {
  const delta = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0;
  lastTime = time;
  if (!document.hidden && !paused) {
    if (animationsEnabled) animationTime += delta;
    updateSprites();
  }
  if (running && !paused && !document.hidden) {
    enemyX -= layout.width * stageForScore(score).speed * delta;
    if (enemyX <= layout.playerEdge) {
      hp--;
      byId("hp").textContent = hp;
      if (hp <= 0) endGame();
      else {
        enemyX = spawnPosition();
        newWord();
      }
    }
    if (running) drawEnemy();
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
