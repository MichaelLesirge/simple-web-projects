import { startLoop, updateCanvasSizes, setHashAutoFocus } from "./canvasUtil.js";
import { randomChoice, randomInt } from "./util.js";

const canvas = document.getElementById("mondrian-canvas");
updateCanvasSizes(canvas);

const ctx = canvas.getContext("2d");

const colors = [
    'white',
    'white',
    'white',
    'white',
    'black',
    'red',
    'blue',
    'yellow'
];

const minSize = 25; // Minimum size of each rectangle

let rectangles = [];
let index = 0;

ctx.fillStyle = 'white';
ctx.fillRect(0, 0, canvas.width, canvas.height);

function init() {
    ctx.lineWidth = 10;  // Make lines really thick
    rectangles = [];     // Clear previous rectangles
    index = 0;           // Reset the index
    generateRectangles(0, 0, canvas.width, canvas.height);
}

function clear() {
}

function draw() {
    if (index < rectangles.length) {
        let rect = rectangles[index];
        ctx.fillStyle = rect.color;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        index++;
    }
    else {
        init()
    }
}

function generateRectangles(x, y, width, height) {
    if (width < minSize || height < minSize) {
        return;
    }

    let splitVertically = Math.random() < 0.5;
    let splitSize = randomInt(0, splitVertically ? width : height);

    if (splitVertically) {
        generateRectangles(x, y, splitSize, height);
        generateRectangles(x + splitSize, y, width - splitSize, height);
    } else {
        generateRectangles(x, y, width, splitSize);
        generateRectangles(x, y + splitSize, width, height - splitSize);
    }

    rectangles.push({
        x: x,
        y: y,
        width: width,
        height: height,
        color: randomChoice(colors)
    });
}

export default function mondrian() {
    setHashAutoFocus(canvas);
    startLoop(canvas, init, clear, draw, { resetOnClick: true, resetOnResize: true, fps: 10 });
}
