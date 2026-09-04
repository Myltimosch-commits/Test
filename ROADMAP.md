[x] Step 1 Initialize an HTML5 Canvas game in a modular structure (index.html, style.css, src/game.js, src/player.js). Create a 60FPS game loop. Draw a large tiled arena (larger than the canvas) and implement a dynamic camera that follows the player in the center. The player (a simple blue circle) moves using WASD, constrained by the arena boundaries.

[x] Step 2 Add an EnemySpawner class and an Enemy class (red squares). Enemies should spawn continuously just outside the current camera view. They must constantly calculate the vector towards the player and move towards them. Add basic collision detection: if an enemy touches the player, deduct health and print it to the console.

[x] Step 3 Implement a weapon system. Create a Weapon class attached to the player. Every 0.5 seconds, it should iterate through the active enemies array, find the closest one, and fire a Projectile towards it. Projectiles travel in a straight line and destroy both themselves and the enemy upon collision.

[x] Step 4 When an enemy dies, it should drop an ExpGem object at its coordinates. If the player collides with a gem, increase their XP. Add an XP bar to the UI. When XP reaches a threshold, pause the game loop (set gameState = 'LEVEL_UP') and render a basic overlay menu overlay over the canvas.

[x] Step 5 Implement a Wave system. A wave lasts 60 seconds. When the timer hits 0, kill all remaining enemies, pause the game, and show a 'Shop' UI overlay. The shop should offer 3 randomized upgrades (e.g., +10% Movement Speed, +20% Attack Speed) that modify the player's stats when clicked. Add a "Next Wave" button to resume.
