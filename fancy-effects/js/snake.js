import { startLoop, updateCanvasSizes, setHashAutoFocus } from "./canvasUtil.js";
import { randomFloat, randomInt } from "./util.js";

const canvas = document.getElementById("snake-canvas");
updateCanvasSizes(canvas);
const ctx = canvas.getContext("2d");

const GRID_SIZE = 20;
const SNAKE_SPEED = 2;
let gridWidth, gridHeight;
let snake, snakeHues, food, direction, score, frameCount;

let foodColor, foodParticles;
const PARTICLE_COUNT = 20;
const INITIAL_SNAKE_LENGTH = 2;

const COLOR_SHIFT_COEFFICIENT = 0.1;

function init() {
    gridWidth = Math.floor(canvas.width / GRID_SIZE);
    gridHeight = Math.floor(canvas.height / GRID_SIZE);

    snake = Array.from({ length: INITIAL_SNAKE_LENGTH }, (_, index) => ({
        x: Math.floor(gridWidth / 2) - index,
        y: Math.floor(gridHeight / 2),
    }));
    snakeHues = new Array(INITIAL_SNAKE_LENGTH).fill(getRandomHue())

    direction = { x: 1, y: 0 };
    score = 0;
    frameCount = 0;
    foodParticles = [];
    spawnFood();
}

function getRandomHue() {
    return randomInt(0, 360);
}

function spawnFood() {
    do {
        food = {
            x: randomInt(0, gridWidth - 1),
            y: randomInt(0, gridHeight - 1)
        };
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));

    foodColor = getRandomHue();

    foodParticles = Array(PARTICLE_COUNT).fill().map(() => ({
        x: food.x * GRID_SIZE + GRID_SIZE / 2,
        y: food.y * GRID_SIZE + GRID_SIZE / 2,
        radius: randomFloat(1, 3),
        speed: randomFloat(0.5, 2),
        angle: randomFloat(0, Math.PI * 2),
    }));
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function nextFrame() {
    frameCount++;
    if (frameCount % SNAKE_SPEED === 0) {
        moveSnake();
    }
    updateColorPropagation();
    aiControl();
    updateFoodParticles();
    draw();
}

function moveSnake() {
    const newHead = {
        x: (snake[0].x + direction.x + gridWidth) % gridWidth,
        y: (snake[0].y + direction.y + gridHeight) % gridHeight,
    };

    if (newHead.x === food.x && newHead.y === food.y) {
        score++;

        snakeHues.unshift(foodColor);
        snake.unshift(newHead);

        spawnFood();

    } else {
        snake.unshift(newHead);
        snake.pop();
    }

    if (snake.slice(1).some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        init();
        return;
    }
}

function updateColorPropagation() {
    // Gradually propagate the color from the head to the tail
    for (let i = 1; i < snakeHues.length; i++) {
        const prevHue = snakeHues[i - 1];
        const currentHue = snakeHues[i];

        let hueDiff = prevHue - currentHue;

        if (hueDiff > 180) {
            hueDiff -= 360;
        } else if (hueDiff < -180) {
            hueDiff += 360;
        }

        snakeHues[i] = (currentHue + hueDiff * COLOR_SHIFT_COEFFICIENT + 360) % 360;
    }
}

function aiControl() {
    const head = snake[0];
    const dx = food.x - head.x;
    const dy = food.y - head.y;

    if (Math.abs(dx) > Math.abs(dy)) {
        direction = { x: Math.sign(dx), y: 0 };
    } else {
        direction = { x: 0, y: Math.sign(dy) };
    }

    // Simple collision avoidance
    const nextPos = {
        x: (head.x + direction.x + gridWidth) % gridWidth,
        y: (head.y + direction.y + gridHeight) % gridHeight
    };
    if (snake.some(segment => segment.x === nextPos.x && segment.y === nextPos.y)) {
        // Try to move perpendicular to current direction
        if (direction.x !== 0) {
            direction = { x: 0, y: Math.sign(dy) || 1 };
        } else {
            direction = { x: Math.sign(dx) || 1, y: 0 };
        }
    }
}

function updateFoodParticles() {
    foodParticles.forEach(particle => {
        particle.x += Math.cos(particle.angle) * particle.speed;
        particle.y += Math.sin(particle.angle) * particle.speed;

        const dx = particle.x - (food.x * GRID_SIZE + GRID_SIZE / 2);
        const dy = particle.y - (food.y * GRID_SIZE + GRID_SIZE / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > GRID_SIZE) {
            particle.angle = Math.atan2(-dy, -dx) + randomFloat(-0.2, 0.2);
        }
    });
}

function draw() {
    // Draw snake with color wave effect

    snake.forEach((segment, index) => {
        // Draw the snake segment with a smooth color transition        
        ctx.fillStyle = `hsl(${snakeHues[index]}, 100%, 50%)`;
        ctx.beginPath();
        ctx.arc(segment.x * GRID_SIZE + GRID_SIZE / 2, segment.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw food particles (unchanged)
    ctx.fillStyle = `hsl(${foodColor}, 100%, 50%)`;
    foodParticles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // // Draw score with glow effect (unchanged)
    // ctx.fillStyle = "white";
    // ctx.font = "bold 24px Arial";
    // ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
    // ctx.shadowBlur = 10;
    // ctx.fillText(`Score: ${score}`, 10, 30);
    // ctx.shadowBlur = 0;
}


export default function aiSnake() {
    setHashAutoFocus(canvas);
    startLoop(canvas, init, clear, nextFrame, { resetOnClick: true, resetOnResize: true });
}