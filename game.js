const COLORS = [
    '#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF', '#00FFFF', 
    '#FFA500', '#800080', '#A52A2A', '#FFFFFF', '#FFC0CB', '#808080'
];

let currentLevelIndex = 0;
let tubes = [];
let selectedTubeIndex = null;
let moveHistory = [];
let undosRemaining = 5;
let extraTubesRemaining = 2;

// Save Data
let maxUnlockedLevel = 1; 
let coins = 0;
let levelsPlayed = 0;
let ownedThemes = ['default'];
let currentTheme = 'default';

// Settings
let soundEnabled = true;
let vibrationEnabled = true;

// PWA Setup
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .catch(err => console.log('Service Worker failed:', err));
    });
}

function generateLevel(levelNum) {
    let numColors = Math.min(2 + Math.floor(levelNum / 1.5), 10); 
    let numBalls = 4; 
    
    let balls = [];
    for (let i = 0; i < numColors; i++) {
        for (let j = 0; j < numBalls; j++) {
            balls.push({ color: COLORS[i % COLORS.length], revealed: false });
        }
    }
    
    for (let i = balls.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [balls[i], balls[j]] = [balls[j], balls[i]];
    }
    
    let levelTubes = [];
    for (let i = 0; i < numColors; i++) {
        let tube = [];
        for (let j = 0; j < numBalls; j++) {
            tube.push(balls.pop());
        }
        levelTubes.push(tube);
    }
    
    levelTubes.push([]);
    levelTubes.push([]);
    return levelTubes;
}

function loadSaveData() {
    const savedLevel = localStorage.getItem('galaxy_flow_max_level');
    const savedCoins = localStorage.getItem('galaxy_flow_coins');
    const savedTheme = localStorage.getItem('galaxy_flow_theme');
    const savedThemes = localStorage.getItem('galaxy_flow_owned_themes');
    const savedSound = localStorage.getItem('galaxy_flow_sound');
    const savedVibe = localStorage.getItem('galaxy_flow_vibe');
    
    if (savedLevel) maxUnlockedLevel = parseInt(savedLevel);
    if (savedCoins) coins = parseInt(savedCoins);
    if (savedTheme) currentTheme = savedTheme;
    if (savedThemes) ownedThemes = JSON.parse(savedThemes);
    if (savedSound !== null) soundEnabled = savedSound === 'true';
    if (savedVibe !== null) vibrationEnabled = savedVibe === 'true';
    
    applyTheme();
    updateSettingsUI();
    document.getElementById('coin-count').innerText = coins;
}

function saveProgress() {
    localStorage.setItem('galaxy_flow_max_level', maxUnlockedLevel);
    localStorage.setItem('galaxy_flow_coins', coins);
    localStorage.setItem('galaxy_flow_theme', currentTheme);
    localStorage.setItem('galaxy_flow_owned_themes', JSON.stringify(ownedThemes));
    localStorage.setItem('galaxy_flow_sound', soundEnabled);
    localStorage.setItem('galaxy_flow_vibe', vibrationEnabled);
}

function loadLevel(levelIndex) {
    if (levelIndex >= maxUnlockedLevel && levelIndex > 0) {
        alert("You need to finish the previous level first!");
        return;
    }

    currentLevelIndex = levelIndex;
    tubes = generateLevel(levelIndex + 1);
    
    if (levelIndex < 9) {
        tubes.forEach(tube => tube.forEach(ball => ball.revealed = true));
    }
    
    selectedTubeIndex = null;
    moveHistory = [];
    undosRemaining = 5;
    extraTubesRemaining = 2;
    
    document.getElementById('level-display').innerText = levelIndex + 1;
    document.getElementById('win-screen').style.display = 'none';
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('out-of-tools-modal').style.display = 'none';
    
    updateControlUI();
    render();
}

function restartLevel() { loadLevel(currentLevelIndex); }

function nextLevel() {
    if (currentLevelIndex + 1 < 100) { 
        if (currentLevelIndex + 2 > maxUnlockedLevel) {
            maxUnlockedLevel = currentLevelIndex + 2;
            saveProgress();
        }
        
        levelsPlayed++;
        if (levelsPlayed % 3 === 0) {
            showFakeAd(3, 'Interstitial', () => loadLevel(currentLevelIndex + 1));
        } else {
            loadLevel(currentLevelIndex + 1);
        }
    } else {
        alert("You finished all 100 levels! You are a Ball Sort Master!");
    }
}

function updateControlUI() {
    document.getElementById('undo-count').innerText = undosRemaining;
    document.getElementById('add-tube-count').innerText = extraTubesRemaining;
    document.getElementById('coin-count').innerText = coins;
}

function render() {
    const container = document.getElementById('game-container');
    container.innerHTML = ''; 

    tubes.forEach((tube, index) => {
        const tubeDiv = document.createElement('div');
        tubeDiv.className = 'tube';
        
        if (selectedTubeIndex === index) {
            tubeDiv.style.borderColor = '#00FF00';
            tubeDiv.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
        }

        tubeDiv.onclick = () => handleTubeClick(index);

        tube.forEach((ballObj, ballIndex) => {
            const ballDiv = document.createElement('div');
            ballDiv.className = 'ball';
            
            if (ballIndex === tube.length - 1) ballObj.revealed = true;

            if (ballObj.revealed) {
                ballDiv.style.backgroundColor = ballObj.color;
            } else {
                ballDiv.classList.add('hidden-ball');
                ballDiv.innerText = '?';
            }
            
            tubeDiv.appendChild(ballDiv);
        });
        container.appendChild(tubeDiv);
    });
}

function handleTubeClick(index) {
    if (vibrationEnabled && navigator.vibrate) navigator.vibrate(20);

    if (selectedTubeIndex === null) {
        if (tubes[index].length > 0) {
            selectedTubeIndex = index;
            render(); 
        }
    } else {
        const fromTube = tubes[selectedTubeIndex];
        const toTube = tubes[index];

        if (selectedTubeIndex === index) {
            selectedTubeIndex = null; render(); return;
        }

        const topBall = fromTube[fromTube.length - 1];
        const topColor = topBall.color;
        let count = 0;
        for (let i = fromTube.length - 1; i >= 0; i--) {
            if (fromTube[i].color === topColor) count++; else break;
        }

        const spaceAvailable = 4 - toTube.length;
        const toMove = Math.min(count, spaceAvailable);
        const topTargetBall = toTube.length > 0 ? toTube[toTube.length - 1] : null;
        const topTargetColor = topTargetBall ? topTargetBall.color : null;
        
        if (toMove > 0 && (toTube.length === 0 || topColor === topTargetColor)) {
            moveHistory.push({ from: selectedTubeIndex, to: index, count: toMove });
            for (let i = 0; i < toMove; i++) {
                let ballObj = fromTube.pop();
                ballObj.revealed = true; 
                toTube.push(ballObj);
            }
        }

        selectedTubeIndex = null;
        render();
        checkWinCondition();
    }
}

function undoMove() {
    if (undosRemaining <= 0) {
        document.getElementById('out-of-tools-modal').style.display = 'flex';
        document.getElementById('modal-title').innerText = "Out of Undos! 😢";
        document.getElementById('modal-desc').innerText = "Watch a short ad to get +3 Undos?";
        document.querySelector('.ad-btn').onclick = watchAdForUndos;
        return;
    }
    if (moveHistory.length === 0) return;
    
    const lastMove = moveHistory.pop();
    const fromTube = tubes[lastMove.to]; 
    const toTube = tubes[lastMove.from]; 
    
    for (let i = 0; i < lastMove.count; i++) {
        let ballObj = fromTube.pop();
        toTube.push(ballObj);
    }
    
    undosRemaining--;
    updateControlUI();
    selectedTubeIndex = null;
    render();
}

function addTube() {
    if (extraTubesRemaining <= 0) {
        document.getElementById('out-of-tools-modal').style.display = 'flex';
        document.getElementById('modal-title').innerText = "Out of Tubes! 😢";
        document.getElementById('modal-desc').innerText = "Watch a short ad to get +1 Tube?";
        document.querySelector('.ad-btn').onclick = watchAdForTubes;
        return;
    }
    tubes.push([]); 
    extraTubesRemaining--;
    updateControlUI();
    render();
}

function checkWinCondition() {
    for (let i = 0; i < tubes.length; i++) {
        const tube = tubes[i];
        if (tube.length === 0) continue; 
        if (tube.length !== 4) return; 
        
        const firstColor = tube[0].color; 
        for (let j = 1; j < tube.length; j++) {
            if (tube[j].color !== firstColor) return; 
        }
    }
    
    coins += 10;
    saveProgress(); 
    document.getElementById('win-screen').style.display = 'flex';
}

// --- MENU & SETTINGS ---
function openMenu() {
    renderMenuGrid();
    document.getElementById('menu-screen').style.display = 'flex';
}

function closeMenu() {
    document.getElementById('menu-screen').style.display = 'none';
}

function switchTab(tabId, btn) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(tabId + '-grid').classList.add('active');
    document.getElementById('menu-title').innerText = tabId.charAt(0).toUpperCase() + tabId.slice(1);
}

function renderMenuGrid() {
    const grid = document.getElementById('levels-grid');
    grid.innerHTML = '';
    for (let i = 1; i <= 30; i++) {
        const card = document.createElement('div');
        const isUnlocked = i <= maxUnlockedLevel;
        card.className = `level-card ${isUnlocked ? '' : 'locked'}`;
        if (isUnlocked) {
            card.innerHTML = `<div class="level-number">Level ${i}</div>`;
            card.onclick = () => loadLevel(i - 1);
        } else {
            card.innerHTML = `<div class="lock-icon">🔒</div><div class="level-number">Level ${i}</div>`;
        }
        grid.appendChild(card);
    }
}

function openSettings() {
    document.getElementById('settings-screen').style.display = 'flex';
}

function closeSettings() {
    document.getElementById('settings-screen').style.display = 'none';
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById('toggle-sound').innerText = soundEnabled ? 'ON' : 'OFF';
    saveProgress();
}

function toggleVibration() {
    vibrationEnabled = !vibrationEnabled;
    document.getElementById('toggle-vibe').innerText = vibrationEnabled ? 'ON' : 'OFF';
    saveProgress();
}

function updateSettingsUI() {
    document.getElementById('toggle-sound').innerText = soundEnabled ? 'ON' : 'OFF';
    document.getElementById('toggle-vibe').innerText = vibrationEnabled ? 'ON' : 'OFF';
}

// --- SHOP LOGIC ---
function applyTheme() {
    const root = document.documentElement;
    if (currentTheme === 'default') root.style.setProperty('--bg-gradient', 'radial-gradient(circle at 50% 30%, #2a2a5a 0%, #1a1a2e 80%)');
    else if (currentTheme === 'forest') root.style.setProperty('--bg-gradient', 'radial-gradient(circle at 50% 30%, #2a5a2a 0%, #1a2e1a 80%)');
    else if (currentTheme === 'desert') root.style.setProperty('--bg-gradient', 'radial-gradient(circle at 50% 30%, #5a4a2a 0%, #2e1a1a 80%)');
    else if (currentTheme === 'neon') root.style.setProperty('--bg-gradient', 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)');
    else if (currentTheme === 'ocean') root.style.setProperty('--bg-gradient', 'linear-gradient(to top, #0f2027, #203a43, #2c5364)');
    else if (currentTheme === 'sunset') root.style.setProperty('--bg-gradient', 'linear-gradient(to top, #ff7e5f, #feb47b)');
}

function buyTheme(theme, price) {
    if (ownedThemes.includes(theme)) {
        currentTheme = theme;
        applyTheme();
        saveProgress();
        alert("Theme equipped!");
        return;
    }
    if (coins >= price) {
        coins -= price;
        ownedThemes.push(theme);
        currentTheme = theme;
        applyTheme();
        updateControlUI();
        saveProgress();
        alert("Theme unlocked and equipped!");
    } else {
        alert("Not enough coins! Watch more ads.");
    }
}

function watchAdForTheme(theme) {
    showFakeAd(5, 'Reward', () => {
        if (!ownedThemes.includes(theme)) {
            ownedThemes.push(theme);
        }
        currentTheme = theme;
        applyTheme();
        saveProgress();
        alert("Amazing! You unlocked the " + theme.toUpperCase() + " theme!");
    });
}

function watchAdForItem(type, item) {
    showFakeAd(5, 'Reward', () => {
        alert("You unlocked the " + item + " " + type + "!");
        // Logic to apply the item would go here
    });
}

// --- AD FUNCTIONS ---
function showFakeAd(duration, type, callback) {
    const overlay = document.getElementById('ad-overlay');
    const timerDisplay = document.getElementById('ad-timer');
    const closeBtn = document.getElementById('ad-close-btn');
    
    overlay.style.display = 'flex';
    let timeLeft = duration;
    timerDisplay.innerText = timeLeft;
    closeBtn.disabled = true;
    closeBtn.innerText = `Skip in ${timeLeft}s`;
    
    const adTimer = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        closeBtn.innerText = `Skip in ${timeLeft}s`;
        
        if (timeLeft <= 0) {
            clearInterval(adTimer);
            closeBtn.disabled = false;
            closeBtn.innerText = type === 'Reward' ? 'Claim Reward' : 'Close Ad';
        }
    }, 1000);
    
    closeBtn.onclick = () => {
        if (!closeBtn.disabled) {
            overlay.style.display = 'none';
            if (callback) callback();
        }
    };
}

function watchAdForCoins() {
    showFakeAd(5, 'Reward', () => {
        coins += 150;
        saveProgress();
        updateControlUI();
    });
}

function watchAdForUndos() {
    document.getElementById('out-of-tools-modal').style.display = 'none';
    showFakeAd(5, 'Reward', () => {
        undosRemaining += 3;
        updateControlUI();
    });
}

function watchAdForTubes() {
    document.getElementById('out-of-tools-modal').style.display = 'none';
    showFakeAd(5, 'Reward', () => {
        extraTubesRemaining += 1;
        updateControlUI();
    });
}

function closeOutOfTools() {
    document.getElementById('out-of-tools-modal').style.display = 'none';
}

// Initialize game
loadSaveData();
loadLevel(0);
