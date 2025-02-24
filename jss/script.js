
// Get the canvas element and its context for drawing
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set canvas size to match the window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const offscreenCanvas = document.createElement("canvas");
const offscreenCtx = offscreenCanvas.getContext("2d");

offscreenCanvas.width = canvas.width;
offscreenCanvas.height = canvas.height;

// Draw grid once on offscreen canvas
offscreenCtx.fillStyle = "#000";
offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
offscreenCtx.strokeStyle = "#444";
for (let x = 0; x < canvas.width; x += 50) {
    offscreenCtx.moveTo(x, 0);
    offscreenCtx.lineTo(x, canvas.height);
}
for (let y = 0; y < canvas.height; y += 50) {
    offscreenCtx.moveTo(0, y);
    offscreenCtx.lineTo(canvas.width, y);
}
offscreenCtx.stroke();


let mapSize = 2000; // Size of the game map
let zoomLevel = 1;  // Initial zoom level

let skillActive = false; // Flag to check if skill is active
let skillCooldown = false; // Flag to check if skill is on cooldown

const cellSize = 50;  // Adjust based on object size
let spatialHash = {}; // Stores objects by grid cell

let score = 0;
const scoreElement = document.getElementById("score");

function addToSpatialHash(obj) {
    let cellX = Math.floor(obj.x / cellSize);
    let cellY = Math.floor(obj.y / cellSize);
    let key = `${cellX},${cellY}`;
    
    if (!spatialHash[key]) spatialHash[key] = [];
    spatialHash[key].push(obj);
}

function getNearbyObjects(obj) {
    let cellX = Math.floor(obj.x / cellSize);
    let cellY = Math.floor(obj.y / cellSize);
    let nearbyObjects = [];

    // Check surrounding 3x3 cells
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            let key = `${cellX + x},${cellY + y}`;
            if (spatialHash[key]) {
                nearbyObjects.push(...spatialHash[key]);
            }
        }
    }
    return nearbyObjects;
}

// Function to retrieve color values from CSS variables
function getColors() {
    const rootStyles = getComputedStyle(document.documentElement);
    return {
        playerColor: rootStyles.getPropertyValue("--player-color").trim() || "rgb(255, 255, 255)",
        enemyColor: rootStyles.getPropertyValue("--enemy-color").trim() || "rgb(0, 255, 0)",
        largeEnemyColor: rootStyles.getPropertyValue("--large-enemy-color").trim() || "rgb(255, 0, 0)",
        foodColor: rootStyles.getPropertyValue("--food-color").trim() || "rgb(255, 255, 255)",
        backgroundColor: rootStyles.getPropertyValue("--background-color").trim() || "rgb(0, 0, 0)",
        chargingColor1: rootStyles.getPropertyValue("--charging-color1").trim() || "rgb(255, 0, 0)", 
        chargingColor2: rootStyles.getPropertyValue("--charging-color2").trim() || "rgb(0, 255, 0)"       
    };
}

// Player object containing player properties and methods
const player = {
    x: mapSize / 2,     // Initial X position (center of the map)
    y: mapSize / 2,     // Initial Y position (center of the map)
    radius: 30,         // Initial player size
    baseSpeed: 5,       // Base speed of the player
    get speed() {       // Dynamic speed based on player's size (radius)
        return this.baseSpeed + (this.radius / 50);
    }
};

// Update zoom level based on player's radius
function updateZoom() {
    zoomLevel = 1 - Math.min(0.8, (player.radius - 30) / 300); // Zoom decreases as player grows
}

// Function to calculate minimum spawn distance based on map size
function getMinSpawnDistance() {
    return mapSize / 4; // Example: enemies spawn at least 1/4th of the map size away from the player
}

// Enemies array and related constants
const enemies = [];
const enemyBatchSize = 20;  // Number of enemies to spawn in one batch
// const minSpawnDistance = 500; // Minimum distance from player to spawn an enemy
let round = 1;  // Round counter

function spawnEnemies() {
    const minSpawnDistance = getMinSpawnDistance();
    for (let i = 0; i < enemyBatchSize; i++) {
        let enemyX, enemyY, distance;

        // Ensure enemies spawn at a distance from the player
        do {
            enemyX = Math.random() * mapSize;
            enemyY = Math.random() * mapSize;
            distance = Math.sqrt((enemyX - player.x) ** 2 + (enemyY - player.y) ** 2);
        } while (distance < minSpawnDistance + player.radius + 500);

        // Add variation to enemy size and calculate speed based on radius
        const sizeVariation = (Math.random() < 0.5 ? 1 : 1) * (Math.random() * 50);
        const enemyRadius = Math.max(10, player.radius + sizeVariation);

        const isSpecialEnemy = Math.random() < 0.2; // 10% chance to spawn a special enemy

        enemies.push({
            x: enemyX,
            y: enemyY,
            radius: enemyRadius,
            speed: 3 + Math.random(),
            isSpecial: isSpecialEnemy,
            charging: false,
            chargeTime: 3,
            chargeDirection: { x: 0, y: 0 }
        });
    }
}






// Spawn initial enemies
spawnEnemies();

// Foods array for spawning food items
const foods = [];
function spawnFoods() {
    for (let i = 0; i < 50; i++) {
        foods.push({
            x: Math.random() * mapSize,  // Random position for each food item
            y: Math.random() * mapSize,
            radius: 5  // Fixed size for food
        });
    }
}
// Spawn initial foods
spawnFoods();

// Track which keys are pressed
const keysPressed = {};

// Update key press status on keydown and keyup
window.addEventListener("keydown", (event) => {
    keysPressed[event.key] = true;
});

window.addEventListener("keyup", (event) => {
    keysPressed[event.key] = false;
});

// Function to move enemies towards the player
function moveEnemies() {
    for (let enemy of enemies) {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (enemy.isSpecial) {
            if (!enemy.charging && !enemy.stopped) {
                // Stop moving for 3 seconds
                enemy.stopped = true;
                setTimeout(() => {
                    enemy.stopped = false;
                    enemy.charging = true;
                }, 3000); // 3 seconds stop time
            }

            if (enemy.charging) {
                // Change color to indicate charging phase
                enemy.chargingColor = enemy.chargingColor === getColors().chargingColor1 
                    ? getColors().chargingColor2 
                    : getColors().chargingColor1;
                
                setTimeout(() => {
                    enemy.chargeDirection = { x: dx / distance, y: dy / distance };
                    enemy.dashing = true;
                    enemy.charging = false;
                }, 2000); // 2 seconds charging phase
            }

            if (enemy.dashing) {
                // Fast dash movement towards the player
                enemy.x += enemy.chargeDirection.x * 20;
                enemy.y += enemy.chargeDirection.y * 20;
                
                // Stop dashing after a short burst
                setTimeout(() => {
                    enemy.dashing = false;
                }, 500);
            }
        } else {
            // Regular enemy movement
            if (player.radius > enemy.radius || skillActive) {
                enemy.x -= (dx / distance) * enemy.speed;
                enemy.y -= (dy / distance) * enemy.speed;
            } else if (player.radius < enemy.radius) {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            }
        }

        // Prevent enemies from going out of bounds
        enemy.x = Math.max(enemy.radius, Math.min(mapSize - enemy.radius, enemy.x));
        enemy.y = Math.max(enemy.radius, Math.min(mapSize - enemy.radius, enemy.y));
    }
}


function increaseScore(amount) {
    score += amount;
    scoreElement.textContent = score;
}

function onEnemyEaten() {
    increaseScore(10);
}


// Function to check for collisions between the player, food, and enemies
function checkCollisions() {

    spatialHash = {};  // Reset spatial hash each frame

    // Add foods & enemies to spatial hash
    foods.forEach(addToSpatialHash);
    enemies.forEach(addToSpatialHash);

     // Check food collisions (only nearby objects)
    for (let i = foods.length - 1; i >= 0; i--) {
        const food = foods[i];
        let nearbyObjects = getNearbyObjects(player);

        for (let obj of nearbyObjects) {
            if (obj === food) {  // Ensure checking only food
                const dx = food.x - player.x;
                const dy = food.y - player.y;
                const distSq = dx * dx + dy * dy;
                
                if (distSq < player.radius * player.radius) {
                    foods.splice(i, 1);
                    player.radius += 1;
                    increaseScore(1);
                    updateZoom();
                    break;  // Stop checking once a collision is found
                }
            }
        }
    }

    // Check enemy collisions (only nearby objects)
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        let nearbyObjects = getNearbyObjects(player);

        for (let obj of nearbyObjects) {
            if (obj === enemy) {  // Ensure checking only enemies
                const dx = enemy.x - player.x;
                const dy = enemy.y - player.y;
                const distSq = dx * dx + dy * dy;
                const radiiSq = (player.radius + enemy.radius) ** 2;

                if (distSq < radiiSq) {
                    if (player.radius > enemy.radius || skillActive) {
                        enemies.splice(i, 1);
                        player.radius += 5;
                        increaseScore(10);
                        updateZoom();
                    } else {
                        delete player.speed;
                        gameOver();
                    }
                    break;  // Stop checking once a collision is found
                }
            }
        }
    }

    // Start new round if all enemies are eliminated
    if (enemies.length === 0 && !nextRoundTriggered) {
        nextRoundTriggered = true;
        setTimeout(startNewRound, 500);  // Delay before starting the new round
    }

    
}



// Flag to trigger the start of a new round
let nextRoundTriggered = false;

// Function to start a new round
function startNewRound() {
    round++;
    mapSize += 3000;  // Increase map size for the next round
    player.x = mapSize / 2;  // Recenter player
    player.y = mapSize / 2;
    updateZoom();  // Update zoom

    // Reset enemies and food for the new round
    enemies.length = 0;
    foods.length = 0;

    spawnEnemies();  // Spawn new enemies
    spawnFoods();    // Spawn new food
    nextRoundTriggered = false;

    // Show card selection
    showCardSelection();
}

// Function to draw the grid on the canvas
function drawGrid() {
    ctx.strokeStyle = "rgba(235, 177, 235, 0.19)";
    const gridSize = 50;
    for (let x = 0; x < mapSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, mapSize);
        ctx.stroke();
    }
    for (let y = 0; y < mapSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(mapSize, y);
        ctx.stroke();
    }
}

// Function to show card selection
function showCardSelection() {
    const cardContainer = document.getElementById("cardContainer");
    const speedCard = document.querySelector("#speed-Card button");
    const unstoppableCard = document.querySelector("#super-Card button"); 

    if (!cardContainer || !speedCard || !unstoppableCard) {
        console.error("Card container or buttons not found!");
        return;
    }

    // Show the card selection
    cardContainer.style.display = "flex";

    // Handle speed card click
    speedCard.onclick = function () {
        player.baseSpeed += 6; // Increase player speed
        cardContainer.style.display = "none"; // Hide selection
    };

    // Handle unstoppable card click
    unstoppableCard.onclick = function () {
        activateSkill(); // Activate skill
        cardContainer.style.display = "none"; // Hide selection
    };
}

// Function to activate the temporary skill
function activateSkill() {
    if (!skillCooldown) {
        skillActive = true;
        setTimeout(() => {
            skillActive = false;
            skillCooldown = true;
            setTimeout(() => {
                skillCooldown = false;
            }, 10000); // 10 seconds cooldown
        }, 10000); // 10 seconds active
    }
}




// Update the player and enemy movements
function update() {
    // Move the player based on keys pressed
    if (keysPressed['w'] || keysPressed['W']) {
        player.y -= player.speed;
    }
    if (keysPressed['a'] || keysPressed['A']) {
        player.x -= player.speed;
    }
    if (keysPressed['s'] || keysPressed['S']) {
        player.y += player.speed;
    }
    if (keysPressed['d'] || keysPressed['D']) {
        player.x += player.speed;
    }

    // Prevent player from going out of bounds
    player.x = Math.max(player.radius, Math.min(mapSize - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(mapSize - player.radius, player.y));

    moveEnemies(); // Move the enemies
    checkCollisions(); // Check for collisions
}

// Draw everything to the canvas
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear the canvas
    ctx.drawImage(offscreenCanvas, 0, 0);
    ctx.fillStyle = getColors().backgroundColor;  // Set background color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2 - player.x * zoomLevel, canvas.height / 2 - player.y * zoomLevel);  // Adjust for zoom and player position
    ctx.scale(zoomLevel, zoomLevel);  // Apply zoom level
    drawGrid();  // Draw the grid

    // Draw food items
    foods.forEach(food => {
        ctx.fillStyle = getColors().foodColor;
        ctx.beginPath();
        ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
        ctx.fill();
    });


    // Draw enemies
    enemies.forEach(enemy => {
        if (enemy.charging) {
            ctx.fillStyle = enemy.chargingColor || getColors().chargingColor1;
        } else {
            ctx.fillStyle = player.radius < enemy.radius ? getColors().largeEnemyColor : getColors().enemyColor;
        }
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw the player
    ctx.fillStyle = getColors().playerColor;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// Main game loop
function gameLoop() {
    update();  // Update game logic
    draw();    // Draw game objects
    requestAnimationFrame(gameLoop);  // Call gameLoop again for the next frame
}


const restartButton = document.getElementById("restartButton");

function gameOver() {
    // Stop the game logic (pause animations, stop enemy movement, etc.)
    clearInterval(gameLoop); // Example: stopping the main game loop
    
    // Show restart button
    restartButton.style.display = "block";
}

restartButton.addEventListener("click", function () {
    location.reload(); // Reloads the page to restart the game
});

// Start the game loop
gameLoop();






