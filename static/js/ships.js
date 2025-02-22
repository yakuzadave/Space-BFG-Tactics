class Ship {
    constructor(x, y, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.velocity = { x: 0, y: 0 };
        this.radius = 20;
        this.isPlayer = isPlayer;
        this.hull = 100;
        this.shield = 100;
        this.shieldRegenRate = 0.1;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Draw ship
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.strokeStyle = this.isPlayer ? '#00ff00' : '#ff0000';
        ctx.stroke();

        // Draw shield if active
        if (this.shield > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 255, 255, ${this.shield / 100})`;
            ctx.stroke();
        }

        ctx.restore();
    }

    update() {
        Physics.applyInertia(this);
        if (this.shield < 100) {
            this.shield = Math.min(100, this.shield + this.shieldRegenRate);
        }
    }

    damage(amount) {
        if (this.shield > 0) {
            this.shield -= amount;
            if (this.shield < 0) {
                this.hull += this.shield;
                this.shield = 0;
            }
        } else {
            this.hull -= amount;
        }
    }
}
