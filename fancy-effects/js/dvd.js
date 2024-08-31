import { startLoop, updateCanvasSizes, setHashAutoFocus } from "./canvasUtil.js";
import { charRange, randomChoice, randomFloat, randomInt } from "./util.js";

const canvas = document.getElementById("dvd-canvas");
updateCanvasSizes(canvas);

canvas.style.filter = "contrast(1.2) brightness(0.9) sepia(0.5) saturate(0.8)";

const ctx = canvas.getContext("2d");
ctx.willReadFrequently = true;

let logo;
let confettiParticles;

class Confetti {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = randomInt(2, 6);
        this.dx = randomFloat(-2, 2);
        this.dy = randomFloat(-2, 2);
        this.color = `hsl(${randomInt(0, 360)}, 100%, 50%)`;
        this.lifespan = 1000;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.dy += 0.1; // gravity
        this.lifespan -= 1;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }

    isAlive() {
        return this.lifespan > 0;
    }
}

class Logo {
    constructor(image) {
        this.image = image;

        const corners = [
            { x: 0, y: 0, dx: 1, dy: 1 },
            { x: 0, y: canvas.height - image.height, dx: 1, dy: -1 },
            { x: canvas.width - image.width, y: 0, dx: -1, dy: 1 },
            { x: canvas.width - image.width, y: canvas.height - image.height, dx: -1, dy: -1 },
        ];

        const randomCorner = randomChoice(corners);

        const numBounces = randomInt(3, 15);

        console.log(numBounces, randomCorner);

        const result = this.simulateMovement(randomCorner, numBounces);

        this.x = result.x;
        this.y = result.y;
        this.dx = -result.dx;
        this.dy = -result.dy;

        this.speed = 5;

        this.hue = 0;
        ctx.filter = `hue-rotate(${this.hue}deg)`;

        this.confettiParticles = [];
    }

    simulateMovement(corner, bounces) {

        let {x, y, dx, dy} = corner;

        let speed = 5;
        let bounceCount = 0;

        while (bounceCount < bounces) {
            x += dx * speed;
            y += dy * speed;

            let bounced = false;

            if (x <= 0 || x + this.image.width >= canvas.width) {
                dx *= -1;
                bounced = true;
            }

            if (y <= 0 || y + this.image.height >= canvas.height) {
                dy *= -1;
                bounced = true;
            }

            if (bounced) {
                bounceCount += 1;
            }
        }

        const extraSteps = randomInt(50, 100);
        let i = 0;
        while (
            i < extraSteps
            || (x < image.width || x > canvas.width - image.width)
            || (y < image.height || y > canvas.height - image.height)
        ) {

            i++;

            x += dx * speed;
            y += dy * speed;

            if (x <= 0 || x + this.image.width >= canvas.width) {
                dx *= -1;
            }

            if (y <= 0 || y + this.image.height >= canvas.height) {
                dy *= -1;
            }
        }

        return { x, y, dx, dy };
    }

    update() {
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;

        let bounced = false;

        if (this.x <= 0 || this.x + this.image.width >= canvas.width) {
            this.dx *= -1;
            bounced = true;
        }

        if (this.y <= 0 || this.y + this.image.height >= canvas.height) {
            this.dy *= -1;
            bounced = true;
        }

        if (bounced) {
            this.hue = (this.hue + 30) % 360;
            ctx.filter = `hue-rotate(${this.hue}deg)`;

            // Check if it's a corner and generate confetti
            if ((this.x <= 0 || this.x + this.image.width >= canvas.width) &&
                (this.y <= 0 || this.y + this.image.height >= canvas.height)) {
                this.createConfetti();
            }
        }
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y);
    }

    createConfetti() {
        for (let i = 0; i < 50; i++) {
            confettiParticles.push(new Confetti(this.x + this.image.width / 2, this.y + this.image.height / 2));
        }
    }
}

const svg = `
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
    enable-background="new 0 0 48 48" xml:space="preserve" viewBox="2 15 44 18" width="300">
    <path fill="#42A5F5"
        d="M24.002,27c-12.154,0-22,1.343-22,3.006c0,1.653,9.845,2.994,22,2.994c12.156,0,22-1.341,22-2.994
        C46.002,28.343,36.158,27,24.002,27z M24.002,30.972c-2.863,0-5.191-0.494-5.191-1.104c0-0.609,2.329-1.104,5.191-1.104
        c2.862,0,5.193,0.495,5.193,1.104C29.195,30.478,26.864,30.972,24.002,30.972z">
    </path>
    <path fill="#1565C0"
        d="M21.29,15l2.371,6.43L29.25,15h9.486c4.647,0,7.906,2.148,7.158,4.904c-0.745,2.756-5.178,4.904-9.803,4.904
        h-6.295c0,0,0.141-0.043,0.172-0.126c0.246-0.944,1.707-6.264,1.725-6.347c0.02-0.102-0.105-0.133-0.105-0.133h4.572
        c0,0-0.088-0.006-0.125,0.133c-0.023,0.078-0.947,3.429-1.145,4.176c-0.023,0.094-0.162,0.139-0.162,0.139h1.094
        c2.594,0,5.047-0.828,5.563-2.748c0.473-1.752-1.244-2.746-4.039-2.746h-1.014l-4.375,0.004l-10.043,9.932l-3.845-9.754
        c0,0-0.036-0.066-0.065-0.147c-0.014-0.026-0.108-0.106-0.206-0.063c-0.065,0.036-0.074,0.117-0.066,0.146
        c0.036,0.066,0.042,0.08,0.048,0.111c0.569,0.93,0.467,2.009,0.33,2.52c-0.774,2.75-5.186,4.904-9.812,4.904H2.002
        c0,0,0.149-0.043,0.172-0.126c0.254-0.946,1.717-6.294,1.726-6.347c0.018-0.09-0.099-0.133-0.099-0.133h4.604
        c0,0-0.132,0.037-0.158,0.131c-0.024,0.078-0.954,3.432-1.151,4.178c-0.023,0.094-0.178,0.139-0.178,0.139h1.118
        c2.597,0,5.032-0.828,5.547-2.748c0.472-1.752-1.23-2.746-4.021-2.746H8.539h-4.45c0,0,0.125-0.059,0.147-0.139
        c0.123-0.443,0.497-1.834,0.515-1.899C4.771,15.047,4.646,15,4.646,15H21.29L21.29,15z">
    </path>
</svg>
`
const image = new Image;

const svgBlob = new Blob([svg], { type: "image/svg+xml" });
const url = URL.createObjectURL(svgBlob);

image.src = url;

function init() {
    logo = new Logo(image, canvas);
    confettiParticles = [];
};


function clear() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function nextFrame() {
    logo.update();
    logo.draw();

    confettiParticles = confettiParticles.filter((value) => value.isAlive());
    for (const particle of confettiParticles) {
        particle.update();
        particle.draw();
    }
}

export default function dvd() {
    setHashAutoFocus(canvas)
    startLoop(canvas, init, clear, nextFrame, { resetOnClick: true, resetOnResize: true, fps: 60 });
}

