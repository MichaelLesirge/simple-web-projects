import { startLoop, updateCanvasSizes, setHashAutoFocus } from "./canvasUtil.js";

const canvas = document.getElementById("unit-circle-canvas");
updateCanvasSizes(canvas);

const ctx = canvas.getContext("2d");

let unitCircleRadius;
let graphWidth;
let graphHeight;
let graphOffsetX;
let graphCenterY;

let angle = 0;
let graphData = [];

function drawUnitCircle() {
    ctx.beginPath();
    ctx.arc(canvas.width / 4, canvas.height / 2, unitCircleRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
}

function drawAxes() {
    // X-axis of the unit circle
    ctx.beginPath();
    ctx.moveTo(canvas.width / 4 - unitCircleRadius - 20, canvas.height / 2);
    ctx.lineTo(canvas.width / 4 + unitCircleRadius + 20, canvas.height / 2);
    ctx.strokeStyle = "magenta";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.closePath();

    // Y-axis of the unit circle
    ctx.beginPath();
    ctx.moveTo(canvas.width / 4, canvas.height / 2 - unitCircleRadius - 20);
    ctx.lineTo(canvas.width / 4, canvas.height / 2 + unitCircleRadius + 20);
    ctx.strokeStyle = "magenta";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.closePath();
}

function drawArc() {
    // Draw the arc representing the angle
    ctx.beginPath();
    ctx.arc(canvas.width / 4, canvas.height / 2, 30, 0, -angle, true);
    ctx.strokeStyle = "purple";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
}

function drawPointAndLines() {
    const x = Math.cos(angle) * unitCircleRadius;
    const y = Math.sin(angle) * unitCircleRadius;

    // Draw the grey current angle line
    ctx.beginPath();
    ctx.moveTo(canvas.width / 4, canvas.height / 2);
    ctx.lineTo(canvas.width / 4 + x, canvas.height / 2 - y);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // Draw cosine line (red) horizontal projection
    ctx.beginPath();
    ctx.moveTo(canvas.width / 4, canvas.height / 2);
    ctx.lineTo(canvas.width / 4 + x, canvas.height / 2);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.closePath();

    // Draw sine line (blue) vertical projection
    ctx.beginPath();
    ctx.moveTo(canvas.width / 4 + x, canvas.height / 2);
    ctx.lineTo(canvas.width / 4 + x, canvas.height / 2 - y);
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.closePath();

    // Draw tangent line perpendicular to the current angle
    if (Math.abs(Math.cos(angle)) > 0.001) {
        const tangentLength = Math.tan(angle) * unitCircleRadius;
        const tangentAngle = angle + Math.PI / 2;

        const tx = -Math.cos(tangentAngle) * tangentLength;
        const ty = -Math.sin(tangentAngle) * tangentLength;

        ctx.beginPath();
        ctx.moveTo(canvas.width / 4 + x, canvas.height / 2 - y);
        ctx.lineTo(canvas.width / 4 + x + tx, canvas.height / 2 - y - ty);
        ctx.strokeStyle = "green";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.closePath();
    }

    // Draw the moving point
    ctx.beginPath();
    ctx.arc(canvas.width / 4 + x, canvas.height / 2 - y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "yellow";
    ctx.fill();
    ctx.closePath();

    // Update angle
    angle += 0.02;
    if (angle > Math.PI * 2) angle = 0;
}

function drawGraph() {
    const cosVal = Math.cos(angle);
    const sinVal = Math.sin(angle);
    const tanVal = Math.abs(Math.cos(angle)) > 0.001 ? Math.tan(angle) : 0;

    graphData.push({ cosVal, sinVal, tanVal });
    if (graphData.length > graphWidth) graphData.shift();

    // Draw graph axes
    ctx.beginPath();
    ctx.moveTo(graphOffsetX, graphCenterY);
    ctx.lineTo(canvas.width - 20, graphCenterY);  // X-axis for graph
    ctx.strokeStyle = "white";
    ctx.stroke();
    ctx.closePath();
    
    ctx.beginPath();
    ctx.moveTo(graphOffsetX, graphCenterY - graphHeight / 2);
    ctx.lineTo(graphOffsetX, graphCenterY + graphHeight / 2);  // Y-axis for graph
    ctx.strokeStyle = "white";
    ctx.stroke();
    ctx.closePath();
    
    // Draw sine, cosine, and tangent graphs
    graphData.forEach((point, index) => {
        const x = graphOffsetX + index;
        
        // Cosine graph (red)
        ctx.beginPath();
        ctx.arc(x, graphCenterY - point.cosVal * (graphHeight / 2), 1, 0, Math.PI * 2);
        ctx.fillStyle = "red";
        ctx.fill();
        ctx.closePath();

        // Sine graph (blue)
        ctx.beginPath();
        ctx.arc(x, graphCenterY - point.sinVal * (graphHeight / 2), 1, 0, Math.PI * 2);
        ctx.fillStyle = "blue";
        ctx.fill();
        ctx.closePath();

        // Tangent graph (green)
        if (Math.abs(point.tanVal) < graphHeight / 2) {
            ctx.beginPath();
            ctx.arc(x, graphCenterY - point.tanVal * (graphHeight / 2), 1, 0, Math.PI * 2);
            ctx.fillStyle = "green";
            ctx.fill();
            ctx.closePath();
        }
    });
}

function init() {
    angle = 0;
    graphData = [];

    const minDim = Math.min(canvas.height, canvas.width);
    unitCircleRadius = minDim / 4;
    graphOffsetX = canvas.width / 2 + 50;
    graphCenterY = canvas.height / 2;
    graphWidth = canvas.width - graphOffsetX;
    graphHeight = minDim / 2;
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function nextFrame() {
    drawUnitCircle();
    drawAxes();
    drawArc();
    drawPointAndLines();
    drawGraph();
}

export default function unitCircle() {
    setHashAutoFocus(canvas);
    startLoop(canvas, init, clear, nextFrame, { resetOnClick: true, resetOnResize: true });
}
