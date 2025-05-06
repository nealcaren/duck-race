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
            "Still anyone's race, folks! Don't blink!",
            "WHOA! {randomDuck1} just found an extra gear!",
            "{randomDuck2} seems to be struggling against the current!",
            "The pack is bunching up! This is getting intense!",
            "What a move by {randomDuck3}! Cutting through the water!",
            "The lead has changed THREE TIMES in the last few seconds!",
            "I've never seen a duck race this unpredictable!"
        ],
        comeback: [
            "INCREDIBLE! {comebackDuck} is making a dramatic move from behind!",
            "Where did THAT come from?! {comebackDuck} is surging!",
            "The crowd is going wild as {comebackDuck} makes a push!",
            "Don't count out {comebackDuck}! What a recovery!"
        ],
        upset: [
            "This could be a major upset if {upsetDuck} maintains this pace!",
            "Nobody saw {upsetDuck} as a contender, but look at them now!",
            "The underdog {upsetDuck} is showing everyone how it's done!"
        ],
        nearFinish: [
            "Down the final stretch they come!",
            "{leadingDuck} is pulling ahead!",
            "It's neck and neck between {randomDuck1} and {randomDuck2} for second!",
            "The finish line is in sight! This is it!",
            "Can {trailingDuck} make a last-minute comeback?",
            "Photo finish coming up! I can't tell who's ahead!",
            "They're beak to beak with just meters to go!",
            "The crowd is on their feet! What a finish we're about to see!"
        ],
        winner: [
            "🎉 And the winner is... **{winnerName}**! Unbelievable!",
            "🎉 **{winnerName}** takes the crown! What a race!",
            "🎉 By a beak! It's **{winnerName}** for the win!",
            "🎉 Let's hear it for our champion, **{winnerName}**!",
            "🎉 In a stunning finish, **{winnerName}** crosses first!",
            "🎉 Against all odds, **{winnerName}** pulls off the victory!",
            "🎉 What a comeback! **{winnerName}** steals the win at the end!"
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
                laneElement: null,
                previousLeader: false
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
        // Add a small random factor to make races less predictable
        const randomFactor = 0.15; // 15% randomness
        
        // Calculate adjusted probabilities with randomness
        const adjustedDucks = ducks.map(duck => {
            const randomAdjustment = 1 + (Math.random() * randomFactor * 2 - randomFactor);
            return {
                ...duck,
                adjustedProbability: duck.probability * randomAdjustment
            };
        });
        
        // Use adjusted probabilities for selection
        const sumOfProbabilities = adjustedDucks.reduce((sum, duck) => sum + duck.adjustedProbability, 0);
        let random = Math.random() * sumOfProbabilities;
        
        for (let duck of adjustedDucks) {
            if (random < duck.adjustedProbability) return ducks.find(d => d.id === duck.id);
            random -= duck.adjustedProbability;
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
                // Base movement with more randomness
                let movement = (Math.random() * 3.5 + 0.2);
                
                // Race progress percentage
                const raceProgress = duck.currentPosition / logicalFinishLinePosition;
                
                // Dramatic comeback chances increase in the second half of the race
                const comebackChance = raceProgress > 0.5 ? 0.15 : 0.05;
                
                // Dramatic slowdown chances are higher for early leaders
                const slowdownChance = raceProgress > 0.6 && duck.currentPosition > logicalFinishLinePosition * 0.25 ? 0.12 : 0.03;
                
                // Winner gets a more significant advantage as the race progresses
                if (duck.id === actualWinner.id) {
                    // Winner advantage varies throughout the race
                    if (raceProgress < 0.3) {
                        // Early race: winner might not lead
                        movement += (Math.random() * 0.3);
                    } else if (raceProgress > 0.7) {
                        // Final stretch: winner gets more advantage
                        movement += (0.5 + Math.random() * 0.8);
                        
                        // Extra boost if other ducks are getting close to finish
                        const otherDucksNearFinish = ducks.some(d => 
                            d.id !== actualWinner.id && 
                            d.currentPosition > logicalFinishLinePosition - 50);
                            
                        if (otherDucksNearFinish) {
                            movement += 1.5;
                        }
                    } else {
                        // Middle race: moderate advantage
                        movement += (0.2 + Math.random() * 0.6);
                    }
                }
                
                // Random bursts of speed for any duck
                if (Math.random() < 0.08) {
                    movement += Math.random() * 3;
                    if (Math.random() < 0.3) playSound(SOUNDS.quack);
                }
                
                // Dramatic comeback for trailing ducks
                if (duck.id !== actualWinner.id && raceProgress < 0.7 && Math.random() < comebackChance) {
                    movement += 3 + Math.random() * 4;
                    if (Math.random() < 0.5) playSound(SOUNDS.quack);
                }
                
                // Occasional slowdowns (hitting rough water)
                if (Math.random() < slowdownChance) {
                    movement *= 0.2;
                    if (Math.random() < 0.4) playSound(SOUNDS.quack);
                }
                
                // Apply the movement
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
            
            // Track previous leader to detect changes
            const previousLeaderIndex = ducks.findIndex(d => d.previousLeader);
            const leaderChanged = previousLeaderIndex >= 0 && ducks[previousLeaderIndex].id !== leadingDuck.id;
            
            // Update previous leader tracking
            ducks.forEach(d => d.previousLeader = false);
            const currentLeaderIndex = ducks.findIndex(d => d.id === leadingDuck.id);
            if (currentLeaderIndex >= 0) {
                ducks[currentLeaderIndex].previousLeader = true;
            }

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
            
            // Race progress
            const raceProgress = leadingDuck.currentPosition / logicalFinishLinePosition;
            
            // Check for dramatic comebacks
            if (leaderChanged && raceProgress > 0.4) {
                stage = 'comeback';
                subs.comebackDuck = leadingDuck.name;
            } 
            // Check for potential upsets (lower odds duck in lead past halfway)
            else if (raceProgress > 0.5 && leadingDuck.odds > 4) {
                stage = 'upset';
                subs.upsetDuck = leadingDuck.name;
            }
            // Near finish announcements
            else if (leadingDuck.currentPosition > logicalFinishLinePosition * 0.75) {
                stage = 'nearFinish';
                subs.trailingDuck = sortedDucks.length > 1 ? sortedDucks[sortedDucks.length - 1].name : "the last duck";
            }
            
            // Determine if we should play a quack sound
            const shouldQuack = Math.random() < (leaderChanged ? 0.4 : 0.15);
            if (shouldQuack) playSound(SOUNDS.quack);
            
            announcer.textContent = getRandomAnnouncerLine(stage, subs);
            lastAnnounceTime = timestamp;
        }

        // Check if any duck has crossed the finish line
        const finishedDucks = ducks.filter(duck => duck.currentPosition >= logicalFinishLinePosition);
        
        if (finishedDucks.length > 0) {
            // If the actual winner has crossed, end the race with them as winner
            if (actualWinner.currentPosition >= logicalFinishLinePosition) {
                endRace(actualWinner);
            } 
            // If other ducks crossed but not the winner, slow them down at the finish line
            else {
                finishedDucks.forEach(duck => {
                    // Pull back ducks that crossed too early
                    duck.currentPosition = logicalFinishLinePosition - 5;
                    duck.elementContainer.style.left = `${duck.currentPosition}px`;
                });
                animationFrameId = requestAnimationFrame((ts) => animateRace(ts, actualWinner));
            }
        } else {
            animationFrameId = requestAnimationFrame((ts) => animateRace(ts, actualWinner));
        }
    }

    function endRace(winner) {
        winner.currentPosition = logicalFinishLinePosition + 5; 
        winner.elementContainer.style.left = `${winner.currentPosition}px`;
        
        // Remove all animation classes and add winner highlight
        winner.elementContainer.classList.remove('front-runner', 'close-behind', 'middle-pack', 'struggling');
        winner.elementContainer.classList.add('winner-highlight');
        
        // Add a victory animation
        winner.elementContainer.style.animation = 'none';
        setTimeout(() => {
            winner.elementContainer.style.animation = 'frontRunnerBobbing 0.6s ease-in-out infinite alternate';
        }, 50);
        
        announcer.innerHTML = getRandomAnnouncerLine('winner', { winnerName: winner.name });
        playSound(SOUNDS.cheer);
        
        raceInProgress = false;
        startButton.style.display = 'none';
        nextRaceButton.style.display = 'inline-block';
        nextRaceButton.disabled = false;
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
