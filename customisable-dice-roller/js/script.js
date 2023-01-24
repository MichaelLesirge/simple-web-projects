"use strict";

// set up sidebar info containers
let lastMoved = undefined;
let zIndexeMax = 0;
document.querySelectorAll(".info-container").forEach((container, index) => {
	const containerRect = container.getBoundingClientRect();
	const infoContainer = container.querySelector(".info");

	// add toggle
	const label = container.querySelector(".info-container-toggle");

	function toggle() {
		label.innerText = label.innerText === "<" ? ">" : "<";
		container.classList.toggle("hidden");
	}

	if (window.innerWidth < 800) toggle();

	label.onclick = toggle;

	// add dragging
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
			zIndexeMax++;
			lastMoved = index;
			container.style.zIndex = zIndexeMax;
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
});

// add dice
const form = document.querySelector(".create-dice");
form.addEventListener("submit", (event) => {
	event.preventDefault();
});

document.querySelectorAll("input.num-only").forEach((clearInput) => {
	clearInput.addEventListener("keypress", (event) => {
		if (!/\d/.test(event.key)) {
			event.preventDefault()
			return false;
		}
	})
})

// TODO make clear-input not overflow by shrinking font