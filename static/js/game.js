class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        this.gridSize = 50; // Size of each grid cell
        this.currentPhase = 'movement'; // movement, shooting, end
        this.currentPlayer = 'player'; // player or ai
        this.selectedShip = null;

        this.player = new Ship(this.gridSize * 5, this.gridSize * 5, true);
        this.enemies = [
            new Ship(this.gridSize * 2, this.gridSize * 2),
            new Ship(this.gridSize * 8, this.gridSize * 2)
        ];

        this.weapons = {
            [Weapon.LASER]: new Weapon(Weapon.LASER, 10, 6, 8), // range in grid cells
            [Weapon.TORPEDO]: new Weapon(Weapon.TORPEDO, 25, 4, 12)
        };
        this.selectedWeapon = this.weapons[Weapon.LASER];

        this.setupEventListeners();
        this.drawGrid();
        this.updateUI();
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleGridClick(x, y);
        });

        document.getElementById('endPhaseBtn').addEventListener('click', () => {
            this.endPhase();
        });

        document.getElementById('laserBtn').addEventListener('click', () => {
            this.selectedWeapon = this.weapons[Weapon.LASER];
        });
        document.getElementById('torpedoBtn').addEventListener('click', () => {
            this.selectedWeapon = this.weapons[Weapon.TORPEDO];
        });
    }

    handleGridClick(x, y) {
        const gridX = Math.floor(x / this.gridSize) * this.gridSize;
        const gridY = Math.floor(y / this.gridSize) * this.gridSize;

        if (this.currentPhase === 'movement') {
            // Handle ship selection and movement
            const clickedShip = [this.player, ...this.enemies].find(ship => 
                Math.abs(ship.x - x) < this.gridSize && Math.abs(ship.y - y) < this.gridSize
            );

            if (clickedShip && clickedShip.isPlayer && this.currentPlayer === 'player') {
                this.selectedShip = clickedShip;
            } else if (this.selectedShip && this.isValidMove(gridX, gridY)) {
                this.selectedShip.x = gridX;
                this.selectedShip.y = gridY;
                this.selectedShip = null;
            }
        } else if (this.currentPhase === 'shooting') {
            // Handle targeting
            const target = this.enemies.find(enemy => 
                Math.abs(enemy.x - x) < this.gridSize && Math.abs(enemy.y - y) < this.gridSize
            );
            if (target && this.isInRange(this.player, target, this.selectedWeapon.range)) {
                this.resolveAttack(this.player, target, this.selectedWeapon);
            }
        }

        this.draw();
        this.updateUI();
    }

    isValidMove(x, y) {
        // Check if the new position is within movement range (3 grid cells)
        const dx = Math.abs(x - this.selectedShip.x) / this.gridSize;
        const dy = Math.abs(y - this.selectedShip.y) / this.gridSize;
        return dx + dy <= 3; // Manhattan distance for simplicity
    }

    isInRange(attacker, target, range) {
        const dx = Math.abs(target.x - attacker.x) / this.gridSize;
        const dy = Math.abs(target.y - attacker.y) / this.gridSize;
        return Math.sqrt(dx * dx + dy * dy) <= range;
    }

    resolveAttack(attacker, target, weapon) {
        target.damage(weapon.damage);
        if (target.hull <= 0) {
            this.enemies = this.enemies.filter(e => e !== target);
        }
    }

    endPhase() {
        if (this.currentPhase === 'movement') {
            this.currentPhase = 'shooting';
        } else if (this.currentPhase === 'shooting') {
            if (this.currentPlayer === 'player') {
                this.currentPlayer = 'ai';
                this.currentPhase = 'movement';
                this.aiTurn();
            } else {
                this.currentPlayer = 'player';
                this.currentPhase = 'movement';
            }
        }
        this.selectedShip = null;
        this.updateUI();
    }

    aiTurn() {
        // Simple AI: Move towards player and shoot if in range
        this.enemies.forEach(enemy => {
            // Move closer to player
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            enemy.x += Math.sign(dx) * this.gridSize;
            enemy.y += Math.sign(dy) * this.gridSize;

            // Shoot if in range
            if (this.isInRange(enemy, this.player, this.weapons[Weapon.LASER].range)) {
                this.resolveAttack(enemy, this.player, this.weapons[Weapon.LASER]);
            }
        });
        this.endPhase(); // End AI movement phase
        this.endPhase(); // End AI shooting phase
    }

    drawGrid() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;

        for (let x = 0; x < this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    draw() {
        this.drawGrid();

        // Draw selection highlight
        if (this.selectedShip) {
            this.ctx.strokeStyle = '#0f0';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                this.selectedShip.x - this.gridSize/2,
                this.selectedShip.y - this.gridSize/2,
                this.gridSize,
                this.gridSize
            );
        }

        this.player.draw(this.ctx);
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
    }

    updateUI() {
        document.getElementById('phaseInfo').textContent = 
            `Phase: ${this.currentPhase} - ${this.currentPlayer}'s turn`;
        document.getElementById('hullBar').style.width = `${this.player.hull}%`;
        document.getElementById('shieldBar').style.width = `${this.player.shield}%`;
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});