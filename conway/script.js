
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

function simpleBlendRGB(...colors) {

    const colorCount = colors.length;
    let sumR = 0, sumG = 0, sumB = 0;

    for (const color of colors) {
        sumR += color[0] ** 2;
        sumG += color[1] ** 2;
        sumB += color[2] ** 2;
    }

    const blendedR = Math.sqrt(sumR / colorCount);
    const blendedG = Math.sqrt(sumG / colorCount);
    const blendedB = Math.sqrt(sumB / colorCount);

    return [blendedR, blendedG, blendedB];
}

function weightedAverageBlendRGB(color1, color2, t) {
    return [
        color1[0] * (1 - t) + color2[0] * t,
        color1[1] * (1 - t) + color2[1] * t,
        color1[2] * (1 - t) + color2[2] * t,
    ];
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

// --- Conway ---

const DEAD = 0;

class Conway {
    constructor(gridSize = 10, percentage = 0.5) {
        this.grid = [];
        this.nextGrid = [];
        this.cols = 0;
        this.rows = 0;

        this.showGridInput = document.getElementById('show-grid');
        this.gridSizeInput = document.getElementById('grid-size');

        this.percentage = percentage;


        this.startGridSize = gridSize;
        this.gridSizeInput.value = gridSize;
        this.gridSizeInput.addEventListener('change', () => {
            this.init();
        });

        this.drawColorInput = document.getElementById('draw-color');
        this.randomDrawColorCheckbox = document.getElementById('random-draw-color');

        this.drawColorInput.disabled = this.randomDrawColorCheckbox.checked;
        this.randomDrawColorCheckbox.addEventListener('change', () => {
            this.drawColorInput.disabled = this.randomDrawColorCheckbox.checked;
        });

        this.gridWrapAroundCheckbox = document.getElementById('grid-wrap-around');
    }

    init(percentage) {
        this.percentage = percentage ?? this.percentage ?? 0.5;

        this.cellSize = parseInt(this.gridSizeInput.value || this.startGridSize);

        this.cols = Math.floor(canvas.width / this.cellSize);
        this.rows = Math.floor(canvas.height / this.cellSize);

        this.grid = Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => Math.random() < this.percentage ? randRGB() : DEAD));
        this.nextGrid = Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => DEAD));
    }

    update() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {

                const neighbors = this.getNeighbors(i, j);

                const neighborsCount = neighbors.length;

                const tile = this.grid[i][j];

                if (tile === DEAD && neighborsCount === 3) {
                    this.nextGrid[i][j] = simpleBlendRGB(...neighbors);
                } else if (tile !== 0 && (neighborsCount < 2 || neighborsCount > 3)) {
                    this.nextGrid[i][j] = DEAD;
                } else {
                    this.nextGrid[i][j] = tile;
                }
            }
        }

        [this.nextGrid, this.grid] = [this.grid, this.nextGrid];
    }

    getNeighbors(row, col) {
        let neighbors = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;

                const tile = this.grid[(row + i + this.rows) % this.rows][(col + j + this.cols) % this.cols];

                if (!this.gridWrapAroundCheckbox.checked && (row + i < 0 || row + i >= this.rows || col + j < 0 || col + j >= this.cols)) {
                    continue;
                }

                if (tile !== DEAD) {
                    neighbors.push(tile)
                }

            }
        }
        return neighbors;
    }

    draw() {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();

        ctx.translate((canvas.width - this.cols * this.cellSize) / 2, (canvas.height - this.rows * this.cellSize) / 2);

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                ctx.clearRect(col * this.cellSize, row * this.cellSize, this.cellSize, this.cellSize);
                if (this.grid[row][col] !== DEAD) {
                    ctx.fillStyle = rgbToCss(this.grid[row][col]);
                    ctx.fillRect(col * this.cellSize, row * this.cellSize, this.cellSize, this.cellSize);
                }
            }
        }
        if (this.showGridInput.checked) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
            ctx.lineWidth = 1;
            for (let i = 0; i < this.rows + 1; i++) {
                ctx.beginPath();
                ctx.moveTo(0, i * this.cellSize);
                ctx.lineTo(canvas.width, i * this.cellSize);
                ctx.stroke();
            }
            for (let i = 0; i < this.cols + 1; i++) {
                ctx.beginPath();
                ctx.moveTo(i * this.cellSize, 0);
                ctx.lineTo(i * this.cellSize, canvas.height);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    drawAtPoint(x, y) {
        const row = Math.floor(y / this.cellSize);
        const col = Math.floor(x / this.cellSize);

        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;

        if (this.randomDrawColorCheckbox.checked) {
            this.drawColorInput.value = rgbToHex(...randRGB());
        }

        this.grid[row][col] = hexToRgb(this.drawColorInput.value);
    }

    mouseUp() {
        this.lastPos = null;
        this.isMouseDown = false;
    }

    mouseDown(x, y) {
        this.drawAtPoint(x, y);
        this.isMouseDown = true;
    }

    mouseMove(x, y) {
        if (!this.isMouseDown) return;

        const [lastX, lastY] = this.lastPos || [x, y];

        this.drawLine(lastX, lastY, x, y);

        this.lastPos = [x, y];
    }

    drawLine(x0, y0, x1, y1) {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);

        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;

        let err = dx - dy;

        while (true) {
            this.drawAtPoint(x0, y0);

            if (x0 === x1 && y0 === y1) break;

            const e2 = 2 * err;

            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }

            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }
    }

}

// --- Boids ---

const turnFactor = 0.2;
const visualRange = 40;
const protectedRange = 8;
const centeringFactor = 0.0005;
const avoidFactor = 0.05;
const matchingFactor = 0.05;
const maxSpeed = 6;
const minSpeed = 3;
const maxBias = 0.01;
const biasIncrement = 0.00004;
const defaultBiasVal = 0.001;

const boidsCount = Math.floor(canvas.width * canvas.height / 10000);

function makeSettings(prefix, values, func = (value) => value, textFunc = (value) => value) {
    return addSettings({}, prefix, values, func, textFunc);
}

function addSettings(settings, prefix, values, func = (value) => value, textFunc = (value) => value) {
    for (const [element, value] of Object.entries(values)) {
        const input = document.getElementById(`${prefix}-${element}`);
        const display = document.getElementById(`${prefix}-${element}-value`);

        function set(value) {
            input.value = value;
            display.textContent = textFunc(value);
        }

        settings[element] = {
            set: (value) => set(value),
            get: () => func(input.value ?? value)
        };

        set(value);

        input.addEventListener("input", (event) => {
            set(event.target.value);
        });
    }

    return settings;
}

const boidMovementSettings = makeSettings("boids", {
    "coherence": 100,
    "alignment": 100,
    "separation": 100,
}, (value) => parseFloat(value) / 100, (value) => `${value}%`);

const boidSettings = makeSettings("boids", {
    "count": boidsCount,
    "trail": 0,
}, (value) => Math.floor(value), (value) => Math.floor(value));

addSettings(boidSettings, "boids", {
    "scale": 100,
}, (value) => parseFloat(value) / 100, (value) => `${value}%`);

class Boid {
    constructor(group, x, y, vx, vy, rgb, scoutGroup, biasValue = defaultBiasVal) {
        this.group = group;

        this.x = x;
        this.y = y;

        this.vx = vx;
        this.vy = vy;

        this.rgb = rgb;

        this.biasValue = biasValue;
        this.scoutGroup = scoutGroup;

        this.trail = [];

        this.trailI = 0;

        this.groupRGB = null;
        this.oldGroupRGB = null;
    }

    update() {
        let xPosAvg = 0, yPosAvg = 0, xVelAvg = 0, yVelAvg = 0;
        let neighboringBoids = 0;
        let closeDx = 0, closeDy = 0;


        let isInGroup = false;

        for (const other of this.group.boids) {
            if (other === this) continue;

            const dx = this.x - other.x;
            const dy = this.y - other.y;

            const dist = Math.hypot(dy, dx);

            if (dist < protectedRange) {
                closeDx += dx;
                closeDy += dy;
            } else if (dist < visualRange) {
                xPosAvg += other.x;
                yPosAvg += other.y;
                xVelAvg += other.vx;
                yVelAvg += other.vy;
                neighboringBoids++;
                isInGroup = true;
                this.groupRGB = other.groupRGB === null ? randRGB() : other.groupRGB;
            }
        }

        if (!isInGroup) {
            this.groupRGB = null;
        }

        if (this.groupRGB !== null) {
            this.rgb = weightedAverageBlendRGB(this.rgb, this.groupRGB, 0.01);
        }

        // Alignment and Cohesion
        if (neighboringBoids > 0) {
            xPosAvg /= neighboringBoids;
            yPosAvg /= neighboringBoids;
            xVelAvg /= neighboringBoids;
            yVelAvg /= neighboringBoids;

            this.vx += (xPosAvg - this.x) * (centeringFactor * boidMovementSettings["coherence"].get()) + (xVelAvg - this.vx) * (matchingFactor * boidMovementSettings["alignment"].get());
            this.vy += (yPosAvg - this.y) * (centeringFactor * boidMovementSettings["coherence"].get()) + (yVelAvg - this.vy) * (matchingFactor * boidMovementSettings["alignment"].get());
        }

        // Separation
        this.vx += closeDx * (avoidFactor * boidMovementSettings["separation"].get());
        this.vy += closeDy * (avoidFactor * boidMovementSettings["separation"].get());

        // Boundary conditions (stay within the visible boundary)
        if (this.x < this.group.boundaryX) this.vx += turnFactor;
        if (this.x > this.group.boundaryX + this.group.boundaryWidth) this.vx -= turnFactor;
        if (this.y < this.group.boundaryY) this.vy += turnFactor;
        if (this.y > this.group.boundaryY + this.group.boundaryHeight) this.vy -= turnFactor;

        // Bias update
        if (this.scoutGroup === 1) {
            this.biasValue = this.vx > 0 ? Math.min(maxBias, this.biasValue + biasIncrement) : Math.max(biasIncrement, this.biasValue - biasIncrement);
        } else if (this.scoutGroup === 2) {
            this.biasValue = this.vx < 0 ? Math.min(maxBias, this.biasValue + biasIncrement) : Math.max(biasIncrement, this.biasValue - biasIncrement);
        }

        // Apply bias
        if (this.scoutGroup === 1) {
            this.vx = (1 - this.biasValue) * this.vx + this.biasValue * 1;
        } else if (this.scoutGroup === 2) {
            this.vx = (1 - this.biasValue) * this.vx - this.biasValue * 1;
        }

        // Speed adjustment
        const speed = Math.sqrt(this.vx ** 2 + this.vy ** 2);
        if (speed < minSpeed) {
            this.vx = (this.vx / speed) * minSpeed;
            this.vy = (this.vy / speed) * minSpeed;
        }
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
        }

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Clamp position
        this.x = clamp(this.x, 0, canvas.width);
        this.y = clamp(this.y, 0, canvas.height);

        // Trail
        this.trailI++;
        this.trail.push({ x: this.x, y: this.y, rgb: this.rgb });
    }

    draw() {
        const angle = Math.atan2(this.vy, this.vx);

        ctx.save();

        ctx.translate(this.x, this.y);
        ctx.rotate(angle);

        const scale = boidSettings["scale"].get();

        const width = 3 * scale;
        const height = 7 * scale;

        ctx.beginPath();
        ctx.moveTo(height, 0);
        ctx.lineTo(-height, -width);
        ctx.lineTo(-height, width);
        ctx.closePath();

        ctx.fillStyle = rgbToCss(this.rgb);

        ctx.fill();

        ctx.restore();

        while (this.trail.length > boidSettings["trail"].get()) {
            this.trail.shift();
        }
        for (let i = 1; i < this.trail.length; i++) {
            const element = this.trail[i];
            const lastElement = this.trail[i - 1];

            ctx.save()
            ctx.fillStyle = rgbToCss(lastElement.rgb);

            ctx.globalAlpha = i / this.trail.length;
            ctx.beginPath();
            ctx.moveTo(element.x, element.y);
            ctx.lineTo(lastElement.x, lastElement.y);
            ctx.stroke();
            ctx.restore();
        }
    }
}

class Boids {
    constructor(percentagePadding = 0.1) {
        this.boids = [];
        this.percentagePadding = percentagePadding;
    }

    init(boidsCount) {
        boidSettings["count"].set(boidsCount);

        this.boundaryWidth = canvas.width * this.percentagePadding;
        this.boundaryHeight = canvas.height * this.percentagePadding;
        this.boundaryX = (canvas.width - this.boundaryWidth) / 2;
        this.boundaryY = (canvas.height - this.boundaryHeight) / 2;

        this.boids = [];
    }

    update() {
        while (this.boids.length < boidSettings["count"].get()) {
            this.boids.push(new Boid(
                this,
                randomFloat(this.boundaryX, this.boundaryX + this.boundaryWidth),
                randomFloat(this.boundaryY, this.boundaryY + this.boundaryHeight),
                randomFloat(-1, 1),
                randomFloat(-1, 1),
                randRGB(),
                randomChoice([1, 2]),
            ));
        }

        while (this.boids.length > boidSettings["count"].get()) {
            this.boids.shift();
        }

        while (this.boids.length > 1000) {
            this.boids.shift();
        }

        boidSettings["count"].set(this.boids.length);

        for (const boid of this.boids) {
            boid.update();
        }
    }

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.boids.forEach(boid => boid.draw());

        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 3;
        ctx.strokeRect(this.boundaryX, this.boundaryY, this.boundaryWidth, this.boundaryHeight);
    }

    click(event) {
        this.boids.push(
            new Boid(
                this,
                event.clientX * dpr,
                event.clientY * dpr,
                randomFloat(-1, 1),
                randomFloat(-1, 1),
                randRGB(),
                randomChoice([1, 2]),
            ));
        boidSettings["count"].set(this.boids.length);
    }

    mouseDown(event) {
        this.isMouseDown = true;
    }

    mouseUp(event) {
        this.isMouseDown = false;
    }

    mouseMove(event) {
        if (this.isMouseDown) {
            this.boids.push(new Boid(
                this,
                event.clientX * dpr,
                event.clientY * dpr,
                event.movementX,
                event.movementY,
                randRGB(),
                randomChoice([1, 2]),
            ));
            boidSettings["count"].set(this.boids.length);
        }
    }
}

// --- Particles ---

const distanceConnect = 100;

const particleCount = Math.floor(canvas.width * canvas.height / 50000);

const particleSettings = makeSettings("particles", {
    "count": boidsCount,
}, (value) => Math.floor(value), (value) => Math.floor(value));

addSettings(particleSettings, "particles", {
    "scale": 100,
    "repel": 100,
}, (value) => parseFloat(value) / 100, (value) => `${value}%`);

addSettings(particleSettings, "particles", {
    "friction": 0,
}, (value) => parseFloat(value) / 100, (value) => `${value / 100}`);

class Particle {
    constructor(group, x, y, vx, vy, radius, rgb) {
        this.group = group;

        this.x = x;
        this.y = y;

        this.radius = radius;
        this.color = rgb;

        this.vx = vx;
        this.vy = vy;

        this.connections = [];
    }

    draw() {
        const [x, y] = [this.getX(), this.getY()]

        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;

        const radius = this.radius * particleSettings["scale"].get();

        ctx.beginPath();
        ctx.arc(x, y, radius * this.connections.length, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(x, y, (radius + 5) * this.connections.length, 0, Math.PI * 2, true);
        ctx.stroke();
        ctx.closePath();

        ctx.stroke();

        for (const otherParticle of this.connections.filter((otherParticle) => this.findDistance(otherParticle) < distanceConnect * particleSettings["scale"].get())) {
            ctx.strokeStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(otherParticle.getX(), otherParticle.getY());
            ctx.stroke();
        }
    }

    getX() {
        return this.x * canvas.width;
    }

    getY() {
        return this.y * canvas.height;
    }

    findDistance(other) {
        return Math.sqrt((this.getX() - other.getX()) ** 2 + (this.getY() - other.getY()) ** 2);
    }

    update() {
        const speedModifier = Math.pow(0.5, this.connections.length)

        for (const otherParticle of this.connections) {
            const dx = this.getX() - otherParticle.getX();
            const dy = this.getY() - otherParticle.getY();

            const dist = Math.hypot(dy, dx);

            if (dist < 1) continue;

            const force = (1 / dist ** 2) * 5 * particleSettings["repel"].get();

            this.vx += dx * force;
            this.vy += dy * force;
        }

        this.vx *= (1 - particleSettings["friction"].get() / canvas.width * 100);
        this.vy *= (1 - particleSettings["friction"].get() / canvas.height * 100);
        

        this.x += (this.vx / canvas.width) * speedModifier;
        this.y += (this.vy / canvas.height) * speedModifier;

        if (this.x > 1) this.x = 0;
        if (this.x < 0) this.x = 1;
        if (this.y > 1) this.y = 0;
        if (this.y < 0) this.y = 1;

        this.connections = this.group.particles.filter(
            (otherParticle) => this.color === otherParticle.color &&
                this.findDistance(otherParticle) < distanceConnect * particleSettings["scale"].get()
        );
    }
}

class Particles {
    constructor(colors) {
        this.colors = colors;
        this.particles = [];
    }

    init(particleCount) {
        particleSettings["count"].set(particleCount);
        this.particles = [];
    }

    update() {
        while (this.particles.length < particleSettings["count"].get()) {
            this.particles.push(new Particle(
                this,
                randomFloat(0, 1),
                randomFloat(0, 1),
                randomFloat(-1.5, 1.5),
                randomFloat(-1.5, 1.5),
                randomFloat(1, 2),
                randomChoice(this.colors),
            ));
        }

        while (this.particles.length > particleSettings["count"].get()) {
            this.particles.shift();
        }

        while (this.particles.length > 1000) {
            this.particles.shift();
        }

        particleSettings["count"].set(this.particles.length);

        for (const particle of this.particles) {
            particle.update();
        }
    }

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.particles.forEach(particle => particle.draw());

        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 3;
        ctx.strokeRect(this.boundaryX, this.boundaryY, this.boundaryWidth, this.boundaryHeight);
    }

    click(event) {        
        this.particles.push(            
            new Particle(
                this,
                event.clientX / canvas.width,
                event.clientY / canvas.height,
                randomFloat(-1.5, 1.5),
                randomFloat(-1, 1),
                randomFloat(1, 2),
                randomChoice(this.colors),
            ));
        particleSettings["count"].set(this.particles.length);
    }
}

const conway = new Conway(16);
const boids = new Boids(0.7);
const particles = new Particles(["#f35d4f", "#c0d988", "#6ddaf1", "#f1e85b"]);

// -- Funcs loop --

const inits = {
    "conway": () => {
        conway.init(0.1);
        document.getElementById("conway-settings").classList.add("active");

        canvas.addEventListener("mousemove", (event) => conway.mouseMove(event.clientX * dpr, event.clientY * dpr));
        canvas.addEventListener("mousedown", (event) => conway.mouseDown(event.clientX * dpr, event.clientY * dpr));
        canvas.addEventListener("mouseup", (event) => conway.mouseUp());
        canvas.addEventListener("mouseleave", (event) => conway.mouseUp());
    },
    "boids": () => {
        boids.init(boidsCount);
        document.getElementById("boids-settings").classList.add("active");

        canvas.addEventListener("click", (event) => boids.click(event));
        canvas.addEventListener("mousemove", (event) => boids.mouseMove(event));
        canvas.addEventListener("mousedown", (event) => boids.mouseDown(event));
        canvas.addEventListener("mouseup", (event) => boids.mouseUp(event));
        canvas.addEventListener("mouseleave", (event) => boids.mouseUp(event));
    },
    "particle": () => {
        particles.init(particleCount);
        document.getElementById("particle-settings").classList.add("active");

        canvas.addEventListener("click", (event) => particles.click(event));
    }
}

const clearInit = {
    "conway": () => {
        conway.init(0);
    },
    "boids": () => {
        boids.init(0);
    },
    "particle": () => {
        particles.init(0);
    }
}

const updates = {
    "conway": () => {
        conway.update();
    },
    "boids": () => {
        boids.update();
    },
    "particle": () => {
        particles.update();
    }
}

const draws = {
    "conway": () => {
        conway.draw();
    },
    "boids": () => {
        boids.draw();
    },
    "particle": () => {
        particles.draw();
    }
}

const end = {
    "conway": () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        document.getElementById("conway-settings").classList.remove("active");
    },
    "boids": () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        document.getElementById("boids-settings").classList.remove("active");
    },
    "particle": () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        document.getElementById("particle-settings").classList.remove("active");
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
    }
    if (draws[mode]) draws[mode]();

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