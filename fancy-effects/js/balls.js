import { startLoop, updateCanvasSizes, setHashAutoFocus } from "./canvasUtil.js";
import { randomFloat } from "./util.js";

// TODO balls colliding with balls

const canvas = document.getElementById("balls-canvas");
updateCanvasSizes(canvas);

const ctx = canvas.getContext("2d");

const ballCount = 25;

const gravity = 3.8;
const airDensity = 1.293;
const floorFriction = 0.99;

const colors = ["#f35d4f", "#f36849", "#c0d988", "#6ddaf1", "#f1e85b"];

let allBalls = [];

class Ball {
    constructor() {
        this.radius = randomFloat(5, 20);

        this.mass = 4/3 * Math.PI * Math.pow(this.radius, 3);
        this.referenceArea = Math.PI * Math.pow(this.radius, 2);
        this.dragCoefficient = 0.01;

        this.x = randomFloat(this.radius, canvas.width - this.radius);
        this.y = -this.radius;
        this.vy = 0;
        this.vx = randomFloat(-2, 2);
        this.color = colors[Math.floor(Math.random() * colors.length)];

        this.elasticity = 0.8;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    update() {

        const weight = this.mass * gravity;

        const velocitySquared = Math.pow(this.vx, 2) + Math.pow(this.vy, 2);
        const drag = this.dragCoefficient * (airDensity * velocitySquared) / 2 * this.referenceArea;

        this.vy += (weight - drag) / this.mass;

        this.x += this.vx;
        this.y += this.vy;

        // Floor collision
        if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            this.vy *= -this.elasticity;  // Energy loss on bounce
            this.vx *= floorFriction;
        }

        // Wall collision
        if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius;
            this.vx *= -this.elasticity;
        } else if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx *= -this.elasticity;
        }

        for (const other of allBalls) {
            if (other === this) continue; // Skip self

            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distance = Math.hypot(dx, dy);

            if (distance < this.radius + other.radius) {
                // Collision detected
                const angle = Math.atan2(dy, dx);
                const sin = Math.sin(angle);
                const cos = Math.cos(angle);

                // Rotate velocity vectors
                const vx1 = this.vx * cos + this.vy * sin;
                const vy1 = this.vy * cos - this.vx * sin;
                const vx2 = other.vx * cos + other.vy * sin;
                const vy2 = other.vy * cos - other.vx * sin;

                // Collision reaction
                const totalMass = this.mass + other.mass;
                const newVx1 = ((this.mass - other.mass) * vx1 + 2 * other.mass * vx2) / totalMass;
                const newVx2 = ((other.mass - this.mass) * vx2 + 2 * this.mass * vx1) / totalMass;

                // Rotate velocities back
                this.vx = newVx1 * cos - vy1 * sin;
                this.vy = vy1 * cos + newVx1 * sin;
                other.vx = newVx2 * cos - vy2 * sin;
                other.vy = vy2 * cos + newVx2 * sin;

                // Move balls apart to prevent sticking
                const overlap = this.radius + other.radius - distance;
                this.x += overlap * cos * (this.radius / (this.radius + other.radius));
                this.y += overlap * sin * (this.radius / (this.radius + other.radius));
                other.x -= overlap * cos * (other.radius / (this.radius + other.radius));
                other.y -= overlap * sin * (other.radius / (this.radius + other.radius));
            }
        }
    }
}

function init() {
    allBalls = Array.from({ length: ballCount }, () => new Ball());
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function nextFrame() {
    ctx.globalCompositeOperation = "lighter";

    for (const ball of allBalls) {
        ball.update();
        ball.draw();
    }
}

export default function balls() {
    setHashAutoFocus(canvas);
    startLoop(canvas, init, clear, nextFrame, { resetOnClick: true, resetOnResize: true });
}