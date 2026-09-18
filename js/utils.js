// #region UTILS: TEMA RENGİ VE PALET YARDIMCILARI (Herkes için - ziyaretçi dahil)
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

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

function hslToRGB(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return {
        r: Math.round(255 * f(0)),
        g: Math.round(255 * f(8)),
        b: Math.round(255 * f(4))
    };
}

function temaRenkleriniGuncelle(secilenRenk) {
    if (!secilenRenk) return;
    const { h } = hexToHSL(secilenRenk);
    const palette = generatePalette(secilenRenk);
    const root = document.documentElement;
    
    Object.entries(palette).forEach(([step, color]) => {
        root.style.setProperty(`--accent-${step}`, color);
    });
    root.style.setProperty('--accent-500', secilenRenk);
    root.style.setProperty('--accent-text', getContrastText(secilenRenk));
    
    // Kullanıcının seçtiği temanın Hue (renk tonu) ve Secondary RGB değerlerini dinamik bağla
    root.style.setProperty('--primary-h', h);
    const secRgb = hslToRGB(h, 25, 65);
    root.style.setProperty('--theme-secondary-rgb', `${secRgb.r}, ${secRgb.g}, ${secRgb.b}`);
}
// #endregion

// #region KART YER TUTUCU (CARD PLACEHOLDER GENERATOR)
function kartPlaceholderOlustur(baslik = '', kategoriId = null) {
    const placeholder = document.createElement('div');
    placeholder.className = 'card-placeholder';

    const katBilgisi = kategoriId && typeof SABIT_KATEGORILER !== 'undefined' && SABIT_KATEGORILER[kategoriId] ? SABIT_KATEGORILER[kategoriId] : null;
    const ikonSvg = katBilgisi ? katBilgisi.ikon : `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
    `;

    const iconWrap = document.createElement('div');
    iconWrap.className = 'card-placeholder-icon';
    iconWrap.innerHTML = ikonSvg;

    const badge = document.createElement('span');
    badge.className = 'card-placeholder-badge';
    badge.textContent = 'NOOK';

    placeholder.appendChild(iconWrap);
    placeholder.appendChild(badge);

    return placeholder;
}
// #endregion

