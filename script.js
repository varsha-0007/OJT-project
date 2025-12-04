var audioContext=false;
var isMuted = false;
var currentLevel = 0;
var bestTime = 0;

var gameState = {
    isRunning: false, player: null, ghosts: [], obstacles: [], recording: [],
    keys: {}, startTime: 0, lastGhostTime: 0, config: null, gameArea: null, animationId: null
};

var levels = [
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
];

var soundConfigs = {
    click: { freq: 800, gain: 0.08, duration: 0.08 },
    ghost: { freq: 380, gain: 0.18, duration: 0.28 },
    collision: { freq: 90, gain: 0.28, duration: 0.45 },
    start: { freq: 580, gain: 0.18, duration: 0.18 }
};

function initAudio() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(type) {
    if (isMuted || !audioContext) return;
    var osc = audioContext.createOscillator(), gain = audioContext.createGain();
    osc.connect(gain); gain.connect(audioContext.destination);
    var cfg = soundConfigs[type];
    if (cfg) {
        osc.frequency.value = cfg.freq;
        gain.gain.setValueAtTime(cfg.gain, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + cfg.duration);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + cfg.duration);
    }
}

function getElement(id) { return document.getElementById(id); }

function showScreen(screenId) {
    ['menuScreen', 'gameScreen', 'gameoverScreen'].forEach(function(s) {
        getElement(s).classList[s === screenId ? 'remove' : 'add']('hidden');
    });
}

function renderLevels() {
    var grid = getElement('levelsGrid');
    grid.innerHTML = '';
    levels.forEach(function(level, i) {
        var card = document.createElement('div');
        card.className = 'level-card';
        card.innerHTML = '<div class="level-header"><div class="level-title">' + level.name +
            '</div><div class="level-number">' + (i + 1) + '</div></div><div class="level-description">' +
            level.description + '</div><button class="play-button">▶ Play</button>';
        card.addEventListener('click', function() { playSound('click'); startGame(i); });
        grid.appendChild(card);
    });
}

function updateBestTime() {
    getElement('bestTimeDisplay').innerHTML = bestTime > 0 ? 
        '🏆 Best: <span style="color:#fff;font-weight:bold;">' + bestTime.toFixed(1) + 's</span>' : '';
}

function showMenu() {
    playSound('click'); showScreen('menuScreen'); stopGame();
}

function showGameOver(time) {
    playSound('collision'); showScreen('gameoverScreen');
    getElement('finalTime').textContent = time.toFixed(1) + 's';
    var newRec = getElement('newRecord');
    if (time > bestTime) { bestTime = time; newRec.classList.remove('hidden'); updateBestTime(); }
    else newRec.classList.add('hidden');
    var btns = '<button class="gameover-btn retry-btn" id="retryBtn">🔄 Retry</button>';
    if (currentLevel < levels.length - 1) btns += '<button class="gameover-btn next-btn" id="nextBtn">Next</button>';
    btns += '<button class="gameover-btn menu-btn-gameover" id="menuBtn">Menu</button>';
    getElement('gameoverButtons').innerHTML = btns;
    getElement('retryBtn').addEventListener('click', function() { playSound('click'); startGame(currentLevel); });
    if (currentLevel < levels.length - 1) 
        getElement('nextBtn').addEventListener('click', function() { playSound('click'); startGame(currentLevel + 1); });
    getElement('menuBtn').addEventListener('click', showMenu);
}

function startGame(idx) {
    initAudio(); playSound('start'); currentLevel = idx;
    getElement('levelDisplay').textContent = idx + 1;
    getElement('ghostCount').textContent = '0';
    showScreen('gameScreen'); initGame(levels[idx]);
}

function initGame(cfg) {
    gameState.config = cfg;
    gameState.gameArea = getElement('gameArea');
    gameState.gameArea.innerHTML = '';
    gameState.player = { x: 350, y: 250, size: 16, element: createEl('player') };
    gameState.ghosts = []; gameState.recording = []; gameState.keys = {};
    gameState.isRunning = true; gameState.startTime = Date.now(); gameState.lastGhostTime = Date.now();
    gameState.obstacles = cfg.obstacles.map(function(o) {
        var el = createEl('obstacle');
        el.style.width = o.width + 'px'; el.style.height = o.height + 'px';
        return { x: o.x, y: o.y, width: o.width, height: o.height, vx: o.vx, vy: o.vy, element: el };
    });
    updatePos(gameState.player); gameLoop();
}

function createEl(cls) {
    var el = document.createElement('div');
    el.className = cls; gameState.gameArea.appendChild(el);
    return el;
}

function updatePos(obj) {
    obj.element.style.left = (obj.x - obj.size / 2) + 'px';
    obj.element.style.top = (obj.y - obj.size / 2) + 'px';
}

document.addEventListener('keydown', function(e) {
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].indexOf(e.key.toLowerCase()) !== -1) {
        e.preventDefault(); gameState.keys[e.key.toLowerCase()] = true;
    }
});
document.addEventListener('keyup', function(e) { gameState.keys[e.key.toLowerCase()] = false; });

function gameLoop() {
    if (!gameState.isRunning) return;
    var now = Date.now(), time = (now - gameState.startTime) / 1000;
    getElement('timeDisplay').textContent = time.toFixed(1) + 's';
    var p = gameState.player, spd = gameState.config.playerSpeed;
    p.vx = 0; p.vy = 0;
    if (gameState.keys.arrowup || gameState.keys.w) p.vy = -spd;
    if (gameState.keys.arrowdown || gameState.keys.s) p.vy = spd;
    if (gameState.keys.arrowleft || gameState.keys.a) p.vx = -spd;
    if (gameState.keys.arrowright || gameState.keys.d) p.vx = spd;
    p.x += p.vx; p.y += p.vy;
    var half = p.size / 2;
    p.x = Math.max(half, Math.min(p.x, 700 - half));
    p.y = Math.max(half, Math.min(p.y, 500 - half));
    updatePos(p); gameState.recording.push({ x: p.x, y: p.y });
    if (now - gameState.lastGhostTime >= gameState.config.loopInterval && gameState.recording.length > 10) {
        var gEl = createEl('ghost');
        gameState.ghosts.push({
            recording: gameState.recording.slice(), playbackIndex: 0,
            x: gameState.recording[0].x, y: gameState.recording[0].y, size: 16, element: gEl
        });
        getElement('ghostCount').textContent = gameState.ghosts.length;
        gameState.recording = []; gameState.lastGhostTime = now; playSound('ghost');
    }
    gameState.ghosts.forEach(function(g) {
        if (g.playbackIndex < g.recording.length) {
            var pos = g.recording[g.playbackIndex];
            g.x = pos.x; g.y = pos.y; g.playbackIndex++;
        } else g.playbackIndex = 0;
        updatePos(g);
    });
    gameState.obstacles.forEach(function(o) {
        o.x += o.vx; o.y += o.vy;
        if (o.x < 0 || o.x + o.width > 700) { o.vx *= -1; o.x = Math.max(0, Math.min(o.x, 700 - o.width)); }
        if (o.y < 0 || o.y + o.height > 500) { o.vy *= -1; o.y = Math.max(0, Math.min(o.y, 500 - o.height)); }
        o.element.style.left = o.x + 'px'; o.element.style.top = o.y + 'px';
    });
    var hit = gameState.ghosts.some(function(g) {
        return Math.sqrt(Math.pow(p.x - g.x, 2) + Math.pow(p.y - g.y, 2)) < p.size;
    }) || gameState.obstacles.some(function(o) {
        return p.x + half > o.x && p.x - half < o.x + o.width &&
                p.y + half > o.y && p.y - half < o.y + o.height;
    });
    if (hit) { stopGame(); showGameOver(time); return; }
    gameState.animationId = requestAnimationFrame(gameLoop);
}

function stopGame() {
    gameState.isRunning = false;
    if (gameState.animationId) cancelAnimationFrame(gameState.animationId);
}

document.addEventListener('DOMContentLoaded', function() {
    renderLevels(); updateBestTime();
    getElement('themeBtn').addEventListener('click', function() {
        initAudio(); playSound('click'); document.body.classList.toggle('light-mode');
    });
    getElement('soundBtn').addEventListener('click', function() {
        initAudio(); isMuted = !isMuted;
        getElement('soundBtn').textContent = isMuted ? '🔇' : '🔊';
        if (!isMuted) playSound('click');
    });
    getElement('backBtn').addEventListener('click', showMenu);
});