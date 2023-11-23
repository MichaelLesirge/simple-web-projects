
// push down body
const header = document.getElementById("header");
const main = document.querySelector("main");
main.style.paddingTop = header.clientHeight + 1 + "px";

const displayCanvas = document.getElementById("display-canvas");

fullResolution(displayCanvas);

function fullResolution(canvas) {
    const doRatio = canvas.clientWidth / canvas.clientHeight;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight / doRatio * dpr;
}

const sliderAngle = document.getElementById("floor-angle")

const backgroundColor = "white";
const gravity = -9.8
const FPS = 60;

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function radiansToDegrees(radians) {
    return radians / (Math.PI / 180);
}

class Floor {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.ctx = canvas.getContext("2d");

        this.setFloorOffset(0);
    }

    fillBackground() {
        this.ctx.fillStyle = backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setFloorOffset(floorOffset) {
        this.floorOffset = floorOffset;

        [this.startX, this.startY] = [0, (this.height - this.floorOffset) / 2];
        [this.endX, this.endY] = [this.width, (this.height + this.floorOffset) / 2];

        // [this.startX, this.startY] = [0, this.height];
        // [this.endX, this.endY] = [this.width, this.height-this.floorOffset];
    }

    setFloorRad(floorRad) {
        const radiansB = Math.tan(floorRad) * this.width
        this.setFloorOffset(radiansB);
    }

    getFloorRad() {
        const adjacent = this.width;
        const opposite = this.startY - this.endY;

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

    drawFloor() {
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();

        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(this.endX, this.endY);

        this.ctx.stroke();
    }

    draw() {
        this.fillBackground();
        this.drawFloor(this.floorOffset)
    }
}

class PidController {
    constructor(gains = {P: 1, I: 1, D: 1}, ITermLimits = {min: -Infinity, max: Infinity}, outputLimits = {min: -Infinity, minThreshold: undefined, max: Infinity, maxThreshold: undefined}) {
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

    setOutput
}

class Car {
    constructor(canvas, imageSource, ground) {
        this.canvas = canvas;

        this.backgroundWidth = this.canvas.width;
        this.backgroundHeight = this.canvas.height;

        this.ctx = canvas.getContext("2d");

        this.image = new Image();
        this.hasImageLoaded = false;
        this.image.onload = () => {
            this.hasImageLoaded = true;
        }
        this.image.src = imageSource;

        this.width = this.image.width * 0.25
        this.height = this.image.height * 0.20

        this.x = this.backgroundWidth / 2 - this.width / 2;
        this.y = 0;
        this.rotation = 0;

        this.mass = 10;
        this.weight = this.mass * gravity;

        this.ground = ground;
    }

    update() {
        const rotation = this.ground.getFloorRad();

        // find ground
        const b2 = Math.tan(rotation) * this.x + this.height;
        const ground = this.ground.startY - b2;

        this.y = ground;


    }

    draw() {        
        const rotation = this.ground.getFloorRad();

        this.ctx.save();

        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(-rotation);
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

const world = new Floor(displayCanvas);

const car = new Car(displayCanvas, "car_outline.png", world)
const carController = new PidController();

sliderAngle.max = world.height;
sliderAngle.value = 0;
sliderAngle.min = -world.height;
// sliderAngle.max = 90;
// sliderAngle.value = 0;
// sliderAngle.min = 0;

sliderAngle.addEventListener("input", () => world.setFloorOffset(Number(sliderAngle.value)));
// sliderAngle.addEventListener("input", () => car.x = Number(sliderAngle.value));

setInterval(() => {
    world.draw();
    const floorDegrees = world.getFloorRad();

    car.update();
    car.draw()

}, Math.floor(1000 / FPS))