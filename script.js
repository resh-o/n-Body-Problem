

class Body {
    constructor(x, y, vx, vy, mass, color, name) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.mass = mass;
        this.color = color;
        this.name = name;
        this.ax = 0;
        this.ay = 0;
        this.trail = [];
    }

    update(dt, newAx, newAy) {
        // Corrected Velocity Verlet integration
        this.vx += 0.5 * (this.ax + newAx) * dt;
        this.vy += 0.5 * (this.ay + newAy) * dt;
        this.x += this.vx * dt + 0.5 * newAx * dt * dt;
        this.y += this.vy * dt + 0.5 * newAy * dt * dt;

        this.ax = newAx;
        this.ay = newAy;

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 200) {
            this.trail.shift();
        }
    }

    draw(ctx) {
        // Draw trail
        ctx.beginPath();
        const gradient = ctx.createLinearGradient(this.trail[0]?.x, this.trail[0]?.y, this.x, this.y);
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(1, this.color);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.moveTo(this.trail[0]?.x, this.trail[0]?.y);
        for (let i = 1; i < this.trail.length; i++) {
            ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        ctx.stroke();

        // Draw body with glow
        const radius = Math.log(this.mass) * 2;
        ctx.beginPath();
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, radius * 2);
        glow.addColorStop(0, this.color);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(this.x - radius * 2, this.y - radius * 2, radius * 4, radius * 4);

        // Draw body core
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class NBodySimulation {
    constructor(bodies) {
        this.bodies = bodies;
        this.G = 1; // Gravitational constant
        this.dt = 0.1; // Time step
    }

    computeAccelerations() {
        const accelerations = [];
        for (let i = 0; i < this.bodies.length; i++) {
            let ax = 0;
            let ay = 0;
            for (let j = 0; j < this.bodies.length; j++) {
                if (i === j) continue;
                const bodyA = this.bodies[i];
                const bodyB = this.bodies[j];
                const dx = bodyB.x - bodyA.x;
                const dy = bodyB.y - bodyA.y;
                const distSq = dx * dx + dy * dy;
                const softening = 100; // Softening factor to avoid extreme forces at close range
                const force = (this.G * bodyB.mass) / (distSq + softening);
                const angle = Math.atan2(dy, dx);
                ax += force * Math.cos(angle);
                ay += force * Math.sin(angle);
            }
            accelerations.push({ ax, ay });
        }
        return accelerations;
    }

    update() {
        const accelerations = this.computeAccelerations();
        for (let i = 0; i < this.bodies.length; i++) {
            this.bodies[i].update(this.dt, accelerations[i].ax, accelerations[i].ay);
        }
    }
}

class SimulationController {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.starfield = this.createStarfield();

        const bodies = [
            new Body(this.canvas.width / 2, this.canvas.height / 2, 0, 0, 10000, "yellow", "Sun"),
            new Body(this.canvas.width / 2 + 200, this.canvas.height / 2, 0, 2.5, 100, "dodgerblue", "Earth"),
            new Body(this.canvas.width / 2 + 300, this.canvas.height / 2, 0, 2, 50, "red", "Mars")
        ];

        this.simulation = new NBodySimulation(bodies);
        this.animate = this.animate.bind(this);
    }

    createStarfield() {
        const stars = [];
        for (let i = 0; i < 500; i++) {
            stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 1.5,
                alpha: Math.random()
            });
        }
        return stars;
    }

    drawStarfield() {
        this.ctx.save();
        for (const star of this.starfield) {
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    start() {
        this.animate();
    }

    animate() {
        this.simulation.update();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawStarfield();
        for (const body of this.simulation.bodies) {
            body.draw(this.ctx);
        }
        requestAnimationFrame(this.animate);
    }
}

const controller = new SimulationController("nbody-canvas");
controller.start();
