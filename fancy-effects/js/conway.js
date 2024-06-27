import { startLoop, updateCanvasSizes, setHashAutoFocus } from "./canvasUtil.js";
import { randomFloat, makeGrid } from "./util.js";

const canvas = document.getElementById("conway-canvas");
updateCanvasSizes(canvas);

const ctx = canvas.getContext("2d");

const gridSize = 10;

let rows = Math.floor(canvas.height / gridSize);
let cols = Math.floor(canvas.width / gridSize);

const startingChanceOn = 0.3;

function randRGB() {
    return [randomFloat(0, 255), randomFloat(0, 255), randomFloat(0, 255)]
}

function blendRGB(colors) {
    const colorCount = colors.length;
    let sumR = 0, sumG = 0, sumB = 0;

    for (const color of colors) {
        sumR += color[0] ** 2;
        sumG += color[1] ** 2;
        sumB += color[2] ** 2;
    }

    const blendedR = Math.sqrt(sumR / colorCount);
    const blendedG = Math.sqrt(sumG / colorCount);
    const blendedB = Math.sqrt(sumB / colorCount);

    return [blendedR, blendedG, blendedB];
}

function cssRGB(color) {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`
}

let grid, nextGrid;

const DEAD = 0;

function init() {
    rows = Math.floor(canvas.height / gridSize);
    cols = Math.floor(canvas.width / gridSize);
    grid = makeGrid(rows, cols, () => Math.random() < startingChanceOn ? DEAD : randRGB());
    nextGrid = makeGrid(rows, cols, () => DEAD);
    update();
}

function update() {
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {

            const neighbors = getNeighbors(i, j);
            const neighborsCount = neighbors.length;

            const tile = grid[i][j];

            if (tile === DEAD && neighborsCount === 3) {
                nextGrid[i][j] = blendRGB(neighbors);
            } else if (tile !== 0 && (neighborsCount < 2 || neighborsCount > 3)) {
                nextGrid[i][j] = DEAD;
            } else {
                nextGrid[i][j] = tile;
            }
        }
    }

    [nextGrid, grid] = [grid, nextGrid];
}

function getNeighbors(row, col) {
    let neighbors = [];
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;

            const tile = grid[(row + i + rows) % rows][(col + j + cols) % cols];

            if (tile !== 0) {
                neighbors.push(tile)
            }

        }
    }
    return neighbors;
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function draw() {
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const tile = grid[i][j];
            if (tile !== 0) {
                ctx.fillStyle = cssRGB(tile);
                ctx.fillRect(j * gridSize, i * gridSize, gridSize, gridSize);
            }
        }
    }
}

function nextFrame() {
    update();
    draw();
}

export default function conway(params) {
    setHashAutoFocus(canvas)
    startLoop(canvas, init, clear, nextFrame, { resetOnClick: true, resetOnResize: true })
}
