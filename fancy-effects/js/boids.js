import { startLoop, updateCanvasSizes, setHashAutoFocus } from "./canvasUtil.js";
import { randomChoice, randomFloat, randomInt } from "./util.js";

const canvas = document.getElementById("boids-canvas");
updateCanvasSizes(canvas)

/**
 * @type CanvasRenderingContext2D
 */
const ctx = canvas.getContext("2d");

const boidsNum = 200;

const turnFactor = 0.2;
const visualRange = 40;
const protectedRange = 8;
const centeringFactor = 0.0005;
const avoidFactor = 0.05;
const matchingFactor = 0.05;
const maxSpeed = 6;
const minSpeed = 3;
const maxBias = 0.01;
const biasIncrement = 0.00004;
const defaultBiasVal = 0.001;

const inBoundaryArea = 0.8;
let boundaryWidth;
let boundaryHeight;
let boundaryX;
let boundaryY;

let boids = [];

class Boid {
    constructor(scoutGroup, biasValue = defaultBiasVal) {

        this.x = randomInt(boundaryX, boundaryX + boundaryWidth);
        this.y = randomInt(boundaryY, boundaryY + boundaryHeight);

        this.vx = randomFloat(-1, 1);
        this.vy = randomFloat(-1, 1);

        this.biasValue = biasValue;
        this.scoutGroup = scoutGroup;
    }

    draw() {
        const angle = Math.atan2(this.vy, this.vx);

        ctx.save();

        ctx.translate(this.x, this.y);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(4, 0);
        ctx.lineTo(-4, -3);
        ctx.lineTo(-4, 3);
        ctx.closePath();

        ctx.fillStyle = "white";
        // ctx.fillStyle = this.scoutGroup === 1 ? "blue" : "green";
        ctx.fill();

        ctx.restore();
    }

    update() {
        let xPosAvg = 0, yPosAvg = 0, xVelAvg = 0, yVelAvg = 0;
        let neighboringBoids = 0;
        let closeDx = 0, closeDy = 0;

        for (const other of boids) {
            if (other === this) continue;

            const dx = this.x - other.x;
            const dy = this.y - other.y;

            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < protectedRange) {
                closeDx += dx;
                closeDy += dy;
            } else if (dist < visualRange) {
                xPosAvg += other.x;
                yPosAvg += other.y;
                xVelAvg += other.vx;
                yVelAvg += other.vy;
                neighboringBoids++;
            }
        }

        // Alignment and Cohesion
        if (neighboringBoids > 0) {
            xPosAvg /= neighboringBoids;
            yPosAvg /= neighboringBoids;
            xVelAvg /= neighboringBoids;
            yVelAvg /= neighboringBoids;

            this.vx += (xPosAvg - this.x) * centeringFactor + (xVelAvg - this.vx) * matchingFactor;
            this.vy += (yPosAvg - this.y) * centeringFactor + (yVelAvg - this.vy) * matchingFactor;
        }

        // Separation
        this.vx += closeDx * avoidFactor;
        this.vy += closeDy * avoidFactor;

        // Boundary conditions (stay within the visible boundary)
        if (this.x < boundaryX) this.vx += turnFactor;
        if (this.x > boundaryX + boundaryWidth) this.vx -= turnFactor;
        if (this.y < boundaryY) this.vy += turnFactor;
        if (this.y > boundaryY + boundaryHeight) this.vy -= turnFactor;

        // Bias update
        if (this.scoutGroup === 1) {
            this.biasValue = this.vx > 0 ? Math.min(maxBias, this.biasValue + biasIncrement) : Math.max(biasIncrement, this.biasValue - biasIncrement);
        } else if (this.scoutGroup === 2) {
            this.biasValue = this.vx < 0 ? Math.min(maxBias, this.biasValue + biasIncrement) : Math.max(biasIncrement, this.biasValue - biasIncrement);
        }

        // Apply bias
        if (this.scoutGroup === 1) {
            this.vx = (1 - this.biasValue) * this.vx + this.biasValue * 1;
        } else if (this.scoutGroup === 2) {
            this.vx = (1 - this.biasValue) * this.vx - this.biasValue * 1;
        }

        // Speed adjustment
        const speed = Math.sqrt(this.vx ** 2 + this.vy ** 2);
        if (speed < minSpeed) {
            this.vx = (this.vx / speed) * minSpeed;
            this.vy = (this.vy / speed) * minSpeed;
        }
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
        }

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Clamp
        this.x = Math.max(0, this.x);
        this.y = Math.max(0, this.y);
        this.x = Math.min(canvas.width, this.x);
        this.y = Math.min(canvas.height, this.y);
    }
}

function init() {
    boundaryWidth = canvas.width * inBoundaryArea;
    boundaryHeight = canvas.height * inBoundaryArea;
    boundaryX = (canvas.width - boundaryWidth) / 2;
    boundaryY = (canvas.height - boundaryHeight) / 2;

    boids = Array.from({ length: boidsNum }, () => new Boid(randomChoice([1, 2])));
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the boundary box
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(boundaryX, boundaryY, boundaryWidth, boundaryHeight);
}

function nextFrame() {
    ctx.globalCompositeOperation = "lighter";
    for (const boid of boids) {
        boid.update();
        boid.draw();
    }
}

export default function boid() {
    setHashAutoFocus(canvas);
    startLoop(canvas, init, clear, nextFrame, { resetOnClick: true, resetOnResize: true });
}
