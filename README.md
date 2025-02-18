# virus_frenzy


// study //

# getColors()


    function getColors() {
        const rootStyles = getComputedStyle(document.documentElement);
        return {
            playerColor: rootStyles.getPropertyValue("--player-color").trim() || "rgb(255, 255, 255)",
            enemyColor: rootStyles.getPropertyValue("--enemy-color").trim() || "rgb(0, 255, 0)",
            foodColor: rootStyles.getPropertyValue("--food-color").trim() || "rgb(255, 255, 255)",
            backgroundColor: rootStyles.getPropertyValue("--background-color").trim() || "rgb(0, 0, 0)"
        };
    }

Description:
This function retrieves the colors for the player, enemy, food, and background from the CSS variables defined in the root (document.documentElement). 
If the values aren't set, it falls back to default colors. It returns an object with these colors.



# spawnEnemies()

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
Description:
This function spawns enemies on the map. 
It ensures that the enemies are not spawned too close to the player by checking the distance between them and the player. 
Each enemy gets a random radius and speed, with a size variation based on the player's size.


# spawnFoods()
    
    function spawnFoods() {
        for (let i = 0; i < 50; i++) {
            foods.push({
                x: Math.random() * mapSize,
                y: Math.random() * mapSize,
                radius: 5
            });
        }
    }
Description:
This function spawns 50 food items randomly on the map. Each food item is assigned a fixed radius of 5. 
These food items are later consumed by the player to increase their size.



# moveEnemies()

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
Description:
This function moves each enemy towards or away from the player, depending on the player's size (radius). If the player is larger, the enemies move away. 
If the player is smaller, they move towards the player. The enemies are also constrained within the map boundaries.


# checkCollisions()
    
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
Description:
This function checks for collisions between the player, food, and enemies:




If the player collides with food, it is consumed, the player's radius increases, and the zoom is updated.
If the player collides with an enemy smaller than them, the enemy is eaten, and the player's radius increases.
If the player collides with a larger enemy, the game ends.
If all enemies are eaten, the next round begins.

# startNewRound()

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
    
Description:
This function starts a new round of the game:

The round number is incremented.
The map size increases, and the player's position is reset to the center.
Enemies and food are respawned.
The zoom level is updated.


# drawGrid()

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
    
Description:
This function draws a grid on the map for visual reference, making the world look larger. The grid lines are drawn at intervals of 50 pixels.




# update()

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
Description:
This function updates the player's position based on the mouse movement. It calculates the direction from the player to the mouse and moves the player accordingly. It also ensures the player stays within the map boundaries. The enemies are moved, and collisions are checked in this function.



# draw()

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

Description:
This function is responsible for drawing the game elements on the canvas:
Clears the previous frame.
Draws the background.
Translates the canvas based on the player's position and applies zoom.
Draws the grid, foods, enemies, and player.


# gameLoop()

    
    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
    
Description:
This function is the main game loop. It calls the update() and draw() functions on each frame and uses requestAnimationFrame to ensure smooth animation.


// METHODS //


Here are the descriptions for the methods in your code, outlining how each one works:

# getComputedStyle()

    getComputedStyle(document.documentElement);

Description:
This method is used to retrieve the computed styles of the root element (document.documentElement), which includes the values of CSS properties defined in the style sheets. In this case, it is used to retrieve the colors for player, enemy, food, and background from the CSS variables.

# Math.random()

    Math.random() * mapSize;

Description:
This method generates a random floating-point number between 0 (inclusive) and 1 (exclusive). It is used to generate random positions for the enemies and food on the map by scaling it to the mapSize.

# Math.sqrt()

    Math.sqrt((enemyX - player.x) ** 2 + (enemyY - player.y) ** 2);

Description:
This method calculates the square root of a number. It is used to calculate the Euclidean distance between two points on the map (such as the distance between the player and an enemy, or the player and food) by using the Pythagorean theorem.

# Math.max()

    Math.max(enemy.radius, Math.min(mapSize - enemy.radius, enemy.x));

Description:
This method returns the largest of the provided numbers. In this case, it is used to constrain the enemy's position within the boundaries of the map. It ensures that the enemy does not go beyond the edges of the map, accounting for the radius of the enemy.

# Math.min()

    Math.min(mapSize - enemy.radius, enemy.x);

Description:
This method returns the smallest of the provided numbers. It is used alongside Math.max() to keep the enemy's position within the map boundaries.

    Array.prototype.splice()

    foods.splice(i, 1);

Description:
The splice() method changes the contents of an array by removing or replacing existing elements and/or adding new elements in place. In this case, it is used to remove food or enemy objects from their respective arrays when they are eaten or destroyed.

# alert()
    
    alert("Game Over! You got eaten.");

Description:
The alert() method displays an alert dialog box with a specified message. It is used here to notify the player when the game ends (i.e., when the player is eaten by a larger enemy).

# location.reload()

    location.reload();

Description:
This method reloads the current document (restarts the game). It is called when the game is over, resetting the game state.

# setTimeout()

    setTimeout(startNewRound, 500);

Description:
The setTimeout() method calls a function or evaluates an expression after a specified number of milliseconds. In this case, it is used to delay the start of a new round by 500 milliseconds.

ctx.beginPath()

    ctx.beginPath();

Description:
This method begins a new path for drawing on the canvas. It is used before any drawing operations (e.g., arc(), moveTo(), lineTo()) to ensure the path starts fresh for each object being drawn.

# ctx.arc()

    ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);

Description:
The arc() method creates an arc/curve that can be used to draw circles and circular shapes. It takes parameters such as the center (food.x, food.y), radius (food.radius), and the start and end angles of the arc (in radians). Here, it is used to draw the food, enemies, and player as circles.

# ctx.fill()

    ctx.fill();

Description:
The fill() method fills the current path with the current fillStyle (the color or pattern used to fill the shapes). It is used here to fill the player, food, and enemy shapes with the appropriate colors.

# ctx.stroke()

    ctx.stroke();

Description:
The stroke() method actually draws the path that has been defined but not filled. It is used in conjunction with beginPath() and moveTo()/lineTo() to draw the grid lines.

# ctx.save()

    ctx.save();

Description:
The save() method saves the current state of the canvas, including transformations, styles, and clipping regions. It is used to save the state before applying any transformations, and later restore() is called to revert to the previous state.

# ctx.restore()

    ctx.restore();

Description:
The restore() method restores the canvas to the state saved by save(). It is used to undo any transformations or changes to the canvas state, ensuring that the transformations applied to draw the player, enemies, and food do not affect other elements like the grid.

# requestAnimationFrame()

    requestAnimationFrame(gameLoop);
    
Description:
The requestAnimationFrame() method tells the browser to call a specified function before the next repaint (frame), which makes it ideal for creating smooth animations. In this case, it recursively calls the gameLoop() function to ensure the game is constantly updating and drawing.

These methods play key roles in the game's operation, managing everything from player movement and enemy behavior to handling canvas drawing and game state transitions. Let me know if you'd like further details on any of the methods!
