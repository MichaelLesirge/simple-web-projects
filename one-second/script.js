let runStartTime = null;
let pastTime = 0;

const timerDisplay = document.getElementById("timer");
const startButton = document.getElementById("start");
const resetButton = document.getElementById("reset");
const scoreDisplay = document.getElementById("score");

const settings = {
	winMilliseconds: 1000,
	advStats: false,
	oneTouchMode: true,
};

const urlParams = new URLSearchParams(window.location.search);

if (urlParams.has("ms")) {
	settings.winMilliseconds = parseInt(urlParams.get("ms"));
}
if (urlParams.has("s")) {
	settings.advStats = urlParams.get("s") === "true";
}
if (urlParams.has("t")) {
	settings.oneTouchMode = urlParams.get("t") === "true";
}

console.table(settings);

function millisToText(milliseconds) {
	const centiseconds = Math.floor(milliseconds / 10) % 100;
	const seconds = Math.floor(milliseconds / 1000) % 60;
	const minutes = Math.floor(milliseconds / 60000);

	return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
}

function update() {
	const milliseconds = (runStartTime === null ? 0 : Date.now() - runStartTime) + pastTime;

	timerDisplay.textContent = millisToText(milliseconds);

	requestAnimationFrame(update);
}

function createConfetti() {
	for (let i = 0; i < 100; i++) {
		const confetti = document.createElement("div");
		confetti.className = "confetti";
		confetti.style.backgroundColor = `hsl(${Math.random() * 360}deg, 100%, 50%)`;
		confetti.style.top = `${Math.random() * 50}vw`;
		confetti.style.left = `${Math.random() * 100}vw`;
		confetti.style.animation = `fall ${Math.random() * 3 + 2}s linear`;
		document.body.appendChild(confetti);

		setTimeout(() => confetti.remove(), 2000);
	}
}

function toggleStart() {
	if (runStartTime === null) {
		runStartTime = Date.now();
		startButton.textContent = "Stop";
		startButton.classList.add("stop");
	} else {
		pastTime += Date.now() - runStartTime;
		runStartTime = null;

		startButton.textContent = "Start";
		startButton.classList.remove("stop");

		update();
		checkWin();
	}
}

function checkWin() {
	if (timerDisplay.textContent === millisToText(settings.winMilliseconds)) {
		addWin();
		updateWinsDisplay();
		createConfetti();
	}
}

const winsTotalKey = "winsTotal";
function addWin() {
	localStorage.setItem(winsTotalKey, (parseInt(localStorage.getItem(winsTotalKey)) || 0) + 1);
}

function updateWinsDisplay() {
	if (settings.advStats) {
	} else {
		scoreDisplay.textContent = `Wins: ${localStorage.getItem(winsTotalKey) || 0}`;
	}
}

updateWinsDisplay();

function reset() {
	runStartTime = null;
	pastTime = 0;

	startButton.textContent = "Start";
	startButton.classList.remove("stop");
}

startButton.addEventListener("click", toggleStart);
resetButton.addEventListener("click", reset);

if (settings.oneTouchMode) {
	const tapAction = (event) => {
		if (event.target === startButton || event.target === resetButton) {
			return;
		}
		if (timerDisplay.textContent === millisToText(0)) {
			toggleStart();
		} else if (runStartTime !== null) {
			toggleStart();
		} else {
			reset();
		}
		event.preventDefault();
	};
	// document.addEventListener("touchstart", tapAction);
	document.addEventListener("mousedown", tapAction);
}

document.addEventListener("keydown", (event) => {
	if (event.key === " ") {
		event.preventDefault();
		toggleStart();
	}
	if (event.key === "r" || event.key === "enter") {
		event.preventDefault();
		reset();
	}
});

update();
