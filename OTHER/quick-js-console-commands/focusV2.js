const messages = [
	"Get back to your work",
	"Stop slacking off",
	"Don't get distracted",
	"You ran this thing for a reason, do your work",
	"Don't get side tracked",
	"Don't procrastinate",
	"Stay on task",
];

const timeout = 60 * 2 * 1000;

let lastMoveTime = new Date();

let count = 0;

const special = ['zeroth','first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth'];
const deca = ['twent', 'thirt', 'fort', 'fift', 'sixt', 'sevent', 'eight', 'ninet'];

function stringifyNumber(n) {
	if (n < 20) return special[n];
	if (n % 10 === 0) return deca[Math.floor(n / 10) - 2] + "ieth";
	return deca[Math.floor(n / 10) - 2] + "y-" + special[n % 10];
}

function randomChoice(array) {
	return array[Math.floor(Math.random() * array.length)];
}

function sayRandomMessage() {
	count++;
	const randMessage = randomChoice(messages);
	window.speechSynthesis.speak(new SpeechSynthesisUtterance(`For the ${stringifyNumber(count)} time, ` + randMessage));
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
