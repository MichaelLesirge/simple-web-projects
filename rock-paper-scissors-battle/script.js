"use strict";

const rock_emoji = "🪨";
const paper_emoji = "📃";
const scissors_emoji = "✂️";

const slider_defaults = {
	speed: 20,
	count: 35,
	scale: 100,
};

const CONFIG = {
	speed: undefined, // set by slider
	count: undefined, // set by slider
	scale: undefined, // set by slider

	randomExtraSpeed: 1,
	fps: 20,
	canSpreadCooldownStart: 10,

	showDebugIndicator: false,

	bloodLust: 2,
	maxScareDistance: 300,

	nearExtinctThreshold: 3,
	nearExtinctSpeedMultipler: 1.5,
	nearExtinctBloodLustMultiply: 2,
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

// function isCollide(a, b) {
// 	return !(a.y + a.height < b.y || a.y > b.y + b.height || a.x + a.width < b.x || a.x > b.x + b.width);
// }

function isCollide(a, b) {
	return getDistance(a, b) < 30 * CONFIG.scale;
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
		this.innerEl.innerText = this.type.value;
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
				if (otherEntity.canSpreadCooldown === 0) {
					if (isCollide(this, otherEntity)) {
						this.setType(otherEntity.type);
						this.canSpreadCooldown = CONFIG.canSpreadCooldownStart;
					}
				}
				const distance = getDistance(this, otherEntity);
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

		if (target && (!enemy || minDistanceEnemy > (minDistanceTarget / (CONFIG.bloodLust * (nearExtinct ? CONFIG.nearExtinctBloodLustMultiply : 1))))) {
			xChange = target.centerX - this.centerX;
			yChange = target.centerY - this.centerY;
			if (CONFIG.showDebugIndicator) this.el.style.border = "1px solid green";
		} else if (enemy && minDistanceEnemy < CONFIG.maxScareDistance) {
			xChange = (enemy.centerX - this.centerX) * -1;
			yChange = (enemy.centerY - this.centerY) * -1;
			if (CONFIG.showDebugIndicator) this.el.style.border = "1px solid red";
		} else {
			xChange = randInt(-CONFIG.randomExtraSpeed, CONFIG.randomExtraSpeed);
			yChange = randInt(-CONFIG.randomExtraSpeed, CONFIG.randomExtraSpeed);
			this.el.style.border = "";
		}

		if (nearExtinct) {
			xChange = Math.max(
				Math.min(xChange * CONFIG.nearExtinctSpeedMultipler, (CONFIG.speed * CONFIG.nearExtinctSpeedMultipler * 2)),
				(-CONFIG.speed * CONFIG.nearExtinctSpeedMultipler * 2)
			)
			yChange = Math.max(
				Math.min(yChange * CONFIG.nearExtinctSpeedMultipler, CONFIG.speed * CONFIG.nearExtinctSpeedMultipler),
				-CONFIG.speed * CONFIG.nearExtinctSpeedMultipler
			)
		} else {
			xChange = Math.max(
				Math.min(xChange, CONFIG.speed + randInt(-CONFIG.randomExtraSpeed, CONFIG.randomExtraSpeed)),
				-CONFIG.speed + randInt(-CONFIG.randomExtraSpeed, CONFIG.randomExtraSpeed)
			);
			yChange = Math.max(
				Math.min(yChange, CONFIG.speed + randInt(-CONFIG.randomExtraSpeed, CONFIG.randomExtraSpeed)),
				-CONFIG.speed + randInt(-CONFIG.randomExtraSpeed, CONFIG.randomExtraSpeed)
			);
		}

		this.changePos(xChange, yChange);
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
			const entity = new Entity(entity_types[entities.length % entity_types.length]);
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
			CONFIG[name] = newVal;
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
		setEntityCount(CONFIG.count);
	};
	
	startBtn.onclick = () => {
		startBtn.disabled = true;

		// arena.requestFullscreen();
	
		gameInveralId = setInterval(() => entities.forEach((entity) => entity.move()), 1000 / CONFIG.fps);
	};	
})();

(() => {
	let titleVals = entity_types.map((e) => e.value);
	setInterval(() => {
		document.title = "Rock Paper Scissors Battle Royal " + titleVals.join("");
		titleVals.unshift(titleVals.pop());
	}, 1000);
})();

(() => {
	let active = false;
	let last = undefined;

	let cur;
	let curYoffset;
	let curXoffset;

	arena.addEventListener("touchstart", dragStart, false);
	arena.addEventListener("touchend", dragEnd, false);
	arena.addEventListener("touchmove", drag, false);

	arena.addEventListener("mousedown", dragStart, false);
	arena.addEventListener("mouseup", dragEnd, false);
	arena.addEventListener("mousemove", drag, false);

	function dragStart(e) {
		const item = e || e.touches[0];

		if (item.target.parentElement.classList.contains("entity")) {
			active = true;

			entities.forEach((entity) => {
				if (item.target === entity.innerEl) {
					cur = entity;
					return
				}
			});
			const arenaRech = arena.getBoundingClientRect();
			curXoffset = -arenaRech.x - cur.halfWidth
			curYoffset = -arenaRech.y - cur.halfHeight

			cur.el.style.cursor = "grabbing"
		}

	}

	function dragEnd(e) {
		if (cur) cur.el.style.cursor = "";
		active = false;
	}

	function drag(e) {
		if (active) {
			e.preventDefault();

			const item = e || e.touches[0];

			cur.setPos(e.clientX + curXoffset, e.clientY + curYoffset)
			
			last = item.target;
		}
	}
})();
