class AI {
    constructor(ship, playerShip) {
        this.ship = ship;
        this.playerShip = playerShip;
        this.state = 'chase'; // chase, attack, retreat
        this.nextStateChange = 0;
    }

    update() {
        const dx = this.playerShip.x - this.ship.x;
        const dy = this.playerShip.y - this.ship.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Update state based on conditions
        if (this.ship.hull < 30) {
            this.state = 'retreat';
        } else if (distance < 200) {
            this.state = 'attack';
        } else {
            this.state = 'chase';
        }

        // Execute current state behavior
        switch (this.state) {
            case 'chase':
                this.chase(dx, dy);
                break;
            case 'attack':
                this.attack(dx, dy, distance);
                break;
            case 'retreat':
                this.retreat(dx, dy);
                break;
        }
    }

    chase(dx, dy) {
        this.ship.angle = Math.atan2(dy, dx);
        Physics.accelerate(this.ship, this.ship.angle, 0.1);
    }

    attack(dx, dy, distance) {
        this.ship.angle = Math.atan2(dy, dx);
        if (distance > 100) {
            Physics.accelerate(this.ship, this.ship.angle, 0.05);
        }
    }

    retreat(dx, dy) {
        this.ship.angle = Math.atan2(-dy, -dx);
        Physics.accelerate(this.ship, this.ship.angle, 0.15);
    }
}
