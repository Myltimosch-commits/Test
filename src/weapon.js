export class Projectile {
  constructor(x, y, dirX, dirY, options = {}) {
    this.x = x;
    this.y = y;
    this.dirX = dirX;
    this.dirY = dirY;
    this.speed = options.speed || 500;
    this.radius = options.radius || 6;
    this.color = options.color || '#f59e0b'; // amber/yellow
    this.alive = true;
    this.damage = options.damage || 10;
  }

  update(dt) {
    this.x += this.dirX * this.speed * dt;
    this.y += this.dirY * this.speed * dt;
  }

  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    ctx.save();
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#d97706';
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }

  checkCollision(enemy) {
    const halfSize = enemy.size / 2;
    const closestX = Math.max(enemy.x - halfSize, Math.min(this.x, enemy.x + halfSize));
    const closestY = Math.max(enemy.y - halfSize, Math.min(this.y, enemy.y + halfSize));

    const distanceX = this.x - closestX;
    const distanceY = this.y - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;

    return distanceSquared < (this.radius * this.radius);
  }
}

export class Weapon {
  constructor(player, options = {}) {
    this.player = player;
    this.fireRate = options.fireRate || 0.5; // Fire every 0.5 seconds
    this.cooldown = 0;
    this.projectiles = [];
  }

  update(dt, enemies, onEnemyDeath, arenaWidth, arenaHeight) {
    // Cooldown management
    this.cooldown -= dt;
    if (this.cooldown <= 0 && enemies.length > 0) {
      this.fire(enemies);
      this.cooldown = this.fireRate;
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);

      // Check bounds
      if (p.x < 0 || p.x > arenaWidth || p.y < 0 || p.y > arenaHeight) {
        p.alive = false;
      }

      // Check collision with enemies
      if (p.alive) {
        for (let j = enemies.length - 1; j >= 0; j--) {
          const enemy = enemies[j];
          if (p.checkCollision(enemy)) {
            p.alive = false;
            // Destroy both projectile and enemy
            const deadEnemy = enemies.splice(j, 1)[0];
            if (onEnemyDeath) {
              onEnemyDeath(deadEnemy);
            }
            break;
          }
        }
      }

      // Remove dead projectiles
      if (!p.alive) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  fire(enemies) {
    if (enemies.length === 0) return;

    // Find closest enemy
    let closestEnemy = null;
    let minDistanceSq = Infinity;

    for (const enemy of enemies) {
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        closestEnemy = enemy;
      }
    }

    if (closestEnemy) {
      const dx = closestEnemy.x - this.player.x;
      const dy = closestEnemy.y - this.player.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0) {
        const dirX = dx / dist;
        const dirY = dy / dist;
        const projectile = new Projectile(this.player.x, this.player.y, dirX, dirY);
        this.projectiles.push(projectile);
      }
    }
  }

  draw(ctx, camera) {
    for (const p of this.projectiles) {
      p.draw(ctx, camera);
    }
  }
}
