const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let mapSize = 1000;
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
    zoomLevel = 1 - Math.min(0.4, (player.radius - 30) / 300);
}

const enemies = [];
const enemyBatchSize = 10;
const minSpawnDistance = 500;
let round = 1;

function spawnEnemies() {
    for (let i = 0; i < enemyBatchSize; i++) {
        let enemyX, enemyY, distance;

        do {
            enemyX = Math.random() * mapSize;
            enemyY = Math.random() * mapSize;
            distance = Math.sqrt((enemyX - player.x) ** 2 + (enemyY - player.y) ** 2);
        } while (distance < minSpawnDistance); 

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

spawnEnemies();

const foods = [];
function spawnFoods() {
    for (let i = 0; i < 50; i++) {
        foods.push({
            x: Math.random() * mapSize,
            y: Math.random() * mapSize,
            radius: 5
        });
    }
}
spawnFoods();

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

        enemy.x = Math.max(enemy.radius, Math.min(mapSize - enemy.radius, enemy.x));
        enemy.y = Math.max(enemy.radius, Math.min(mapSize - enemy.radius, enemy.y));
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

    if (enemies.length === 0 && !nextRoundTriggered) {
        nextRoundTriggered = true;
        setTimeout(startNewRound, 500);
    }
}

let nextRoundTriggered = false;
function startNewRound() {
    round++;
    mapSize += 500;
    player.x = mapSize / 2;
    player.y = mapSize / 2;
    updateZoom();

    enemies.length = 0;
    foods.length = 0;

    spawnEnemies();
    spawnFoods();
    nextRoundTriggered = false;
}

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


function update() {
    const dx = mouseX - canvas.width / 2;
    const dy = mouseY - canvas.height / 2;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > player.speed) {
        player.x += (dx / distance) * player.speed;
        player.y += (dy / distance) * player.speed;
    }

    player.x = Math.max(player.radius, Math.min(mapSize - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(mapSize - player.radius, player.y));

    moveEnemies();
    checkCollisions();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = getColors().backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2 - player.x * zoomLevel, canvas.height / 2 - player.y * zoomLevel);
    ctx.scale(zoomLevel, zoomLevel);
    drawGrid();

    foods.forEach(food => {
        ctx.fillStyle = getColors().foodColor;
        ctx.beginPath();
        ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    enemies.forEach(enemy => {
        ctx.fillStyle = getColors().enemyColor;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = getColors().playerColor;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
