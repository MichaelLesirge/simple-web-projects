let z = 1;

document.querySelectorAll(".info-container-toggle").forEach((label) => {
	// add toggle
	const container = document.getElementById(label.getAttribute("for"));
	const infoContainer = container.querySelector(".info");

	toggle = () => {
		label.innerText = label.innerText === "<" ? ">" : "<";
		container.classList.toggle("hidden");
	};

	if (window.innerWidth < 800) toggle();

	label.onclick = toggle;

	// add dragging
	let isDown = false;
	let offset = 0;

	const startListener = ["mousedown", "touchstart"];
	const endListeners = ["mouseup", "touchend", "mouseleave"];

	startListener.forEach((eventType) => {
		infoContainer.addEventListener(eventType, (event) => {
			container.style.opacity = 0.7;
			label.style.opacity = "1 !important";

			container.style.zIndex = z;
			z++;

			isDown = true;
			offset = container.offsetTop - event.clientY;
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
});
