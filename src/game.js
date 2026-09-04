import { Player } from './player.js';
import { EnemySpawner } from './enemy.js';
import { ExpGem } from './gem.js';

export class Game {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    // Game State: 'PLAYING', 'LEVEL_UP', 'SHOP'
    this.gameState = 'PLAYING';

    // Wave System
    this.currentWave = 1;
    this.waveDuration = 60; // 60 seconds per wave
    this.waveTimer = this.waveDuration;

    // Arena configuration
    this.arenaWidth = 2000;
    this.arenaHeight = 2000;
    this.tileSize = 80;

    // Camera
    this.camera = { x: 0, y: 0 };

    // Instantiate Player in center of arena
    this.player = new Player(this.arenaWidth / 2, this.arenaHeight / 2);

    // Enemies & Items
    this.enemies = [];
    this.gems = [];
    this.spawner = new EnemySpawner(0.8);

    // Level up options
    this.levelUpOptions = [
      { id: 'speed', title: '+15% Move Speed', apply: () => { this.player.speed *= 1.15; } },
      { id: 'attack_speed', title: '+20% Attack Speed', apply: () => { this.player.weapon.fireRate *= 0.8; } },
      { id: 'health', title: '+20 Max HP & Heal', apply: () => { this.player.maxHealth += 20; this.player.health = this.player.maxHealth; } }
    ];

    // Shop upgrades pool
    this.upgradePool = [
      { id: 'spd', title: '+10% Movement Speed', desc: 'Move faster across the arena', apply: () => { this.player.speed *= 1.10; } },
      { id: 'atk_spd', title: '+20% Attack Speed', desc: 'Fire projectiles more rapidly', apply: () => { this.player.weapon.fireRate *= 0.80; } },
      { id: 'max_hp', title: '+25 Max Health', desc: 'Increase total health capacity', apply: () => { this.player.maxHealth += 25; this.player.health += 25; } },
      { id: 'heal', title: 'Full Heal', desc: 'Restore player health to maximum', apply: () => { this.player.health = this.player.maxHealth; } },
      { id: 'spawn_rate', title: '+15% Projectile Speed', desc: 'Projectiles move faster', apply: () => { this.player.weapon.projectileSpeed = (this.player.weapon.projectileSpeed || 500) * 1.15; } }
    ];

    this.shopOptions = [];
    this.selectedShopOption = null;

    // Game loop timing
    this.lastTime = performance.now();
    this.fps = 60;

    this.setupInputs();
    this.init();
  }

  setupInputs() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      if (this.gameState === 'LEVEL_UP') {
        this.handleLevelUpClick(clickX, clickY);
      } else if (this.gameState === 'SHOP') {
        this.handleShopClick(clickX, clickY);
      }
    });
  }

  init() {
    requestAnimationFrame((timestamp) => this.loop(timestamp));
  }

  updateCamera() {
    this.camera.x = this.player.x - this.canvas.width / 2;
    this.camera.y = this.player.y - this.canvas.height / 2;
  }

  handleEnemyDeath(enemy) {
    this.gems.push(new ExpGem(enemy.x, enemy.y, 10));
  }

  triggerLevelUp() {
    this.gameState = 'LEVEL_UP';
  }

  triggerShop() {
    // Kill all remaining enemies
    this.enemies = [];
    this.gameState = 'SHOP';
    this.selectedShopOption = null;

    // Pick 3 randomized upgrades
    const shuffled = [...this.upgradePool].sort(() => 0.5 - Math.random());
    this.shopOptions = shuffled.slice(0, 3);
  }

  handleLevelUpClick(x, y) {
    const cardWidth = 200;
    const cardHeight = 100;
    const startX = (this.canvas.width - (3 * cardWidth + 2 * 20)) / 2;
    const startY = 280;

    for (let i = 0; i < this.levelUpOptions.length; i++) {
      const cardX = startX + i * (cardWidth + 20);
      const cardY = startY;

      if (
        x >= cardX &&
        x <= cardX + cardWidth &&
        y >= cardY &&
        y <= cardY + cardHeight
      ) {
        this.levelUpOptions[i].apply();
        this.player.levelUp();
        this.gameState = 'PLAYING';
        break;
      }
    }
  }

  handleShopClick(x, y) {
    const cardWidth = 200;
    const cardHeight = 120;
    const startX = (this.canvas.width - (3 * cardWidth + 2 * 20)) / 2;
    const startY = 240;

    // Check upgrade card selection
    for (let i = 0; i < this.shopOptions.length; i++) {
      const cardX = startX + i * (cardWidth + 20);
      const cardY = startY;

      if (
        x >= cardX &&
        x <= cardX + cardWidth &&
        y >= cardY &&
        y <= cardY + cardHeight
      ) {
        this.selectedShopOption = i;
        break;
      }
    }

    // Check "Next Wave" button
    const btnWidth = 180;
    const btnHeight = 50;
    const btnX = (this.canvas.width - btnWidth) / 2;
    const btnY = 400;

    if (
      x >= btnX &&
      x <= btnX + btnWidth &&
      y >= btnY &&
      y <= btnY + btnHeight
    ) {
      if (this.selectedShopOption !== null) {
        this.shopOptions[this.selectedShopOption].apply();
      }
      this.currentWave += 1;
      this.waveTimer = this.waveDuration;
      this.gameState = 'PLAYING';
    }
  }

  update(dt) {
    if (this.gameState !== 'PLAYING') return;

    // Wave timer countdown
    this.waveTimer -= dt;
    if (this.waveTimer <= 0) {
      this.waveTimer = 0;
      this.triggerShop();
      return;
    }

    this.player.update(
      dt,
      this.arenaWidth,
      this.arenaHeight,
      this.enemies,
      (enemy) => this.handleEnemyDeath(enemy)
    );

    this.updateCamera();

    // Spawner update
    this.spawner.update(dt, this);

    // Enemies update & collision check with player
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      enemy.update(dt, this.player);

      if (enemy.checkCollision(this.player)) {
        this.player.takeDamage(enemy.damage);
      }
    }

    // Gems update & collection check
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const gem = this.gems[i];
      if (gem.checkCollision(this.player)) {
        gem.collected = true;
        this.player.addXp(gem.value);
        this.gems.splice(i, 1);

        if (this.player.xp >= this.player.nextLevelXp) {
          this.triggerLevelUp();
          break;
        }
      }
    }
  }

  drawArena() {
    const startCol = Math.floor(this.camera.x / this.tileSize);
    const endCol = Math.ceil((this.camera.x + this.canvas.width) / this.tileSize);
    const startRow = Math.floor(this.camera.y / this.tileSize);
    const endRow = Math.ceil((this.camera.y + this.canvas.height) / this.tileSize);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const x = c * this.tileSize - this.camera.x;
        const y = r * this.tileSize - this.camera.y;

        if ((r + c) % 2 === 0) {
          this.ctx.fillStyle = '#242b35';
        } else {
          this.ctx.fillStyle = '#1e232a';
        }
        this.ctx.fillRect(x, y, this.tileSize, this.tileSize);

        this.ctx.strokeStyle = '#2d3542';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, this.tileSize, this.tileSize);
      }
    }

    // Draw Arena Boundaries
    this.ctx.save();
    this.ctx.strokeStyle = '#ef4444';
    this.ctx.lineWidth = 6;
    this.ctx.strokeRect(
      -this.camera.x,
      -this.camera.y,
      this.arenaWidth,
      this.arenaHeight
    );
    this.ctx.restore();
  }

  drawUI() {
    this.ctx.save();

    // XP Bar (Top of canvas)
    const barW = 500;
    const barH = 20;
    const barX = (this.canvas.width - barW) / 2;
    const barY = 15;

    // Background
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    this.ctx.fillRect(barX, barY, barW, barH);

    // XP Fill
    const progress = Math.min(1, this.player.xp / this.player.nextLevelXp);
    this.ctx.fillStyle = '#10b981'; // green
    this.ctx.fillRect(barX, barY, barW * progress, barH);

    // Border
    this.ctx.strokeStyle = '#34d399';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barW, barH);

    // Text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 12px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `LVL ${this.player.level} - XP: ${this.player.xp} / ${this.player.nextLevelXp}`,
      this.canvas.width / 2,
      barY + 14
    );

    // Wave Timer & Wave Number (Top Right)
    const mins = Math.floor(this.waveTimer / 60);
    const secs = Math.floor(this.waveTimer % 60).toString().padStart(2, '0');
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(
      `WAVE ${this.currentWave} | ${mins}:${secs}`,
      this.canvas.width - 25,
      30
    );

    // Health Bar (Bottom left)
    const hpBarW = 150;
    const hpBarH = 15;
    const hpBarX = 20;
    const hpBarY = this.canvas.height - 35;

    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    this.ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);

    const hpProgress = Math.max(0, this.player.health / this.player.maxHealth);
    this.ctx.fillStyle = '#ef4444';
    this.ctx.fillRect(hpBarX, hpBarY, hpBarW * hpProgress, hpBarH);

    this.ctx.strokeStyle = '#f87171';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(hpBarX, hpBarY, hpBarW, hpBarH);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 10px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `HP: ${Math.ceil(this.player.health)} / ${this.player.maxHealth}`,
      hpBarX + hpBarW / 2,
      hpBarY + 11
    );

    this.ctx.restore();
  }

  drawLevelUpOverlay() {
    this.ctx.save();

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#f59e0b';
    this.ctx.font = 'bold 36px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('LEVEL UP!', this.canvas.width / 2, 200);

    this.ctx.fillStyle = '#e2e8f0';
    this.ctx.font = '16px sans-serif';
    this.ctx.fillText('Select an Upgrade:', this.canvas.width / 2, 240);

    const cardWidth = 200;
    const cardHeight = 100;
    const startX = (this.canvas.width - (3 * cardWidth + 2 * 20)) / 2;
    const startY = 280;

    for (let i = 0; i < this.levelUpOptions.length; i++) {
      const option = this.levelUpOptions[i];
      const cardX = startX + i * (cardWidth + 20);
      const cardY = startY;

      this.ctx.fillStyle = '#1e293b';
      this.ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

      this.ctx.strokeStyle = '#3b82f6';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);

      this.ctx.fillStyle = '#f8fafc';
      this.ctx.font = 'bold 14px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        option.title,
        cardX + cardWidth / 2,
        cardY + cardHeight / 2 + 5
      );
    }

    this.ctx.restore();
  }

  drawShopOverlay() {
    this.ctx.save();

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#10b981';
    this.ctx.font = 'bold 32px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`WAVE ${this.currentWave} CLEARED!`, this.canvas.width / 2, 160);

    this.ctx.fillStyle = '#cbd5e1';
    this.ctx.font = '16px sans-serif';
    this.ctx.fillText('Choose a Wave Upgrade:', this.canvas.width / 2, 200);

    const cardWidth = 200;
    const cardHeight = 120;
    const startX = (this.canvas.width - (3 * cardWidth + 2 * 20)) / 2;
    const startY = 240;

    for (let i = 0; i < this.shopOptions.length; i++) {
      const option = this.shopOptions[i];
      const cardX = startX + i * (cardWidth + 20);
      const cardY = startY;
      const isSelected = this.selectedShopOption === i;

      this.ctx.fillStyle = isSelected ? '#064e3b' : '#1e293b';
      this.ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

      this.ctx.strokeStyle = isSelected ? '#34d399' : '#475569';
      this.ctx.lineWidth = isSelected ? 3 : 1.5;
      this.ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);

      this.ctx.fillStyle = '#f8fafc';
      this.ctx.font = 'bold 14px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        option.title,
        cardX + cardWidth / 2,
        cardY + 40
      );

      this.ctx.fillStyle = '#94a3b8';
      this.ctx.font = '11px sans-serif';
      this.ctx.fillText(
        option.desc,
        cardX + cardWidth / 2,
        cardY + 70
      );
    }

    // Next Wave Button
    const btnWidth = 180;
    const btnHeight = 50;
    const btnX = (this.canvas.width - btnWidth) / 2;
    const btnY = 400;

    this.ctx.fillStyle = '#059669';
    this.ctx.fillRect(btnX, btnY, btnWidth, btnHeight);

    this.ctx.strokeStyle = '#34d399';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 18px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Next Wave', this.canvas.width / 2, btnY + 31);

    this.ctx.restore();
  }

  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Tiled Arena
    this.drawArena();

    // Draw Gems
    for (const gem of this.gems) {
      gem.draw(this.ctx, this.camera);
    }

    // Draw Enemies
    for (const enemy of this.enemies) {
      enemy.draw(this.ctx, this.camera);
    }

    // Draw Player and Weapon
    this.player.draw(this.ctx, this.camera);

    // Draw UI
    this.drawUI();

    // Draw Level Up Overlay if active
    if (this.gameState === 'LEVEL_UP') {
      this.drawLevelUpOverlay();
    } else if (this.gameState === 'SHOP') {
      this.drawShopOverlay();
    }
  }

  loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }
}

// Start game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game('gameCanvas');
});
