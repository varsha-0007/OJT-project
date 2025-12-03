var audioContext;
var isMuted = false;
var currentLevel = 0;
var bestTime = 0;

var gameState = {
    isRunning:false, palyer:null, ghosts:[], obstacles:[], recording:[],keys:{}, startTime: 0, lastGhostTime: 0, config: null, gameArea: null, animatedId: null
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

var soundConfigs = {
    click:{freq:800, gain:0.08, duration:0.08},
    ghost:{freq:380, gain:0.18, duration:0.28},
    collision:{freq:90, gain:0.28, duration:0.45},
    start:{freq:580, gain:0.18, duration:0.18}
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