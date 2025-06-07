import { numToRoman, romanToNum, toRulesWriting } from "./roman_conversion.js";
import { numToWord } from "./english_conversion.js";

setAllowedChars("decimal-input", /\d/);
enforceMaxLength("decimal-input");
setAllowedChars("numeral-input", /[A-Za-z'̱̄̅̇̇]/);

const defaultRules = {
	lowercase: false,

	zero: true,
	combined: false,

	mode: "standard", // standard, apostrophus, or vinculum

	specialCharters: true,
};

const maxNumbers = {
	standard: 3999,
	apostrophus: 399999,
	vinculum: 3999999999,
};

const decimalInput = document.getElementById("decimal");
const numeralInput = document.getElementById("numeral");

const numeralCorrect = document.getElementById("numeral-correct");
// const numeralInfo = document.getElementById("numeral-info")

const wordDisplay = document.getElementById("english");

const startingWords = wordDisplay.innerText;

const explanationBox = document.getElementById("explanation-box");

const lowercaseCheck = document.getElementById("lowercase");
const specialCheck = document.getElementById("special-charters");
const combinedCheck = document.getElementById("combined-charters");
const modeSelect = document.getElementById("numeral-system");

function setInfoDisplay(numeralsPlaces, value) {
	explanationBox.innerHTML = "";

	numeralsPlaces.forEach((numeral, index) => {
		if (numeral) {
			explanationBox.innerHTML += `
            <div class="card">
                <div class="card-numeral">
                    ${numeral}
                </div>
                <div class="card-number">
                    ${
						(value[index] == 0 && value != 0 ? 1 : numeralsPlaces.length == 1 ? value : value[index]) +
						"0".repeat(numeralsPlaces.length - index - 1)
					}
                </div>
            </div>`;
		}
	});
}

function makeRules() {
	return {
		...defaultRules,
		lowercase: lowercaseCheck.checked,
		specialCharters: specialCheck.checked,
		combined: combinedCheck.checked,
		mode: modeSelect.value,
	};
}

function update() {
	if (decimalInput.value) {
		const value = Number.parseInt(decimalInput.value);

		const rules = makeRules();

		console.log(rules.mode, value);

		if (value > maxNumbers[rules.mode]) {
			numeralCorrect.innerText = `Invalid numeral, must be ${maxNumbers[rules.mode]} or lower for ${rules.mode} mode`;
		} else if (value < 1) {
			numeralCorrect.innerText = "Invalid numeral, must be 1 or higher";
		} else {
			numeralCorrect.innerText = "Valid Numeral";
		}

		const [numeral, numeralsPlace] = numToRoman(value, rules);
		setInfoDisplay(numeralsPlace, value.toString());
		numeralInput.value = numeral;
		wordDisplay.innerText = numToWord(value, true);
		console.log(numeralsPlace);
	} else {
		wordDisplay.innerText = startingWords;
		setInfoDisplay([]);
		numeralInput.value = "";
		numeralCorrect.innerText = "Valid Numeral";
	}
}

decimalInput.addEventListener("input", update);
lowercaseCheck.addEventListener("change", update);
specialCheck.addEventListener("change", update);
combinedCheck.addEventListener("change", update);
modeSelect.addEventListener("change", update);

modeSelect.addEventListener("change", (event) => {
	if (
		event.target.value === "apostrophus" &&
		!combinedCheck.checked &&
		confirm("Apostrophus is best with combined characters. Do you want to enable it?")
	) {
		combinedCheck.checked = true;
		update();
	}
	if (
		event.target.value === "vinculum" &&
		specialCheck.checked &&
		confirm("Vinculum bars only work with non special characters. Do you want to disable special characters?")
	) {
		specialCheck.checked = false;
		update();
	}
	decimalInput.maxLength = maxNumbers[event.target.value].toString().length;
	decimalInput.max = maxNumbers[event.target.value];
});

function updateNumeral(event) {
	const rules = makeRules();

	const inputValue = numeralInput.value;
	numeralInput.value = toRulesWriting(inputValue, rules);

	if (inputValue) {
		const [number, valid] = romanToNum(inputValue);

		if (!valid) {
			numeralCorrect.innerText = "Invalid numeral, bad characters";
			setInfoDisplay([]);
		} else {
			numeralCorrect.innerText = "Valid Numeral";
			if (number !== null) {
				decimalInput.value = number;
				wordDisplay.innerText = numToWord(number, true);

				const [numeral, numeralsPlace] = numToRoman(number, rules);

				if (numeral === numeralInput.value) {
					setInfoDisplay(numeralsPlace, number.toString());
				} else {
					numeralCorrect.innerText = `Invalid numeral, format should be ${numeral}`;
					setInfoDisplay([]);
				}
			}
		}
	} else {
		wordDisplay.innerText = startingWords;
		setInfoDisplay([]);
		decimalInput.value = "";
		numeralCorrect.innerText = "Valid Numeral";
	}
}

numeralInput.addEventListener("input", updateNumeral);
numeralInput.addEventListener("blur", update);
numeralInput.addEventListener("keypress", (event) => {
	if (event.key === "Enter") update();
});

function setAllowedChars(elementClass, pattern) {
	document.querySelectorAll("input." + elementClass).forEach((input) => {
		input.addEventListener("keypress", (event) => {
			if (!pattern.test(event.key)) {
				event.preventDefault();
				return false;
			}
		});
	});
}

function enforceMaxLength(elementClass) {
	document.querySelectorAll("input." + elementClass).forEach((input) => {
		input.addEventListener("input", () => {
			if (input.value.length > input.maxLength) {
				input.value = input.value.slice(0, input.maxLength);
			}
		});
	});
}

if (localStorage.getItem("firstTime") !== "false") {
	const currentYear = new Date().getFullYear();
	decimalInput.value = currentYear;
	decimalInput.select();
	update();
	localStorage.setItem("firstTime", "false");
}
