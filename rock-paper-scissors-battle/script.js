"use strict";
// 2 states fighting and waiting

// in waiting state: sliders are on and dragging is enabled.
// sliders inlcude Count, FPS, and speed

// in fighing state: sliders are disabled and figting starts
// entities follows target, if no target exsits runs away from enemy
// have peices move random amount between speed and 0 in each direction (for looks)
// move between 0 and width/height

const rock_emoji = "🪨";
const paper_emoji = "📃";
const scissors_emoji = "✂️";

const slider_defaults = {
	speed: 20, 
	count: 50, 
	scale: 100, 
}

const config = {
	speed: undefined, // set by slider
	count: undefined, // set by slider
	scale: undefined, // set by slider
	
	randomExtraSpeed: 3,
	fps: 20,
	canSpreadCooldownStart: 5,
};

for (const [name, value] of Object.entries(slider_defaults)) {
	document.querySelector(`.slider-group.${name} .slider`).value = value;
}

const root = document.querySelector(":root");
const arena = document.querySelector(".arena");

const startBtn = document.querySelector("#start");
const resetBtn = document.querySelector("#reset");

function randInt(min, max) {
	// min and max included
	return Math.floor(Math.random() * (max - min + 1) + min);
}


const rock = {
	value: rock_emoji,
	chases: scissors_emoji,
	runsFrom: paper_emoji,
};
const paper = {
	value: paper_emoji,
	chases: rock_emoji,
	runsFrom: scissors_emoji,
};
const scissors = {
	value: scissors_emoji,
	chases: paper_emoji,
	runsFrom: rock_emoji,
};
const entity_types = [rock, paper, scissors];

const entities = [];

function isCollide(a, b) {
	return !(a.y + a.height < b.y || a.y > b.y + b.height || a.x + a.width < b.x || a.x > b.x + b.width);
}

function getDistance(a, b) {
	return Math.sqrt(Math.pow(a.centerX - b.centerX, 2) + Math.pow(a.centerY - b.centerY, 2));
}

class Entity {
	width = undefined;
	height = undefined;

	halfWidth = undefined;
	halfHeight = undefined;

	constructor(type, x = undefined, y = undefined) {
		this.el = document.createElement("div");
		this.innerEl = document.createElement("span");
		this.el.appendChild(this.innerEl);

		this.el.classList.add("entity");

		this.setType(type);

		arena.appendChild(this.el);

		this.canSpreadCooldown = 0;

		this.updateSizes();
		this.setPos(x ?? randInt(0, arena.offsetWidth - this.el.offsetWidth), y ?? randInt(0, arena.offsetHeight - this.el.offsetHeight));
	}

	updateSizes() {
		// I just wanted it to work at this point
		if (!(Entity.width && Entity.height && Entity.halfWidth && Entity.halfHeight)) {
			const elRect = this.el.getBoundingClientRect();
			Entity.width = elRect.width;
			Entity.height = elRect.height;
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
		this.innerEl.innerText = this.type.value;
	}

	setPos(x, y) {
		this.x = Math.max(Math.min(x, arena.offsetWidth-this.width), 0);
		this.y = Math.max(Math.min(y, arena.offsetHeight-this.height), 0);
		this.centerX = this.x + this.halfWidth;
		this.centerY = this.y + this.halfHeight;
		this.el.style.top = this.y + "px";
		this.el.style.left = this.x + "px";
	}

	changePos(xChange, yChange) {
		this.setPos(this.x + xChange, this.y + yChange);
	}

	move() {
		this.canSpreadCooldown = this.canSpreadCooldown && this.canSpreadCooldown-1;

		let minDistanceT = Infinity;
		let target = undefined;
		let minDistanceE = Infinity;
		let enemy = undefined;
		for (const otherEntity of entities) {
			if (otherEntity.type.value === this.type.chases) {
				if (otherEntity.canSpreadCooldown === 0) {
					const distance = getDistance(this, otherEntity);
					if (minDistanceT > distance) {
						target = otherEntity;
						minDistanceT = distance;
					}
				}
			} else if (otherEntity.type.value === this.type.runsFrom) {
				if (isCollide(this, otherEntity)) {
					this.setType(otherEntity.type);
					this.canSpreadCooldown = config.canSpreadCooldownStart;
				}
				const distance = getDistance(this, otherEntity);
				if (minDistanceE > distance) {
					enemy = otherEntity;
					minDistanceE = distance;
				}
			}
		}

		let xChange;
		let yChange;

		if (target) {
			xChange = target.centerX - this.centerX;
			yChange = target.centerY - this.centerY;
		} else if (enemy) {
			xChange = enemy.centerX + this.centerX;
			yChange = enemy.centerY + this.centerY;
		} else {
			xChange = 0
			yChange = 0
		}

		xChange = Math.max(Math.min(xChange, config.speed + randInt(-config.randomExtraSpeed, config.randomExtraSpeed)), -config.speed + randInt(-config.randomExtraSpeed, config.randomExtraSpeed));
		yChange = Math.max(Math.min(yChange, config.speed + randInt(-config.randomExtraSpeed, config.randomExtraSpeed)), -config.speed + randInt(-config.randomExtraSpeed, config.randomExtraSpeed));


		this.changePos(xChange, yChange);
	}
}

makeSlider("speed", (v) => v && v / 10);
makeSlider("scale", (v) => {
	v = v && v / 100;
	root.style.setProperty("--icon-scale", v);

	if (entities.length > 0) {
		Entity.width = undefined;
		Entity.height = undefined;
	}

	entities.forEach((entity) => entity.updateSizes());

	return v;
});

const setEntityCount = (v) => {
	while (entities.length < v) {
		const entity = new Entity(entity_types[entities.length % entity_types.length]);
		entities.push(entity);
	}
	while (entities.length > v) {
		const entity = entities.pop();
		entity.el.remove();
	}
	return entities.length;
};

makeSlider("count", setEntityCount);

let id;
resetBtn.onclick = () => {
	startBtn.disabled = false;

	if (id) clearInterval(id);

	setEntityCount(0);
	setEntityCount(config.count);
};

startBtn.onclick = () => {
	startBtn.disabled = true;

	id = setInterval(() => entities.forEach((entity) => entity.move()), 1000/config.fps);
};

function makeSlider(name, updateFunc) {
	const slider_gruop = document.querySelector(".slider-group." + name);
	const slider = slider_gruop.querySelector(".slider");
	const currentValDisplay = slider_gruop.querySelector(".current-val");
	function func() {
		const newVal = updateFunc(slider.value);
		config[name] = newVal;
		currentValDisplay.innerText = newVal;
	}
	slider.addEventListener("input", func);
	func();
}
