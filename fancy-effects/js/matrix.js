import { startLoop, updateCanvasSizes, setHashAutoFocus } from "./canvasUtil.js";
import { charRange, randomChoice, randomFloat } from "./util.js";

const canvas = document.getElementById("matrix-canvas");
updateCanvasSizes(canvas)

const ctx = canvas.getContext("2d");

const chars = charRange("a", "z") + charRange("0", "9") + "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン";

const fontSize = 20;
const trail = 20;
const trailGap = 20;

let maxColum = canvas.width / fontSize;

let fallingChars = [];

class Characters {
    constructor(i = 1) {
        this.x = i * fontSize;
        this.y = randomFloat(-500, canvas.height / 10);
        this.dy = randomFloat(1, 5)
    }

    update() {
        this.y += this.dy;

        if (this.y > canvas.height + trail * trailGap) {
            this.y = randomFloat(-500, 0)
            this.dy += randomFloat(-1.5, 1.5)
        }
    }

    draw() {
        for (let i = 0; i < trail; i++) {
            ctx.fillStyle = `rgba(0, 255, 0, ${(trail - i + 1) / trail})`
            ctx.fillText(randomChoice(chars), this.x, this.y - (i * trailGap));
        }
    }
}

function init() {
    maxColum = canvas.width / fontSize;
    fallingChars = Array.from({ length: maxColum }, (v, k) => new Characters(k))
};

function clear() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function nextFrame() {
    ctx.font = fontSize + "px san-serif";
    ctx.textAlign = "center";

    for (const fallingChar of fallingChars) {

        fallingChar.update()

        fallingChar.draw();

    }
}

export default function matrix() {
    setHashAutoFocus(canvas)
    startLoop(canvas, init, clear, nextFrame, { resetOnClick: true, resetOnResize: true });
}
