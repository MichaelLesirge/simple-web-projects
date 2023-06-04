"use strict";

function charRange(startChar, stopChar) {
	return Array.from({ length: stopChar.charCodeAt() - startChar.charCodeAt() + 1 }, (_, i) =>
		String.fromCharCode(i + startChar.charCodeAt())
	).join("");
}

function randChars(charSet, length) {
	return Array.from({ length: length }, () => charSet[Math.floor(Math.random() * charSet.length)]).join("");
}

const randCharsLen = 8

const randomCharSetLetters = charRange("a", "z") + charRange("A", "Z");
const messageWhy = `Why are you on this website? Are you doing something productive on it? Have you done your daily LeetCode?`;
const message = `I am using ${window.location.hostname} for a good reason. ${randChars(randomCharSetLetters, randCharsLen)}`;

// Create a container element for the popup
const popupContainer = document.createElement("div");
popupContainer.style.color = "black"
popupContainer.style.position = "fixed";
popupContainer.style.top = "0";
popupContainer.style.left = "0";
popupContainer.style.width = "100vw";
popupContainer.style.height = "100vh";
popupContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
popupContainer.style.display = "flex";
popupContainer.style.justifyContent = "center";
popupContainer.style.alignItems = "center";
popupContainer.style.zIndex = "9999";

// Create the popup content
const popupContent = document.createElement("div");
popupContent.style.backgroundColor = "white";
popupContent.style.padding = "1rem";
popupContent.style.textAlign = "center";
popupContent.style.width = "50%";
popupContent.style.aspectRatio = 1.61803398875;
popupContent.style.display = "flex";
popupContent.style.flexDirection = "column";
popupContent.style.justifyContent = "space-around";
popupContent.style.alignItems = "center";
popupContent.style.outline = "auto";

// Create the large text element
const popupTitle = document.createElement("h1");
popupTitle.textContent = "WhyBlocker: Why are you doing this?";
const popupParagraph1 = document.createElement("h3");
popupParagraph1.style.userSelect = "none";
const popupParagraph2 = document.createElement("h2");
popupParagraph1.textContent = messageWhy;
popupParagraph2.style.userSelect = "none";
popupParagraph2.innerHTML = `Please type <span style="color: red;">"${message}"</span> to continue`;

// Create the input box
const form = document.createElement("form");
const inputBox = document.createElement("textarea");
inputBox.rows = 10;
inputBox.cols = 32;
inputBox.placeholder = "Enter message to continue";
inputBox.required = true;
form.appendChild(inputBox);

// Create a button to submit the form
const submitButton = document.createElement("button");
// submitButton.style.width = '10rem'
submitButton.textContent = "Submit";
submitButton.addEventListener("click", function (event) {
	event.preventDefault();
	const inputMessage = inputBox.value.trim();
	if (inputMessage === message) {
		popupContainer.remove();
	} else {
		// Invalid input or incorrect code
		alert("Invalid input or incorrect code. Please try again.");
	}
});

// Append elements to the popup container
popupContent.appendChild(popupTitle);
popupContent.appendChild(popupParagraph1);
popupContent.appendChild(popupParagraph2);
popupContent.appendChild(form);
popupContent.appendChild(submitButton);
popupContainer.appendChild(popupContent);

// Append the popup container to the body of the current page
document.body.appendChild(popupContainer);
