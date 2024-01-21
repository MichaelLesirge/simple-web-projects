
function rotate90degrees(grid) {
    return grid[0].map((val, index) => grid.map(row => row[index]).reverse())
}

export default class TetrisPiece {
    numOfStates = 4;

    constructor(shape, { x = 0, y = 0, state = 0 } = {}) {
        this.x = x;
        this.y = y;

        this.states = [];
        for (let i = 0; i < this.numOfStates; i++) {
            this.states.push(shape);
            shape = rotate90degrees(shape)
        }

        this.setState(state);
        this.save();
    }

    save() {
        this.saved = [this.x, this.y, this.state];
    }

    load() {
        [this.x, this.y, this.state] = this.saved;
    }

    setState(state) {
        this.state = state;

        const grid = this.getGrid()

        this.height = grid.length;
        this.width = this.height && grid[0].length;
    }

    spin() {
        this.setState((this.state + 1) % this.states.length)
        // [this.height, this.width] = [this.width, this.height]
    }

    getGrid() {
        return this.states[this.state];
    }

    hasInvalidState(grid) {
        const currentState = this.states[this.state];

        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                if (currentState[row][col] && 
                    (this.x < 0 || this.x + this.width > grid[0].length || grid[row + this.y][col + this.x])
                ) return true;
            }
        }

        return false;
    }

    landed(grid) {
        const currentState = this.states[this.state];

        const y = this.y + 1;

        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                if (currentState[row][col] && (
                    y + row >= grid.length || grid[row + y][col + this.x])
                ) return true;
            }
        }

        return false;
    }
}
