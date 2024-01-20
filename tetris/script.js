// Put controls on screen if screen is < width or if start game button is tapped, not clicked
import TetrisPiece from "./piece.js";
import Board from "./board.js";
import FpsController from "./fpsController.js"; "./fpsController.js";


const WIDTH = 10;
const HEIGHT = 20;

const FPS = 60;

const gameElement = document.querySelector(".game");

const board = new Board(WIDTH, HEIGHT);

function displayBoard(grid) {
    // console.table(grid);
    gameElement.innerText = gridToTetrisString(grid)
}

displayBoard(board.grid);

const shapes = {
    O: [
        [1, 1],
        [1, 1],
    ],

    I: [
        [1],
        [1],
        [1],
        [1],
    ],

    S: [
        [0, 1, 1],
        [1, 1, 0],
    ],

    Z: [
        [1, 1, 0],
        [0, 1, 1],
    ],

    L: [
        [1, 0],
        [1, 0],
        [1, 1],
    ],

    J: [
        [0, 1],
        [0, 1],
        [1, 1],
    ],

    T: [
        [0, 1, 0],
        [1, 1, 1],
    ],
}

const allShapes = Object.values(shapes);

function spawnRandomPiece() {
    const shape = random(allShapes.length);    
    const piece = new TetrisPiece(allShapes[shape])
    
    piece.x = Math.round((board.width / 2) - (piece.width / 2));
    piece.y = 0;

    piece.setState(random(piece.numOfStates));
    
    console.table(piece.getGrid());
    console.log("Width: " + piece.width, "Height: " + piece.height)

    return piece;
}

let controlledPiece = spawnRandomPiece();

const keys = {}

const normalDropSpeed = 30;
const fastDropSpeed = 5;

function loop({frame, i}) {
    
    const frameBoard = board.getDrawingCopy();

    if (i && (i % (keys["ArrowDown"] ? fastDropSpeed : normalDropSpeed) == 0)) {

        const startY = controlledPiece.y;

        controlledPiece.y++;

        const hitsBottom = controlledPiece.hitsBottom(frameBoard.getGrid())

        if (hitsBottom) {
            controlledPiece.y = startY;
            board.drawGrid(controlledPiece.getGrid(), {x: controlledPiece.x, y: controlledPiece.y});

            controlledPiece = spawnRandomPiece();

            if (controlledPiece.hitsBottom(board.grid)) {
                alert("You lose");
                controller.pause();
            }
        }
    }

    if (keys["ArrowUp"]) {
        controlledPiece.spin();
        keys["ArrowUp"] = false;
    }
    if (keys["ArrowLeft"]) {
        controlledPiece.x--;
        keys["ArrowLeft"] = false;
    }
    if (keys["ArrowRight"]) {
        controlledPiece.x++;
        keys["ArrowRight"] = false;
    }

    frameBoard.drawGrid(controlledPiece.getGrid(), {x: controlledPiece.x, y: controlledPiece.y});

    displayBoard(frameBoard.getGrid());
}

const controller = new FpsController(
    loop, FPS
)

controller.start();

window.addEventListener("keydown", (event) => keys[event.key] = true);
window.addEventListener("keyup", (event) => keys[event.key] = false);

function gridToTetrisString(grid) {
    const height = grid.length
    const width = height && grid[0].length;

    const blockWidth = 2;

    const empty = " ".repeat(blockWidth - 1) + ".";
    const full = "[" + " ".repeat(blockWidth - 2) + "]"

    const linePaddingLeft = "〈!";
    const linePaddingRight = "!〉";
    const linePaddingWidth = 3; // Angle brackets have space built in

    const lines = []

    for (const row of grid) {
        lines.push(
            linePaddingLeft + 
            row.map((tile) => (tile ? full : empty)).join("") + 
            linePaddingRight
        );
    }

    const bottom1 = "=";
    lines.push(linePaddingLeft + bottom1.repeat(width * blockWidth / bottom1.length) + linePaddingRight);

    const bottom2 = "\\/";
    lines.push((" ".repeat(linePaddingWidth) + (bottom2.repeat(width * blockWidth / bottom2.length)) + " ".repeat(linePaddingWidth)));

    return lines.join("\n");
}

function random(max) {
    return Math.floor(Math.random() * max);
}