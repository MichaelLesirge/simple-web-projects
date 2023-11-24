
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

class Floor {
    constructor(canvas, x, y, width, height) {
        this.canvas = canvas;
        this.cWidth = width ?? this.canvas.width;
        this.cHeight = height ?? this.canvas.height;

        this.ctx = canvas.getContext("2d");
        this.ctx.translate(x ?? 0, y ?? 0)

        this.setFloorOffset(0);
    }

    fillBackground() {
        this.ctx.fillStyle = backgroundColor;
        this.ctx.fillRect(0, 0, this.cWidth, this.cHeight);
        this.drawLine(0, 0, this.cWidth, this.cHeight);
        // this.drawLine(0, this.cHeight, this.width, 0);
    }

    setFloorOffset(floorOffset) {
        this.floorOffset = floorOffset;

        [this.startX, this.startY] = [0, (this.cHeight - this.floorOffset) / 2];
        [this.endX, this.endY] = [this.cWidth, (this.cHeight + this.floorOffset) / 2];

        // [this.startX, this.startY] = [0, this.height];
        // [this.endX, this.endY] = [this.width, this.height-this.floorOffset];
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
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();

        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);

        this.ctx.strokeStyle = color;
        this.ctx.stroke();
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

        this.width = this.image.width * 0.25
        this.height = this.image.height * 0.15
        
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

        this.ctx.translate(this.x, this.y);
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

const world = new Floor(displayCanvas, 0, 0, displayCanvas.width, displayCanvas.height * 1.618);

const car = new Car(displayCanvas, "car_outline.png", world)
const carController = new PidController();

// sliderAngle.max = world.height;
// sliderAngle.min = -world.height;
// sliderAngle.value = 0;

// carSetpoint.min = 0;
// carSetpoint.max = world.width;
// carSetpoint.value = car.getCenterX();

setInterval(() => {
    const setPoint = 0;

    world.setFloorOffset(0)

    world.draw();
    world.drawLine(setPoint, 0, setPoint, world.cHeight)
    
    car.update();
    car.draw()

}, Math.floor(1000 / FPS))