export class Enemy {
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.size = options.size || 20;
    this.speed = options.speed || 120; // pixels per second
    this.color = options.color || '#ef4444'; // red square
    this.health = options.health || 10;
    this.maxHealth = this.health;
    this.damage = options.damage || 10;
  }

  update(dt, player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0) {
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    }
  }

  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    ctx.save();
    ctx.fillStyle = this.color;
    ctx.fillRect(
      screenX - this.size / 2,
      screenY - this.size / 2,
      this.size,
      this.size
    );
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      screenX - this.size / 2,
      screenY - this.size / 2,
      this.size,
      this.size
    );
    ctx.restore();
  }

  checkCollision(player) {
    // Circle (player) vs Square (enemy) collision check or distance check
    const halfSize = this.size / 2;
    const closestX = Math.max(this.x - halfSize, Math.min(player.x, this.x + halfSize));
    const closestY = Math.max(this.y - halfSize, Math.min(player.y, this.y + halfSize));

    const distanceX = player.x - closestX;
    const distanceY = player.y - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;

    return distanceSquared < (player.radius * player.radius);
  }
}

export class EnemySpawner {
  constructor(spawnInterval = 0.8) {
    this.spawnInterval = spawnInterval;
    this.timer = 0;
  }

  update(dt, game) {
    this.timer += dt;
    if (this.timer >= this.spawnInterval) {
      this.timer = 0;
      this.spawnEnemy(game);
    }
  }

  spawnEnemy(game) {
    const margin = 60;
    const cam = game.camera;
    const viewW = game.canvas.width;
    const viewH = game.canvas.height;

    // Pick a random side outside camera view: 0=top, 1=right, 2=bottom, 3=left
    const side = Math.floor(Math.random() * 4);
    let x, y;

    switch (side) {
      case 0: // Top
        x = cam.x + Math.random() * viewW;
        y = cam.y - margin;
        break;
      case 1: // Right
        x = cam.x + viewW + margin;
        y = cam.y + Math.random() * viewH;
        break;
      case 2: // Bottom
        x = cam.x + Math.random() * viewW;
        y = cam.y + viewH + margin;
        break;
      case 3: // Left
        x = cam.x - margin;
        y = cam.y + Math.random() * viewH;
        break;
    }

    // Clamp spawn positions to arena boundaries
    x = Math.max(10, Math.min(game.arenaWidth - 10, x));
    y = Math.max(10, Math.min(game.arenaHeight - 10, y));

    game.enemies.push(new Enemy(x, y));
  }
}
