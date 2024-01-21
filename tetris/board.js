
export default class Board {
    constructor(width, height) {
        this.width = width ?? 0;
        this.height = height ?? 0;

        this.grid = Array.from({ length: height }, () => Array.from({ length: width }, () => 0));
    }

    findFullLines() {
        const linesToDelete = [];

        for (let i = 0; i < this.grid.length; i++) {            
            if (this.grid[i].every((val) => val)) linesToDelete.push(i)
        }

        return linesToDelete;
    }

    clearLines(linesToDelete) {
        this.grid = Array.from({ length: linesToDelete.length }, () => Array.from({ length: this.width }, () => 0)).concat(
            this.grid.filter((value, index) => !linesToDelete.includes(index)));
    }

    getGrid() {
        return this.grid;
    }

    getDrawingCopy() {
        const board = new Board();

        board.width = this.width;
        board.height = this.width;
        board.grid = structuredClone(this.grid);

        return board;
    }

    drawGrid(grid, { x = 0, y = 0, width, height} = {}) {

        x = Math.floor(x);
        y = Math.floor(y);

        height = Math.floor(width ?? grid.length ?? 0);
        width = Math.floor(width ?? (height && grid[0].length) ?? 0);

        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                if (grid[row][col]) this.grid[y + row][x + col] = 1;
            }
        }
    }
}