
export const shapes = []

class ShapeType {
    constructor(name, shape, maxRotations = 4) {
        this.name = name;
        this.shape = shape;
        this.maxRotations = maxRotations;

        this.height = shape.length;
        this.width = shape[0].length;

        this.largestDim = Math.max(this.width, this.height);

        this.rotations = [];
        if (maxRotations !== null) {
            for (let i = 0; i < maxRotations; i++) {
                this.rotations.push(shape);
                shape = this.rotate90degrees(shape)
                if (shape == this.rotations[0]) break
            }
        }
        else {
            this.rotations.push(...shape);
        }

        shapes.push(this)
    }

    rotate90degrees(grid) {
        return grid[0].map((val, index) => grid.map(row => row[index]).reverse())
    }
}

new ShapeType("O", [
    [1, 1],
    [1, 1],
]);

new ShapeType("I", [
    [0, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 0, 0],
], 2);

new ShapeType("S", [[
    [0, 0, 0],
    [0, 1, 1],
    [1, 1, 0],
], [
    [0, 1, 0],
    [0, 1, 1],
    [0, 0, 1],
]], null);

new ShapeType("Z", [[
    [0, 0, 0],
    [1, 1, 0],
    [0, 1, 1],
], [
    [0, 0, 1],
    [0, 1, 1],
    [0, 1, 0],
]], null);

new ShapeType("L", [
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 1],
]);

new ShapeType("J", [
    [0, 1, 0],
    [0, 1, 0],
    [1, 1, 0],
]);

new ShapeType("T", [
    [0, 0, 0],
    [1, 1, 1],
    [0, 1, 0],
]);