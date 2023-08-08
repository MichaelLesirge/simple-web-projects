"use strict";

function sum(array, m = (v) => v) {
	return array.map(m).reduce((a, b) => (a + b))
}

class Dice {
	constructor(min, max) {
		this.min = min;
		this.max = max;
		this.range_len = max-min+1;
		this.range = Array.from({length: this.range_len}, (_, i) => i + min);

		this.average = (max + min) / 2;
	}
}

const dice = [new Dice(1, 6), new Dice(1, 6)]
console.log(sum(dice, d => d.average))

// --- set up sidebar info containers ---
let lastMoved = undefined;
let zIndexMax = 0;
document.querySelectorAll(".info-container").forEach((container, index) => {
	const containerRect = container.getBoundingClientRect();
	const infoContainer = container.querySelector(".info");

	// add toggle
	{
		const label = container.querySelector(".info-container-toggle");
		label.addEventListener("click", toggle);

		const showArrow = "<";
		const hideArrow = ">";
	
		const showMessage = "show stats";
		const hideMessage = "hide stats";
	
		label.innerText = hideArrow;
		label.title = hideMessage;	
	
		function toggle() {
			label.innerText = label.innerText === hideArrow ? showArrow : hideArrow;
			label.title = label.title === showMessage ? hideMessage : showMessage;
			container.classList.toggle("hidden");
		}
	
		// todo just start it hidden
		if (window.innerWidth < 800) toggle();
	}

	// add dragging
	{
		const statSectionTitle = infoContainer.querySelector(".stat-section-title");
	
		let isDown = false;
		let offset = 0;
	
		statSectionTitle.addEventListener("touchstart", dragStart, false);
		statSectionTitle.addEventListener("touchend", dragEnd, false);
		document.addEventListener("touchmove", drag, false);
	
		statSectionTitle.addEventListener("mousedown", dragStart, false);
		statSectionTitle.addEventListener("mouseup", dragEnd, false);
		document.addEventListener("mousemove", drag, false);
	
		function dragStart(event) {
			isDown = true;
			container.classList.add("grabbed");
	
			if (index !== lastMoved) {
				zIndexMax++;
				lastMoved = index;
				container.style.zIndex = zIndexMax;
			}
	
			offset = container.offsetTop - event.clientY;
		}
	
		function dragEnd(event) {
			isDown = false;
			container.classList.remove("grabbed");
		}
	
		const titleRect = statSectionTitle.getBoundingClientRect();
		const titleLeft = titleRect.x;
		const titleRight = titleRect.x + titleRect.width;
	
		function drag(event) {
			if (isDown) {
				if (event.clientX < titleLeft || event.clientX > titleRight) {
					dragEnd();
				}
	
				let newTop = event.clientY + offset;
				if (newTop < 0) {
					newTop = 1;
					dragEnd();
				} else if (newTop + containerRect.height > document.documentElement.clientHeight) {
					newTop = document.documentElement.clientHeight - containerRect.height;
					dragEnd();
				}
	
				container.style.top = newTop + "px";
			}
		}

	}
});

// -- add new dice ---
const form = document.querySelector(".create-dice");
form.addEventListener("submit", (event) => {
	event.preventDefault();
	
});

// --- class="num-only" ---
document.querySelectorAll("input.num-only").forEach((input) => {
	// TODO if deselected with no text set to default
	input.addEventListener("keypress", (event) => {
		if (!/[\d-]/.test(event.key)) {
			event.preventDefault();
			return false;
		}
	});
});

// --- class="value-title---" ---
document.querySelectorAll("select.value-title").forEach((select) => {
	const update = () => {
		let selected_option = null
		select.querySelectorAll("option").forEach((child) => {
			if (child.value === select.value) selected_option = child;
		})
		if (selected_option) select.title = selected_option.title;
	}
	
	select.addEventListener("change", update)
	update()
})

// TODO make clear-input not overflow by shrinking font

// --- dice input color change ---

const formDice = form.querySelector("#input-dice");
const inputDiceColor = formDice.querySelector("#dice-color");

inputDiceColor.addEventListener("input", (event) => {
	formDice.style.setProperty("--color", event.target.value);
});
