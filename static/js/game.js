class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        this.gridSize = 50; // Size of each grid cell
        // Additional phases: movement, shooting, critical, boarding, end
        this.phases = ['movement', 'shooting', 'critical', 'boarding'];
        this.currentPhaseIndex = 0; // Start at movement
        this.currentPlayer = 'player'; // 'player' or 'ai'
        this.selectedShip = null;
        this.combatLog = document.getElementById('combatLog');

        // Initialize ships with extra stats for critical hit chances, armor, etc.
        this.player = new Ship(this.gridSize * 5, this.gridSize * 5, true);
        this.enemies = [
            new Ship(this.gridSize * 2, this.gridSize * 2),
            new Ship(this.gridSize * 8, this.gridSize * 2)
        ];

        // Define weapons with extended properties: damage, range, accuracy modifier, critical chance
        this.weapons = {
            [Weapon.LASER]: new Weapon(Weapon.LASER, 10, 6, 8, 0.1), // 10 damage, 6 cost, 8 grid range, 10% crit chance
            [Weapon.TORPEDO]: new Weapon(Weapon.TORPEDO, 25, 4, 12, 0.2)
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

        if (this.currentPhase() === 'movement') {
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
                this.logMessage('system', `Ship moved from (${oldX / this.gridSize},${oldY / this.gridSize}) to (${gridX / this.gridSize},${gridY / this.gridSize}).`);
                this.selectedShip = null;
            }
        } else if (this.currentPhase() === 'shooting') {
            // Handle targeting
            const target = this.enemies.find(enemy =>
                Math.abs(enemy.x - x) < this.gridSize && Math.abs(enemy.y - y) < this.gridSize
            );
            if (target && this.isInRange(this.player, target, this.selectedWeapon.range)) {
                this.resolveAttack(this.player, target, this.selectedWeapon);
            }
        } else if (this.currentPhase() === 'critical') {
            // Optionally, handle critical damage resolution clicks
            this.resolveCritical();
        }
        // Other phases (like boarding) could be handled here

        this.draw();
        this.updateUI();
    }

    currentPhase() {
        return this.phases[this.currentPhaseIndex];
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
        // Expand damage resolution to include armor vs. shield effects
        const oldShield = target.shield;
        const oldHull = target.hull;
        // Call damage method on target (which might consider armor, shields, and random crits)
        target.damage(weapon.damage);

        // Determine if a critical hit occurred
        if (Math.random() < weapon.critChance) {
            this.logMessage('critical', `Critical hit by ${weapon.type}! Systems may be impaired.`);
            target.applyCriticalHit(); // Method to handle disabling or degrading systems
        }

        if (oldShield > 0 && target.shield < oldShield) {
            this.logMessage('shield',
                `${weapon.type === Weapon.LASER ? 'Macro batteries' : 'Torpedo'} hit enemy shields! ` +
                `Shield reduced from ${oldShield.toFixed(0)}% to ${target.shield.toFixed(0)}%.`
            );
        } else {
            this.logMessage('hit',
                `Direct hit on enemy hull! ` +
                `Hull integrity reduced from ${oldHull.toFixed(0)}% to ${target.hull.toFixed(0)}%.`
            );
        }

        if (target.hull <= 0) {
            this.enemies = this.enemies.filter(e => e !== target);
            this.logMessage('hit', 'Enemy vessel destroyed!');
        }
    }

    // New method for resolving critical effects (could be expanded to a mini-game or dice roll system)
    resolveCritical() {
        // For now, we simply log that the critical phase is being resolved.
        this.logMessage('critical', 'Resolving critical system damage...');
        // Implement further logic here.
        this.endPhase(); // End critical phase after resolving
    }

    endPhase() {
        // Cycle through phases. For simplicity, we'll cycle back to movement.
        this.currentPhaseIndex = (this.currentPhaseIndex + 1) % this.phases.length;

        // If phase returns to movement and it was AI's turn, swap players.
        if (this.currentPhase() === 'movement') {
            this.currentPlayer = this.currentPlayer === 'player' ? 'ai' : 'player';
            this.logMessage('system', `${this.currentPlayer === 'player' ? 'Your turn, commander.' : 'Enemy turn beginning.'}`);
            if (this.currentPlayer === 'ai') {
                this.aiTurn();
            }
        } else {
            this.logMessage('system', `Entering ${this.currentPhase()} phase.`);
        }

        this.selectedShip = null;
        this.updateUI();
    }

    aiTurn() {
        // Simple AI: move toward the player, then shoot if in range.
        this.enemies.forEach(enemy => {
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const oldX = enemy.x;
            const oldY = enemy.y;
            enemy.x += Math.sign(dx) * this.gridSize;
            enemy.y += Math.sign(dy) * this.gridSize;
            this.logMessage('system',
                `Enemy moved from (${oldX / this.gridSize},${oldY / this.gridSize}) to (${enemy.x / this.gridSize},${enemy.y / this.gridSize}).`
            );
            if (this.isInRange(enemy, this.player, this.weapons[Weapon.LASER].range)) {
                this.logMessage('system', 'Enemy vessel opening fire!');
                this.resolveAttack(enemy, this.player, this.weapons[Weapon.LASER]);
            }
        });
        // End AI phases sequentially:
        this.endPhase(); // e.g., end movement/shooting phase
        this.endPhase(); // proceed through critical/boarding phases as needed
    }

    drawGrid() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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

        // Draw selection highlight for the selected ship
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
            `Phase: ${this.currentPhase()} - ${this.currentPlayer}'s turn`;
        document.getElementById('hullBar').style.width = `${this.player.hull}%`;
        document.getElementById('shieldBar').style.width = `${this.player.shield}%`;
    }

    openShipCustomization(modal, canvas, ctx) {
        // Set current customization values for preview
        document.getElementById('shipColorPicker').value = this.player.color;
        document.getElementById('hullType').value = this.player.hullType;
        document.getElementById('shieldCapacity').value = this.player.maxShield;
        document.getElementById('shieldRegen').value = this.player.shieldRegenRate;
        document.getElementById('macroBatteries').value = this.weapons[Weapon.LASER].damage;
        document.getElementById('torpedoPower').value = this.weapons[Weapon.TORPEDO].damage;
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

        this.player.updateCustomization(config);
        this.weapons[Weapon.LASER].damage = config.macroBatteries;
        this.weapons[Weapon.TORPEDO].damage = config.torpedoPower;
        this.logMessage('system', 'Ship customization complete. New configuration applied.');
        modal.hide();
        this.draw();
        this.updateUI();
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});
