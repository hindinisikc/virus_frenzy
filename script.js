// Get the canvas element and its context for drawing
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set canvas size to match the window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let mapSize = 1000; // Size of the game map
let zoomLevel = 1;  // Initial zoom level

// Function to retrieve color values from CSS variables
function getColors() {
    const rootStyles = getComputedStyle(document.documentElement);
    return {
        playerColor: rootStyles.getPropertyValue("--player-color").trim() || "rgb(255, 255, 255)",
        enemyColor: rootStyles.getPropertyValue("--enemy-color").trim() || "rgb(0, 255, 0)",
        largeEnemyColor: rootStyles.getPropertyValue("--large-enemy-color").trim() || "rgb(255, 0, 0)",
        foodColor: rootStyles.getPropertyValue("--food-color").trim() || "rgb(255, 255, 255)",
        backgroundColor: rootStyles.getPropertyValue("--background-color").trim() || "rgb(0, 0, 0)"
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
    zoomLevel = 1 - Math.min(0.8, (player.radius - 30) / 150); // Zoom decreases as player grows
}

// Enemies array and related constants
const enemies = [];
const enemyBatchSize = 10;  // Number of enemies to spawn in one batch
const minSpawnDistance = 500; // Minimum distance from player to spawn an enemy
let round = 1;  // Round counter

// Function to spawn enemies at random positions
function spawnEnemies() {
    for (let i = 0; i < enemyBatchSize; i++) {
        let enemyX, enemyY, distance;

        // Ensure enemies spawn at a distance from the player
        do {
            enemyX = Math.random() * mapSize;
            enemyY = Math.random() * mapSize;
            distance = Math.sqrt((enemyX - player.x) ** 2 + (enemyY - player.y) ** 2);
        } while (distance < minSpawnDistance + player.radius);

        // Add variation to enemy size and calculate speed based on radius
        const sizeVariation = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 10);
        const enemyRadius = Math.max(10, player.radius + sizeVariation);

        enemies.push({
            x: enemyX,
            y: enemyY,
            radius: enemyRadius,
            baseSpeed: 4 + Math.random(),  // Random speed for each enemy
            get speed() { // Speed is inversely proportional to size
                return this.baseSpeed / (this.radius / 30);
            }
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

// Mouse position for player movement targeting
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;

// Update mouse position on mousemove
canvas.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

// Function to move enemies towards the player
function moveEnemies() {
    for (let enemy of enemies) {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Enemies move towards the player based on relative size
        if (player.radius > enemy.radius) {
            enemy.x -= (dx / distance) * enemy.speed;
            enemy.y -= (dy / distance) * enemy.speed;
        } else if (player.radius < enemy.radius) {
            enemy.x += (dx / distance) * enemy.speed;
            enemy.y += (dy / distance) * enemy.speed;
        }

        // Prevent enemies from going out of bounds
        enemy.x = Math.max(enemy.radius, Math.min(mapSize - enemy.radius, enemy.x));
        enemy.y = Math.max(enemy.radius, Math.min(mapSize - enemy.radius, enemy.y));
    }
}

// Function to check for collisions between the player, food, and enemies
function checkCollisions() {
    // Check collisions with food
    for (let i = foods.length - 1; i >= 0; i--) {
        const food = foods[i];
        const dist = Math.sqrt((food.x - player.x) ** 2 + (food.y - player.y) ** 2);
        if (dist < player.radius) {
            foods.splice(i, 1); // Remove food item
            player.radius += 1; // Increase player size
            updateZoom(); // Update zoom based on new size
        }
    }

    // Check collisions with enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const dist = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);

        // Player eats the enemy if it collides with a smaller enemy
        if (dist < player.radius + enemy.radius) {
            if (player.radius > enemy.radius) {
                enemies.splice(i, 1); // Remove enemy
                player.radius += 5; // Increase player size
                updateZoom(); // Update zoom based on new size
            } else {
                // Game over if player collides with a larger enemy
                alert(`Game Over! You survived ${round} rounds.`);
                location.reload(); // Reload the game
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
    mapSize += 500;  // Increase map size for the next round
    player.x = mapSize / 2;  // Recenter player
    player.y = mapSize / 2;
    updateZoom();  // Update zoom

    // Reset enemies and food for the new round
    enemies.length = 0;
    foods.length = 0;

    spawnEnemies();  // Spawn new enemies
    spawnFoods();    // Spawn new food
    nextRoundTriggered = false;
}

// Function to draw the grid on the canvas
function drawGrid() {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
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

// Update the player and enemy movements
function update() {
    const dx = mouseX - canvas.width / 2;
    const dy = mouseY - canvas.height / 2;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Move the player towards the mouse cursor
    if (distance > player.speed) {
        player.x += (dx / distance) * player.speed;
        player.y += (dy / distance) * player.speed;
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
        ctx.fillStyle = player.radius < enemy.radius ? getColors().largeEnemyColor : getColors().enemyColor;
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

// Start the game loop
gameLoop();