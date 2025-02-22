// Expanded Weapon class with additional options and properties.
class Weapon {
    // Basic weapon types.
    static LASER = 'laser';
    static TORPEDO = 'torpedo';
    static PLASMA = 'plasma';
    static RAILGUN = 'railgun';
    static MISSILE = 'missile';

    /**
     * @param {string} type - The type of weapon.
     * @param {number} damage - Damage dealt by the weapon.
     * @param {number} speed - Projectile speed.
     * @param {number} range - Maximum effective range (in grid cells or pixels).
     * @param {number} critChance - Chance for a critical hit (0 to 1).
     * @param {number} accuracy - Modifier affecting hit probability.
     * @param {number} areaEffect - Radius for area-of-effect damage (0 if none).
     */
    constructor(type, damage, speed, range, critChance = 0, accuracy = 1.0, areaEffect = 0) {
        this.type = type;
        this.damage = damage;
        this.speed = speed;
        this.range = range;
        this.critChance = critChance;
        this.accuracy = accuracy;
        this.areaEffect = areaEffect;
    }
}

// Expanded Projectile class with rendering variations based on weapon type.
class Projectile {
    /**
     * @param {number} x - Initial x-coordinate.
     * @param {number} y - Initial y-coordinate.
     * @param {number} angle - Angle of travel in radians.
     * @param {Weapon} weapon - The weapon that fired this projectile.
     */
    constructor(x, y, angle, weapon) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.weapon = weapon;
        this.distance = 0;
        // Calculate velocity based on angle and weapon speed.
        this.velocity = {
            x: Math.cos(angle) * weapon.speed,
            y: Math.sin(angle) * weapon.speed
        };
    }

    // Update the projectile's position.
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.distance += Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    }

    // Draw the projectile on the provided canvas context.
    draw(ctx) {
        ctx.beginPath();
        switch (this.weapon.type) {
            case Weapon.LASER:
                // Laser drawn as a short, bright line.
                ctx.strokeStyle = '#ff0'; // Yellow
                ctx.lineWidth = 2;
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(
                    this.x - Math.cos(this.angle) * 20,
                    this.y - Math.sin(this.angle) * 20
                );
                ctx.stroke();
                break;
            case Weapon.TORPEDO:
                // Torpedo drawn as a small red circle.
                ctx.fillStyle = '#f00'; // Red
                ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
                ctx.fill();
                break;
            case Weapon.PLASMA:
                // Plasma uses a radial gradient for a glowing effect.
                let plasmaGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 8);
                plasmaGradient.addColorStop(0, 'rgba(0, 255, 255, 1)'); // Cyan center
                plasmaGradient.addColorStop(1, 'rgba(0, 255, 255, 0)'); // Transparent edge
                ctx.fillStyle = plasmaGradient;
                ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
                ctx.fill();
                break;
            case Weapon.RAILGUN:
                // Railgun projectiles are represented by a thick, extended line.
                ctx.strokeStyle = '#0ff'; // Cyan
                ctx.lineWidth = 4;
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(
                    this.x - Math.cos(this.angle) * 30,
                    this.y - Math.sin(this.angle) * 30
                );
                ctx.stroke();
                break;
            case Weapon.MISSILE:
                // Missile drawn as a slightly larger orange circle with a simple trail.
                ctx.fillStyle = '#ffa500'; // Orange
                ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
                ctx.fill();
                // Draw a basic trail.
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)';
                ctx.lineWidth = 2;
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(
                    this.x - Math.cos(this.angle) * 10,
                    this.y - Math.sin(this.angle) * 10
                );
                ctx.stroke();
                break;
            default:
                // Fallback rendering for any undefined weapon types.
                ctx.fillStyle = '#fff';
                ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
    }
}
