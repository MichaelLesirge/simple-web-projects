
// -- Canvas setup --

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const dpr = Math.ceil(window.devicePixelRatio || 1);
fitToContainer(canvas);
updateCanvasSizes(canvas, dpr);

// -- FPS selection --

const fpsInput = document.getElementById('fps');
let fps = 0;

function updateFPS() {
    fps = fpsInput.value;
    document.getElementById('fps-value').textContent = fps;
}
fpsInput.addEventListener('input', updateFPS);

document.getElementById("pause-btn").addEventListener("click", () => {
    fpsInput.value = 0;
    updateFPS();
});
document.getElementById("fps-btn").addEventListener("click", () => {
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

// Conway's Game of Life

function randRGB() {
    return [randomFloat(0, 255), randomFloat(0, 255), randomFloat(0, 255)]
}

function rgb2cmyk(r, g, b) {
    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    let k = Math.min(c, m, y);
    c = (c - k) / (1 - k);
    m = (m - k) / (1 - k);
    y = (y - k) / (1 - k);
    return [c, m, y, k];
}

function cmyk2rgb(c, m, y, k) {
    let r = c * (1 - k) + k;
    let g = m * (1 - k) + k;
    let b = y * (1 - k) + k;
    r = (1 - r) * 255 + .5;
    g = (1 - g) * 255 + .5;
    b = (1 - b) * 255 + .5;
    return [r, g, b];
}


function mixCmyks(...cmyks) {
    let c = cmyks.map(cmyk => cmyk[0]).reduce((a, b) => a + b, 0) / cmyks.length;
    let m = cmyks.map(cmyk => cmyk[1]).reduce((a, b) => a + b, 0) / cmyks.length;
    let y = cmyks.map(cmyk => cmyk[2]).reduce((a, b) => a + b, 0) / cmyks.length;
    let k = cmyks.map(cmyk => cmyk[3]).reduce((a, b) => a + b, 0) / cmyks.length;
    return [c, m, y, k];
}

function mixRgb(...colors) {
    let cmyks = colors.map(color => rgb2cmyk(...color));
    let mixed_cmyk = mixCmyks(...cmyks);
    return cmyk2rgb(...mixed_cmyk);
}

function rgbToCss(color) {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`
}

function hexToRgb(hex) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function(m, r, g, b) {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
}

function rgbToHex(r, g, b) {
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

const DEAD = 0;

class Conway {
    constructor(idealCellSize) {
        this.cellSize = idealCellSize;
        this.grid = [];
        this.nextGrid = [];
        this.cols = 0;
        this.rows = 0;

        this.showGridInput = document.getElementById('show-grid');
        this.drawColorInput = document.getElementById('draw-color');
        this.randomDrawColorCheckbox = document.getElementById('random-draw-color');

        this.drawColorInput.disabled = this.randomDrawColorCheckbox.checked;
        this.randomDrawColorCheckbox.addEventListener('change', () => {
            this.drawColorInput.disabled = this.randomDrawColorCheckbox.checked;
        });
    }

    init(percentage = 0.5) {
        this.cols = Math.floor(canvas.width / this.cellSize);
        this.rows = Math.floor(canvas.height / this.cellSize);

        this.grid = Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => Math.random() < percentage ? randRGB() : DEAD));
        this.nextGrid = Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => DEAD));
    }

    update() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {

                const neighbors = this.getNeighbors(i, j);

                const neighborsCount = neighbors.length;

                const tile = this.grid[i][j];

                if (tile === DEAD && neighborsCount === 3) {
                    this.nextGrid[i][j] = mixRgb(...neighbors);
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

const conway = new Conway(10);

// -- Funcs loop --

const inits = {
    "conway": () => {
        conway.init(0.1);
        canvas.addEventListener("mousemove", (event) => conway.mouseMove(event.clientX * dpr, event.clientY * dpr));        
        canvas.addEventListener("mousedown", (event) => conway.mouseDown(event.clientX * dpr, event.clientY * dpr));
        canvas.addEventListener("mouseup", (event) => conway.mouseUp());
    }
}

const updates = {
    "conway": () => {
        conway.update();
    }
}

const clearCanvas = {
    "conway": () => {
        conway.init(0);
    }
}

const draws = {
    "conway": () => {
        conway.draw();
    }
}

const clear = {
    "conway": () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}


// --- Buttons ---

const clearButton = document.getElementById('clear-btn');
const randomButton = document.getElementById('random-btn');

clearButton.addEventListener('click', () => {
    if (clearCanvas[mode]) clearCanvas[mode]();
});

randomButton.addEventListener('click', () => {
    if (inits[mode]) inits[mode]();
});

// -- Main loop --

let lastTime = 0;
let lastMode;

function loop() {
    const currentTime = performance.now();

    const deltaTime = currentTime - lastTime;
    const interval = 1000 / fps;

    if (mode !== lastMode) {
        console.log("Mode changed to", mode);
        if (clear[lastMode]) clear[lastMode]();
        if (inits[mode]) inits[mode]();
    }

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

// -- Canvas resizing --

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

// -- Utility functions --

function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}
