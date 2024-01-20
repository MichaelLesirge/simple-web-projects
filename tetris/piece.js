
function rotate90degrees(grid) {
    return grid[0].map((val, index) => grid.map(row => row[index]).reverse())
}

export default class TetrisPiece {
    numOfStates = 4;

    constructor(shape, {x = 0, y = 0, state = 0} = {}) {
        this.x = x;
        this.y = y;

        
        this.states = [];
        for (let i = 0; i < this.numOfStates; i++) {
            this.states.push(shape);
            shape = rotate90degrees(shape) 
        }

        this.setState(state);
    }

    setState(state) {
        this.state = state;

        const grid = this.getGrid()

        this.height = grid.length;
        this.width = this.height && grid[0].length;
    }

    spin() {
        this.state = (this.state + 1) % this.states.length;
        [this.height, this.width] = [this.width, this.height]
    }

    getGrid() {
        return this.states[this.state];
    }

    hitsBottom(grid) {
        const currentState = this.states[this.state];

        const x = Math.floor(this.x);
        const y = Math.floor(this.y);

        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                if (currentState[row][col] && (y + row >= grid.length || grid[row + y][col + x])) return true;
            }   
        }

        return false;
    }
}
