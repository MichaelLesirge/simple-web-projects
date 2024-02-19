console.log("https://tetris.wiki/Tetris_%28Electronika_60%29")

import Board from "./board.js";
import Tetris from "./game.js";
import FpsController from "./fpsController.js";

String.prototype.padCenter = function (maxLength, fillString = " ") {
    const paddingNeeded = Math.max(maxLength - this.length, 0);
    const half = Math.round(paddingNeeded / 2);
    return fillString.repeat(half) + this + fillString.repeat(paddingNeeded - half)
}

// TODO:
// 0. TETRIS
// 1. show full lines, level, score, high score, time {DONE}
// 2. next piece {DONE}
// 3. new game {DONE}
// 4. sound effects
// 5. wall bouncing
// 6. clean up code

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

const gameOverBox = document.querySelector(".game-over");
const startGameButton = document.getElementById("play-again");
startGameButton.addEventListener("click", startGame);

const messages = [];

const shapes = {
    O: [
        [1, 1],
        [1, 1],
    ],

    I: [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
    ],

    S: [
        [0, 0, 0],
        [0, 1, 1],
        [1, 1, 0],
    ],

    Z: [
        [0, 0, 0],
        [1, 1, 0],
        [0, 1, 1],
    ],

    L: [
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 1],
    ],

    J: [
        [0, 1, 0],
        [0, 1, 0],
        [1, 1, 0],
    ],

    T: [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
    ],
}

const dropsPerSecond = 3;
const softDropsPerSecond = 30

const board = new Board(WIDTH, HEIGHT);
const game = new Tetris(board, Object.values(shapes), displayBoard, Math.round(FPS / dropsPerSecond), Math.round(FPS / softDropsPerSecond));

function displayBoard(game, board) {
    gameElement.innerText = gameToString(game, board ?? game.board);
}

const keys = {}

window.addEventListener("keydown", (event) => {
    keys[event.key] = true;
    window.playAudioKey(event.key);
});
window.addEventListener("keyup", (event) => keys[event.key] = false);

const controller = new FpsController(
    () => {
        if (game.gameOver) endGame();
        game.next(keys);
        game.draw();
    }, FPS
)

window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        if (controller.isPlaying) {
            controller.pause()
            messages.push("Paused");
            game.draw();
        }
        else {
            controller.start();
        }
    };
})

function startGame() {
    gameOverBox.style.display = "none";
    game.reset();
    controller.start();
}

function endGame(params) {
    gameOverBox.style.display = "block";
    controller.pause();
    if (localStorage.getItem("high-score") ?? 0 <= game.score) localStorage.setItem("high-score", game.score);
    document.getElementById("score").innerText = game.score;
    document.getElementById("high-score").innerText = localStorage.getItem("high-score");

    startGameButton.focus();
}

startGame();

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
    if (message) lines[Math.floor(height / 2)] = 
        linePaddingLeft +
        message.padCenter(width, empty_fill_char).split("").map((letter) => letter.padCenter(BLOCK_WIDTH)).join("")
        + linePaddingRight;

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