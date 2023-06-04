"use strict";

(() => {
	// counter
	const counterButton = document.getElementById("counter");
	counterButton.innerText = 0;

	const color = [100, 0, 0];
	let startAt = 0;
	let i = 0;
	let offset = 0;

	let changeBy = 5;

	addHeldEventListener(counterButton, () => {
		counterButton.innerText++;
		counterButton.style.background = `rgb(${color.join(", ")})`;

		const curIndex = offset % color.length;

		color[curIndex] += changeBy;

		if (color[curIndex] >= 255 || color[curIndex] <= 0) {
			offset++;
			i++;
			if (i >= color.length) {
				offset = startAt;
				i = 0;
				changeBy *= -1;
				if (changeBy < 0) {
					startAt++;
				}
			}
		}
	});

	const RepeatDelayMs = 500;
	const repeatRateMs = 33;
	function addHeldEventListener(btn, func) {
		let id;
		["mousedown", "touchstart"].forEach((eventType) => {
			btn.addEventListener(eventType, (event) => {
				event.stopPropagation();
				func();
				const startTime = new Date().getTime();
				let last = false;
				id = setInterval(() => {
					if (btn.disabled) clearInterval(id);
					if (last || startTime + RepeatDelayMs < new Date().getTime()) {
						last = true;
						func();
					}
				}, repeatRateMs);
			});
		});

		["mouseup", "touchend", "mouseleave"].forEach((eventTyple) => {
			btn.addEventListener(eventTyple, (event) => clearInterval(id));
		});
	}
})();

