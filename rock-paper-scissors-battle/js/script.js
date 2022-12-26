"use strict";

const SLIDER_DEFAULTS = {
	speed: 20,
	count: 35,
	scale: 100,
};

for (const [name, value] of Object.entries(SLIDER_DEFAULTS)) {
	document.querySelector(`.slider-group.${name} .slider`).value = value;
}

const sliderVals = {
	speed: undefined, // set by slider
	count: undefined, // set by slider
	scale: undefined, // set by slider
};

const CONFIG = {
	randomExtraSpeed: 0.8,
	fps: 20,
	canSpreadCooldownStart: 3,

	bloodLust: 2,
	maxScareDistance: 300,

	nearExtinctThreshold: 3,
	nearExtinctSpeedMultipler: 1.5,
	nearExtinctBloodLustMultiply: 1.1,

	speedDifAmount: 0.1,
};
console.info("CONFIG object is aviable to change and will update in real time");
console.info(CONFIG);

const root = document.querySelector(":root");
const arena = document.querySelector(".arena");

const startBtn = document.querySelector("#start");
const resetBtn = document.querySelector("#reset");

function randInt(min, max) {
	// min and max included
	return Math.floor(Math.random() * (max - min + 1) + min);
}

const rock = {
	value: "rock",
	chases: "scissors",
	runsFrom: "paper",

	icon: '<svg width="100%" height="100%" enable-background="new 0 0 128 128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><linearGradient id="a" gradientUnits="userSpaceOnUse" x1="87.6156" x2="41.5479" y1="21.0395" y2="138.0836"><stop offset="0" stop-color="#9e958e"/><stop offset=".4597" stop-color="#8e8884"/><stop offset="1" stop-color="#757575"/></linearGradient><linearGradient id="b" gradientUnits="userSpaceOnUse" x1="8.8588" x2="47.1713" y1="120.1374" y2="77.5362"><stop offset="0" stop-color="#37474f"/><stop offset=".6122" stop-color="#42565f" stop-opacity=".1915"/><stop offset=".7573" stop-color="#455a64" stop-opacity="0"/></linearGradient><linearGradient id="c" gradientUnits="userSpaceOnUse" x1="99.5535" x2="74.7781" y1="66.7018" y2="11.7455"><stop offset="0" stop-color="#9e958e"/><stop offset=".4415" stop-color="#aea298"/><stop offset="1" stop-color="#c9b8a9"/></linearGradient><linearGradient id="d"><stop offset=".000380609" stop-color="#4c5c64"/><stop offset="1" stop-color="#455a64" stop-opacity="0"/></linearGradient><linearGradient id="e" gradientUnits="userSpaceOnUse" x1="37.5017" x2="47.5017" xlink:href="#d" y1="104.5447" y2="50.2947"/><linearGradient id="f" gradientUnits="userSpaceOnUse" x1="41.7319" x2="70.7821" xlink:href="#d" y1="20.4163" y2="20.4163"/><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="87.2609" x2="121.616" y1="76.6067" y2="90.7666"><stop offset="0" stop-color="#9e958e"/><stop offset=".25" stop-color="#aea298"/><stop offset=".5662" stop-color="#c9b8a9"/></linearGradient><linearGradient id="h" gradientUnits="userSpaceOnUse" x1="104.646" x2="97.6055" y1="123.3574" y2="95.5867"><stop offset="0" stop-color="#37474f"/><stop offset=".8085" stop-color="#42565f" stop-opacity=".1915"/><stop offset="1" stop-color="#455a64" stop-opacity="0"/></linearGradient><path d="m8.93 90.74c-.53-1.25-1.04-2.5-1.54-3.75-3.77-9.51.96-18.09 5.18-26.49l6.12-12.16c1.23-2.45 3.12-4.51 5.44-5.95l17.6-10.92 17.39-17.98c1.08-1.12 2.46-1.91 3.97-2.27l11.84-2.86c5.73-1.37 8.19-1.15 10.04 1.48 6.41 9.1 10.7 16.59 16.41 25.66 3.11 4.94 10.29 16.29 10.74 17.04 1.38 2.32.82 4.26.77 6.92-.12 6.13.96 12.29 3.2 18 .67 1.7 1.44 3.38 1.79 5.17.32 1.61-.11 11.84-.44 15.3-.27 2.81-6.91 13.3-9.29 14.57-2.62 1.4-22.04 8.54-26.33 9.76s-22.89-3.03-32.55-4.51c-5.97-.91-11.95-1.83-17.92-2.74-5.18-.79-10.33-.19-13.23-5.42-3.41-6.12-6.47-12.41-9.19-18.85z" fill="url(#a)"/><path d="m31.34 115c5.97.91 11.95 1.83 17.92 2.74 3.11.48 7.15 1.24 11.34 2.02-2.82-3.34-7.03-7.3-9.85-10.64-.61-.72-1.23-1.47-1.45-2.39-.23-.98.03-1.99.3-2.96.86-3.18 1.08-6.63 1.94-9.81-5.33 1.24-17.61 3.6-18.62 3.31-1.12-.32-2.03-1.13-2.9-1.92-6.33-5.78-11.28-11.61-16.12-18.66-.57-.83-1.15-1.69-1.36-2.68-.2-.93-.05-1.89.1-2.82.36-2.32 1.16-8.75 1.8-14.42l-1.88 3.73c-4.21 8.4-8.94 16.98-5.16 26.49.5 1.26 1.01 2.51 1.54 3.75 2.71 6.44 5.78 12.73 9.17 18.83 2.89 5.24 8.05 4.64 13.23 5.43z" fill="url(#b)"/><path d="m85.05 9.95c-1.23-1.45-3.63-1.17-6.15 1.13l-9.06 9.06c-.56.56-.86 1.33-.81 2.12l.97 18.5c.03.62.26 1.2.66 1.67 3.22 3.76 14.6 21.83 17.9 21.83 3.29 0 9.04-12.82 11.97-12.75.5.01 3.11.17 5.66.95 2.38.72 3.31-2.55 2.82-4.87-2.46-3.9-5.77-9.13-7.63-12.09-5.69-9.03-9.97-16.5-16.33-25.55z" fill="url(#c)"/><path d="m42.89 46.37c3.33-.5 14.44-2.39 16.53-3.21 4.08-1.61 7.68-8.47 10.06-12.16 0 0 .82 12.03 0 16.73-.57 3.27-2.72 20.37-4.88 24.47l-13.06 21.76c-6.4-6.4-12.79-12.79-19.19-19.19-1.63-1.63-2.67-2.49-3.26-4.8-1.35-5.28-3.8-13.07-3.81-17.66s12.36-5.16 17.61-5.94z" fill="url(#e)"/><path d="m67.16 20.74c-1.28-1.53-1.64-3.7-1.2-5.64.37-1.62 3.73-4.75 4.82-5.74l-7.69 1.86c-1.51.37-2.89 1.15-3.97 2.27l-17.39 17.98s16.84-7.02 25.43-10.73z" fill="url(#f)"/><path d="m116.08 77.46c-1.68-4.28-2.71-8.81-3.06-13.39-5.74 3.93-8.95 9.03-18.19 10.28-2.45.33-6.24.79-8.63 1.42-2.96.78-5.7 2.97-10.14 3.38-3.16.3-11.13.07-9.93 1.85s8.35 5.37 10.13 6.82c2.53 2.03 4.73 4.42 6.84 6.88 1.1 1.29 2.75 4.42 4.67 5.27.49.22 1.01.28 1.53.12.91-.27 1.64-.93 2.35-1.56 6.87-6.09 14.64-11.17 22.97-15.02.89-.41 1.85-.87 2.29-1.75.19-.39.27-.92.28-1.49-.35-.94-.74-1.87-1.11-2.81z" fill="url(#g)"/><path d="m117.87 82.63c-.13-.65-.32-1.29-.54-1.92-.17.59-.54 1.24-1.34 1.85-2.3 1.76-11.17 4.47-20.93 13.02-6.37 5.58-6.38 6.33-7.75 12.48-2.24 10.07-5.8 13.73-6.48 14.35.37-.04.7-.09.97-.17 4.3-1.21 23.71-8.36 26.33-9.76 2.38-1.27 9.02-11.76 9.29-14.57.34-3.44.77-13.67.45-15.28z" fill="url(#h)"/></svg>',
};
const paper = {
	value: "paper",
	chases: "rock",
	runsFrom: "scissors",

	icon: '<svg width="100%" height="100%" fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><g stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m6 22h12c1.1046 0 2-.8954 2-2v-10.17157c0-.53044-.2107-1.03914-.5858-1.41422l-5.8284-5.82842c-.3751-.37508-.8838-.58579-1.4142-.58579h-6.1716c-1.10457 0-2 .89543-2 2v16c0 1.1046.89543 2 2 2z"/><path d="m13 2.5v6.5h6"/><path d="m8 17h7"/><path d="m8 13h7"/><path d="m8 9h1"/></g></svg>',
};
const scissors = {
	value: "scissors",
	chases: "paper",
	runsFrom: "rock",

	icon: '<svg width="100%" height="100%" enable-background="new 0 0 512 512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="m151.373 136.805 55.838-27.427 155.876 317.348c12.691 25.838 3.108 56.823-21.316 71.17-1.93 1.134-4.417.439-5.441-1.552z" fill="#b9c5c6"/><path d="m180.542 502.578c-1.011 2.084-3.57 2.87-5.591 1.739-24.664-13.801-34.92-44.492-22.861-70.577l148.355-320.933 56.469 26.103z" fill="#dce2e2"/><path d="m472.622 59.043c-6.593-22.32-21.255-39.712-41.285-48.971-9.808-4.534-20.308-6.833-31.21-6.833-33.268 0-64.61 21.299-79.848 54.263-1.102 2.384-2.078 4.79-2.974 7.207l-47.997 103.828c-2.034 4.401-2.237 9.431-.563 13.981 1.674 4.551 5.086 8.251 9.487 10.286l35.179 16.262c2.429 1.122 5.048 1.687 7.672 1.687 2.133 0 4.271-.373 6.311-1.124 4.551-1.673 8.25-5.086 10.285-9.488l13.735-29.712c1.528.844 3.081 1.656 4.687 2.398 9.808 4.533 20.308 6.832 31.21 6.832 33.268 0 64.609-21.299 79.847-54.262 9.861-21.332 11.802-44.897 5.464-66.354zm-38.656 51.013c-9.135 19.762-27.885 33.039-46.655 33.039-5.565 0-10.903-1.163-15.867-3.458-16.86-7.794-25.554-26.964-23.376-47.377 1.317-7.114 3.816-15.207 8.029-24.319.074-.16.127-.325.196-.486 9.837-16.748 26.827-27.648 43.836-27.648 5.565 0 10.903 1.163 15.867 3.458 10.336 4.778 17.992 14.061 21.56 26.138 3.821 12.94 2.547 27.378-3.59 40.653z" fill="#ff473e"/><path d="m241.449 164.018-50.434-102.679c-.952-2.392-1.983-4.771-3.139-7.125-15.631-31.824-46.758-52.387-79.3-52.387-11.544 0-22.594 2.552-32.844 7.586-40.042 19.669-54.887 71.768-33.093 116.139 15.631 31.823 46.758 52.387 79.299 52.387h.001c11.543 0 22.594-2.552 32.843-7.586 1.588-.78 3.122-1.629 4.63-2.508l14.431 29.38c3.178 6.47 9.671 10.227 16.424 10.227 2.706 0 5.454-.604 8.046-1.877l34.785-17.085c4.352-2.138 7.677-5.917 9.243-10.506 1.567-4.591 1.245-9.614-.892-13.966zm-119.51-22.645c-18.705 0-36.949-12.539-46.479-31.942-12.905-26.273-5.551-56.417 16.394-67.197 5.189-2.549 10.815-3.841 16.723-3.841 16.916 0 33.455 10.257 43.513 26.571.08.175.142.354.227.529 4.426 9.011 7.115 17.044 8.599 24.125 2.658 20.356-5.581 39.724-22.254 47.914-5.189 2.549-10.816 3.841-16.723 3.841z" fill="#ff473e"/><path d="m263.09 296.862c-10.502 3.862-22.146-1.521-26.008-12.023s1.521-22.146 12.023-26.008 22.146 1.521 26.008 12.023-1.521 22.146-12.023 26.008z" fill="#b9c5c6"/></svg>',
};
const entity_types = [rock, paper, scissors];

const entities = [];

// function isCollide(a, b) {
// 	return !(a.y + a.height < b.y || a.y > b.y + b.height || a.x + a.width < b.x || a.x > b.x + b.width);
// }

function getDistance(a, b) {
	return Math.sqrt(Math.pow(a.centerX - b.centerX, 2) + Math.pow(a.centerY - b.centerY, 2));
}

class Entity {
	// TODO fix dragging in game by slowing speed
	width = undefined;
	height = undefined;

	halfWidth = undefined;
	halfHeight = undefined;

	constructor(type, speedMultiplyer = 1, x = undefined, y = undefined) {
		this.speedMultiplyer = speedMultiplyer;
		this.curSpeedMultplyer = 1;

		this.el = document.createElement("div");
		this.el.classList.add("entity");
		this.setType(type);

		arena.appendChild(this.el);

		this.canSpreadCooldown = CONFIG.canSpreadCooldownStart;

		this.updateSizes();
		this.setPos(x ?? randInt(0, arena.offsetWidth - this.el.offsetWidth), y ?? randInt(0, arena.offsetHeight - this.el.offsetHeight));
	}

	updateSizes() {
		if (!(Entity.width && Entity.height && Entity.halfWidth && Entity.halfHeight)) {
			Entity.width = this.el.offsetWidth;
			Entity.height = this.el.offsetHeight;
			Entity.halfWidth = Entity.width / 2;
			Entity.halfHeight = Entity.height / 2;
		}
		this.width = Entity.width;
		this.height = Entity.height;
		this.halfWidth = Entity.halfWidth;
		this.halfHeight = Entity.halfHeight;
	}

	setType(type) {
		this.type = type;

		this.el.innerHTML = type.icon;
	}

	setPos(x, y) {
		this.x = Math.max(Math.min(x, arena.offsetWidth - this.width), 0);
		this.y = Math.max(Math.min(y, arena.offsetHeight - this.height), 0);
		this.centerX = this.x + this.halfWidth;
		this.centerY = this.y + this.halfHeight;
		this.el.style.top = this.y + "px";
		this.el.style.left = this.x + "px";
	}

	changePos(xChange, yChange) {
		this.setPos(this.x + xChange, this.y + yChange);
	}

	move() {
		this.canSpreadCooldown = this.canSpreadCooldown && this.canSpreadCooldown - 1;
		let minDistanceTarget = Infinity;
		let target = undefined;

		let minDistanceEnemy = Infinity;
		let enemy = undefined;

		let friendlyCount = 0;

		for (const otherEntity of entities) {
			if (otherEntity.type.value === this.type.chases) {
				const distance = getDistance(this, otherEntity);
				if (minDistanceTarget > distance) {
					target = otherEntity;
					minDistanceTarget = distance;
				}
			} else if (otherEntity.type.value === this.type.runsFrom) {
				const distance = getDistance(this, otherEntity);
				if (otherEntity.canSpreadCooldown === 0) {
					if (distance < 30 * sliderVals.scale) {
						this.setType(otherEntity.type);
						this.canSpreadCooldown = CONFIG.canSpreadCooldownStart;
					}
				}
				if (minDistanceEnemy > distance) {
					enemy = otherEntity;
					minDistanceEnemy = distance;
				}
			} else {
				friendlyCount++;
			}
		}

		let xChange;
		let yChange;

		let nearExtinct = friendlyCount <= CONFIG.nearExtinctThreshold;

		if (target && (!enemy || minDistanceEnemy > minDistanceTarget / (CONFIG.bloodLust * (nearExtinct ? CONFIG.nearExtinctBloodLustMultiply : 1)))) {
			xChange = target.centerX - this.centerX;
			yChange = target.centerY - this.centerY;
		} else if (enemy && minDistanceEnemy < CONFIG.maxScareDistance) {
			xChange = (enemy.centerX - this.centerX) * -1;
			yChange = (enemy.centerY - this.centerY) * -1;
		} else {
			xChange = randInt(-CONFIG.randomExtraSpeed, CONFIG.randomExtraSpeed);
			yChange = randInt(-CONFIG.randomExtraSpeed, CONFIG.randomExtraSpeed);
			this.el.style.border = "";
		}

		if (nearExtinct) {
			xChange = Math.max(Math.min(xChange * CONFIG.nearExtinctSpeedMultipler, sliderVals.speed * CONFIG.nearExtinctSpeedMultipler), -sliderVals.speed * CONFIG.nearExtinctSpeedMultipler);
			yChange = Math.max(Math.min(yChange * CONFIG.nearExtinctSpeedMultipler, sliderVals.speed * CONFIG.nearExtinctSpeedMultipler), -sliderVals.speed * CONFIG.nearExtinctSpeedMultipler);
		} else {
			xChange = Math.max(
				Math.min(xChange, sliderVals.speed + randInt(-CONFIG.randomExtraSpeed, CONFIG.randomExtraSpeed)),
				-sliderVals.speed + randInt(-CONFIG.randomExtraSpeed, CONFIG.randomExtraSpeed)
			);
			yChange = Math.max(
				Math.min(yChange, sliderVals.speed + randInt(-CONFIG.randomExtraSpeed, CONFIG.randomExtraSpeed)),
				-sliderVals.speed + randInt(-CONFIG.randomExtraSpeed, CONFIG.randomExtraSpeed)
			);
		}

		this.changePos(xChange * this.speedMultiplyer * this.curSpeedMultplyer, yChange * this.speedMultiplyer * this.curSpeedMultplyer);
	}
}

(() => {
	makeSlider("speed", setSpeed);
	makeSlider("count", setEntityCount);
	makeSlider("scale", setScale);

	function setSpeed(v) {
		return v && v / 10;
	}

	function setEntityCount(v) {
		while (entities.length < v) {
			const entity = new Entity(entity_types[entities.length % entity_types.length], 1 + (Math.random() - 0.5) * CONFIG.speedDifAmount);
			entities.push(entity);
		}
		while (entities.length > v) {
			const entity = entities.pop();
			entity.el.remove();
		}
		return entities.length;
	}

	function setScale(v) {
		v = v && v / 100;
		root.style.setProperty("--icon-scale", v);

		if (entities.length > 0) {
			Entity.width = undefined;
			Entity.height = undefined;
		}

		entities.forEach((entity) => entity.updateSizes());

		return v;
	}
	function makeSlider(name, updateFunc) {
		const slider_gruop = document.querySelector(".slider-group." + name);
		const slider = slider_gruop.querySelector(".slider");
		const currentValDisplay = slider_gruop.querySelector(".current-val");
		function func() {
			const newVal = updateFunc(slider.value);
			sliderVals[name] = newVal;
			currentValDisplay.innerText = newVal;
		}
		slider.addEventListener("input", func);
		func();
	}

	let gameInveralId;
	resetBtn.onclick = () => {
		startBtn.disabled = false;

		if (gameInveralId) clearInterval(gameInveralId);

		setEntityCount(0);
		setEntityCount(sliderVals.count);
	};

	startBtn.onclick = () => {
		startBtn.disabled = true;

		// arena.requestFullscreen();

		gameInveralId = setInterval(() => entities.forEach((entity) => entity.move()), 1000 / CONFIG.fps);
	};
})();

(() => {
	let isDown = false;

	let current;
	let curYoffset;
	let curXoffset;

	// arena.addEventListener("touchstart", dragStart, false);
	// arena.addEventListener("touchend", dragEnd, false);
	// arena.addEventListener("touchmove", drag, false);

	arena.addEventListener("mousedown", dragStart, false);
	arena.addEventListener("mouseup", dragEnd, false);
	arena.addEventListener("mousemove", drag, false);

	function dragStart(e) {
		const item = e || e.touches[0];

		if (!(current && (current.el.contains(item.target) || current.el === item.target))) {
			entities.forEach((entity) => {
				if (entity.el.contains(item.target) || entity.el === item.target) {
					current = entity;
					return;
				}
			});

			if (current) {
				const arenaRech = arena.getBoundingClientRect();
				curXoffset = -arenaRech.x - current.halfWidth;
				curYoffset = -arenaRech.y - current.halfHeight;

				current.curSpeedMultplyer = 0.001;
			}
		}

		if (current) {
			isDown = true;
		}
	}

	function dragEnd(e) {
		current.curSpeedMultplyer = 1;
		isDown = false;
	}

	function drag(e) {
		if (isDown) {
			current.setPos(e.clientX + curXoffset, e.clientY + curYoffset);
		}
	}
})();
