"use stric";

String.prototype.toCapitalized = function toCapitalized() {
	return this.charAt(0).toUpperCase() + this.slice(1);
};

const converters = {
	"Case": {
		"Upper": (text) => text.toUpperCase(),
		"Lower": (text) => text.toLocaleLowerCase(),
		"Title": (text) => text.toCapitalized(),
	},
	"Code Style": {
		"snake_case": (text) => text.replace(" ", "_").toLowerCase(),
		"SCREAMING_SNAKE_CASE": (text) => text.replace(" ", "_").toUpperCase(),
		"camelCase": (text) => {
			const words = text.split(" ");
			const camelCaseWords = words.map((word, index) => {
				if (index === 0) {
					return word.toLowerCase();
				}
				return word.capitlise();
			});
			return camelCaseWords.join("");
		},
		"PascalCase": (text) => {
			const words = text.split(" ");
			const pascalCaseWords = words.map((word) => word.capitlise());
			return pascalCaseWords.join("");
		},
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

// create all inputs and labels from object. add to list on click and remove on unclick of check
// make slider-input pair for cursedness level and text rotation
// each section is raidual

const inputBox = document.querySelector("#input");
const outputBox = document.querySelector("#input");

const controlGroupsContainer = document.querySelector("#control-groups");

const usedConversions = []

for (const [sectionName, sectionItems] of Object.entries(converters)) {
	const section = document.createElement("div");
    section.classList.add("control-group");

    const sectionTitle = document.createElement("h3");
    sectionTitle.innerText = sectionName;
    section.appendChild(sectionTitle);

    for (const [itemName, itemConverter] of Object.entries(sectionItems)) {
        const controlItem = document.createElement("form");
        controlItem.classList.add("control-item")

        const label = document.createElement("label");
        label.innerText = itemName
        label.setAttribute("for", itemName);
        controlItem.appendChild(label)
        
        const input = document.createElement("input");
        input.id = input.name = itemName;
        input.type = "radio"
        controlItem.appendChild(input)

        input.addEventListener("change", (e) => {
            
        })

        input.addEventListener("click", (e) => {
            console.log(e.target.checked)
            if (e.target.checked) {
                e.target.checked = false;
            }
        })

        section.appendChild(controlItem)
    }

    controlGroupsContainer.appendChild(section);
}
