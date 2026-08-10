// #region UTILS: TEMA RENGİ VE PALET YARDIMCILARI (Herkes için - ziyaretçi dahil)

function hexToHSL(hex) {
    if (!hex) return { h: 32, s: 100, l: 50 }; // Nook turuncusu varsayılan
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) { r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16); } 
    else if (hex.length === 7) { r = parseInt(hex.substring(1, 3), 16); g = parseInt(hex.substring(3, 5), 16); b = parseInt(hex.substring(5, 7), 16); }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; } h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function generatePalette(hex) {
    const { h, s } = hexToHSL(hex);
    const steps = { 50: 95, 100: 88, 300: 68, 500: 50, 700: 34, 900: 16 };
    const palette = {};
    for (const [key, l] of Object.entries(steps)) {
        palette[key] = `hsl(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l}%)`;
    }
    return palette;
}

function getContrastText(hex) {
    if (!hex) return '#0b0d10';
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? '#0b0d10' : '#ffffff';
}

function temaRenkleriniGuncelle(secilenRenk) {
    if (!secilenRenk) return;
    const palette = generatePalette(secilenRenk);
    const root = document.documentElement;
    
    Object.entries(palette).forEach(([step, color]) => {
        root.style.setProperty(`--accent-${step}`, color);
    });
    root.style.setProperty('--accent-500', secilenRenk);
    root.style.setProperty('--accent-text', getContrastText(secilenRenk));
}
// #endregion
