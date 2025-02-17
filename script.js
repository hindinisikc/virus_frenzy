const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const mapSize = 1000;
let zoomLevel = 1;

function getColors() {
    const rootStyles = getComputedStyle(document.documentElement);
    return {
        playerColor: rootStyles.getPropertyValue("--player-color").trim() || "rgb(255, 255, 255)",
        enemyColor: rootStyles.getPropertyValue("--enemy-color").trim() || "rgb(0, 255, 0)",
        foodColor: rootStyles.getPropertyValue("--food-color").trim() || "rgb(255, 255, 255)",
        backgroundColor: rootStyles.getPropertyValue("--background-color").trim() || "rgb(0, 0, 0)"
    };
}

const player = {
    x: mapSize / 2,
    y: mapSize / 2,
    radius: 30,
    baseSpeed: 5,
    get speed() {
        return this.baseSpeed + (this.radius / 50);
    }
};

function updateZoom() {
    zoomLevel = Math.max(1, 1 + (player.radius - 30) / 100);
}

const enemies = [];
const enemyBatchSize = 10; // Spawn 50 enemies per round
const minSpawnDistance = 500; // Minimum distance from the player
let round = 1;

function spawnEnemies() {
    for (let i = 0; i < enemyBatchSize; i++) {
        let enemyX, enemyY, distance;

        do {
            enemyX = Math.random() * mapSize;
            enemyY = Math.random() * mapSize;
            distance = Math.sqrt((enemyX - player.x) ** 2 + (enemyY - player.y) ** 2);
        } while (distance < minSpawnDistance); 

        // Enemy size is slightly larger or smaller than player
        const sizeVariation = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 10);
        const enemyRadius = Math.max(10, player.radius + sizeVariation);

        enemies.push({
            x: enemyX,
            y: enemyY,
            radius: enemyRadius,
            baseSpeed: 4 + Math.random(),
            get speed() {
                return this.baseSpeed / (this.radius / 10);
            }
        });
    }
}

// Spawn initial enemies
spawnEnemies();

const foods = [];
for (let i = 0; i < 50; i++) {
    foods.push({
        x: Math.random() * mapSize,
        y: Math.random() * mapSize,
        radius: 5
    });
}

let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;

canvas.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

function moveEnemies() {
    for (let enemy of enemies) {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (player.radius > enemy.radius) {
            enemy.x -= (dx / distance) * enemy.speed;
            enemy.y -= (dy / distance) * enemy.speed;
        } else if (player.radius < enemy.radius) {
            enemy.x += (dx / distance) * enemy.speed;
            enemy.y += (dy / distance) * enemy.speed;
        }
    }
}

function checkCollisions() {
    for (let i = foods.length - 1; i >= 0; i--) {
        const food = foods[i];
        const dist = Math.sqrt((food.x - player.x) ** 2 + (food.y - player.y) ** 2);
        if (dist < player.radius) {
            foods.splice(i, 1);
            player.radius += 1;
            updateZoom();
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const dist = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);

        if (dist < player.radius - 5) {
            enemies.splice(i, 1);
            player.radius += 5;
            updateZoom();
        } else if (dist < enemy.radius - 5) {
            alert("Game Over! You got eaten.");
            location.reload();
        }
    }

    // If all enemies are gone, start a new round
    if (enemies.length === 0) {
        round++;
        spawnEnemies();
    }
}

function update() {
    const dx = mouseX - canvas.width / 2;
    const dy = mouseY - canvas.height / 2;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > player.speed) {
        player.x += (dx / distance) * player.speed;
        player.y += (dy / distance) * player.speed;
    }

    moveEnemies();
    checkCollisions();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = getColors().backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const offsetX = canvas.width / 2 - player.x;
    const offsetY = canvas.height / 2 - player.y;

    ctx.save();
    ctx.translate(offsetX, offsetY);

    for (const food of foods) {
        ctx.beginPath();
        ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
        ctx.fillStyle = getColors().foodColor;
        ctx.fill();
        ctx.closePath();
    }

    for (const enemy of enemies) {
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = getColors().enemyColor;
        ctx.fill();
        ctx.closePath();
    }

    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = getColors().playerColor;
    ctx.fill();
    ctx.closePath();

    ctx.restore();

    // Display round number
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Round: ${round}`, 20, 40);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
