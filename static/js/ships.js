class Ship {
    constructor(x, y, isPlayer = false) {
        // Basic positional properties
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.isPlayer = isPlayer;
        this.radius = 20;

        // Customizable appearance and stats
        this.color = '#00ff00';
        this.hullType = 'medium';

        // Hull and shield properties
        this.maxHull = 100;
        this.hull = 100;
        this.maxShield = 100;
        this.shield = 100;
        this.shieldRegenRate = 5;

        // Weapon damage values (for display/logic consistency)
        this.macroBatteryDamage = 10;
        this.torpedoDamage = 25;

        // Additional tactical properties
        this.armor = 5;         // Reduces incoming hull damage
        this.speed = 1.0;       // Affected by hull type modifiers; used in movement calculations
        this.evasion = 0.1;     // Chance to evade an attack (10% default)

        // Systems status: track damage from critical hits
        this.systemsDamaged = {
            engines: false,
            weapons: false,
            shields: false
        };

        // Hull type modifiers affect maxHull, speed, and armor
        this.hullModifiers = {
            light:  { maxHull: 75,  speed: 1.5, armor: 2 },
            medium: { maxHull: 100, speed: 1.0, armor: 5 },
            heavy:  { maxHull: 150, speed: 0.7, armor: 8 }
        };

        // Apply hull modifiers based on default hullType
        this.applyHullModifiers();
    }

    applyHullModifiers() {
        const modifier = this.hullModifiers[this.hullType];
        this.maxHull = modifier.maxHull;
        this.hull = this.maxHull;
        this.speed = modifier.speed;
        this.armor = modifier.armor;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw ship body with a simple triangular shape
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        // Change stroke style if the ship has critical system damage
        ctx.strokeStyle = this.isPlayer ? this.color : '#ff0000';
        if (this.systemsDamaged.weapons) {
            ctx.strokeStyle = '#ff9900'; // Indicate weapon malfunction (example)
        }
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw shield outline if active
        if (this.shield > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 255, 255, ${this.shield / this.maxShield})`;
            ctx.stroke();
        }
        ctx.restore();
    }

    // Updated damage function to consider armor when applying hull damage.
    damage(amount) {
        if (this.shield > 0) {
            this.shield -= amount;
            if (this.shield < 0) {
                // Overflow damage applies to the hull; armor reduces the effect.
                let overflow = Math.abs(this.shield);
                this.shield = 0;
                // Apply armor reduction (damage cannot be less than zero)
                const effectiveDamage = Math.max(overflow - this.armor, 0);
                this.hull -= effectiveDamage;
            }
        } else {
            const effectiveDamage = Math.max(amount - this.armor, 0);
            this.hull -= effectiveDamage;
        }
    }

    // Regenerate shields over time (can be called periodically in a game loop)
    regenerateShields() {
        if (this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + this.shieldRegenRate);
        }
    }

    // Apply a critical hit to the ship; randomly disables one system or reduces stats.
    applyCriticalHit() {
        this.logCritical('A critical hit has occurred!');
        const criticalEffects = ['engines', 'weapons', 'shields'];
        // Choose a random system to damage
        const affected = criticalEffects[Math.floor(Math.random() * criticalEffects.length)];
        this.systemsDamaged[affected] = true;

        // Apply effect: for example, reduce shield regeneration or speed.
        switch (affected) {
            case 'engines':
                this.speed *= 0.7;
                this.logCritical('Engine damage: speed reduced.');
                break;
            case 'weapons':
                this.macroBatteryDamage *= 0.8;
                this.torpedoDamage *= 0.8;
                this.logCritical('Weapon systems impaired: damage output reduced.');
                break;
            case 'shields':
                this.shieldRegenRate = Math.max(1, this.shieldRegenRate - 2);
                this.logCritical('Shield generator damaged: slower regeneration.');
                break;
            default:
                break;
        }
    }

    // Utility method for logging critical effects (could integrate with a UI logger)
    logCritical(message) {
        console.log(`[CRITICAL] ${message}`);
    }

    updateCustomization(config) {
        this.color = config.color;
        this.hullType = config.hullType;
        this.maxShield = config.shieldCapacity;
        this.shield = this.maxShield;
        this.shieldRegenRate = config.shieldRegen;
        this.macroBatteryDamage = config.macroBatteries;
        this.torpedoDamage = config.torpedoPower;

        // Re-apply hull modifiers when hull type changes
        this.applyHullModifiers();

        // Reset any system damages when customization is updated (optional)
        this.systemsDamaged = {
            engines: false,
            weapons: false,
            shields: false
        };
    }

    // Draw ship preview for customization, similar to the main draw method but in a dedicated canvas.
    drawPreview(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.scale(2, 2);
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw shield preview with a static opacity
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 255, 255, 0.5)`;
        ctx.stroke();
        ctx.restore();
    }

    // Check if the ship is destroyed (hull integrity zero or below)
    isDestroyed() {
        return this.hull <= 0;
    }
}
