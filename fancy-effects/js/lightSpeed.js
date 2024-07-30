import { startLoop, updateCanvasSizes, setHashAutoFocus } from "./canvasUtil.js";
import { randomChoice, randomFloat, randomInt } from "./util.js";

const maxSpeed = 10;
const minSpeed = 0;
const speedChange = 0.2;

const speedChangeSeconds = 10;

const canvas = document.getElementById("light-speed-canvas");
updateCanvasSizes(canvas);
const ctx = canvas.getContext('2d');

ctx.shadowBlur = 10;
ctx.shadowColor = '#FD0100';
ctx.lineCap = "round";


let stars = [];
let speed = 10;
let increaseSpeed = false;

class Star {
    constructor(location) {
        this.location = location;
        this.radius = randomFloat(2, 6);
        this.color = randomChoice(["#FEF1BA", "#7e7863", "#ad7d37", "#2e557c", "#381010", "#334e30"])
    }

    update() {
        let center = {
            x: canvas.width / 2,
            y: canvas.height / 2
        };
        let angle = Math.atan2(
            this.location.y - center.y,
            this.location.x - center.x
        );
        this.location.x += speed * Math.cos(angle);
        this.location.y += speed * Math.sin(angle);

        if (this.isCompletelyOffCanvas()) {
            this.resetPosition();
        }

        let distToCenter = Math.sqrt(
            Math.pow(this.location.x - center.x, 2) +
            Math.pow(this.location.y - center.y, 2)
        );
        this.radius = 1 + 3 * distToCenter / Math.max(canvas.width, canvas.height);
    }

    isCompletelyOffCanvas() {
        return (
            this.location.x + this.radius < -canvas.width / 2 ||
            this.location.x - this.radius > canvas.width * 1.5 ||
            this.location.y + this.radius < -canvas.height / 2 ||
            this.location.y - this.radius > canvas.height * 1.5
        );
    }

    resetPosition() {
        const w = canvas.width / 3;
        const h = canvas.height / 3;
        this.location.x = randomFloat(w, canvas.width - w);
        this.location.y = randomFloat(h, canvas.height - h);
    }

    draw(ctx) {
        let center = {
            x: canvas.width / 2,
            y: canvas.height / 2
        };
        let weight = 80 - 70 * (speed / maxSpeed);
        let pastLocation = {
            x: (weight * this.location.x + center.x) / (weight + 1),
            y: (weight * this.location.y + center.y) / (weight + 1),
        };
        
        ctx.beginPath();
        ctx.moveTo(this.location.x, this.location.y);
        ctx.lineTo(pastLocation.x, pastLocation.y);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.radius;
        ctx.stroke();
    }
}

function init() {
    const numberOfStars = canvas.width / 10;
    for (let i = 0; i < numberOfStars; i++) {
        let loc = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        };
        stars.push(new Star(loc));
    }
}

function clear() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

setInterval(() => increaseSpeed = !increaseSpeed, 1000 * speedChangeSeconds)

function draw() {

    if (increaseSpeed) {
        speed += speedChange;
    } else {
        speed -= speedChange;
    }
    speed = Math.max(minSpeed, Math.min(speed, maxSpeed));

    clear();
    for (let i = 0; i < stars.length; i++) {
        stars[i].update();
        stars[i].draw(ctx);
    }
}

export default function lightSpeed() {
    setHashAutoFocus(canvas);
    startLoop(canvas, init, clear, draw, { resetOnClick: false, resetOnResize: true });
}