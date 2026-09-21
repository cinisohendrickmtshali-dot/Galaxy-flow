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
    ]
];

let currentLevelIndex = 0;
let tubes = [];
let selectedTubeIndex = null;

// New State variables for Stage 3
let moveHistory = [];
let undosRemaining = 5;
let extraTubesRemaining = 2;

function loadLevel(levelIndex) {
    tubes = JSON.parse(JSON.stringify(LEVELS[levelIndex]));
    selectedTubeIndex = null;
    
    // Reset the helper tools for every new level
    moveHistory = [];
    undosRemaining = 5;
    extraTubesRemaining = 2;
    
    document.getElementById('level-display').innerText = levelIndex + 1;
    document.getElementById('win-screen').style.display = 'none';
    updateControlUI();
    render();
}

function restartLevel() {
    loadLevel(currentLevelIndex);
}

function nextLevel() {
    currentLevelIndex++;
    if (currentLevelIndex >= LEVELS.length) {
        alert("You finished all levels! More coming soon.");
        currentLevelIndex = 0; 
    }
    loadLevel(currentLevelIndex);
}

// Updates the numbers on the buttons
function updateControlUI() {
    document.getElementById('undo-count').innerText = undosRemaining;
    document.getElementById('add-tube-count').innerText = extraTubesRemaining;
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

        // Check if move is valid
        if (toTube.length < 4 && (toTube.length === 0 || ballToMove === topBallInTarget)) {
            // Record the move for the Undo button BEFORE we move it
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

// --- NEW FUNCTIONS FOR STAGE 3 ---

function undoMove() {
    if (undosRemaining <= 0 || moveHistory.length === 0) return;
    
    // Get the last move from the history
    const lastMove = moveHistory.pop();
    
    // Reverse the move
    const fromTube = tubes[lastMove.to]; // The tube the ball is currently in
    const toTube = tubes[lastMove.from]; // The tube the ball came from
    
    fromTube.pop(); // Remove it from the current tube
    toTube.push(lastMove.color); // Put it back in the original tube
    
    undosRemaining--;
    updateControlUI();
    selectedTubeIndex = null;
    render();
}

function addTube() {
    if (extraTubesRemaining <= 0) return;
    
    tubes.push([]); // Add a new empty tube to the game
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
    
    document.getElementById('win-screen').style.display = 'flex';
}

// Start the game
loadLevel(0);
