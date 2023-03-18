const messages = [
	"Get back to your work",
	"Stop slacking off",
	"Don't get distracted",
	"You ran this thing for a reason, do your work",
	"Don't get side tracked",
	"Don't procrastinate",
	"Stay on task",
];

const messageUtterances = messages.map((message) => new SpeechSynthesisUtterance(message));

const timeout = 60 * 2 * 1000;

let lastMoveTime = new Date();

function randomChoice(array) {
	return array[Math.floor(Math.random() * array.length)];
}

function sayRandomMessage() {
	const randMessageUtterance = randomChoice(messageUtterances);
	window.speechSynthesis.speak(randMessageUtterance);
	console.log(randMessageUtterance.text);
}

function isPageHidden() {
	return document.visibilityState === "hidden";
}

window.addEventListener("visibilitychange", (event) => {
	if (isPageHidden()) sayRandomMessage();
});

let intervalId;
["mousemove", "keydown", "click"].forEach((lictenerType) => {
	window.addEventListener(lictenerType, (event) => {
        clearInterval(intervalId);
		intervalId = setInterval(sayRandomMessage, timeout);
	});
});
