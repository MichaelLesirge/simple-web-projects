import { startLoop, updateCanvasSizes, setHashAutoFocus } from "./canvasUtil.js";

const canvas = document.getElementById("cube-canvas");
updateCanvasSizes(canvas);
const ctx = canvas.getContext("2d");

const NUM_OF_CUBES = 4;

class Cube {
    constructor(centerX, centerY, scale) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.scale = scale;
        this.points = this.createCube();
        this.angleX = Math.random() * Math.PI * 2;
        this.angleY = Math.random() * Math.PI * 2;
        this.angleZ = Math.random() * Math.PI * 2;
        this.rotationSpeedX = (Math.random() - 0.5) * 0.04;
        this.rotationSpeedY = (Math.random() - 0.5) * 0.04;
        this.rotationSpeedZ = (Math.random() - 0.5) * 0.04;
        this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
    }

    createCube() {
        return [
            [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
        ];
    }

    rotatePoint(point) {
        let [x, y, z] = point;

        // Rotate around X-axis
        let y1 = y * Math.cos(this.angleX) - z * Math.sin(this.angleX);
        let z1 = z * Math.cos(this.angleX) + y * Math.sin(this.angleX);

        // Rotate around Y-axis
        let x2 = x * Math.cos(this.angleY) - z1 * Math.sin(this.angleY);
        let z2 = z1 * Math.cos(this.angleY) + x * Math.sin(this.angleY);

        // Rotate around Z-axis
        let x3 = x2 * Math.cos(this.angleZ) - y1 * Math.sin(this.angleZ);
        let y3 = y1 * Math.cos(this.angleZ) + x2 * Math.sin(this.angleZ);

        return [x3, y3, z2];
    }

    projectPoint(point) {
        let [x, y, z] = point;
        let scaleFactor = this.scale / (4 + z);
        let projectedX = x * scaleFactor + this.centerX;
        let projectedY = y * scaleFactor + this.centerY;
        return [projectedX, projectedY];
    }

    update() {
        this.angleX += this.rotationSpeedX;
        this.angleY += this.rotationSpeedY;
        this.angleZ += this.rotationSpeedZ;
    }

    draw() {
        let rotatedPoints = this.points.map(point => this.rotatePoint(point));
        let projectedPoints = rotatedPoints.map(point => this.projectPoint(point));

        // Draw edges
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        let edges = [
            [0, 1], [1, 2], [2, 3], [3, 0], // Front face
            [4, 5], [5, 6], [6, 7], [7, 4], // Back face
            [0, 4], [1, 5], [2, 6], [3, 7]  // Connecting edges
        ];

        for (let edge of edges) {
            ctx.beginPath();
            ctx.moveTo(projectedPoints[edge[0]][0], projectedPoints[edge[0]][1]);
            ctx.lineTo(projectedPoints[edge[1]][0], projectedPoints[edge[1]][1]);
            ctx.stroke();
        }

        // Draw points
        ctx.fillStyle = this.color;
        for (let point of projectedPoints) {
            ctx.beginPath();
            ctx.arc(point[0], point[1], 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

let cubes = [];

function init() {
    cubes = [];

    const totalWidth = canvas.width * 0.8; // Use 80% of canvas width
    const totalHeight = canvas.height * 0.8; // Use 80% of canvas height
    const cubeWidth = totalWidth / Math.ceil(Math.sqrt(NUM_OF_CUBES));
    const cubeHeight = totalHeight / Math.ceil(Math.sqrt(NUM_OF_CUBES));
    const scale = Math.min(cubeWidth, cubeHeight) * 0.7; // Adjust this factor to change cube size

    for (let i = 0; i < NUM_OF_CUBES; i++) {
        const row = Math.floor(i / Math.ceil(Math.sqrt(NUM_OF_CUBES)));
        const col = i % Math.ceil(Math.sqrt(NUM_OF_CUBES));
        const centerX = (col + 0.5) * cubeWidth + canvas.width * 0.1;
        const centerY = (row + 0.5) * cubeHeight + canvas.height * 0.1;
        cubes.push(new Cube(centerX, centerY, scale));
    }
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function nextFrame() {
    clear();
    for (let cube of cubes) {
        cube.update();
        cube.draw();
    }
}

export default function cube() {
    setHashAutoFocus(canvas);
    startLoop(canvas, init, clear, nextFrame, { resetOnClick: true, resetOnResize: false });
}