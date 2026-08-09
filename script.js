// #region BLOK 1: ÇEKİRDEK SİSTEM (STATE, AUTH & RENDER)

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

function hexToHSL(hex) {
    if (!hex) return { h: 32, s: 100, l: 50 }; // Varsayılan Nook Turuncusu
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
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

let aktifKullaniciOturumu = null;
let aktifKullaniciAdi = null;
let isOwner = false;
const MAKS_ICERIK_SAYISI = 12;
let aktifKategoriId = null;

const SIL_IKONU_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7H20M9 7V4.5C9 4.22386 9.22386 4 9.5 4H14.5C14.7761 4 15 4.22386 15 4.5V7M18 7L17.3 18.5C17.24 19.47 16.43 20.2 15.46 20.2H8.54C7.57 20.2 6.76 19.47 6.7 18.5L6 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const TIK_IKONU_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13L9.5 17.5L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const supabaseClient = (typeof supabase !== 'undefined') ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
// #endregion

// #region 2: OTURUM VE KİMLİK YÖNETİMİ (AUTH SİSTEMİ)
let isLoginMode = true; 
let hataliGirisDenemesi = 0;
let girisKilitliMi = false;

async function oturumuKontrolEt() {
    if (!supabaseClient) return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    aktifKullaniciOturumu = session;
    
    // YENİ: Oturum varsa, veritabanından kullanıcının kendi sayfa adını bul ve kaydet
    if (session) {
        const { data } = await supabaseClient
            .from('profiles')
            .select('kullanici_adi')
            .eq('auth_id', session.user.id)
            .single();
        if (data) aktifKullaniciAdi = data.kullanici_adi;
    }
}

function authHataGoster(mesaj) {
    document.querySelectorAll('.auth-error-box').forEach(box => {
        box.textContent = mesaj;
        box.style.display = 'block';
    });
}

function authHataTemizle() {
    document.querySelectorAll('.auth-error-box').forEach(box => box.style.display = 'none');
}

async function sistemeGirisYap(email, password) {
    authHataTemizle();
    if (girisKilitliMi) { authHataGoster("Çok fazla hatalı deneme yaptın. Lütfen daha sonra tekrar dene."); return false; }
    if (password.length < 6) { authHataGoster("Şifre en az 6 karakter olmalıdır."); return false; }

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    
    if (error) {
        hataliGirisDenemesi++;
        if (hataliGirisDenemesi >= 5) {
            girisKilitliMi = true;
            authHataGoster("Hatalı deneme limiti aşıldı. Giriş 30 saniye kilitlendi.");
            setTimeout(() => { girisKilitliMi = false; hataliGirisDenemesi = 0; authHataTemizle(); }, 30000);
        } else {
            let hataMesaji = "Giriş Hatası: E-posta veya şifre hatalı.";
            if (error.message.includes("Email not confirmed")) hataMesaji = "Lütfen e-posta adresinizi doğrulayın.";
            authHataGoster(hataMesaji);
        }
        return false;
    }
    
    const { data: profileData } = await supabaseClient
        .from('profiles')
        .select('kullanici_adi')
        .eq('auth_id', data.user.id)
        .single();

    if (profileData && profileData.kullanici_adi) {
        window.location.href = `?user=${profileData.kullanici_adi}`;
    } else {
        await supabaseClient.auth.signOut();
        authHataGoster("Bu hesaba ait bir arşiv bulunamadı veya silinmiş. Lütfen yeniden kayıt olun.");
        return false;
    }
    return true;
}

async function sistemeKayitOl(email, password, username) {
    authHataTemizle();
    const temizKullaniciAdi = username.toLowerCase().trim();

    if (temizKullaniciAdi.length > 15) { authHataGoster("Kullanıcı adı en fazla 15 karakter olabilir."); return false; }
    if (password.length < 6) { authHataGoster("Şifreniz en az 6 karakter olmalıdır."); return false; }

    const { data: existingUser } = await supabaseClient.from('profiles').select('kullanici_adi').eq('kullanici_adi', temizKullaniciAdi).single();

    if (existingUser) { authHataGoster("Bu kullanıcı adı zaten alınmış! Lütfen başka bir isim dene."); return false; }

    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    
    if (error) { 
        let hataMesaji = "Kayıt Hatası: " + error.message;
        if (error.message.includes("rate limit")) hataMesaji = "Çok fazla istek yapıldı. Lütfen biraz bekleyin.";
        authHataGoster(hataMesaji); 
        return false; 
    }
    
    if (data.user) {
        const { error: dbError } = await supabaseClient
            .from('profiles')
            .insert([{ 
                auth_id: data.user.id, 
                kullanici_adi: temizKullaniciAdi,
                profil_metinleri_ve_linkler: {},
                profil_gorselleri: {},
                widgetlar: [],
                icerik: {}
            }]);
            
        if (dbError) { authHataGoster("Profil oluşturulurken hata: " + dbError.message); return false; }
    }
    
    window.location.href = `?user=${temizKullaniciAdi}`;
    return true;
}

async function sistemdenCikisYap() {
    await supabaseClient.auth.signOut();
    window.location.href = window.location.pathname; 
}

function authModaliniBaslat() {
    const triggerBtn = document.getElementById('auth-trigger-btn');
    const triggerText = document.getElementById('auth-trigger-text'); 
    const modal = document.getElementById('auth-modal');
    const backdrop = document.getElementById('auth-modal-backdrop');
    const closeBtn = document.getElementById('auth-modal-close');
    const formContainer = document.getElementById('auth-form-container');
    const loggedInView = document.getElementById('auth-logged-in-view');
    const currentUserText = document.getElementById('auth-current-user');
    const logoutBtn = document.getElementById('auth-logout-btn');
    const title = document.getElementById('auth-title');
    const usernameGroup = document.getElementById('auth-username-group');
    const usernameInput = document.getElementById('auth-username');
    const emailInput = document.getElementById('auth-email');
    const passwordInput = document.getElementById('auth-password');
    const submitBtn = document.getElementById('auth-submit-btn');
    const switchText = document.getElementById('auth-switch-text');
    const switchBtn = document.getElementById('auth-switch-action');

    if (!triggerBtn || !modal) return;

    const modaliAc = () => {
        modal.classList.add('is-open');
        if (aktifKullaniciOturumu) {
            formContainer.style.display = 'none';
            loggedInView.style.display = 'flex';
            loggedInView.style.flexDirection = 'column';
            loggedInView.style.gap = '15px';
            currentUserText.textContent = aktifKullaniciOturumu.user.email;
        } else {
            formContainer.style.display = 'flex';
            loggedInView.style.display = 'none';
            setTimeout(() => emailInput.focus(), 50);
        }
    };

    const modaliKapat = () => { modal.classList.remove('is-open'); authHataTemizle(); };

    triggerBtn.addEventListener('click', () => {
        // YENİ: Giriş yapmışız ama başkasının profilindeysek, modalı açmak yerine kendi profilimize ışınla
        if (aktifKullaniciOturumu && !isOwner && aktifKullaniciAdi) {
            window.location.href = `?user=${aktifKullaniciAdi}`;
            return;
        }
        
        // Kendi sayfamızdaysak veya giriş yapmamışsak normal şekilde modalı aç
        modaliAc();
    });
    closeBtn.addEventListener('click', modaliKapat);
    backdrop.addEventListener('click', modaliKapat);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('is-open')) modaliKapat(); });

    switchBtn.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
            title.textContent = 'Giriş Yap';
            usernameGroup.style.display = 'none';
            submitBtn.textContent = 'Giriş Yap';
            switchText.textContent = 'Hesabın yok mu?';
            switchBtn.textContent = 'Kayıt Ol';
        } else {
            title.textContent = 'Kayıt Ol';
            usernameGroup.style.display = 'block';
            submitBtn.textContent = 'Kayıt Ol';
            switchText.textContent = 'Zaten hesabın var mı?';
            switchBtn.textContent = 'Giriş Yap';
        }
    });

    submitBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        if (!email || !password) { authHataGoster("E-posta ve şifre zorunludur!"); return; }

        submitBtn.disabled = true;
        submitBtn.textContent = 'İşleniyor...';

        if (isLoginMode) {
            await sistemeGirisYap(email, password);
        } else {
            const username = usernameInput.value.trim();
            if (!username || username.length < 3) {
                authHataGoster("Kayıt olmak için en az 3 karakterli bir kullanıcı adı gereklidir!");
                submitBtn.disabled = false;
                submitBtn.textContent = 'Kayıt Ol';
                return;
            }
            await sistemeKayitOl(email, password, username);
        }
        submitBtn.disabled = false;
        submitBtn.textContent = isLoginMode ? 'Giriş Yap' : 'Kayıt Ol';
    });

    logoutBtn.addEventListener('click', async () => {
        logoutBtn.disabled = true;
        logoutBtn.textContent = 'Çıkış yapılıyor...';
        await sistemdenCikisYap();
    });

    const deleteAccountBtn = document.getElementById('auth-delete-account-btn');

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => {
            ozelOnayAl("Tüm arşivini ve hesabını kalıcı olarak silmek istediğine emin misin? Bu işlem geri alınamaz.", async () => {
                
                deleteAccountBtn.disabled = true;
                deleteAccountBtn.textContent = 'Siliniyor...';
                
                // SQL Editor'de oluşturduğumuz fonksiyonu doğrudan tetikliyoruz
                const { error } = await supabaseClient.rpc('delete_user_account');
                
                if (error) {
                    authHataGoster("Hesap silinirken bir hata oluştu: " + error.message);
                    deleteAccountBtn.disabled = false;
                    deleteAccountBtn.textContent = 'Hesabımı Kalıcı Olarak Sil';
                } else {
                    await sistemdenCikisYap(); 
                }
            });
        });
    }

    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); submitBtn.click(); }
    });
}

function landingEkraniniBaslat() {
    const landingBox = document.getElementById('main-landing-box');
    const mainTitle = document.getElementById('landing-main-title');
    const usernameInput = document.getElementById('landing-username');
    const emailInput = document.getElementById('landing-email');
    const passwordInput = document.getElementById('landing-password');
    const submitBtn = document.getElementById('landing-submit-btn');
    const switchText = document.getElementById('landing-switch-text');
    const switchBtn = document.getElementById('landing-switch-action');
    
    let isLandingLoginMode = true;
    if (!submitBtn) return;

    // Başlık Varyasyonları (İstediğin gibi doldurabilirsin)
    const loginBasliklari = [
        "Nook'a Dön",
        "Kendi Köşene Geç",
        "Tekrar Hoş Geldin",
        "Kaldığın Yerden"
    ];

    const registerBasliklari = [
        "Kendi Köşeni Yarat",
        "Dijital Denize Açıl",
        "Bir Nook İnşa Et",
        "Kendine Bir Alan Aç"
    ];

    const rastgeleBaslikSec = (dizi) => dizi[Math.floor(Math.random() * dizi.length)];

    // Başlangıç başlığını ayarla
    mainTitle.textContent = rastgeleBaslikSec(loginBasliklari);

    switchBtn.addEventListener('click', () => {
        isLandingLoginMode = !isLandingLoginMode;
        
        if (isLandingLoginMode) {
            // GİRİŞ MODUNA DÖNÜŞ
            landingBox.classList.remove('register-mode');
            mainTitle.textContent = rastgeleBaslikSec(loginBasliklari);
            submitBtn.textContent = 'Giriş Yap';
            switchText.textContent = 'Hesabın yok mu?';
            switchBtn.textContent = 'Kayıt Ol';
            usernameInput.value = ''; // Çıkarken temizle
        } else {
            // KAYIT MODUNA GEÇİŞ
            landingBox.classList.add('register-mode');
            mainTitle.textContent = rastgeleBaslikSec(registerBasliklari);
            submitBtn.textContent = 'Kayıt Ol';
            switchText.textContent = 'Zaten hesabın var mı?';
            switchBtn.textContent = 'Giriş Yap';
        }
    });

    submitBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        if (!email || !password) { authHataGoster("E-posta ve şifre zorunludur!"); return; }

        submitBtn.disabled = true;
        submitBtn.textContent = 'İşleniyor...';

        if (isLandingLoginMode) {
            await sistemeGirisYap(email, password);
        } else {
            const username = usernameInput.value;
            if (!username || username.length < 3) {
                authHataGoster("En az 3 karakterli bir kullanıcı adı gereklidir!");
                submitBtn.disabled = false;
                submitBtn.textContent = 'Kayıt Ol';
                return;
            }
            await sistemeKayitOl(email, password, username);
        }
        submitBtn.disabled = false;
        submitBtn.textContent = isLandingLoginMode ? 'Giriş Yap' : 'Kayıt Ol';
    });
    
    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); submitBtn.click(); }
    });
}
// #endregion

// #region 3: VERİ ÇEKME VE EKRANA ÇİZME (FETCH & RENDER)
async function tumVerileriCek() {
    try {
        const response = await fetch('https://acvpjytvkfxbsuiivqir.supabase.co/functions/v1/bright-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
            body: JSON.stringify({ kullanici_adi: KULLANICI_ADI })
        });

        let data, profil;

        // GÜVENLİK AĞI: Eğer Edge Function 400 hatası verip çökerse, veriyi direkt Supabase'den çek!
        if (!response.ok) {
            console.warn(`Edge Function Hatası (${response.status}). Güvenlik ağı devrede, veri doğrudan çekiliyor...`);
            const { data: fallbackData, error: fallbackError } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('kullanici_adi', KULLANICI_ADI)
                .single();

            if (fallbackError || !fallbackData) throw new Error("Hesap bulunamadı.");
            profil = fallbackData;
            data = { canli_widget_verileri: null };
        } else {
            data = await response.json();
            profil = data.profil;
        }
        
        if (!profil || Object.keys(profil).length === 0) {
            document.getElementById('app-wrapper').style.display = 'none';
            document.getElementById('not-found-screen').style.display = 'flex';
            return; 
        }

        siteVerisi.profil_sahibi_id = profil.auth_id;

        if (aktifKullaniciOturumu && siteVerisi.profil_sahibi_id === aktifKullaniciOturumu.user.id) {
            isOwner = true; 
            document.body.classList.add('is-owner'); 
        } else {
            isOwner = false; 
        }

        // Ziyaretçi vs. Sahip durumuna göre sağ üstteki butonun metnini dinamik belirliyoruz
        const authTriggerText = document.getElementById('auth-trigger-text');
        if (authTriggerText) {
            if (aktifKullaniciOturumu) {
                // Giriş yapmış ama başkasının sayfasındaysa "Sayfama Dön", kendi sayfasındaysa "Çıkış Yap"
                authTriggerText.textContent = isOwner ? "Çıkış Yap" : "Sayfama Dön";
            } else {
                authTriggerText.textContent = "Giriş Yap";
            }
        }

        siteVerisi.profil_metinleri_ve_linkler = profil.profil_metinleri_ve_linkler; 
        
        // YENİ: Rengi artık profildeki metin objesinin içinden okuyoruz
        siteVerisi.primary_color = profil.primary_color || '#ff8800';

        siteVerisi.linkler = profil.profil_metinleri_ve_linkler?.linkler || [];
        siteVerisi.profil_gorselleri = profil.profil_gorselleri;
        siteVerisi.widgetlar = profil.widgetlar || [];
        siteVerisi.icerik = profil.icerik || {};
        siteVerisi.monkeytype_skorlari = data.canli_widget_verileri?.monkeytype || null;

        ekraniCiz();
    } catch (err) {
        console.error("Veriler çekilirken hata oluştu:", err.message);
    }
}

const WidgetEngine = {
    types: {
        monkeytype: {
            id: 'monkeytype',
            renderView: (ayarlar) => {
                const username = ayarlar.kullanici || '';
                return `
                <div class="widget-link" data-type="monkeytype" data-username="${username}">
                    <div class="mt-front-view">
                        <div class="mt-front-left">
                            <div class="widget-type-icon mt-brand"></div>
                            <a href="https://monkeytype.com/profile/${username}" target="_blank" onclick="event.stopPropagation()" class="mt-front-username" title="${username}">${username || 'Bilinmiyor'}</a>
                        </div>
                        
                        <div class="mt-front-divider"></div>
                        
                        <div class="mt-front-right">
                            <div class="mt-stat-item front-stat" data-front-mode="words" data-front-amount="10">
                                <span class="mt-stat-label">10 WORDS</span>
                                <span class="mt-stat-value">-</span>
                                <span class="mt-stat-percent">-%</span>
                            </div>
                            <div class="mt-stat-item front-stat" data-front-mode="time" data-front-amount="15">
                                <span class="mt-stat-label">15 SECONDS</span>
                                <span class="mt-stat-value">-</span>
                                <span class="mt-stat-percent">-%</span>
                            </div>
                        </div>
                    </div>
                </div>`;
            },
            renderEdit: (ayarlar) => {
                return `
                <div class="widget-inline-edit">
                    <div class="widget-edit-left">
                        <select class="widget-type-select"><option value="monkeytype">Monkeytype</option></select>
                        <div class="widget-type-icon mt-brand"></div>
                        <span class="widget-type-label">monkeytype</span>
                    </div>
                    <div class="widget-edit-divider"></div>
                    <div class="widget-edit-right">
                        <input type="text" class="widget-username-input" placeholder="Kullanıcı Adı" value="${ayarlar.kullanici || ''}">
                        <button class="widget-inline-delete" title="Kaldır">${SIL_IKONU_SVG}</button>
                    </div>
                </div>`;
            },
            onMount: () => {
                const data = siteVerisi.monkeytype_skorlari;
                if (!data) return;
                
                const veriyiEkranaBas = (mode, miktar) => {
                    const modeData = data[mode];
                    const stat = (modeData && modeData[miktar]) ? modeData[miktar][0] : (data[miktar] ? data[miktar][0] : null);
                    
                    if (stat && stat.wpm) {
                        document.querySelectorAll(`.mt-stat-item[data-mode="${mode}"][data-amount="${miktar}"]`).forEach(item => {
                            const valueEl = item.querySelector('.mt-stat-value');
                            const percentEl = item.querySelector('.mt-stat-percent');
                            if (valueEl) valueEl.textContent = Math.round(stat.wpm);
                            if (percentEl) percentEl.textContent = `${Math.round(stat.acc)}%`;
                        });
                        document.querySelectorAll(`.front-stat[data-front-mode="${mode}"][data-front-amount="${miktar}"]`).forEach(item => {
                            const valueEl = item.querySelector('.mt-stat-value');
                            const percentEl = item.querySelector('.mt-stat-percent');
                            if (valueEl) valueEl.textContent = Math.round(stat.wpm);
                            if (percentEl) percentEl.textContent = `${Math.round(stat.acc)}%`;
                        });
                    }
                };
                
                ['15', '30', '60', '120'].forEach(m => veriyiEkranaBas('time', m));
                ['10', '25', '50', '100'].forEach(m => veriyiEkranaBas('words', m));
            },            
            onClick: (slot, widgetLink, isOverlayClick) => {
                // Tıklanınca pop-up açmak yerine doğrudan yeni sekmede profiline yolla
                const username = widgetLink.dataset.username;
                if (username) window.open(`https://monkeytype.com/profile/${username}`, '_blank');
            }
        }
    },

    ciz() {
        const container = document.getElementById('widgets-container');
        if (!container) return;
        container.innerHTML = ''; 

        const mountedTypes = new Set(); 

        for (let i = 0; i < 3; i++) {
            const widgetData = (siteVerisi.widgetlar && siteVerisi.widgetlar[i]) ? siteVerisi.widgetlar[i] : null;
            const slot = document.createElement('div');
            slot.className = 'widget-slot';
            slot.dataset.index = i;

            if (typeof isOwner !== 'undefined' && isOwner && widgetData) {
                slot.setAttribute('draggable', 'true');
                slot.classList.add('is-draggable');
            }

            const viewLayer = document.createElement('div');
            viewLayer.className = 'widget-view-layer view-only';
            
            if (widgetData && this.types[widgetData.tur]) {
                const wType = this.types[widgetData.tur];
                viewLayer.innerHTML = wType.renderView(widgetData.ayarlar);
                mountedTypes.add(widgetData.tur); 
            } else {
                viewLayer.innerHTML = `<div class="widget-placeholder">Boş Slot</div>`;
            }
            slot.appendChild(viewLayer);

            if (typeof isOwner !== 'undefined' && isOwner) {
                const editLayer = document.createElement('div');
                editLayer.className = 'widget-edit-layer edit-only';
                
                if (widgetData && this.types[widgetData.tur]) {
                    editLayer.innerHTML = this.types[widgetData.tur].renderEdit(widgetData.ayarlar);
                } else {
                    editLayer.innerHTML = `
                        <div class="widget-ghost-slot">
                            <span style="font-size: 2rem; font-weight: 300;">+</span>
                            <span style="font-size: 0.8rem; margin-top: 5px;">Yeni Ekle</span>
                        </div>
                    `;
                }
                slot.appendChild(editLayer);
            }
            container.appendChild(slot);
        }

        mountedTypes.forEach(type => {
            if (this.types[type].onMount) this.types[type].onMount();
        });
    },

    etkilesimBaslat() {
        const container = document.getElementById('widgets-container');
        if (!container) return;

        // 1. SADECE TIKLAMA OLAYI
        container.addEventListener('click', (e) => {
            if (typeof EditManager !== 'undefined' && EditManager.state.isGlobalEditActive) return;

            const slot = e.target.closest('.widget-slot');
            if (!slot) return;

            const widgetLink = slot.querySelector('.widget-link');
            if (!widgetLink) return;

            const isOverlayClick = !!e.target.closest('.widget-overlay');
            const widgetType = widgetLink.dataset.type;

            if (widgetType && this.types[widgetType] && this.types[widgetType].onClick) {
                this.types[widgetType].onClick(slot, widgetLink, isOverlayClick);
            }
        }); // DİKKAT: TIKLAMA FONKSİYONU BURADA KESİN OLARAK BİTİYOR!

        // 2. KAPANMA OLAYI (Tıklamadan tamamen bağımsız dışarıda durmalı)
        container.addEventListener('mouseout', (e) => {
            const slot = e.target.closest('.widget-slot');
            
            // Fare gerçekten widget'ın dışına çıktıysa
            if (slot && !slot.contains(e.relatedTarget)) {
                if (slot.classList.contains('is-active')) {
                    // Animasyonu başlatmak için is-active'i sil
                    slot.classList.remove('is-active');
                    // Ancak katmanı havada tutmak için is-closing ekle
                    slot.classList.add('is-closing');
                    
                    // CSS animasyon süresi (0.25s) bittiğinde katmanı aşağı bırak
                    setTimeout(() => slot.classList.remove('is-closing'), 250);
                }
            }
        });

        // 3. EKRANIN BOŞLUĞUNA TIKLAMA OLAYI
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                document.querySelectorAll('.widget-slot.is-active').forEach(slot => {
                    slot.classList.remove('is-active');
                    slot.classList.add('is-closing');
                    setTimeout(() => slot.classList.remove('is-closing'), 250);
                });
            }
        });
    }
};

function ekraniCiz() {
    const secilenRenk = siteVerisi.primary_color || '#ff8800'; 
    temaRenkleriniGuncelle(secilenRenk);
    const colorTrigger = document.getElementById('colorTrigger');
    if (colorTrigger) colorTrigger.style.backgroundColor = secilenRenk;

    
    const metinVeLinkler = siteVerisi.profil_metinleri_ve_linkler || {};
    const bannerEl = document.getElementById('banner-img');
    const bannerContainer = document.querySelector('.banner');
    const pfpEl = document.getElementById('pfp-img');

    if (siteVerisi.profil_gorselleri) {
        // Banner Kontrolü
        if (siteVerisi.profil_gorselleri.banner_url && siteVerisi.profil_gorselleri.banner_url.trim() !== "") {
            if (bannerEl) {
                bannerEl.src = siteVerisi.profil_gorselleri.banner_url;
                bannerEl.style.display = 'block';
            }
            if (bannerContainer) bannerContainer.classList.remove('no-banner');
        } else { 
            if (bannerEl) bannerEl.style.display = 'none';
            if (bannerContainer) bannerContainer.classList.add('no-banner');
        }

        // Profil Fotoğrafı Kontrolü
        if (siteVerisi.profil_gorselleri.pfp_url && siteVerisi.profil_gorselleri.pfp_url.trim() !== "") {
            if (pfpEl) pfpEl.src = siteVerisi.profil_gorselleri.pfp_url;
        } else { 
            if (pfpEl) pfpEl.src = "https://i.ibb.co/8gvf4SNF/pfp-placeholder.png"; 
        }
    }

    const isimEl = document.getElementById('inline-name');
    if (isimEl) {
        const gorunenIsim = metinVeLinkler.gorunen_isim;
        isimEl.textContent = (gorunenIsim && gorunenIsim.trim() !== "") 
            ? gorunenIsim 
            : KULLANICI_ADI.charAt(0).toUpperCase() + KULLANICI_ADI.slice(1);
    }

    const unvanEl = document.getElementById('inline-title');
    const aciklamaEl = document.getElementById('inline-bio');

    if (unvanEl) {
        const unvanMetni = metinVeLinkler.unvan;
        if (unvanMetni) { unvanEl.textContent = unvanMetni; unvanEl.classList.remove('ghost-text'); } 
        else { unvanEl.textContent = isOwner ? "Ünvan Ekle (Örn: Designer)" : ""; if (isOwner) unvanEl.classList.add('ghost-text'); }
    }

    if (aciklamaEl) {
        const bioMetni = metinVeLinkler.aciklama;
        if (bioMetni) { aciklamaEl.textContent = bioMetni; aciklamaEl.classList.remove('ghost-text'); } 
        else { aciklamaEl.textContent = isOwner ? "Kendinden bahset, arşivini tanıt..." : ""; if (isOwner) aciklamaEl.classList.add('ghost-text'); }
    }

    const linksContainer = document.getElementById('profile-links-container');
    const addLinkBtn = document.getElementById('inline-add-link-btn');
    
    if (linksContainer) {
        const linkler = metinVeLinkler.linkler || [];
        linksContainer.innerHTML = ''; 
        const wrapper = document.createElement('div');
        wrapper.id = 'links-wrapper';
        wrapper.style.display = 'contents';

        linkler.forEach(link => {
            const a = document.createElement('a');
            a.className = 'link-item';
            a.href = link.url;
            a.target = '_blank';
            a.rel = 'noopener';
            a.innerHTML = `${getLinkIcon(link.url)} <span>${link.isim}</span>`;
            wrapper.appendChild(a);
        });
        linksContainer.appendChild(wrapper);

        if (addLinkBtn) {
            linksContainer.appendChild(addLinkBtn);
            if (linkler.length > 0) {
                addLinkBtn.textContent = '+';
                addLinkBtn.classList.add('square-add-btn');
                addLinkBtn.title = "Yeni Link Ekle";
            } else {
                addLinkBtn.textContent = '+ Yeni Link';
                addLinkBtn.classList.remove('square-add-btn');
                addLinkBtn.title = "";
            }
            addLinkBtn.style.display = isOwner ? 'flex' : 'none';
        }
    }

    WidgetEngine.ciz();
    
    sekmeleriVeIcerikleriHazirla();
    if (typeof isOwner !== 'undefined' && isOwner) {
        const ayarlarBtn = document.getElementById('settings-trigger-btn');
        if (ayarlarBtn) {
            const metinler = siteVerisi.profil_metinleri_ve_linkler || {};
            const kategoriler = metinler.kategoriler || [];
            const aciklama = metinler.aciklama || '';
            const unvan = metinler.unvan || '';
            const widgetlar = siteVerisi.widgetlar || [];
            
            // Eğer sayfa tamamen boşsa animasyonu başlat, değilse temizle
            const profilBosMu = kategoriler.length === 0 && widgetlar.length === 0 && !aciklama && !unvan;
            
            if (profilBosMu && !(typeof EditManager !== 'undefined' && EditManager.state.isGlobalEditActive)) {
                ayarlarBtn.classList.add('pulse-attention');
            } else {
                ayarlarBtn.classList.remove('pulse-attention');
            }
        }
    }
}

function getLinkIcon(url) {
    if (!url) return '';
    try {
        // Linkin içinden sadece ana site adını (domain) ayıklar (Örn: letterboxd.com)
        const domain = new URL(url).hostname;
        
        // Google Favicon API ile sitenin orijinal logosunu 64px kalitesinde çeker
        return `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=64" alt="Site İkonu">`;
    } catch (e) {
        // Eğer geçersiz bir URL girilirse, sistem çökmesin diye varsayılan zincir SVG'sini verir
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
    }
}

function sekmeleriVeIcerikleriHazirla() {
    const tabsContainer = document.getElementById('content-tabs');
    if (!tabsContainer) return;
    tabsContainer.innerHTML = ''; 

    const metinler = siteVerisi.profil_metinleri_ve_linkler || {};
    let kategoriler = metinler.kategoriler;

    if (!kategoriler) {
        kategoriler = [];
        metinler.kategoriler = kategoriler;
        siteVerisi.profil_metinleri_ve_linkler = metinler;
    }

    if (!kategoriler.find(k => k.id === aktifKategoriId)) {
        aktifKategoriId = kategoriler.length > 0 ? kategoriler[0].id : null;
    }

    EditManager.state.KATEGORI_ARAMA_TURU = {};

    kategoriler.forEach((kat) => {
        EditManager.state.KATEGORI_ARAMA_TURU[kat.id] = kat.tur || 'dizi';

        const btn = document.createElement('button');
        btn.className = `tab ${kat.id === aktifKategoriId ? 'active' : ''}`; 
        
        let iconHtml = '';
        if (kat.url) {
            btn.classList.add('has-link');
            // Yeni fonksiyondan gelen IMG veya SVG etiketini doğrudan basıyoruz
            iconHtml = `<span class="tab-link-icon">${getLinkIcon(kat.url)}</span>`;
        }
        
        btn.innerHTML = `${iconHtml}<span class="tab-text">${kat.ad}</span>`;
        
        if (isOwner) {
            btn.setAttribute('draggable', 'true'); // YENİ: Sekmeler artık taşınabilir
            btn.dataset.id = kat.id; // YENİ: Sürükle bırak için ID veriyoruz

            const editBtn = document.createElement('span');
            editBtn.className = 'tab-edit-badge edit-only';
            editBtn.innerHTML = `<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
            editBtn.title = 'Kategori Ayarları';
            editBtn.onclick = (e) => {
                e.stopPropagation();
                if (!EditManager.state.isGlobalEditActive) return;

                EditManager.state.duzenlenenKategoriId = kat.id;
                
                const editModal = document.getElementById('category-edit-modal');
                const urlInput = document.getElementById('category-edit-url-input');
                const errorBox = document.getElementById('category-edit-error-box');
                
                if (urlInput) urlInput.value = kat.url || '';
                if (errorBox) errorBox.style.display = 'none';
                
                if (editModal) editModal.classList.add('is-open');
            };
            btn.appendChild(editBtn);
        }
        
        let cooldownTimer;
        
        if (kat.id === aktifKategoriId && kat.url) {
            cooldownTimer = setTimeout(() => btn.classList.add('link-ready'), 100); 
        }
        
        btn.addEventListener('click', () => {
            if (kat.id === aktifKategoriId) {
                if (kat.url && btn.classList.contains('link-ready')) {
                    if (!EditManager.state.isGlobalEditActive) { 
                        window.open(kat.url, '_blank');
                    }
                }
                return; 
            }
            
            document.querySelectorAll('.tab').forEach(t => {
                t.classList.remove('active', 'link-ready'); 
            });
            
            btn.classList.add('active');
            aktifKategoriId = kat.id;
            kartlariGriddeListele(siteVerisi.icerik[kat.id] || []);
            
            if (aktifKategoriId === kat.id) { 
                        btn.classList.add('link-ready');
                    }
        });
        tabsContainer.appendChild(btn);
    });

    const contentGrid = document.getElementById('content-grid');
    
    if (kategoriler.length === 0) {
        contentGrid.classList.add('is-empty-grid');
        
        const alreadyRendered = contentGrid.querySelector('.prompt-block') || contentGrid.querySelector('.empty-state-block');
        
        if (!alreadyRendered) {
            if (typeof isOwner !== 'undefined' && isOwner) {
                const ownerMessages = [
                    { text: "Seni zorlayan favori oyunlarını paylaş...", btn: "Paylaş" },
                    { text: "En sevdiğin anime sekanslarını sırala...", btn: "Sırala" },
                    { text: "GFX vizyonuna ilham veren yapımları sergile...", btn: "Sergile" },
                    { text: "Favori stand-up ve podcastlerini derle...", btn: "Derle" }
                ];

                if (typeof window.currentPromptIndex === 'undefined') {
                    window.currentPromptIndex = Math.floor(Math.random() * ownerMessages.length);
                }
                const secilenMesaj = ownerMessages[window.currentPromptIndex];

                contentGrid.innerHTML = `
                    <div class="prompt-block">
                        <div class="prompt-pill">
                            <span class="prompt-text">${secilenMesaj.text}</span>
                        </div>
                        <button class="prompt-btn" id="empty-state-cta-btn">
                            <span>${secilenMesaj.btn}</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                        </button>
                    </div>
                `;

                setTimeout(() => {
                    const ctaBtn = document.getElementById('empty-state-cta-btn');
                    if (ctaBtn) {
                        ctaBtn.addEventListener('click', () => {
                            if (typeof EditManager !== 'undefined' && !EditManager.state.isGlobalEditActive) {
                                EditManager.Global.toggleEditMode();
                            }
                            const catModal = document.getElementById('category-modal');
                            if (catModal) {
                                catModal.classList.add('is-open');
                            }
                        });
                    }
                }, 0);

            } else {
                const visitorMessages = [
                    "Bu alan şimdilik sadece sahibine özel.",
                    "Burada henüz sergilenecek bir arşiv yok.",
                    "Kullanıcı bu köşeyi şimdilik boş tutmayı tercih ediyor."
                ];
                
                if (typeof window.currentVisitorPromptIndex === 'undefined') {
                    window.currentVisitorPromptIndex = Math.floor(Math.random() * visitorMessages.length);
                }
                const rastgeleMesaj = visitorMessages[window.currentVisitorPromptIndex];
                
                contentGrid.innerHTML = `
                    <div class="empty-state-block visitor-mode">
                        <span class="empty-state-text">${rastgeleMesaj}</span>
                    </div>
                `;
            }
        }
    } else {
        contentGrid.classList.remove('is-empty-grid');
        kartlariGriddeListele(siteVerisi.icerik[aktifKategoriId] || []);
    }
}

function kartlariGriddeListele(kartlar) {
    const contentGrid = document.getElementById('content-grid');
    if (!contentGrid) return;
    contentGrid.innerHTML = '';

    kartlar.forEach(kart => {
        const cardEl = document.createElement('div');
        cardEl.className = 'content-card';
        cardEl.dataset.kimlik = kart.kimlik;

        if (isOwner) {
            cardEl.setAttribute('draggable', 'true');
        }

        const thumbEl = document.createElement('div');
        thumbEl.className = 'card-thumb';

        const imgEl = document.createElement('img');
        imgEl.src = kart.gorsel_url || 'Images/placeholder.jpg'; 
        imgEl.alt = kart.baslik;
        imgEl.draggable = false;
        thumbEl.appendChild(imgEl);

        if (isOwner) {
            const silBtnEl = document.createElement('button');
            silBtnEl.className = 'card-delete-btn';
            silBtnEl.type = 'button';
            silBtnEl.title = 'Sil';
            silBtnEl.innerHTML = SIL_IKONU_SVG;
            thumbEl.appendChild(silBtnEl);
        }

        const labelEl = document.createElement('p');
        labelEl.className = 'card-label';
        labelEl.textContent = kart.baslik;

        cardEl.appendChild(thumbEl);
        cardEl.appendChild(labelEl);
        contentGrid.appendChild(cardEl);
    });

    // ==========================================
    // YENİ EKLEME: Hayalet Yuva (Sadece Sahibiyse)
    // ==========================================
    if (isOwner) {
        const doluMu = kartlar.length >= MAKS_ICERIK_SAYISI;
        const ghostCard = document.createElement('div');
        ghostCard.className = 'ghost-add-slot edit-only'; 

        if (doluMu) {
            ghostCard.style.opacity = '0.3';
            ghostCard.style.cursor = 'not-allowed';
            ghostCard.innerHTML = `<span style="font-size: 0.8rem;">Kategori Dolu (12/12)</span>`;
        } else {
            ghostCard.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 5v14m-7-7h14"/>
                </svg>
            `;
            // Hayalet yuvaya tıklanınca Arama Modalını (Ekleme Ekranını) açıyoruz
            ghostCard.addEventListener('click', () => {
                const modal = document.getElementById('search-modal');
                const input = document.getElementById('search-input');
                const results = document.getElementById('search-results');
                if (modal && input) {
                    modal.classList.add('is-open');
                    input.value = '';
                    results.innerHTML = '<p class="search-hint">Aramak istediğin ismi yaz.</p>';
                    setTimeout(() => input.focus(), 50);
                }
            });
        }
        contentGrid.appendChild(ghostCard);
    }
}

function addButonDurumunuGuncelle(mevcutSayi) {
    const addBtn = document.getElementById('add-content-btn');
    if (!addBtn) return;
    if (!isOwner) { addBtn.style.display = 'none'; return; }
    
    addBtn.style.display = 'flex'; 
    const doluMu = mevcutSayi >= MAKS_ICERIK_SAYISI;
    addBtn.disabled = doluMu;
    addBtn.title = doluMu ? 'Bu kategori dolu (12/12)' : 'Yeni Ekle';
}

function ozelOnayAl(mesaj, callback) {
    const modal = document.getElementById('confirm-modal');
    const mesajEl = document.getElementById('confirm-modal-text');
    const btnOk = document.getElementById('confirm-ok-btn');
    const btnCancel = document.getElementById('confirm-cancel-btn');
    const backdrop = document.getElementById('confirm-modal-backdrop');

    if (!modal) { if (confirm(mesaj)) callback(); return; } // Yedeğe düşme durumu

    mesajEl.textContent = mesaj;
    modal.classList.add('is-open');

    const kapat = () => {
        modal.classList.remove('is-open');
        btnOk.onclick = null;
        btnCancel.onclick = null;
        backdrop.onclick = null;
    };

    btnCancel.onclick = () => kapat();
    backdrop.onclick = () => kapat();
    btnOk.onclick = () => { kapat(); callback(); };
}

function toastGoster(mesaj) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = mesaj;
    toast.classList.add('show');
    
    // 3 Saniye sonra kendi kendine kapanır
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

function starfieldOlustur() {
    const field = document.getElementById('starfield');
    if (!field) return;
    
    const count = window.innerWidth < 700 ? 60 : 130;
    for (let i = 0; i < count; i++) {
        const s = document.createElement('div');
        s.className = 'star';
        const size = Math.random() * 2 + 0.6;
        s.style.width = size + 'px';
        s.style.height = size + 'px';
        s.style.top = (Math.random() * 100) + '%';
        s.style.left = (Math.random() * 100) + '%';
        s.style.setProperty('--dur', (3 + Math.random() * 4) + 's');
        s.style.setProperty('--delay', (Math.random() * 4) + 's');
        field.appendChild(s);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // ... senin mevcut DOMContentLoaded kodların ...
    starfieldOlustur(); 
});
// #endregion

// #region 4: LANDING PAGE DİNAMİK PROFİL KARTI MİMARİSİ
(function () {
    const NOOK_PROFILES = [
        {name: "Luna", role: "Professional Backlog Ignorer", bio: "Currently pretending I'll finish Hollow Knight before buying another indie game. My Steam wishlist has become its own ecosystem.", links: ["Steam", "Backloggd", "GitHub"], avatar: "linear-gradient(160deg,#7fdcff,#5b6bff)", accent: "#7fdcff"},
        {name: "Kite", role: "Chronic Tab Hoarder", bio: "137 browser tabs open, 4 of them are things I actually need. The rest are just... company, I guess.", links: ["GitHub", "Letterboxd"], avatar: "linear-gradient(160deg,#ffb26b,#f2795c)", accent: "#ffb26b"},
        {name: "Mira", role: "Part-Time Main Character", bio: "Ranks anime openings more seriously than actual life decisions. Currently three rewatches deep into Frieren.", links: ["AniList", "Spotify", "Twitch"], avatar: "linear-gradient(160deg,#c98bff,#7a5cff)", accent: "#c98bff"},
        {name: "Dex", role: "Undefeated at Losing Save Files", bio: "Lost 40 hours of a Stardew Valley save to a coffee spill. Rebuilt the farm out of spite. It's better now.", links: ["Steam", "itch.io", "GitHub"], avatar: "linear-gradient(160deg,#8fe38f,#3fae6a)", accent: "#8fe38f"},
        {name: "Sable", role: "Freelance Vibes Consultant", bio: "Designs interfaces, then spends four hours picking the border-radius. It's a whole personality now.", links: ["Dribbble", "Behance", "GitHub"], avatar: "linear-gradient(160deg,#ff9ecf,#c15cff)", accent: "#ff9ecf"},
        {name: "Rook", role: "Amateur Speedrunner, Professional Rage Quitter", bio: "PB is 12:04. Personal worst is throwing the controller across the room at 11:58. Working on both.", links: ["Twitch", "YouTube"], avatar: "linear-gradient(160deg,#ffd166,#f2a93b)", accent: "#ffd166"},
        {name: "Wren", role: "Self-Appointed Playlist Curator", bio: "Makes a new playlist for every mood, every season, and one specifically for 'walking home in the rain thinking about anime.'", links: ["Spotify", "Letterboxd"], avatar: "linear-gradient(160deg,#6be7d4,#3f9ea8)", accent: "#6be7d4"},
        {name: "Nyx", role: "Full-Time Manga Chapter Refresher", bio: "Checks for new chapters every day at 9am like it's a job. Technically it kind of is now.", links: ["AniList", "GitHub", "Bionluk"], avatar: "linear-gradient(160deg,#a29bfe,#6c5ce7)", accent: "#a29bfe"},
        {name: "Ash", role: "Certified Overthinker of Character Builds", bio: "Spent longer theorycrafting a Baldur's Gate 3 party comp than actually playing the game. No regrets.", links: ["Steam", "GitHub"], avatar: "linear-gradient(160deg,#ff8a65,#d84315)", accent: "#ff8a65"},
        {name: "Yuki", role: "Backyard Astronomer, Indoor Cat", bio: "Owns a telescope. Has used it twice. Mostly just likes knowing it's there, like a very expensive houseplant.", links: ["GitHub", "Letterboxd", "Spotify"], avatar: "linear-gradient(160deg,#89c4f4,#3468c0)", accent: "#89c4f4"}
    ];

    const STORAGE_PREFIX = "nook_last_profile__";

    function pickRandomIndex(poolLength, excludeIndex) {
        if (poolLength <= 1) return 0;
        let index;
        do { index = Math.floor(Math.random() * poolLength); } while (index === excludeIndex);
        return index;
    }

    function getLastIndex(key) {
        try {
            const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
            return raw === null ? -1 : parseInt(raw, 10);
        } catch (e) { return -1; }
    }

    function setLastIndex(key, index) {
        try { window.localStorage.setItem(STORAGE_PREFIX + key, String(index)); } catch (e) {}
    }

    function initials(name) { return name.trim().charAt(0).toUpperCase(); }

    function render(container, profile) {
    // Profilin kendi accent rengi yoksa Nook'un orijinal kehribar rengini kullanır
    const liveAccent = profile.accent || "var(--amber-2)";
    container.style.setProperty('--nook-accent-live', liveAccent);

    container.innerHTML = `
    <div class="nook-card__body">
        <div class="nook-card__avatar" style="background:${profile.avatar}">
        ${initials(profile.name)}
        </div>
        <div class="nook-card__name">${profile.name}</div>
        
        <!-- Ünvan rengi dinamik değişkenden çekiliyor ve başına ikonik nokta eklendi -->
        <div class="nook-card__role" style="color: var(--nook-accent-live);">
            <span style="opacity: 0.5; margin-right: 4px;">•</span>${profile.role}
        </div>
        
        <div class="nook-card__bio">${profile.bio}</div>
        <div class="nook-card__links">
        ${profile.links.map(l => `<span class="nook-card__chip">${l}</span>`).join("")}
        </div>
    </div>
    `;
}

    function mount(container) {
        const key = container.dataset.nookKey || "global";
        const lastIndex = getLastIndex(key);
        const nextIndex = pickRandomIndex(NOOK_PROFILES.length, lastIndex);
        setLastIndex(key, nextIndex);
        render(container, NOOK_PROFILES[nextIndex]);
    }

    function mountAll() { document.querySelectorAll("[data-nook-card]").forEach(mount); }

    window.NookProfileCard = { mountAll, mount, profiles: NOOK_PROFILES };
    document.addEventListener("DOMContentLoaded", mountAll);
})();
// #endregion

// #region 5: LANDING PAGE 3D FLIP KONTROLÜ
document.addEventListener('DOMContentLoaded', () => {
    const flipCardInner = document.getElementById('hero-flip-card');
    const visualWrapper = document.querySelector('.tilted-visual-wrapper');
    
    // Tetikleyici Butonlar
    const btnLogin = document.getElementById('hero-login-btn'); 
    const btnStart = document.getElementById('hero-start-btn'); // Hero sol taraftaki start butonu
    const btnFrontCard = document.getElementById('flip-front-trigger'); // Profil kartının kendisine tıklamak
    const btnCloseBack = document.getElementById('flip-back-btn'); // Formun içindeki X butonu

    // Döndürme ve Düzleştirme Fonksiyonu
    const toggleFlip = (e) => {
        if(e) e.stopPropagation();
        
        // İç kartı 180 derece çevir
        if(flipCardInner) flipCardInner.classList.toggle('is-flipped');
        
        // Dış kasayı düzleştir ve büyüt
        if(visualWrapper) visualWrapper.classList.toggle('is-flat');
    };

    // Dinleyicileri Ekle
    if(btnLogin) btnLogin.addEventListener('click', toggleFlip);
    if(btnStart) btnStart.addEventListener('click', toggleFlip);
    if(btnFrontCard) btnFrontCard.addEventListener('click', toggleFlip);
    if(btnCloseBack) btnCloseBack.addEventListener('click', toggleFlip);
});
// #endregion

// #region 6: RENK SEÇİCİ (HSV/RGB) MATEMATİK MOTORLARI
function hexToRgb(hex) {
    return {
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16)
    };
}

function rgbToHex(r, g, b) {
    const toHex = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
        switch (max) {
            case r: h = ((g - b) / d) % 6; break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
        if (h < 0) h += 360;
    }
    return { h, s: (max === 0 ? 0 : d / max) * 100, v: max * 100 };
}

function hsvToRgb(h, s, v) {
    s /= 100; v /= 100;
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    let r, g, b;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}
// #endregion

// #endregion

// #region BLOK 2: DÜZENLEME YÖNETİCİSİ (EDIT MANAGER)
const EditManager = {
    
    // #region 0. STATE (ORTAK HAFIZA)
    state: {
        isGlobalEditActive: false,
        hasUnsavedChanges: false,
        orijinalVeri: null, // İptal edilirse geri döneceğimiz güvenli liman
        
        isProfileEditing: false,
        tempProfileLinks: [],
        aramaZamanlayici: null,
        KATEGORI_ARAMA_TURU: { animeler: 'anime', diziler: 'dizi', filmler: 'film', oyunlar: 'oyun' }
    },
    // #endregion

    // #region 0.5 GLOBAL MOD YÖNETİMİ
    Global: {
        baslat() {
            const settingsBtn = document.getElementById('settings-trigger-btn');
            const cancelBtn = document.getElementById('edit-cancel-btn');
            const saveBtn = document.getElementById('edit-save-btn');

            if (!settingsBtn) return;
            settingsBtn.style.display = 'flex';

            settingsBtn.addEventListener('click', () => this.toggleEditMode());
            // Sıfırla butonuna basıldığında false gönderiyoruz (Yani tamamen çıkma, sadece veriyi sıfırla)
            if (cancelBtn) cancelBtn.addEventListener('click', () => this.sifirla(false));
            if (saveBtn) saveBtn.addEventListener('click', () => this.kaydet());
        },

        toggleEditMode() {
            EditManager.state.isGlobalEditActive = !EditManager.state.isGlobalEditActive;
            
            if (EditManager.state.isGlobalEditActive) {
                document.body.classList.add('global-edit-mode');
                EditManager.state.orijinalVeri = JSON.parse(JSON.stringify(siteVerisi));
                
                // Mod açıldığında Profil inputlarını devreye sok
                EditManager.Profile.duzenlemeyeGec();
            } else {
                if (EditManager.state.hasUnsavedChanges) {
                    const onay = confirm("Kaydedilmemiş değişiklikler var. Çıkmak istediğine emin misin?");
                    if (!onay) {
                        EditManager.state.isGlobalEditActive = true; 
                        return;
                    }
                }
                // Ayarlar butonuna basıp çıkmak istenirse true (tam çıkış) gönderiyoruz
                this.sifirla(true);
            }
        },

        degisiklikYapildi() {
            if (EditManager.state.orijinalVeri) {
                const guncelVeriString = JSON.stringify(siteVerisi);
                const orijinalVeriString = JSON.stringify(EditManager.state.orijinalVeri);

                EditManager.state.hasUnsavedChanges = (guncelVeriString !== orijinalVeriString);
            } else {
                EditManager.state.hasUnsavedChanges = true;
            }

            if (EditManager.state.hasUnsavedChanges) {
                document.body.classList.add('has-unsaved-changes');
            } else {
                document.body.classList.remove('has-unsaved-changes');
            }
        },

        sifirla(tamCikis = false) {
            EditManager.state.hasUnsavedChanges = false;
            document.body.classList.remove('has-unsaved-changes');
            
            if (EditManager.state.orijinalVeri) {
                siteVerisi = JSON.parse(JSON.stringify(EditManager.state.orijinalVeri));
            }
            
            // ÇÖZÜM 1: Ekranı her şeyden ÖNCE çiziyoruz. Böylece inputlar ezilmiyor.
            try {
                ekraniCiz(); 
            } catch(error) {
                console.error("Çizim hatası yakalandı:", error);
            }

            if (tamCikis) {
                document.body.classList.remove('global-edit-mode');
                EditManager.state.isGlobalEditActive = false;
                EditManager.state.orijinalVeri = null;
                EditManager.Profile.duzenlemedenCik();
            } else {
                EditManager.Profile.duzenlemeyeGec(); 
            }
        },

        async kaydet() {
            if (!EditManager.state.hasUnsavedChanges) return;

            // ============================================================
            // YENİ: VİDGET GÜVENLİK KONTROLÜ (Boş widget kaydetmeyi engelle)
            // ============================================================
            if (siteVerisi.widgetlar && siteVerisi.widgetlar.length > 0) {
                let bosWidgetVarMi = false;
                
                siteVerisi.widgetlar.forEach((widget, index) => {
                    if (widget && widget.ayarlar) {
                        // Eğer içi boş bir alan varsa (Gelecekte diğer widget türleri için de burası genişletilebilir)
                        if (!widget.ayarlar.kullanici || widget.ayarlar.kullanici.trim() === '') {
                            bosWidgetVarMi = true;
                            
                            // Ekrandaki o spesifik boş widget kutusunu bul
                            const container = document.getElementById('widgets-container');
                            if (container) {
                                const slot = container.querySelector(`.widget-slot[data-index="${index}"]`);
                                if (slot) {
                                    // CSS'te zaten var olan sarsılma ve kırmızı olma animasyonunu ekle
                                    slot.classList.add('shake-box-animation');
                                    
                                    // Animasyon bitince class'ı temizle ki tekrar hata yaparsa yine titreyebilsin
                                    setTimeout(() => slot.classList.remove('shake-box-animation'), 400);
                                }
                            }
                        }
                    }
                });

                // Eğer boş widget bulunduysa, işlemi burada kes (Sunucuya gitme)
                if (bosWidgetVarMi) {
                    toastGoster("Lütfen eklediğiniz widget'ı doldurun veya silin!");
                    
                    // İşlem çubuğundaki butonu tekrar aktif et ki kullanıcı düzelttikten sonra basabilsin
                    const saveBtn = document.getElementById('edit-save-btn');
                    if(saveBtn) {
                        saveBtn.classList.add('shake-box-animation');
                        setTimeout(() => saveBtn.classList.remove('shake-box-animation'), 400);
                    }
                    return; 
                }
            }
            // ============================================================

            const saveBtn = document.getElementById('edit-save-btn');
            saveBtn.textContent = "İşleniyor...";
            saveBtn.disabled = true;

            try {
                // Supabase'e güncel veriyi gönderiyoruz
                const { error } = await supabaseClient
                    .from('profiles')
                    .update({
                        primary_color: siteVerisi.primary_color,
                        profil_metinleri_ve_linkler: siteVerisi.profil_metinleri_ve_linkler,
                        profil_gorselleri: siteVerisi.profil_gorselleri,
                        widgetlar: siteVerisi.widgetlar,
                        icerik: siteVerisi.icerik
                    })
                    .eq('auth_id', siteVerisi.profil_sahibi_id);

                if (error) throw error; 

                EditManager.state.orijinalVeri = JSON.parse(JSON.stringify(siteVerisi));
                this.sifirla(true);
                
                saveBtn.textContent = "Onayla";
                saveBtn.disabled = false;
                toastGoster("Değişiklikler başarıyla kaydedildi!");

            } catch (err) {
                console.error("Veritabanı Kayıt Hatası:", err);
                toastGoster("Kayıt sırasında bir hata oluştu!"); 
                
                saveBtn.textContent = "Onayla";
                saveBtn.disabled = false;
            }
        }
    },
    // #endregion

    // #region 1. YARDIMCI API FONKSİYONLARI
    async edgeCagir(payload) {
        const token = aktifKullaniciOturumu ? aktifKullaniciOturumu.access_token : SUPABASE_ANON_KEY;
        const response = await fetch('https://acvpjytvkfxbsuiivqir.supabase.co/functions/v1/bright-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `HTTP Hatası: ${response.status}`);
        return data;
    },

    async icerikAra(sorgu, kategoriId) {
        const aramaTuru = this.state.KATEGORI_ARAMA_TURU[kategoriId];
        if (!aramaTuru) return [];
        try {
            const data = await this.edgeCagir({ action: 'search', arama_metni: sorgu, arama_turu: aramaTuru });
            return data.sonuclar || [];
        } catch (err) { console.error('Arama hatası:', err); return []; }
    },
    // #endregion

    // #region 2. İÇERİK YÖNETİMİ (Arama, Ekleme, Silme, Sürükle-Bırak)
    Content: {
        // --- ANA BAŞLATICI ---
        baslat() {
            this.kategoriEklemeSisteminiKur();
            this.kategoriDuzenlemeSisteminiKur();
            this.sekmeSurukleBirakSisteminiKur();
            this.aramaMotorunuKur();
            this.icerikSilmeSisteminiKur();
            this.surukleBirakSisteminiKur();
        },

        // --- 1. KATEGORİ EKLEME MANTIĞI ---
        kategoriEklemeSisteminiKur() {
            const addCategoryBtn = document.getElementById('add-content-btn');
            const catModal = document.getElementById('category-modal');
            const catBackdrop = document.getElementById('category-modal-backdrop');
            const catCloseBtn = document.getElementById('category-modal-close');
            const catSubmitBtn = document.getElementById('category-submit-btn');
            const catErrorBox = document.getElementById('category-error-box');
            const gridContainer = document.getElementById('custom-category-select');
            const catUrlInput = document.getElementById('category-url-input');

            if (!addCategoryBtn || !catModal || !gridContainer) return;

            if (gridContainer.children.length === 0) {
                Object.entries(SABIT_KATEGORILER).forEach(([key, data]) => {
                    const btn = document.createElement('button');
                    btn.className = 'category-option-btn';
                    btn.type = 'button';
                    btn.dataset.value = key;
                    btn.innerHTML = `${data.ikon}<span>${data.ad}</span>`;
                    gridContainer.appendChild(btn);
                });
            }

            const optionBtns = gridContainer.querySelectorAll('.category-option-btn');
            let secilenTur = 'film'; 

            const modaliKapat = () => catModal.classList.remove('is-open');

            addCategoryBtn.addEventListener('click', () => {
                if (!EditManager.state.isGlobalEditActive) return;
                
                catErrorBox.style.display = 'none';
                secilenTur = 'film';
                
                optionBtns.forEach(b => {
                    b.classList.remove('active');
                    if(b.dataset.value === 'film') b.classList.add('active');
                });
                
                catModal.classList.add('is-open');
            });

            optionBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    optionBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    secilenTur = btn.dataset.value;
                });
            });

            catCloseBtn.addEventListener('click', modaliKapat);
            catBackdrop.addEventListener('click', modaliKapat);

            catSubmitBtn.addEventListener('click', () => {
                const metinler = siteVerisi.profil_metinleri_ve_linkler || {};
                const kategoriler = metinler.kategoriler || [];
                
                if (kategoriler.find(k => k.id === secilenTur)) {
                    catErrorBox.textContent = "Bu kategori zaten arşivinizde mevcut.";
                    catErrorBox.style.display = 'block';
                    catErrorBox.classList.add('shake-box-animation');
                    setTimeout(() => catErrorBox.classList.remove('shake-box-animation'), 400);
                    return;
                }

                let girilenUrl = catUrlInput ? catUrlInput.value.trim() : "";
                if (girilenUrl && !girilenUrl.startsWith('http')) {
                    girilenUrl = 'https://' + girilenUrl;
                }
                
                kategoriler.push({ 
                    id: secilenTur, 
                    ad: SABIT_KATEGORILER[secilenTur].ad, 
                    tur: secilenTur,
                    url: girilenUrl 
                });
                
                metinler.kategoriler = kategoriler;
                siteVerisi.profil_metinleri_ve_linkler = metinler;
                if (!siteVerisi.icerik[secilenTur]) siteVerisi.icerik[secilenTur] = []; 
                
                aktifKategoriId = secilenTur; 
                
                if(catUrlInput) catUrlInput.value = ''; 

                EditManager.Global.degisiklikYapildi();
                sekmeleriVeIcerikleriHazirla();
                modaliKapat();
            });
        },

        kategoriDuzenlemeSisteminiKur() {
            const editModal = document.getElementById('category-edit-modal');
            const backdrop = document.getElementById('category-edit-modal-backdrop');
            const closeBtn = document.getElementById('category-edit-modal-close');
            const submitBtn = document.getElementById('category-edit-submit-btn');
            const deleteBtn = document.getElementById('category-edit-delete-btn');
            const urlInput = document.getElementById('category-edit-url-input');

            if (!editModal) return;

            const modaliKapat = () => editModal.classList.remove('is-open');

            closeBtn.addEventListener('click', modaliKapat);
            backdrop.addEventListener('click', modaliKapat);

            // Linki Güncelleme İşlemi
            submitBtn.addEventListener('click', () => {
                const metinler = siteVerisi.profil_metinleri_ve_linkler || {};
                const kategoriler = metinler.kategoriler || [];
                const duzenlenenId = EditManager.state.duzenlenenKategoriId;

                let girilenUrl = urlInput.value.trim();
                if (girilenUrl && !girilenUrl.startsWith('http')) {
                    girilenUrl = 'https://' + girilenUrl;
                }

                const index = kategoriler.findIndex(k => k.id === duzenlenenId);
                if (index !== -1) {
                    kategoriler[index].url = girilenUrl;
                }

                EditManager.Global.degisiklikYapildi();
                sekmeleriVeIcerikleriHazirla();
                modaliKapat();
            });

            // Kategoriyi Komple Silme İşlemi
            deleteBtn.addEventListener('click', () => {
                const duzenlenenId = EditManager.state.duzenlenenKategoriId;
                const metinler = siteVerisi.profil_metinleri_ve_linkler || {};
                const kategoriler = metinler.kategoriler || [];
                const kategori = kategoriler.find(k => k.id === duzenlenenId);

                if (!kategori) return;

                ozelOnayAl(`"${kategori.ad}" kategorisini ve içindeki tüm afişleri silmek istediğine emin misin?`, () => {
                    metinler.kategoriler = kategoriler.filter(k => k.id !== duzenlenenId);
                    delete siteVerisi.icerik[duzenlenenId]; 
                    
                    // Silinen kategori ekranda açıksa diğerine atla
                    if (aktifKategoriId === duzenlenenId) {
                        aktifKategoriId = metinler.kategoriler.length > 0 ? metinler.kategoriler[0].id : null;
                    }

                    EditManager.Global.degisiklikYapildi();
                    sekmeleriVeIcerikleriHazirla(); 
                    modaliKapat();
                });
            });
        },

        sekmeSurukleBirakSisteminiKur() {
            const tabsContainer = document.getElementById('content-tabs');
            if (!tabsContainer) return;

            tabsContainer.addEventListener('dragstart', (e) => {
                if (!EditManager.state.isGlobalEditActive) {
                    e.preventDefault(); 
                    return;
                }
                
                const tab = e.target.closest('.tab');
                if (!tab) { e.preventDefault(); return; }
                
                tab.classList.add('is-dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', tab.dataset.id); 
            });

            tabsContainer.addEventListener('dragover', (e) => {
                if (!EditManager.state.isGlobalEditActive) return;
                e.preventDefault(); 

                const draggingTab = tabsContainer.querySelector('.is-dragging');
                if (!draggingTab) return;

                const targetTab = e.target.closest('.tab:not(.is-dragging)');

                if (targetTab) {
                    const box = targetTab.getBoundingClientRect();
                    const offset = e.clientX - box.left;
                    
                    if (offset > box.width / 2) {
                        targetTab.after(draggingTab);
                    } else {
                        targetTab.before(draggingTab);
                    }
                }
            });

            tabsContainer.addEventListener('dragend', (e) => {
                if (!EditManager.state.isGlobalEditActive) return;
                
                const draggingTab = e.target.closest('.tab');
                if (draggingTab) {
                    draggingTab.classList.remove('is-dragging');
                }

                // Sürükleme bitince yeni dizilimi DOM'dan okuyup State'e geçiriyoruz
                const guncelSekmeElementleri = [...tabsContainer.querySelectorAll('.tab')];
                const yeniSiralamaIdleri = guncelSekmeElementleri.map(el => el.dataset.id);
                
                const metinler = siteVerisi.profil_metinleri_ve_linkler || {};
                const eskiKategoriler = metinler.kategoriler || [];
                const eskiSiralamaIdleri = eskiKategoriler.map(k => k.id);

                if (yeniSiralamaIdleri.join(',') !== eskiSiralamaIdleri.join(',')) {
                    const yeniKategoriler = [];
                    yeniSiralamaIdleri.forEach(id => {
                        const kat = eskiKategoriler.find(k => k.id === id);
                        if (kat) yeniKategoriler.push(kat);
                    });
                    
                    metinler.kategoriler = yeniKategoriler;
                    EditManager.Global.degisiklikYapildi();
                }
            });
        },

        // --- 2. İÇERİK ARAMA VE EKLEME MANTIĞI ---
        aramaMotorunuKur() {
            const searchModal = document.getElementById('search-modal');
            const searchBackdrop = document.getElementById('search-modal-backdrop');
            const searchCloseBtn = document.getElementById('search-modal-close');
            const searchInput = document.getElementById('search-input');
            const searchResults = document.getElementById('search-results');

            if (!searchModal || !searchInput || !searchResults) return;

            const modaliKapat = () => {
                searchModal.classList.remove('is-open');
                clearTimeout(EditManager.state.aramaZamanlayici);
            };

            // Kapatma Tetikleyicileri
            searchCloseBtn.addEventListener('click', modaliKapat);
            searchBackdrop.addEventListener('click', modaliKapat);
            
            // Arama İşlemi
            searchInput.addEventListener('input', () => {
                const sorgu = searchInput.value.trim();
                clearTimeout(EditManager.state.aramaZamanlayici);
                if (sorgu.length < 2) { searchResults.innerHTML = '<p class="search-hint">Aramak istediğin ismi yaz.</p>'; return; }
                searchResults.innerHTML = '<p class="search-loading">Aranıyor...</p>';
                
                EditManager.state.aramaZamanlayici = setTimeout(async () => {
                    const sonuclar = await EditManager.icerikAra(sorgu, aktifKategoriId);
                    
                    searchResults.innerHTML = '';
                    if (!sonuclar || sonuclar.length === 0) { searchResults.innerHTML = '<p class="search-empty">Sonuç bulunamadı.</p>'; return; }

                    sonuclar.forEach(sonuc => {
                        const cardEl = document.createElement('div');
                        cardEl.className = 'search-result-card';

                        const thumbDiv = document.createElement('div');
                        thumbDiv.className = 'search-result-thumb';
                        const imgEl = document.createElement('img');
                        imgEl.src = sonuc.gorsel_url || 'Images/placeholder.jpg';
                        thumbDiv.appendChild(imgEl);

                        const labelEl = document.createElement('p');
                        labelEl.className = 'search-result-label';
                        labelEl.textContent = sonuc.baslik;

                        cardEl.appendChild(thumbDiv);
                        cardEl.appendChild(labelEl);
                        
                        cardEl.addEventListener('click', () => {
                            if (!aktifKategoriId) return;
                            
                            const kaydedilenKart = {
                                kimlik: 'local_' + Date.now(), 
                                baslik: sonuc.baslik,
                                gorsel_url: sonuc.gorsel_url || 'Images/placeholder.jpg'
                            };

                            if (!siteVerisi.icerik[aktifKategoriId]) siteVerisi.icerik[aktifKategoriId] = [];
                            siteVerisi.icerik[aktifKategoriId].push(kaydedilenKart);
                            
                            kartlariGriddeListele(siteVerisi.icerik[aktifKategoriId]);
                            EditManager.Global.degisiklikYapildi(); 
                            modaliKapat();
                        });
                        searchResults.appendChild(cardEl);
                    });
                }, 350);
            });

            // ESC Tuşu Kontrolü (Her İki Modalı da Kapatır)
            document.addEventListener('keydown', (e) => { 
                if (e.key === 'Escape') {
                    if (searchModal.classList.contains('is-open')) modaliKapat();
                    const catModal = document.getElementById('category-modal');
                    if (catModal && catModal.classList.contains('is-open')) catModal.classList.remove('is-open');
                }
            });
        },

        // --- 3. İÇERİK KARTI SİLME MANTIĞI (İki Adımlı Onay) ---
        icerikSilmeSisteminiKur() {
            const contentGrid = document.getElementById('content-grid');
            if (!contentGrid) return;

            contentGrid.addEventListener('click', (e) => {
                if (!EditManager.state.isGlobalEditActive) return;

                const silBtn = e.target.closest('.card-delete-btn');
                if (!silBtn) return;

                const cardEl = silBtn.closest('.content-card');
                if (!cardEl) return;

                // İlk tıklama: Onay iste
                if (!silBtn.classList.contains('confirm-delete')) {
                    silBtn.classList.add('confirm-delete');
                    silBtn.innerHTML = TIK_IKONU_SVG;
                    silBtn.title = 'Silmek için tekrar tıkla';
                    clearTimeout(silBtn._geriDonTimeout);
                    
                    silBtn._geriDonTimeout = setTimeout(() => {
                        silBtn.classList.remove('confirm-delete');
                        silBtn.innerHTML = SIL_IKONU_SVG;
                        silBtn.title = 'Sil';
                    }, 3000);
                    return;
                }

                // İkinci tıklama: Sil
                clearTimeout(silBtn._geriDonTimeout);
                const kimlik = cardEl.dataset.kimlik;
                if (!kimlik || !aktifKategoriId) return;
                
                siteVerisi.icerik[aktifKategoriId] = siteVerisi.icerik[aktifKategoriId].filter(k => k.kimlik !== kimlik);
                kartlariGriddeListele(siteVerisi.icerik[aktifKategoriId]);
                EditManager.Global.degisiklikYapildi(); 
            });
        },

        // --- 4. SÜRÜKLE-BIRAK (DRAG & DROP) SIRALAMA MANTIĞI ---
        surukleBirakSisteminiKur() {
            const contentGrid = document.getElementById('content-grid');
            if (!contentGrid) return;

            // Sürükleme Başladığında
            contentGrid.addEventListener('dragstart', (e) => {
                if (!EditManager.state.isGlobalEditActive) {
                    e.preventDefault(); 
                    return;
                }
                
                const card = e.target.closest('.content-card');
                if (!card || card.classList.contains('ghost-add-slot')) {
                    e.preventDefault();
                    return;
                }
                
                card.classList.add('is-dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', 'dragging'); 
            });

            // Sürükleme Esnasında
            contentGrid.addEventListener('dragover', (e) => {
                if (!EditManager.state.isGlobalEditActive) return;
                e.preventDefault(); 

                const draggingCard = contentGrid.querySelector('.is-dragging');
                if (!draggingCard) return;

                const targetCard = e.target.closest('.content-card:not(.is-dragging)');
                const ghostSlot = contentGrid.querySelector('.ghost-add-slot');

                if (targetCard && targetCard !== ghostSlot) {
                    const box = targetCard.getBoundingClientRect();
                    const offset = e.clientX - box.left;
                    
                    if (offset > box.width / 2) {
                        targetCard.after(draggingCard);
                    } else {
                        targetCard.before(draggingCard);
                    }
                }
            });

            // Sürükleme Bittiğinde
            contentGrid.addEventListener('dragend', (e) => {
                if (!EditManager.state.isGlobalEditActive) return;
                
                const draggingCard = e.target.closest('.content-card');
                if (draggingCard) {
                    draggingCard.classList.remove('is-dragging');
                }

                // Sıralamayı Oku
                const guncelSiraElementleri = [...contentGrid.querySelectorAll('.content-card:not(.ghost-add-slot)')];
                const yeniSiralamaKimlikleri = guncelSiraElementleri.map(el => el.dataset.kimlik);
                
                const eskiDizi = siteVerisi.icerik[aktifKategoriId] || [];
                const eskiSiralamaKimlikleri = eskiDizi.map(k => k.kimlik);

                // Değişiklik Kontrolü ve Kayıt
                if (yeniSiralamaKimlikleri.join(',') !== eskiSiralamaKimlikleri.join(',')) {
                    const yeniDizi = [];
                    yeniSiralamaKimlikleri.forEach(kimlik => {
                        const kart = eskiDizi.find(k => k.kimlik === kimlik);
                        if (kart) yeniDizi.push(kart);
                    });
                    
                    siteVerisi.icerik[aktifKategoriId] = yeniDizi;
                    EditManager.Global.degisiklikYapildi();
                }
            });
        }
    },
    // #endregion
 
    // #region 3. MEDYA YÖNETİMİ (PFP ve Banner)
    Media: {
        async yukleVeGuncelle(file, tur) {
            if (!aktifKullaniciOturumu) return;
            const authId = aktifKullaniciOturumu.user.id;
            const fileExt = file.name.split('.').pop();
            const fileName = `${tur}-${Date.now()}.${fileExt}`; 
            const filePath = `${authId}/${fileName}`; 

            try {
                // 1. Görselin ekranda görünebilmesi için Supabase Storage'a atılması şart
                const { error: uploadError } = await supabaseClient.storage.from('avatars-and-banners').upload(filePath, file);
                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabaseClient.storage.from('avatars-and-banners').getPublicUrl(filePath);
                const publicUrl = publicUrlData.publicUrl;

                // 2. VERİTABANINA YAZMA İPTAL. Sadece anlık veriyi güncelliyoruz.
                const yeniGorseller = { ...siteVerisi.profil_gorselleri };
                if (tur === 'banner') yeniGorseller.banner_url = publicUrl;
                if (tur === 'pfp') yeniGorseller.pfp_url = publicUrl;

                siteVerisi.profil_gorselleri = yeniGorseller;
                
                // 3. Değişiklik yapıldığını sisteme bildir ve ekranı çiz
                EditManager.Global.degisiklikYapildi();
                ekraniCiz(); 
                
                if (EditManager.state.isGlobalEditActive) {
                    EditManager.Profile.duzenlemeyeGec();
                }

            } catch (error) {
                alert(`Görsel yüklenirken bir hata oluştu: ${error.message}`);
            }
        },
        baslat() {
            const bannerOverlay = document.getElementById('banner-edit-overlay');
            const bannerInput = document.getElementById('banner-file-input');
            const pfpOverlay = document.getElementById('pfp-edit-overlay');
            const pfpInput = document.getElementById('pfp-file-input');

            if (bannerOverlay && bannerInput) {
                bannerOverlay.addEventListener('click', () => bannerInput.click());
                bannerInput.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const textSpan = bannerOverlay.querySelector('span');
                        textSpan.textContent = "Yükleniyor..."; 
                        await EditManager.Media.yukleVeGuncelle(file, 'banner');
                        textSpan.textContent = "Değiştir"; 
                    }
                });
            }

            if (pfpOverlay && pfpInput) {
                pfpOverlay.addEventListener('click', () => pfpInput.click());
                pfpInput.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        // Yükleniyor görsel durumu
                        pfpOverlay.style.opacity = "1"; 
                        pfpOverlay.innerHTML = `<span style="font-size: 0.6rem; font-weight: bold;">Yükleniyor...</span>`;
                        
                        await EditManager.Media.yukleVeGuncelle(file, 'pfp');
                        
                        // Yükleme bitince eski kalem ikonuna dön
                        pfpOverlay.style.opacity = ""; 
                        pfpOverlay.innerHTML = `
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                        `;
                    }
                });
            }
        }
    },
    // #endregion

    // #region 4. WIDGET YÖNETİMİ
    Widget: {
        modalBaslat() {
            const modal = document.getElementById('widget-selection-modal');
            const closeBtn = document.getElementById('widget-modal-close');
            const backdrop = document.getElementById('widget-modal-backdrop');
            const buttons = document.querySelectorAll('.widget-select-btn:not(.disabled)');

            if (!modal) return;

            const modaliKapat = () => modal.classList.remove('is-open');

            if (closeBtn) closeBtn.addEventListener('click', modaliKapat);
            if (backdrop) backdrop.addEventListener('click', modaliKapat);

            // Her bir widget butonuna tıklama olayı
            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const type = btn.dataset.type;
                    if (!siteVerisi.widgetlar) siteVerisi.widgetlar = [];
                    
                    // 1. Seçilen türü array'in sonuna ekle
                    siteVerisi.widgetlar.push({ tur: type, ayarlar: { kullanici: '' } });
                    
                    // 2. Önbelleği temizle (eski veriler bulaşmasın)
                    if(type === 'monkeytype') siteVerisi.monkeytype_skorlari = null;
                    
                    // 3. Ekranı çiz ve state'i uyar
                    WidgetEngine.ciz();
                    EditManager.Global.degisiklikYapildi();
                    
                    // 4. Kullanıcının yazabilmesi için inputa odaklan
                    setTimeout(() => {
                        const newIndex = siteVerisi.widgetlar.length - 1;
                        const container = document.getElementById('widgets-container');
                        const newInput = container.querySelector(`.widget-slot[data-index="${newIndex}"] .widget-username-input`);
                        if (newInput) newInput.focus();
                    }, 50);

                    // İşlem bitince modalı kapat
                    modaliKapat();
                });
            });
        },

        surukleBirakSisteminiKur() {
            const container = document.getElementById('widgets-container');
            if (!container) return;

            container.addEventListener('dragstart', (e) => {
                if (!EditManager.state.isGlobalEditActive) { e.preventDefault(); return; }
                const slot = e.target.closest('.widget-slot');
                
                // Sadece is-draggable sınıfı olanlar (dolu widgetlar) sürüklenebilir
                if (!slot || !slot.classList.contains('is-draggable')) { e.preventDefault(); return; }
                
                slot.classList.add('is-dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', slot.dataset.index); 
            });

            container.addEventListener('dragover', (e) => {
                if (!EditManager.state.isGlobalEditActive) return;
                e.preventDefault();

                const draggingSlot = container.querySelector('.is-dragging');
                if (!draggingSlot) return;

                const targetSlot = e.target.closest('.widget-slot:not(.is-dragging)');
                if (targetSlot) {
                    const box = targetSlot.getBoundingClientRect();
                    // Widget'lar alt alta dizildiği için Y eksenini (yukarı/aşağı) kontrol ediyoruz
                    const offset = e.clientY - box.top;
                    
                    if (offset > box.height / 2) {
                        targetSlot.after(draggingSlot);
                    } else {
                        targetSlot.before(draggingSlot);
                    }
                }
            });

            container.addEventListener('dragend', (e) => {
                if (!EditManager.state.isGlobalEditActive) return;
                const draggingSlot = e.target.closest('.widget-slot');
                if (draggingSlot) draggingSlot.classList.remove('is-dragging');

                // DOM'daki GÜNCEL sıralamayı oku (Sadece dolu olanları baz al)
                const guncelSira = [...container.querySelectorAll('.widget-slot.is-draggable')];
                
                // Eski indeksleri okuyarak yeni bir array oluştur
                const yeniWidgetDizisi = guncelSira.map(slot => {
                    const oldIndex = parseInt(slot.dataset.index);
                    return siteVerisi.widgetlar[oldIndex];
                });

                // Eğer bir yer değiştirme olduysa State'i güncelle ve kaydet çubuğunu tetikle
                if (JSON.stringify(siteVerisi.widgetlar) !== JSON.stringify(yeniWidgetDizisi)) {
                    siteVerisi.widgetlar = yeniWidgetDizisi;
                    EditManager.Global.degisiklikYapildi();
                }
                
                // Sıralama değişmese bile (Örn: Yanlışlıkla boş yuvaya sürüklendiyse) DOM'u temizlemek için tekrar çiz
                WidgetEngine.ciz(); 
            });
        },

        baslat() {
            this.modalBaslat();
            this.surukleBirakSisteminiKur();
            
            const container = document.getElementById('widgets-container');
            if (!container) return;

            container.addEventListener('click', (e) => {
                if (!EditManager.state.isGlobalEditActive) return;

                const slot = e.target.closest('.widget-slot');
                if (!slot) return;
                const index = parseInt(slot.dataset.index);

                // 1. Yeni Ekle (+)'ya tıklandıysa (Hayalet yuva)
                if (e.target.closest('.widget-ghost-slot')) {
                    // YENİ: Artık direkt oluşturmuyor, modalı açıyor!
                    const modal = document.getElementById('widget-selection-modal');
                    if (modal) modal.classList.add('is-open');
                }

                // 2. Sil (Çarpı) butonuna tıklandıysa (Fareyle uzaklaşınca iptal olan onay)
                if (e.target.closest('.widget-inline-delete')) {
                    const silBtn = e.target.closest('.widget-inline-delete');

                    // İlk Tıklama: Onay İste
                    if (!silBtn.classList.contains('confirm-delete')) {
                        silBtn.classList.add('confirm-delete');
                        silBtn.innerHTML = TIK_IKONU_SVG;
                        silBtn.title = 'Silmek için tekrar tıkla';
                        
                        // Fare üzerinden çekilince (mouseleave) iptal et ve normale dön
                        silBtn.addEventListener('mouseleave', function revertDelete() {
                            silBtn.classList.remove('confirm-delete');
                            silBtn.innerHTML = SIL_IKONU_SVG;
                            silBtn.title = 'Kaldır';
                        }, { once: true }); // once: true ile bu dinleyici bir kere çalıştıktan sonra kendini imha eder
                        
                        return;
                    }

                    // İkinci Tıklama (Fareyi çekmeden hemen basarsa): Gerçekten Sil
                    siteVerisi.widgetlar.splice(index, 1);
                    siteVerisi.monkeytype_skorlari = null; 
                    WidgetEngine.ciz(); 
                    EditManager.Global.degisiklikYapildi();
                }
            });

            container.addEventListener('input', (e) => {
                if (!EditManager.state.isGlobalEditActive) return;
                const input = e.target.closest('.widget-username-input');
                if (input) {
                    const slot = input.closest('.widget-slot');
                    const index = parseInt(slot.dataset.index);
                    const username = input.value.trim();
                    
                    if (siteVerisi.widgetlar[index]) {
                        siteVerisi.widgetlar[index].ayarlar.kullanici = username;
                        EditManager.Global.degisiklikYapildi();
                    }
                }
            });
        }
    },
    // #endregion

    // #region 5. PROFİL (METİN & LİNK) YÖNETİMİ
    Profile: {
        renderLinks() {
            const wrapper = document.getElementById('links-wrapper');
            if(!wrapper) return;
            wrapper.innerHTML = ''; 
            
            EditManager.state.tempProfileLinks.forEach((link, index) => {
                const span = document.createElement('span');
                span.className = 'link-item is-editing';
                span.innerHTML = `${getLinkIcon(link.url)} <span>${link.isim}</span>`;
                
                const editBtn = document.createElement('span');
                editBtn.className = 'link-edit-badge';
                editBtn.innerHTML = `<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
                
                span.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    document.getElementById('inline-add-link-btn').dataset.editIndex = index;
                    document.getElementById('inline-add-link-btn').click();
                };
                
                span.appendChild(editBtn);
                wrapper.appendChild(span);
            });
        },
        duzenlemeyeGec() {
            EditManager.state.isProfileEditing = true;
            document.body.classList.add('is-editing-profile'); 

            const metinler = siteVerisi.profil_metinleri_ve_linkler || {};
            const currentName = metinler.gorunen_isim || KULLANICI_ADI.charAt(0).toUpperCase() + KULLANICI_ADI.slice(1);
            const currentTitle = metinler.unvan || '';
            const currentBio = metinler.aciklama || '';

            const nameEl = document.getElementById('inline-name');
            const unvanEl = document.getElementById('inline-title');
            const aciklamaEl = document.getElementById('inline-bio');

            nameEl.classList.add('is-input-active');
            nameEl.innerHTML = `<input type="text" id="edit-in-name" class="search-input edit-input-rect edit-name-input" maxlength="20" value="${currentName}" placeholder="Görünen İsim">`;
            
            unvanEl.innerHTML = `<input type="text" id="edit-in-title" class="search-input edit-input-rect" maxlength="30" value="${currentTitle}" placeholder="Ünvan Ekle (Örn: Designer)">`;
            unvanEl.classList.remove('ghost-text');
            
            aciklamaEl.innerHTML = `<textarea id="edit-in-bio" class="search-input edit-input-rect auto-expand-textarea" maxlength="160" placeholder="Kendinden bahset...">${currentBio}</textarea>`;
            aciklamaEl.classList.remove('ghost-text');

            const autoExpand = function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            };
            
            const bioInput = document.getElementById('edit-in-bio');
            if (bioInput) {
                bioInput.style.height = 'auto';
                bioInput.style.height = (bioInput.scrollHeight) + 'px';
                bioInput.addEventListener('input', autoExpand);
            }

            // Inputlara yazıldıkça anında state'e kaydet ve çubuğu tetikle
            const inputlariDinle = () => { EditManager.Profile.anlikKaydet(); };
            document.getElementById('edit-in-name').addEventListener('input', inputlariDinle);
            document.getElementById('edit-in-title').addEventListener('input', inputlariDinle);
            if (bioInput) bioInput.addEventListener('input', inputlariDinle);

            EditManager.state.tempProfileLinks = [...(metinler.linkler || [])];
            this.renderLinks();
        },
        anlikKaydet() {
            // Sadece taslağa (siteVerisi) yazar ve çubuğu tetikler. DB'ye henüz gitmez.
            const newName = document.getElementById('edit-in-name').value.trim();
            const newTitle = document.getElementById('edit-in-title').value.trim();
            const newBio = document.getElementById('edit-in-bio').value.trim();

            const yeniMetinler = { ...(siteVerisi.profil_metinleri_ve_linkler || {}) };
            yeniMetinler.gorunen_isim = newName;
            yeniMetinler.unvan = newTitle;
            yeniMetinler.aciklama = newBio;
            yeniMetinler.linkler = EditManager.state.tempProfileLinks; 

            siteVerisi.profil_metinleri_ve_linkler = yeniMetinler;
            EditManager.Global.degisiklikYapildi();
        },
        duzenlemedenCik() {
            EditManager.state.isProfileEditing = false;
            document.body.classList.remove('is-editing-profile'); 
            const nameEl = document.getElementById('inline-name');
            if(nameEl) nameEl.classList.remove('is-input-active');
            ekraniCiz(); 
        },
        baslat() {
            const profileBox = document.querySelector('.box.profile');
            
            if (profileBox && isOwner) {
                profileBox.addEventListener('click', (e) => {
                    // 1. Eğer halihazırda düzenleme modundaysak hiçbir şey yapma
                    if (EditManager.state.isGlobalEditActive) return;
                    
                    // 2. Kullanıcı profil kutusunun içindeki bir linke/butona tıkladıysa engelle (sayfaya gitsin)
                    if (e.target.closest('a') || e.target.closest('button')) return;

                    // 3. Şartlar uygunsa sistemi direkt düzenleme moduna geçir
                    EditManager.Global.toggleEditMode();
                });
            }
        },
        linkModaliBaslat() {
            const addBtn = document.getElementById('inline-add-link-btn');
            const modal = document.getElementById('link-modal');
            const closeBtn = document.getElementById('link-modal-close');
            const backdrop = document.getElementById('link-modal-backdrop');
            const submitBtn = document.getElementById('link-submit-btn');
            const deleteBtn = document.getElementById('link-delete-btn');
            const nameInput = document.getElementById('link-name-input');
            const urlInput = document.getElementById('link-url-input');
            const errorBox = document.getElementById('link-error-box');
            const modalTitle = document.getElementById('link-modal-title');
            
            // Canlı Önizleme Seçicileri
            const previewText = document.getElementById('link-preview-text');
            const previewIcon = document.getElementById('link-preview-icon');
            const defaultIconSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;

            if (!modal || !addBtn) return;

            // URL Doğrulama Regex'i
            const urlGecerliMi = (string) => {
                const res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
                return (res !== null);
            };

            // Canlı Önizlemeyi Güncelleyen Fonksiyon
            const onizlemeyiGuncelle = () => {
                const isim = nameInput.value.trim() || 'Önizleme';
                let url = urlInput.value.trim();
                if (url && !url.startsWith('http')) url = 'https://' + url;
                
                previewText.textContent = isim;
                previewIcon.innerHTML = url && urlGecerliMi(url) ? getLinkIcon(url) : defaultIconSvg;
            };

            nameInput.addEventListener('input', onizlemeyiGuncelle);
            urlInput.addEventListener('input', onizlemeyiGuncelle);

            const modaliAc = (e) => {
                e.stopPropagation(); 
                modal.classList.add('is-open');
                errorBox.style.display = 'none';
                
                const editIndex = addBtn.dataset.editIndex;
                
                if (editIndex !== undefined && editIndex !== "") {
                    // DÜZENLEME MODU
                    const linkData = EditManager.state.tempProfileLinks[editIndex];
                    modalTitle.textContent = "Linki Düzenle";
                    submitBtn.textContent = "Güncelle";
                    deleteBtn.style.display = "block";
                    nameInput.value = linkData.isim;
                    urlInput.value = linkData.url;
                } else {
                    // YENİ EKLEME MODU
                    modalTitle.textContent = "Yeni Link Ekle";
                    submitBtn.textContent = "Ekle";
                    deleteBtn.style.display = "none";
                    nameInput.value = '';
                    urlInput.value = '';
                }
                
                onizlemeyiGuncelle();
                setTimeout(() => nameInput.focus(), 50);
            };

            const modaliKapat = () => {
                modal.classList.remove('is-open');
                addBtn.dataset.editIndex = ""; // Hafızayı temizle
            };

            addBtn.addEventListener('click', modaliAc);
            closeBtn.addEventListener('click', modaliKapat);
            backdrop.addEventListener('click', modaliKapat);

            // Ekle / Güncelle
            submitBtn.addEventListener('click', () => {
                const isim = nameInput.value.trim();
                let url = urlInput.value.trim();

                if (!isim || !url) { 
                    errorBox.textContent = "İsim ve URL boş bırakılamaz."; 
                    errorBox.style.display = 'block'; 
                    errorBox.classList.add('shake-box-animation');
                    setTimeout(() => errorBox.classList.remove('shake-box-animation'), 400);
                    return; 
                }
                
                if (!urlGecerliMi(url)) {
                    errorBox.textContent = "Lütfen geçerli bir internet bağlantısı girin."; 
                    errorBox.style.display = 'block'; 
                    errorBox.classList.add('shake-box-animation');
                    setTimeout(() => errorBox.classList.remove('shake-box-animation'), 400);
                    return;
                }

                if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;

                const editIndex = addBtn.dataset.editIndex;
                
                if (editIndex !== undefined && editIndex !== "") {
                    // Güncelle
                    EditManager.state.tempProfileLinks[editIndex] = { isim, url };
                } else {
                    // Yeni Ekle
                    EditManager.state.tempProfileLinks.push({ isim, url });
                }
                
                EditManager.Profile.anlikKaydet(); 
                EditManager.Profile.renderLinks();
                modaliKapat();
            });

            // Silme İşlemi
            deleteBtn.addEventListener('click', () => {
                const editIndex = addBtn.dataset.editIndex;
                if (editIndex !== undefined && editIndex !== "") {
                    EditManager.state.tempProfileLinks.splice(editIndex, 1);
                    EditManager.Profile.anlikKaydet(); 
                    EditManager.Profile.renderLinks();
                    modaliKapat();
                }
            });
        }
    },
    // #endregion

    // #region 5.5. TEMA RENGİ SEÇİCİ
    ThemePicker: {
        baslat() {
            const hexInput = document.getElementById('hexInput');
            const colorTrigger = document.getElementById('colorTrigger');
            const pickerPopup = document.getElementById('pickerPopup');
            const svSquare = document.getElementById('svSquare');
            const svCursor = document.getElementById('svCursor');
            const hueSlider = document.getElementById('hueSlider');
            const hueCursor = document.getElementById('hueCursor');

            if (!colorTrigger || !pickerPopup) return;

            let currentHsv = { h: 32, s: 100, v: 100 };

            const sistemeRengiUygula = (hex) => {
                const cleanHex = hex.toLowerCase();
                siteVerisi.primary_color = cleanHex;
                EditManager.Profile.anlikKaydet(); // Sadece değişikliği bildirmek için kullanıyoruz
                temaRenkleriniGuncelle(cleanHex);

                hexInput.value = cleanHex.toUpperCase();
                colorTrigger.style.backgroundColor = cleanHex;
            };

            const positionCursorsFromHsv = () => {
                svCursor.style.left = currentHsv.s + '%';
                svCursor.style.top = (100 - currentHsv.v) + '%';
                hueCursor.style.left = (currentHsv.h / 360) * 100 + '%';
            };

            const setSquareBaseColor = () => {
                svSquare.style.backgroundColor = `hsl(${currentHsv.h}, 100%, 50%)`;
            };

            const commitColorFromHsv = () => {
                const { r, g, b } = hsvToRgb(currentHsv.h, currentHsv.s, currentHsv.v);
                sistemeRengiUygula(rgbToHex(r, g, b));
            };

            const pointerRatio = (e, el) => {
                const rect = el.getBoundingClientRect();
                const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
                const y = Math.min(Math.max(e.clientY - rect.top, 0), rect.height);
                return { x: x / rect.width, y: y / rect.height };
            };

            const attachDrag = (el, onMove) => {
                el.addEventListener('pointerdown', (e) => {
                    el.setPointerCapture(e.pointerId);
                    onMove(e);
                    const move = (ev) => onMove(ev);
                    const up = () => {
                        el.removeEventListener('pointermove', move);
                        el.removeEventListener('pointerup', up);
                    };
                    el.addEventListener('pointermove', move);
                    el.addEventListener('pointerup', up);
                });
            };

            attachDrag(svSquare, (e) => {
                const { x, y } = pointerRatio(e, svSquare);
                currentHsv.s = x * 100;
                currentHsv.v = (1 - y) * 100;
                positionCursorsFromHsv();
                commitColorFromHsv();
            });

            attachDrag(hueSlider, (e) => {
                const { x } = pointerRatio(e, hueSlider);
                currentHsv.h = x * 360;
                setSquareBaseColor();
                positionCursorsFromHsv();
                commitColorFromHsv();
            });

            const closePicker = () => pickerPopup.hidden = true;
            const outsideClickCloser = (e) => {
                if (!pickerPopup.contains(e.target) && e.target !== colorTrigger) closePicker();
            };

            colorTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                if (pickerPopup.hidden) {
                    const savedHex = (siteVerisi.primary_color || '#ff8800').toLowerCase();
                    const initRgb = hexToRgb(savedHex);
                    currentHsv = rgbToHsv(initRgb.r, initRgb.g, initRgb.b);
                    hexInput.value = savedHex.toUpperCase();
                    
                    pickerPopup.hidden = false;
                    setSquareBaseColor();
                    positionCursorsFromHsv();
                    document.addEventListener('click', outsideClickCloser);
                } else {
                    closePicker();
                    document.removeEventListener('click', outsideClickCloser);
                }
            });

            hexInput.addEventListener('input', (e) => {
                let val = e.target.value.trim();
                if (!val.startsWith('#')) val = '#' + val;
                if (/^#[0-9A-Fa-f]{6}$/i.test(val)) {
                    const { r, g, b } = hexToRgb(val);
                    currentHsv = rgbToHsv(r, g, b);
                    setSquareBaseColor();
                    positionCursorsFromHsv();
                    sistemeRengiUygula(val);
                }
            });

            const eyedropperBtn = document.getElementById('eyedropperBtn');
            if (typeof window.EyeDropper === 'undefined') {
                eyedropperBtn.style.display = 'none';
            } else {
                eyedropperBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    try {
                        const result = await new window.EyeDropper().open();
                        const hex = result.sRGBHex;
                        const { r, g, b } = hexToRgb(hex);
                        currentHsv = rgbToHsv(r, g, b);
                        setSquareBaseColor();
                        positionCursorsFromHsv();
                        sistemeRengiUygula(hex);
                    } catch (err) {} 
                });
            }
        }
    },
    // #endregion

    // #region 6. ANA BAŞLATICI (Sadece Sahipse Çalışır)
    init() {
        if (!isOwner) return; 
        
        this.Global.baslat();
        this.ThemePicker.baslat();
        this.Content.baslat();
        this.Media.baslat();
        this.Widget.baslat();
        this.Profile.baslat();
        this.Profile.linkModaliBaslat();
    }
    // #endregion
};
// #endregion

// #region BLOK 3: UYGULAMA BAŞLATICI (INIT)
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    await oturumuKontrolEt(); 
    
    // Geçerli bir parametre yoksa ama oturum açıksa, Landing Page'de Kullanıcı Menüsünü göster.
    if (!KULLANICI_ADI && aktifKullaniciOturumu) {
        const { data: profileData } = await supabaseClient
            .from('profiles')
            .select('kullanici_adi, profil_gorselleri, profil_metinleri_ve_linkler')
            .eq('auth_id', aktifKullaniciOturumu.user.id)
            .single();

        if (profileData && profileData.kullanici_adi) {
            // Giriş butonunu gizle, Profil menüsünü göster
            const loginBtn = document.getElementById('hero-login-btn');
            const userMenu = document.getElementById('nav-user-menu');
            
            if(loginBtn) loginBtn.style.display = 'none';
            if(userMenu) userMenu.style.display = 'block';

            // Veritabanından gelen PP ve İsmi navbar'a bas
            const pfp = profileData.profil_gorselleri?.pfp_url || 'https://i.ibb.co/8gvf4SNF/pfp-placeholder.png';
            const name = profileData.profil_metinleri_ve_linkler?.gorunen_isim || profileData.kullanici_adi;
            
            const pfpEl = document.getElementById('nav-user-pfp');
            const nameEl = document.getElementById('nav-user-name');
            const profileLink = document.getElementById('nav-go-profile');
            
            if(pfpEl) pfpEl.src = pfp;
            if(nameEl) nameEl.textContent = name;
            // Hesabım linkini kullanıcının kendi arşivine bağla
            if(profileLink) profileLink.href = `?user=${profileData.kullanici_adi}`;
            
            // Dropdown Aç/Kapat (Toggle) İşlevi
            const trigger = document.getElementById('nav-user-trigger');
            const dropdown = document.getElementById('nav-dropdown');
            
            if(trigger && dropdown) {
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('is-open');
                });
                
                // Menü dışına tıklanınca kapat
                document.addEventListener('click', (e) => {
                    if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
                        dropdown.classList.remove('is-open');
                    }
                });
            }
            
            // Çıkış Yap Butonu İşlevi
            const logoutBtn = document.getElementById('nav-logout-btn');
            if(logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    await sistemdenCikisYap(); // Supabase'den çıkış yapar ve sayfayı yeniler
                });
            }
        }
    }

    // Kullanıcı adı yoksa Landing (Karşılama) ekranını göster
    if (!KULLANICI_ADI) {
        document.getElementById('app-wrapper').style.display = 'none';
        document.getElementById('landing-screen').style.display = 'flex';
        
        // YENİ: Landing Page'de yıldızlar görünür kalsın
        const starfield = document.getElementById('starfield');
        if (starfield) starfield.style.display = 'block'; 
        
        landingEkraniniBaslat();
    } else {
        // Kullanıcı adı varsa Ana Uygulamayı başlat
        document.getElementById('landing-screen').style.display = 'none';
        document.getElementById('app-wrapper').style.display = 'block';
        
        // YENİ: Profil sayfasında o sarı ışık huzmesi gitsin, temamız düzgün çalışsın
        const starfield = document.getElementById('starfield');
        if (starfield) starfield.style.display = 'none';
        
        WidgetEngine.etkilesimBaslat(); // Herkese açık etkileşim (Hover vb.)
        authModaliniBaslat();    // Oturum açma modalı
        
        await tumVerileriCek();  // Veriyi çeker ve isOwner (sahip mi) durumunu belirler
        
        EditManager.init();      // Eğer isOwner = true ise tüm düzenleme araçlarını aktif eder!
    }
});
// #endregion
