"use strict";

function charRange(startChar, stopChar) {
	return Array.from({ length: stopChar.charCodeAt() - startChar.charCodeAt() + 1 }, (_, i) =>
		String.fromCharCode(i + startChar.charCodeAt())
	).join("");
}

function randChars(charSet, length) {
	return Array.from({ length: length }, () => charSet[Math.floor(Math.random() * charSet.length)]).join("");
}

const randCharsLen = 8;

function createElementFromHTML(htmlString) {
	const tempDiv = document.createElement("div");
	tempDiv.innerHTML = htmlString.trim();
	return tempDiv.firstChild;
}

const randomCharSetLetters = charRange("a", "z") + charRange("A", "Z");
const message = `I am using ${window.location.hostname} for a good reason. ${randChars(randomCharSetLetters, randCharsLen)}`;

const htmlPopup = createElementFromHTML(`
	<div id="whyblocker-popup-main-body-unique-1000" style="color: black; position: fixed; top: 0px; left: 0px; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;">
		<div style="background-color: white; padding: 1rem; text-align: center; width: 50%; aspect-ratio: 1.61803 / 1; display: flex; flex-direction: column; justify-content: space-around; align-items: center; outline: auto;">
			<h1>WhyBlocker: Why are you doing this?</h1>
			<h3>Why are you on this website? Are you doing something productive on it? Have you done your daily <ahref="https://leetcode.com/problemset/all/">LeetCode</ahref=>?</h3>
			<h2 class="message-whyblocker-popup">
				<!--You really tried to get around it by using inspect? How clever. -->
				Please type <span dir="rtl" style="color: red; unicode-bidi:bidi-override; white-space:nowrap;">"${message.split("").reverse().join("")}"</span> to continue
			</h2>
			<textarea class="text-area-whyblocker-popup" rows="10" cols="32" placeholder="Enter message to continue" required=""></textarea>
			<button class="submit-whyblocker-popup">Submit</button>
		</div>
	</div>
`);

const messageBody = htmlPopup.querySelector(".message-whyblocker-popup");
messageBody.oncopy = () => {
	alert("No copy for you!");
	return false;
};
messageBody.oncut = () => {
	alert("No cut for you!");
	return false;
};

const inputBox = htmlPopup.querySelector(".text-area-whyblocker-popup");
inputBox.onpaste = () => {
	alert("No paste for you!");
	return false;
};
inputBox.ondrop = () => {
	alert("No drag for you!");
	return false;
};

htmlPopup.querySelector(".submit-whyblocker-popup").addEventListener("click", function (event) {
	event.preventDefault();
	const inputMessage = inputBox.value.trim();
	if (inputMessage === message) {
		htmlPopup.remove();
	} else {
		alert("Invalid input or incorrect code. Please try again.");
	}
});

document.body.appendChild(htmlPopup);
