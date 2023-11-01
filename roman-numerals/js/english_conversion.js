const specialUnitWords = [
    "zero", "one", "two", "three", "four",
    "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen",
    "sixteen", "seventeen", "eighteen", "nineteen",
];

const tensWords = [
    "zero", "ten", "twenty", "thirty", "forty", 
    "fifty", "sixty", "seventy", "eighty", "ninety",
];

const largeUnitWords = [
    "hundred", "thousand", "million", "billion", "trillion", "quadrillion", "quintillion", "sextillion", "septillion", "octillion", "nonillion", "decillion", "undecillion", "duodecillion", "tredecillion", "quatttuor-decillion", "quindecillion", "sexdecillion", "septen-decillion", "octodecillion", "novemdecillion", "vigintillion"
];

export default function numToWord(n) {
    if (n === 0) return "zero";
    const wordComponents = numToWordComponents(Math.abs(n));
    if (n < 0) wordComponents.unshift("negative");
    return wordComponents.join(" ");
}

function numToWordComponents(n) {
    if (n === 0) {
        return [];
    }

    if (n < 20) {
        return [specialUnitWords[n]];
    }

    if (n < 100) {
        const [tensCount, extra] = [Math.floor(n / 10), n % 10];
        return [tensWords[tensCount] + (extra > 0 ? "-" + numToWordComponents(extra).join(" ") : "")];
    }

    let last = 100;
    let current = 1;
    for (const unitWord of largeUnitWords) {
        current *= 1000;
        if (n < current) {
            const [unitCount, extra] = [Math.floor(n / last), n % last];
            return numToWordComponents(unitCount).concat([unitWord]).concat(numToWordComponents(extra));
        }
        last = current;
    }

    throw new Error(`Cannot convert number higher than ${current - 1}`);
}