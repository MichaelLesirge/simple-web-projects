"use strict";

function charRange(startChar, stopChar) {
	return Array.from({ length: stopChar.charCodeAt() - startChar.charCodeAt() + 1 }, (_, i) =>
		String.fromCharCode(i + startChar.charCodeAt())
	).join("");
}

function randChars(charSet, length) {
	return Array.from({ length: length }, () => charSet[Math.floor(Math.random() * charSet.length)]).join("");
}

const timesBypassed = (localStorage.getItem("whyblock-bypassed-addon-count") ?? 0)

const randCharsLen = 8;

const randomCharSetLetters = charRange("a", "z") + charRange("A", "Z");
const message = `I am using ${window.location.hostname} for a good reason. ${randChars(randomCharSetLetters, randCharsLen + timesBypassed)}`;

// Create a container element for the popup
const popupContainer = document.createElement("div");
popupContainer.style.color = "black";
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
popupTitle.innerHTML = "WhyBlocker: Why are you doing this?";
const popupParagraph1 = document.createElement("h3");
const popupParagraph2 = document.createElement("h2");
popupParagraph1.innerHTML = `Why are you on this website? Are you doing something productive on it? Have you done your daily <a href="https://leetcode.com/problemset/all/">LeetCode</a>?`;;
popupParagraph2.oncopy = () => {alert("No copy for you!"); return false;}
popupParagraph2.oncut = () => {alert("No cut for you!"); return false;}
const revserseMessage = message.split("").reverse().join(""); // reverse message to prevent copy and past from html
popupParagraph2.innerHTML = `<!--You really tried to get around it by using inspect? How clever. -->
Please type <span dir="rtl" style="color: red; unicode-bidi:bidi-override;">"${revserseMessage}"</span> to continue`;

// Create the input box
const inputBox = document.createElement("textarea");
inputBox.rows = 10;
inputBox.cols = 32;
inputBox.onpaste = () => {alert("No paste for you!"); return false;}
inputBox.ondrop = () => {alert("No drag for you!"); return false;}
inputBox.placeholder = "Enter message to continue";
inputBox.required = true;

// Create a button to submit the form
const submitButton = document.createElement("button");
submitButton.textContent = "Submit";
submitButton.addEventListener("click", function (event) {
	event.preventDefault();
	const inputMessage = inputBox.value.trim();
	if (inputMessage === message) {
		localStorage.setItem("whyblock-bypassed-addon-count", timesBypassed + 1)
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
popupContent.appendChild(inputBox);
popupContent.appendChild(submitButton);
popupContainer.appendChild(popupContent);

// Append the popup container to the body of the current page
document.body.appendChild(popupContainer);