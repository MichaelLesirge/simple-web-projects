import { startLoop, updateCanvasSizes, setHashAutoFocus } from "./canvasUtil.js";
import { randomChoice, randomInt } from "./util.js";

const canvas = document.getElementById("mondrian-canvas");
updateCanvasSizes(canvas);

function randBoxMuller() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) return randBoxMuller()() // resample between 0 and 1
    return num
}


const ctx = canvas.getContext("2d");

function randomColorRGB() {
    const r = randomInt(0, 255);
    const g = randomInt(0, 255);
    const b = randomInt(0, 255);
    return `rgb(${r}, ${g}, ${b})`;
}

function randomColorChoice() {
    const white = "#ebebed";
    const red = "#c53632";
    const yellow = "#f8dd67";
    const blue = "#3e4984";

    return randomChoice([
        white,
        white,
        white,
        white,
        red,
        red,
        yellow,
        blue,
    ]);
}

class Rectangle {
    constructor(x, y, width, height, colorGenerator = () => "white", { parent = null, color = null } = {}) {
        this.x = x;
        this.y = y
        this.width = width;
        this.height = height;

        this.colorGenerator = colorGenerator;
        this.color = color ?? this.colorGenerator();

        this.children = [];
        this.parent = parent;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {

        ctx.save()
        ctx.translate(this.x, this.y)

        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = "black";
        ctx.lineWidth = 5;
        ctx.strokeRect(0, 0, this.width, this.height)

        this.children.forEach(rect => rect.draw(ctx));
        ctx.restore();
    }

    splitHorizontal() {
        const splitX = randBoxMuller() * this.width;
        const first = randomInt(0, 1);
        
        this.children.push(new Rectangle(0, 0, splitX, this.height, this.colorGenerator, { parent: this, color: [this.color, null][first] }))
        this.children.push(new Rectangle(splitX, 0, this.width - splitX, this.height, this.colorGenerator, { parent: this, color: [null, this.color][first] }))
    }
    
    splitVertical() {
        const splitY = randBoxMuller() * this.height;
        const first = randomInt(0, 1);

        this.children.push(new Rectangle(0, 0, this.width, splitY, this.colorGenerator, { parent: this, color: [this.color, null][first] }));
        this.children.push(new Rectangle(0, splitY, this.width, this.height - splitY, this.colorGenerator, { parent: this, color: [null, this.color][first] }));
    }

    clearSplits() {
        this.children = [];
    }

    getRandomChild() {
        return randomChoice(this.children);
    }

    find(level) {
        let deepestLevel = level;
        let deepestLeaf = this;

        for (const child of this.children) {
            const [childLevel, childLeaf] = child.find(level + 1);
            if (
                childLevel > deepestLevel ||
                (childLevel == deepestLevel && Math.max(childLeaf.width, childLeaf.height) < Math.max(deepestLeaf.width, deepestLeaf.height))) {
                deepestLevel = childLevel;
                deepestLeaf = childLeaf;
            }
        }

        return [deepestLevel, deepestLeaf]
    }

    deepestLeaf() {
        const [level, deepest] = this.find(0)
        return deepest;
    }

    getRandomLeaf() {
        let current = this;
        while (current.children.length != 0) {
            current = current.getRandomChild();
        }
        return current;
    }
}

let baseRect;

let splitCount = 0;
let maxSplits = 0;

let joinMode = false;
let modeSwitch = false;

function init() {
    splitCount = 0;
    maxSplits = 1;
    joinMode = false;
    modeSwitch = false;
    baseRect = new Rectangle(0, 0, canvas.width, canvas.height, randomColorRGB, {color: "white"});
}

function clear() {

}

function nextFrame() {

    if (modeSwitch) {
        joinMode = !joinMode;
        modeSwitch = false;

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setTimeout(() => baseRect.draw(ctx), 10)

        return;
    }

    if (joinMode) {
        const rect = baseRect.deepestLeaf();

        if (rect.parent != null) {
            rect.parent.clearSplits()
        } else {
            console.log("Split Mode", maxSplits);

            modeSwitch = true;
            maxSplits *= 2;
        }
    }
    else {
        const rect = baseRect.getRandomLeaf();
        
        if (splitCount % 2 == 0) {
            rect.splitHorizontal();
        } else {
            rect.splitVertical();
        }
        splitCount++;
        
        if (splitCount > maxSplits) {
            console.log("Combine Mode");

            modeSwitch = true;
            splitCount = 0;
        }
    }

    baseRect.draw(ctx);
}

export default function mondrian() {
    setHashAutoFocus(canvas);
    startLoop(canvas, init, clear, nextFrame, { resetOnClick: true, resetOnResize: true, fps: 2 });
}
