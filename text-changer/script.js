"use strict";

String.prototype.toCapitalized = function () {
	return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};

Array.prototype.shuffle = function () {
	return this.map(value => ({ value, sort: Math.random() }))
		.sort((a, b) => a.sort - b.sort)
		.map(({ value }) => value)
};

function matchCase(string, case_template_string) {
	if (string.length !== case_template_string.length) throw Error("strings did not match len");
	const stringArray = Array.from(string);
	for (let i = 0; i < stringArray.length; i++) {
		stringArray[i] = (case_template_string[i] === case_template_string[i].toLowerCase()) ? stringArray[i].toLowerCase() : stringArray[i].toUpperCase()
	}
	return stringArray.join("")
}

function randChar(startCharCode, stopCharCode) {
	return String.fromCharCode(Math.floor(Math.random() * (stopCharCode - startCharCode)) + startCharCode)
}

function curseText(text, amount) {
	return convertString(text, (char) => char + ([" ", "\n"].includes(char) ? "" : Array.from({ length: amount }, () => randChar(768, 879)).join("")))
}

function formatBinary(binary_str_array) {
	const bytes = []
	binary_str_array.forEach((binary) => {
		for (let i = 0; i < binary.length; i += 8) {
			const byte = binary.slice(i, i + 8).padStart(8, "0")
			bytes.push(byte)
		}
	})
	return bytes.join(" ")
}

function convertString(text, func, split_separator = "", join_separator = undefined) {
	return text.split(split_separator).map(func).join(join_separator ?? split_separator)
}

const converters = {
	"Case": {
		"Lower Case": (text) => text.toLowerCase(),
		"Upper Case": (text) => text.toUpperCase(),
		"Title Case": (text) => convertString(text, (word) => word.toCapitalized(), " "),
		"Random Case": (text) => convertString(text, (char) => Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase()),
	},
	"Code Style": {
		"Snake Case": (text) => text.replaceAll(" ", "_").toLowerCase(),
		"Screaming Snake Case": (text) => text.replaceAll(" ", "_").toUpperCase(),
		"Camel Case": (text) => convertString(text, (word, index) => (index === 0 ? word.toLowerCase() : word.toCapitalized()), " ", ""),
		"Pascal Case": (text) => convertString(text, (word) => word.toCapitalized(), " ", ""),
		"Kebab Case": (text) => text.replaceAll(" ", "-").toLowerCase(),
	},
	"Binary Encoding": {
		"ASCII": (text) => formatBinary(Array.from(text, (char) => char.charCodeAt().toString(2))),
		"Unicode UTF-8": (text) => formatBinary(Array.from(new TextEncoder().encode(text)).map((byte) => byte.toString(2))),
		"Unicode UTF-8": (text) => formatBinary(Array.from(new TextEncoder().encode(text)).map((byte) => byte.toString(2))),
	},
	"Unicode": {
		"Decimal": (text) => convertString(text, (char) => char.charCodeAt().toString(10), "", " "),
		"Code": (text) => convertString(text, (char) => "U+" + char.charCodeAt().toString(16).toUpperCase().padStart(4, "0"), "", " ")
	},
	"Glitched": {
		"Slightly Cursed": (text) => curseText(text, 5),
		"Medium Cursed": (text) => curseText(text, 25),
		"Very Cursed": (text) => curseText(text, 50),
	},
	"Reverse": {
		"Everything": (text) => Array.from(text).reverse().join(""),
		"Lettering": (text) => convertString(text, (word) => Array.from(word).reverse().join(""), " "),
		"Words": (text) => text.split(" ").reverse().join(" "),
	},
	"Sort": {
		"Everything": (text) => Array.from(text).sort().join(""),
		"Lettering": (text) => convertString(text, (word) => Array.from(word).sort().join(""), " "),
		"Words": (text) => text.split(" ").sort().join(" "),
	},
	"Shuffle": {
		"Everything": (text) => Array.from(text).shuffle().join(""),
		"Lettering": (text) => convertString(text, (word) => Array.from(word).shuffle().join(""), " "),
		"Words": (text) => text.split(" ").shuffle().join(" "),
	},
	"Meme": {
		"Leet Speak": (text) => {
			const leetConverter = { "e": "3", "t": "7", "i": "1", "o": "0", "a": "4", "s": "5", "g": "9", "l": "1", "z": "2", "b": "8" }
			return matchCase(convertString(text.toLowerCase().replaceAll("leet", "1337"), (char) => char in leetConverter && Math.random() < 0.75 ? leetConverter[char] : char), text)
		},
		"Cow": (text) => matchCase(convertString(text, (word) => convertString(word, (char, i) => i ? "o" : "m"), " "), text),
		"Among Us": (text) => convertString(text, (char) => [" ", "\n"].includes(char) ? char : Math.random() < 0.01 ? "ඞ්" : "ඞ"),
	},
	"Fancy": {
		"Circled": (text) => convertString(text, (char) => {
			let charCode = char.charCodeAt();
			if (/[1-9]/.test(char)) charCode += "①".charCodeAt() - "1".charCodeAt();
			if (/[0]/.test(char)) charCode = "⓪".charCodeAt();
			if (/[a-z]/.test(char)) charCode += "ⓐ".charCodeAt() - ("a".charCodeAt());
			if (/[A-Z]/.test(char)) charCode += "Ⓐ".charCodeAt() - ("A".charCodeAt());
			return String.fromCharCode(charCode);
		}),
	},
	"Script Numbers": {
		"Superscript": (text) => convertString(text, (char) => {
			const superscriptMap = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
			return superscriptMap[char] || char;
		}),
		"Subscript": (text) => convertString(text, (char) => {
			const subscriptMap = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' };
			return subscriptMap[char] || char;
		})
	},
};

const inputBox = document.querySelector("#input");
const outputBox = document.querySelector("#output");

const allControls = document.querySelector("form.all-controls");
const controlGroupsContainer = allControls.querySelector("#control-groups");
const conversionsSeriesElement = allControls.querySelector("#conversions");

let usedConversions = [];

for (const [sectionName, sectionItems] of Object.entries(converters)) {
	const sectionElement = document.createElement("div");
	sectionElement.classList.add("control-group");

	const sectionTitleElement = document.createElement("h3");
	sectionTitleElement.innerText = sectionName;
	sectionElement.appendChild(sectionTitleElement);

	const choiceList = document.createElement("ul");
	sectionElement.appendChild(choiceList)

	for (const [itemName, converter] of [["Default", (text) => text], ...Object.entries(sectionItems)]) {

		const optionListItemElement = document.createElement("li");

		const labelElement = document.createElement("label");
		labelElement.innerText = itemName;
		labelElement.title = converter(itemName);
		labelElement.setAttribute("for", sectionName + " " + itemName);
		optionListItemElement.appendChild(labelElement)

		const inputElement = document.createElement("input");
		inputElement.id = sectionName + " " + itemName;
		inputElement.name = sectionName;
		inputElement.type = "radio";
		labelElement.appendChild(inputElement)

		if (itemName === "Default") {
			inputElement.setAttribute("checked", true);
		}

		inputElement.addEventListener("input", (event) => {
			usedConversions = usedConversions.filter((f) => Object.values(sectionItems).indexOf(f) === -1);
			if (itemName !== "Default") usedConversions.push(converter);
		})

		choiceList.appendChild(optionListItemElement);
	}

	controlGroupsContainer.appendChild(sectionElement);
}

function applyFunctionPipeline(input, funcs) {
	return funcs.reduce((prev, func) => func(prev), input)
}

function displayFunctionPipeline(funcs, separator = "→") {
	return ["Input", ...funcs.map((f) => f.name), "Output"].join(" " + separator + " ")
}

function updateDisplay() {
	outputBox.value = applyFunctionPipeline(inputBox.value, usedConversions);
	conversionsSeriesElement.innerText = displayFunctionPipeline(usedConversions)
}

updateDisplay()
allControls.addEventListener("change", updateDisplay);

inputBox.addEventListener("input", (event) => outputBox.value = applyFunctionPipeline(inputBox.value, usedConversions));

function createControlButton(id, func) {
	const btn = document.getElementById(id)
	btn.addEventListener("click", func)
	btn.addEventListener("click", updateDisplay)
}

createControlButton("reset-button", (event) => usedConversions = []);
createControlButton("clear-button", (event) => inputBox.value = "");
createControlButton("swap-button", (event) => inputBox.value = outputBox.value);
createControlButton("copy-button", (event) => {
	outputBox.select();
	outputBox.setSelectionRange(0, outputBox.value.length);

	navigator.clipboard.writeText(outputBox.value);
});