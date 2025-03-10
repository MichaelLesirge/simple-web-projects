
function repeat(value, times) {
    return Array.from({ length: times }, () => value);
}

// -- Canvas setup --

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const dpr = Math.ceil(window.devicePixelRatio || 1);
fitToContainer(canvas);
updateCanvasSizes(canvas, dpr);

// -- FPS selection --

const fpsInput = document.getElementById('fps');
const pauseBtn = document.getElementById("pause-btn");

let fps = 0;
let lastFPS = fpsInput.value;

const pauseText = "⏸️ Pause";
const resumeText = "▶️ Resume";

function updateFPS() {
    fps = fpsInput.value;
    document.getElementById('fps-value').textContent = fps;
    pauseBtn.textContent = fps == 0 ? resumeText : pauseText;
}
fpsInput.addEventListener('input', updateFPS);

pauseBtn.addEventListener("click", (event) => {
    if (event.target.textContent == pauseText) {
        lastFPS = fpsInput.value;
    }
    fpsInput.value = event.target.textContent == pauseText ? 0 : lastFPS;
    updateFPS();

});
document.getElementById("fps-btn").addEventListener("click", (event) => {
    fpsInput.value = 60;
    updateFPS();
});

updateFPS();

// -- Mode selection --

let mode = Array.from(document.getElementsByName("mode-select-button")).filter((button) => button.checked)[0].value;

document.getElementsByName("mode-select-button").forEach((button) => {
    button.addEventListener("change", (event) => {
        mode = event.target.value;
    });
});


// --- Color Util ---

function randRGB() {
    return [randomFloat(0, 255), randomFloat(0, 255), randomFloat(0, 255)]
}

function rgbToCss(color) {
    if (color.length == 4) {
        return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`
    }
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`
}

function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
}

function rgbToHex(r, g, b) {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

// -- Funcs loop --

class Points3d {
    constructor() {
        this.points = [];
        this.connections = [];
        this.faces = [];
        this.scale = 1;
    }

    clear() {
        this.points = [];
        this.connections = [];
        this.faces = [];
    }

    setScale(scale) {
        this.scale = scale;
    }

    setDot(color, radius = 3) {
        this.dotColor = color;
        this.radius = radius;
    }

    setLine(color, width = 1) {
        this.lineColor = color;
        this.lineWidth = width;
    }

    setPoints(points, connections = [], faces = []) {
        this.basePoints = points;
        this.points = structuredClone(this.basePoints);
        this.connections = connections;
        this.faces = faces;
    }

    update() {

    }

    rotateTo(pitch, roll, yaw) {
        this.points = structuredClone(this.basePoints);
        this.rotate(pitch, pitch, roll);
    }

    rotate(dPitch, dRoll, dYaw) {
        const cosA = Math.cos(dYaw);
        const sinA = Math.sin(dYaw);

        const cosB = Math.cos(dPitch);
        const sinB = Math.sin(dPitch);

        const cosC = Math.cos(dRoll);
        const sinC = Math.sin(dRoll);

        const Axx = cosA * cosB;
        const Axy = cosA * sinB * sinC - sinA * cosC;
        const Axz = cosA * sinB * cosC + sinA * sinC;

        const Ayx = sinA * cosB;
        const Ayy = sinA * sinB * sinC + cosA * cosC;
        const Ayz = sinA * sinB * cosC - cosA * sinC;

        const Azx = -sinB;
        const Azy = cosB * sinC;
        const Azz = cosB * cosC;

        for (const point of this.points) {
            const [x, y, z] = point;

            point[0] = Axx * x + Axy * y + Axz * z;
            point[1] = Ayx * x + Ayy * y + Ayz * z;
            point[2] = Azx * x + Azy * y + Azz * z;
        }
    }

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);

        ctx.fillStyle = this.dotColor ?? "white";
        ctx.strokeStyle = this.lineColor ?? "white";
        ctx.lineWidth = this.lineWidth ?? 1;

        const projectedPoints = this.points.map(([x, y, z]) => {
            const scale = 100 / (z + 100);
            return [x * scale * this.scale, y * scale * this.scale];
        });

        for (let [x, y] of projectedPoints) {
            ctx.beginPath();
            ctx.arc(x, y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        for (let connection of this.connections) {
            const [i, j] = connection;
            const [x1, y1] = projectedPoints[i];
            const [x2, y2] = projectedPoints[j];

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        // front face
        this.faces = [
            [0, 1, 2, 3]
        ]

        for (let face of this.faces) {
            ctx.fillStyle = "rgba(249, 24, 24, 0.76)";

            ctx.beginPath();
            for (let i = 0; i < face.length; i++) {
                const [x, y] = projectedPoints[face[i]];
                if (i == 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}

class RotationController {
    constructor(points3d) {
        this.points = points3d;

        this.yawVelocity = 0;
        this.pitchVelocity = 0;
        this.rollVelocity = 0;

        this.yawAcceleration = 0;
        this.pitchAcceleration = 0;
        this.rollAcceleration = 0;

        const acceleration = 0.01;

        document.addEventListener("keydown", (event) => {
            switch (event.key) {
                case "ArrowLeft":
                    this.yawAcceleration += acceleration;
                    break;
                case "ArrowRight":
                    this.yawAcceleration -= acceleration
                    break;
                case "ArrowUp":
                    this.pitchAcceleration -= acceleration;
                    break;
                case "ArrowDown":
                    this.pitchAcceleration += acceleration
                    break;
                case "a":
                    this.rollAcceleration -= acceleration;
                    break;
                case "d":
                    this.rollAcceleration += acceleration
                    break;
            }
        });
    }

    set(yaw, pitch, roll) {
        this.reset();
        this.yawAcceleration = yaw;
        this.pitchAcceleration = pitch;
        this.rollAcceleration = roll
    }

    reset() {
        this.yawVelocity = 0;
        this.pitchVelocity = 0;
        this.rollVelocity = 0;

        this.yawAcceleration = 0;
        this.pitchAcceleration = 0;
        this.rollAcceleration = 0;
    }

    update() {
        this.yawVelocity += this.yawAcceleration;
        this.pitchVelocity += this.pitchAcceleration;
        this.rollVelocity += this.rollAcceleration;

        this.points.rotate(this.yawVelocity, this.pitchVelocity, this.rollVelocity);

        this.yawVelocity *= 0.9;
        this.pitchVelocity *= 0.9;
        this.rollVelocity *= 0.9;

        this.yawAcceleration *= 0;
        this.pitchAcceleration *= 0;
        this.rollAcceleration *= 0;
    }
}

const points = new Points3d();
const rotationController = new RotationController(points);

const inits = {
    "lorenz": () => {
        document.getElementById("lorenz-settings").classList.add("active");
        points.clear();

    },
    "cube": () => {
        document.getElementById("cube-settings").classList.add("active");
        points.clear();
        points.setPoints([
            [-1, -1, -1],
            [1, -1, -1],
            [1, 1, -1],
            [-1, 1, -1],
            [-1, -1, 1],
            [1, -1, 1],
            [1, 1, 1],
            [-1, 1, 1]
        ], [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 0],
            [4, 5],
            [5, 6],
            [6, 7],
            [7, 4],
            [0, 4],
            [1, 5],
            [2, 6],
            [3, 7]
        ]);

        points.setScale(200);
        points.setDot("white");

        rotationController.set(randomFloat(-0.01, 0.01), randomFloat(-0.01, 0.01), randomFloat(-0.01, 0.01));
    }
}

const clearInit = {
    "lorenz": () => {
    },
    "cube": () => {
        rotationController.reset();
        points.rotateTo(0, 0, 0);

    }
}

const updates = {
    default: () => {
        points.update();
    },
    "lorenz": () => {
    },
    "cube": () => {
        rotationController.update();
    }
}

const draws = {
    default: () => {
        points.draw();
    },
    "lorenz": () => {
    },
    "cube": () => {
    }
}

const end = {
    "lorenz": () => {
        document.getElementById("lorenz-settings").classList.remove("active");
    },
    "cube": () => {
        document.getElementById("cube-settings").classList.remove("active");
    }
}


// --- Buttons ---

const clearButton = document.getElementById('clear-btn');
const randomButton = document.getElementById('random-btn');

clearButton.addEventListener('click', () => {
    if (clearInit[mode]) clearInit[mode]();
});

randomButton.addEventListener('click', () => {
    if (inits[mode]) inits[mode]();
});

// -- Main loop --

let lastTime = 0;
let lastMode;

const realFpsOutput = document.getElementById("real-fps");

function loop() {
    const currentTime = performance.now();

    const deltaTime = currentTime - lastTime;
    const interval = 1000 / fps;

    if (mode !== lastMode) {
        console.log("Mode changed to", mode);
        if (end[lastMode]) end[lastMode]();
        if (inits[mode]) inits[mode]();
    }

    realFpsOutput.value = Math.round(1000 / deltaTime);

    if (deltaTime >= interval) {
        lastTime = currentTime;
        if (updates[mode]) updates[mode]();
        updates.default();
    }
    if (draws[mode]) draws[mode]();
    draws.default();

    lastMode = mode;

    requestAnimationFrame(loop);
}

window.addEventListener("resize", () => {
    if (inits[mode]) inits[mode]();
    lastTime = performance.now();
});

loop();

// --- Canvas resizing ---

function fitToContainer(canvas) {
    function updateToContainerOnce() {
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    window.addEventListener('resize', updateToContainerOnce);
    updateToContainerOnce();
}

function updateCanvasSizes(canvas, dpr = 1) {

    function updateCanvasSizesOnce() {
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
    }

    window.addEventListener("resize", updateCanvasSizesOnce);
    updateCanvasSizesOnce()
}

// --- Utility functions ---

function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function randomChoice(values) {
    return values[Math.floor(Math.random() * values.length)];
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function permutations(list, maxLen = null) {
    maxLen = (maxLen ?? list.length)
    const perm = list.map(v => [v]);
    const generate = (perm, maxLen, currLen) => {
        if (currLen === maxLen) {
            return perm;
        }
        for (let i = 0, len = perm.length; i < len; i++) {
            const currPerm = perm.shift();
            for (let k = 0; k < list.length; k++) {
                perm.push(currPerm.concat(list[k]));
            }
        }
        return generate(perm, maxLen, currLen + 1);
    };
    return generate(perm, maxLen, 1);
};