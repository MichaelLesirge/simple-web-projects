import { randomChoice } from "./util.js";

export default function makeHackerText(elements, randomCharSet, {timeout = 50, addBlanksAfter = 1000} = {}) {
    elements.forEach((element) => {
        let isActive = false;

        element.addEventListener("mouseover", (event) => {
            if (isActive) return;
            isActive = true;

            const startString = element.innerText;
            let charSet = startString + randomCharSet;

            let startChars = Array.from(startString);
            let curChars = new Array(startChars.length);

            let count = 0

            let intervalId = setInterval(() => {
                count++;

                for (let i = 0; i < curChars.length; i++) {
                    // curChars[i] = curChars[i] === startString[i] ? curChars[i] : randChar(charSet);
                    if (curChars[i] !== startChars[i]) {
                        curChars[i] = randomChoice(charSet);
                        if (count * timeout > addBlanksAfter) charSet += " ";
                    }
                    if (curChars[i] === " ") curChars[i] = startChars[i];
                }

                const curString = curChars.join("");
                element.innerText = curString;

                if (curString === startString) {
                    clearInterval(intervalId);
                    isActive = false;
                }
            }, timeout)

        })
    })
};