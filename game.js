const LEVELS = [
    // Level 1
    [
        ['#FF0000', '#0000FF'], 
        ['#0000FF', '#FF0000'], 
        [],                     
        []                      
    ],
    // Level 2
    [
        ['#FF0000', '#00FF00', '#0000FF'],
        ['#0000FF', '#FF0000', '#00FF00'],
        ['#00FF00', '#0000FF', '#FF0000'],
        [],
        []
    ],
    // Level 3
    [
        ['#FF0000', '#0000FF', '#00FF00', '#FFFF00'],
        ['#FFFF00', '#00FF00', '#0000FF', '#FF0000'],
        ['#0000FF', '#FFFF00', '#FF0000', '#00FF00'],
        [],
        []
    ],
    // Levels 4 to 20 will just be copies of Level 3 for now (placeholder)
    // We will add actual level data later
    ...Array(17).fill([
        ['#FF0000', '#0000FF', '#00FF00', '#FFFF00'],
        ['#FFFF00', '#00FF00', '#0000FF', '#FF0000'],
        ['#0000FF', '#FFFF00', '#FF0000', '#00FF00'],
        [],
        []
    ])
];

let currentLevelIndex = 0;
let tubes = [];
let selectedTubeIndex = null;
let moveHistory = [];
let undosRemaining = 5;
let extraTubesRemaining = 2;

// --- NEW SAVE DATA ---
let maxUnlockedLevel = 1; // Player starts at level 1
let coins = 0;

// Load save data when the game starts
function loadSaveData() {
    const savedLevel = localStorage.getItem('galaxy_flow_max_level');
    const savedCoins = localStorage.getItem('galaxy_flow_coins');
    
    if (savedLevel) maxUnlockedLevel = parseInt(savedLevel);
    if (savedCoins) coins = parseInt(savedCoins);
    
    document.getElementById('coin-count').innerText = coins;
}

// Save data when the player wins
function saveProgress() {
    localStorage.setItem('galaxy_flow_max_level', maxUnlockedLevel);
    localStorage.setItem('galaxy_flow_coins', coins);
}

function loadLevel(levelIndex) {
    // Safety check: don't load a level they haven't unlocked
    if (levelIndex >= maxUnlockedLevel && levelIndex > 0) {
        alert("You need to finish the previous level first!");
        return;
    }

    currentLevelIndex = levelIndex;
    // Make sure we don't go out of bounds
    const levelData = LEVELS[levelIndex] || LEVELS[0]; 
    
    tubes = JSON.parse(JSON.stringify(levelData));
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
    if (currentLevelIndex + 1 < LEVELS.length) {
        // Unlock the next level
        if (currentLevelIndex + 2 > maxUnlockedLevel) {
            maxUnlockedLevel = currentLevelIndex + 2;
            saveProgress();
        }
        loadLevel(currentLevelIndex + 1);
    } else {
        alert("You finished all levels! More coming soon.");
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

        const ballToMove = fromTube[fromTube.length - 1];
        const topBallInTarget = toTube[toTube.length - 1];

        if (toTube.length < 4 && (toTube.length === 0 || ballToMove === topBallInTarget)) {
            moveHistory.push({
                from: selectedTubeIndex,
                to: index,
                color: ballToMove
            });

            fromTube.pop();
            toTube.push(ballToMove);
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
    
    fromTube.pop(); 
    toTube.push(lastMove.color); 
    
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

function checkWinCondition() {
    for (let i = 0; i < tubes.length; i++) {
        const tube = tubes[i];
        if (tube.length === 0) continue; 
        if (tube.length !== 4) return; 
        
        const firstColor = tube[0];
        for (let j = 1; j < tube.length; j++) {
            if (tube[j] !== firstColor) return; 
        }
    }
    
    // Award coins
    coins += 10;
    saveProgress(); // Save the new coin balance
    
    document.getElementById('win-screen').style.display = 'flex';
}

// --- NEW MENU FUNCTIONS ---

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

    // Show 20 levels in the grid
    for (let i = 1; i <= 20; i++) {
        const card = document.createElement('div');
        const isUnlocked = i <= maxUnlockedLevel;
        
        card.className = `level-card ${isUnlocked ? '' : 'locked'}`;
        
        if (isUnlocked) {
            card.innerHTML = `<div class="level-number">Level ${i}</div>`;
            card.onclick = () => loadLevel(i - 1); // Load the level
        } else {
            card.innerHTML = `<div class="lock-icon">🔒</div><div class="level-number">Level ${i}</div>`;
        }
        
        grid.appendChild(card);
    }
}

// Initialize game
loadSaveData();
loadLevel(0); // Always start at level 1 when opening the game
