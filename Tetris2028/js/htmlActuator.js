export default class HTMLActuator {
    /**
     * @param {HTMLDivElement} gridContainer 
     * @param {HTMLDivElement} scoreContainer 
     * @param {HTMLDivElement} bestContainer 
     * @param {HTMLDivElement} messageContainer 
     */
    constructor(gridContainer, scoreContainer, bestContainer, messageContainer, base = 2) {
        this.gridContainer = gridContainer;
        this.scoreContainer = scoreContainer;
        this.bestContainer = bestContainer;
        this.messageContainer = messageContainer;
        
        this.base = base;
        this.score = 0;

        this.gridBackgroundSize = null;
    }

    /**
     * @param {import('./board.js').default} grid 
     */
    actuate(grid, metadata) {
        window.requestAnimationFrame(() => {
            this.clearContainer(this.gridContainer)

            for (let y = 0; y < grid.height; y++) {

                const row = document.createElement("div");
                row.classList.add("grid-row");
                
                for (let x = 0; x < grid.width; x++) {
                    const tile = document.createElement("div");
                    tile.classList.add("tile");
                    
                    const data = grid.getCellData({x, y})
                    if (data !== null) {
                        const innerTile = document.createElement("div");
                        innerTile.classList.add("tile-inner");

                        innerTile.textContent = data.value;
                        
                        const value = this.baseLog(this.base, data.value);
                        innerTile.setAttribute("value", value > 11 ? "super" : value);

                        tile.appendChild(innerTile);
                    }

                    row.appendChild(tile)
                }

                this.gridContainer.appendChild(row);
            }

            this.updateScore(metadata.score);
            this.updateBestScore(metadata.bestScore);
            if (metadata.terminated) {
                if (metadata.over) {
                    this.message(false); // You lose
                } else if (metadata.won) {
                    this.message(true); // You win!
                }
            }
        });
    }

    baseLog(x, y) {
        return Math.log(y) / Math.log(x);
    }

    continue() {
        this.clearMessage();
    }

    clearContainer(element) {
        while (element.firstChild) {
            element.removeChild(element.lastChild);
        }
    }

    normalizePosition(position) {
        return { x: position.x + 1, y: position.y + 1 };
    }

    positionElement(element, position) {
    }

    updateScore(score) {
        this.clearContainer(this.scoreContainer);
        const difference = score - this.score;
        this.score = score;
        this.scoreContainer.textContent = this.score;

        if (difference > 0) {
            const addition = document.createElement("div");
            addition.classList.add("score-addition");
            addition.textContent = `+${difference}`;
            this.scoreContainer.appendChild(addition);
        }
    }

    updateBestScore(bestScore) {
        this.bestContainer.textContent = bestScore;
    }

    message(won) {
        const type = won ? "game-won" : "game-over";
        const message = won ? "You win!" : "Game over!";
        this.messageContainer.classList.add(type);
        this.messageContainer.getElementsByTagName("p")[0].textContent = message;
    }

    clearMessage() {
        this.messageContainer.classList.remove("game-won");
        this.messageContainer.classList.remove("game-over");
    }
}
