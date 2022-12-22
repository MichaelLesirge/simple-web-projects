"use strict";
// 2 states fighting and waiting

// in waiting state: sliders are on and dragging is enabled.
// sliders inlcude Count, FPS, and speed

// in fighing state: sliders are disabled and figting starts
// entities follows target, if no target exsits runs away from enemy
// have peices move random amount between speed and 0 in each direction (for looks)
// move between 0 and width/height

const root = document.querySelector(':root');
const arena = document.querySelector(".arena");

const startBtn = document.querySelector("#start");
const resetBtn = document.querySelector("#reset");

const rock_emoji = "🪨";
const paper_emoji = "📃";
const scissors_emoji = "✂️";

function randInt(min, max) {
	// min and max included
	return Math.floor(Math.random() * (max - min + 1) + min);
}

const config = {
	speed: undefined,
	count: undefined,
	scale: undefined,
};

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

class Entity {
	constructor(type, x = undefined, y = undefined) {
		this.el = document.createElement("div");
		this.innerEl = document.createElement("span");
		this.el.appendChild(this.innerEl);

		this.el.classList.add("entity");

		this.setType(type);

		arena.appendChild(this.el);

		this.setPos(x ?? randInt(0, arena.offsetWidth - this.el.offsetWidth), y ?? randInt(0, arena.offsetHeight - this.el.offsetHeight));
	}

	setType(type) {
		this.type = type;
		this.innerEl.innerText = this.type.value;
	}

	setPos(x, y) {
		this.x = x;
		this.y = y;
		this.el.style.top = this.y + "px";
		this.el.style.left = this.x + "px";
	}

	changePos(xChange, yChange) {
		this.setPos(this.x + xChange, this.y + yChange);
	}
}

const entities = [];

makeSlider("speed", (v) => v && v / 10);
makeSlider("count", (v) => {
	while (entities.length < v) {
		const entity = new Entity(entity_types[entities.length % entity_types.length]);
		entities.push(entity);
	}
	while (entities.length > v) {
		const entity = entities.pop();
		entity.el.remove();
	}
	return entities.length;
});

makeSlider("scale", (v) => {
	v = v && v / 100
	root.style.setProperty("--icon-scale", v)
	return v
});

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
