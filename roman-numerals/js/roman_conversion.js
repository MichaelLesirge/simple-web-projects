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

const standardGlyphs = Array.from("IVXLCDM")
const specialGlyphs = Array.from("ⅠⅤⅩⅬⅭⅮⅯ")

const numbersMap = makeGlyphSet(standardGlyphs);
const specialGlyphsMap = new Map(standardGlyphs.map((char, i) => [char, specialGlyphs[i]]));
const standardGlyphsMap = new Map(specialGlyphs.map((char, i) => [char, standardGlyphs[i]]));

const zero = "Nūlla"
const clockGlyphs = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ", "Ⅸ", "Ⅹ", "Ⅺ", "Ⅻ"]

const apostrophusReducedGlyphs = {
    500: ["ⅠↃ", "I)", "Ⅾ"],
    1000: ["ⅭIↃ", "(I)", "ↀ"],
    5000: ["IↃↃ", "I))", "ↁ"],
    1000: ["ⅭⅭIↃↃ", "((I))", "ↂ"],
    50000: ["IↃↃↃ", "I)))", "ↇ"],
    10000: ["ⅭⅭⅭIↃↃↃ", "(((I)))", "ↈ"],
}

export function toRules(glyphs, rules) {

    glyphs = glyphs.split("").map((glyph) => (rules.specialCharters ? specialGlyphsMap : standardGlyphsMap).get(glyph) ?? glyph).join("");
    
    if (rules.lowercase) glyphs = glyphs.toLowerCase();
    else glyphs = glyphs.toUpperCase();
    
    return glyphs;
}

export function toRulesWriting(glyphs, rules) {
    
    if (rules.lowercase) glyphs = glyphs.toLowerCase();
    else glyphs = glyphs.toUpperCase();

    glyphs = glyphs.split("").map((glyph) => (rules.specialCharters ? specialGlyphsMap : standardGlyphsMap).get(glyph) ?? glyph).join("");
    
    return glyphs;
}

export function toStandard(glyphs) {
    glyphs = glyphs.toUpperCase();
    glyphs = glyphs.split("").map((glyph) => standardGlyphsMap.get(glyph) ?? glyph).join("");
    return glyphs;
}

export function numToRoman(num, rules) {
    const totalPlaces = Math.floor(Math.log10(num))
    let result = Array.from({length: totalPlaces+1}, () => "");

    if (rules.zero && num === 0) {
        result = [zero];
    }
    
    if (rules.clock && num <= 12) {
        result = [toRules(clockGlyphs[num-1], rules)];
        num = 0;
    }

    const keys = sortMapKeys(numbersMap, true);
    let currentIndex = 0;

    while (num > 0) {
        const current = keys[currentIndex]

        if (num - current >= 0) {
            const place = Math.floor(Math.log10(num))
            num -= current;
            result[place] += toRules(numbersMap.get(current), rules)
        }
        else {
            currentIndex++;
        }
    }
    
    console.log(result)
    return [result.reverse().join(""), result];
}

export function romanToNum(glyphs) {
    glyphs = toStandard(glyphs);

    if (glyphs.toLowerCase() === zero.toLowerCase()) {
        return [0, false]
    }

    const clockValue = clockGlyphs.indexOf(glyphs) + 1
    if (clockValue !== 0) {
        return [clockValue, false];
    }
    
    const keys = new Map([...numbersMap].map(([key, value]) => [value, key]))

    let num = 0;
    let highest = 0;
    let valid = true;

    for (const char of Array.from(glyphs).reverse()) {
        let value = keys.get(char.toUpperCase());

        if (value === undefined) {
            valid = false;
            value = 0;
        }

        highest = Math.max(value, highest);
        if (value >= highest) num += value;
        else num -= value;
    }

    console.log(glyphs, num)
    return [num, valid];
}