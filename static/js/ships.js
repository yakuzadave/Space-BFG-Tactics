class Ship {
    constructor(x, y, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.isPlayer = isPlayer;
        this.radius = 20;

        // Customizable properties
        this.color = '#00ff00';
        this.hullType = 'medium';
        this.maxHull = 100;
        this.hull = 100;
        this.maxShield = 100;
        this.shield = 100;
        this.shieldRegenRate = 5;
        this.macroBatteryDamage = 10;
        this.torpedoDamage = 25;

        // Hull type modifiers
        this.hullModifiers = {
            light: { maxHull: 75, speed: 1.5 },
            medium: { maxHull: 100, speed: 1.0 },
            heavy: { maxHull: 150, speed: 0.7 }
        };
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw ship using SVG-like path
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.strokeStyle = this.isPlayer ? this.color : '#ff0000';
        ctx.stroke();

        // Draw shield if active
        if (this.shield > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 255, 255, ${this.shield / this.maxShield})`;
            ctx.stroke();
        }

        ctx.restore();
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

    regenerateShields() {
        if (this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + this.shieldRegenRate);
        }
    }

    updateCustomization(config) {
        this.color = config.color;
        this.hullType = config.hullType;
        this.maxShield = config.shieldCapacity;
        this.shield = this.maxShield;
        this.shieldRegenRate = config.shieldRegen;
        this.macroBatteryDamage = config.macroBatteries;
        this.torpedoDamage = config.torpedoPower;

        // Apply hull type modifiers
        const modifier = this.hullModifiers[this.hullType];
        this.maxHull = modifier.maxHull;
        this.hull = this.maxHull;
    }

    // Draw ship preview for customization
    drawPreview(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);

        // Center the preview
        ctx.save();
        ctx.translate(width/2, height/2);

        // Draw ship at 2x scale
        ctx.scale(2, 2);

        // Draw ship body
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.strokeStyle = this.color;
        ctx.stroke();

        // Draw shield
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 255, 255, 0.5)`;
        ctx.stroke();

        ctx.restore();
    }
}