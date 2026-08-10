// #region 1: DURUM VE KONFİGÜRASYON (STATE)
const SUPABASE_URL = 'https://acvpjytvkfxbsuiivqir.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_t5LYrH03nWrL1-tzhhXV4g_UF77mEAy';
const urlParams = new URLSearchParams(window.location.search);
const KULLANICI_ADI = urlParams.get('user');
const SABIT_KATEGORILER = {
    'film': { ad: 'Filmler', ikon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>` },
    'dizi': { ad: 'Diziler', ikon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>` },
    'anime': { ad: 'Animeler', ikon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>` },
    'oyun': { ad: 'Oyunlar', ikon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><path d="M6 12h4"></path><path d="M8 10v4"></path><circle cx="15" cy="13" r="1"></circle><circle cx="18" cy="11" r="1"></circle></svg>` }
};

let siteVerisi = {
    profil_sahibi_id: null, 
    primary_color: null, /* YENİ: Renk hafızası buraya eklendi */
    profil_metinleri_ve_linkler: null,
    profil_gorselleri: null,
    linkler: [],
    widgetlar: [],
    icerik: {},
    monkeytype_skorlari: null
};

// NOT: hexToHSL / generatePalette / getContrastText / temaRenkleriniGuncelle
// buradan utils.js'e taşındı (hexToHSL'in de iki tanımlı kopyasından
// gelişmiş olanı (3 haneli hex destekli, yuvarlamalı) tek kopya olarak korundu).

// PAYLAŞILAN DÜZENLEME DURUMU (ui.js hem de edit.js tarafından okunur/yazılır)
// Bu üç alan bilerek EditManager'ın kendi private state'inden çıkarılıp
// buraya taşındı: ui.js (herkes için render) bunlara owner olmayan ziyaretçilerde
// bile erişiyor, ama edit.js sadece isOwner=true olduğunda yükleniyor.
let durum = {
    isGlobalEditActive: false,
    duzenlenenKategoriId: null,
    KATEGORI_ARAMA_TURU: { animeler: 'anime', diziler: 'dizi', filmler: 'film', oyunlar: 'oyun' }
};

let aktifKullaniciOturumu = null;
let aktifKullaniciAdi = null;
let isOwner = false;
const MAKS_ICERIK_SAYISI = 12;
let aktifKategoriId = null;

const SIL_IKONU_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7H20M9 7V4.5C9 4.22386 9.22386 4 9.5 4H14.5C14.7761 4 15 4.22386 15 4.5V7M18 7L17.3 18.5C17.24 19.47 16.43 20.2 15.46 20.2H8.54C7.57 20.2 6.76 19.47 6.7 18.5L6 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const TIK_IKONU_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13L9.5 17.5L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const supabaseClient = (typeof supabase !== 'undefined') ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
// #endregion
