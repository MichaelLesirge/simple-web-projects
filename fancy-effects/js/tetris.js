// canvasUtil.js and util.js imports
import { startLoop, updateCanvasSizes } from "./canvasUtil.js";
import { randomChoice, randomInt, makeGrid } from "./util.js";

// Constants
const EMPTY = null;
const TETROMINOS = [
    { shape: [[1, 1, 1, 1]], color: "#00ffff" },
    { shape: [[1, 1], [1, 1]], color: "#ffff00" },
    { shape: [[0, 1, 0], [1, 1, 1]], color: "#800080" },
    { shape: [[0, 1, 1], [1, 1, 0]], color: "#00ff00" },
    { shape: [[1, 1, 0], [0, 1, 1]], color: "#ff0000" },
    { shape: [[1, 0, 0], [1, 1, 1]], color: "#0000ff" },
    { shape: [[0, 0, 1], [1, 1, 1]], color: "#ff7f00" }
];

// Utility function to generate rotations
function generateRotations(shape) {
    const rotations = [shape];
    for (let i = 0; i < 3; i++) {
        rotations.push(rotations[rotations.length - 1][0].map((_, idx) =>
            rotations[rotations.length - 1].map(row => row[idx]).reverse()
        ));
    }
    return rotations;
}

// Tetromino class
class Tetromino {
    constructor(type, color, start, { target } = {}) {
        this.rotations = generateRotations(type);
        this.color = color;

        this.orientation = start.orientation;
        this.x = start.x;
        this.y = start.y;

        this.target = target;
    }

    get shape() {
        return this.rotations[this.orientation];
    }

    draw(ctx, gridSize) {
        ctx.fillStyle = this.color;
        this.shape.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell) {
                    ctx.fillRect((this.x + j) * gridSize, (this.y + i) * gridSize, gridSize, gridSize);
                }
            });
        });
    }

    rotate() {
        this.orientation = (this.orientation + 1) % this.rotations.length;
    }

    moveDown() {
        this.y++;
    }

    moveUp() {
        this.y--;
    }

    moveLeft() {
        this.x++;
    }

    moveRight() {
        this.x--;
    }

    saveState() {
        return {
            x: this.x,
            y: this.y,
            orientation: this.orientation
        };
    }

    restoreState(state) {
        this.x = state.x;
        this.y = state.y;
        this.orientation = state.orientation;
    }

    setTarget(target) {
        this.target = target;
    }

    moveToTarget() {
        if (!this.target) return;

        if (this.x < this.target.x) {
            this.moveLeft();
        } else if (this.x > this.target.x) {
            this.moveRight();
        }
        else if (this.orientation !== this.target.orientation) {
            this.rotate();
        }
    }
}

// Grid class 
class Grid {
    constructor(rows, cols, emptyValue = EMPTY) {
        this.rows = rows;
        this.cols = cols;
        this.grid = makeGrid(rows, cols, () => emptyValue);
    }

    copy() {
        const newGrid = new Grid(this.rows, this.cols, EMPTY);
        newGrid.grid = this.grid.map((row) => row.slice());
        return newGrid;
    }

    doesCollide(tetromino) {
        for (let i = 0; i < tetromino.shape.length; i++) {
            for (let j = 0; j < tetromino.shape[i].length; j++) {
                if (tetromino.shape[i][j]) {
                    const [row, col] = [tetromino.y + i, tetromino.x + j];
                    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows || this.grid[row][col]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    placeTetromino(tetromino) {
        tetromino.shape.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell) {
                    this.grid[tetromino.y + i][tetromino.x + j] = tetromino.color;
                }
            });
        });
    }

    simulateDrop(tetromino) {
        const simulationGrid = this.copy();
        const simulationTetromino = new Tetromino(tetromino.shape, tetromino.color, { x: tetromino.x, y: tetromino.y, orientation: tetromino.orientation });

        while (!simulationGrid.doesCollide(simulationTetromino)) {
            simulationTetromino.moveDown();
        }
        simulationTetromino.moveUp();
        simulationGrid.placeTetromino(simulationTetromino);
        return simulationGrid.getPenalty();
    }

    getHeights() {
        const heights = Array(this.cols).fill(0);
        for (let j = 0; j < this.cols; j++) {
            for (let i = 0; i < this.rows; i++) {
                if (this.grid[i][j] !== EMPTY) {
                    heights[j] = this.rows - i;
                    break;
                }
            }
        }
        return heights;
    }

    getHoles() {
        let holes = 0;
        const heights = this.getHeights();
        for (let j = 0; j < this.cols; j++) {
            for (let i = this.rows - heights[j]; i < this.rows; i++) {
                if (this.grid[i][j] === EMPTY) {
                    holes++;
                }
            }
        }
        return holes;
    }

    getPenalty() {
        const heights = this.getHeights();
        const holes = this.getHoles();
        const maxHeight = Math.max(...heights);
        const avgHeight = heights.reduce((sum, height) => sum + height, 0) / this.cols;

        return (
            10 * holes +
            0.75 * avgHeight +
            3 * maxHeight
        );
    }

    clearLines() {
        let linesCleared = 0;
        for (let i = 0; i < this.rows; i++) {
            if (this.grid[i].every(cell => cell !== EMPTY)) {
                this.grid.splice(i, 1);
                this.grid.unshift(Array(this.cols).fill(EMPTY));
                linesCleared++;
            }
        }
        return linesCleared;
    }


    draw(ctx, gridSize) {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                ctx.fillStyle = this.grid[i][j] || "black";
                ctx.fillRect(j * gridSize, i * gridSize, gridSize, gridSize);
                ctx.strokeRect(j * gridSize, i * gridSize, gridSize, gridSize);
            }
        }
    }
}


// TetrisGame class
class TetrisGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.init();
    }

    init() {
        updateCanvasSizes(this.canvas);

        this.rows = 30;
        this.gridSize = this.canvas.height / this.rows;

        const colsExtra = this.canvas.height % this.gridSize;

        this.cols = Math.floor((this.canvas.width - colsExtra) / this.gridSize);

        this.grid = new Grid(this.rows, this.cols);

        this.currentTetromino = this.createNewTetromino();
    }

    createNewTetromino() {
        const { shape, color } = randomChoice(TETROMINOS);

        const start = {
            x: randomInt(0, this.cols - shape[0].length),
            y: 0,
            orientation: 0
        };

        const tetromino = new Tetromino(shape, color, start);

        const target = this.findBestTarget(tetromino);
        tetromino.setTarget(target)

        return tetromino;
    }

    findBestTarget(tetromino) {
        let bestPenalty = Infinity;
        let bestTarget = { x: tetromino.x, orientation: tetromino.orientation };
        let shortestDistance = Infinity;

        const range = (this.grid.rows - tetromino.y - tetromino.shape[0].length) - (tetromino.rotations.length - 1);
        const currentX = tetromino.x;
        const currentOrientation = tetromino.orientation;

        const minX = 0;
        const maxX = this.cols - tetromino.shape[0].length;

        for (let x = Math.max(minX, currentX - range); x < Math.min(currentX + range, maxX); x++) {
            for (let orientation = 0; orientation < tetromino.rotations.length; orientation++) {
                const testTetromino = new Tetromino(tetromino.shape, tetromino.color, { x, y: 0, orientation });
                if (!this.grid.doesCollide(testTetromino)) {
                    const penalty = this.grid.simulateDrop(testTetromino);
                    const distance = Math.abs(currentX - x) + Math.abs(currentOrientation - orientation);

                    if (penalty < bestPenalty || (penalty === bestPenalty && distance < shortestDistance)) {
                        bestPenalty = penalty;
                        bestTarget = { x, orientation };
                        shortestDistance = distance;
                    }
                }
            }
        }

        return bestTarget;
    }

    update() {
        const oldState = this.currentTetromino.saveState();
        this.currentTetromino.moveToTarget();

        if (this.grid.doesCollide(this.currentTetromino)) {
            this.currentTetromino.restoreState(oldState);
        }

        this.currentTetromino.moveDown();
        if (this.grid.doesCollide(this.currentTetromino)) {

            this.currentTetromino.moveUp();
            this.grid.placeTetromino(this.currentTetromino);
            this.grid.clearLines();

            this.currentTetromino = this.createNewTetromino();
            if (this.grid.doesCollide(this.currentTetromino)) {
                this.init();
            }
        }
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    draw() {
        this.grid.draw(this.ctx, this.gridSize);
        if (this.currentTetromino) {
            this.currentTetromino.draw(this.ctx, this.gridSize);
        }
    }

    nextFrame() {
        this.update();
        this.clear();
        this.draw();
    }
}

// Exported function to start the game
export default function tetris() {
    const canvas = document.getElementById("tetris-canvas");
    const game = new TetrisGame(canvas);
    startLoop(canvas, () => game.init(), () => game.clear(), () => game.nextFrame(), { resetOnClick: true, resetOnResize: true });
}

