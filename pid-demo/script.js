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
const FPS = 60;

const physics = {
    gravity: -9.8,
    friction: 0.02,
};

const UNIT = 20;

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

	drawLine(startX, startY, endX, endY, {color = "black", width = 1} = {}) {
        this.ctx.lineWidth = width;
        this.ctx.beginPath();

        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);

        this.ctx.strokeStyle = color;
        this.ctx.stroke();
    }

	drawRect(startX, startY, endX, endY, {color = "black", width = 1, fill = false} = {}) {
		this.ctx.rect(startX, startY, endX, endY);

		
		this.ctx.strokeStyle = color;
		this.ctx.lineWidth = width;
		
		if (fill) {
			this.ctx.fillStyle = fill;
			this.ctx.fill();
		}

		this.ctx.stroke();
	}

	drawCircle(x, y, radius, {color = "black", width = 1, fill = false} = {}) {
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
    constructor(canvas, position, size, vertical = false) {
		super(canvas, position, size)

		this.isSelected = false;
		this.isHovered = false;
		this.canvas.addEventListener('mousedown', this.detectClicked)
		this.canvas.addEventListener('mousemove', this.move)
		document.body.addEventListener('mouseup', this.mouseUp)
		document.body.addEventListener('mouseleave', this.mouseUp)
				
        this.isVertical = vertical;

		this.defaultBgColor = "#99ccff";
		this.hoverBgColor = "#80bfff"
		this.selectedBgColor = "#b3d9ff"

		this.lineColor = "black";

        this.thumbRadius = (this.isVertical ? this.cWidth : this.cHeight) * 0.4;
		this.thumbColor = "green";

		this.value = ((this.isVertical ? this.cHeight : this.cWidth)) / 2 + this.thumbRadius + ((this.isVertical ? this.cY : this.cX));
    }

	detectClicked = (event) => {
		const rect = event.target.getBoundingClientRect();

		const dpr = window.devicePixelRatio || 1;
	
		const [x, y] = [event.x * dpr - rect.x, event.y * dpr - rect.y - (this.isVertical ? 0 : 10)];
		
		if (x >= this.cX && x <= this.cX + this.cWidth && y >= this.cY && y <= this.cY + this.cHeight) {

			this.isSelected = true;
			this.setValue(this.isVertical ? y - this.thumbRadius * 2 : x);
		}
	}

	mouseUp = (event) => {
		this.isSelected = false;
	}

	move = (event) => {
		const rect = event.target.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;
		const [x, y] = [event.x * dpr - rect.x, event.y * dpr - rect.y];

		if (this.isSelected) this.setValue(this.isVertical ? y - this.thumbRadius * 2 : x);
		
		this.isHovered = x >= this.cX && x <= this.cX + this.cWidth && y >= this.cY && y <= this.cY + this.cHeight;
	}

    draw() {
		this.ctx.save();
        this.ctx.translate(this.cX, this.cY);

        this.drawRect(0, 0, this.cWidth, this.cHeight, {color: "transparent", fill: this.isSelected ? this.selectedBgColor : (this.isHovered ? this.hoverBgColor : this.defaultBgColor)});


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
    constructor(canvas, position, size, {floorWidth=1} = {}) {
		super(canvas, position, size)

		this.floorWidth = floorWidth;

        this.setFloorOffset(0);
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
	
    draw() {
		this.ctx.save();
		this.ctx.translate(this.cX, this.cY);

		this.drawRect(0, 0, this.cWidth, this.cHeight, {color: "transparent", fill: "white"})
		this.drawLine(this.startX, this.startY + (this.floorWidth-1)/2, this.endX, this.endY + (this.floorWidth-1)/2, {color: "black", width: this.floorWidth})

		this.ctx.restore();
    }
}

class PidController {
    constructor(measuredValueSource, setPointSource, deltaTimeMs, {P, I, D}) {
		this.P = P;
		this.I = I;
		this.D = D;

		this.measuredValueSource = measuredValueSource;
		this.setPointSource = setPointSource;
		this.deltaTime = deltaTimeMs;

		this.previousError = 0;
		this.integral = 0;

		this.lastTime = new Date().getTime();

		this.hiddenOkRange = 3;

		this.result = 0;

		setInterval(() => this.result = this.calculate(this.measuredValueSource() / UNIT, this.setPointSource() / UNIT), this.deltaTime)
    }

	calculate(measuredValue, setpoint) {
		const error = setpoint - measuredValue

		// const now = new Date().getTime();
		// const deltaTime = (now - this.lastTime) || 1;

		const proportional = error;
		const integral = this.integral + error * this.deltaTime;
		const derivative = (error - this.previousError) / this.deltaTime;

		console.log(proportional, integral, derivative)
		
		const result = this.P * proportional + this.I * integral + this.D * derivative;

		this.previousError = error;
		this.integral = integral;
		// this.lastTime = now;
		
		// if (Math.abs(error) < this.hiddenOkRange) return clamp(result, -0.1, 0.1);
		return result;
	}

	getResult(){
		return this.result;
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

class Car extends CanvasDrawer {
    constructor(canvas, imageSource, ground) {
		super(canvas)

        this.ground = ground;

        // load image
        this.image = new Image();
        this.hasImageLoaded = false;
        this.image.onload = () => {
            this.hasImageLoaded = true;
        }
        this.image.src = imageSource;

        // Configuration
        this.mass = 0.2;
        
		const scale = Math.min(this.ground.cWidth, this.ground.cHeight)
		const size = 2500;

        this.width = (scale / size) * (this.image.width);
        this.height = (scale / size) * (this.image.height);
        
        // create variables
        this.startX = this.canvas.width / 2 - this.width / 2;;
        this.reset();

		this.boxLines = true;

		this.motorPower = 0;
		this.maxMotorPower = UNIT * 0.5;
    }

    reset() {
        this.xVelocity = 0;
        
        this.x = this.startX;
        this.y = 0;
        this.rotation = 0;
    }

	setMotorPower(power) {
		this.motorPower = clamp(power, -this.maxMotorPower, this.maxMotorPower)
	}

    update() {
        this.rotation = this.ground.getFloorRad();

        // find ground
        const b2 = Math.tan(this.rotation) * (this.x + this.width/2) - this.height;
        const ground = this.ground.startY + b2;

        this.y = ground;

		if (this.boxLines) {
			this.ctx.save();

			this.ctx.translate(this.x + this.ground.cX, this.y + this.ground.cY);

			this.drawLine(0, 0, this.width, 0, {color: "black"})
			this.drawLine(0, 0, 0, this.height, {color: "black"})
			this.drawLine(this.width, 0, this.width, this.height, {color: "black"})
			this.drawLine(this.width, this.height, 0, this.height, {color: "black"})

			this.drawLine(this.width / 2, this.height, this.width / 2, 100, {color: "red"})

			this.ctx.restore();
		}

        // find velocity

        const weight = this.mass * physics.gravity;

        const bRad = degreesToRadians(90) - this.rotation;

        const adj = Math.cos(bRad) * weight;
        const op = Math.sin(bRad) * weight;

        const resistance = op * physics.friction;
        const forward = moveTowards(adj, 0, Math.abs(resistance));
        // console.log([adj, 0, Math.abs(resistance)], forward)
        
        this.xVelocity += (-forward + this.motorPower) / FPS;

        this.x += this.xVelocity
    }

    getCenterX() {
        return this.x + car.width/2 + this.ground.cX;
    }

    setCenterX(x) {
        this.x = x - car.width/2 - this.ground.cX;
    }

    draw() {        
        this.ctx.save();

        // const b2 = Math.tan(this.rotation) * (this.x + Math.floor(this.width / 2)) - this.height;
        // const ground = this.ground.startY + b2;
        this.ctx.translate(this.ground.cX + this.x + this.width/2, this.y + this.height);
        this.ctx.rotate(this.rotation);
        this.ctx.translate(-this.width/2, -this.height);

		if (this.boxLines) {
			this.drawLine(0, 0, this.width, 0, {color: "green"})
			this.drawLine(0, 0, 0, this.height, {color: "green"})
			this.drawLine(this.width, 0, this.width, this.height, {color: "green"})
			this.drawLine(this.width, this.height, 0, this.height, {color: "green"})

			this.drawLine(this.width / 2, this.height, this.width / 2, 100, {color: "red"})
		}

        if (this.hasImageLoaded) {
            this.ctx.drawImage(this.image, 0, 0, this.width, this.height);
            this.ctx.fillStyle = backgroundColor;
        }
        else {
            this.drawRect(0, 0, this.width, this.height, {color: "black"})
        }
        this.ctx.restore()
    }
}

const sliderWidth = 11;
const world = new Floor(displayCanvas, [sliderWidth, 0], [displayCanvas.width - sliderWidth, displayCanvas.height / 1.618]);

const car = new Car(displayCanvas, "car_outline.png", world)

const groundSlider = new PositionSlider(displayCanvas, [0, world.cY], [sliderWidth, world.cHeight - sliderWidth], true);
const setPointSlider = new PositionSlider(displayCanvas, [world.cX, world.cY + world.cHeight - sliderWidth], [world.cWidth, sliderWidth], false);

const pidSettings = {
	P: 1,
	I: 0,
	D: 10,
}
const deltaTime = 10;
const carPidController = new PidController(() => car.getCenterX(), () => setPointSlider.getAbsolutePosition(), deltaTime, pidSettings);

setInterval(() => {
	// car.setMotorPower(carPidController.getResult());
	car.setCenterX(setPointSlider.getAbsolutePosition())

	const worldTilt = groundSlider.getCanvasCenteredPosition() * 2;
    world.setFloorOffset(worldTilt);
	
    world.draw();
	// world.drawLine(setPoint, world.cY, setPoint, world.cY+world.cHeight, {color: "black"})
    
    car.update();
    car.draw()

    groundSlider.draw();
    setPointSlider.draw();

	groundSlider.drawThumb();
	setPointSlider.drawThumb();

}, Math.floor(1000 / FPS))