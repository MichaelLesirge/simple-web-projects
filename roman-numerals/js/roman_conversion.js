
const rules = {
    lowercase: false,

    zero: true,
    clock: false,

    standard: false,
    apostrophus: true,
    apostrophusReduced: true,
    vinculum: false,

    specialCharters: true,
}

// 3,999 is max for standard. Still convert but say it is not valid

function sortMapKeys(map, reversed = false) {
    let keys = Array.from(map.keys()).sort((a,b)=>a-b);
    if (reversed) keys = keys.reverse();
    return keys;
}

function makeGlyphSet(values) {
    const output = new Map()
    
    for (let i = 0; i < values.length; i++) {
        const num = (10 ** Math.ceil(i / 2)) / (i % 2 + 1)
        const last = (10 ** (Math.ceil(i / 2) - 1))
        
        if (output.has(last)) output.set(num-last, output.get(last)+values[i])
        output.set(num, values[i])
    }
    
    return output;
}

const standardGlyphs = makeGlyphSet("IVXLCDM")
const specialGlyphs = makeGlyphSet("ⅠⅤⅩⅬⅭⅮⅯ")

const zero = "nūlla"
const clockGlyphs = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ", "Ⅸ", "Ⅹ", "Ⅺ", "Ⅻ"]

const apostrophusReducedGlyphs = {
    500: ["ⅠↃ", "I)", "Ⅾ"],
    1000: ["ⅭIↃ", "(I)", "ↀ"],
    5000: ["IↃↃ", "I))", "ↁ"],
    1000: ["ⅭⅭIↃↃ", "((I))", "ↂ"],
    50000: ["IↃↃↃ", "I)))", "ↇ"],
    10000: ["ⅭⅭⅭIↃↃↃ", "(((I)))", "ↈ"],
}

export function numToRoman(num, rules1) {
    
    if (rules.zero && num === 0) return [zero];
    if (rules.clock && num <= 12) return [clockGlyphs[num-1]];

    const totalPlaces = Math.floor(Math.log10(num))
    const result = Array.from({length: totalPlaces+1}, () => "");

    const numbersMap = new Map([...(rules.specialCharters ? specialGlyphs : standardGlyphs)]);

    const keys = sortMapKeys(numbersMap, true);
    let currentIndex = 0;

    while (num > 0) {
        const current = keys[currentIndex]

        if (num - current >= 0) {
            const place = Math.floor(Math.log10(num))
            num -= current;
            result[place] += numbersMap.get(current)
        }
        else {
            currentIndex++;
        }
    }

    if (rules.lowercase) {
        Object.keys(result).forEach((key) => result[key] = result[key].toLowerCase())
    }

    return [result.reverse().join(""), result];
}

export function romanToNum(glyphs) {
    return {};
}