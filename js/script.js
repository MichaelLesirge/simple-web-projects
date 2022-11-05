const infoBarToggleButton = document.querySelector(".info-container-toggle")
const infoBar = document.querySelector(".info-container")

toggle = () => {
	infoBarToggleButton.innerText = infoBarToggleButton.innerText === "<" ? ">" : "<"
	infoBar.classList.toggle("hidden")
}

infoBarToggleButton.onclick = toggle;

if (window.innerWidth < 800) toggle()