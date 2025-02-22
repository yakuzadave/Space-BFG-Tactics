class Physics {
    static applyInertia(object) {
        object.x += object.velocity.x;
        object.y += object.velocity.y;
        
        // Apply drag
        object.velocity.x *= 0.99;
        object.velocity.y *= 0.99;
    }

    static accelerate(object, angle, thrust) {
        object.velocity.x += Math.cos(angle) * thrust;
        object.velocity.y += Math.sin(angle) * thrust;
    }

    static checkCollision(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (obj1.radius + obj2.radius);
    }
}
