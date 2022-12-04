let lastMoved = undefined;
let zIndexeMax = 0;

document.querySelectorAll(".info-container-toggle").forEach((label, index) => {
	(() => {
		// add toggle
		const container = document.getElementById(label.getAttribute("for"));
		const infoContainer = container.querySelector(".info");

		toggle = () => {
			label.innerText = label.innerText === "<" ? ">" : "<";
			container.classList.toggle("hidden");
		};

		if (window.innerWidth < 800) toggle();

		label.onclick = toggle;
	})();

	(() => {
		// add dragging
		let isDown = false;
		let isInputing = false;
		let offset = 0;

		const startListener = ["mousedown", "touchstart"];
		const endListeners = ["mouseup", "touchend", "mouseleave"];

		infoContainer.querySelectorAll("input, select, option").forEach((element) => {
			startListener.forEach((eventType) => {
				element.addEventListener(eventType, (event) => {
					isInputing = true;
				});
			});
		});

		infoContainer.querySelectorAll("input, select, option").forEach((element) => {
			endListeners.forEach((eventType) => {
				element.addEventListener(eventType, (event) => {
					isInputing = false;
				});
			});
		});

		startListener.forEach((eventType) => {
			infoContainer.addEventListener(eventType, (event) => {
				if (!isInputing) {
					container.style.opacity = 0.7;
					label.style.opacity = 1;

					if (index !== lastMoved) {
						zIndexeMax++;
						lastMoved = index;
						container.style.zIndex = zIndexeMax;
					}

					isDown = true;
					offset = container.offsetTop - event.clientY;
				}
			});
		});

		endListeners.forEach((eventType) => {
			infoContainer.addEventListener(eventType, (event) => {
				isDown = false;

				container.style.opacity = 1;
			});
		});

		document.addEventListener("mousemove", (event) => {
			if (isDown) container.style.top = event.clientY + offset + "px";
		});
	})();
});
