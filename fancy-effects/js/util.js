
export function charRange(startChar, stopChar) {
    return Array.from({ length: stopChar.charCodeAt() - startChar.charCodeAt() + 1 }, (_, i) => String.fromCharCode(i + startChar.charCodeAt())).join("");
}

export function randomChoice(values) {
    return values[Math.ceil(Math.random() * values.length) - 1]
}

export function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

export function randomInt(min, max) {
    return Math.floor(randomFloat(min, max))
}

export function makeGrid(width, height, func) {
    return Array.from({ length: width }, () => Array.from({ length: height }, func));;
}
