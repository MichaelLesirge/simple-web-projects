
function rotate90degrees(grid) {
    return grid[0].map((val, index) => grid.map(row => row[index]).reverse())
}

export default class TetrisPiece {
    maxNumOfStates = 4;

    constructor(shape, { x = 0, y = 0, state = 0 } = {}) {
        this.x = x;
        this.y = y;

        this.states = [];
        for (let i = 0; i < this.maxNumOfStates; i++) {
            this.states.push(shape);
            shape = rotate90degrees(shape)
            if (shape == this.states[0]) break
        }

        this.setState(state);
        this.save();
    }

    save() {
        this.saved = [this.x, this.y, this.width, this.height, this.state];
    }
    
    load() {
        [this.x, this.y, this.width, this.height, this.state] = this.saved;
    }

    setState(state) {
        this.state = state;

        const grid = this.getGrid()

        this.height = grid.length;
        this.width = this.height && grid[0].length;
    }

    spin() {
        this.state = (this.state + 1) % this.states.length;
        [this.height, this.width] = [this.width, this.height];
    }

    getGrid() {
        return this.states[this.state];
    }

    hasValidState(grid) {
        const currentState = this.states[this.state];
        
        const height = grid.length;
        const width = height && grid[0].length;

        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                if (currentState[row][col] && (
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
