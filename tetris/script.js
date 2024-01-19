
const WIDTH = 10;
const HEIGHT = 25;

class Board {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        this.grid = Array.from({length: height}, () => Array.from({length: width}, () => null))

        this.grid[4][2] = true;
        this.grid[4][3] = true;
        this.grid[4][4] = true;
        this.grid[5][3] = true;
    }

    toString() {
        const empty = " .";
        const emptyWidth = empty.length;

        const linePaddingLeft = "<!";
        const linePaddingRight = "!>";

        const lines = []
        
        for (const row of this.grid) {
            lines.push(linePaddingLeft + row.map((tile) =>
                (tile ? "[]" : empty )
            ).join("") + linePaddingRight)
        }

        const bottom1 = "=";
        lines.push(linePaddingLeft + bottom1.repeat(this.width * emptyWidth) + linePaddingRight);
        
        const bottom2 = "\\/";
        lines.push(" ".repeat(linePaddingLeft.length) + (bottom2.repeat(this.width * emptyWidth / bottom2.length)) + " ".repeat(linePaddingRight.length));

        return lines.join("\n");
    }
}

const board = new Board(WIDTH, HEIGHT);

const gameElement = document.querySelector(".game");
gameElement.innerText = board.toString();