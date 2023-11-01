import { numToRoman, romanToNum } from "./roman_conversion.js";
import "./roman_conversion.js";

setAllowedChars("decimal-input", /\d/)

const decimalInput = document.getElementById("decimal")
const numeralInput = document.getElementById("numeral")

function setInfoDisplay(numeralsPlaces) {
    
}

decimalInput.addEventListener("input", (event) => {
    const [numeral, numeralsPlace] = numToRoman(decimalInput.value);
    setInfoDisplay(numeralsPlace)
    numeralInput.value = numeral;
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