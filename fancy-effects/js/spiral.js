import { startLoop, updateCanvasSizes, setHashAutoFocus } from "./canvasUtil.js";

const canvas = document.getElementById("spiral-canvas");
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

    const HH = String(hours).padStart(2, "0");
    const MM = String(minutes).padStart(2, "0");
    const SS = String(remainingSeconds).padStart(2, "0");

    return `${HH}:${MM}:${SS}`;
}

let arcs = [];

function clear() {
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height)
}

let start, center, end, base;
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

    const length = Math.min(canvas.width, canvas.height) * 0.9, offset = (canvas.width - length) / 2;

    start = {
        x: offset,
        y: canvas.height / 2
    };

    end = {
        x: canvas.width - offset,
        y: canvas.height / 2
    };

    center = {
        x: canvas.width / 2,
        y: canvas.height / 2
    };

    const baseLength = end.x - start.x;
    base = {
        length: baseLength,
        minAngle: 0,
        startAngle: 0,
        maxAngle: 2 * Math.PI,
        initialRadius: baseLength * 0.05,
        circleRadius: baseLength * 0.006,
        clearance: baseLength * 0.03,
    };
    base.spacing = (base.length - base.initialRadius - base.clearance) / 2 / colors.length;
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

export default function spiral() {
    setHashAutoFocus(canvas)
    startLoop(canvas, init, clear, nextFrame, { resetOnClick: true, resetOnScroll: true, resetOnResize: true })
}
