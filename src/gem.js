export class ExpGem {
  constructor(x, y, value = 10) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.radius = 6;
    this.color = '#10b981'; // Emerald green
    this.collected = false;
  }

  checkCollision(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distanceSq = dx * dx + dy * dy;
    const combinedRadius = player.radius + this.radius;

    return distanceSq < combinedRadius * combinedRadius;
  }

  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    ctx.save();
    // Draw diamond shape for gem
    ctx.beginPath();
    ctx.moveTo(screenX, screenY - this.radius);
    ctx.lineTo(screenX + this.radius, screenY);
    ctx.lineTo(screenX, screenY + this.radius);
    ctx.lineTo(screenX - this.radius, screenY);
    ctx.closePath();

    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#34d399';
    ctx.stroke();
    ctx.restore();
  }
}
