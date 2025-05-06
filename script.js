// Wait for the DOM to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    const DUCK_DATA_MASTER = [
        { id: 1, name: "Quack Sparrow", odds: 2, fillColor: "#FFD700" /* Gold */ },
        { id: 2, name: "Feather Fawcett", odds: 3, fillColor: "#FFC0CB" /* Pink */ },
        { id: 3, name: "Bill Clinton", odds: 4, fillColor: "#ADD8E6" /* LightBlue */ },
        { id: 4, name: "Sir Quacks-A-Lot", odds: 5, fillColor: "#FFA500" /* Orange */ },
        { id: 5, name: "Duck Norris", odds: 5, fillColor: "#90EE90" /* LightGreen */ },
        { id: 6, name: "The Ugly Duckling", odds: 9, fillColor: "#DA70D6" /* Orchid */ }
    ];

    const FINISH_LINE_OFFSET = 100; // pixels from right edge for logical finish line

    // --- SOUNDS ---
    // Create dummy audio objects that won't cause errors
    const SOUNDS = {
        start: { play: () => console.log("Start sound would play") },
        quack: { play: () => console.log("Quack sound would play") },
        cheer: { play: () => console.log("Cheer sound would play") }
    };


    // --- ANNOUNCER LINES ---
    const ANNOUNCER_LINES = {
        preRace: [
            "Place your bets! Quacktastic fun awaits!",
            "The ducks are lining up! Who's your champion?",
            "Odds are on the board! Get your wagers in!",
            "Feathers will fly! Or... float, rather. Bet now!"
        ],
        start: [
            "And they're OFF! A flurry of feathers and fury!",
            "The race has begun! May the best duck win!",
            "They're in the water! What a quack-tacular start!",
            "Go, ducks, go! The crowd is roaring!"
        ],
        midRace: [
            "{leadingDuck} is making a splash!",
            "It's a tight race! Any duck could take it!",
            "{randomDuck1} is paddling hard, trying to catch up!",
            "Look at {randomDuck2} go! What a surge!",
            "The current seems to favor {leadingDuck} right now!",
            "Oh! {randomDuck3} hit a bit of rough water!",
            "Still anyone's race, folks! Don't blink!"
        ],
        nearFinish: [
            "Down the final stretch they come!",
            "{leadingDuck} is pulling ahead!",
            "It's neck and neck between {randomDuck1} and {randomDuck2} for second!",
            "The finish line is in sight! This is it!",
            "Can {trailingDuck} make a last-minute comeback?"
        ],
        winner: [
            "🎉 And the winner is... **{winnerName}**! Unbelievable!",
            "🎉 **{winnerName}** takes the crown! What a race!",
            "🎉 By a beak! It's **{winnerName}** for the win!",
            "🎉 Let's hear it for our champion, **{winnerName}**!"
        ]
    };

    // --- DOM ELEMENTS ---
    const rosterContainer = document.getElementById('roster-container');
    const raceArea = document.getElementById('race-area');
    const startButton = document.getElementById('startButton');
    const nextRaceButton = document.getElementById('nextRaceButton');
    const announcer = document.getElementById('announcer');
    
    let raceInProgress = false;
    let animationFrameId;
    let ducks = []; 
    let logicalFinishLinePosition;

    // --- CORE FUNCTIONS ---

    function updateLogicalFinishLine() {
        logicalFinishLinePosition = raceArea.offsetWidth - FINISH_LINE_OFFSET;
        // console.log("Updated logicalFinishLinePosition:", logicalFinishLinePosition, "Race Area Width:", raceArea.offsetWidth);
    }

    function initializeGame() {
        updateLogicalFinishLine();
        createDuckParticipants();
        displayRoster();
        resetRaceVisuals();
        announcer.textContent = getRandomAnnouncerLine('preRace');
        startButton.style.display = 'inline-block';
        nextRaceButton.style.display = 'none';
        startButton.disabled = false;
        raceInProgress = false;
    }

    function createDuckParticipants() {
        ducks = DUCK_DATA_MASTER.map(data => {
            const probability = 1 / (data.odds + 1);
            return {
                ...data,
                probability,
                currentPosition: 0, 
                currentYOffset: 0, 
                elementContainer: null, 
                laneElement: null 
            };
        });
    }

    function displayRoster() {
        rosterContainer.innerHTML = '';
        DUCK_DATA_MASTER.forEach(data => {
            const rosterDuckDiv = document.createElement('div');
            rosterDuckDiv.classList.add('roster-duck');
            rosterDuckDiv.innerHTML = `
                <svg viewBox="0 0 50 45" style="fill:${data.fillColor};">
                    <use xlink:href="#rubberDuckSymbol"></use>
                </svg>
                <h3>${data.name}</h3>
                <p>Odds: ${data.odds}:1</p>
            `;
            rosterContainer.appendChild(rosterDuckDiv);
        });
    }

    function resetRaceVisuals() {
        const visualFinishLineRightOffset = FINISH_LINE_OFFSET - 5; 
        raceArea.innerHTML = `<div id="finish-line" style="right:${visualFinishLineRightOffset}px;"></div>`;
        
        ducks.forEach((duck) => {
            const trackLaneDiv = document.createElement('div');
            trackLaneDiv.classList.add('track-lane');
            duck.laneElement = trackLaneDiv;

            const duckContainer = document.createElement('div');
            duckContainer.classList.add('duck-racer-container');
            duckContainer.innerHTML = `
                <svg viewBox="0 0 50 45" style="fill:${duck.fillColor};">
                    <use xlink:href="#rubberDuckSymbol"></use>
                </svg>
            `;
            duck.elementContainer = duckContainer;
            
            duck.currentPosition = 10;
            duck.currentYOffset = (Math.random() - 0.5) * 10; 
            duck.elementContainer.style.left = `${duck.currentPosition}px`;
            duck.elementContainer.style.transform = `translateY(${duck.currentYOffset}px)`;
            duck.elementContainer.classList.add('middle-pack'); // Start all ducks in middle pack style
            
            trackLaneDiv.appendChild(duckContainer);
            raceArea.appendChild(trackLaneDiv);
        });
        const oldWinner = document.querySelector('.winner-highlight');
        if(oldWinner) oldWinner.classList.remove('winner-highlight');
    }

    function selectWinner() {
        const sumOfProbabilities = ducks.reduce((sum, duck) => sum + duck.probability, 0);
        let random = Math.random() * sumOfProbabilities;
        for (let duck of ducks) {
            if (random < duck.probability) return duck;
            random -= duck.probability;
        }
        return ducks[ducks.length - 1]; 
    }

    function getRandomAnnouncerLine(stage, substitutions = {}) {
        const lines = ANNOUNCER_LINES[stage];
        if (!lines || lines.length === 0) return "Quack!"; 
        let line = lines[Math.floor(Math.random() * lines.length)];
        for (const key in substitutions) {
            line = line.replace(`{${key}}`, substitutions[key]);
        }
        return line;
    }

    let lastAnnounceTime = 0;
    let announceInterval = 2000; 

    function animateRace(timestamp, actualWinner) {
        if (!raceInProgress) return;

        let winnerHasCrossed = false;

        // Update duck positions
        ducks.forEach(duck => {
            if (duck.currentPosition >= logicalFinishLinePosition) {
                if (duck.id === actualWinner.id) {
                    winnerHasCrossed = true;
                }
            }

            if (duck.currentPosition < logicalFinishLinePosition + 20 || duck.id === actualWinner.id) {
                let movement = (Math.random() * 2.5 + 0.5); 
                if (duck.id === actualWinner.id) {
                    movement += 0.6 + Math.random() * 0.4; 
                } else {
                    if (Math.random() < 0.05) movement += Math.random() * 2; 
                }
                if (duck.id !== actualWinner.id && Math.random() < 0.02 && duck.currentPosition < logicalFinishLinePosition * 0.9) { 
                    movement *= 0.1; 
                    if(Math.random() < 0.3) playSound(SOUNDS.quack); 
                }
                duck.currentPosition += movement;
            }
            
            duck.currentYOffset += (Math.random() - 0.5) * 2; 
            duck.currentYOffset = Math.max(-10, Math.min(10, duck.currentYOffset)); 

            const displayX = Math.min(duck.currentPosition, logicalFinishLinePosition + 30);
            duck.elementContainer.style.left = `${displayX}px`;
        });
        
        // Sort ducks by position to determine race order
        const sortedDucks = [...ducks].sort((a, b) => b.currentPosition - a.currentPosition);
        
        // Apply different animation styles based on race position
        sortedDucks.forEach((duck, index) => {
            // Remove all position classes first
            duck.elementContainer.classList.remove('front-runner', 'close-behind', 'middle-pack', 'struggling');
            
            // Apply appropriate class based on position
            if (index === 0) {
                duck.elementContainer.classList.add('front-runner');
            } else if (index === 1 && (sortedDucks[0].currentPosition - duck.currentPosition) < 50) {
                duck.elementContainer.classList.add('close-behind');
            } else if (index >= sortedDucks.length - 2) {
                duck.elementContainer.classList.add('struggling');
            } else {
                duck.elementContainer.classList.add('middle-pack');
            }
        });

        if (timestamp - lastAnnounceTime > announceInterval) {
            const sortedDucks = [...ducks].sort((a, b) => b.currentPosition - a.currentPosition);
            const leadingDuck = sortedDucks[0];
            let subs = { leadingDuck: leadingDuck.name };
            let stage = 'midRace';

            let randomIndices = [];
            while(randomIndices.length < 3){
                let r = Math.floor(Math.random() * ducks.length);
                if(randomIndices.indexOf(r) === -1) randomIndices.push(r);
            }
            if (ducks.length >= 3) { // Ensure enough ducks for placeholders
                subs.randomDuck1 = ducks[randomIndices[0]].name;
                subs.randomDuck2 = ducks[randomIndices[1]].name;
                subs.randomDuck3 = ducks[randomIndices[2]].name;
            } else { // Provide defaults if not enough ducks
                subs.randomDuck1 = "a speedy duck";
                subs.randomDuck2 = "another quick quacker";
                subs.randomDuck3 = "one more competitor";
            }


            if (leadingDuck.currentPosition > logicalFinishLinePosition * 0.75) {
                stage = 'nearFinish';
                subs.trailingDuck = sortedDucks.length > 1 ? sortedDucks[ducks.length -1].name : "the last duck";
            }
            announcer.textContent = getRandomAnnouncerLine(stage, subs);
            lastAnnounceTime = timestamp;

            if (Math.random() < 0.15) playSound(SOUNDS.quack); 
        }

        if (actualWinner.currentPosition >= logicalFinishLinePosition) {
            actualWinner.currentPosition = logicalFinishLinePosition + 5; 
            actualWinner.elementContainer.style.left = `${actualWinner.currentPosition}px`;
            
            // Remove all animation classes and add winner highlight
            actualWinner.elementContainer.classList.remove('front-runner', 'close-behind', 'middle-pack', 'struggling');
            actualWinner.elementContainer.classList.add('winner-highlight');
            
            // Add a victory animation
            actualWinner.elementContainer.style.animation = 'none';
            setTimeout(() => {
                actualWinner.elementContainer.style.animation = 'frontRunnerBobbing 0.6s ease-in-out infinite alternate';
            }, 50);
            
            announcer.innerHTML = getRandomAnnouncerLine('winner', { winnerName: actualWinner.name });
            playSound(SOUNDS.cheer);
            
            raceInProgress = false;
            startButton.style.display = 'none';
            nextRaceButton.style.display = 'inline-block';
            nextRaceButton.disabled = false; 
        } else {
            animationFrameId = requestAnimationFrame((ts) => animateRace(ts, actualWinner));
        }
    }

    function playSound(sound) {
        if (!sound) return;
        try {
            sound.play();
        } catch (e) {
            console.warn("Sound play failed:", e.message);
        }
    }
    
    // --- EVENT LISTENERS ---
    startButton.addEventListener('click', () => {
        if (raceInProgress) return;
        
        updateLogicalFinishLine(); 
        if (logicalFinishLinePosition <= 50) { 
            alert("Error: Race area appears too small. Please ensure the window is wide enough.");
            console.error("Race area width too small. logicalFinishLinePosition:", logicalFinishLinePosition, "raceArea.offsetWidth:", raceArea.offsetWidth);
            return;
        }
        
        raceInProgress = true;
        startButton.disabled = true;
        nextRaceButton.disabled = true; 

        resetRaceVisuals(); 

        announcer.textContent = getRandomAnnouncerLine('start');
        playSound(SOUNDS.start);

        const winner = selectWinner();
        // console.log("The pre-determined winner is: ", winner.name); 
        // console.log("Target Finish X:", logicalFinishLinePosition);

        setTimeout(() => {
            lastAnnounceTime = performance.now(); 
            animationFrameId = requestAnimationFrame((ts) => animateRace(ts, winner));
        }, 1000); 
    });

    nextRaceButton.addEventListener('click', () => {
        cancelAnimationFrame(animationFrameId); 
        initializeGame(); 
    });

    // --- INITIALIZATION ---
    // No need for window.onload because the script is at the end of the body,
    // OR we wrap it in DOMContentLoaded
    initializeGame();

    window.addEventListener('resize', () => { 
        if (!raceInProgress) { 
            initializeGame(); 
        } else { 
             updateLogicalFinishLine();
        }
    });

}); // End of DOMContentLoaded
