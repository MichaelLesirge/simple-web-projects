console.log("https://tetris.wiki/Tetris_%28Electronika_60%29")

import Board from "./board.js";
import Tetris from "./game.js";
import FpsController from "./fpsController.js";
import { playAudioKey, loadAudio } from "./audio.js";

String.prototype.padCenter = function (maxLength, fillString = " ") {
    const paddingNeeded = Math.max(maxLength - this.length, 0);
    const half = Math.round(paddingNeeded / 2);
    return fillString.repeat(half) + this + fillString.repeat(paddingNeeded - half)
}

String.prototype.replaceAt = function(index, replacement) {
    return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}

// TODO:
// 0. TETRIS {DONE}
// 1. show full lines, level, score, high score, time {DONE}
// 2. next piece {DONE}
// 3. new game {DONE}
// 4. sound effects
// 5. make accurate to original game
// 6. Better start/end screen
// 7. clean up code

const WIDTH = 10;
const HEIGHT = 20;

const FPS = 60;

const BLOCK_WIDTH = 2;

// const full = "█".repeat(blockWidth);
const full = "[" + " ".repeat(BLOCK_WIDTH - 2) + "]";

const empty_fill_char = "."
const empty = empty_fill_char.padCenter(BLOCK_WIDTH);

const linePaddingLeft = "<!";
const linePaddingRight = "!>";

const gameElement = document.querySelector(".game");

const startBox = document.getElementById("start-box");

const gameOverBox = document.getElementById("game-over-box");
const startGameButton = document.getElementById("play-again");
startGameButton.addEventListener("click", startGame);

const messages = [];

class ShapeType {
    constructor(name, shape, maxRotations = 4) {
        this.name = name;
        this.shape = shape;
        this.maxRotations = maxRotations;

        this.height = shape.length;
        this.width = shape[0].length;

        this.largestDim = Math.max(this.width, this.height);

        this.rotations = [];
        if (maxRotations !== null) {
            for (let i = 0; i < maxRotations; i++) {
                this.rotations.push(shape);
                shape = this.rotate90degrees(shape)
                if (shape == this.rotations[0]) break
            }
        }
        else {
            this.rotations.push(...shape);
        }
    }

    rotate90degrees(grid) {
        return grid[0].map((val, index) => grid.map(row => row[index]).reverse())
    }
}

const shapes = [
    new ShapeType("O", [
        [1, 1],
        [1, 1],
    ]),

    new ShapeType("I", [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
    ], 2),

    new ShapeType("S", [[
        [0, 0, 0],
        [0, 1, 1],
        [1, 1, 0],
    ], [
        [0, 1, 0],
        [0, 1, 1],
        [0, 0, 1],
    ]], null),

    new ShapeType("Z", [[
        [0, 0, 0],
        [1, 1, 0],
        [0, 1, 1],
    ], [
        [0, 0, 1],
        [0, 1, 1],
        [0, 1, 0],
    ]], null),

    new ShapeType("L", [
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 1],
    ]),

    new ShapeType("J", [
        [0, 1, 0],
        [0, 1, 0],
        [1, 1, 0],
    ]),

    new ShapeType("T", [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
    ]),
]

const dropsPerSecond = 3;
const softDropsPerSecond = 30

const board = new Board(WIDTH, HEIGHT);
const game = new Tetris(board, shapes, displayBoard, Math.round(FPS / dropsPerSecond), Math.round(FPS / softDropsPerSecond));

function displayBoard(game, board) {
    gameElement.innerText = gameToString(game, board ?? game.board);
}

let started = false;

const keys = {}

let audioCtx;
window.addEventListener("keydown", (event) => {
    if (!started) {
        startGame();
        startBox.remove();
        audioCtx = loadAudio();
        started = true;
    }
    else {
        if (event.key === "Escape") {
            if (controller.isPlaying) {
                controller.pause()
                messages.unshift("Paused");
                game.draw();
            }
            else {
                controller.start();
            }
        };
        if (!event.repeat) playAudioKey(event.key, audioCtx);
        keys[event.key] = true;
    }
});
window.addEventListener("keyup", (event) => keys[event.key] = false);

const controller = new FpsController(
    () => {
        if (game.gameOver) endGame();
        game.next(keys);
        game.draw();
    }, FPS
)

function startGame() {
    gameOverBox.style.display = "none";
    game.reset();
    controller.start();
}

function endGame() {
    gameOverBox.style.display = "block";
    controller.pause();
    if (localStorage.getItem("high-score") ?? 0 <= game.score) localStorage.setItem("high-score", game.score);
    document.getElementById("score").innerText = game.score;
    document.getElementById("high-score").innerText = localStorage.getItem("high-score");

    startGameButton.focus();
}

function boardToLines(board) {
    
    const grid = board.getGrid();

    const width = board.width;
    const height = board.height;

    const lines = []

    for (const row of grid) {
        lines.push(
            linePaddingLeft +
            row.map((tile) => (tile ? full : empty)).join("") +
            linePaddingRight
        );
    }

    const bottom1 = "=";
    lines.push(linePaddingLeft + bottom1.repeat(width * BLOCK_WIDTH / bottom1.length) + linePaddingRight);

    const bottom2 = "\\/";
    lines.push((" ".repeat(linePaddingLeft.length) + (bottom2.repeat(width * BLOCK_WIDTH / bottom2.length)) + " ".repeat(linePaddingRight.length)));

    const message = messages.pop();
    if (message) {
        const lineIndex = Math.floor(board.height / 2);
        const stringStartOffset = linePaddingLeft.length + Math.floor(board.width / 2) * BLOCK_WIDTH - Math.floor(message.length / 2)
        for (let i = 0; i < message.length; i++) {
            lines[lineIndex] = lines[lineIndex].replaceAt(stringStartOffset + i, message[i]);
        }
    }

    return lines;
}

function gameToString(game, board) {

    const width = 60;

    const boardLines = boardToLines(board);  
    
    const lines = boardLines.map((line) => line.padCenter(width));

    const info = [
        "FULL LINES: " + game.lines,
        "LEVEL: " + game.level,
        "SCORE: " + game.score,
        "TIME: " + controller.getTimestampString()
    ]

    for (let i = 0; i < info.length; i++) {
        const message = info[i] ?? "";

        lines[i] = (
                message.padEnd(Math.floor((width - boardLines[i].length) / 2))
            +    boardLines[i])
            .padEnd(width);
    }

    const next = game.pieceQueue[0].getGrid();
    for (let row = 0; row < next.length; row++) {
        const boardRow = Math.floor(board.height / 2) + row
        lines[boardRow] = (
                (next[row].map((tile) => (tile ? full : " ".repeat(BLOCK_WIDTH))).join("") + " ")
                .padStart(Math.floor((width - boardLines[row].length) / 2))
                + boardLines[boardRow]
            )
            .padEnd(width)
    }

    return lines.join("\n")
}