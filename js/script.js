let z = 1

document.querySelectorAll(".info-container-toggle").forEach(label => {
	const infoConainer = document.getElementById(label.getAttribute("for"))

	toggle = () => {
		label.innerText = label.innerText === "<" ? ">" : "<"
		infoConainer.classList.toggle("hidden")
	}

	if (window.innerWidth < 800) toggle()

	label.onclick = toggle;

	let isDown = false;
	let offset = 0

	infoConainer.addEventListener("mousedown", (event) => {
		infoConainer.style.opacity = 0.7
		infoConainer.style.zIndex = z

		z++;

		isDown = true;
		offset = infoConainer.offsetTop - event.clientY
	})

	infoConainer.addEventListener("mouseup", (event) => {
		isDown = false;

		infoConainer.style.zIndex = 1
		infoConainer.style.opacity = 1
	})

	document.addEventListener("mousemove", (event) => {
		if (isDown) infoConainer.style.top  = (event.clientY + offset) + 'px'
	})

})