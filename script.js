let audioContext = null;
let isMuted = false;
let currentLevel = 0;
let bestTime = 0;
let levelScores = [];
let unlockedLevels = [];

let gameState = {
isRunning: false,
player: null,
ghosts: [],
obstacles: [],
recording: [],
keys: {},
startTime: 0,
lastGhostTime: 0,
config: null,
gameArea: null,
animationId: null
};

let levels = [
{ name: "Level 1: First Echo", description: "Learn the basics", loopInterval: 10000, playerSpeed: 3, obstacles: [] },
{ name: "Level 2: Speed Runner", description: "Move faster!", loopInterval: 9000, playerSpeed: 4.2, obstacles: [] },
{ name: "Level 3: Barrier Maze", description: "Moving walls appear", loopInterval: 8500, playerSpeed: 3.2, obstacles: [
    { x: 200, y: 100, width: 20, height: 140, vx: 2, vy: 0 },
    { x: 450, y: 300, width: 20, height: 140, vx: -2, vy: 0 }
]},
{ name: "Level 4: Rapid Echo", description: "Ghosts every 7s", loopInterval: 7000, playerSpeed: 3.3, obstacles: [] },
{ name: "Level 5: Cross Fire", description: "Walls from all sides", loopInterval: 7500, playerSpeed: 3.6, obstacles: [
    { x: 0, y: 150, width: 240, height: 18, vx: 2.2, vy: 0 },
    { x: 460, y: 330, width: 240, height: 18, vx: -2.2, vy: 0 },
    { x: 200, y: 0, width: 18, height: 190, vx: 0, vy: 2.2 },
    { x: 480, y: 310, width: 18, height: 190, vx: 0, vy: -2.2 }
]},
{ name: "Level 6: Double Trouble", description: "Fast spawn + walls", loopInterval: 6000, playerSpeed: 3.7, obstacles: [
    { x: 150, y: 100, width: 18, height: 110, vx: 2.8, vy: 1.6 },
    { x: 500, y: 350, width: 18, height: 110, vx: -2.8, vy: -1.6 }
]},
{ name: "Level 7: Bullet Speed", description: "Super fast!", loopInterval: 5500, playerSpeed: 5.2, obstacles: [] },
{ name: "Level 8: Crusher", description: "Walls crush you", loopInterval: 6000, playerSpeed: 4.1, obstacles: [
    { x: 100, y: 70, width: 500, height: 18, vx: 0, vy: 2.3 },
    { x: 100, y: 412, width: 500, height: 18, vx: 0, vy: -2.3 }
]},
{ name: "Level 9: Ghost Storm", description: "Ghosts every 4s", loopInterval: 4000, playerSpeed: 4.3, obstacles: [
    { x: 100, y: 50, width: 14, height: 95, vx: 3.2, vy: 2.1 },
    { x: 550, y: 355, width: 14, height: 95, vx: -3.2, vy: -2.1 },
    { x: 330, y: 200, width: 75, height: 14, vx: 0, vy: 2.7 }
]},
{ name: "Level 10: CHAOS", description: "Ultimate challenge!", loopInterval: 3500, playerSpeed: 4.6, obstacles: [
    { x: 95, y: 75, width: 16, height: 115, vx: 3.7, vy: 2.2 },
    { x: 555, y: 355, width: 16, height: 115, vx: -3.7, vy: -2.2 },
    { x: 295, y: 175, width: 95, height: 16, vx: 0, vy: 2.8 },
    { x: 195, y: 295, width: 16, height: 75, vx: 2.3, vy: -2.3 }
]}
];

let soundConfigs = {
click: { freq: 800, gain: 0.08, duration: 0.08 },
ghost: { freq: 380, gain: 0.18, duration: 0.28 },
collision: { freq: 90, gain: 0.28, duration: 0.45 },
start: { freq: 580, gain: 0.18, duration: 0.18 },
unlock: { freq: 1000, gain: 0.15, duration: 0.3 }
};

function loadFromStorage() {
let savedScores = localStorage.getItem("ghostEchoScores");
let savedUnlocked = localStorage.getItem("ghostEchoUnlocked");
let savedBest = localStorage.getItem("ghostEchoBestTime");
let savedMuted = localStorage.getItem("ghostEchoMuted");
let savedTheme = localStorage.getItem("ghostEchoTheme");

if (savedScores) {
    levelScores = JSON.parse(savedScores);
} else {
    levelScores = [];
    for (let i = 0; i < levels.length; i++) {
        levelScores.push(0);
    }
}

if (savedUnlocked) {
    unlockedLevels = JSON.parse(savedUnlocked);
} else {
    unlockedLevels = [true];
    for (let j = 1; j < levels.length; j++) {
        unlockedLevels.push(false);
    }
}

if (savedBest) {
    bestTime = parseFloat(savedBest);
}

if (savedMuted) {
    isMuted = savedMuted === "true";
}

if (savedTheme === "light") {
    document.body.classList.add("light-mode");
}
}

function saveToStorage() {
localStorage.setItem("ghostEchoScores", JSON.stringify(levelScores));
localStorage.setItem("ghostEchoUnlocked", JSON.stringify(unlockedLevels));
localStorage.setItem("ghostEchoBestTime", String(bestTime));
localStorage.setItem("ghostEchoMuted", String(isMuted));
let theme = document.body.classList.contains("light-mode") ? "light" : "dark";
localStorage.setItem("ghostEchoTheme", theme);
}

function isLevelUnlocked(index) {
if (index === 0) return true;
return unlockedLevels[index] === true;
}

function unlockNextLevel(currentIdx) {
if (currentIdx < levels.length - 1) {
    if (!unlockedLevels[currentIdx + 1]) {
        unlockedLevels[currentIdx + 1] = true;
        saveToStorage();
        return true;
    }
}
return false;
}

function initAudio() {
if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}
}

function playSound(type) {
if (isMuted || !audioContext) return;
let osc = audioContext.createOscillator();
let gain = audioContext.createGain();
osc.connect(gain);
gain.connect(audioContext.destination);
let cfg = soundConfigs[type];
if (cfg) {
    osc.frequency.value = cfg.freq;
    gain.gain.setValueAtTime(cfg.gain, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + cfg.duration);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + cfg.duration);
}
}

function getElement(id) {
return document.getElementById(id);
}

function showScreen(screenId) {
let screens = ["menuScreen", "gameScreen", "gameoverScreen"];
for (let i = 0; i < screens.length; i++) {
    let el = getElement(screens[i]);
    if (screens[i] === screenId) {
        el.classList.remove("hidden");
    } else {
        el.classList.add("hidden");
    }
}
}

function renderSidebar() {
let container = getElement("sidebarScores");
let html = "";
for (let i = 0; i < levels.length; i++) {
    let level = levels[i];
    let score = levelScores[i];
    let unlocked = isLevelUnlocked(i);
    let statusClass = unlocked ? "status-unlocked" : "status-locked";
    let statusText = unlocked ? "Unlocked" : "Locked";
    let scoreText = score > 0 ? score.toFixed(1) + "s" : "No score";
    let scoreClass = score > 0 ? "" : "no-score";

    html = html + '<div class="sidebar-item">';
    html = html + '<div class="sidebar-item-header">';
    html = html + '<span class="sidebar-item-level">Level ' + (i + 1) + '</span>';
    html = html + '<span class="sidebar-item-status ' + statusClass + '">' + statusText + '</span>';
    html = html + '</div>';
    html = html + '<div class="sidebar-item-score ' + scoreClass + '">' + scoreText + '</div>';
    html = html + '</div>';
}
container.innerHTML = html;
}

function renderLevels() {
let grid = getElement("levelsGrid");
let html = levels.map(function(level, i) {
    let unlocked = isLevelUnlocked(i);
    let score = levelScores[i];
    let cardClass = unlocked ? "level-card" : "level-card locked";
    let bestText = score > 0 ? "🏆 Best: " + score.toFixed(1) + "s" : "No attempts yet";
    let lockOverlay = unlocked ? "" : '<div class="lock-overlay">🔒</div>';
    let btnDisabled = unlocked ? "" : "disabled";

    return '<div class="' + cardClass + '" data-level="' + i + '">' +
        lockOverlay +
        '<div class="level-header">' +
        '<div class="level-title">' + level.name + '</div>' +
        '<div class="level-number">' + (i + 1) + '</div>' +
        '</div>' +
        '<div class="level-description">' + level.description + '</div>' +
        '<div class="level-best">' + bestText + '</div>' +
        '<button class="play-button" ' + btnDisabled + '>▶ Play</button>' +
        '</div>';
});

grid.innerHTML = html.join("");

let cards = grid.children;
for (let j = 0; j < cards.length; j++) {
    cards[j].onclick = function() {
        let levelIdx = parseInt(this.getAttribute("data-level"));
        if (isLevelUnlocked(levelIdx)) {
            playSound("click");
            startGame(levelIdx);
        }
    };
}
}

function updateBestTime() {
let el = getElement("bestTimeDisplay");
if (bestTime > 0) {
    el.innerHTML = '🏆 Overall Best: <span style="color:#fff;font-weight:bold;">' + bestTime.toFixed(1) + 's</span>';
} else {
    el.innerHTML = "";
}
}

function showMenu() {
playSound("click");
showScreen("menuScreen");
stopGame();
renderLevels();
renderSidebar();
}

function showGameOver(time) {
playSound("collision");
showScreen("gameoverScreen");
getElement("finalTime").textContent = time.toFixed(1) + "s";

let newRec = getElement("newRecord");
let levelUnlockedEl = getElement("levelUnlocked");
let prevBest = levelScores[currentLevel];
let isNewRecord = time > prevBest;
let didUnlock = false;

if (isNewRecord) {
    levelScores[currentLevel] = time;
    newRec.classList.remove("hidden");

    if (prevBest > 0 && time > prevBest) {
        didUnlock = unlockNextLevel(currentLevel);
    } else if (prevBest === 0) {
        didUnlock = unlockNextLevel(currentLevel);
    }
} else {
    newRec.classList.add("hidden");
}

if (didUnlock) {
    levelUnlockedEl.classList.remove("hidden");
    playSound("unlock");
} else {
    levelUnlockedEl.classList.add("hidden");
}

if (time > bestTime) {
    bestTime = time;
    updateBestTime();
}

saveToStorage();
renderSidebar();

let btns = '<button class="gameover-btn retry-btn" id="retryBtn">🔄 Retry</button>';
let nextUnlocked = currentLevel < levels.length - 1 && isLevelUnlocked(currentLevel + 1);
if (currentLevel < levels.length - 1) {
    let nextDisabled = nextUnlocked ? "" : "disabled";
    btns = btns + '<button class="gameover-btn next-btn" id="nextBtn" ' + nextDisabled + '>Next</button>';
}
btns = btns + '<button class="gameover-btn menu-btn-gameover" id="menuBtn">Menu</button>';

getElement("gameoverButtons").innerHTML = btns;

getElement("retryBtn").onclick = function() {
    playSound("click");
    startGame(currentLevel);
};

if (currentLevel < levels.length - 1 && nextUnlocked) {
    getElement("nextBtn").onclick = function() {
        playSound("click");
        startGame(currentLevel + 1);
    };
}

getElement("menuBtn").onclick = showMenu;
}

function startGame(idx) {
initAudio();
playSound("start");
currentLevel = idx;
getElement("levelDisplay").textContent = String(idx + 1);
getElement("ghostCount").textContent = "0";

let currentBestScore = levelScores[idx];
getElement("currentBest").textContent = currentBestScore > 0 ? currentBestScore.toFixed(1) + "s" : "-";

showScreen("gameScreen");
initGame(levels[idx]);
}

function initGame(cfg) {
gameState.config = cfg;
gameState.gameArea = getElement("gameArea");
gameState.gameArea.innerHTML = "";

let playerEl = createEl("player");
gameState.player = { x: 350, y: 250, size: 16, element: playerEl, vx: 0, vy: 0 };

gameState.ghosts = [];
gameState.recording = [];
gameState.keys = {};
gameState.isRunning = true;
gameState.startTime = Date.now();
gameState.lastGhostTime = Date.now();

gameState.obstacles = [];
for (let i = 0; i < cfg.obstacles.length; i++) {
    let o = cfg.obstacles[i];
    let el = createEl("obstacle");
    el.style.width = o.width + "px";
    el.style.height = o.height + "px";
    gameState.obstacles.push({
        x: o.x,
        y: o.y,
        width: o.width,
        height: o.height,
        vx: o.vx,
        vy: o.vy,
        element: el
    });
}

updatePos(gameState.player);
gameLoop();
}

function createEl(cls) {
let el = document.createElement("div");
el.className = cls;
gameState.gameArea.appendChild(el);
return el;
}

function updatePos(obj) {
obj.element.style.left = (obj.x - obj.size / 2) + "px";
obj.element.style.top = (obj.y - obj.size / 2) + "px";
}

document.addEventListener("keydown", function(e) {
let key = e.key.toLowerCase();
let validKeys = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"];
if (validKeys.indexOf(key) !== -1) {
    e.preventDefault();
    gameState.keys[key] = true;
}
});

document.addEventListener("keyup", function(e) {
let key = e.key.toLowerCase();
gameState.keys[key] = false;
});

function gameLoop() {
if (!gameState.isRunning) return;

let now = Date.now();
let time = (now - gameState.startTime) / 1000;
getElement("timeDisplay").textContent = time.toFixed(1) + "s";

let p = gameState.player;
let spd = gameState.config.playerSpeed;

p.vx = 0;
p.vy = 0;

if (gameState.keys.arrowup || gameState.keys.w) p.vy = -spd;
if (gameState.keys.arrowdown || gameState.keys.s) p.vy = spd;
if (gameState.keys.arrowleft || gameState.keys.a) p.vx = -spd;
if (gameState.keys.arrowright || gameState.keys.d) p.vx = spd;

p.x = p.x + p.vx;
p.y = p.y + p.vy;

let half = p.size / 2;
if (p.x < half) p.x = half;
if (p.x > 700 - half) p.x = 700 - half;
if (p.y < half) p.y = half;
if (p.y > 500 - half) p.y = 500 - half;

updatePos(p);
gameState.recording.push({ x: p.x, y: p.y });

if (now - gameState.lastGhostTime >= gameState.config.loopInterval && gameState.recording.length > 10) {
    let gEl = createEl("ghost");
    let recCopy = gameState.recording.slice();
    gameState.ghosts.push({
        recording: recCopy,
        playbackIndex: 0,
        x: recCopy[0].x,
        y: recCopy[0].y,
        size: 16,
        element: gEl
    });
    getElement("ghostCount").textContent = String(gameState.ghosts.length);
    gameState.recording = [];
    gameState.lastGhostTime = now;
    playSound("ghost");
}

for (let i = 0; i < gameState.ghosts.length; i++) {
    let g = gameState.ghosts[i];
    if (g.playbackIndex < g.recording.length) {
        let pos = g.recording[g.playbackIndex];
        g.x = pos.x;
        g.y = pos.y;
        g.playbackIndex = g.playbackIndex + 1;
    } else {
        g.playbackIndex = 0;
    }
    updatePos(g);
}

for (let j = 0; j < gameState.obstacles.length; j++) {
    let o = gameState.obstacles[j];
    o.x = o.x + o.vx;
    o.y = o.y + o.vy;
    if (o.x < 0 || o.x + o.width > 700) {
        o.vx = o.vx * -1;
        if (o.x < 0) o.x = 0;
        if (o.x + o.width > 700) o.x = 700 - o.width;
    }
    if (o.y < 0 || o.y + o.height > 500) {
        o.vy = o.vy * -1;
        if (o.y < 0) o.y = 0;
        if (o.y + o.height > 500) o.y = 500 - o.height;
    }
    o.element.style.left = o.x + "px";
    o.element.style.top = o.y + "px";
}

let hitGhosts = gameState.ghosts.filter(function(g) {
    let dx = p.x - g.x;
    let dy = p.y - g.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    return dist < p.size;
});

let hitObs = gameState.obstacles.reduce(function(hit, o) {
    if (hit) return true;let collided = p.x + half > o.x && p.x - half < o.x + o.width &&
                    p.y + half > o.y && p.y - half < o.y + o.height;
    return collided;
}, false);

if (hitGhosts.length > 0 || hitObs) {
    stopGame();
    showGameOver(time);
    return;
}

gameState.animationId = window.requestAnimationFrame(gameLoop);
}

function stopGame() {
gameState.isRunning = false;
if (gameState.animationId) {
    window.cancelAnimationFrame(gameState.animationId);
}
}

document.addEventListener("DOMContentLoaded", function() {
loadFromStorage();
renderLevels();
renderSidebar();
updateBestTime();

getElement("soundBtn").textContent = isMuted ? "🔇" : "🔊";

getElement("themeBtn").onclick = function() {
    initAudio();
    playSound("click");
    document.body.classList.toggle("light-mode");
    saveToStorage();
};

getElement("soundBtn").onclick = function() {
    initAudio();
    isMuted = !isMuted;
    getElement("soundBtn").textContent = isMuted ? "🔇" : "🔊";
    saveToStorage();
    if (!isMuted) playSound("click");
};

getElement("backBtn").onclick = showMenu;
});
