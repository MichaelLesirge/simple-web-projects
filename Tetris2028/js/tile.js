export default class Tile {
    constructor(position, value = 2) {
        
        this.x = position.x;
        this.y = position.y;
        this.value = value;

        this.previousPosition = null;
        this.mergedFrom = null; // Tracks tiles that merged together
    }

    savePosition() {
        this.previousPosition = { x: this.x, y: this.y };
    }

    updatePosition(position) {
        this.x = position.x;
        this.y = position.y;
    }
}
