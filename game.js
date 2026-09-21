// Define all your levels here. 
// Each array inside the main array is a tube. 
// The colors are read from bottom to top.
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
    // Level 3 (Add more colors)
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

// Function to start a level
function loadLevel(levelIndex) {
    // Deep copy the level data so we don't mess up the original array
    tubes = JSON.parse(JSON.stringify(LEVELS[levelIndex]));
    selectedTubeIndex = null;
    document.getElementById('level-display').innerText = levelIndex + 1;
    document.getElementById('win-screen').style.display = 'none';
    render();
}

// Function to restart the current level
function restartLevel() {
    loadLevel(currentLevelIndex);
}

// Function to go to the next level
function nextLevel() {
    currentLevelIndex++;
    if (currentLevelIndex >= LEVELS.length) {
        alert("You finished all levels! More coming soon.");
        currentLevelIndex = 0; // Loop back to start for now
    }
    loadLevel(currentLevelIndex);
}

// Render the game board
function render() {
    const container = document.getElementById('game-container');
    container.innerHTML = ''; 

    tubes.forEach((tube, index) => {
        const tubeDiv = document.createElement('div');
        tubeDiv.className = 'tube';
        
        // Highlight the selected tube
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

// Handle clicking a tube
function handleTubeClick(index) {
    if (selectedTubeIndex === null) {
        if (tubes[index].length > 0) {
            selectedTubeIndex = index;
            render(); // Re-render to show highlight
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

        // Valid move: Target is empty OR top colors match. AND target is not full (max 4)
        if (toTube.length < 4 && (toTube.length === 0 || ballToMove === topBallInTarget)) {
            fromTube.pop();
            toTube.push(ballToMove);
        }

        selectedTubeIndex = null;
        render();
        
        // Check if the player won
        checkWinCondition();
    }
}

// Check if all tubes are empty or full of a single color
function checkWinCondition() {
    for (let i = 0; i < tubes.length; i++) {
        const tube = tubes[i];
        if (tube.length === 0) continue; // Empty tubes are fine
        
        if (tube.length !== 4) return; // Not full, not won yet
        
        const firstColor = tube[0];
        for (let j = 1; j < tube.length; j++) {
            if (tube[j] !== firstColor) return; // Different colors, not won yet
        }
    }
    
    // If we get here, all tubes are sorted!
    document.getElementById('win-screen').style.display = 'flex';
}

// Start the game on Level 1
loadLevel(0);
