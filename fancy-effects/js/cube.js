import { startLoop, updateCanvasSizes, setHashAutoFocus } from "./canvasUtil.js";
import { randomInt, randomFloat } from "./util.js";

const canvas = document.getElementById("cube-canvas");
updateCanvasSizes(canvas);
const ctx = canvas.getContext("2d");

class Cube {
    constructor(centerX, centerY, scale, {rotationSpeedX = 0, rotationSpeedY = 0, rotationSpeedZ = 0} = {}) {
        
        this.centerX = centerX;
        this.centerY = centerY;
        this.scale = scale;
        
        this.points = this.createCube();
        
        this.angleX = 0;
        this.angleY = 0;
        this.angleZ = 0;
        
        this.rotationSpeedX = rotationSpeedX;
        this.rotationSpeedY = rotationSpeedY;
        this.rotationSpeedZ = rotationSpeedZ;
        
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
        return [projectedX, projectedY, z];
    }

    update() {
        this.angleX += this.rotationSpeedX;
        this.angleY += this.rotationSpeedY;
        this.angleZ += this.rotationSpeedZ;
    }

    draw() {
        let rotatedPoints = this.points.map(point => this.rotatePoint(point));
        let projectedPoints = rotatedPoints.map(point => this.projectPoint(point));

        // Define faces (top and bottom are at indices 1 and 4)
        let faces = [
            [0, 1, 2, 3], [4, 5, 6, 7], // Front and back
            [0, 1, 5, 4], [2, 3, 7, 6], // Top and bottom
            [0, 3, 7, 4], [1, 2, 6, 5]  // Left and right
        ];

        // // Sort faces by depth
        // faces.sort((a, b) => {
        //     let avgZA = a.reduce((sum, i) => sum + projectedPoints[i][2], 0) / 4;
        //     let avgZB = b.reduce((sum, i) => sum + projectedPoints[i][2], 0) / 4;
        //     return avgZB - avgZA;
        // });

        // Draw faces
        faces.forEach((face, index) => {
            let path = new Path2D();
            path.moveTo(projectedPoints[face[0]][0], projectedPoints[face[0]][1]);
            for (let i = 1; i < face.length; i++) {
                path.lineTo(projectedPoints[face[i]][0], projectedPoints[face[i]][1]);
            }
            path.closePath();

            // Shade only top and bottom faces
            if (index === 1 || index === 0) {
                let normal = this.calculateNormal(rotatedPoints[face[0]], rotatedPoints[face[1]], rotatedPoints[face[2]]);
                let shade = Math.abs(normal[1]); // Use y component of normal for top/bottom shading
                ctx.fillStyle = `hsla(${this.color.match(/\d+/)[0]}, 100%, ${50 + shade * 25}%, 0.7)`;
                ctx.fill(path);
            } else {
                // ctx.fillStyle = `hsla(${this.color.match(/\d+/)[0]}, 100%, 50%, 0.7)`;
                // ctx.fill(path);
            }

            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.stroke(path);
        });

        // Draw points
        ctx.fillStyle = "white";
        for (let point of projectedPoints) {
            ctx.beginPath();
            ctx.arc(point[0], point[1], 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    calculateNormal(p1, p2, p3) {
        let v1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
        let v2 = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];
        let normal = [
            v1[1] * v2[2] - v1[2] * v2[1],
            v1[2] * v2[0] - v1[0] * v2[2],
            v1[0] * v2[1] - v1[1] * v2[0]
        ];
        let length = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
        return normal.map(n => n / length);
    }
}

let cubes = [];

function init() {
    cubes = [];

    const scale = Math.min(canvas.width, canvas.height) * 0.3;

    const cubesRotations = [
        {rotationSpeedX: randomFloat(-0.04, 0.04), rotationSpeedY: randomFloat(-0.01, 0.01)},
        {rotationSpeedY: randomFloat(-0.04, 0.04), rotationSpeedZ: randomFloat(-0.01, 0.01)},
        {rotationSpeedZ: randomFloat(-0.04, 0.04), rotationSpeedX: randomFloat(-0.01, 0.01)},
    ]


    for (let i = 0; i < cubesRotations.length; i++) {

        const centerX = canvas.width / (cubesRotations.length + 1) * (1 + i);
        const centerY = canvas.height / 2;
        cubes.push(new Cube(centerX, centerY, scale, cubesRotations[i]));
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