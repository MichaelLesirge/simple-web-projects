let lastMoved = undefined;
let zIndexeMax = 0;

document.querySelectorAll(".info-container").forEach((container, index) => {
	const infoContainer = container.querySelector(".info");
	
	// add toggle
	(() => {
		const label = container.querySelector(".info-container-toggle")

		toggle = () => {
			label.innerText = label.innerText === "<" ? ">" : "<";
			container.classList.toggle("hidden");
		};

		if (window.innerWidth < 800) toggle();

		label.onclick = toggle;
	})();

	// add dragging
	(() => {
		const statSectionTitle = infoContainer.querySelector(".stat-section-title");

		let isDown = false;
		let offset = 0;

		statSectionTitle.style.cursor = "grab";
		
		const startGrab = (event) => {
			isDown = true;
			
			container.style.opacity = 0.7;
			
			
			if (index !== lastMoved) {
				zIndexeMax++;
				lastMoved = index;
				container.style.zIndex = zIndexeMax;
			}
			
			offset = container.offsetTop - event.clientY;
			
			statSectionTitle.style.cursor = "grabbing";
			container.style.cursor = "grabbing";
		};
		
		const endGrab = (event) => {
			isDown = false;
			
			container.style.opacity = 1;
			
			statSectionTitle.style.cursor = "grab";
			container.style.cursor = "";
		};

		["mouseup", "touchend"].forEach((eventType) => {
			statSectionTitle.addEventListener(eventType, endGrab);
		});

		["mousedown", "touchstart"].forEach((eventType) => {
			statSectionTitle.addEventListener(eventType, startGrab)
		});

		const containerRect = container.getBoundingClientRect();
		document.addEventListener("mousemove", (event) => {
			if (isDown) {
				if (containerRect.x > event.clientX) {
					endGrab();
				}

				let newTop = event.clientY + offset
				if (newTop < 0) {
					newTop = 1
					endGrab()
				}

				else if (newTop + containerRect.height > document.documentElement.clientHeight) {
					newTop = document.documentElement.clientHeight - containerRect.height
					endGrab()
				}

				container.style.top = newTop + "px";
			}
		});
	})();
});
