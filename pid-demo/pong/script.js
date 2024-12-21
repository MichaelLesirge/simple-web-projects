
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

fitToContainer(canvas);
updateCanvasSizes(canvas);

let leftPaddle;
let rightPaddle;
let leftGraph;
let rightGraph;
let ball;

let leftScore = 0;
let rightScore = 0;

const leftPidSettings = getSettings("left-", ["p", "i", "d"], parseFloat);
const rightPidSettings = getSettings("right-", ["p", "i", "d"], parseFloat);

const controlSettings = getSettings("", ["ball-speed", "paddle-speed", "paddle-height", "paddle-detection-percent"], (x) => parseFloat(x) / 100);

const leftAi = document.getElementById("left-ai");
const rightAi = document.getElementById("right-ai");

function getSettings(prefix, names, f = (x) => x) {
    const items = {}
    for (const name of names) {
        const element = document.getElementById(prefix + name);
        element.addEventListener("input", (event) => {
            items[name] = f(event.target.value);
        });
        items[name] = f(element.value);
    }
    return items;
}

class Paddle {
    constructor(x, y, width, height, maxAcceleration, color) {
        this.x = x;
        this.y = y;

        this.dy = 0;

        this.maxAcceleration = maxAcceleration;

        this.width = width;
        this.defaultHeight = this.height = height;
        this.color = color;

        this.control = new PidController(1, 0, 0);
    }

    getCenterY() {
        return this.y + this.height / 2;
    }

    moveToTargetWithPid(targetY) {
        const [result, [error, p, i, d]] = this.control.calculateWithResults(targetY, this.getCenterY());
        const maxAcceleration = this.maxAcceleration * (controlSettings["paddle-speed"] ?? 1);
        this.dy += clamp(result, -maxAcceleration, maxAcceleration);
        return [p, i, d]
    }

    predictBallInterceptY(ball) {
        let steps = Math.abs((this.x - ball.x) / ball.dx);
        let predictedY = ball.y + ball.dy * steps;

        while (predictedY < 0 || predictedY > canvas.height) {
            if (predictedY < 0) {
                predictedY = -predictedY;
            } else if (predictedY > canvas.height) {
                predictedY = 2 * canvas.height - predictedY;
            }
        }

        return predictedY;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.height = this.defaultHeight * (controlSettings["paddle-height"] ?? 1);
        this.y += this.dy;

        const frictionCoefficient = (controlSettings["paddle-friction"] ?? 0);
        const frictionForce = -frictionCoefficient * Math.sign(this.dy);
        this.dy += frictionForce;

        if (this.y < 0) {
            this.y = 0;
            this.dy = 0;
        } else if (this.y + this.height > canvas.height) {
            this.y = canvas.height - this.height;
            this.dy = 0;
        }
    }

}

class Ball {
    constructor(x, y, dx, dy, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.dx = dx;
        this.dy = dy;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    getCenterY() {
        return this.y;
    }

    bounce() {
        this.dx = -this.dx;
    }

    update(leftPaddle, rightPaddle) {

        const dx = this.dx * (controlSettings["ball-speed"] ?? 1)
        const dy = this.dy * (controlSettings["ball-speed"] ?? 1)

        const steps = Math.max(Math.round(Math.hypot(dy, dx) / 2), 1);
        
        for (let i = 0; i < steps; i++) {
            this.x += (dx / steps) * (controlSettings["ball-speed"] ?? 1);
            this.y += (dy / steps) * (controlSettings["ball-speed"] ?? 1);

            if (this.y - this.radius < 0) {
                this.dy = Math.abs(this.dy);
            }
            if (this.y + this.radius > canvas.height) {
                this.dy = -Math.abs(this.dy);
            }

            if (this.x - this.radius <= leftPaddle.x + leftPaddle.width &&
                this.x - this.radius >= leftPaddle.x &&
                this.y + this.radius > leftPaddle.y &&
                this.y - this.radius < leftPaddle.y + leftPaddle.height) {
                this.dx = Math.abs(this.dx);
            } else if (this.x + this.radius >= rightPaddle.x &&
                this.x + this.radius <= rightPaddle.x + rightPaddle.width &&
                this.y + this.radius > rightPaddle.y &&
                this.y - this.radius < rightPaddle.y + rightPaddle.height) {
                this.dx = -Math.abs(this.dx);
            }
        }
    }
}

class PidController {
    constructor(Kp, Ki, Kd) {
        this.updateConstants(Kp, Ki, Kd);
        this.reset();
    }

    updateConstants(Kp, Ki, Kd) {
        this.Kp = Kp;
        this.Ki = Ki;
        this.Kd = Kd;
    }

    reset() {
        this.previousError = 0;
        this.integral = 0;
        this.lastTime = 0;
    }

    calculateWithResults(setPoint, measuredValue) {
        this.setPoint = setPoint;

        const error = setPoint - measuredValue;

        const deltaTime = (performance.now() - this.lastTime) / 1000;

        let proportional = error;
        let integral = this.integral + error * deltaTime;
        let derivative = (error - this.previousError) / deltaTime;
        

        this.previousError = error;
        this.integral = integral;

        const p = this.Kp * proportional;
        const i = this.Ki * integral;
        const d = this.Kd * derivative;        

        this.lastTime = performance.now();

        return [(p + i + d) * deltaTime, [error, p, i, d]];
    }

    calculate(setPoint, measuredValue) {
        const [result, [error, p, i, d]] = this.calculateWithResults(setPoint, measuredValue);
        return result;
    }
}

class Graph {
    constructor(x, y, width, height, dx) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.width = width;
        this.height = height;
        this.data = {};
        this.dataColors = {};
    }

    createData(label, color, { thickness = 1, mapfn = null } = {}) {
        this.data[label] = mapfn ? Array.from({ length: this.getWidth() }, mapfn) : [];
        this.dataColors[label] = { color, thickness };
    }

    getWidth() {
        return this.width;
    }

    addData(label, value) {
        this.data[label].push(value);

        if (this.data[label].length > this.getWidth()) {
            this.data[label].shift();
        }
    }

    draw() {
        for (const [label, data] of Object.entries(this.data)) {
            ctx.strokeStyle = this.dataColors[label].color;
            ctx.lineWidth = this.dataColors[label].thickness;
            ctx.beginPath();
            for (let i = 0; i < data.length; i++) {
                ctx.lineTo((this.dx < 0 ? this.x + i : this.x + this.width - i), data[i]);
            }
            ctx.stroke();
        }
    }
}

function drawCenterLine(n = 10, lines = true) {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;

    const x = canvas.width / 2;
    const section = canvas.height / (n + 0.5) / 2;

    for (let i = 0; i <= n; i++) {
        ctx.beginPath();
        const y = ((i * 2) + lines) * section;
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + section);
        ctx.stroke();
    }
}

function drawScore(score, left) {
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText(score, canvas.width / 2 - canvas.width * 0.1 * (left ? 1 : -1), canvas.height * 0.1);
}

function init() {
    const color = "white";

    const ballStartX = canvas.width / 2;
    const ballStartY = canvas.height / 2;

    const ballStartDx = (8 + Math.random()) * (Math.random() < 0.5 ? -1 : 1);
    const ballStartDy = (3 + Math.random()) * (Math.random() < 0.5 ? -1 : 1);

    ball = new Ball(
        ballStartX, ballStartY,
        ballStartDx, ballStartDy,
        canvas.width * 0.005, color
    );

    const paddleWidth = canvas.width * 0.003;
    const paddleHeight = canvas.height * 0.05;

    const paddleStartY = canvas.height / 2 - paddleHeight / 2;
    const paddleWallGap = canvas.width * 0.3;

    const paddleSpeed = canvas.height * 0.001;

    leftPaddle = new Paddle(
        paddleWallGap, paddleStartY,
        paddleWidth, paddleHeight,
        paddleSpeed, color
    )

    rightPaddle = new Paddle(
        canvas.width - paddleWidth - paddleWallGap, paddleStartY,
        paddleWidth, paddleHeight,
        paddleSpeed, "white"
    )

    const percentGraphArea = 1;

    leftGraph = new Graph(
        0, 0,
        paddleWallGap * percentGraphArea, canvas.height,
        -1
    )

    rightGraph = new Graph(
        canvas.width - paddleWallGap * percentGraphArea, 0,
        paddleWallGap * percentGraphArea, canvas.height,
        1
    )

    const graphColor = "white";
    const settings = { mapfn: () => leftPaddle.getCenterY() };

    leftGraph.createData("Paddle", graphColor, settings);
    rightGraph.createData("Paddle", graphColor, settings);

    leftGraph.createData("Setpoint", graphColor, settings);
    rightGraph.createData("Setpoint", graphColor, settings);
}

function clear() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}


ctx.save();
function nextFrame() {
    const reactionSection = Math.abs(leftPaddle.x - rightPaddle.x) * (controlSettings["paddle-detection-percent"] ?? 1);    

    let lSetpoint = canvas.height / 2;
    if (ball.x < leftPaddle.x + reactionSection && ball.dx < 0) {
        lSetpoint = leftAi.value == "follow" ? ball.getCenterY() : leftPaddle.predictBallInterceptY(ball);
    }
    if (ball.x < leftPaddle.x) {
        lSetpoint = leftPaddle.control.setPoint;
    }
    leftPaddle.moveToTargetWithPid(lSetpoint);

    leftGraph.addData("Paddle", leftPaddle.getCenterY());
    leftGraph.addData("Setpoint", lSetpoint);

    let rSetpoint = canvas.height / 2;
    if (ball.x > rightPaddle.x - reactionSection && ball.dx > 0) {
        rSetpoint = rightAi.value == "follow" ? ball.getCenterY() : rightPaddle.predictBallInterceptY(ball);
    }

    if (ball.x > rightPaddle.x) {
        rSetpoint = rightPaddle.control.setPoint;
    }

    rightPaddle.moveToTargetWithPid(rSetpoint);

    rightGraph.addData("Paddle", rightPaddle.getCenterY());
    rightGraph.addData("Setpoint", rSetpoint);

    if (ball.x < 0) {
        init();
        leftScore++;
    } else if (ball.x >= canvas.width) {
        init();
        rightScore++;
    }


    ball.update(leftPaddle, rightPaddle);
    leftPaddle.update();
    rightPaddle.update();

    ball.draw();
    leftPaddle.draw();
    rightPaddle.draw();

    leftGraph.draw();
    rightGraph.draw();

    drawCenterLine(10, true);

    drawScore(leftScore, true);
    drawScore(rightScore, false);

    // update settings
    leftPaddle.control.updateConstants(leftPidSettings.p, leftPidSettings.i, leftPidSettings.d);
    rightPaddle.control.updateConstants(rightPidSettings.p, rightPidSettings.i, rightPidSettings.d);
}

startLoop(canvas, init, clear, nextFrame);

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

function updateCanvasSizes(canvas) {

    function updateCanvasSizesOnce() {
        const dpr = Math.ceil(window.devicePixelRatio || 1);
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
    }

    window.addEventListener("resize", updateCanvasSizesOnce);
    updateCanvasSizesOnce()
}

function startLoop(element, init, clear, nextFrame, { resetOnScroll = false, resetOnClick = false, resetOnResize = true, fps = 60 } = {}) {
    init();
    nextFrame()

    const interval = fps ? (1000 / fps) : 0;
    let lastTime = performance.now();

    function loop() {

        const currentTime = performance.now();

        if (currentTime - lastTime >= interval) {
            clear();
            nextFrame();
            lastTime = currentTime;
        }

        requestAnimationFrame(loop);
    }

    loop();

    function reset() {
        clear();
        init();
    }

    if (resetOnClick) element.addEventListener("click", reset)
    if (resetOnScroll) respondToVisibility(element, reset)
    if (resetOnResize) window.addEventListener("resize", reset);
}

function randomChoice(values) {
    return values[Math.ceil(Math.random() * values.length) - 1]
}

function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(randomFloat(min, max + 1))
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}