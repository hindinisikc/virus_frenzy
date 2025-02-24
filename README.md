# Virus Frenzy

## Overview
Virus Frenzy is an action-packed survival game where players control a virus, consuming food and enemies to grow larger while avoiding bigger threats. The game features an expanding map, dynamic enemy behavior, special enemies with unique abilities, and skill-based gameplay elements.

## Features
- **Dynamic Growth**: The player virus grows by consuming food and smaller enemies.
- **Enemy AI**: Enemies react to the player's size and have special behaviors.
- **Special Enemies**: Some enemies have unique abilities, such as charging attacks.
- **Rounds & Scaling**: The game becomes progressively harder with larger maps and more enemies.
- **Zoom Mechanics**: The camera dynamically adjusts based on player growth.

## How to Play
1. **Movement**: Control the virus using arrow keys or WASD.
2. **Consume to Grow**: Eat food and smaller enemies to increase in size.
3. **Avoid Larger Enemies**: Stay away from enemies that are bigger than you.
4. **Survive Rounds**: Clear all enemies to advance to the next round with increased difficulty.
5. **Utilize Skills**: Special abilities can be activated to gain advantages.

## Controls
- **Arrow Keys / WASD**: Move the virus around the map.
- **Skill Activation (if applicable)**: Certain keys may trigger unique abilities.

## Game Mechanics
### Player
- Starts at a fixed size and grows as it consumes food and enemies.
- Speed adjusts dynamically based on size.
- If the player collides with a larger enemy, the game ends.

### Enemies
- Regular enemies move toward or away from the player depending on size.
- Special enemies have unique mechanics like stopping, charging, or dashing attacks.
- New waves of enemies spawn as rounds progress.

### Food
- Small items scattered across the map that increase the player's size when consumed.
- New food spawns each round.

## Development & Code Structure
The game is built using JavaScript and the HTML5 Canvas API. Key components:
- **Canvas Rendering**: Handles drawing the player, enemies, and food on the screen.
- **Player Object**: Manages movement, size growth, and interactions.
- **Enemy AI**: Controls enemy behaviors, including special abilities.
- **Collision Detection**: Ensures proper interactions between game elements.
- **Game Loop**: Handles continuous updates and rendering.

## Future Improvements
- **Power-ups & Skills**: Introduce more abilities for strategic gameplay.
- **Multiplayer Mode**: Implement real-time battles between players.
- **More Enemy Variants**: Increase diversity in enemy behaviors and challenges.
- **Sound & Visual Effects**: Improve the game’s immersive experience.

## Installation & Running
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/virus-frenzy.git
   ```
2. Open `index.html` in a web browser to play.

## Credits
Developed by [Your Name].

## License
This project is open-source under the [MIT License](LICENSE).

