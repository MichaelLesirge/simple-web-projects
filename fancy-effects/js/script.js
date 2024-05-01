{
    const dragDuration = 200;

    const blob = document.getElementById("blob");
    let duration = 0;

    document.addEventListener("mousemove", (event) => {
        const { clientX, clientY } = event;

        blob.animate({
            left: `${clientX}px`,
            top: `${Math.min(clientY + window.scrollY, window.innerHeight - Math.max(blob.clientHeight, blob.clientWidth))}px`,
        }, { duration: duration, fill: "forwards" })

        duration = dragDuration;
    })

    document.addEventListener("mousedown", () => blob.style.background = "red")
    document.addEventListener("mouseup", () => blob.style.background = "")
}

function charRange(startChar, stopChar) {
    return Array.from({ length: stopChar.charCodeAt() - startChar.charCodeAt() + 1 }, (_, i) => String.fromCharCode(i + startChar.charCodeAt())).join("");
}

function randomChoice(values) {
    return values[Math.ceil(Math.random() * values.length) - 1]
}

function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

{

    const randomCharSet = charRange("a", "z") + charRange("A", "Z") + charRange("0", "9") + "`-=[]\\;',./~_+{}|:\"<>?".repeat(2);
    const iterWait = 50;
    const addAfter = 1000;

    document.querySelectorAll(".hacker-text").forEach((element) => {
        let isActive = false;

        element.addEventListener("mouseover", (event) => {
            if (isActive) return;
            isActive = true;

            const startString = element.innerText;
            let charSet = startString + randomCharSet;

            let startChars = Array.from(startString);
            let curChars = new Array(startChars.length);

            let count = 0

            let intervalId = setInterval(() => {
                count++;

                for (let i = 0; i < curChars.length; i++) {
                    // curChars[i] = curChars[i] === startString[i] ? curChars[i] : randChar(charSet);
                    if (curChars[i] !== startChars[i]) {
                        curChars[i] = randomChoice(charSet);
                        if (count * iterWait > addAfter) charSet += " ";
                    }
                    if (curChars[i] === " ") curChars[i] = startChars[i];
                }

                const curString = curChars.join("");
                element.innerText = curString;

                if (curString === startString) {
                    clearInterval(intervalId);
                    isActive = false;
                }
            }, iterWait)

        })
    })
};

function startLoop(canvas, init, clear, nextFrame, { resetOnScroll = false, resetOnClick = false }) {
    init();
    function loop() {
        clear();
        nextFrame();
        requestAnimationFrame(loop);
    }
    loop();

    function reset() {
        clear();
        init();
    }

    if (resetOnClick) canvas.addEventListener("click", reset)
    if (resetOnScroll) respondToVisibility(canvas, reset, {ratio: 1})
}

function respondToVisibility(element, callback, { ratio = 0 }) {
    const options = {
        root: document.documentElement,
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            callback(entry.intersectionRatio > ratio);
        });
    }, options);

    observer.observe(element);
}


function updateCanvasSizes(canvas) {

    function updateCanvasSizeWithDpr() {
        const dpr = Math.ceil(window.devicePixelRatio || 1);
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
    }

    window.addEventListener("resize", updateCanvasSizeWithDpr);
    updateCanvasSizeWithDpr()
}

{
    const canvas = document.getElementById("spiral");
    updateCanvasSizes(canvas);

    const colors = ["#D0E7F5", "#D9E7F4", "#D6E3F4", "#BCDFF5", "#B7D9F4", "#C3D4F0", "#9DC1F3", "#9AA9F4", "#8D83EF", "#AE69F0", "#D46FF1", "#DB5AE7", "#D911DA", "#D601CB", "#E713BF", "#F24CAE", "#FB79AB", "#FFB6C1", "#FED2CF", "#FDDFD5", "#FEDCD1"];

    const settings = {
        startTime: new Date().getTime(),

        durationSeconds: 60 * 30,

        maxCycles: Math.max(colors.length, 100),

        pulseEnabled: true,

        backgroundColor: "black",

        fontSize: 18,
    }

    const ctx = canvas.getContext("2d");

    function calculateVelocity(index) {
        const numberOfCycles = settings.maxCycles - index;
        const distancePerCycle = 2 * Math.PI;

        return (numberOfCycles * distancePerCycle) / settings.durationSeconds;
    }

    function calculateNextImpactTime(currentImpactTime, velocity) {
        return currentImpactTime + (Math.PI / velocity) * 1000;
    }

    function calculateDynamicOpacity(currentTime, lastImpactTime, baseOpacity, maxOpacity, duration) {
        const timeSinceImpact = currentTime - lastImpactTime, percentage = Math.min(timeSinceImpact / duration, 1);
        const opacityDelta = maxOpacity - baseOpacity;

        return maxOpacity - (opacityDelta * percentage);
    }

    function determineOpacity(currentTime, lastImpactTime, baseOpacity, maxOpacity, duration) {
        if (!settings.pulseEnabled) return baseOpacity;

        return calculateDynamicOpacity(currentTime, lastImpactTime, baseOpacity, maxOpacity, duration);
    }

    function calculatePositionOnArc(center, radius, angle) {
        return ({
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle)
        });
    }

    function secondsToHMS(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        const HH = String(hours).padStart(2, '0');
        const MM = String(minutes).padStart(2, '0');
        const SS = String(remainingSeconds).padStart(2, '0');

        return `${HH}:${MM}:${SS}`;
    }

    let arcs = [];

    function clear() {
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fill();
    }

    function init() {
        settings.startTime = new Date().getTime();

        ctx.lineCap = "round";

        arcs = colors.map((color, index) => {
            const velocity = calculateVelocity(index);
            const lastImpactTime = 0;
            const nextImpactTime = calculateNextImpactTime(settings.startTime, velocity);

            return {
                color,
                velocity,
                lastImpactTime,
                nextImpactTime
            };
        });
    }

    function drawArc(x, y, radius, start, end, fill = false) {
        ctx.beginPath();

        ctx.arc(x, y, radius, start, end);

        if (fill) ctx.fill();
        else ctx.stroke();
    }

    function drawPointOnArc(center, arcRadius, pointRadius, angle) {
        const position = calculatePositionOnArc(center, arcRadius, angle);

        drawArc(position.x, position.y, pointRadius, 0, 2 * Math.PI, true);
    }

    const length = Math.min(canvas.width, canvas.height) * 0.9, offset = (canvas.width - length) / 2;

    const start = {
        x: offset,
        y: canvas.height / 2
    };

    const end = {
        x: canvas.width - offset,
        y: canvas.height / 2
    };

    const center = {
        x: canvas.width / 2,
        y: canvas.height / 2
    };

    const baseLength = end.x - start.x;
    const base = {
        length: baseLength,
        minAngle: 0,
        startAngle: 0,
        maxAngle: 2 * Math.PI,
        initialRadius: baseLength * 0.05,
        circleRadius: baseLength * 0.006,
        clearance: baseLength * 0.03,
    };
    base.spacing = (base.length - base.initialRadius - base.clearance) / 2 / colors.length;

    function nextFrame() {
        const currentTime = new Date().getTime();
        const elapsedTime = (currentTime - settings.startTime) / 1000;

        arcs.forEach((arc, index) => {
            const radius = base.initialRadius + (base.spacing * index);

            // Draw arcs
            ctx.globalAlpha = determineOpacity(currentTime, arc.lastImpactTime, 0.15, 0.65, 1000);
            ctx.lineWidth = base.length * 0.002;
            ctx.strokeStyle = arc.color;

            const offset = base.circleRadius * (5 / 3) / radius;

            drawArc(center.x, center.y, radius, Math.PI + offset, (2 * Math.PI) - offset);

            drawArc(center.x, center.y, radius, offset, Math.PI - offset);

            // Draw impact points
            ctx.globalAlpha = determineOpacity(currentTime, arc.lastImpactTime, 0.15, 0.85, 1000);
            ctx.fillStyle = arc.color;

            drawPointOnArc(center, radius, base.circleRadius * 0.75, Math.PI);

            drawPointOnArc(center, radius, base.circleRadius * 0.75, 2 * Math.PI);

            // Draw moving circles
            ctx.globalAlpha = 1;
            ctx.fillStyle = arc.color;

            if (currentTime >= arc.nextImpactTime) {
                arc.lastImpactTime = arc.nextImpactTime;
                arc.nextImpactTime = calculateNextImpactTime(arc.nextImpactTime, arc.velocity);
            }

            const distance = elapsedTime >= 0 ? (elapsedTime * arc.velocity) : 0, angle = (Math.PI + distance) % base.maxAngle;

            drawPointOnArc(center, radius, base.circleRadius, angle);
        });

        ctx.font = `${settings.fontSize}px serif`;
        ctx.strokeStyle = "white";
        ctx.textAlign = "center";

        ctx.fillText(secondsToHMS(settings.durationSeconds - elapsedTime % settings.durationSeconds), center.x, Math.floor(center.y + settings.fontSize / 2));
    }

    startLoop(canvas, init, clear, nextFrame, { resetOnScroll: true, resetOnClick: true })
}

{
    const canvas = document.getElementById('matrix');
    updateCanvasSizes(canvas)

    const ctx = canvas.getContext('2d');

    const chars = charRange("a", "z") + charRange("0", "9") + "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン";

    const fontSize = 20;
    const trail = 20;
    const trailGap = 20;

    const maxColum = canvas.width / fontSize;

    let fallingChars = [];

    class Characters {
        constructor(i = 1) {
            this.x = i * fontSize;
            this.y = randomFloat(-500, 0);
            this.dy = randomFloat(1, 5)
        }

        update() {
            this.y += this.dy;

            if (this.y > canvas.height + trail * trailGap) {
                this.y = randomFloat(-500, 0)
                this.dy += randomFloat(-1.5, 1.5)
            }
        }

        draw() {
            for (let i = 0; i < trail; i++) {
                ctx.fillStyle = `rgba(0, 255, 0, ${(trail - i + 1) / trail})`
                ctx.fillText(randomChoice(chars), this.x, this.y - (i * trailGap));
            }
        }
    }

    function init() {
        fallingChars = Array.from({ length: maxColum }, (v, k) => new Characters(k))
    };

    function clear() {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fill();
    }

    function nextFrame() {
        ctx.font = fontSize + "px san-serif";
        ctx.textAlign = "center";

        for (const fallingChar of fallingChars) {

            fallingChar.update()

            fallingChar.draw();

        }
    }

    startLoop(canvas, init, clear, nextFrame, { resetOnScroll: false, resetOnClick: true })
}

{
    const canvas = document.getElementById("particle");
    updateCanvasSizes(canvas)

    const ctx = canvas.getContext("2d");

    const particlesNum = 100;
    const distanceConnect = 100;

    const colors = ["#f35d4f", "#f36849", "#c0d988", "#6ddaf1", "#f1e85b"];

    let particles = [];

    class Particle {
        constructor() {
            this.x = randomFloat(0, canvas.width);
            this.y = randomFloat(0, canvas.height);

            this.radius = randomFloat(1, 2);
            this.color = randomChoice(colors);

            this.vx = randomFloat(-1.5, 1.5);
            this.vy = randomFloat(-1.5, 1.5);

            this.connections = [];
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.strokeStyle = this.color;

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * this.connections.length, 0, Math.PI * 2, true);
            ctx.fill();
            ctx.closePath();

            ctx.beginPath();
            ctx.arc(this.x, this.y, (this.radius + 5) * this.connections.length, 0, Math.PI * 2, true);
            ctx.stroke();
            ctx.closePath();

            for (const otherParticle of this.connections) {
                ctx.strokeStyle = this.color;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(otherParticle.x, otherParticle.y);
                ctx.stroke();
            }
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;

            this.connections = particles.filter((otherParticle) => this.color === otherParticle.color && findDistance(this, otherParticle) < distanceConnect);
        }
    }

    function init() {
        particles = Array.from({ length: particlesNum }, () => new Particle())
    };

    function clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fill();
    }

    function nextFrame() {

        ctx.globalCompositeOperation = "lighter";

        for (const particle of particles) {

            particle.update();

            particle.draw();

        }
    }

    function findDistance(p1, p2) {
        return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    }

    startLoop(canvas, init, clear, nextFrame, { resetOnScroll: false, resetOnClick: true })
}

{
    const canvas = document.getElementById("conway");
    updateCanvasSizes(canvas);

    const ctx = canvas.getContext("2d");

    const gridSize = 10;

    const rows = Math.floor(canvas.height / gridSize);
    const cols = Math.floor(canvas.width / gridSize);

    const startingChanceOn = 0.3;

    function randRGB() {
        return [randomFloat(0, 255), randomFloat(0, 255), randomFloat(0, 255)]
    }

    function blendRGB(colors) {
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

    function cssRGB(color) {
        return `rgb(${color[0]}, ${color[1]}, ${color[2]})`
    }

    let grid, nextGrid;

    const DEAD = 0;

    function makeGrid(width, height, func) {
        return Array.from({ length: width }, () => Array.from({ length: height }, func));;
    }

    function init() {
        grid = makeGrid(rows, cols, () => Math.random() < startingChanceOn ? DEAD : randRGB());
        nextGrid = makeGrid(rows, cols, () => DEAD);
    }

    function update() {
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {

                const neighbors = getNeighbors(i, j);
                const neighborsCount = neighbors.length;

                const tile = grid[i][j];

                if (tile === DEAD && neighborsCount === 3) {
                    nextGrid[i][j] = blendRGB(neighbors);
                } else if (tile !== 0 && (neighborsCount < 2 || neighborsCount > 3)) {
                    nextGrid[i][j] = DEAD;
                } else {
                    nextGrid[i][j] = tile;
                }
            }
        }

        [nextGrid, grid] = [grid, nextGrid];
    }

    function getNeighbors(row, col) {
        let neighbors = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;

                const tile = grid[(row + i + rows) % rows][(col + j + cols) % cols];

                if (tile !== 0) {
                    neighbors.push(tile)
                }

            }
        }
        return neighbors;
    }

    function clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fill();
    }

    function draw() {
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const tile = grid[i][j];
                if (tile !== 0) {
                    ctx.fillStyle = cssRGB(tile);
                    ctx.fillRect(j * gridSize, i * gridSize, gridSize, gridSize);
                }
            }
        }
    }

    function nextFrame() {
        update();
        draw();
    }

    startLoop(canvas, init, clear, nextFrame, { resetOnScroll: false, resetOnClick: true })
}
