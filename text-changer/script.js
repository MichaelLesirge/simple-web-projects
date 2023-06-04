"use strict";

String.prototype.toCapitalized = function toCapitalized() {
	return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};

const converters = {
	"Case": {
		"Upper Case": (text) => text.toUpperCase(),
		"Lower Case": (text) => text.toLocaleLowerCase(),
		"Title Case": (text) => text.split(" ").map((word) => word.toCapitalized()).join(" "),
		"Random Case": (text) => text.split("").map((char) => Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase()).join(""),
	},
	"Code Style": {
		"Snake Case": (text) => text.replaceAll(" ", "_").toLowerCase(),
		"Screaming Snake Case": (text) => text.replaceAll(" ", "_").toUpperCase(),
		"Camel Case": (text) => text.split(" ").map((word, index) => (index === 0 ? word.toLocaleLowerCase() : word.toCapitalized())).join(""),
		"Pascal Case": (text) => text.split(" ").map((word) => word.toCapitalized()).join(""),
	},
	"Binary Encoding": {
		"ASCII": (text) => Array.from(text).map((char) => char.charCodeAt(0).toString(2).padStart(8, "0")).join(" "),
		"Unicode UTF-8": (text) => Array.from(new TextEncoder().encode(text)).map((byte) => byte.toString(2)).join(" "),
	},
	"Unicode": {
		"Decimal": (text) => Array.from(text).map((char) => char.charCodeAt(0).toString(10)).join(" "),
		"Code": (text) => Array.from(text).map((char) => "U+" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")).join(" ")
	},
	"Cursed": {
		"Low": (text) => text,
		"Meduim": (text) => text,
		"High": (text) => text,
	},
	"Direction": {
		"Reverse": (text) => text.split("").reverse().join(""),
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
        labelElement.innerText = itemName;
		labelElement.title = converter(itemName);
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