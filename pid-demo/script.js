
const displayCanvas = document.getElementById("display-canvas");
const sliderAngle = document.getElementById("floor-angle")

const backgroundColor = "white";
const gravity = -9.8
const FPS = 60;

function degreesToRadians(degrees){
    return degrees * (Math.PI/180);
}

function radiansToDegrees(radians){
    return radians / (Math.PI/180);
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

class Car {
    constructor(canvas, imageSource) {
        this.canvas = canvas;

        this.backgroundWidth = this.canvas.width;
        this.backgroundHeight = this.canvas.height;

        this.ctx = canvas.getContext("2d");

        this.image = new Image();
        this.image.src = imageSource;
        this.hasImageLoaded = false;
        this.image.onload = () => this.hasImageLoaded = true;

        this.width = this.image.width / 7
        this.height = this.image.height / 10

        this.x = this.backgroundWidth / 2 - this.width / 2;
        this.y = 0;
        this.rotation = 0;
        
        this.mass = 10;
        this.weight = this.mass * gravity;
    }

    update(groundAngle) {
        this.rotation = groundAngle;
    }

    draw() {
        this.ctx.save();

        const centerWidth = this.width / 2;
        const centerHeight = this.height / 2;

        this.ctx.translate(this.x + centerWidth, this.y + centerHeight);      
        this.ctx.rotate(-this.rotation);
        if (this.hasImageLoaded) {
            this.ctx.fillStyle = backgroundColor;
            this.ctx.drawImage(this.image, -centerWidth, -centerHeight, this.width, this.height);
        }
        else {
            this.ctx.fillStyle = "black";
            this.ctx.fillRect(-centerWidth, -centerHeight, this.width, this.height);
        }
        this.ctx.restore()
    }
}

const world = new Floor(displayCanvas);

const car = new Car(displayCanvas, "car_outline.png")

sliderAngle.max = world.height;
sliderAngle.value = 0;
sliderAngle.min = -world.height;
// sliderAngle.max = 90;
// sliderAngle.value = 0;
// sliderAngle.min = 0;

sliderAngle.addEventListener("input", () => world.setFloorOffset(Number(sliderAngle.value)));

setInterval(() => {
    world.draw();
    const floorDegrees = world.getFloorRad();
    
    car.update(floorDegrees);
    car.draw()

}, Math.floor(1000 / FPS))