import { numToRoman, romanToNum } from "./roman_conversion.js";
import { numToWord } from "./english_conversion.js";

setAllowedChars("decimal-input", /\d/)

const defaultRules = {
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

const lowercaseCheck = document.getElementById("lowercase")
const specialCheck = document.getElementById("special-charters")
const clockCheck = document.getElementById("clock-charters")

function setInfoDisplay(numeralsPlaces, value) {
    explanationBox.innerHTML = "";

    numeralsPlaces.forEach((numeral, index) => {
        console.log(numeralsPlaces)
        if (numeral) {
            explanationBox.innerHTML += `
            <div class="card">
                <div class="card-numeral">
                    ${numeral}
                </div>
                <div class="card-number">
                    ${(value[index] == 0 && value != 0 ? 1 : (numeralsPlaces.length == 1 ? value : value[index])) + "0".repeat(numeralsPlaces.length - index - 1)}
                </div>
            </div>`
        }
    })
}

function update() {
    console.log(decimalInput.value)
    if (decimalInput.value) {
        const value = Number.parseInt(decimalInput.value)

        const rules = {
            ...defaultRules,
            lowercase: lowercaseCheck.checked,
            specialCharters: specialCheck.checked,
            clock: clockCheck.checked,
        }
    
        if (rules.standard && value > 3999) {
            numeralCorrect.innerText = "Invalid Numeral, must be 3999 or lower";
        }
        else if (value < 1) {
            numeralCorrect.innerText = "Invalid Numeral, must be 1 or higher";
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
}

decimalInput.addEventListener("input", update)
lowercaseCheck.addEventListener("change", update)
specialCheck.addEventListener("change", update)
clockCheck.addEventListener("change", update)

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