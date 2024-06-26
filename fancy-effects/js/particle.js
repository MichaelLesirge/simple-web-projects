import { startLoop, updateCanvasSizes } from "./canvasUtil.js";
import { randomChoice, randomFloat } from "./util.js";

const canvas = document.getElementById("particle-canvas");
updateCanvasSizes(canvas)

const ctx = canvas.getContext("2d");

const particlesNum = 100;
const distanceConnect = 100;

const colors = ["#f35d4f", "#f36849", "#c0d988", "#6ddaf1", "#f1e85b"];

let particles = [];

class Particle {
    constructor() {
        this.x = randomFloat(0, 1);
        this.y = randomFloat(0, 1);

        this.radius = randomFloat(1, 2);
        this.color = randomChoice(colors);

        this.vx = randomFloat(-1.5, 1.5);
        this.vy = randomFloat(-1.5, 1.5);

        this.connections = [];
    }

    draw() {

        const [x, y] = [this.getX(), this.getY()]

        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;

        ctx.beginPath();
        ctx.arc(x, y, this.radius * this.connections.length, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(x, y, (this.radius + 5) * this.connections.length, 0, Math.PI * 2, true);
        ctx.stroke();
        ctx.closePath();

        for (const otherParticle of this.connections) {
            ctx.strokeStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(otherParticle.getX(), otherParticle.getY());
            ctx.stroke();
        }
    }

    getX() {
        return this.x * canvas.width;
    }

    getY() {
        return this.y * canvas.height;
    }


    findDistance(other) {
        return Math.sqrt((this.getX() - other.getX()) ** 2 + (this.getY() - other.getY()) ** 2);
    }

    update() {
        this.x += (this.vx / canvas.width);
        this.y += (this.vy / canvas.height);

        if (this.x > 1) this.x = 0;
        if (this.x < 0) this.x = 1;
        if (this.y > 1) this.y = 0;
        if (this.y < 0) this.y = 1;

        this.connections = particles.filter(
            (otherParticle) => this.color === otherParticle.color &&
                this.findDistance(otherParticle) < distanceConnect
        );
    }
}

function init() {
    particles = Array.from({ length: particlesNum }, () => new Particle())
};

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function nextFrame() {

    ctx.globalCompositeOperation = "lighter";

    for (const particle of particles) {

        particle.update();

        particle.draw();

    }
}

export default function particle() {
    startLoop(canvas, init, clear, nextFrame, { resetOnClick: true, resetOnResize: false })
}
