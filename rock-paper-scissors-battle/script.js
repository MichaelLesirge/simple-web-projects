"use strict";

const arena = document.querySelector(".arena");

const startAmount = 20;

const rock_emoji = "🪨";
const paper_emoji = "📃";
const scissors_emoji = "✂️";

function randInt(min, max) {
	// min and max included
	return Math.floor(Math.random() * (max - min + 1) + min);
}

let speed;
(() => {
	const speedSlider = document.querySelector("#speed-slider");
	const currentSpeedDisplay = document.querySelector("#current-speed");

	const setSpeed = (newSpeed) => {
		speed = newSpeed && newSpeed / 10;
		currentSpeedDisplay.innerText = speed;
	};
	setSpeed(speedSlider.value);

	speedSlider.addEventListener("input", (e) => setSpeed(e.target.value));
})();

(
	// 2 states, draggable state and fighting state
	// must change all locs on resize
	// follows target, if no target exsits runs away from enemy

	() => {
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
				this.el = document.createElement("span");
				this.el.classList.add("entity");

				this.setType(type);
                
				arena.appendChild(this.el);

				this.setPos(x ?? randInt(0, arena.offsetWidth - this.el.offsetWidth), y ?? randInt(0, arena.offsetHeight - this.el.offsetHeight));
			}

			setType(type) {
				this.type = type;
				this.el.innerText = this.type.value;
			}

			setPos(x, y) {
				this.x = x;
				this.y = y;
				this.el.style.top = (this.y) + "px";
				this.el.style.left = (this.x) + "px";
			}
		}

		const entities = [];
		for (const type of entity_types) {
			for (let i = 0; i < startAmount; i++) {
				entities.push(new Entity(type));
			}
		}

        console.log(entities)
	}
)();
