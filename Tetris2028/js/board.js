export default class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        this.reset();
    }

    reset() {
        /** Cells of Grid @type {import("./tile.js").default[][]} */
        this.cells = Array.from({ length: this.width }, () => Array.from({ length: this.height }, () => null));
    }

    getRandomAvailablePosition() {
        let cells = this.availablePositions();
        if (cells.length) {
            return cells[Math.floor(Math.random() * cells.length)];
        }
    }

    availablePositions() {
        let positions = [];
        this.forEach((position, data) => {
            if (data === null) positions.push(position);
        });
        return positions;
    }

    /**
     * 
     * @param {function({}, Tile|null): undefined} callback 
     */
    forEach(callback) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                callback({ x: x, y: y }, this.cells[x][y]);
            }
        }
    }

    cellsAvailable() {
        return this.availablePositions().length > 0;
    }

    cellAvailable(position) {
        return this.getCellData(position) === null;
    }

    cellOccupied(position) {
        return this.getCellData(position) !== null;
    }

    getCellData(position) {
        if (!this.withinBounds(position)) return null;

        return this.cells[position.x][position.y];
    }

    insertTile(tile) {
        if (this.withinBounds(tile)) {
            this.cells[tile.x][tile.y] = tile;
        }
    }

    removeTile(tile) {
        if (this.withinBounds(tile)) {
            this.cells[tile.x][tile.y] = null;
        }
    }

    withinBounds(position) {
        return (
            position.x >= 0 &&
            position.x < this.width &&
            position.y >= 0 &&
            position.y < this.height
        );
    }
}
