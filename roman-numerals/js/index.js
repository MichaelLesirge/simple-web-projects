import { numToRoman, romanToNum } from "./roman_conversion.js";
import { numToWord } from "./english_conversion.js";

setAllowedChars("decimal-input", /\d/)

const rules = {
    lowercase: false,

    zero: true,
    clock: false,

    standard: true,
    apostrophus: false,
    apostrophusReduced: false,
    vinculum: false,

    specialCharters: true,
}

const decimalInput = document.getElementById("decimal")
const numeralInput = document.getElementById("numeral")

const numeralCorrect = document.getElementById("numeral-correct")
// const numeralInfo = document.getElementById("numeral-info")

const wordDisplay = document.getElementById("english")

const startingWords = wordDisplay.innerText;

const explanationBox = document.getElementById("explanation-box")

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
                    ${(parseInt(value[index]) || 1) + "0".repeat(numeralsPlaces.length - index - 1)}
                </div>
            </div>`
        }
    })
}

decimalInput.addEventListener("input", (event) => {
    if (decimalInput.value) {
        const value = Number.parseInt(decimalInput.value)

        if (rules.standard && value > 3999) {
            numeralCorrect.innerText = "Invalid Numeral, standard roman numerals don't go higher than 3999";
        }
        if (value == 0) {
            numeralCorrect.innerText = "Invalid Numeral, zero did not exist in roman numerals";
        }
        else {
            numeralCorrect.innerText = "Valid Numeral";
        }

        const [numeral, numeralsPlace] = numToRoman(value, rules);
        setInfoDisplay(numeralsPlace, value.toString());
        numeralInput.value = numeral;
        wordDisplay.innerText = numToWord(value, true);
    }
    else {
        wordDisplay.innerText = startingWords;
        setInfoDisplay([]);
        numeralInput.value = "";
    }
})

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