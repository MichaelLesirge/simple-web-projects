import { startLoop, updateCanvasSizes, setHashAutoFocus } from "./canvasUtil.js";
import { randomFloat } from "./util.js";

const canvas = document.getElementById("lorenz-canvas");
updateCanvasSizes(canvas);
const ctx = canvas.getContext("2d");

const rho = 28;
const sigma = 10;
const beta = 8 / 3;
const dt = 0.005;
const scale = 10;

class LorenzPoint {
    constructor(x, y, z, color) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.color = color;

        this.points = [];
    }

    update() {
        const dx = sigma * (this.y - this.x) * dt;
        const dy = (this.x * (rho - this.z) - this.y) * dt;
        const dz = (this.x * this.y - beta * this.z) * dt;

        this.lastX = this.x;
        this.lastY = this.y;

        this.x += dx;
        this.y += dy;
        this.z += dz;
    }

    draw() {
        const screenX = this.x * scale + canvas.width / 2;
        const screenY = this.y * scale + canvas.height / 2;

        this.points.push({ x: screenX, y: screenY });

        for (let i = 0; i < this.points.length - 1; i++) {
            const p1 = this.points[i];
            const p2 = this.points[i + 1];

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
}

let objects = [];

function init() {
    const x = randomFloat(-0.1, 0.1);
    const y = randomFloat(-0.1, 0.1);
    const z = randomFloat(-0.1, 0.1);

    console.log({ rho, sigma, beta }, { x, y, z });
    

    objects = [
        new LorenzPoint(x, y, z, '#FFD700'),

        new LorenzPoint(
            x + randomFloat(-0.01, 0.01),
            y + randomFloat(-0.01, 0.01),
            z + randomFloat(-0.01, 0.01),
            '#FF6B6B'  // Coral red
        )
    ];
}

function clear() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function nextFrame() {    
    for (const obj of objects) {
        obj.update();
        obj.draw();
    }
    
    ctx.beginPath();
    ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
    ctx.shadowBlur = 5;
    for (const obj of objects) {
        ctx.arc(obj.lastX * scale + canvas.width / 2, obj.lastY * scale + canvas.height / 2, 2, 0, Math.PI * 2);
        ctx.fillStyle = obj.color;
        ctx.fill();
    }
    ctx.fill();
    ctx.shadowBlur = 0;
}

export default function lorenz() {
    setHashAutoFocus(canvas);
    startLoop(canvas, init, clear, nextFrame, { resetOnClick: true, resetOnResize: true });
}