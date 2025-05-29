function sortMapKeys(map, reversed = false) {
    let keys = Array.from(map.keys()).sort((a, b) => a - b);
    if (reversed) keys = keys.reverse();
    return keys;
}

function makeGlyphSet(values, offset = 0) {
    const output = new Map()

    for (let i = 0; i < values.length; i++) {
        const index = i + offset;
        const num = (10 ** Math.ceil(index / 2)) / (index % 2 + 1)
        const last = (10 ** (Math.ceil(index / 2) - 1))

        if (output.has(last)) output.set(num - last, output.get(last) + values[i])

        output.set(num, values[i])
    }

    return output;
}

// Normal Roman Numerals

const standardGlyphs = Array.from("IVXLCDM")
const specialGlyphs = Array.from("ⅠⅤⅩⅬⅭⅮⅯ")

const numbersMap = makeGlyphSet(standardGlyphs);
const specialGlyphsMap = new Map(standardGlyphs.map((char, i) => [char, specialGlyphs[i]]));
const standardGlyphsMap = new Map(specialGlyphs.map((char, i) => [char, standardGlyphs[i]]));

// Apostrophus Roman Numerals

const apostrophusAllGlyphs = {
    500: ["Ⅾ", "ⅠↃ", "I)"],
    1000: ["ↀ", "ⅭIↃ", "(I)"],
    5000: ["ↁ", "IↃↃ", "I))"],
    10000: ["ↂ", "ⅭⅭIↃↃ", "((I))"],
    50000: ["ↇ", "IↃↃↃ", "I)))"],
    100000: ["ↈ", "ⅭⅭⅭIↃↃↃ", "(((I)))"],
}

const apostrophusGlyphs = new Array();
const apostrophusSymbolToSpecial = new Map();
const apostrophusSymbolToNormal = new Map();
const apostrophusSymbolToSpecialReverse = new Map();
const apostrophusSymbolToNormalReverse = new Map();
for (const value of Object.values(apostrophusAllGlyphs)) {
    const glyph = value[0];
    apostrophusGlyphs.push(glyph);
    apostrophusSymbolToSpecial.set(glyph, value[1]);
    apostrophusSymbolToNormal.set(glyph, value[2]);
    apostrophusSymbolToSpecialReverse.set(value[1], glyph);
    apostrophusSymbolToNormalReverse.set(value[2], glyph);
}

const apostrophusNumbersMap = makeGlyphSet(apostrophusGlyphs, 5);

// Vinculum

const combiningOverline = '̅';
const combiningMacron = '̄';
const vinculumNumbersMap = new Map([...numbersMap.entries()].map(([key, value]) => [key * 1000, value.replace(/./g, "$&" + combiningOverline)]));
const vinculumSecondNumbersMap = new Map([...numbersMap.entries()].map(([key, value]) => [key * 1000 * 1000, value.replace(/./g, "$&" + combiningOverline + combiningOverline)]));


// Special Roman Numerals

const zero = "Nūlla"

// Clock Roman Numerals
const clockGlyphs = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ", "Ⅸ", "Ⅹ", "Ⅺ", "Ⅻ"]
const clockGlyphsMap = new Map(clockGlyphs.map((char, i) => [char, numToRoman(i + 1, { zero: false, combined: false, specialCharters: false, lowercase: false, mode: "standard" })[0]]));

// Exported Functions

export function toRules(glyphs, rules) {

    glyphs = glyphs.split("").map((glyph) =>
        (rules.specialCharters ? specialGlyphsMap : standardGlyphsMap).get(glyph) ?? glyph)
        .join("");

    if (rules.lowercase) glyphs = glyphs.toLowerCase();
    else glyphs = glyphs.toUpperCase();

    if (rules.mode === "apostrophus") {
        glyphs = glyphs.split("").map((glyph) =>
            (rules.combined ? new Map() : (rules.specialCharters ? apostrophusSymbolToSpecial : apostrophusSymbolToNormal)).get(glyph) ?? glyph)
            .join("");
    }

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
    let result = Array.from({ length: totalPlaces + 1 }, () => "");

    if (rules.zero && num === 0) {
        result = [zero];
    }

    if (rules.combined && num <= 12) {
        result = [toRules(clockGlyphs[num - 1], rules)];
        num = 0;
    }

    let currentNumberMap = numbersMap;

    if (rules.mode === "apostrophus") {
        currentNumberMap = new Map([...numbersMap, ...apostrophusNumbersMap]);
    } else if (rules.mode === "vinculum") {
        currentNumberMap = new Map([...vinculumSecondNumbersMap, ...vinculumNumbersMap, ...numbersMap]);
    }

    const keys = sortMapKeys(currentNumberMap, true);
    let currentIndex = 0;

    while (num > 0) {
        const current = keys[currentIndex]

        if (num - current >= 0) {
            const place = Math.floor(Math.log10(num))
            num -= current;
            result[place] += toRules(currentNumberMap.get(current), rules)
        }
        else {
            currentIndex++;
        }
    }

    return [result.reverse().join(""), result];
}

export function romanToNum(glyphs) {
    glyphs = toStandard(glyphs);

    if (glyphs.toLowerCase() === zero.toLowerCase()) {
        return [0, false]
    }

    for (const [key, value] of clockGlyphsMap) {
        glyphs = glyphs.replaceAll(key, value);
    }


    for (const [key, value] of apostrophusSymbolToNormalReverse) {
        glyphs = glyphs.replaceAll(key, value);
    }
    for (const [key, value] of apostrophusSymbolToSpecialReverse) {
        glyphs = glyphs.replaceAll(key, value);
    }

    const keys = new Map([...numbersMap, ...apostrophusNumbersMap].map(([key, value]) => [value, key]))

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

    return [num, valid];
}