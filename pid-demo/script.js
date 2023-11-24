
// push down body
const header = document.getElementById("header");
const main = document.querySelector("main");
main.style.paddingTop = header.clientHeight + "px";

const displayCanvas = document.getElementById("display-canvas");

fullResolution(displayCanvas);

function fullResolution(canvas) {
    const doRatio = canvas.clientWidth / canvas.clientHeight;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight / doRatio * dpr;
}

const backgroundColor = "white";
const FPS = 300;

const physics = {
    gravity: -9.8,
    friction: 0.02,
};

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function radiansToDegrees(radians) {
    return radians / (Math.PI / 180);
}

class Slider {
    constructor(canvas, position, size, vertical = false, values = { min: 0, value: 50, max: 100 }) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        [this.x, this.y] = position;

        [this.cWidth, this.cHeight] = size;

        this.isVertical = vertical;

        this.values = values;

        this.thumbSize = 10;
    }

    draw() {
        this.ctx.save();
        this.ctx.translate(this.x, this.y);



        this.ctx.restore()
    }
}


class Floor {
    constructor(canvas, position, size) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        const [x, y] = position ?? [0, 0];
        this.cX = x;
        this.cY = y;
        
        const [width, height] = size ?? [this.canvas.width, this.canvas.height];
        this.cWidth = width;
        this.cHeight = height;


        this.setFloorOffset(0);
    }

    fillBackground() {
        this.ctx.fillStyle = backgroundColor;
        this.ctx.fillRect(this.cX, this.cY, this.cWidth + this.cX, this.cHeight + this.cY);

        // this.drawLine(0, 0, this.cWidth, this.cHeight);
        // this.drawLine(0, this.cHeight, this.cWidth, 0);
    }

    setFloorOffset(floorOffset) {
        this.floorOffset = floorOffset;

        [this.startX, this.startY] = [0, (this.cHeight - this.floorOffset) / 2];
        [this.endX, this.endY] = [this.cWidth, (this.cHeight + this.floorOffset) / 2];
    }

    setFloorRad(floorRad) {
        const radiansB = Math.tan(floorRad) * this.cWidth
        this.setFloorOffset(radiansB);
    }

    getFloorRad() {
        const adjacent = this.cWidth;
        const opposite = this.endY - this.startY;

        return Math.atan(opposite / adjacent);
    }

    setFloorDegrees(floorDegrees) {
        const floorRad = degreesToRadians(floorDegrees);
        this.setFloorRad(floorRad);
    }

    getFloorDegrees() {
        const floorRad = this.getFloorRad();
        return radiansToDegrees(floorRad);
    }

    drawLine(startX, startY, endX, endY, color = "black", width = 1) {

        // this.ctx.save();
        // this.ctx.translate(this.cX, this.cY);

        this.ctx.lineWidth = width;
        this.ctx.beginPath();

        this.ctx.moveTo(startX + this.cX, startY + this.cY);
        this.ctx.lineTo(endX + this.cX, endY + this.cY);

        this.ctx.strokeStyle = color;
        this.ctx.stroke();

        // this.ctx.restore()
    }

    drawFloor() {
        this.drawLine(this.startX, this.startY, this.endX, this.endY)
    }

    draw() {
        this.fillBackground();
        this.drawFloor(this.floorOffset)
    }
}

class PidController {
    constructor(gains = {P: 1, I: 1, D: 1}, ITermLimits = {min: -Infinity, max: Infinity}, outputLimits = {min: -Infinity, max: Infinity}) {
        const {P, I, D} = gains;
        this.setGains(P, I, D)

        const {min: ITermMin, max: ITermMax} = ITermLimits;

        const {min: outputMin, max: outMax} = outputLimits;
    }

    setGains(P = 1, I = 1, D = 1) {
        [this.P, this.I, this.D] = [P, I, D]
    }

    setITermLimits(min = -Infinity, max = Infinity) {
        [this.ITermMin, this.ITermMax] = [min, max]
    }
}

function moveTowards(value, target, distance) {
    if (value > target) {
        if (value - target < distance) {
            return target;
        }
        return value - distance;
    }
    else {
        if (target - value < distance) {
            return target;
        }
        return value + distance;
    }
}

class Car {
    constructor(canvas, imageSource, ground) {

        // save values
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.ground = ground;

        // load image
        this.image = new Image();
        this.hasImageLoaded = false;
        this.image.onload = () => {
            this.hasImageLoaded = true;
        }
        this.image.src = imageSource;

        // Configuration
        this.mass = 5;
        
        this.maxMotorPower = 1;

		const scale = Math.min(this.ground.cWidth, this.ground.cHeight)
		const size = 2500;

        this.width = (scale / size) * (this.image.width);
        this.height = (scale / size) * (this.image.height);
		console.log(scale, this.width, this.height)
        
        // create variables
        this.startX = this.canvas.width / 2 - this.width / 2;;
        this.reset();
    }

    reset() {
        this.xVelocity = 0;
        
        this.x = this.startX;
        this.y = 0;
        this.rotation = 0;
    }

    update() {
        this.rotation = this.ground.getFloorRad();

        // find ground
        const b2 = Math.tan(this.rotation) * this.x - this.height;
        const ground = this.ground.startY + b2;

        this.y = ground;

        // find velocity

        const weight = this.mass * physics.gravity;

        const bRad = degreesToRadians(90) - this.rotation;

        const adj = Math.cos(bRad) * weight;
        const op = Math.sin(bRad) * weight;

        const resistance = op * physics.friction;
        const forward = moveTowards(adj, 0, Math.abs(resistance));
        // console.log([adj, 0, Math.abs(resistance)], forward)
        
        this.xVelocity = -forward;

        this.x += this.xVelocity
    }

    getCenterX() {
        return this.x + car.width/2;
    }

    setCenterX(x) {
        this.x = x - car.width/2;
    }

    draw() {        
        this.ctx.save();

        this.ctx.translate(this.x + this.ground.cX, this.y + this.ground.cY);
        this.ctx.rotate(this.rotation);
        if (this.hasImageLoaded) {
            this.ctx.drawImage(this.image, 0, 0, this.width, this.height);
            this.ctx.fillStyle = backgroundColor;
        }
        else {
            this.ctx.fillStyle = "black";
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
        this.ctx.restore()
    }
}

const sliderWidth = 10;
const world = new Floor(displayCanvas, [0, 0], [displayCanvas.width, displayCanvas.height / 1.618]);

const car = new Car(displayCanvas, "car_outline.png", world)
const carController = new PidController();

// const groundSlider = new Slider(displayCanvas, [world.y, world.x - sliderWidth], [sliderWidth, world.cHeight], true, { min: 0, value: 50, max: 100 });
// const setPointSlider = new Slider(displayCanvas, [100, 100], [sliderWidth, world.cHeight], false, { min: 0, value: 50, max: 100 });

setInterval(() => {
    const setPoint = 0;

    world.setFloorOffset(0)

    world.draw();
    // groundSlider.draw();
    // setPointSlider.draw();
    
    car.update();
    car.draw()

}, Math.floor(1000 / FPS))