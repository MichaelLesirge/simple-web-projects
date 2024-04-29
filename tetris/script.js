console.log("https://tetris.wiki/Tetris_%28Electronika_60%29")

// TODO, add R=reset and M=mute, get mobile working and add buttons for all actions

// ---- Imports ---

import Board from "./board.js";
import Tetris from "./game.js";
import FpsController from "./fpsController.js";
import { playAudioKey, loadAudio } from "./audio.js";
import { shapes } from "./shapes.js";

// ---- Extra String Methods ---

String.prototype.padCenter = function (maxLength, fillString = " ") {
    const paddingNeeded = Math.max(maxLength - this.length, 0);
    const half = Math.round(paddingNeeded / 2);
    return fillString.repeat(half) + this + fillString.repeat(paddingNeeded - half)
}

String.prototype.replaceAt = function(index, replacement) {
    return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}

// ---- Constants ---

// Board Constants
const WIDTH = 10;
const HEIGHT = 20;

// Speed constants

const FPS = 60;

const dropsPerSecond = 3;
const softDropsPerSecond = 30

// Board Display Constants
const BLOCK_WIDTH = 2;

const FULL_BLOCK = "[" + " ".repeat(BLOCK_WIDTH - 2) + "]";
const EMPTY_BLOCK = ".".padCenter(BLOCK_WIDTH);

const LINE_PADDING_LEFT = "<!";
const LINE_PADDING_RIGHT = "!>";

// --- Elements --- 

function toggleElementById(elementId) {
    const element = document.getElementById(elementId);
    return [() => element.style.display = "none", () => element.style.display = ""]
}

const gameDisplayText = document.querySelector(".game");

// Mutable State
const messagesQueue = [];
const pressedKeys = {}
let started = false;
let audioCtx;

// Create objects

const board = new Board(WIDTH, HEIGHT);
const game = new Tetris(board, shapes, displayBoard, Math.round(FPS / dropsPerSecond), Math.round(FPS / softDropsPerSecond));

function displayBoard(game, board) {
    gameDisplayText.innerText = gameToString(game, board ?? game.board);
}

// --- pressedKeys ---
window.addEventListener("keydown", (event) => {
    if (!started) return;
    if (!event.repeat) playAudioKey(event.key, audioCtx);
    pressedKeys[event.key] = true;
})

window.addEventListener("keyup", (event) => pressedKeys[event.key] = false);

// --- Create Game Controller ---

const controller = new FpsController(
    () => {
        if (game.gameOver) endGame();
        game.next(pressedKeys);
        game.draw();
    }, FPS
)

// --- Start and End game ---

const beforeUnloadHandler = (event) => event.preventDefault();

function startGame() {
    game.reset();
    
    controller.start();

    if (location.host != '127.0.0.1:5500') window.addEventListener("beforeunload", beforeUnloadHandler);
}

function endGame() {
    controller.pause();

    window.removeEventListener("beforeunload", beforeUnloadHandler);

    if ((localStorage.getItem("high-score") ?? 0) <= game.score) localStorage.setItem("high-score", game.score);
    
    document.getElementById("score").innerText = game.score;
    document.getElementById("high-score").innerText = localStorage.getItem("high-score");

}

// --- Create Start Game Controls ---

window.addEventListener("keydown", (event) => {
    if (!started) {
        startGame();
        audioCtx = loadAudio();
        started = true;
    }
});

// Pause option

window.addEventListener("keydown", (event) => {
    if (started && event.key === "Escape") {
        if (controller.isPlaying) {
            controller.pause()
            messagesQueue.unshift("Paused");
            game.draw();
        }
        else {
            controller.start();
        }
    };
});

// --- Display code ---

function boardToLines(board) {
    
    const grid = board.getGrid();

    const lines = []

    for (const row of grid) {
        lines.push(
            LINE_PADDING_LEFT +
            row.map((tile) => (tile ? FULL_BLOCK : EMPTY_BLOCK)).join("") +
            LINE_PADDING_RIGHT
        );
    }

    const bottom1 = "=";
    lines.push(LINE_PADDING_LEFT + bottom1.repeat(board.width * BLOCK_WIDTH / bottom1.length) + LINE_PADDING_RIGHT);

    const bottom2 = "\\/";
    lines.push((" ".repeat(LINE_PADDING_LEFT.length) + (bottom2.repeat(board.width * BLOCK_WIDTH / bottom2.length)) + " ".repeat(LINE_PADDING_RIGHT.length)));

    const message = messagesQueue.pop();
    if (message) {
        const lineIndex = Math.floor(board.height / 2);
        const stringStartOffset = LINE_PADDING_LEFT.length + Math.floor(board.width / 2) * BLOCK_WIDTH - Math.floor(message.length / 2)
        for (let i = 0; i < message.length; i++) {
            lines[lineIndex] = lines[lineIndex].replaceAt(stringStartOffset + i, message[i]);
        }
    }

    return lines;
}

function gameToString(game, board) {

    const width = 60;

    const boardLines = boardToLines(board);  
    
    const lines = boardLines.map((line) => line.padCenter(width, " "));

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
                (next[row].map((tile) => (tile ? FULL_BLOCK : " ".repeat(BLOCK_WIDTH))).join("") + " ")
                .padStart(Math.floor((width - boardLines[row].length) / 2))
                + boardLines[boardRow]
            )
            .padEnd(width)
    }

    return lines.join("\n") + " "
}