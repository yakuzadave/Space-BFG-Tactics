class Weapon {
    static LASER = 'laser';
    static TORPEDO = 'torpedo';

    constructor(type, damage, speed, range) {
        this.type = type;
        this.damage = damage;
        this.speed = speed;
        this.range = range;
    }
}

class Projectile {
    constructor(x, y, angle, weapon) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.weapon = weapon;
        this.distance = 0;
        this.velocity = {
            x: Math.cos(angle) * weapon.speed,
            y: Math.sin(angle) * weapon.speed
        };
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.distance += Math.sqrt(
            this.velocity.x * this.velocity.x + 
            this.velocity.y * this.velocity.y
        );
    }

    draw(ctx) {
        ctx.beginPath();
        if (this.weapon.type === Weapon.LASER) {
            ctx.strokeStyle = '#ff0';
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x - Math.cos(this.angle) * 20,
                this.y - Math.sin(this.angle) * 20
            );
        } else {
            ctx.fillStyle = '#f00';
            ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.stroke();
    }
}
