const COLORS = [
    '#FF0000', // Red
    '#0000FF', // Blue
    '#00FF00', // Green
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Purple
    '#A52A2A', // Brown
    '#FFFFFF', // White
    '#FFC0CB', // Pink
    '#808080'  // Gray
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

// --- LEVEL GENERATOR ---
function generateLevel(levelNum) {
    let numColors = Math.min(2 + Math.floor(levelNum / 1.5), 10); 
    let numBalls = 4; 
    
    let balls = [];
    for (let i = 0; i < numColors; i++) {
        for (let j = 0; j < numBalls; j++) {
            // Store as objects now to track 'revealed' state
            balls.push({ color: COLORS[i % COLORS.length], revealed: false });
        }
    }
    
    // Shuffle
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
    
    if (savedLevel) maxUnlockedLevel = parseInt(savedLevel);
    if (savedCoins) coins = parseInt(savedCoins);
    
    document.getElementById('coin-count').innerText = coins;
}

function saveProgress() {
    localStorage.setItem('galaxy_flow_max_level', maxUnlockedLevel);
    localStorage.setItem('galaxy_flow_coins', coins);
}

function loadLevel(levelIndex) {
    if (levelIndex >= maxUnlockedLevel && levelIndex > 0) {
        alert("You need to finish the previous level first!");
        return;
    }

    currentLevelIndex = levelIndex;
    tubes = generateLevel(levelIndex + 1);
    
    // --- FIX: DISABLE HIDDEN BALLS FOR LEVELS 1 TO 9 ---
    if (levelIndex < 9) {
        tubes.forEach(tube => {
            tube.forEach(ball => {
                ball.revealed = true; // Force reveal for easy levels
            });
        });
    }
    
    selectedTubeIndex = null;
    moveHistory = [];
    undosRemaining = 5;
    extraTubesRemaining = 2;
    
    document.getElementById('level-display').innerText = levelIndex + 1;
    document.getElementById('win-screen').style.display = 'none';
    document.getElementById('menu-screen').style.display = 'none';
    
    updateControlUI();
    render();
}

function restartLevel() {
    loadLevel(currentLevelIndex);
}

function nextLevel() {
    if (currentLevelIndex + 1 < 100) { 
        if (currentLevelIndex + 2 > maxUnlockedLevel) {
            maxUnlockedLevel = currentLevelIndex + 2;
            saveProgress();
        }
        loadLevel(currentLevelIndex + 1);
    } else {
        alert("You finished all 100 levels! You are a Ball Sort Master!");
    }
}

function updateControlUI() {
    document.getElementById('undo-count').innerText = undosRemaining;
    document.getElementById('add-tube-count').innerText = extraTubesRemaining;
    document.getElementById('coin-count').innerText = coins;
}

// --- RENDER FUNCTION ---
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
            
            // LOGIC FIX: Reveal the top ball permanently
            if (ballIndex === tube.length - 1) {
                ballObj.revealed = true;
            }

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
    if (selectedTubeIndex === null) {
        if (tubes[index].length > 0) {
            selectedTubeIndex = index;
            render(); 
        }
    } else {
        const fromTube = tubes[selectedTubeIndex];
        const toTube = tubes[index];

        if (selectedTubeIndex === index) {
            selectedTubeIndex = null; 
            render();
            return;
        }

        // Multi-ball movement logic (now accessing .color)
        const topBall = fromTube[fromTube.length - 1];
        const topColor = topBall.color;
        let count = 0;
        for (let i = fromTube.length - 1; i >= 0; i--) {
            if (fromTube[i].color === topColor) {
                count++;
            } else {
                break;
            }
        }

        const spaceAvailable = 4 - toTube.length;
        const toMove = Math.min(count, spaceAvailable);

        const topTargetBall = toTube.length > 0 ? toTube[toTube.length - 1] : null;
        const topTargetColor = topTargetBall ? topTargetBall.color : null;
        
        if (toMove > 0 && (toTube.length === 0 || topColor === topTargetColor)) {
            moveHistory.push({
                from: selectedTubeIndex,
                to: index,
                count: toMove
            });

            for (let i = 0; i < toMove; i++) {
                let ballObj = fromTube.pop();
                ballObj.revealed = true; // Reveal it permanently once moved
                toTube.push(ballObj);
            }
        }

        selectedTubeIndex = null;
        render();
        checkWinCondition();
    }
}

function undoMove() {
    if (undosRemaining <= 0 || moveHistory.length === 0) return;
    
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
    if (extraTubesRemaining <= 0) return;
    tubes.push([]); 
    extraTubesRemaining--;
    updateControlUI();
    render();
}

// --- WIN CONDITION ---
function checkWinCondition() {
    for (let i = 0; i < tubes.length; i++) {
        const tube = tubes[i];
        if (tube.length === 0) continue; 
        if (tube.length !== 4) return; 
        
        const firstColor = tube[0].color; // Access color property
        for (let j = 1; j < tube.length; j++) {
            if (tube[j].color !== firstColor) return; 
        }
    }
    
    coins += 10;
    saveProgress(); 
    document.getElementById('win-screen').style.display = 'flex';
}

function openMenu() {
    renderMenuGrid();
    document.getElementById('menu-screen').style.display = 'flex';
}

function closeMenu() {
    document.getElementById('menu-screen').style.display = 'none';
}

function renderMenuGrid() {
    const grid = document.getElementById('level-grid');
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

// Initialize game
loadSaveData();
loadLevel(0);
