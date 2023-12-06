
// push down body
const header = document.getElementById("header");
const main = document.querySelector("main");
main.style.paddingTop = header.clientHeight + "px";

const displayCanvas = document.getElementById("display-canvas");
displayCanvas.addEventListener('selectstart', function (e) { e.preventDefault(); return false; }, false);

fullResolution(displayCanvas);

function fullResolution(canvas) {
	const dpr = Math.ceil(window.devicePixelRatio || 1);
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

function makeSettings(header, values, { getInputElements = false } = {}) {
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
		else setAllowedChars(input, /[\d.-]/);
		input.addEventListener("input", (event) => updateObject[name] = Number(event.target.value));

		for (const [ruleType, ruleValue] of Object.entries(rules)) {
			input.setAttribute(ruleType, ruleValue);
		}

		input.step = 1;
		document.addEventListener("click", (event) => input.step = event.target == input ? rules.step : "any")

		settingsMenu.addEventListener("reset", () => { if (input.oninput) setTimeout(input.oninput) })

		inputs.push(input);

		item.appendChild(label);
		item.appendChild(input);
		categoryControls.appendChild(item);
	}

	category.appendChild(categoryControls);

	settingsMenu.appendChild(category);

	return getInputElements ? inputs : updateObject;

}

const backgroundColor = "white";
const FPS = 60;
const FORCE_LINE_MULTIPLIER = 15;

const pidSettings = makeSettings("PID Gains", {
	P: { value: 1, min: 0, title: "Proportional Term", step: 0.1 },
	I: { value: 0, min: 0, title: "Integral Term", step: 0.1 },
	D: { value: 0, min: 0, title: "Derivative Term", step: 0.1 },
})

const [groundDegreesInput, setPointInput, carPointInput] = makeSettings("General", {
	slopeDegrees: { name: "Floor Angle Degrees", title: "Angle of the floor in degrees, between 90 and -90 with 0 being level" },
	setPoint: { name: "Car Set Point", title: "Set point of car in pixels, 0 is center of canvas" },
	carPoint: { name: "Car Position", title: "Position of car in pixels, 0 is center of canvas" },
}, { getInputElements: true });


const physicsSettings = makeSettings("World", {
	gravity: { name: "Gravity", value: 9.8, min: 0, title: "Gravity of world", step: 0.1 },
	friction: { name: "Friction Coefficient", value: 0.02, min: 0, title: "How easily the car slides", step: 0.1 },
	airDensity: { name: "Air Density", value: 1.225, min: 0, title: "How strong air resistance is", step: 0.1 },
});

const carSettings = makeSettings("Car", {
	maxMotorPower: { name: "Max Motor Power", value: 10, min: 0, max: 60, title: "Max amount of force motors can spin wheels with", step: 0.1 },
	mass: { name: "Mass", value: 3, min: 0, title: "Mass of car, how much gravity effects car", step: 0.1 },
	dragCoefficient: { name: "Drag Coefficient", value: 0.01, min: 0, title: "How much drag effects car", step: 0.1 },
});

const infoLineOpacities = makeSettings("Info Lines Opacity", {
	carMotorPower: { name: "Car Motor Power", value: 0, min: 0, max: 1, title: "How visible arrow showing car's motor force is", step: 0.1 },
	force: { name: "Forces", value: 0, min: 0, max: 1, title: "How visible force arrows are, force arrows are gravity, friction, air resistance, and velocity", step: 0.1 },
	carOutlineLines: { name: "Car Outline", value: 0, min: 0, max: 1, title: "How visible car outline is", step: 0.1 },
});

const resetCarButton = document.getElementById("reset-button");

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

function findDistance(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
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

	drawLine(startX, startY, endX, endY, { color = undefined, thickness = 1, fill = undefined} = {}) {

		this.ctx.strokeStyle = color;
		this.ctx.fillStyle = fill;
		this.ctx.lineWidth = thickness;
		
		this.ctx.beginPath();
		this.ctx.moveTo(startX, startY);
		this.ctx.lineTo(endX, endY);
		
		this.ctx.stroke();
	}

	drawRect(x, y, width, height, { color = undefined, thickness = Math.ceil(window.devicePixelRatio), fill = undefined } = {}) {	
		
		this.ctx.strokeStyle = color;
		this.ctx.fillStyle = fill;
		this.ctx.lineWidth = thickness;

		if (fill) this.ctx.fillRect(x, y, width, height);
		else this.ctx.rect(x, y, width, height);

		// if (color) this.ctx.stroke();
		
	}

	drawCircle(x, y, radius, { color = undefined, thickness = Math.ceil(window.devicePixelRatio), fill = undefined } = {}) {
		
		this.ctx.beginPath();
		this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);

		this.ctx.strokeStyle = color;
		this.ctx.fillStyle = fill;
		this.ctx.lineWidth = thickness;

		this.ctx.stroke();
		if (fill) this.ctx.fill();
	}

	drawArrow(startX, startY, endX, endY, { color = undefined, thickness = Math.ceil(window.devicePixelRatio), arrowHeadLength = 10, arrowAngleDegrees = 30, autoShrinkArrowHead = true } = {}) {
		const lineDistance = findDistance(startX, startY, endX, endY);
		if (lineDistance == 0) return

		this.drawLine(startX, startY, endX, endY, { color: color, thickness: thickness });

		const arrowAngleRad = degreesToRadians(arrowAngleDegrees);

		const angle = Math.atan2(endY - startY, endX - startX);

		if (lineDistance < arrowHeadLength) arrowHeadLength = lineDistance;

		arrowHeadLength += thickness;

		const x1 = endX - arrowHeadLength * Math.cos(angle - arrowAngleRad);
		const y1 = endY - arrowHeadLength * Math.sin(angle - arrowAngleRad);
		const x2 = endX - arrowHeadLength * Math.cos(angle + arrowAngleRad);
		const y2 = endY - arrowHeadLength * Math.sin(angle + arrowAngleRad);

		this.drawLine(endX, endY, x1, y1, { color: color, thickness: thickness });
		this.drawLine(endX, endY, x2, y2, { color: color, thickness: thickness });
	}

	drawText(text, x, y, height, { centerX = false, centerY = false, font = "monospace", color = "black", thickness = 1} = {}) {
		this.ctx.fillStyle = color;
		this.ctx.strokeStyle = color;
		this.ctx.lineWidth = thickness;

		height = (typeof height === "number") ? String(height) + "px" : height;

		this.ctx.textAlign = centerX ? "center" : "left";
		this.ctx.font = height + " " + font;

		if (centerY) y -= height / 2;

		this.ctx.strokeText(text, x, y);
	}
}

class HoverBox extends CanvasDrawer {
	constructor(canvas, position, size) {
		super(canvas, position, size);
		this.isHovered = false;
		
		this.rect = this.canvas.getBoundingClientRect();
		this.dpr = Math.ceil(window.devicePixelRatio || 1);

		this.canvas.addEventListener('mousemove', this.move);
	}

	toCanvasLocation(x, y) {
		return [(x - this.rect.x) * this.dpr, (y - this.rect.y) * this.dpr];
	}

	move = (event) => {
		const [x, y] = this.toCanvasLocation(event.x, event.y);

		this.isHovered = x >= this.cX && x <= this.cX + this.cWidth && y >= this.cY && y <= this.cY + this.cHeight;
	}

	draw() {
		const boxOneMarginPercent = 0.75;
		const boxOneXMargin = (this.cWidth * (1-boxOneMarginPercent));
		const boxOneYMargin = (this.cHeight * (1-boxOneMarginPercent));

		this.drawRect(
			this.cX + boxOneXMargin, this.cY + boxOneYMargin,
			this.cWidth - boxOneXMargin*2, this.cHeight - boxOneYMargin*2,
			{fill: this.isHovered ? "green" : "black"})
	}


}

class PositionSlider extends CanvasDrawer {
	constructor(canvas, position, size, vertical = false) {
		super(canvas, position, size)

		this.isSelected = false;
		this.isHovered = false;
		this.canvas.addEventListener('mousedown', this.detectClicked);
		this.canvas.addEventListener('mousemove', this.move);
		document.body.addEventListener('mouseup', this.cancelSelect);
		document.body.addEventListener('mouseleave', this.cancelSelect);

		this.isVertical = vertical;

		this.defaultBgColor = "#99ccff";
		this.hoverBgColor = "#80bfff"
		this.selectedBgColor = "#b3d9ff"

		this.lineColor = "black";

		this.thumbRadius = (this.isVertical ? this.cWidth : this.cHeight) * 0.4;
		this.thumbColor = "green";

		this.rect = this.canvas.getBoundingClientRect();
		this.dpr = Math.ceil(window.devicePixelRatio || 1);

		this.setLocalCenteredPosition(0);

		this.oninput = () => { };
	}

	toCanvasLocation(x, y) {
		return [(x - this.rect.x) * this.dpr, (y - this.rect.y) * this.dpr];
	}

	detectClicked = (event) => {
		const [x, y] = this.toCanvasLocation(event.x, event.y);

		if (x >= this.cX && x <= this.cX + this.cWidth && y >= this.cY && y <= this.cY + this.cHeight) {

			this.isSelected = true;
			this.setValue(this.isVertical ? y - this.thumbRadius * 2 : x);
		}
	}

	cancelSelect = (event) => {
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

		// draw slider background
		this.drawRect(0, 0, this.cWidth, this.cHeight, { color: "transparent", fill: this.isSelected ? this.selectedBgColor : (this.isHovered ? this.hoverBgColor : this.defaultBgColor) });

		// draw slider line
		if (this.isVertical) {
			this.drawLine(
				this.cWidth / 2, this.thumbRadius / 2,
				this.cWidth / 2, this.cHeight - this.thumbRadius / 2,
				{ color: this.lineColor, fill: "black" });
		}
		else {
			this.drawLine(
				this.thumbRadius / 2, this.cHeight / 2,
				this.cWidth - this.thumbRadius / 2, this.cHeight / 2,
				{ color: this.lineColor });
		}
		
		// draw slider thumb
		if (this.isVertical) {
			this.drawCircle(
				this.cWidth / 2, this.value + this.thumbRadius,
				this.thumbRadius, { fill: this.thumbColor });

			this.drawLine(
				(this.cWidth - this.thumbRadius) / 2, this.value + this.thumbRadius,
				(this.cWidth + this.thumbRadius) / 2, this.value + this.thumbRadius,
				{ color: "white" })
		}
		else {
			this.drawCircle(
				this.value, this.cHeight / 2,
				this.thumbRadius, { fill: this.thumbColor });

			this.drawLine(
				this.value, (this.cHeight - this.thumbRadius) / 2,
				this.value, (this.cHeight + this.thumbRadius) / 2,
				{ color: "white" })
		}

		this.ctx.restore();
	}

	getPosition() {
		return this.value + (this.isVertical ? this.cY : this.cX);
	}

	setPosition(value) {
		this.value = value - (this.isVertical ? this.cY : this.cX)
	}

	getLocalPosition() {
		return this.value;
	}

	setLocalPosition(value) {
		this.value = value;
	}

	getLocalCenteredPosition() {
		return this.getLocalPosition() - (this.isVertical ? this.cHeight : this.cWidth) / 2;
	}

	setLocalCenteredPosition(value) {
		this.setLocalPosition(value + (this.isVertical ? this.cHeight : this.cWidth) / 2);
	}

	getCenteredPosition() {
		return this.getPosition() - (this.isVertical ? this.cHeight : this.cWidth) / 2;
	}

	setCenteredPosition(value) {
		this.setPosition(value + (this.isVertical ? this.cHeight : this.cWidth) / 2);
	}

	setValue(value) {
		if (this.isVertical) {
			value -= this.cY - this.thumbRadius;
			this.value = clamp(value, this.thumbRadius, this.cHeight - this.thumbRadius * 2);
		}
		else {
			value -= this.cX;
			this.value = clamp(value, this.thumbRadius, this.cWidth - this.thumbRadius);
		}
		this.oninput();
	}
}


class Floor extends CanvasDrawer {
	constructor(canvas, position, size, { floorWidth = 2 } = {}) {
		super(canvas, position, size)

		this.floorWidth = floorWidth;

		this.setFloorOffset(0);
	}

	setFloorOffset(floorOffset) {
		this.floorOffset = floorOffset;

		[this.startX, this.startY] = [0, (this.cHeight - this.floorOffset) / 2];
		[this.endX, this.endY] = [this.cWidth, (this.cHeight + this.floorOffset) / 2];
	}

	displayGroundAngle(lineSettings = {}) {
		this.ctx.save();
		this.ctx.translate(this.cX + this.cWidth / 2, this.cY + this.cHeight / 2);

		const lineLength = 75

		this.drawLine(0, 0, lineLength, 0, lineSettings)
		this.drawLine(0, 0, 0, -lineLength, lineSettings)

		this.drawText(Math.round(this.getFloorDegrees()) + "°", lineLength / 4, -lineLength / 6, "1rem");

		this.ctx.restore();
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

		this.drawRect(0, 0, this.cWidth, this.cHeight, { color: "transparent", fill: "white" })
		this.drawLine(this.startX, this.startY + (this.floorWidth - 1) / 2, this.endX, this.endY + (this.floorWidth - 1) / 2, { color: "black", thickness: this.floorWidth })

		this.ctx.restore();
	}
}

class PidController {
	constructor() {
		this.reset();
	}

	reset() {
		this.previousError = 0;
		this.integral = 0;
		this.lastTime = new Date().getTime();
	}

	calculate(setPoint, measuredValue) {
		const error = setPoint - measuredValue;

		const now = new Date().getTime();
		const deltaTime = (now - this.lastTime) || 1;

		const proportional = error;
		const integral = this.integral + error * (1 / deltaTime);
		const derivative = (error - this.previousError) / (1 / deltaTime);

		// console.log(proportional, integral, derivative);
		// console.log((pidSettings.P * proportional) / this.deltaTime, (pidSettings.I * integral) / this.deltaTime, (pidSettings.D * derivative) / this.deltaTime);

		
		this.previousError = error;
		this.integral = integral;
		this.lastTime = now;

		return (pidSettings.P * proportional + pidSettings.I * integral + pidSettings.D * derivative) / deltaTime;
	}
}

function moveTowards(value, target, distance) {
	distance = Math.abs(distance);
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

		this.width = (scale / size) * 400;
		this.height = (scale / size) * 200;

		this.boxLines = true;

		this.motorPower = 0;

		this.reset();
	}

	reset() {
		this.xVelocity = 0;

		this.setLocalWorldCenteredCenterX(0);
		this.y = 0;
		this.rotation = 0;
	}

	setMotorPower(power) {
		this.motorPower = clamp(power, -carSettings.maxMotorPower, carSettings.maxMotorPower)
	}

	getLocalX() {
		return this.x;
	}

	setLocalX(x) {
		this.x = x;
	}

	getLocalCenterX() {
		return this.getLocalX() + this.width / 2;
	}

	setLocalCenterX(x) {
		this.setLocalX(x - this.width / 2);
	}

	getX() {
		return this.ground.cX + this.getLocalX();
	}

	setX(x) {
		this.setLocalX(x - this.ground.cX)
	}

	getCenterX() {
		return this.getLocalCenterX() + this.ground.cX;
	}

	setCenterX(x) {
		this.setLocalCenterX(x - this.ground.cX)
	}

	getLocalWorldCenteredCenterX() {
		return this.getLocalCenterX() - this.ground.cWidth / 2;
	}

	setLocalWorldCenteredCenterX(x) {
		this.setLocalCenterX(x + this.ground.cWidth / 2);
	}

	getWorldCenteredCenterX() {
		return this.getCenterX() - this.ground.cWidth / 2;
	}

	setWorldCenteredCenterX(x) {
		this.setCenterX(x + this.ground.cWidth / 2);
	}

	update() {
		this.rotation = this.ground.getFloorRad();

		// find ground
		const b2 = Math.tan(this.rotation) * (this.x + this.width / 2) - this.height;
		const ground = this.ground.startY + b2;

		this.y = ground;

		const weight = carSettings.mass * -physicsSettings.gravity;

		const bRad = Math.PI / 2 - this.rotation;

		const adj = Math.cos(bRad) * weight;
		const op = Math.sin(bRad) * weight;

		const frictionResistance = op * physicsSettings.friction;
		const hillForce = this.rotation ? -adj : 0;

		this.xVelocity += (hillForce + this.motorPower) / FPS;

		const airResistance = ((physicsSettings.airDensity * carSettings.dragCoefficient) / 2) * Math.pow(this.xVelocity, 2);

		this.xVelocity = moveTowards(this.xVelocity, 0, frictionResistance / FPS)
		this.xVelocity = moveTowards(this.xVelocity, 0, airResistance / FPS)

		this.x += this.xVelocity

		// console.log([hillForce, this.motorPower, airResistance, frictionResistance], [this.x, this.xVelocity])
		if (infoLineOpacities.force > 0) {
			const color = `rgba(0, 0, 0, ${infoLineOpacities.force})`;
			const red = `rgba(255, 0, 0, ${infoLineOpacities.force})`;

			this.ctx.save();

			const heightOffset = -this.height;

			this.ctx.translate(this.x + this.ground.cX + this.width / 2, this.y + this.ground.cY + this.height / 2 + heightOffset);

			const carDirection = this.xVelocity / Math.abs(this.xVelocity)

			const lineOptions = { color: color, thickness: 3, arrowHeadLength: 5}

			const gap = 10;
			this.drawArrow(0, 0*gap, hillForce * FORCE_LINE_MULTIPLIER, 0*gap, lineOptions)
			this.drawArrow(0, 1*gap, Math.abs(frictionResistance) * -carDirection * FORCE_LINE_MULTIPLIER, 1*gap, lineOptions)
			this.drawArrow(0, 2*gap, Math.abs(airResistance) * -carDirection * FORCE_LINE_MULTIPLIER, 2*gap, lineOptions)

			this.drawArrow(0, 3*gap, this.xVelocity * FORCE_LINE_MULTIPLIER, 3*gap, { ...lineOptions, color: red})

			this.ctx.restore();
		}
	}

	draw() {
		const boxColor = `rgba(0, 0, 0, ${infoLineOpacities.carOutlineLines})`;
		const arrowColor = `rgba(0, 255, 0, ${infoLineOpacities.carOutlineLines})`;

		if (infoLineOpacities.carOutlineLines > 0) {
			this.ctx.save();

			this.ctx.translate(this.ground.cX + this.x, this.ground.cY + this.y);

			this.drawLine(0, 0, this.width, 0, { color: boxColor })
			this.drawLine(0, 0, 0, this.height, { color: boxColor })
			this.drawLine(this.width, 0, this.width, this.height, { color: boxColor })
			this.drawLine(this.width, this.height, 0, this.height, { color: boxColor })

			this.drawCircle(this.width / 2, this.height, 5, { color: arrowColor })
			this.drawArrow(this.width / 2, this.height, this.width / 2, 100, { color: arrowColor })

			this.ctx.restore();
		}

		this.ctx.save();

		this.ctx.translate(this.ground.cX + this.x + this.width / 2, this.ground.cY + this.y + this.height);
		this.ctx.rotate(this.rotation);
		this.ctx.translate(-this.width / 2, -this.height);

		if (infoLineOpacities.carOutlineLines > 0) {
			this.drawLine(0, 0, this.width, 0, { color: boxColor })
			this.drawLine(0, 0, 0, this.height, { color: boxColor })
			this.drawLine(this.width, 0, this.width, this.height, { color: boxColor })
			this.drawLine(this.width, this.height, 0, this.height, { color: boxColor })

			this.drawCircle(this.width / 2, this.height, 5, { color: arrowColor })
			this.drawArrow(this.width / 2, this.height, this.width / 2, 100, { color: arrowColor })
		}


		if (this.hasImageLoaded) this.ctx.drawImage(this.image, 0, 0, this.width, this.height);
		else this.drawRect(0, 0, this.width, this.height, { fill: "black" })

		if (infoLineOpacities.carMotorPower > 0) {
			const motorColor = `rgba(255, 0, 0, ${infoLineOpacities.carMotorPower})`;
			this.drawArrow(this.width / 2, this.height / 2, this.width / 2 + this.motorPower * FORCE_LINE_MULTIPLIER, this.height / 2, { color: motorColor, thickness: 7 })
		}

		this.ctx.restore()
	}
}

class Graph extends CanvasDrawer {
	constructor(canvas, position, size, ticks = [undefined, undefined]) {
		super(canvas, position, size);

		[this.xTicks, this.yTicks] = ticks;
		this.xTicks ??= this.cWidth;
		this.yTicks ??= this.cHeight;

		[this.xTickGap, this.yTickGap] = [this.cWidth / this.xTicks, this.cHeight / this.yTicks];

		console.log([this.xTicks, this.yTicks], [this.xTickGap, this.yTickGap])
		
		this.xAxisLines = 30;
		this.axisLineGap = (this.cWidth) / this.xAxisLines;
		this.yAxisLines = Math.ceil(this.cHeight / this.xAxisLines);

		this.data = {};
		this.dataSettings = {};
	}

	createDataPoint(name, lineFormat = {}) {
		this.data[name] = [];
		this.dataSettings[name] = lineFormat;
	}

	updateData(dataPoint, value) {
		const x = Math.round((value - this.cX) / this.xTickGap) * this.xTickGap;
		this.data[dataPoint].unshift(x);
		if (this.data[dataPoint].length > this.yTicks) this.data[dataPoint].pop();
	}

	draw() {
		this.ctx.save();
		this.ctx.translate(this.cX, this.cY);
		
		// --- Background ---
		this.drawRect(0, 0, this.cWidth, this.cHeight, { color: "transparent", fill: "white" });
		
		// --- Grid Lines ---
		const removedEdgeLines = 0;

		// X lines
		for (let i = removedEdgeLines; i <= this.xAxisLines - removedEdgeLines; i++) {
			this.drawLine(this.axisLineGap * i, 0, this.axisLineGap * i, this.cHeight, {color: "rgb(0, 0, 0, 0.35)"})			
		}

		// Y Lines and Y Axis time
		for (let i = removedEdgeLines; i <= this.yAxisLines - removedEdgeLines; i++) {
			this.drawLine(0, this.axisLineGap * i, this.cWidth, this.axisLineGap * i, {color: "rgb(0, 0, 0, 0.35)"})			
		}

		// data
		for (const [name, data] of Object.entries(this.data)) {
			const lineSettings = this.dataSettings[name];

			let lastPoint = undefined;
			for (let i = 0; i < data.length; i++) {
				const x = clamp(data[i], 0, this.cWidth);
				const y = clamp(i * this.yTickGap, 0, this.cHeight);

				if (lastPoint) {
					const [lastX, lastY] = lastPoint;
					this.drawLine(lastX, lastY, x, y, lineSettings);
				}

				lastPoint = [x, y];
			}
		}

		this.ctx.restore();

	}
}

const sliderWidth = 16;
const world = new Floor(displayCanvas, [sliderWidth, 0], [displayCanvas.width - sliderWidth, displayCanvas.height / 1.618]);

const car = new Car(displayCanvas, "car_outline.png", world)

const groundAngleSlider = new PositionSlider(displayCanvas, [0, world.cY], [sliderWidth, world.cHeight - sliderWidth], true);
const setPointSlider = new PositionSlider(displayCanvas, [world.cX, world.cY + world.cHeight - sliderWidth + 1], [world.cWidth, sliderWidth], false);
const sliderDoubleHover = new HoverBox(displayCanvas, [groundAngleSlider.cX, setPointSlider.cY], [groundAngleSlider.cWidth, setPointSlider.cHeight]);

const locationGraph = new Graph(
	displayCanvas,
	[world.cX, setPointSlider.cY + setPointSlider.cHeight], [world.cWidth, displayCanvas.height - setPointSlider.cY + setPointSlider.cHeight],
	[undefined, 700]);

const carPidController = new PidController();

// set up ground angle inputs
groundAngleSlider.oninput = () => {
	world.setFloorOffset(groundAngleSlider.getLocalCenteredPosition() * -2);
	groundDegreesInput.value = Math.round(world.getFloorDegrees());
}
groundDegreesInput.oninput = () => {
	world.setFloorDegrees(Number(groundDegreesInput.value));
	groundAngleSlider.setCenteredPosition(world.getFloorOffset() / 2);
};
groundDegreesInput.max = 89;
groundDegreesInput.min = -89;
groundDegreesInput.setAttribute("value", Math.round(groundAngleSlider.getLocalCenteredPosition()));

// set up car position input
carPointInput.oninput = () => car.setLocalWorldCenteredCenterX(Number(carPointInput.value));
carPointInput.setAttribute("value", Math.round(car.getLocalWorldCenteredCenterX()));

// set up set point inputs
setPointSlider.oninput = () => {
	setPointInput.value = Math.round(setPointSlider.getLocalCenteredPosition());
}
setPointInput.oninput = () => {
	setPointSlider.setLocalCenteredPosition(Number(setPointInput.value));
};
setPointInput.setAttribute("value", setPointSlider.getLocalCenteredPosition());

resetCarButton.onclick = () => {
	car.reset();
	carPidController.reset();
}

locationGraph.createDataPoint("car position", {color: "black", thickness: 5})
locationGraph.createDataPoint("setpoint", {color: "green", thickness: 5})

// main loop
setInterval(() => {
	const focusedElement = document.activeElement;

	const carCenterX = car.getCenterX();
	const setPoint = setPointSlider.getPosition();

	locationGraph.updateData("car position", carCenterX)
	locationGraph.updateData("setpoint", setPoint)

	const PIDOutput = carPidController.calculate(setPoint, carCenterX)
	car.setMotorPower(PIDOutput);

	world.draw();

	if (focusedElement !== carPointInput) {
		carPointInput.value = Math.round(car.getLocalWorldCenteredCenterX());
	}

	if (setPointSlider.isHovered || setPointSlider.isSelected || sliderDoubleHover.isHovered || focusedElement === setPointInput) {
		world.drawLine(setPoint, world.cY, setPoint, world.cY + world.cHeight, { color: "green" })
	}
	if (groundAngleSlider.isHovered || groundAngleSlider.isSelected || sliderDoubleHover.isHovered || focusedElement == groundDegreesInput) {
		world.displayGroundAngle({ color: "green", thickness: 2 });
	}

	locationGraph.draw();
	
	car.update();
	car.draw()
	
	groundAngleSlider.draw();
	setPointSlider.draw();

	sliderDoubleHover.draw();

}, Math.floor(1000 / FPS))