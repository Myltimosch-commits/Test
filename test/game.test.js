import assert from 'node:assert';
import { Player } from '../src/player.js';
import { Enemy, EnemySpawner } from '../src/enemy.js';
import { Weapon, Projectile } from '../src/weapon.js';
import { ExpGem } from '../src/gem.js';

console.log('Running End-To-End Unit & Integration Verification...');

// 1. Test Player Movement and Boundary Clamping
{
  const player = new Player(100, 100);
  assert.strictEqual(player.x, 100);
  assert.strictEqual(player.y, 100);

  // Simulate pressing 'D' and 'S'
  player.keys.d = true;
  player.keys.s = true;
  player.update(0.1, 2000, 2000, [], null);

  assert(player.x > 100, 'Player should move right');
  assert(player.y > 100, 'Player should move down');

  // Test Boundary clamping (try moving far negative)
  player.x = -500;
  player.y = -500;
  player.update(0.01, 2000, 2000, [], null);
  assert.strictEqual(player.x, player.radius, 'Player x should clamp to boundary');
  assert.strictEqual(player.y, player.radius, 'Player y should clamp to boundary');

  console.log('✔ Player movement & boundary constraints verified');
}

// 2. Test Enemy Movement towards Player & Collision
{
  const player = new Player(500, 500);
  const enemy = new Enemy(100, 100, { speed: 100 });
  const initialDist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

  enemy.update(1.0, player);
  const newDist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

  assert(newDist < initialDist, 'Enemy should move closer to player');

  // Place enemy right on top of player
  enemy.x = player.x;
  enemy.y = player.y;
  assert.strictEqual(enemy.checkCollision(player), true, 'Collision should be detected');

  const startHp = player.health;
  player.takeDamage(10);
  assert.strictEqual(player.health, startHp - 10, 'Player health should decrease on damage');

  console.log('✔ Enemy movement & player collision verified');
}

// 3. Test Weapon Firing & Projectile Collision with Enemy
{
  const player = new Player(500, 500);
  const enemy = new Enemy(550, 500); // 50px away
  const enemies = [enemy];
  let deadEnemy = null;

  // Run game frames with dt = 0.016s (~60 FPS)
  let hit = false;
  for (let frame = 0; frame < 60; frame++) {
    player.weapon.update(0.016, enemies, (e) => { deadEnemy = e; }, 2000, 2000);
    if (enemies.length === 0) {
      hit = true;
      break;
    }
  }

  assert.strictEqual(hit, true, 'Projectile should hit and destroy enemy');
  assert.strictEqual(deadEnemy, enemy, 'Enemy death callback should be invoked');

  console.log('✔ Weapon targeting & projectile destruction verified');
}

// 4. Test ExpGem Drop & Collection
{
  const player = new Player(100, 100);
  const gem = new ExpGem(105, 100, 10);

  assert.strictEqual(gem.checkCollision(player), true, 'Gem collision detected');

  const initialXp = player.xp;
  const levelUpTriggered = player.addXp(gem.value);
  assert.strictEqual(player.xp, initialXp + 10, 'Player XP should increase');
  assert.strictEqual(levelUpTriggered, false, 'Level up should not trigger yet');

  // Add enough XP to level up
  const levelUpTriggered2 = player.addXp(30);
  assert.strictEqual(levelUpTriggered2, true, 'Level up threshold reached');

  player.levelUp();
  assert.strictEqual(player.level, 2, 'Player level should increment to 2');

  console.log('✔ ExpGem drop, collection & Level Up threshold verified');
}

console.log('All End-To-End Verification Tests Passed Successfully!');
