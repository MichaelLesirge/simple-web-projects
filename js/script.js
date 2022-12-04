let lastMoved = undefined;
let zIndexeMax = 0;

document.querySelectorAll(".info-container-toggle").forEach((label, index) => {
	const container = document.getElementById(label.getAttribute("for"));
	const infoContainer = container.querySelector(".info");

	// add toggle
	(() => {
		toggle = () => {
			label.innerText = label.innerText === "<" ? ">" : "<";
			container.classList.toggle("hidden");
		};

		if (window.innerWidth < 800) toggle();

		label.onclick = toggle;
	})();

	// add dragging
	(() => {
		let isDown = false;
		let offset = 0;

		const statSectionTitle = infoContainer.querySelector(".stat-section-title")

		const startListener = ["mousedown", "touchstart"];
		const endListeners = ["mouseup", "touchend"];
		// const endListeners = ["mouseup", "touchend", "mouseleave"];

		statSectionTitle.style.cursor = "grab";

		startListener.forEach((eventType) => {
			statSectionTitle.addEventListener(eventType, (event) => {
				container.style.opacity = 0.7;

				statSectionTitle.style.cursor = "grabbing";
				container.style.cursor = "grabbing";

				label.style.opacity = 1;

				if (index !== lastMoved) {
					zIndexeMax++;
					lastMoved = index;
					container.style.zIndex = zIndexeMax;
				}

				isDown = true;
				offset = container.offsetTop - event.clientY;
			});
		});

		const endGrab = () => {
			isDown = false;
			statSectionTitle.style.cursor = "grab";
			container.style.cursor = ""

			container.style.opacity = 1;

			let containerRect = container.getBoundingClientRect();
			
			console.log("start y:", containerRect.y)
			if (containerRect.y <= 0) {
				console.log(Math.trunc(containerRect.height))
				container.style.top = Math.trunc(containerRect.height) + "px";
			}
			else if (false) {
				container.style.top = "0px";
			}
			containerRect = container.getBoundingClientRect();
			console.log("end y:  ", containerRect.y)
		};

		endListeners.forEach((eventType) => {
			statSectionTitle.addEventListener(eventType, endGrab)
		});

		
		const containerRect = container.getBoundingClientRect();
		document.addEventListener("mousemove", (event) => {
			if (isDown) {
				if (containerRect.x > event.clientX) {
					endGrab();
				}
				container.style.top = event.clientY + offset + "px";
			}
		});
	})();
});
