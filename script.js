// Wait for the DOM to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    const DUCK_DATA_MASTER = [
        { id: 1, name: "Sir Quacks-a-Lot", odds: 2, fillColor: "#FFD700" /* Gold */ },
        { id: 2, name: "Turbo Waddles", odds: 3, fillColor: "#FFC0CB" /* Pink */ },
        { id: 3, name: "Puddle Jumper", odds: 4, fillColor: "#ADD8E6" /* LightBlue */ },
        { id: 4, name: "Fowl Play", odds: 5, fillColor: "#FFA500" /* Orange */ },
        { id: 5, name: "Quacker Jack", odds: 5, fillColor: "#90EE90" /* LightGreen */ },
        { id: 6, name: "Splash Gordon", odds: 9, fillColor: "#DA70D6" /* Orchid */ }
    ];

    // Race layout constants
    const FINISH_LINE_OFFSET = 100; // pixels from edge for finish line
    const RACE_LENGTH = 2000; // Total race length in pixels
    const VIEWPORT_WIDTH = 1000; // Approximate viewport width

    // Race mechanics constants
    const RACE_START_DELAY = 3500; // Milliseconds to wait after sound before race starts
    const WINNER_SELECTION_RANDOMNESS = 0.15; // 15% random factor in winner selection
    const COMEBACK_CHANCE_EARLY = 0.05; // 5% chance of comeback in first half
    const COMEBACK_CHANCE_LATE = 0.15; // 15% chance of comeback in second half
    const SLOWDOWN_CHANCE_LOW = 0.03; // 3% base slowdown chance
    const SLOWDOWN_CHANCE_HIGH = 0.12; // 12% slowdown chance for early leaders
    const BURST_SPEED_CHANCE = 0.08; // 8% chance of speed burst
    const SPLASH_CREATION_CHANCE = 0.3; // 30% chance to create splash on fast movement
    const ANNOUNCEMENT_INTERVAL = 2000; // Milliseconds between announcements

    // Visual effect constants
    const NUM_WATER_SPLASHES = 15; // Number of background water splashes
    const NUM_WHITE_CAPS = 25; // Number of white caps on water
    const DUCK_Y_OFFSET_MAX = 10; // Maximum vertical bobbing offset in pixels

    // Obstacle configuration
    const OBSTACLE_TYPES = [
        {
            id: 'beach-ball',
            emoji: '🏐',
            size: 40,
            speedEffect: { type: 'bounce', modifier: 1.5 }, // Speed boost!
            driftSpeed: 0.5
        },
        {
            id: 'rubber-duckie',
            emoji: '🦆',
            size: 35,
            speedEffect: { type: 'friend', modifier: 1.2 }, // Slight boost
            driftSpeed: 0.8
        },
        {
            id: 'pool-floatie',
            emoji: '🛟',
            size: 45,
            speedEffect: { type: 'tangle', modifier: 0.4 }, // Slowdown!
            driftSpeed: 0.3
        },
        {
            id: 'toy-boat',
            emoji: '⛵',
            size: 50,
            speedEffect: { type: 'wave', modifier: 0.6 }, // Moderate slowdown
            driftSpeed: 1.2
        }
    ];

    const NUM_OBSTACLES = 6; // Number of obstacles on the course
    const OBSTACLE_COLLISION_RADIUS = 30; // Pixels for collision detection
    const OBSTACLE_EFFECT_DURATION = 800; // ms that obstacle affects duck

    // --- SOUNDS ---
    // Real audio objects for race sounds
    const SOUNDS = {
        start: new Audio("sounds/and-they-are-off.mp3"),
        quack: { play: () => console.log("Quack sound would play") },
        cheer: { play: () => console.log("Cheer sound would play") }
    };
    
    // Set volume for the start sound
    SOUNDS.start.volume = 0.5;


    // --- ANNOUNCER LINES ---
    const ANNOUNCER_LINES = {
        preRace: [
          // original
          "Place your bets! Quacktastic fun awaits!",
          "The ducks are lining up! Who's your champion?",
          "Odds are on the board! Get your wagers in!",
          "Feathers will fly! Or... float, rather. Bet now!",
          "Remember: the early bird gets the worm, but the early duck gets the W!",
          "If you’re feeling lucky, wadd-le you waiting for?",
          "Grab your popcorn—this show will be a real feather in your cap!",
          "These ducks practiced all week; they’re truly in their quack‑athletic prime!"
        ],
      
        start: [
          "And they're OFF! A flurry of feathers and fury!",
          "The race has begun! May the best duck win!",
          "They're in the water! What a quack-tacular start!",
          "Go, ducks, go! The crowd is roaring!",
          "It’s paddle‑to‑the‑metal time—no fowl play allowed!",
          "Cue the suspense music: it’s about to get bill‑serious!",
          "Blink and you'll miss it—these ducks are faster than a dad joke at Thanksgiving!",
          "Hold on to your tail feathers; it’s splash o’clock!"
        ],
      
        midRace: [
            "{leadingDuck} is making a splash!",
            "It's a tight race! Any duck could take it!",
            "{randomDuck1} is paddling hard, trying to catch up!",
            "Look at {randomDuck2} go! What a surge!",
            "The current seems to favor {leadingDuck} right now!",
            "Oh! {randomDuck3} hit a bit of rough water!",
            "WHOA! {randomDuck1} just found an extra gear!",
            "{randomDuck2} seems to be struggling against the current!",
            "What a move by {randomDuck3}! Cutting through the water!",
            "The lead has changed THREE TIMES in the last few seconds!",
            "I've never seen a duck race this unpredictable!",
          "{leadingDuck} just said, ‘Water you all doing back there?’",
          "If enthusiasm were bread, {randomDuck1} would be a quacker‑jack!",
          "Rumor has it {randomDuck2} switched to decaf—explain the slow paddling?",
          "Is it just me or did {randomDuck3} install paddle‑assist this season?",
          "Current status: currents really helping {leadingDuck}! #StreamTeam",
          "Featherweight champ {randomDuck1} is bob‑bing and weaving!",
          "Looks like {randomDuck2} left the iron on—better hurry back home after this!"
        ],
      
        comeback: [
          "Where did THAT come from?! {comebackDuck} is surging!",
          "The crowd is going wild as {comebackDuck} makes a push!",
          "Don't count out {comebackDuck}! What a recovery!",
          "Holy quack‑amole! {comebackDuck} is on a tear!",
          "From zero to hero: {comebackDuck} just upgraded to turbo‑paddle!",
          "Mom always said, ‘Put your bill to the grindstone’—{comebackDuck} listened!"
        ],
      
        upset: [
            "This could be a major upset if {upsetDuck} maintains this pace!",
            "Nobody saw {upsetDuck} as a contender, but look at them now!",
            "The underdog {upsetDuck} is showing everyone how it's done!",
            "Plot twist! {upsetDuck} just rewrote the quack‑script!",
            "{upsetDuck} was 100‑to‑1 this morning. Did someone feed it espresso worms?",
            "Even the bookies are duck‑ing for cover—what an upset!"
        ],
      
        nearFinish: [
          // original
          "Down the final stretch they come!",
          "{leadingDuck} is pulling ahead!",
          "It's neck and neck between {randomDuck1} and {randomDuck2} for second!",
          "The finish line is in sight! This is it!",
          "Can {trailingDuck} make a last-minute comeback?",
          "Photo finish coming up! I can't tell who's ahead!",
          "They're beak to beak with just meters to go!",
          "The crowd is on their feet! What a finish we're about to see!",
          // new
          "This is tighter than a dad’s grip on the TV remote!",
          "Get your cameras ready—someone’s about to bill‑ieve in miracles!",
          "{leadingDuck} just switched to Luduckrous speed!",
          "Will it be a quack‑attack or a silent paddle to victory?"
        ],
      
        winner: [
          // original
          "🎉 And the winner is... {winnerName}! Unbelievable!",
          "🎉 {winnerName} takes the crown! What a race!",
          "🎉 By a beak! It's {winnerName} for the win!",
          "🎉 Let's hear it for our champion, {winnerName}!",
          "🎉 In a stunning finish, {winnerName} crosses first!",
          "🎉 Against all odds, {winnerName} pulls off the victory!",
          "🎉 What a comeback! {winnerName} steals the win at the end!",
        ],

        obstacle: [
            "{duckName} just bounced off a beach ball!",
            "Look out! {duckName} hit a pool floatie!",
            "{duckName} made friends with a rubber duckie! Speed boost!",
            "Oh no! {duckName} got tangled in a toy boat!",
            "{duckName} just navigated around that obstacle like a pro!",
            "What a move by {duckName} dodging that floatie!",
            "WHOA! {duckName} just hit something!",
            "{duckName} bouncing through the course like a pinball!"
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
    let waterEffectsContainer = null; // Reusable container for water effects
    let obstacles = []; // Array of active obstacle objects
    let obstacleEffects = new Map(); // Track which ducks are affected by obstacles

    // --- CORE FUNCTIONS ---

    function updateLogicalFinishLine() {
        // Set finish line position based on the race length
        logicalFinishLinePosition = RACE_LENGTH - FINISH_LINE_OFFSET;
        
        // Update the visual finish line position if it exists
        const finishLine = document.getElementById('finish-line');
        if (finishLine) {
            finishLine.style.left = `${logicalFinishLinePosition}px`;
        }
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

    /**
     * Creates interactive, moving obstacles on the race course
     * Obstacles drift horizontally and vertically, affecting duck speed on collision
     */
    function createObstacles() {
        obstacles = [];

        for (let i = 0; i < NUM_OBSTACLES; i++) {
            // Random obstacle type
            const obstacleType = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];

            // Random starting position across race length
            const startX = 200 + Math.random() * (RACE_LENGTH - 400);

            // Random lane (0-5 for 6 ducks)
            const lane = Math.floor(Math.random() * 6);
            const laneY = lane * 75 + 20; // 75px per lane, centered

            // Random drift direction
            const driftDirection = Math.random() > 0.5 ? 1 : -1;

            // Create DOM element
            const obstacleDiv = document.createElement('div');
            obstacleDiv.className = 'race-obstacle';
            obstacleDiv.style.left = `${startX}px`;
            obstacleDiv.style.top = `${laneY}px`;
            obstacleDiv.style.fontSize = `${obstacleType.size}px`;
            obstacleDiv.textContent = obstacleType.emoji;
            obstacleDiv.setAttribute('data-type', obstacleType.id);

            const obstacle = {
                id: `obstacle-${i}`,
                type: obstacleType.id,
                currentPosition: startX,
                currentLaneY: laneY,
                lane: lane,
                elementContainer: obstacleDiv,
                driftSpeed: obstacleType.driftSpeed,
                driftDirection: driftDirection,
                verticalDrift: Math.random() * 2 - 1, // Slight up/down drift
                speedEffect: obstacleType.speedEffect,
                typeData: obstacleType
            };

            obstacles.push(obstacle);
            raceArea.appendChild(obstacleDiv);
        }
    }

    /**
     * Creates or reuses water splash and whitecap effects
     * Optimization: Reuses container across races instead of recreating DOM elements
     */
    function createWaterSplashes() {
        // Reuse existing container if available
        if (waterEffectsContainer) {
            return waterEffectsContainer;
        }

        // Create new container only on first race
        const splashesContainer = document.createElement('div');
        splashesContainer.id = 'splashes-container';

        // Create random water splashes
        for (let i = 0; i < NUM_WATER_SPLASHES; i++) {
            const splash = document.createElement('div');
            splash.className = 'water-splash';

            // Random position
            const xPos = Math.random() * 2800;
            const yPos = 40 + Math.random() * 400;

            // Random animation delay
            const delay = Math.random() * 10;

            splash.style.left = `${xPos}px`;
            splash.style.top = `${yPos}px`;
            splash.style.animationDelay = `${delay}s`;

            splashesContainer.appendChild(splash);
        }

        // Add white caps
        for (let i = 0; i < NUM_WHITE_CAPS; i++) {
            const cap = document.createElement('div');
            cap.className = 'white-cap';

            // Random position
            const xPos = Math.random() * 2800;
            const yPos = 50 + Math.random() * 380;

            // Random size
            const width = 15 + Math.random() * 25;

            // Random animation delay
            const delay = Math.random() * 5;

            cap.style.left = `${xPos}px`;
            cap.style.top = `${yPos}px`;
            cap.style.width = `${width}px`;
            cap.style.animationDelay = `${delay}s`;

            splashesContainer.appendChild(cap);
        }

        // Cache for reuse
        waterEffectsContainer = splashesContainer;
        return splashesContainer;
    }

    function resetRaceVisuals() {
        // Position the finish line at the actual race length
        const finishLinePosition = RACE_LENGTH - FINISH_LINE_OFFSET;
        raceArea.innerHTML = `
            <div id="finish-line" style="left:${finishLinePosition}px;"></div>
            <div class="river-bank river-bank-top"></div>
            <div class="river-bank river-bank-bottom"></div>
            <div class="vegetation vegetation-top"></div>
            <div class="vegetation vegetation-bottom"></div>
        `;
        
        // Add water splashes
        raceArea.appendChild(createWaterSplashes());

        // Add obstacles AFTER water effects but BEFORE ducks
        createObstacles();

        // Reset the race area transform
        raceArea.style.transform = 'translateX(0px)';
        
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

    /**
     * Selects the race winner based on betting odds with some randomness
     *
     * Each duck has odds (e.g., 2:1, 5:1) that determine their probability of winning:
     * - 2:1 odds = 33% chance to win (1/(2+1))
     * - 5:1 odds = 17% chance to win (1/(5+1))
     *
     * A small random factor (15%) is added to prevent races from being too predictable
     * while still respecting the odds over multiple races.
     *
     * @returns {Object} The duck object that should win this race
     */
    function selectWinner() {
        const randomFactor = WINNER_SELECTION_RANDOMNESS;

        // Apply random adjustment to each duck's probability
        const adjustedDucks = ducks.map(duck => {
            const randomAdjustment = 1 + (Math.random() * randomFactor * 2 - randomFactor);
            return {
                ...duck,
                adjustedProbability: duck.probability * randomAdjustment
            };
        });

        // Use weighted random selection based on adjusted probabilities
        const sumOfProbabilities = adjustedDucks.reduce((sum, duck) => sum + duck.adjustedProbability, 0);
        let random = Math.random() * sumOfProbabilities;

        for (let duck of adjustedDucks) {
            if (random < duck.adjustedProbability) return ducks.find(d => d.id === duck.id);
            random -= duck.adjustedProbability;
        }

        // Fallback (should rarely happen)
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
    let announceInterval = ANNOUNCEMENT_INTERVAL; 

    /**
     * Main race animation loop - called every frame via requestAnimationFrame
     *
     * This function implements a predetermined-outcome race where:
     * 1. A winner is selected before the race starts based on betting odds
     * 2. All ducks move with realistic randomness to create suspense
     * 3. The predetermined winner gets subtle advantages to ensure they win
     * 4. The race looks natural and unpredictable to observers
     *
     * @param {number} timestamp - Current timestamp from requestAnimationFrame
     * @param {Object} actualWinner - The duck object that should win this race
     */
    function animateRace(timestamp, actualWinner) {
        if (!raceInProgress) return;

        let winnerHasCrossed = false;

        // Update duck positions
        ducks.forEach(duck => {
            // Check for obstacle collisions
            const currentTime = timestamp;
            const activeEffect = obstacleEffects.get(duck.id);

            if (activeEffect && currentTime >= activeEffect.endTime) {
                // Effect expired - remove it
                obstacleEffects.delete(duck.id);
            } else if (!activeEffect || currentTime < activeEffect.endTime) {
                // Check for new collisions (only if not currently affected)
                if (!activeEffect) {
                    obstacles.forEach(obstacle => {
                        const distanceX = Math.abs(duck.currentPosition - obstacle.currentPosition);
                        const distanceY = Math.abs((duck.laneElement.offsetTop + 30) - obstacle.currentLaneY);

                        // Simple circle collision: check if within radius
                        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

                        if (distance < OBSTACLE_COLLISION_RADIUS) {
                            // Collision detected! Apply effect
                            obstacleEffects.set(duck.id, {
                                endTime: currentTime + OBSTACLE_EFFECT_DURATION,
                                modifier: obstacle.speedEffect.modifier,
                                type: obstacle.speedEffect.type,
                                obstacleType: obstacle.type
                            });

                            // Create visual feedback
                            createObstacleCollisionEffect(duck, obstacle);
                        }
                    });
                }
            }

            if (duck.currentPosition >= logicalFinishLinePosition) {
                if (duck.id === actualWinner.id) {
                    winnerHasCrossed = true;
                }
            }

            if (duck.currentPosition < logicalFinishLinePosition + 20 || duck.id === actualWinner.id) {
                // Base movement with randomness (0.2 to 3.7 pixels per frame)
                let movement = (Math.random() * 3.5 + 0.2);

                // Apply obstacle effect if duck is currently affected
                const obstacleEffect = obstacleEffects.get(duck.id);
                if (obstacleEffect) {
                    movement *= obstacleEffect.modifier;
                    // Visual indicator: make duck slightly dimmer when slowed down
                    duck.elementContainer.style.opacity = obstacleEffect.modifier > 1 ? '1' : '0.8';
                } else {
                    duck.elementContainer.style.opacity = '1';
                }

                // Calculate how far through the race this duck is (0.0 to 1.0)
                const raceProgress = duck.currentPosition / logicalFinishLinePosition;
                
                // Dramatic comeback chances increase in the second half of the race
                const comebackChance = raceProgress > 0.5 ? COMEBACK_CHANCE_LATE : COMEBACK_CHANCE_EARLY;

                // Dramatic slowdown chances are higher for early leaders
                const slowdownChance = raceProgress > 0.6 && duck.currentPosition > logicalFinishLinePosition * 0.25 ? SLOWDOWN_CHANCE_HIGH : SLOWDOWN_CHANCE_LOW;
                
                // WINNER ADVANTAGE SYSTEM
                // The predetermined winner gets speed advantages that scale with race progress
                // This creates a natural-looking win without being obvious
                if (duck.id === actualWinner.id) {
                    if (raceProgress < 0.3) {
                        // Early race (0-30%): Minimal advantage - winner might not even lead
                        // This creates suspense and makes the race feel unpredictable
                        movement += (Math.random() * 0.3);
                    } else if (raceProgress > 0.7) {
                        // Final stretch (70-100%): Significant advantage to ensure victory
                        movement += (0.5 + Math.random() * 0.8);

                        // Safety mechanism: If other ducks are dangerously close to finish,
                        // give winner extra boost to prevent upset
                        const otherDucksNearFinish = ducks.some(d =>
                            d.id !== actualWinner.id &&
                            d.currentPosition > logicalFinishLinePosition - 50);

                        if (otherDucksNearFinish) {
                            movement += 1.5;
                        }
                    } else {
                        // Middle race (30-70%): Moderate advantage
                        movement += (0.2 + Math.random() * 0.6);
                    }
                }
                
                // Random bursts of speed for any duck
                if (Math.random() < BURST_SPEED_CHANCE) {
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
                
                // Create splash effect on significant movement
                if (movement > 3 && Math.random() < SPLASH_CREATION_CHANCE) {
                    createDuckSplash(duck);
                }
            }
            
            duck.currentYOffset += (Math.random() - 0.5) * 2;
            duck.currentYOffset = Math.max(-DUCK_Y_OFFSET_MAX, Math.min(DUCK_Y_OFFSET_MAX, duck.currentYOffset)); 

            // Always use the actual position for the duck's left value
            duck.elementContainer.style.left = `${duck.currentPosition}px`;
        });

        // Animate obstacles - make them drift across lanes
        obstacles.forEach(obstacle => {
            // Horizontal drift (left/right movement)
            obstacle.currentPosition += obstacle.driftSpeed * obstacle.driftDirection;

            // Vertical drift (slight up/down wobble between lanes)
            obstacle.currentLaneY += obstacle.verticalDrift;

            // Keep within vertical bounds (40px to 440px for 6 lanes)
            if (obstacle.currentLaneY < 40 || obstacle.currentLaneY > 440) {
                obstacle.verticalDrift *= -1; // Reverse direction
                obstacle.currentLaneY += obstacle.verticalDrift * 2; // Bounce back
            }

            // Wrap around horizontally (obstacles loop from end to start)
            if (obstacle.currentPosition > RACE_LENGTH) {
                obstacle.currentPosition = 0;
            } else if (obstacle.currentPosition < 0) {
                obstacle.currentPosition = RACE_LENGTH;
            }

            // Update DOM position
            obstacle.elementContainer.style.left = `${obstacle.currentPosition}px`;
            obstacle.elementContainer.style.top = `${obstacle.currentLaneY}px`;
        });

        // Sort ducks by position to determine race order
        const sortedDucks = [...ducks].sort((a, b) => b.currentPosition - a.currentPosition);
        
        // Handle side-scrolling based on lead duck position
        if (sortedDucks.length > 0) {
            const leadDuck = sortedDucks[0];
            if (leadDuck.currentPosition > VIEWPORT_WIDTH / 2) {
                // Calculate how far to scroll the race area
                const scrollX = -(leadDuck.currentPosition - VIEWPORT_WIDTH / 2);
                // Apply scroll to race area
                raceArea.style.transform = `translateX(${scrollX}px)`;
            } else {
                raceArea.style.transform = 'translateX(0px)';
            }
        }
        
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
            // Reuse sortedDucks from line 410 instead of recalculating
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
            // If other ducks crossed but not the winner, smoothly stop them at the finish line
            else {
                finishedDucks.forEach(duck => {
                    if (duck.id !== actualWinner.id) {
                        // Smoothly cap position at finish line without jarring pull-back
                        duck.currentPosition = Math.min(duck.currentPosition, logicalFinishLinePosition - 2);
                        duck.elementContainer.style.left = `${duck.currentPosition}px`;
                    }
                });
                animationFrameId = requestAnimationFrame((ts) => animateRace(ts, actualWinner));
            }
        } else {
            animationFrameId = requestAnimationFrame((ts) => animateRace(ts, actualWinner));
        }
    }

    function createDuckSplash(duck) {
        // Create a temporary splash effect behind the duck
        const splash = document.createElement('div');
        splash.className = 'water-splash';

        // Position it just behind the duck
        const splashX = duck.currentPosition - 10;
        const splashY = duck.laneElement.offsetTop + 30 + duck.currentYOffset;

        splash.style.left = `${splashX}px`;
        splash.style.top = `${splashY}px`;
        splash.style.opacity = '0.7';
        splash.style.zIndex = '9';

        // Add to race area
        raceArea.appendChild(splash);

        // Remove after animation completes
        setTimeout(() => {
            if (splash.parentNode) {
                splash.parentNode.removeChild(splash);
            }
        }, 1000);
    }

    function createObstacleCollisionEffect(duck, obstacle) {
        // Create a sparkle/splash effect when duck hits obstacle
        const spark = document.createElement('div');
        spark.className = 'collision-spark';

        // Position at collision point
        const sparkX = (duck.currentPosition + obstacle.currentPosition) / 2;
        const sparkY = (duck.laneElement.offsetTop + obstacle.currentLaneY) / 2;

        spark.style.left = `${sparkX}px`;
        spark.style.top = `${sparkY}px`;

        // Different colors for different effects
        if (obstacle.speedEffect.modifier > 1) {
            spark.style.background = 'radial-gradient(circle, rgba(0, 255, 100, 0.9) 0%, transparent 70%)'; // Green for speed boost
        } else {
            spark.style.background = 'radial-gradient(circle, rgba(255, 100, 0, 0.9) 0%, transparent 70%)'; // Orange for slowdown
        }

        raceArea.appendChild(spark);

        // Play sound effect (if available)
        if (obstacle.speedEffect.modifier > 1) {
            playSound(SOUNDS.quack); // Happy quack for boost
        }

        // Remove after animation
        setTimeout(() => {
            if (spark.parentNode) {
                spark.parentNode.removeChild(spark);
            }
        }, 500);
    }
    
    function endRace(winner) {
        winner.currentPosition = logicalFinishLinePosition + 5;
        winner.elementContainer.style.left = `${winner.currentPosition}px`;

        // Remove all animation classes and add winner highlight with celebration effects
        winner.elementContainer.classList.remove('front-runner', 'close-behind', 'middle-pack', 'struggling');
        winner.elementContainer.classList.add('winner-highlight');

        // Enhanced victory animation - more dramatic bobbing
        winner.elementContainer.style.animation = 'none';
        setTimeout(() => {
            winner.elementContainer.style.animation = 'frontRunnerBobbing 0.4s ease-in-out infinite alternate';
        }, 50);

        // Display winner announcement with emphasis
        const winnerMessage = getRandomAnnouncerLine('winner', { winnerName: winner.name });
        announcer.innerHTML = winnerMessage;
        announcer.style.fontSize = '2em'; // Make winner announcement bigger
        announcer.style.fontWeight = 'bold';

        // Play celebration sound
        playSound(SOUNDS.cheer);

        // Reset announcer style after a moment
        setTimeout(() => {
            announcer.style.fontSize = '';
            announcer.style.fontWeight = '';
        }, 3000);

        raceInProgress = false;
        startButton.style.display = 'none';
        nextRaceButton.style.display = 'inline-block';
        nextRaceButton.disabled = false;
    }
    
    function playSound(sound) {
        if (!sound) return;
        try {
            // If it's an Audio object with a play method
            if (sound instanceof Audio) {
                sound.currentTime = 0; // Reset to start of audio
                sound.play().catch(e => console.warn("Audio play failed:", e.message));
            } else {
                // For our dummy sound objects
                sound.play();
            }
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

        // Show countdown timer during delay
        let countdown = 3;
        const countdownInterval = setInterval(() => {
            if (countdown > 0) {
                announcer.textContent = `${countdown}...`;
                countdown--;
            } else {
                announcer.textContent = "GO!";
                clearInterval(countdownInterval);
            }
        }, 1000);

        // Wait for delay after sound starts before beginning the race
        setTimeout(() => {
            lastAnnounceTime = performance.now();
            animationFrameId = requestAnimationFrame((ts) => animateRace(ts, winner));
        }, RACE_START_DELAY); 
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
