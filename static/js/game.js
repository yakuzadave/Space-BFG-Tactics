class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        this.player = new Ship(this.canvas.width/2, this.canvas.height/2, true);
        this.enemies = [
            new Ship(100, 100),
            new Ship(this.canvas.width-100, 100)
        ];
        this.projectiles = [];
        this.enemyAIs = this.enemies.map(enemy => new AI(enemy, this.player));

        this.weapons = {
            [Weapon.LASER]: new Weapon(Weapon.LASER, 10, 15, 400),
            [Weapon.TORPEDO]: new Weapon(Weapon.TORPEDO, 25, 8, 600)
        };
        this.selectedWeapon = this.weapons[Weapon.LASER];

        this.keys = {};
        this.setupEventListeners();
        this.gameLoop();
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keydown', (e) => {
            if (e.key === ' ') this.fireWeapon();
        });
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
        window.addEventListener('resize', () => this.resizeCanvas());

        document.getElementById('laserBtn').addEventListener('click', () => {
            this.selectedWeapon = this.weapons[Weapon.LASER];
        });
        document.getElementById('torpedoBtn').addEventListener('click', () => {
            this.selectedWeapon = this.weapons[Weapon.TORPEDO];
        });
    }

    fireWeapon() {
        this.projectiles.push(new Projectile(
            this.player.x + Math.cos(this.player.angle) * 20,
            this.player.y + Math.sin(this.player.angle) * 20,
            this.player.angle,
            this.selectedWeapon
        ));
    }

    update() {
        // Player controls
        if (this.keys['ArrowLeft']) this.player.angle -= 0.05;
        if (this.keys['ArrowRight']) this.player.angle += 0.05;
        if (this.keys['ArrowUp']) {
            Physics.accelerate(this.player, this.player.angle, 0.2);
        }

        // Update all game objects
        this.player.update();
        this.enemies.forEach(enemy => enemy.update());
        this.enemyAIs.forEach(ai => ai.update());
        
        // Update projectiles and check collisions
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.update();
            
            // Check collision with enemies
            this.enemies.forEach(enemy => {
                if (Physics.checkCollision(projectile, enemy)) {
                    enemy.damage(projectile.weapon.damage);
                    return false;
                }
            });

            // Remove if out of range
            return projectile.distance < projectile.weapon.range;
        });

        // Update UI
        document.getElementById('hullBar').style.width = `${this.player.hull}%`;
        document.getElementById('shieldBar').style.width = `${this.player.shield}%`;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.player.draw(this.ctx);
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.projectiles.forEach(projectile => projectile.draw(this.ctx));
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});
