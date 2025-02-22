class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        this.gridSize = 50; // Size of each grid cell
        this.currentPhase = 'movement'; // movement, shooting, end
        this.currentPlayer = 'player'; // player or ai
        this.selectedShip = null;
        this.combatLog = document.getElementById('combatLog');

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
        this.logMessage('system', 'Combat engagement initiated. Standing by for orders.');
    }

    logMessage(type, message) {
        const entry = document.createElement('div');
        entry.className = type;
        entry.textContent = `> ${message}`;
        this.combatLog.appendChild(entry);
        this.combatLog.scrollTop = this.combatLog.scrollHeight;
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
            this.logMessage('system', 'Macro batteries armed and ready.');
        });

        document.getElementById('torpedoBtn').addEventListener('click', () => {
            this.selectedWeapon = this.weapons[Weapon.TORPEDO];
            this.logMessage('system', 'Torpedo tubes loaded and ready to fire.');
        });

        // Ship customization
        const customizeBtn = document.getElementById('customizeShipBtn');
        const modal = new bootstrap.Modal(document.getElementById('shipCustomizationModal'));
        const previewCanvas = document.getElementById('shipPreviewCanvas');
        const previewCtx = previewCanvas.getContext('2d');

        customizeBtn.addEventListener('click', () => {
            this.openShipCustomization(modal, previewCanvas, previewCtx);
        });

        document.getElementById('saveShipBtn').addEventListener('click', () => {
            this.saveShipCustomization(modal);
        });

        // Update preview when customization changes
        const updatePreview = () => this.updateShipPreview(previewCtx, previewCanvas.width, previewCanvas.height);

        document.getElementById('shipColorPicker').addEventListener('input', updatePreview);
        document.getElementById('hullType').addEventListener('change', updatePreview);
        document.getElementById('shieldCapacity').addEventListener('input', updatePreview);
        document.getElementById('shieldRegen').addEventListener('input', updatePreview);
        document.getElementById('macroBatteries').addEventListener('input', updatePreview);
        document.getElementById('torpedoPower').addEventListener('input', updatePreview);
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
                this.logMessage('system', 'Ship selected. Awaiting movement orders.');
            } else if (this.selectedShip && this.isValidMove(gridX, gridY)) {
                const oldX = this.selectedShip.x;
                const oldY = this.selectedShip.y;
                this.selectedShip.x = gridX;
                this.selectedShip.y = gridY;
                this.selectedShip = null;
                this.logMessage('system', `Ship moved from grid (${Math.floor(oldX / this.gridSize)},${Math.floor(oldY / this.gridSize)}) to (${Math.floor(gridX / this.gridSize)},${Math.floor(gridY / this.gridSize)})`);
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
        const oldShield = target.shield;
        const oldHull = target.hull;
        target.damage(weapon.damage);

        if (oldShield > 0) {
            this.logMessage('shield',
                `${weapon.type === Weapon.LASER ? 'Macro batteries' : 'Torpedo'} hit enemy shields! ` +
                `Shield strength reduced from ${oldShield.toFixed(0)}% to ${target.shield.toFixed(0)}%`
            );
        } else {
            this.logMessage('hit',
                `Direct hit on enemy hull! ` +
                `Hull integrity reduced from ${oldHull.toFixed(0)}% to ${target.hull.toFixed(0)}%`
            );
        }

        if (target.hull <= 0) {
            this.enemies = this.enemies.filter(e => e !== target);
            this.logMessage('hit', 'Enemy vessel destroyed!');
        }
    }

    endPhase() {
        if (this.currentPhase === 'movement') {
            this.currentPhase = 'shooting';
            this.logMessage('system', 'Movement phase complete. Entering shooting phase.');
        } else if (this.currentPhase === 'shooting') {
            if (this.currentPlayer === 'player') {
                this.currentPlayer = 'ai';
                this.currentPhase = 'movement';
                this.logMessage('system', 'Enemy turn beginning.');
                this.aiTurn();
            } else {
                this.currentPlayer = 'player';
                this.currentPhase = 'movement';
                this.logMessage('system', 'Your turn, commander.');
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
            const oldX = enemy.x;
            const oldY = enemy.y;
            enemy.x += Math.sign(dx) * this.gridSize;
            enemy.y += Math.sign(dy) * this.gridSize;

            this.logMessage('system',
                `Enemy vessel moved from grid (${Math.floor(oldX / this.gridSize)},${Math.floor(oldY / this.gridSize)}) ` +
                `to (${Math.floor(enemy.x / this.gridSize)},${Math.floor(enemy.y / this.gridSize)})`
            );

            // Shoot if in range
            if (this.isInRange(enemy, this.player, this.weapons[Weapon.LASER].range)) {
                this.logMessage('system', 'Enemy vessel opening fire!');
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
                this.selectedShip.x - this.gridSize / 2,
                this.selectedShip.y - this.gridSize / 2,
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

    openShipCustomization(modal, canvas, ctx) {
        // Set current values
        document.getElementById('shipColorPicker').value = this.player.color;
        document.getElementById('hullType').value = this.player.hullType;
        document.getElementById('shieldCapacity').value = this.player.maxShield;
        document.getElementById('shieldRegen').value = this.player.shieldRegenRate;
        document.getElementById('macroBatteries').value = this.weapons[Weapon.LASER].damage;
        document.getElementById('torpedoPower').value = this.weapons[Weapon.TORPEDO].damage;

        // Draw initial preview
        this.updateShipPreview(ctx, canvas.width, canvas.height);

        modal.show();
    }

    updateShipPreview(ctx, width, height) {
        const previewShip = new Ship(0, 0, true);
        previewShip.color = document.getElementById('shipColorPicker').value;
        previewShip.hullType = document.getElementById('hullType').value;
        previewShip.maxShield = parseInt(document.getElementById('shieldCapacity').value);
        previewShip.shieldRegenRate = parseInt(document.getElementById('shieldRegen').value);

        previewShip.drawPreview(ctx, width, height);
    }

    saveShipCustomization(modal) {
        const config = {
            color: document.getElementById('shipColorPicker').value,
            hullType: document.getElementById('hullType').value,
            shieldCapacity: parseInt(document.getElementById('shieldCapacity').value),
            shieldRegen: parseInt(document.getElementById('shieldRegen').value),
            macroBatteries: parseInt(document.getElementById('macroBatteries').value),
            torpedoPower: parseInt(document.getElementById('torpedoPower').value)
        };

        // Update player ship
        this.player.updateCustomization(config);

        // Update weapons
        this.weapons[Weapon.LASER].damage = config.macroBatteries;
        this.weapons[Weapon.TORPEDO].damage = config.torpedoPower;

        this.logMessage('system', 'Ship customization complete. New configuration applied.');
        modal.hide();

        // Redraw game
        this.draw();
        this.updateUI();
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});