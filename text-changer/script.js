"use strict";

String.prototype.toCapitalized = function toCapitalized() {
	return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};

const converters = {
	"Case": {
		"UPPER CASE": (text) => text.toUpperCase(),
		"lower case": (text) => text.toLocaleLowerCase(),
		"Title case": (text) => text.toCapitalized(),
	},
	"Code Style": {
		"snake_case": (text) => text.replaceAll(" ", "_").toLowerCase(),
		"SCREAMING_SNAKE_CASE": (text) => text.replaceAll(" ", "_").toUpperCase(),
		"camelCase": (text) => text.split(" ").map((word, index) => (index === 0 ? word.toLocaleLowerCase() : word.toCapitalized())).join(""),
		"PascalCase": (text) => text.split(" ").map((word) => word.toCapitalized()).join(""),
	},
	"Binary Encoding": {
		"UTF-8": (text) => {
			const encoder = new TextEncoder();
			const encodedText = encoder.encode(text);
			return Array.from(encodedText)
				.map((byte) => byte.toString(2))
				.join(" ");
		},
		"ASCII": (text) => {
			let binary = "";
			for (let i = 0; i < text.length; i++) {
				const charCode = text.charCodeAt(i);
				binary += charCode.toString(2).padStart(8, "0") + " ";
			}
			return binary.trim();
		},
		"Unicode": (text) => {
			const codePoints = Array.from(text).map((char) => char.charCodeAt(0));
			return codePoints.join(" ");
		},
	},
	"Cursed": {
		"Low": (text) => text,
		"Meduim": (text) => text,
		"High": (text) => text,
	},
	"Direction": {
		"Reverse": (text) => text.split().reverse().join(""),
	},
};

const inputBox = document.querySelector("#input");
const outputBox = document.querySelector("#output");

const controlGroupsContainer = document.querySelector("#control-groups");

let usedConversions = [];

function updateBox(event) {
	let text = inputBox.value;
	for (const converter of usedConversions) {
		text = converter(text);
	}
	outputBox.value = text;
}

for (const [sectionName, sectionItems] of Object.entries(converters)) {
	const sectionElement = document.createElement("div");
    sectionElement.classList.add("control-group");

    const sectionTitleElement = document.createElement("h3");
    sectionTitleElement.innerText = sectionName;
    sectionElement.appendChild(sectionTitleElement);

    for (const [itemName, converter] of [["Default", (text) => text], ...Object.entries(sectionItems)]) {
		
		const labelElement = document.createElement("label");
        labelElement.innerText = itemName
        labelElement.setAttribute("for", sectionName +  " " + itemName);

        const inputElement = document.createElement("input");
        inputElement.id = sectionName +  " " + itemName;
		inputElement.name = sectionName;
        inputElement.type = "radio"
        labelElement.appendChild(inputElement)
		
		if (itemName === "Default") {
			inputElement.setAttribute("checked", true)
		}

        inputElement.addEventListener("input", (event) => {
			usedConversions = usedConversions.filter((e) => Object.values(sectionItems).indexOf(e) === -1);
			usedConversions.push(converter);
			console.log(usedConversions)
		})

		inputElement.addEventListener("change", updateBox)

        sectionElement.appendChild(labelElement)
    }

    controlGroupsContainer.appendChild(sectionElement);
}


inputBox.addEventListener("input", updateBox)