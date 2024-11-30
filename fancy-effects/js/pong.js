import { startLoop, updateCanvasSizes, setHashAutoFocus } from "./canvasUtil.js";
import { randomInt, randomFloat, clamp } from "./util.js";

const canvas = document.getElementById("pid-pong-canvas");
updateCanvasSizes(canvas);
const ctx = canvas.getContext("2d");

let leftPaddle;
let rightPaddle;
let leftGraph;
let rightGraph;
let ball;

class Paddle {
    constructor(x, y, width, height, maxAcceleration, color) {
        this.x = x;
        this.y = y;

        this.dy = 0;

        this.maxAcceleration = maxAcceleration;

        this.width = width;
        this.height = height;
        this.color = color;

        this.control = new PidController(0.3, 0.001, 0.1);
    }

    getCenterY() {
        return this.y + this.height / 2;
    }

    moveToTargetWithPid(targetY) {
        const [result, [error, p, i, d]] = this.control.calculateWithResults(targetY, this.getCenterY());
        this.dy += clamp(result, -this.maxAcceleration, this.maxAcceleration);
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
        this.y += this.dy;
        this.y = clamp(this.y, 0, canvas.height - this.height);
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

    bounce() {
        this.dx = -this.dx;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
            this.dy = -this.dy;
        }
    }
}

class PidController {
    constructor(Kp, Ki, Kd) {
        this.Kp = Kp;
        this.Ki = Ki;
        this.Kd = Kd;

        this.reset();
    }

    reset() {
        this.previousError = 0;
        this.integral = 0;
        this.lastTime = 0;
    }

    calculateWithResults(setPoint, measuredValue) {
        const error = setPoint - measuredValue;

        const deltaTime = (Date.now() - this.lastTime) / 1000;

        let proportional = error;
        let integral = this.integral + error * deltaTime;
        let derivative = (error - this.previousError) / deltaTime;

        // if (settingsITerm.maxAccum) integral = clamp(integral, -settingsITerm.maxAccum, settingsITerm.maxAccum);
        // if (settingsITerm.zone && Math.abs(error) > settingsITerm.zone) integral = 0;

        this.previousError = error;
        this.integral = integral;

        const p = this.Kp * proportional;
        const i = this.Ki * integral;
        const d = this.Kd * derivative;

        this.lastTime = Date.now();

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

    createData(label, color, thickness = 1) {
        this.data[label] = [];
        this.dataColors[label] = { color, thickness };
    }

    addData(label, value) {
        this.data[label].push(value);

        if (this.data[label].length > this.width) {
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

function init() {

    const color = "white";

    const ballStartX = canvas.width / 2;
    const ballStartY = canvas.height / 2;

    const ballStartDx = (7 + Math.random()) * (Math.random() < 0.5 ? -1 : 1);
    const ballStartDy = (3 + Math.random()) * (Math.random() < 0.5 ? -1 : 1);

    ball = new Ball(
        ballStartX, ballStartY,
        ballStartDx, ballStartDy,
        canvas.width * 0.005, color
    );

    const paddleWidth = canvas.width * 0.003;
    const paddleHeight = canvas.height * 0.05;

    const paddleStartY = canvas.height / 2 - paddleHeight / 2;
    const paddleWallGap = canvas.width * 0.2;

    const paddleSpeed = canvas.height * 0.01;

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

    let graphColor = "white";

    leftGraph.createData("Paddle", graphColor);
    rightGraph.createData("Paddle", graphColor);

    leftGraph.createData("Setpoint", graphColor);
    rightGraph.createData("Setpoint", graphColor);
}

function clear() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function nextFrame() {

    const reactionSection = canvas.width / 2;

    const lSetpoint = ball.x < reactionSection && ball.dx < 0 ? leftPaddle.predictBallInterceptY(ball) : canvas.height / 2;
    leftPaddle.moveToTargetWithPid(lSetpoint);

    leftGraph.addData("Paddle", leftPaddle.getCenterY());
    leftGraph.addData("Setpoint", lSetpoint);

    const rSetpoint = ball.x > canvas.width - reactionSection && ball.dx > 0 ? rightPaddle.predictBallInterceptY(ball) : canvas.height / 2;
    rightPaddle.moveToTargetWithPid(rSetpoint);

    rightGraph.addData("Paddle", rightPaddle.getCenterY());
    rightGraph.addData("Setpoint", rSetpoint);

    if (ball.x - ball.radius <= leftPaddle.x + leftPaddle.width &&
        ball.y + ball.radius > leftPaddle.y &&
        ball.y - ball.radius < leftPaddle.y + leftPaddle.height) {
        ball.dx = Math.abs(ball.dx);
    } else if (ball.x + ball.radius >= rightPaddle.x &&
        ball.y + ball.radius > rightPaddle.y &&
        ball.y - ball.radius < rightPaddle.y + rightPaddle.height) {
        ball.dx = -Math.abs(ball.dx);
    }

    if (ball.x < 0) {
        init();
    } else if (ball.x > canvas.width) {
        init();
    }


    ball.update();
    leftPaddle.update();
    rightPaddle.update();

    ball.draw();
    leftPaddle.draw();
    rightPaddle.draw();

    leftGraph.draw();
    rightGraph.draw();
}

export default function pong() {
    setHashAutoFocus(canvas);
    startLoop(canvas, init, clear, nextFrame, { resetOnClick: true, resetOnResize: true });
}