import { startLoop, updateCanvasSizes, setHashAutoFocus } from "./canvasUtil.js";
import { randomInt } from "./util.js";

const canvas = document.getElementById("orbital-canvas");
updateCanvasSizes(canvas);

const ctx = canvas.getContext("2d");

const osculateSettings = {
    clearAlphaMin: 0.01,
    clearAlphaMax: 0.76,
    osculateScale: 0.0001
}

const settings = {
    totalOrbs: 100,
    speed: 1000,
    scale: 1,
    jitterRadius: 1,
    jitterHue: 0,
    clearAlpha: 10,
    orbitalAlpha: 100,
    lightAlpha: 5,
};

let center, orbs, lastTime;

class Orb {
    constructor(x, y) {
        const dx = (x / settings.scale) - (center.x / settings.scale);
        const dy = (y / settings.scale) - (center.y / settings.scale);
        this.angle = Math.atan2(dy, dx);
        this.lastAngle = this.angle;
        this.radius = Math.sqrt(dx * dx + dy * dy);
        this.size = (this.radius / 300) + 1;
        this.speed = (randomInt(1, 10) / 300000) * this.radius + 0.015;
    }

    update(dt) {
        this.lastAngle = this.angle;
        this.angle += this.speed * (settings.speed / 50) * dt;
        this.x = this.radius * Math.cos(this.angle);
        this.y = this.radius * Math.sin(this.angle);
    }

    draw() {
        const radius = settings.jitterRadius === 0 ? this.radius : this.radius + randomInt(-settings.jitterRadius, settings.jitterRadius);
        const hue = ((this.angle + 90) / (Math.PI / 180) + randomInt(-settings.jitterHue, settings.jitterHue));
        
        ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${settings.orbitalAlpha / 100})`;
        ctx.lineWidth = this.size;
        ctx.beginPath();
        if (settings.speed >= 0) {
            ctx.arc(0, 0, radius, this.lastAngle, this.angle + 0.001, false);
        } else {
            ctx.arc(0, 0, radius, this.angle, this.lastAngle + 0.001, false);
        }
        ctx.stroke();

        ctx.lineWidth = 0.5;
        ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${settings.lightAlpha / 100})`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
    }
}

function init() {
    center = {
        x: canvas.width / 2,
        y: canvas.height / 2
    };

    const area = canvas.width / 4;
    
    orbs = [];
    for (let i = 0; i < settings.totalOrbs; i++) {
        const x = randomInt(center.x - area, center.x + area);
        const y = randomInt(center.y - area, center.y + area);
        orbs.push(new Orb(x, y));
    }

    lastTime = performance.now();
    ctx.lineCap = 'round';
}

function clear() {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = `rgba(0, 0, 0, ${settings.clearAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';
}

function nextFrame() {
    const currentTime = performance.now();

    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;

    const alphaPercent = 1 - Math.pow((1 + Math.sin(currentTime * osculateSettings.osculateScale - 1)) / 2, 2)
    settings.clearAlpha = osculateSettings.clearAlphaMin + (alphaPercent * (osculateSettings.clearAlphaMax - osculateSettings.clearAlphaMin)) 

    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.scale(settings.scale, settings.scale);

    for (const orb of orbs) {
        orb.update(deltaTime);
        orb.draw();
    }

    ctx.restore();
}

export default function orbital() {
    setHashAutoFocus(canvas);
    startLoop(canvas, init, clear, nextFrame, { resetOnClick: true, resetOnResize: true });
}