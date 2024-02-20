function random(max) {
    return Math.floor(Math.random() * max);
}

const MAX_NUM_OF_STATES = 4;
class TetrisPiece {
    constructor(type, { x = 0, y = 0, rotation = 0 } = {}) {
        this.type = type;

        this.x = x;
        this.y = y;

        this.setState(rotation);
        this.save();
    }

    save() {
        this.saved = [this.x, this.y, this.width, this.height, this.rotation];
    }
    
    load() {
        [this.x, this.y, this.width, this.height, this.rotation] = this.saved;
    }

    setState(state) {
        this.rotation = state;

        const grid = this.getGrid();

        this.height = grid.length;
        this.width = grid[0].length;
    }

    spin() {
        this.rotation = (this.rotation + 1) % this.type.rotations.length;
        [this.height, this.width] = [this.width, this.height];
    }

    drop() {
        this.y++;
    }

    left() {
        this.x--;
    }

    right() {
        this.x++;
    }

    getGrid() {
        return this.type.rotations[this.rotation];
    }

    hasValidState(grid) {
        const currentGrid = this.getGrid();
        
        const height = grid.length;
        const width = grid[0].length;

        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                if (currentGrid[row][col] && (
                        this.x + col < 0 || this.x + col >= width ||
                        this.y + row < 0 || this.y + row >= height
                        || grid[row + this.y][col + this.x]
                    )
                ) return false;
            }
        }

        return true;
    }
}

export default class Tetris {
    constructor(board, pieceTypes, displayBoard, dropDelayFrames = 1, softDropDelayFrames = 1, pieceQueueSize = 1) {
        this.board = board;
        this.pieceTypes = pieceTypes;
        this.displayBoard = displayBoard;

        this.dropDelayFrames = dropDelayFrames;
        this.softDropDelayFrames = softDropDelayFrames;

        this.pieceQueueSize = pieceQueueSize;
    }

    fillPieceQueue() {
        while (this.pieceQueue.length < this.pieceQueueSize) {
            const type = this.pieceTypes[random(this.pieceTypes.length)];
            const piece = new TetrisPiece(type, {
                x: Math.round(this.board.width / 2 - type.largestDim / 2),
                y: 0,
                rotation: random(type.rotations.length)
            });
            this.pieceQueue.push(piece);
        }
    }

    reset() {
        this.pieceQueue = [];

        this.fillPieceQueue();
        this.newControlledPiece();

        this.level = this.lines = this.score = this.frame = 0;

        this.gameOver = false;

        this.board.reset()

        this.displayBoard(this);
    }

    newControlledPiece() {
        this.controlledPiece = this.pieceQueue.shift();
        this.fillPieceQueue();
    }

    getControlledPiece() {
        return this.controlledPiece;
    }

    next(keys) {

        const controlledPiece = this.getControlledPiece();

        this.frame++;

        if (this.frame % Math.max(((keys["ArrowDown"] ? this.softDropDelayFrames : this.dropDelayFrames) - (this.level * 2)), 1) == 0) {

            controlledPiece.save();

            controlledPiece.drop();

            if (!controlledPiece.hasValidState(this.board.getGrid())) {

                controlledPiece.load()

                this.board.drawGrid(controlledPiece.getGrid(), { x: controlledPiece.x, y: controlledPiece.y });

                const fullLines = this.board.findFullLines();

                const scoring = [0, 40, 100, 300, 1200]

                this.lines += fullLines.length;
                this.score += scoring[fullLines.length];

                this.level = Math.floor(this.lines / 10)
                
                this.board.clearLines(fullLines);

                this.newControlledPiece();

                if (!this.getControlledPiece().hasValidState(this.board.getGrid())) {
                    this.gameOver = true;
                }
            }
        }

        controlledPiece.save();

        if (keys["ArrowUp"]) {
            controlledPiece.spin();
            keys["ArrowUp"] = false;
        }
        if (keys["ArrowLeft"]) {
            controlledPiece.left();
            keys["ArrowLeft"] = false;
        }
        if (keys["ArrowRight"]) {
            controlledPiece.right();
            keys["ArrowRight"] = false;
        }
        if (keys[" "]) {
            while (controlledPiece.hasValidState(this.board.getGrid())) {
                controlledPiece.save()
                controlledPiece.drop();
            }
            keys[" "] = false;
        }

        if (!controlledPiece.hasValidState(this.board.getGrid())) {
            controlledPiece.load();
        }
    }

    draw() {
        const controlledPiece = this.getControlledPiece();
        const frameBoard = this.board.getDrawingCopy();
        frameBoard.drawGrid(controlledPiece.getGrid(), { x: controlledPiece.x, y: controlledPiece.y });
        this.displayBoard(this, frameBoard);
    }
}