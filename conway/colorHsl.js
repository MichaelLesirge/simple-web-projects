
export function randHsl() {
    return [Math.random() * 360, Math.random() * 100, Math.random() * 100];
}

export function hexToHsl(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    r = parseInt(result[1], 16);
    g = parseInt(result[2], 16);
    b = parseInt(result[3], 16);
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max == min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    var HSL = new Object();
    HSL['h'] = h;
    HSL['s'] = s;
    HSL['l'] = l;
    return HSL;
}

export function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

export function blendColorsHsl(color1, color2, blendFactor = 0.5) {
    // Convert RGB to HSV
    const [h1, s1, v1] = color1;
    const [h2, s2, v2] = color2;

    // Blend HSV values
    const h = (h1 * (1 - blendFactor) + h2 * blendFactor) % 360;
    const s = s1 * (1 - blendFactor) + s2 * blendFactor;
    const l = v1 * (1 - blendFactor) + v2 * blendFactor;

    // Convert back to RGB
    return [h, s, l];
}

export function stringCssHsl(color) {
    return `hsl(${color[0]}, ${color[1]}%, ${color[2]}%)`;
}