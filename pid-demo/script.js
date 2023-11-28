
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

// #settings #settings-menu
const settingsMenu = document.getElementById("settings-menu");

function setAllowedChars(input, pattern) {
    input.addEventListener("keypress", (event) => {
        if (!pattern.test(event.key)) {
            event.preventDefault();
            return false;
        }
    });
}

function makeSettings(header, values, {getInputElements = false} = {}) {
	// .category
	const category = document.createElement("fieldset");
	category.classList.add("category");

	// .category .header
	const headerElement = document.createElement("legend");
	headerElement.classList.add("header");
	headerElement.innerText = header;

	category.appendChild(headerElement);
	
	// .category .controls
	const categoryControls = document.createElement("div");
	categoryControls.classList.add("controls");
	
	const updateObject = {};
	const inputs = [];
	
	for (const [name, rules] of Object.entries(values)) {
		// .category .controls .item
		const item = document.createElement("div");
		item.classList.add("item")
		
		updateObject[name] = rules.value;

		const displayName = rules.name || name;
		
		// .category .controls .item label
		const label = document.createElement("label");
		label.innerText = displayName + ": ";
		label.setAttribute("for", name);
		
		// .category .controls .item input
		const input = document.createElement("input");
		input.type = "number";
		input.name = name;
		input.id = name;

		if (rules.min >= 0) setAllowedChars(input, /[\d.]/);
		input.addEventListener("input", (event) => updateObject[name] = Number(event.target.value));

		for (const [ruleType, ruleValue] of Object.entries(rules)) {
			input.setAttribute(ruleType, ruleValue);
		}

		inputs.push(input);

		item.appendChild(label);
		item.appendChild(input);
		categoryControls.appendChild(item);
	}

	category.appendChild(categoryControls)

	settingsMenu.appendChild(category)

	return getInputElements ? inputs : updateObject;

}

const backgroundColor = "white";
const FPS = 60;

const pidSettings = makeSettings("PID Gains", {
	P: {value: 1, min: 0, step: 0.1},
	I: {value: 0, min: 0, step: 0.1},
	D: {value: 0, min: 0, step: 0.1},
})

const [groundDegreesInput, setPointInput] = makeSettings("General", {
	slopeDegrees: {name: "Floor Angle Degrees"},
	setPoint: {name: "Car Set Point"},
}, {getInputElements: true});


const physicsSettings = makeSettings("World", {
    gravity: {name: "Gravity", value: 9.8, min: 0, step: 0.1},
    friction: {name: "Friction Coefficient", value: 0.02, min: 0, step: 0.1},
	airDensity: {name: "Air Density", value: 1.225, min: 0, step: 0.1},
});

const carSettings = makeSettings("Car", {
	maxMotorPower: {name: "Max Motor Power", value: 10, min: 0, max: 20},
	mass: {name: "Mass", value: 3, min: 0},
	dragCoefficient: {name: "Drag Coefficient", value: 0.01, min: 0},
});

const deltaTime = 25;

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

		this.oninput = () => {};
    }

	toCanvasLocation(x, y) {
		const rect = this.canvas.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;
		return [x * dpr - rect.x, y * dpr - rect.y - (this.isVertical ? 0 : 10)];
	}

	detectClicked = (event) => {
		const [x, y] = this.toCanvasLocation(event.x, event.y);
		
		if (x >= this.cX && x <= this.cX + this.cWidth && y >= this.cY && y <= this.cY + this.cHeight) {

			this.isSelected = true;
			this.setValue(this.isVertical ? y - this.thumbRadius * 2 : x);
		}
	}

	mouseUp = (event) => {
		this.isSelected = false;
	}

	move = (event) => {
		const [x, y] = this.toCanvasLocation(event.x, event.y);

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
		return this.value - ((this.isVertical ? this.cY : this.cX)) - this.thumbRadius;
	}

	setCanvasPosition(value) {
		this.value = value + ((this.isVertical ? this.cY : this.cX)) + this.thumbRadius;
	}

	getCanvasCenteredPosition() {
		return (this.isVertical ? this.cHeight : this.cWidth) / 2 - this.getCanvasPosition()
	}

	setCanvasCenteredPosition(value) {
		this.setCanvasPosition(value + (this.isVertical ? this.cHeight : this.cWidth) / 2);
	}

	setValue(value) {
		if (this.isVertical) this.value = clamp(value, this.cY + this.thumbRadius, this.cY + this.cHeight - this.thumbRadius);
		else this.value = clamp(value, this.cX + this.thumbRadius, this.cX + this.cWidth - this.thumbRadius);
		this.oninput();
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

	getFloorOffset() {
		return -this.floorOffset;
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
    constructor(deltaTimeMs) {
		this.deltaTime = deltaTimeMs;
		this.deltaTimeSeconds = deltaTimeMs / 1000;

		this.previousError = 0;
		this.integral = 0;

		this.lastTime = new Date().getTime();

		this.hiddenOkRange = 3;

		this.result = 0;

		this.setPoint = 0;
		this.measuredValue = 0;

		setInterval(() => this.update())
    }

	setSetPoint(value) {
		this.setPoint = value;
	}

	updateMeasuredValue(value) {
		this.measuredValue = value;
	}

	update() {
		const error = this.setPoint - this.measuredValue;

		// const now = new Date().getTime();
		// const deltaTime = (now - this.lastTime) || 1;

		const proportional = error;
		const integral = this.integral + error * (1/this.deltaTime);
		const derivative = (error - this.previousError) / (1/this.deltaTime);

		// console.log(proportional, integral, derivative);
		console.log((pidSettings.P * proportional) / this.deltaTime, (pidSettings.I * integral) / this.deltaTime, (pidSettings.D * derivative) / this.deltaTime);
		
		this.result = (pidSettings.P * proportional + pidSettings.I * integral + pidSettings.D * derivative) / this.deltaTime;

		this.previousError = error;
		this.integral = integral;
	}

	getResult(){
		return this.result;
	}
}

function moveTowards(value, target, distance) {
	distance = Math.abs(distance)
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
        
		const scale = Math.min(this.ground.cWidth, this.ground.cHeight)
		const size = 2500;

        this.width = (scale / size) * (this.image.width);
        this.height = (scale / size) * (this.image.height);
        
        // create variables
        this.startX = this.canvas.width / 2 - this.width / 2;;
        this.reset();

		this.boxLines = false;

		this.motorPower = 0;
    }

    reset() {
        this.xVelocity = 0;
        
        this.x = this.startX;
        this.y = 0;
        this.rotation = 0;
    }

	setMotorPower(power) {
		this.motorPower = clamp(power, -carSettings.maxMotorPower, carSettings.maxMotorPower)
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

        const weight = carSettings.mass * -physicsSettings.gravity;

        const bRad = degreesToRadians(90) - this.rotation;

        const adj = Math.cos(bRad) * weight;
        const op = Math.sin(bRad) * weight;

        const frictionResistance = op * physicsSettings.friction;
        const hillForce = -adj

        this.xVelocity += (hillForce + this.motorPower) / FPS;
		
		
		const airResistance = ((physicsSettings.airDensity * carSettings.dragCoefficient) / 2) * Math.pow(this.xVelocity, 2);
		this.xVelocity = moveTowards(this.xVelocity, 0, airResistance / FPS)
		this.xVelocity = moveTowards(this.xVelocity, 0, frictionResistance / FPS)
		
        this.x += this.xVelocity

		// console.log([hillForce, this.motorPower, airResistance, frictionResistance], [this.x, this.xVelocity])
    }

    getCenterX() {
        return this.x + car.width/2 + this.ground.cX;
    }

    setCenterX(x) {
        this.x = x - car.width/2 - this.ground.cX;
    }
	
    draw() {        
        this.ctx.save();

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

const groundAngleSlider = new PositionSlider(displayCanvas, [0, world.cY], [sliderWidth, world.cHeight - sliderWidth], true);
const setPointSlider = new PositionSlider(displayCanvas, [world.cX, world.cY + world.cHeight - sliderWidth], [world.cWidth, sliderWidth], false);

const carPidController = new PidController(deltaTime);
carPidController.setSetPoint(setPointSlider.getAbsolutePosition());
carPidController.updateMeasuredValue(car.getCenterX());

// groundDegreesInput.value = world.getFloorDegrees();
groundDegreesInput.value = groundAngleSlider.getCanvasCenteredPosition();
groundAngleSlider.oninput = () => {
	const worldTilt = groundAngleSlider.getCanvasCenteredPosition() * 2;
    world.setFloorOffset(worldTilt);
	groundDegreesInput.value = world.getFloorDegrees();
}
groundDegreesInput.oninput = () => {
	const worldTiltDegrees = groundDegreesInput.value;
	world.setFloorDegrees(worldTiltDegrees);
	groundAngleSlider.setCanvasCenteredPosition(world.getFloorOffset() / 2);
};
groundDegreesInput.max = 89;
groundDegreesInput.min = -89;

setPointInput.value = setPointSlider.getCanvasCenteredPosition();

setPointSlider.oninput = () => {
	const setPointPosition = setPointSlider.getCanvasCenteredPosition();
	setPointInput.value = setPointPosition;

	carPidController.setSetPoint(setPointSlider.getAbsolutePosition());
};
setPointInput.oninput = () => {
	const setPointPosition = setPointInput.value;
	setPointSlider.setCanvasCenteredPosition(setPointPosition);
	carPidController.setSetPoint(setPointPosition);
}

setInterval(() => {
	carPidController.updateMeasuredValue(car.getCenterX())
	car.setMotorPower(carPidController.getResult());

    world.draw();
	if (setPointSlider.isHovered || setPointSlider.isSelected || document.activeElement === setPointInput) {
		const setPoint = setPointSlider.getAbsolutePosition();
		world.drawLine(setPoint, world.cY, setPoint, world.cY+world.cHeight, {color: "green"})
	}
    
    car.update();
    car.draw()

    groundAngleSlider.draw();
    setPointSlider.draw();

	groundAngleSlider.drawThumb();
	setPointSlider.drawThumb();

}, Math.floor(1000 / FPS))