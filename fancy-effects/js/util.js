
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
    return Math.floor(randomFloat(min, max + 1))
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function shuffle(array) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
}

export function shuffledCopy(array) {
    array = array.slice();
    shuffle(array);
    return array;
}

export function makeGrid(width, height, func) {
    return Array.from({ length: width }, () => Array.from({ length: height }, func));;
}

export function getPermutations(list, maxLen) {
    maxLen = (maxLen ?? list.length)
    const perm = list.map(v => [v]);
    const generate = (perm, maxLen, currLen) => {
        if (currLen === maxLen) {
            return perm;
        }
        for (let i = 0, len = perm.length; i < len; i++) {
            const currPerm = perm.shift();
            for (let k = 0; k < list.length; k++) {
                perm.push(currPerm.concat(list[k]));
            }
        }
        return generate(perm, maxLen, currLen + 1);
    };
    return generate(perm, maxLen, 1);
};