// TODO make base canvas object class with draw that auto has save/restore and init that auto gets [x, y, width, height], as well as drawing lines, rects, and circles

// push down body
const header = document.getElementById("header");
const main = document.querySelector("main");
main.style.paddingTop = header.clientHeight + "px";

const displayCanvas = document.getElementById("display-canvas");
displayCanvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);

fullResolution(displayCanvas);

function fullResolution(canvas) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
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

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max)
}

class CanvasDrawer {
	constructor(canvas, position, size) {
		this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        const [x, y] = position ?? [0, 0];
        this.cX = x;
        this.cY = y;
        
        const [width, height] = size ?? [this.canvas.width, this.canvas.height];
        this.cWidth = width;
        this.cHeight = height;

	}

	drawLine(startX, startY, endX, endY, {color = "black", width = 1}) {
        this.ctx.lineWidth = width;
        this.ctx.beginPath();

        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);

        this.ctx.strokeStyle = color;
        this.ctx.stroke();
    }

	drawRect(startX, startY, endX, endY, {color = "black", width = 1, fill = false}) {
		this.ctx.rect(startX, startY, endX, endY);

		
		this.ctx.strokeStyle = color;
		this.ctx.lineWidth = width;
		
		if (fill) {
			this.ctx.fillStyle = fill;
			this.ctx.fill();
		}

		this.ctx.stroke();
	}

	drawCircle(x, y, radius, {color = "black", width = 1, fill = false}) {
		this.ctx.beginPath();
		this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);

		this.ctx.fillStyle = fill;
		if (fill) {
			this.ctx.fill();
		}

		this.ctx.lineWidth = width;
		this.ctx.strokeStyle = color;
		this.ctx.stroke();
	}
}

class PositionSlider extends CanvasDrawer {
    constructor(canvas, position, size, vertical = false, margin = 0) {
		super(canvas, position, size)

		this.isSelected = false;
		this.canvas.addEventListener('mousedown', this.detectClicked)
		this.canvas.addEventListener('mousemove', this.move)
		document.body.addEventListener('mouseup', this.mouseUp)
		document.body.addEventListener('mouseleave', this.mouseUp)
		
		this.margin = margin;
		
        this.isVertical = vertical;

		this.defaultBackgroundColor = "#b6cad9";
		this.selectedBackgroundColor = "lightblue"
		this.lineColor = "black";

        this.thumbRadius = (this.isVertical ? this.cWidth : this.cHeight) * 0.4;
		this.thumbColor = "green";

		this.value = ((this.isVertical ? this.cHeight : this.cWidth)) / 2 + this.thumbRadius + ((this.isVertical ? this.cY : this.cX));
    }

	detectClicked = (event) => {
		const rect = event.target.getBoundingClientRect();

		const dpr = window.devicePixelRatio || 1;
	
		const [x, y] = [event.x * dpr - rect.x, event.y * dpr - rect.y - 10];

		// console.log(x >= this.cX, x <= this.cX + this.cWidth, y >= this.cY, y <= this.cY + this.cHeight)

		// this.drawCircle(x, y, 4, {color: "black", fill: "red"})

		if (x >= this.cX && x <= this.cX + this.cWidth && y >= this.cY && y <= this.cY + this.cHeight) {

			this.isSelected = true;
			this.setValue(this.isVertical ? y - this.thumbRadius * 2 : x);
			// console.log(this.isVertical ? "vertical" : "horizontal", "click")
		}
	}

	mouseUp = (event) => {
		this.isSelected = false;
	}

	move = (event) => {
		if (this.isSelected) {
			const rect = event.target.getBoundingClientRect();
			const dpr = window.devicePixelRatio || 1;
			const [x, y] = [event.x * dpr - rect.x, event.y * dpr - rect.y];

			this.setValue(this.isVertical ? y - this.thumbRadius * 2 : x);
		}
	}

    draw() {
        this.ctx.save();
        this.ctx.translate(this.cX, this.cY);

        this.drawRect(0, 0, this.cWidth, this.cHeight, {color: "transparent", fill: this.isSelected ? this.selectedBackgroundColor : this.defaultBackgroundColor});

		if (this.isVertical) {
			this.drawLine(
				this.cWidth / 2, this.thumbRadius / 2,
				this.cWidth / 2, this.cHeight - this.thumbRadius / 2,
				{color: this.lineColor});
			// this.drawCircle(this.cWidth / 2, this.value, this.thumbRadius, {fill: "blue"});
		}
		else {
			this.drawLine(
				this.thumbRadius / 2, this.cHeight / 2,
				this.cWidth - this.thumbRadius / 2, this.cHeight / 2,
				{color: this.lineColor});
			// this.drawCircle(this.value, this.cHeight / 2, this.thumbRadius, {fill: "blue"});
		}

        this.ctx.restore();
    }

	drawThumb() {
		if (this.isVertical) {
			this.drawCircle(this.cX + this.cWidth / 2, this.value, this.thumbRadius, {fill: this.thumbColor});
			this.drawLine(this.cX + (this.cWidth - this.thumbRadius) / 2, this.value, this.cX + (this.cWidth + this.thumbRadius) / 2, this.value, {color: "white"})
		}
		else {
			this.drawCircle(this.value, this.cY + this.cHeight / 2, this.thumbRadius, {fill: this.thumbColor});
			this.drawLine(this.value, this.cY + (this.cHeight - this.thumbRadius) / 2, this.value, this.cY + (this.cHeight + this.thumbRadius) / 2, {color: "white"})
		}
	}

	getAbsolutePosition() {
		return this.value;
	}

	getCanvasPosition() {
		return this.value - ((this.isVertical ? this.cY : this.cX)) - (this.isVertical ? this.thumbRadius : 0);
	}

	getCanvasCenteredPosition() {
		return (this.isVertical ? this.cHeight : this.cWidth) / 2 - this.getCanvasPosition()
	}

	setValue(value) {
		if (this.isVertical) this.value = clamp(value, this.cY + this.thumbRadius, this.cY + this.cHeight - this.thumbRadius);
		else this.value = clamp(value, this.cX + this.thumbRadius, this.cX + this.cWidth - this.thumbRadius);
	}
}


class Floor extends CanvasDrawer {
    constructor(canvas, position, size) {
		super(canvas, position, size)

        this.setFloorOffset(0);
    }

    fillBackground() {
		this.drawRect(this.cX, this.cY, this.cWidth + this.cX, this.cHeight + this.cY, {color: "transparent", fill: "white"})
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

    drawFloor() {
        this.drawLine(this.startX, this.startY, this.endX, this.endY, {color: "black"})
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

const sliderWidth = 11;
const world = new Floor(displayCanvas, [sliderWidth, 0], [displayCanvas.width - sliderWidth, displayCanvas.height / 1.618]);

const car = new Car(displayCanvas, "car_outline.png", world)
const carController = new PidController();

const groundSlider = new PositionSlider(displayCanvas, [0, world.cY], [sliderWidth, world.cHeight - sliderWidth], true);
const setPointSlider = new PositionSlider(displayCanvas, [world.cX, world.cY + world.cHeight - sliderWidth], [world.cWidth, sliderWidth], false);

setInterval(() => {
    const setPoint = setPointSlider.getAbsolutePosition();
	car.setCenterX(setPoint)

	const worldTilt = groundSlider.getCanvasCenteredPosition() * 2;
    world.setFloorOffset(worldTilt);

    world.draw();
    
    car.update();
    car.draw()

    groundSlider.draw();
    setPointSlider.draw();

	groundSlider.drawThumb();
	setPointSlider.drawThumb();

}, Math.floor(1000 / FPS))