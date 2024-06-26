// canvasUtil.js and util.js imports
import { startLoop, updateCanvasSizes } from "./canvasUtil.js";
import { randomChoice, randomInt, makeGrid, getPermutations } from "./util.js";

// Constants
const EMPTY = null;
const TETROMINOS = [
    {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ], color: "#00ffff"
    },
    {
        shape: [
            [1, 1],
            [1, 1]
        ], color: "#ffff00"
    },
    {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0],
        ], color: "#800080"
    },
    {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0],
        ], color: "#00ff00"
    },
    {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0],
        ], color: "#ff0000"
    },
    {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0],
        ], color: "#0000ff"
    },
    {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0],
        ], color: "#ff7f00"
    }
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

function removeTrailing(array, value) {
    let i = array.length;
    while (i > 0 && array[i - 1] === value) {
        i--;
    }
    return array.slice(0, i);
}

const Moves = {
    LEFT: "left",
    RIGHT: "right",
    ROTATE: "rotate",
    NONE: "nothing",
}

// Tetromino class
class Tetromino {
    constructor(shape, color, start, { moves = [] } = {}) {
        this.rotations = generateRotations(shape);
        this.color = color;

        this.orientation = start.orientation;
        this.x = start.x;
        this.y = start.y;

        this.moves = moves;
    }

    get shape() {
        return this.rotations[this.orientation];
    }

    draw(ctx, gridSize, opacity = 1) {
        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.color;
        this.shape.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell) {
                    ctx.fillRect((this.x + j) * gridSize, (this.y + i) * gridSize, gridSize, gridSize);
                }
            });
        });
        ctx.globalAlpha = 1;
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

    copy() {
        return new Tetromino(this.shape, this.color, this.saveState());
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

    setMoves(moves) {
        this.moves = moves;
    }

    moveToTarget() {
        const move = this.moves.shift();

        if (move === undefined) {
            return;
        }

        switch (move) {
            case Moves.LEFT:
                this.moveLeft()
                break;
            case Moves.RIGHT:
                this.moveRight()
                break;
            case Moves.ROTATE:
                this.rotate()
                break;
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

    saveState() {
        return this.grid.map(row => row.slice());
    }

    restoreState(state) {
        this.grid = state.map(row => row.slice());
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

    getSurroundedHoles() {
        let holes = 0;
        const heights = this.getHeights();
        for (let j = 0; j < this.cols; j++) {
            for (let i = this.rows - heights[j]; i < this.rows; i++) {
                if (
                    (this.grid[i][j] === EMPTY) &&
                    (j < 1 || this.grid[i][j - 1] !== EMPTY) &&
                    (j >= this.cols || this.grid[i][j + 1] !== EMPTY)
                ) {
                    holes++;
                }
            }
        }
        return holes;
    }

    getPenalty() {
        const heights = this.getHeights();

        const holes = this.getHoles();
        const unfixableHoles = this.getSurroundedHoles();
        const maxHeight = Math.max(...heights);
        const avgHeight = heights.reduce((sum, height) => sum + height, 0) / heights.length;
        const bumpiness = heights.slice(1).reduce((sum, height, index) => sum + Math.abs(height - heights[index]), 0) / (heights.length - 1);

        return (
            30 * unfixableHoles +
            15 * holes +
            5 * avgHeight +
            2 * maxHeight +
            1 * bumpiness +
            0
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
        this.ctx.translate(colsExtra / 2, 0)

        this.cols = Math.floor(this.canvas.width / this.gridSize);

        this.grid = new Grid(this.rows, this.cols);

        this.currentTetromino = this.createNewTetromino();

        this.trailLen = Math.floor(this.rows)
        this.trail = []
    }

    createNewTetromino() {
        let { shape, color } = randomChoice(TETROMINOS);
        const start = {
            x: randomInt(0, this.cols - shape[0].length),
            y: 0,
            orientation: 0
        };

        return new Tetromino(shape, color, start);
    }

    /**
     * @param {Tetromino} tetromino 
     */
    findBestMoves() {
        const tetromino = this.currentTetromino;
        const grid = this.grid;

        const startingTetrominoState = tetromino.saveState();
        const startingGridState = grid.saveState();


        const deepExploreArea = 4;
        const maxTravelableStrafe = grid.rows;

        const strafeDistance = maxTravelableStrafe - deepExploreArea;

        const possibleMoves = Object.values(Moves);
        const deepExploreMovePossibilities = getPermutations(possibleMoves, deepExploreArea)

        let lowestPenaltyMoveSet = [];
        let lowestPenalty = Infinity;

        for (
            let x = -strafeDistance; x <= strafeDistance; x++
        ) {
            const baseMoves = Array.from({ length: Math.abs(x) }, () => (x > 0) ? Moves.RIGHT : Moves.LEFT);
            const lowestMovePenaltyAcceptance = 0.00001;

            for (const exploreMoves of deepExploreMovePossibilities) {

                const moves = baseMoves.concat(exploreMoves);
                tetromino.setMoves(moves.slice());

                while (!grid.doesCollide(tetromino)) {
                    const preMoveState = tetromino.saveState();
                    tetromino.moveToTarget();
                    if (grid.doesCollide(tetromino)) {
                        tetromino.restoreState(preMoveState);
                    }

                    tetromino.moveDown();
                }

                tetromino.moveUp();
                grid.placeTetromino(tetromino);

                const movesPenalty = grid.getPenalty()
                if (
                    movesPenalty < lowestPenalty ||
                    ((movesPenalty - lowestPenalty < lowestMovePenaltyAcceptance) && lowestPenaltyMoveSet.length < moves.length)
                ) {
                    lowestPenalty = movesPenalty;
                    lowestPenaltyMoveSet = removeTrailing(moves, Moves.NONE);
                }

                tetromino.restoreState(startingTetrominoState);
                grid.restoreState(startingGridState);
            }
        }

        console.log(lowestPenalty, lowestPenaltyMoveSet);
        tetromino.setMoves(lowestPenaltyMoveSet);
        return lowestPenaltyMoveSet;
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
            else {
                this.findBestMoves();
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

        for (let i = 0; i < this.trail.length; i++) {
            const tetromino = this.trail[i];
            tetromino.draw(this.ctx, this.gridSize, (((i + 1) / this.trailLen)) * 0.5)
        }

        console.log(this.grid.getHoles(), this.grid.getSurroundedHoles());

        if (this.currentTetromino) {
            this.currentTetromino.draw(this.ctx, this.gridSize);

            this.trail.push(this.currentTetromino.copy());
            if (this.trail.length > this.trailLen) {
                this.trail.shift();
            }
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
    startLoop(canvas, () => game.init(), () => game.clear(), () => game.nextFrame(), { resetOnClick: true, resetOnResize: true, fps: 20 });
}

