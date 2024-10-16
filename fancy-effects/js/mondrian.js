import { startLoop, updateCanvasSizes, setHashAutoFocus } from "./canvasUtil.js";
import { randomChoice, randomInt } from "./util.js";

const canvas = document.getElementById("mondrian-canvas");
updateCanvasSizes(canvas);

const ctx = canvas.getContext("2d");

// Enhanced color palette
const colorPalette = {
    primary: ["#ebebed", "#c53632", "#f8dd67", "#3e4984"],
    accent: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f7fff7"]
};

function randomColorChoice() {
    return Math.random() < 0.8 ? 
        randomChoice(colorPalette.primary) : 
        randomChoice(colorPalette.accent);
}

class Rectangle {
    constructor(x, y, width, height, colorGenerator = randomColorChoice, { parent = null, color = null } = {}) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.colorGenerator = colorGenerator;
        this.color = color ?? this.colorGenerator();
        this.children = [];
        this.parent = parent;
        this.transitionProgress = 0;
        this.targetColor = this.color;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.transitionProgress < 1) {
            this.color = this.lerpColor(this.color, this.targetColor, this.transitionProgress);
            this.transitionProgress += 0.05;
        }

        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, this.width, this.height);

        // Add more dramatic shading effect
        const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
        gradient.addColorStop(0, "rgba(255,255,255,0.2)");
        gradient.addColorStop(0.5, "rgba(0,0,0,0)");
        gradient.addColorStop(1, "rgba(0,0,0,0.3)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, this.width, this.height);

        this.children.forEach(rect => rect.draw(ctx));
        ctx.restore();
    }

    lerpColor(a, b, amount) {
        const ah = parseInt(a.replace(/#/g, ''), 16),
              ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
              bh = parseInt(b.replace(/#/g, ''), 16),
              br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
              rr = ar + amount * (br - ar),
              rg = ag + amount * (bg - ag),
              rb = ab + amount * (bb - ab);

        return `#${((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1)}`;
    }

    split() {
        const isHorizontal = Math.random() > 0.5;
        const splitPoint = 0.3 + Math.random() * 0.4;

        if (isHorizontal) {
            const splitX = this.width * splitPoint;
            this.children.push(new Rectangle(0, 0, splitX, this.height, this.colorGenerator, { parent: this }));
            this.children.push(new Rectangle(splitX, 0, this.width - splitX, this.height, this.colorGenerator, { parent: this }));
        } else {
            const splitY = this.height * splitPoint;
            this.children.push(new Rectangle(0, 0, this.width, splitY, this.colorGenerator, { parent: this }));
            this.children.push(new Rectangle(0, splitY, this.width, this.height - splitY, this.colorGenerator, { parent: this }));
        }
    }

    clearSplits() {
        this.children = [];
        this.targetColor = this.colorGenerator();
        this.transitionProgress = 0;
    }

    getRandomLeaf() {
        if (this.children.length === 0) return this;
        return randomChoice(this.children).getRandomLeaf();
    }

    findDeepestLeaf() {
        if (this.children.length === 0) return [0, this];
        const childResults = this.children.map(child => child.findDeepestLeaf());
        const [maxDepth, deepestLeaf] = childResults.reduce((acc, curr) => curr[0] > acc[0] ? curr : acc);
        return [maxDepth + 1, deepestLeaf];
    }
}

const maxSplits = 20;

let baseRect;
let splitCount = 0;
let joinMode = false;

function init() {
    splitCount = 0;
    joinMode = false;
    
    const artworkWidth = canvas.width * 0.7;
    const artworkHeight = canvas.height * 0.7;
    const artworkX = (canvas.width - artworkWidth) / 2;
    const artworkY = (canvas.height - artworkHeight) / 2;
    
    baseRect = new Rectangle(artworkX, artworkY, artworkWidth, artworkHeight, randomColorChoice);

    drawMuseumWall(ctx);
    drawWoodenFrame(ctx);
}

function drawMuseumWall(ctx) {
    
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    gradient.addColorStop(0, "rgba(255,255,255,0.3)");
    gradient.addColorStop(0.7, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.7)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawWoodenFrame(ctx) {
    const frameWidth = canvas.width * 0.8;
    const frameHeight = canvas.height * 0.8;
    const frameX = (canvas.width - frameWidth) / 2;
    const frameY = (canvas.height - frameHeight) / 2;

  
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 15;
    ctx.shadowOffsetY = 15;
    
    ctx.fillStyle = "#8B4513";  
    ctx.fillRect(frameX, frameY, frameWidth, frameHeight);
 
    ctx.strokeStyle = "#A0522D";  
    ctx.lineWidth = 2;
    for (let i = 0; i < 50; i++) {
        ctx.beginPath();
        ctx.moveTo(frameX + Math.random() * frameWidth, frameY);
        ctx.bezierCurveTo(
            frameX + Math.random() * frameWidth, frameY + frameHeight / 3,
            frameX + Math.random() * frameWidth, frameY + frameHeight * 2 / 3,
            frameX + Math.random() * frameWidth, frameY + frameHeight
        );
        ctx.stroke();
    }

    ctx.strokeStyle = "#D2691E";  
    ctx.lineWidth = 10;
    ctx.strokeRect(frameX + 15, frameY + 15, frameWidth - 30, frameHeight - 30);
  
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    ctx.strokeRect(frameX + 5, frameY + 5, frameWidth - 10, frameHeight - 10);
    
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function nextFrame() {
    if (joinMode) {
        const [_, leafToJoin] = baseRect.findDeepestLeaf();
        if (leafToJoin.parent) {
            leafToJoin.parent.clearSplits();
        } else {
            joinMode = false;
            maxSplits = Math.min(maxSplits + 2, 20);
        }
    } else {
        const leafToSplit = baseRect.getRandomLeaf();
        leafToSplit.split();
        splitCount++;
        
        if (splitCount >= maxSplits) {
            joinMode = true;
            splitCount = 0;
        }
    }

    baseRect.draw(ctx);
}

export default function dramaticMuseumMondrian() {
    setHashAutoFocus(canvas);
    startLoop(canvas, init, () => {}, nextFrame, { resetOnClick: true, resetOnResize: true, fps: 2 });
}