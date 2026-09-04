import { Weapon } from './weapon.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.speed = 250; // pixels per second
    this.color = '#3b82f6'; // blue
    this.health = 100;
    this.maxHealth = 100;
    this.invulnerableTimer = 0;
    this.invulnerableDuration = 0.5; // seconds of invulnerability when hit

    // XP & Leveling
    this.xp = 0;
    this.level = 1;
    this.nextLevelXp = 30; // initial threshold

    // Weapon
    this.weapon = new Weapon(this, { fireRate: 0.5 });

    // Key states
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false
    };

    this.setupInputs();
  }

  setupInputs() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (key in this.keys) {
          this.keys[key] = true;
        }
      });

      window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (key in this.keys) {
          this.keys[key] = false;
        }
      });
    }
  }

  addXp(amount) {
    this.xp += amount;
    if (this.xp >= this.nextLevelXp) {
      return true; // Threshold reached
    }
    return false;
  }

  levelUp() {
    this.level += 1;
    this.xp -= this.nextLevelXp;
    this.nextLevelXp = Math.floor(this.nextLevelXp * 1.5);
  }

  takeDamage(amount) {
    if (this.invulnerableTimer > 0) return;

    this.health = Math.max(0, this.health - amount);
    this.invulnerableTimer = this.invulnerableDuration;
    console.log(`Player touched an enemy! Took ${amount} damage. Current Health: ${this.health}/${this.maxHealth}`);
  }

  update(dt, arenaWidth, arenaHeight, enemies = [], onEnemyDeath = null) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    let dx = 0;
    let dy = 0;

    if (this.keys.w) dy -= 1;
    if (this.keys.s) dy += 1;
    if (this.keys.a) dx -= 1;
    if (this.keys.d) dx += 1;

    // Normalize diagonal movement speed
    if (dx !== 0 && dy !== 0) {
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;
    }

    this.x += dx * this.speed * dt;
    this.y += dy * this.speed * dt;

    // Constrain to arena boundaries
    this.x = Math.max(this.radius, Math.min(arenaWidth - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(arenaHeight - this.radius, this.y));

    // Update weapon
    this.weapon.update(dt, enemies, onEnemyDeath, arenaWidth, arenaHeight);
  }

  draw(ctx, camera) {
    // Draw weapon projectiles first
    this.weapon.draw(ctx, camera);

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    ctx.save();
    // Flash if invulnerable
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 20) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1d4ed8';
    ctx.stroke();
    ctx.closePath();

    ctx.restore();
  }
}
