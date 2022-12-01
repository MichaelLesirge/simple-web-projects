document.querySelectorAll(".info-container-toggle").forEach(el => {
	const labelFor = document.getElementById(el.getAttribute("for"))

	toggle = () => {
		el.innerText = el.innerText === "<" ? ">" : "<"
		labelFor.classList.toggle("hidden")
	}

	if (window.innerWidth < 800) toggle()

	el.onclick = toggle;

})