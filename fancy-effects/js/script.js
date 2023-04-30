// make circle follow cursor slowly
// make circle grow on mouse down and shrink fast when mouse is lifted

const blob = document.getElementById("blob");
let duration = 0;

document.addEventListener("mousemove", (event) => {
    const {clientX, clientY} = event;

    blob.animate({
        left: `${clientX}px`,
        top: `${clientY}px`,
    }, {duration: duration, fill: "forwards"})

    duration = 100;
})

function charRange(startChar, stopChar) {
    return Array.from({length: stopChar.charCodeAt() - startChar.charCodeAt() + 1}, (_, i) => String.fromCharCode(i + startChar.charCodeAt())).join("");
}

function randChar(charSet) {
    return charSet[Math.ceil(Math.random() * charSet.length) - 1]
}

const randomCharSet = charRange("a", "z") + charRange("A", "Z") + charRange("0", "9") + "`-=[]\\;',./~_+{}|:\"<>?".repeat(2);

document.querySelectorAll(".hacker-text").forEach((element) => {
    let isActive = false;

    element.addEventListener("mouseover", (event) => {
        if (isActive) return;
        isActive = true;

        const startString = element.innerText;
        let charSet = startString + randomCharSet;

        let startChars = Array.from(startString);
        let curChars = startChars.map(_ => randChar(charSet));

        let intervalId = setInterval(() => {
            for (let i = 0; i < curChars.length; i++) {
                curChars[i] = curChars[i] == startString[i] ? curChars[i] : randChar(charSet);
                if (curChars[i] == " ") curChars[i] = startChars[i];
            }

            const curString = curChars.join("");
            element.innerText = curString;
            
            if (curString === startString) {
                clearInterval(intervalId);
                isActive = false;
            }

            charSet += randChar(startString)

        }, 50)

    })
})