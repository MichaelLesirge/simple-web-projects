import Tile from "./tile.js";

function objectToArray(obj) {
    const keys = [];
    for (const [key, count] of Object.entries(obj)) {
        for (let i = 0; i < count; i++) {
            keys.push(key)
        }
    }
    return keys
}

export default class GameManager {
    /**
     * @param {import("./board.js").default} grid 
     * @param {import("./keyboardInputManager.js").default} inputManager 
     * @param {import("./htmlActuator.js").default} actuator 
     * @param {import("./localStorageManager.js").default} scoreManager 
     */
    constructor(grid, inputManager, actuator, scoreManager, {startTiles = 2, tileStartValueBag = [2]} = {}) {

        if (!Array.isArray(tileStartValueBag)) {
            tileStartValueBag = objectToArray(tileStartValueBag);
        }

        this.grid = grid;
        this.inputManager = inputManager;
        this.actuator = actuator;
        this.scoreManager = scoreManager;

        this.startTiles = startTiles;
        this.tileStartValueBag = tileStartValueBag;

        this.inputManager.on("move", this.move.bind(this));
        this.inputManager.on("restart", this.restart.bind(this));
        this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));

        this.setup();
    }

    restart() {
        this.actuator.continue();
        this.setup();
    }

    keepPlaying() {
        this.shouldKeepPlaying = true;
        this.actuator.continue();
    }

    isGameTerminated() {
        return this.over || (this.won && !this.shouldKeepPlaying);
    }

    setup() {
        this.grid.reset();

        this.score = 0;
        this.over = false;
        this.won = false;
        this.shouldKeepPlaying = false;

        this.addStartTiles();

        this.actuate();
    }

    addStartTiles() {
        for (let i = 0; i < this.startTiles; i++) {
            this.addRandomTile();
        }
    }

    addRandomTile() {
        if (this.grid.cellsAvailable()) {
            const value = this.tileStartValueBag[Math.floor(Math.random() * this.tileStartValueBag.length)];
            const tile = new Tile(this.grid.getRandomAvailablePosition(), value);

            this.grid.insertTile(tile);
        }
    }

    actuate() {
        if (this.scoreManager.get() < this.score) {
            this.scoreManager.set(this.score);
        }

        this.actuator.actuate(this.grid, {
            score: this.score,
            over: this.over,
            won: this.won,
            bestScore: this.scoreManager.get(),
            terminated: this.isGameTerminated()
        });
    }

    prepareTiles() {
        this.grid.forEach((position, tile) => {
            if (tile) {
                tile.mergedFrom = null;
                tile.savePosition();
            }
        });
    }

    moveTile(tile, cell) {
        this.grid.cells[tile.x][tile.y] = null;
        this.grid.cells[cell.x][cell.y] = tile;
        tile.updatePosition(cell);
    }

    move(direction) {
        if (this.isGameTerminated()) return;
        
        const vector = this.getVector(direction);
        const traversals = this.buildTraversals(vector);
        let moved = false;


        this.prepareTiles();

        traversals.x.forEach(x => {
            traversals.y.forEach(y => {
                const position = { x: x, y: y };
                const tile = this.grid.getCellData(position);

                if (tile) {
                    const positions = this.findFarthestPosition(position, vector);
                    const next = this.grid.getCellData(positions.next);

                    if (next && next.value === tile.value && !next.mergedFrom) {
                        const merged = new Tile(positions.next, tile.value * 2);
                        merged.mergedFrom = [tile, next];

                        this.grid.insertTile(merged);
                        this.grid.removeTile(tile);

                        tile.updatePosition(positions.next);

                        this.score += merged.value;

                        if (merged.value === 2048) this.won = true;
                    } else {
                        this.moveTile(tile, positions.farthest);
                    }

                    if (!this.positionsEqual(position, tile)) {
                        moved = true;
                    }
                }
            });
        });

        if (moved) {
            this.addRandomTile();

            if (!this.movesAvailable()) {
                this.over = true;
            }

            this.actuate();
        }
    }

    getVector(direction) {
        const map = {
            0: { x: 0, y: -1 }, // up
            1: { x: 1, y: 0 }, // right
            2: { x: 0, y: 1 }, // down
            3: { x: -1, y: 0 } // left
        };

        return map[direction];
    }

    buildTraversals(vector) {
        const traversals = { x: [], y: [] };

        for (let pos = 0; pos < this.grid.width; pos++) {
            traversals.x.push(pos);
        }

        for (let pos = 0; pos < this.grid.height; pos++) {
            traversals.y.push(pos);
        }

        if (vector.x === 1) traversals.x.reverse();
        if (vector.y === 1) traversals.y.reverse();

        return traversals;
    }

    findFarthestPosition(cell, vector) {
        let previous;

        do {
            previous = cell;
            cell = { x: previous.x + vector.x, y: previous.y + vector.y };
        } while (this.grid.withinBounds(cell) && this.grid.cellAvailable(cell));

        return {
            farthest: previous,
            next: cell
        };
    }

    movesAvailable() {
        return this.grid.cellsAvailable() || this.tileMatchesAvailable();
    }

    tileMatchesAvailable() {
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                const tile = this.grid.getCellData({ x: x, y: y });

                if (tile) {
                    for (let direction = 0; direction < 4; direction++) {
                        const vector = this.getVector(direction);
                        const cell = { x: x + vector.x, y: y + vector.y };
                        const other = this.grid.getCellData(cell);

                        if (other && other.value === tile.value) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    positionsEqual(first, second) {
        return first.x === second.x && first.y === second.y;
    }
}
