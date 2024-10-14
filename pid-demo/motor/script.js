
const FPS = 60;

// push down body
const header = document.getElementById("header");
const main = document.querySelector("main");
main.style.paddingTop = header.clientHeight + "px";

const displayCanvas = document.getElementById("display-canvas");
displayCanvas.addEventListener('selectstart', function (e) { e.preventDefault(); return false; }, false);
fullResolution(displayCanvas);

const graphCanvas = document.getElementById("secondary-graph");
graphCanvas.addEventListener('selectstart', function (e) { e.preventDefault(); return false; }, false);
fullResolution(graphCanvas)

function fullResolution(canvas) {
	const dpr = Math.ceil(window.devicePixelRatio || 1);
	canvas.width = canvas.clientWidth * dpr;
	canvas.height = canvas.clientHeight * dpr;
}

// #settings #settings-menu
const pidControlMenu = document.getElementById("pid-control-menu");
const settingsMenu = document.getElementById("settings-menu");

function setAllowedChars(input, pattern) {
	input.addEventListener("keypress", (event) => {
		if (!pattern.test(event.key)) {
			event.preventDefault();
			return false;
		}
	});
}

function makeSettings(header, values, form, { getInputElements = false } = {}) {
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

		updateObject[name] = rules["type"] !== "checkbox" ? Number(rules.value) : Boolean(rules.checked);

		const displayName = rules.name || name;

		// .category .controls .item label
		const label = document.createElement("label");
		label.innerText = displayName + ": ";
		label.setAttribute("for", name);
		label.setAttribute("title", rules.title);

		// .category .controls .item input
		const input = document.createElement("input");
		input.type = "number";
		input.name = name;
		input.id = name;

		if (rules.min >= 0) setAllowedChars(input, /[\d.]/);
		else setAllowedChars(input, /[\d.-]/);
		
		for (const [ruleType, ruleValue] of Object.entries(rules)) {
			input.setAttribute(ruleType, ruleValue);
		}

		input.addEventListener("input", (event) => updateObject[name] = event.target.type === "number" ? Number(event.target.value) : Boolean(event.target.checked));

		input.step = 1;
		document.addEventListener("click", (event) => input.step = event.target == input ? rules.step : "any")

		form.addEventListener("reset", () => { if (input.oninput) setTimeout(input.oninput) })

		inputs.push(input);

		item.appendChild(label);
		item.appendChild(input);
		categoryControls.appendChild(item);
	}

	category.appendChild(categoryControls);

	form.appendChild(category);

	return getInputElements ? inputs : updateObject;

}

const pidSettings = makeSettings("PID Gains", {
	P: { value: 1, min: 0, title: "The proportional gain value.", step: 0.1 },
	I: { value: 0, min: 0, title: "The integral gain value", step: 0.1 },
	D: { value: 0, min: 0, title: "The derivative gain value", step: 0.1 },
}, pidControlMenu)

const settingsITerm = {
	maxAccum: undefined,
	zone: undefined,
}
// const settingsITerm = makeSettings("I Term Rules", {
// 	maxAccum: { name: "Max Accum", min: 0, title: "This value is used to constrain the I accumulator to help manage integral wind-up.", step: 10 },
// 	zone: { name: "Zone", min: 0, title: "This value specifies the range the |error| must be within for the integral constant to take effect.", step: 10 },
// }, pidControlMenu)


const [setpointRotations, setpointDegrees, setpointRadians] = makeSettings("Setpoint Position", {
	setpointRotations: { name: "Rotations", title: "Setpoint number of rotations motor should reach", step: 0.1 },
	setpointDegrees: { name: "Degrees", title: "Setpoint number of Degrees motor should reach", step: 10 },
	setpointRadians: { name: "Radians", title: "Setpoint number of Radians motor should reach", step: Math.PI / 6 },
}, pidControlMenu, { getInputElements: true });


const [measuredRotations, measuredDegrees, measuredRadians] = makeSettings("Position", {
	measuredRotations: { name: "Rotations", title: "Measured number of rotations motor has turned", step: 0.1 },
	measuredDegrees: { name: "Degrees", title: "Measured number of degrees motor has turned", step: 10 },
	measuredRadians: { name: "Radians", title: "Measured number of radians motor has turned", step: Math.PI / 6 },
}, settingsMenu, { getInputElements: true });

const [measuredPosition, measuredVelocity, measuredAcceleration] = makeSettings("Measured Motion", {
	measuredPosition: { name: "Position: Rotations", title: "Measured number of rotations, r", step: 0.1 },
	measuredVelocity: { name: "Velocity: RPM", title: "Measured rotations per minute, r/min", step: 0.1 },
	measuredAcceleration: { name: "Acceleration: r/min^2", title: "Measured rotations per minute squared, r/min^2", step: 0.1 },
}, settingsMenu, { getInputElements: true });

const motorConfig = makeSettings("Motor Config", {
	maxRPM: { name: "Max RPM", value: 5600, title: "Maximum velocity of motor, in rotations per minute", step: 1, },
	radius: { name: "Radius", value: Math.min(displayCanvas.width, displayCanvas.height) / 4, title: "Radius of motor wheel, in pixels", step: 1, },
	isStationary: { name: "Stationary", checked: true, title: "Whether motor is mounted or rolling", type: "checkbox", },
}, settingsMenu);

const resetButton = document.getElementById("reset-button");

function degreesToRadians(degrees) {
	return degrees * (Math.PI / 180);
}

function radiansToDegrees(radians) {
	return radians * (180 / Math.PI);
}

function rotationsToRadians(rotations) {
	return rotations * 2 * Math.PI;
}

function radiansToRotations(radians) {
	return radians / (2 * Math.PI);
}

function rotationsToDegrees(rotations) {
	return rotations * 360;
}

function degreesToRotations(degrees) {
	return degrees / 360;
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

	drawLine(startX, startY, endX, endY, { color = undefined, thickness = 1, fill = undefined } = {}) {

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

	drawText(text, x, y, height, { centerX = false, centerY = false, font = "monospace", color = "black", thickness = 1 } = {}) {
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
		const boxOneXMargin = (this.cWidth * (1 - boxOneMarginPercent));
		const boxOneYMargin = (this.cHeight * (1 - boxOneMarginPercent));

		this.drawRect(
			this.cX + boxOneXMargin, this.cY + boxOneYMargin,
			this.cWidth - boxOneXMargin * 2, this.cHeight - boxOneYMargin * 2,
			{ fill: this.isHovered ? "green" : "black" })
	}


}

class PidController {
	constructor() {
		this.reset();
	}

	reset() {
		this.previousError = 0;
		this.integral = 0;
	}

	calculateWithResults(setpoint, measuredValue) {
		const error = setpoint - measuredValue;

		const deltaTime = FPS / 1000;

		let proportional = error;
		let integral = this.integral + error * deltaTime;
		let derivative = (error - this.previousError) / deltaTime;

		if (settingsITerm.maxAccum) integral = clamp(integral, -settingsITerm.maxAccum, settingsITerm.maxAccum);
		if (settingsITerm.zone && Math.abs(error) > settingsITerm.zone) integral = 0;

		// console.log(proportional * deltaTime * pidSettings.P, integral * deltaTime * pidSettings.I, derivative * deltaTime * pidSettings.D)

		this.previousError = error;
		this.integral = integral;

		const p = pidSettings.P * proportional;
		const i = pidSettings.I * integral;
		const d = pidSettings.D * derivative;

		return [(p + i + d) * deltaTime, [error, p, i, d]];
	}

	calculate(setpoint, measuredValue) {
		const [result, [error, p, i, d]] = this.calculateWithResults(setpoint, measuredValue);
		return result;
	}
}

function lerp(x, x_min, x_max, new_min, new_max) {
	return new_min + (new_max - new_min) * ((x - x_min) / (x_max - x_min));
}

class Graph extends CanvasDrawer {
	constructor(canvas, position, size, ticks = [undefined, undefined], range = [undefined, undefined]) {
		super(canvas, position, size);

		[this.xTicks, this.yTicks] = ticks;
		this.xTicks ??= this.cWidth;
		this.yTicks ??= this.cHeight;

		[this.xTickGap, this.yTickGap] = [this.cWidth / this.xTicks, this.cHeight / this.yTicks];

		[this.min, this.max] = range;
		this.min ??= 0;
		this.max ??= this.cWidth;


		this.xAxisLines = 30;
		this.axisLineGap = (this.cWidth) / this.xAxisLines;
		this.yAxisLines = Math.ceil(this.cHeight / this.axisLineGap);

		this.data = {};
		this.dataSettings = {};
	}

	createDataPoint(name, lineFormat = {}) {
		this.data[name] = [];
		this.dataSettings[name] = lineFormat;
	}

	updateData(dataPoint, value) {
		value = lerp(value, this.min, this.max, -this.cWidth, this.cWidth)
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
			this.drawLine(this.axisLineGap * i, 0, this.axisLineGap * i, this.cHeight, { color: "rgb(0, 0, 0, 0.35)" })
		}

		// Y Lines and Y Axis time
		for (let i = removedEdgeLines; i <= this.yAxisLines - removedEdgeLines; i++) {
			this.drawLine(0, this.axisLineGap * i, this.cWidth, this.axisLineGap * i, { color: "rgb(0, 0, 0, 0.35)" })
		}

		// data
		for (const [name, data] of Object.entries(this.data)) {
			const lineSettings = this.dataSettings[name];

			if (lineSettings.condition && !lineSettings.condition()) continue;

			const xOffset = lineSettings.centerX ? this.cWidth / 2 : 0;

			let lastPoint = undefined;
			for (let i = 0; i < data.length; i++) {
				const x = clamp(data[i] + xOffset, 0, this.cWidth);
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

class Motor extends CanvasDrawer {
	constructor(canvas, position, size, { startRotations = 0, responsiveness = 5 } = {}) {
		super(canvas, position, size);

		this.maxRotationsPerMinute = motorConfig.maxRPM;
		this.responsiveness = responsiveness;

		this.rotations = this.zeroRotations = startRotations;
		this.velocity = 0;
		this.acceleration = 0;

		this.power = 0;

		this.lastUpdateTime = performance.now();
	}

	reset() {
		this.rotations = 0
		this.velocity = 0;
		this.acceleration = 0;
		this.power = 0;
	}

	getPosition() { return this.rotations; }

	setPosition(rotations) { this.rotations = rotations; }

	getVelocity() { return this.velocity; }

	setVelocity(rotationsPerMinute) { this.velocity = rotationsPerMinute; }

	getAcceleration() { return this.acceleration; }

	setAcceleration(rotationsPerMinuteSquared) { this.acceleration = rotationsPerMinuteSquared; }

	setPower(power) {
		this.power = Math.max(-1, Math.min(1, power));
	}

	setSetpointLine(value) {
		this.setpointLineRotations = value;
	}

	update() {
		// Calculate the time difference in seconds since the last update
		const currentTime = performance.now();
		const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert ms to seconds
		this.lastUpdateTime = currentTime;

		// Update acceleration based on power
		const targetRPM = this.power * motorConfig.maxRPM;
		this.acceleration = (targetRPM - this.velocity) * 1; // A constant to tune responsiveness

		// Update velocity based on acceleration
		this.velocity += this.acceleration * deltaTime;

		// Update position based on velocity
		this.rotations += (this.velocity / 60) * deltaTime; // RPM to rotations per second
	}

	draw() {
		this.ctx.fillStyle = "white";
		this.ctx.clearRect(this.cX, this.cY, this.cWidth, this.cHeight);
		this.ctx.fillRect(this.cX, this.cY, this.cWidth, this.cHeight);

		const centerX = this.cX + this.cWidth / 2;
		const centerY = this.cY + this.cHeight / 2;
		
		const distanceTraveled = (this.rotations * 2 * Math.PI) * motorConfig.radius;
		const floorHeight = this.cY + Math.min(this.canvas.width, this.canvas.height) / 1.5;

		const mountRadius = Math.min(this.canvas.width, this.canvas.height) / 3;
		if (motorConfig.isStationary) {
			this.ctx.fillStyle = "black";
			this.ctx.lineWidth = 20;


			this.ctx.beginPath();
			this.ctx.strokeRect(centerX - mountRadius, centerY - mountRadius, mountRadius * 2, mountRadius * 2)
			this.ctx.stroke();
			
			this.ctx.font = "48px serif";
			this.ctx.fillText(Math.floor(this.rotations), centerX - mountRadius + 10, centerY - mountRadius + 48);
		}
		else {

			this.ctx.fillStyle = "black";
			this.ctx.lineWidth = 20;
			this.ctx.beginPath()
			this.ctx.moveTo(this.cX, floorHeight)
			this.ctx.lineTo(this.cX + this.cWidth, floorHeight)
			this.ctx.stroke()
		}

		this.ctx.save();
		this.ctx.translate(centerX + (motorConfig.isStationary ? 0 : distanceTraveled), (motorConfig.isStationary ? centerY : floorHeight -motorConfig.radius));		
		
		this.ctx.save();
		this.ctx.rotate(rotationsToRadians(this.rotations + this.zeroRotations));

		// Draw the circular body of the motor
		this.ctx.fillStyle = "gray";
		this.ctx.beginPath();
		this.ctx.arc(0, 0, motorConfig.radius, 0, Math.PI * 2);
		this.ctx.fill();

		// Center Dot
		this.ctx.beginPath();
		this.ctx.fillStyle = "blue";
		this.ctx.arc(0, 0, motorConfig.radius / 14 / 2, 0, Math.PI * 2);
		this.ctx.fill();

		// Draw the line showing which way is up
		this.ctx.strokeStyle = "black";
		this.ctx.lineWidth = motorConfig.radius / 14;
		this.ctx.beginPath();
		this.ctx.moveTo(0, 0);
		this.ctx.lineTo(0, -motorConfig.radius);
		this.ctx.stroke();

		// Draw the mounting points
		this.ctx.fillStyle = "black";
		const mountingRadius = motorConfig.radius / 6;
		const angleOffset = Math.PI / 4;
		for (let i = 0; i < 4; i++) {
			const angle = i * Math.PI / 2 + angleOffset;
			const x = Math.cos(angle) * (motorConfig.radius - mountingRadius * 1.5);
			const y = Math.sin(angle) * (motorConfig.radius - mountingRadius * 1.5);
			this.ctx.beginPath();
			this.ctx.arc(x, y, mountingRadius, 0, Math.PI * 2);
			this.ctx.fill();
		}

		this.ctx.restore();

		if (this.setpointLineRotations) {
			this.ctx.strokeStyle  = "green";
			this.ctx.fillStyle  = "green";
			this.ctx.lineWidth = 5;
			const lineLength = motorConfig.radius * 1.3;
			this.ctx.beginPath()
			const setpointLineRadians = rotationsToRadians(this.setpointLineRotations);
			if (motorConfig.isStationary) {
				this.ctx.moveTo(0, 0)
				this.ctx.lineTo(Math.sin(setpointLineRadians) * lineLength, -Math.cos(setpointLineRadians) * lineLength);

				this.ctx.font = "48px serif";
				this.ctx.fillText(Math.floor(this.setpointLineRotations), -mountRadius + 10, mountRadius - 15);
			}
			else {
				const setpointLineDistance = setpointLineRadians * motorConfig.radius;
				this.ctx.moveTo(setpointLineDistance - distanceTraveled, 0)
				this.ctx.lineTo(setpointLineDistance - distanceTraveled, lineLength);
			}
			this.ctx.stroke();
		}

		this.ctx.restore();
	}
}

class AngleSelect {
	constructor(canvasDrawer, center = [undefined, undefined]) {

		this.canvasDrawer = canvasDrawer;
		this.canvas = canvasDrawer.canvas;

		[this.centerX, this.centerY] = center;
		this.centerX ??= this.canvasDrawer.cX + this.canvasDrawer.cWidth / 2;
		this.centerY ??= this.canvasDrawer.cY + this.canvasDrawer.cHeight / 2;


		this.isSelected = false;
		this.isHovered = false;

		this.value = undefined;

		this.canvas.addEventListener('mousedown', this.detectClicked);
		this.canvas.addEventListener('mousemove', this.move);
		document.body.addEventListener('mouseup', this.cancelSelect);
		document.body.addEventListener('mouseleave', this.cancelSelect);

		this.rect = this.canvas.getBoundingClientRect();
		this.dpr = Math.ceil(window.devicePixelRatio || 1);

		this.oninput = (value) => {}
	}

	getValue() {
		return this.value;
	}

	_setValue(x, y) {
		this.value = (radiansToRotations(Math.atan2(this.centerY - y, this.centerX - x) - Math.PI / 2) + 1) % 1;		
		
		this.oninput(this.value)
	}

	toCanvasLocation(x, y) {
		return [(x - this.rect.x) * this.dpr, (y - this.rect.y) * this.dpr];
	}

	detectClicked = (event) => {
		const [x, y] = this.toCanvasLocation(event.x, event.y);
				

		if (!(x >= this.cX && x <= this.cX + this.cWidth && y >= this.cY && y <= this.cY + this.cHeight)) {
			this.isSelected = true;
			this._setValue(x, y)
		}
	}

	cancelSelect = (event) => {
		this.isSelected = false;
	}

	move = (event) => {
		const [x, y] = this.toCanvasLocation(event.x, event.y);

		if (this.isSelected) this._setValue(x, y);

		this.isHovered = !(x >= this.cX && x <= this.cX + this.cWidth && y >= this.cY && y <= this.cY + this.cHeight);
	}
}

class PositionSelect {
	constructor(canvasDrawer, center = [undefined, undefined]) {

		this.canvasDrawer = canvasDrawer;
		this.canvas = canvasDrawer.canvas;

		[this.centerX, this.centerY] = center;
		this.centerX ??= this.canvasDrawer.cX + this.canvasDrawer.cWidth / 2;
		this.centerY ??= this.canvasDrawer.cY + this.canvasDrawer.cHeight / 2;


		this.isSelected = false;
		this.isHovered = false;

		this.value = undefined;

		this.canvas.addEventListener('mousedown', this.detectClicked);
		this.canvas.addEventListener('mousemove', this.move);
		document.body.addEventListener('mouseup', this.cancelSelect);
		document.body.addEventListener('mouseleave', this.cancelSelect);

		this.rect = this.canvas.getBoundingClientRect();
		this.dpr = Math.ceil(window.devicePixelRatio || 1);

		this.oninput = (value) => {}
	}

	getValue() {
		return this.value;
	}

	_setValue(x, y) {
		this.value = (x - this.centerX) / 2 / Math.PI / motorConfig.radius;		
		
		this.oninput(this.value)
	}

	toCanvasLocation(x, y) {
		return [(x - this.rect.x) * this.dpr, (y - this.rect.y) * this.dpr];
	}

	detectClicked = (event) => {
		const [x, y] = this.toCanvasLocation(event.x, event.y);
				

		if (!(x >= this.cX && x <= this.cX + this.cWidth && y >= this.cY && y <= this.cY + this.cHeight)) {
			this.isSelected = true;
			this._setValue(x, y)
		}
	}

	cancelSelect = (event) => {
		this.isSelected = false;
	}

	move = (event) => {
		const [x, y] = this.toCanvasLocation(event.x, event.y);

		if (this.isSelected) this._setValue(x, y);

		this.isHovered = !(x >= this.cX && x <= this.cX + this.cWidth && y >= this.cY && y <= this.cY + this.cHeight);
	}
}

const graphTicks = 1000;

const otherGraph = new Graph(
	graphCanvas,
	[0, 0], [graphCanvas.width, graphCanvas.height],
	[undefined, graphTicks],
	[-1.5, 1.5],
);

const motor = new Motor(displayCanvas, [0, 0], [displayCanvas.width, displayCanvas.height])
const pidController = new PidController();

resetButton.onclick = () => {
	pidController.reset();
}

const checkBoxBox = document.getElementById("secondary-graph-options")
function makeDataPoint(name, color, titleName) {
	const checkBox = document.createElement("input");
	checkBox.type = "checkbox";
	checkBox.name = `${name.toLowerCase()}-graph-line`;
	checkBox.setAttribute("instant-title", `Show ${name}`);
	checkBox.title = `Show ${titleName ?? name} (${color})`;

	checkBox.style.color = color;

	otherGraph.createDataPoint(name.toLowerCase(), { color: color, thickness: 3, centerX: true, condition: () => checkBox.checked });
	checkBoxBox.appendChild(checkBox);
}


makeDataPoint("Output", "Green");
makeDataPoint("Error", "Red");
makeDataPoint("P", "Orange", "P Term Output");
makeDataPoint("I", "Olive", "I Term Output");
makeDataPoint("D", "Navy", "D Term Output");

setpointRotations.value = 0;

setpointDegrees.value = rotationsToDegrees(setpointRotations.value);
setpointDegrees.oninput = () => setpointRotations.value = degreesToRotations(setpointDegrees.value)

setpointRadians.value = rotationsToRadians(setpointRotations.value);
setpointRadians.oninput = () => setpointRotations.value = radiansToRotations(setpointRadians.value)

measuredPosition.value = motor.getPosition();
measuredPosition.oninput = () => motor.setPosition(Number(measuredPosition.value));

measuredVelocity.value = motor.getVelocity();
measuredVelocity.oninput = () => motor.setVelocity(Number(measuredVelocity.value));

measuredAcceleration.value = motor.getAcceleration();
measuredAcceleration.oninput = () => motor.setAcceleration(Number(measuredAcceleration.value));

measuredRotations.oninput = () => motor.setPosition(Number(measuredRotations.value));
measuredDegrees.oninput = () => motor.setPosition(degreesToRotations(Number(measuredDegrees.value)));
measuredRadians.oninput = () => motor.setPosition(radiansToRotations(Number(measuredRadians.value)));

resetButton.onclick = () => motor.reset()
 
const angleSelect = new AngleSelect(motor)
angleSelect.oninput = (value) => {
	if (motorConfig.isStationary) {
		setpointRotations.value = value;
	}
}
const positionSelect = new PositionSelect(motor)
positionSelect.oninput = (value) => {
	if (!motorConfig.isStationary) {
		setpointRotations.value = value;
	}
}

// main loop
setInterval(() => {
	const focusedElement = document.activeElement;

	const setpoint = setpointRotations.value;

	const [PIDOutput, [error, p, i, d]] = pidController.calculateWithResults(setpoint, motor.rotations);

	motor.setPower(PIDOutput);

	if (focusedElement !== measuredPosition) {
		measuredPosition.value = motor.getPosition();
	}
	if (focusedElement !== measuredVelocity) {
		measuredVelocity.value = motor.getVelocity();
	}
	if (focusedElement !== measuredAcceleration) {
		measuredAcceleration.value = motor.getAcceleration();
	}

	if (focusedElement !== measuredRotations) {
		measuredRotations.value = motor.getPosition();
	}

	if (focusedElement !== measuredDegrees) {
		measuredDegrees.value = rotationsToDegrees(motor.getPosition());
	}

	if (focusedElement !== measuredRadians) {
		measuredRadians.value = rotationsToRadians(motor.getPosition());
	}

	if (focusedElement !== setpointDegrees) {
		setpointDegrees.value = rotationsToDegrees(setpointRotations.value);
	}

	if (focusedElement !== setpointRadians) {
		setpointRadians.value = rotationsToRadians(setpointRotations.value);
	}

	if (focusedElement == setpointRotations || focusedElement == setpointDegrees || focusedElement == setpointRadians || (angleSelect.isSelected && motorConfig.isStationary) || (positionSelect.isSelected && !motorConfig.isStationary)) {
		motor.setSetpointLine(setpoint)
	}
	else {
		motor.setSetpointLine(undefined);
	}

	motor.update()
	motor.draw()

	otherGraph.updateData("error", error);
	otherGraph.updateData("output", p + i + d);
	otherGraph.updateData("p", p);
	otherGraph.updateData("i", i);
	otherGraph.updateData("d", d);

	otherGraph.draw()

	otherGraph.drawLine(otherGraph.cWidth / 2, 0, otherGraph.cWidth / 2, otherGraph.cHeight, { color: "black", thickness: 3 })

}, Math.floor(1000 / FPS))
