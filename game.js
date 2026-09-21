const COLORS = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00'];

// Initial setup: 4 tubes
let tubes = [
    ['#FF0000', '#0000FF'], 
    ['#0000FF', '#FF0000'], 
    [],                     
    []                      
];

let selectedTubeIndex = null;

function render() {
    const container = document.getElementById('game-container');
    container.innerHTML = ''; 

    tubes.forEach((tube, index) => {
        const tubeDiv = document.createElement('div');
        tubeDiv.className = 'tube';
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
        }
    } else {
        const fromTube = tubes[selectedTubeIndex];
        const toTube = tubes[index];

        if (selectedTubeIndex === index) {
            selectedTubeIndex = null; 
            return;
        }

        const ballToMove = fromTube[fromTube.length - 1];
        const topBallInTarget = toTube[toTube.length - 1];

        if (toTube.length < 4 && (toTube.length === 0 || ballToMove === topBallInTarget)) {
            fromTube.pop();
            toTube.push(ballToMove);
        }

        selectedTubeIndex = null;
        render();
    }
}

render();
