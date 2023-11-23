
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

const sliderAngle = document.getElementById("floor-angle");
const carSetpoint = document.getElementById("car-setpoint");

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
        this.mass = 10;
        this.weight = this.mass * gravity;
        
        this.maxMotorPower = 1;

        this.width = this.image.width * 0.25
        this.height = this.image.height * 0.20
        
        // create variables
        this.startX = this.canvas.width / 2 - this.width / 2;;
        this.reset();
    }
    
    reset() {
        this.velocity = 0;
        
        this.x = this.startX;
        this.rotation = 0;
        this.y = 0;
    }

    update() {
        this.rotation = this.ground.getFloorRad();

        // find ground
        const b2 = Math.tan(this.rotation) * this.x + this.height;
        const ground = this.ground.startY - b2;

        this.y = ground;

        this.x
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
        this.ctx.rotate(-this.rotation);
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
sliderAngle.min = -world.height;
sliderAngle.value = 0;

carSetpoint.min = 0;
carSetpoint.max = world.width;
carSetpoint.value = car.getCenterX();

setInterval(() => {
    world.setFloorOffset(Number(sliderAngle.value))
    car.setCenterX(Number(carSetpoint.value));

    world.draw();
    
    const floorDegrees = world.getFloorDegrees();

    car.update();
    car.draw()

}, Math.floor(1000 / FPS))