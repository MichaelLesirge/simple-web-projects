// canvasUtil.js and util.js imports
import { startLoop, updateCanvasSizes, setHashAutoFocus } from "./canvasUtil.js";
import { randomInt, makeGrid, getPermutations } from "./util.js";

// Constants
const TETRIS_GAME_ROWS = 30;

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
const MOVES = {
    LEFT: "left",
    RIGHT: "right",
    ROTATE: "rotate",
    NONE: "nothing",
}

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

function shuffle(array) {
    let currentIndex = array.length;

    while (currentIndex != 0) {

        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] =  [array[randomIndex], array[currentIndex]];
    }
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
        return new Tetromino(this.rotations[0], this.color, this.saveState());
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
            case MOVES.LEFT:
                this.moveLeft()
                break;
            case MOVES.RIGHT:
                this.moveRight()
                break;
            case MOVES.ROTATE:
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
                    if (col < 0 || col >= this.cols || row >= this.rows || (row > 0 && this.grid[row][col])) {
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
                const [iPos, jPos] = [tetromino.y + i, tetromino.x + j]
                if (cell && (iPos >= 0 && jPos >= 0 && iPos < this.rows && jPos < this.cols)) {
                    this.grid[iPos][jPos] = tetromino.color;
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


    draw(ctx, gridSize, {iShift = 0, jShift = 0} = {}) {
        for (let i = 0; i < this.rows - iShift; i++) {
            for (let j = 0; j < this.cols - jShift; j++) {
                let row = i + iShift;
                let col = j + jShift;

                const cellColor = this.grid[row][col];

                if (cellColor) {
                    ctx.fillStyle = cellColor;
                    ctx.fillRect(col * gridSize, row * gridSize, gridSize, gridSize);
                }

                ctx.lineWidth = 2;
                ctx.strokeRect(col * gridSize, row * gridSize, gridSize, gridSize);
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

        this.rows = TETRIS_GAME_ROWS;
        this.gridSize = this.canvas.height / this.rows;

        this.colsExtra = this.canvas.width % this.gridSize;

        this.cols = Math.floor(this.canvas.width / this.gridSize);

        this.grid = new Grid(this.rows, this.cols);

        this.tetrominoBag = []
        this.currentTetromino = this.createNewTetromino();

        this.trailLen = Math.floor(this.rows * 3.5)
        this.trail = Array.from({ length: this.trailLen })

        const deepExploreArea = 5;
        const possibleMoves = Object.values(MOVES);
        this.deepExploreMovePossibilities = getPermutations(possibleMoves, deepExploreArea)

        this.baseMovesPossibilities = Array.from({length: this.rows * 2 + 1}, (_, x) => Array.from({ length: this.rows}, (_, i) => i < (x - this.rows) ? ((x > 0) ? MOVES.LEFT : MOVES.RIGHT) : MOVES.NONE)); // ok   
    }

    createNewTetromino() {
        if (this.tetrominoBag.length === 0) {
            this.tetrominoBag = TETROMINOS.slice()
            shuffle(this.tetrominoBag);
        }

        let { shape, color } = this.tetrominoBag.pop()

        const start = {
            x: randomInt(0, this.cols - shape[0].length),
            y: -2,
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

        const lowestMovePenaltyAcceptance = 0.1;

        let lowestPenaltyMoveSet = [];
        let lowestPenalty = Infinity;

        for (const baseMoves of this.baseMovesPossibilities) {

            for (const exploreMoves of this.deepExploreMovePossibilities) {

                tetromino.setMoves(baseMoves.slice());

                while (!grid.doesCollide(tetromino)) {
                    const preMoveState = tetromino.saveState();
                    tetromino.moveToTarget();
                    if (grid.doesCollide(tetromino)) {
                        tetromino.restoreState(preMoveState);
                    }

                    tetromino.moveDown();
                }

                tetromino.restoreState(startingTetrominoState);

                const moves = removeTrailing(baseMoves.slice(0, -exploreMoves.length - tetromino.moves.length).concat(exploreMoves), MOVES.NONE);

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
                    lowestPenaltyMoveSet = moves;
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
        
        this.ctx.save()
        this.ctx.translate(this.colsExtra / 2, 0)

        for (let i = 0; i < this.trail.length; i++) {
            const tetromino = this.trail[i];
            if (tetromino) {
                tetromino.draw(this.ctx, this.gridSize, (((i + 1) / this.trailLen)) * 0.32)
            }
        }
        
        if (this.currentTetromino) {
            this.currentTetromino.draw(this.ctx, this.gridSize);
            
            this.trail.push(this.currentTetromino.copy());
            if (this.trail.length > this.trailLen) {
                this.trail.shift();
            }
        }

        this.grid.draw(this.ctx, this.gridSize);
        
        this.ctx.restore()
    }

    nextFrame() {
        this.draw();
        this.update();
        this.clear();
        this.draw();
    }
}

// Exported function to start the game
export default function tetris() {
    const canvas = document.getElementById("tetris-canvas");
    const game = new TetrisGame(canvas);
    setHashAutoFocus(canvas);
    startLoop(canvas, () => game.init(), () => game.clear(), () => game.nextFrame(), { resetOnClick: true, resetOnResize: true, fps: 20 });
}

