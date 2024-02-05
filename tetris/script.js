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

const allShapes = Object.keys(shapes);

function spawnRandomPiece() {
    const shape = allShapes[random(allShapes.length)];    
    const piece = new TetrisPiece(shapes[shape])

    console.log(shape, piece.states.length)
    
    piece.x = Math.round((board.width / 2) - (piece.width / 2));
    piece.y = 0;

    piece.setState(random(piece.maxNumOfStates));
    
    console.table(piece.getGrid());
    console.log("Width: " + piece.width, "Height: " + piece.height)

    return piece;
}

let controlledPiece = spawnRandomPiece();

const keys = {}

const scoring = [0, 40, 100, 300, 1200]

const normalDropSpeed = 30;
const fastDropSpeed = normalDropSpeed / 10;

function loop({frame, i}) {
    const frameBoard = board.getDrawingCopy();

    if (i && (i % (keys["ArrowDown"] ? fastDropSpeed : normalDropSpeed) == 0)) {

        controlledPiece.save();

        controlledPiece.y++;

        if (!controlledPiece.hasValidState(board.getGrid())) {

            controlledPiece.load()

            board.drawGrid(controlledPiece.getGrid(), {x: controlledPiece.x, y: controlledPiece.y});
            
            const fullLines = board.findFullLines();
            console.log("+", fullLines.length);
            board.clearLines(fullLines);

            controlledPiece = spawnRandomPiece();
            
            if (!controlledPiece.hasValidState(board.getGrid())) {
                controller.pause();
                setTimeout(alert("You lose"), 10);
            }
        }
    }

    controlledPiece.save();

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
    if (keys[" "]) {
        while (controlledPiece.hasValidState(board.getGrid())) {
            controlledPiece.save()
            controlledPiece.y++;
        }
        keys[" "] = false;
    }

    if (!controlledPiece.hasValidState(board.getGrid())) {
        controlledPiece.load();
    }

    frameBoard.drawGrid(controlledPiece.getGrid(), {x: controlledPiece.x, y: controlledPiece.y});

    displayBoard(frameBoard.getGrid());
}

const controller = new FpsController(
    loop, FPS
)

window.addEventListener("keydown", (event) => {
    if (event.key == "Escape") controller.toggleOn()
});

controller.start();

window.addEventListener("keydown", (event) => keys[event.key] = true);
window.addEventListener("keyup", (event) => keys[event.key] = false);

function gridToTetrisString(grid) {
    const height = grid.length
    const width = height && grid[0].length;

    const blockWidth = 2;

    // const full = "█".repeat(blockWidth);
    const full = "[" + " ".repeat(blockWidth - 2) + "]";

    const empty = " ".repeat(blockWidth - 1) + ".";

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