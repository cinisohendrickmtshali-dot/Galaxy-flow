// Available colors for the balls (Max 12 colors)
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
// This creates a unique, solvable level based on the level number
function generateLevel(levelNum) {
    // Difficulty scaling: More colors as you go up
    let numColors = Math.min(2 + Math.floor(levelNum / 2), 10); 
    let numBalls = 4; // Always 4 balls per color
    
    let balls = [];
    for (let i = 0; i < numColors; i++) {
        for (let j = 0; j < numBalls; j++) {
            balls.push(COLORS[i % COLORS.length]);
        }
    }
    
    // Shuffle the balls randomly
    for (let i = balls.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [balls[i], balls[j]] = [balls[j], balls[i]];
    }
    
    // Distribute the shuffled balls into tubes
    let levelTubes = [];
    for (let i = 0; i < numColors; i++) {
        let tube = [];
        for (let j = 0; j < numBalls; j++) {
            tube.push(balls.pop());
        }
        levelTubes.push(tube);
    }
    
    // Add 2 empty tubes to give the player space to move
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
    
    // Generate the level dynamically based on the level number
    tubes = generateLevel(levelIndex + 1);
    
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
    if (currentLevelIndex + 1 < 100) { // Allow up to 100 levels
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

        tube.forEach(color => {
            const ballDiv = document.createElement('div');
            ballDiv.className = 'ball';
            ballDiv.style.backgroundColor = color;
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

        // --- NEW: MULTI-BALL MOVEMENT ---
        // 1. Find how many top balls are the same color
        const topColor = fromTube[fromTube.length - 1];
        let count = 0;
        for (let i = fromTube.length - 1; i >= 0; i--) {
            if (fromTube[i] === topColor) {
                count++;
            } else {
                break;
            }
        }

        // 2. Check how much space is available in the target tube
        const spaceAvailable = 4 - toTube.length;
        const toMove = Math.min(count, spaceAvailable);

        // 3. Check if the move is valid
        const topTargetColor = toTube.length > 0 ? toTube[toTube.length - 1] : null;
        
        if (toMove > 0 && (toTube.length === 0 || topColor === topTargetColor)) {
            // Record the move for the Undo button
            moveHistory.push({
                from: selectedTubeIndex,
                to: index,
                count: toMove
            });

            // Move the balls
            for (let i = 0; i < toMove; i++) {
                let ball = fromTube.pop();
                toTube.push(ball);
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
    
    // Move all the balls back
    for (let i = 0; i < lastMove.count; i++) {
        let ball = fromTube.pop();
        toTube.push(ball);
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

// --- FIXED WIN CONDITION ---
// You only win when every non-empty tube is completely full (4 balls) with the same color.
function checkWinCondition() {
    for (let i = 0; i < tubes.length; i++) {
        const tube = tubes[i];
        if (tube.length === 0) continue; // Empty tubes are fine
        
        // A valid tube MUST have 4 balls
        if (tube.length !== 4) return; 
        
        const firstColor = tube[0];
        for (let j = 1; j < tube.length; j++) {
            if (tube[j] !== firstColor) return; // Mixed colors, not won
        }
    }
    
    // If we get here, all non-empty tubes are perfectly sorted!
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

    // Show 30 levels in the grid (You can increase this later)
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
