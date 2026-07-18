// #region 1: KONFİGÜRASYON & DURUM YÖNETİMİ (STATE)
// ============================================================
const SUPABASE_URL = 'https://acvpjytvkfxbsuiivqir.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_t5LYrH03nWrL1-tzhhXV4g_UF77mEAy';
const urlParams = new URLSearchParams(window.location.search);
const KULLANICI_ADI = urlParams.get('user');

// Tüm site verisi
let siteVerisi = {
    profil_sahibi_id: null, // Veritabanındaki auth_id
    profil_metinleri: null,
    profil_gorselleri: null,
    linkler: [],
    widgetlar: [],
    icerik: [],
    monkeytype_skorlari: null
};

// --- YENİ: KİMLİK VE YETKİLENDİRME DURUMU ---
let aktifKullaniciOturumu = null; // JWT Token ve kullanıcı bilgileri
let isOwner = false; // Ziyaretçi mi yoksa sayfanın sahibi mi?

const MAKS_ICERIK_SAYISI = 12;
let aktifKategoriId = null;
let aramaZamanlayici = null;

const SIL_IKONU_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7H20M9 7V4.5C9 4.22386 9.22386 4 9.5 4H14.5C14.7761 4 15 4.22386 15 4.5V7M18 7L17.3 18.5C17.24 19.47 16.43 20.2 15.46 20.2H8.54C7.57 20.2 6.76 19.47 6.7 18.5L6 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const TIK_IKONU_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13L9.5 17.5L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const supabaseClient = (typeof supabase !== 'undefined') ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
// #endregion

// #region 1.5: OTURUM KONTROLÜ (AUTH)
// ============================================================
async function oturumuKontrolEt() {
    if (!supabaseClient) return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    aktifKullaniciOturumu = session;
}
// #endregion

// #region 2: SUPABASE VERİ ÇEKME
// ============================================================
async function tumVerileriCek() {
    try {
        const response = await fetch('https://acvpjytvkfxbsuiivqir.supabase.co/functions/v1/bright-task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ kullanici_adi: KULLANICI_ADI })
        });

        if (!response.ok) throw new Error(`HTTP Hatası: ${response.status}`);

        const data = await response.json();
        const profil = data.profil;
        
        if (!profil || Object.keys(profil).length === 0) {
            document.getElementById('app-wrapper').style.display = 'none';
            document.getElementById('not-found-screen').style.display = 'flex';
            return; // Fonksiyonun geri kalanını çalıştırma
        }
        siteVerisi.profil_sahibi_id = profil.auth_id;
        // --- YENİ: SAHİPLİK KONTROLÜ ---
        siteVerisi.profil_sahibi_id = profil.auth_id;
        if (aktifKullaniciOturumu && siteVerisi.profil_sahibi_id === aktifKullaniciOturumu.user.id) {
            isOwner = true; // Sisteme giren kişi sayfanın sahibi!
            document.body.classList.add('is-owner'); // CSS için ipucu bırakıyoruz
        } else {
            isOwner = false; // Sadece ziyaretçi
        }

        siteVerisi.profil_metinleri = profil.profil_metinleri_ve_linkler; 
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
// #endregion

// #region 3: VERİLERİ HTML'E BASMA
// ============================================================
function ekraniCiz() {
    if (siteVerisi.profil_gorselleri) {
        const bannerEl = document.querySelector('.banner-image');
        const pfpEl = document.querySelector('.profile-image img');
        if (bannerEl && siteVerisi.profil_gorselleri.banner_url) bannerEl.src = siteVerisi.profil_gorselleri.banner_url;
        if (pfpEl && siteVerisi.profil_gorselleri.pfp_url) pfpEl.src = siteVerisi.profil_gorselleri.pfp_url;
    }

    if (siteVerisi.profil_metinleri) {
        const unvanEl = document.querySelector('.profile-title');
        const aciklamaEl = document.querySelector('.profile-bio');
        const isimEl = document.querySelector('.profile-name');
        if (isimEl) isimEl.textContent = KULLANICI_ADI.charAt(0).toUpperCase() + KULLANICI_ADI.slice(1);
        if (unvanEl && siteVerisi.profil_metinleri.unvan) unvanEl.textContent = siteVerisi.profil_metinleri.unvan;
        if (aciklamaEl && siteVerisi.profil_metinleri.aciklama) aciklamaEl.textContent = siteVerisi.profil_metinleri.aciklama;
    }

    const linksContainer = document.querySelector('.profile-links');
    if (linksContainer && siteVerisi.linkler.length > 0) {
        linksContainer.innerHTML = ''; 
        siteVerisi.linkler.forEach(link => {
            const a = document.createElement('a');
            a.className = 'link-item';
            a.href = link.url;
            a.target = '_blank';
            a.rel = 'noopener';
            a.textContent = link.isim;
            linksContainer.appendChild(a);
        });
    }

    // Widget Arayüz Kontrolü
    const emptyState = document.getElementById('widget-empty-state');
    const emptyText = document.getElementById('widget-empty-text');
    const addWidgetBtn = document.getElementById('add-widget-btn');
    const mtContainer = document.getElementById('mt-widget-container');
    const editWidgetBtn = document.getElementById('edit-widget-btn');

    // Önce hepsini sıfırla (Boş Duruma Getir)
    if (emptyState) emptyState.style.display = 'flex';
    if (mtContainer) mtContainer.style.display = 'none';
    if (addWidgetBtn) addWidgetBtn.style.display = isOwner ? 'block' : 'none';
    if (emptyText) emptyText.style.display = isOwner ? 'none' : 'block';
    if (editWidgetBtn) editWidgetBtn.style.display = isOwner ? 'flex' : 'none';

    // Eğer veritabanında widget varsa Dolu duruma geç
    siteVerisi.widgetlar.forEach(widget => {
        if (widget.tur === 'monkeytype') {
            if (emptyState) emptyState.style.display = 'none';
            if (mtContainer) mtContainer.style.display = 'block';

            const monkeyBtn = document.getElementById('mt-dynamic-userlink');
            if (monkeyBtn && widget.ayarlar.kullanici) {
                monkeyBtn.href = `https://monkeytype.com/profile/${widget.ayarlar.kullanici}`;
                monkeyBtn.textContent = widget.ayarlar.kullanici; // Kullanıcı adını linke yaz
            }
            monkeytypeIstatistikleriniYukle(); 
        }
    });

    sekmeleriVeIcerikleriHazirla();
    const editBtn = document.getElementById('edit-profile-trigger');
    if (editBtn) editBtn.style.display = isOwner ? 'flex' : 'none';
}
// #endregion

// #region 4: WIDGET VERİLERİ
// ============================================================
function monkeytypeIstatistikleriniYukle() {
    const data = siteVerisi.monkeytype_skorlari;
    if (!data) return;

    ['10', '25', '50', '100'].forEach((count) => {
        if (data[count] && data[count][0]) {
            const wpm = Math.round(data[count][0].wpm);
            const acc = Math.round(data[count][0].acc);

            // Hem kapalı (.stat-item) hem de hover (.mt-stat-item) durumundaki kartları seçip güncelliyoruz
            document.querySelectorAll(`.stat-item[data-words="${count}"], .mt-stat-item[data-words="${count}"]`).forEach((item) => {
                const valueEl = item.querySelector('.stat-value, .mt-stat-value');
                const percentEl = item.querySelector('.stat-percent, .mt-stat-percent');
                
                if (valueEl) valueEl.textContent = wpm;
                if (percentEl) percentEl.textContent = `${acc}%`;
            });
        }
    });
}
// #endregion

// #region 5: SAYFA DÜZENİ VE RENDER
// ============================================================
function sekmeleriVeIcerikleriHazirla() {
    const tabsContainer = document.getElementById('content-tabs');
    if (!tabsContainer || Object.keys(siteVerisi.icerik).length === 0) return;

    tabsContainer.innerHTML = ''; 
    const kategoriler = [{ id: 'animeler', ad: 'Animeler' }, { id: 'diziler', ad: 'Diziler' }, { id: 'oyunlar', ad: 'Oyunlar' }];

    kategoriler.forEach((kat, index) => {
        const btn = document.createElement('button');
        btn.className = `tab ${index === 0 ? 'active' : ''}`; 
        btn.textContent = kat.ad;
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            aktifKategoriId = kat.id;
            kartlariGriddeListele(siteVerisi.icerik[kat.id] || []);
        });
        tabsContainer.appendChild(btn);
    });

    aktifKategoriId = kategoriler[0].id;
    kartlariGriddeListele(siteVerisi.icerik[aktifKategoriId] || []);
}

function kartlariGriddeListele(kartlar) {
    const contentGrid = document.getElementById('content-grid');
    if (!contentGrid) return;
    contentGrid.innerHTML = '';

    kartlar.forEach(kart => {
        const cardEl = document.createElement('div');
        cardEl.className = 'content-card';
        cardEl.dataset.kimlik = kart.kimlik;

        const thumbEl = document.createElement('div');
        thumbEl.className = 'card-thumb';

        const imgEl = document.createElement('img');
        imgEl.src = kart.gorsel_url || 'Images/placeholder.jpg'; 
        imgEl.alt = kart.baslik;
        thumbEl.appendChild(imgEl);

        // --- YENİ: SİLME BUTONUNU SADECE SAHİP GÖREBİLİR ---
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

    addButonDurumunuGuncelle(kartlar.length);
}

function addButonDurumunuGuncelle(mevcutSayi) {
    const addBtn = document.getElementById('add-content-btn');
    if (!addBtn) return;

    // --- YENİ: EKLEME BUTONUNU SADECE SAHİP GÖREBİLİR ---
    if (!isOwner) {
        addBtn.style.display = 'none'; // Ziyaretçilere tamamen gizle
        return;
    }
    
    addBtn.style.display = 'flex'; // Sahipse göster
    const doluMu = mevcutSayi >= MAKS_ICERIK_SAYISI;
    addBtn.disabled = doluMu;
    addBtn.title = doluMu ? 'Bu kategori dolu (12/12)' : 'Yeni Ekle';
}
// #endregion

// #region 5b: API İSTEKLERİ VE İKİ ADIMLI SİLME
// ============================================================
const KATEGORI_ARAMA_TURU = { animeler: 'anime', diziler: 'dizi', oyunlar: 'oyun' };

async function edgeFonksiyonuCagir(payload) {
    // --- YENİ: Eğer giriş yapmışsak JWT tokeni gönder, yoksa Anon Key gönder ---
    const token = aktifKullaniciOturumu ? aktifKullaniciOturumu.access_token : SUPABASE_ANON_KEY;
    const authHeader = `Bearer ${token}`;

    const response = await fetch('https://acvpjytvkfxbsuiivqir.supabase.co/functions/v1/bright-task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader // Gümrük memuruna kimliğimizi veriyoruz!
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP Hatası: ${response.status}`);
    return data;
}

async function icerikAra(sorgu, kategoriId) { /* ...aynı... */
    const aramaTuru = KATEGORI_ARAMA_TURU[kategoriId];
    if (!aramaTuru) return [];
    try {
        const data = await edgeFonksiyonuCagir({ action: 'search', arama_metni: sorgu, arama_turu: aramaTuru });
        return data.sonuclar || [];
    } catch (err) { console.error('Arama hatası:', err); return []; }
}

async function icerikKaydet(sonucItem, kategoriId) {
    try {
        const data = await edgeFonksiyonuCagir({ action: 'save', kullanici_adi: KULLANICI_ADI, hedef_kategori: kategoriId, yeni_yapim: sonucItem });
        return data.kaydedilen;
    } catch (err) { alert(err.message); return null; } // Hatayı alert ile bildiriyoruz
}

async function icerikSil(kartKimlik, kategoriId) {
    try {
        await edgeFonksiyonuCagir({ action: 'delete', kullanici_adi: KULLANICI_ADI, hedef_kategori: kategoriId, silinecek_id: kartKimlik });
        return true;
    } catch (err) { alert(err.message); return false; } // Hatayı alert ile bildiriyoruz
}

// ... aramaModaliniBaslat, aramaSonuclariniCiz, secimYapildi (Aynı kaldı)
function aramaModaliniBaslat() {
    const addBtn = document.getElementById('add-content-btn');
    const modal = document.getElementById('search-modal');
    const backdrop = document.getElementById('search-modal-backdrop');
    const closeBtn = document.getElementById('search-modal-close');
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');

    if (!addBtn || !modal || !input || !results) return;

    const modaliAc = () => {
        if (addBtn.disabled) return;
        modal.classList.add('is-open');
        input.value = '';
        results.innerHTML = '<p class="search-hint">Aramak istediğin ismi yaz.</p>';
        setTimeout(() => input.focus(), 50);
    };

    const modaliKapat = () => {
        modal.classList.remove('is-open');
        clearTimeout(aramaZamanlayici);
    };

    addBtn.addEventListener('click', modaliAc);
    closeBtn.addEventListener('click', modaliKapat);
    backdrop.addEventListener('click', modaliKapat);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('is-open')) modaliKapat(); });

    input.addEventListener('input', () => {
        const sorgu = input.value.trim();
        clearTimeout(aramaZamanlayici);
        if (sorgu.length < 2) { results.innerHTML = '<p class="search-hint">Aramak istediğin ismi yaz.</p>'; return; }
        results.innerHTML = '<p class="search-loading">Aranıyor...</p>';
        aramaZamanlayici = setTimeout(async () => {
            const sonuclar = await icerikAra(sorgu, aktifKategoriId);
            aramaSonuclariniCiz(sonuclar, modaliKapat);
        }, 350);
    });
}

function aramaSonuclariniCiz(sonuclar, modaliKapat) {
    const results = document.getElementById('search-results');
    if (!results) return;
    results.innerHTML = '';
    if (!sonuclar || sonuclar.length === 0) { results.innerHTML = '<p class="search-empty">Sonuç bulunamadı.</p>'; return; }

    sonuclar.forEach(sonuc => {
        const cardEl = document.createElement('div');
        cardEl.className = 'search-result-card';
        const thumbEl = document.createElement('div');
        thumbEl.className = 'search-result-thumb';
        const imgEl = document.createElement('img');
        imgEl.src = sonuc.gorsel_url || 'Images/placeholder.jpg';
        const labelEl = document.createElement('p');
        labelEl.className = 'search-result-label';
        labelEl.textContent = sonuc.baslik;

        thumbEl.appendChild(imgEl);
        cardEl.appendChild(thumbEl);
        cardEl.appendChild(labelEl);
        cardEl.addEventListener('click', () => secimYapildi(sonuc, modaliKapat));
        results.appendChild(cardEl);
    });
}

async function secimYapildi(sonuc, modaliKapat) {
    if (!aktifKategoriId) return;
    const kaydedilenKart = await icerikKaydet(sonuc, aktifKategoriId);
    if (!kaydedilenKart) return; // Hata varsa (yetkisiz vb.) kartı ekleme

    if (!siteVerisi.icerik[aktifKategoriId]) siteVerisi.icerik[aktifKategoriId] = [];
    siteVerisi.icerik[aktifKategoriId].push(kaydedilenKart);
    kartlariGriddeListele(siteVerisi.icerik[aktifKategoriId]);
    modaliKapat();
}

function silmeEtkilesimBaslat() {
    const contentGrid = document.getElementById('content-grid');
    if (!contentGrid) return;

    contentGrid.addEventListener('click', (e) => {
        const silBtn = e.target.closest('.card-delete-btn');
        if (!silBtn) return;

        const cardEl = silBtn.closest('.content-card');
        if (!cardEl) return;

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

        clearTimeout(silBtn._geriDonTimeout);
        kartiSil(cardEl);
    });
}

async function kartiSil(cardEl) {
    const kartKimlik = cardEl.dataset.kimlik;
    const kategoriId = aktifKategoriId;

    const basarili = await icerikSil(kartKimlik, kategoriId);
    if (!basarili) return; // Eğer veritabanından silinemediyse (401 vs), HTML'den de SİLME!

    if (siteVerisi.icerik[kategoriId]) {
        siteVerisi.icerik[kategoriId] = siteVerisi.icerik[kategoriId].filter(k => String(k.kimlik) !== String(kartKimlik));
    }

    cardEl.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    cardEl.style.opacity = '0';
    cardEl.style.transform = 'scale(0.92)';

    setTimeout(() => {
        cardEl.remove();
        addButonDurumunuGuncelle(siteVerisi.icerik[kategoriId]?.length || 0);
    }, 250);
}

function widgetEtkilesimBaslat() {
    const widgetSlot = document.querySelector('.widget-slot');
    if (!widgetSlot) return;
    let timeoutId;
    const closeWidget = () => widgetSlot.classList.remove('is-active');
    const cancelClose = () => clearTimeout(timeoutId);
    const scheduleClose = () => { cancelClose(); timeoutId = setTimeout(closeWidget, 200); };

    widgetSlot.addEventListener('click', (e) => {
        if (e.target.closest('.monkeytype-btn')) return;
        widgetSlot.classList.toggle('is-active');
    });
    document.addEventListener('click', (e) => { if (!widgetSlot.contains(e.target)) closeWidget(); });
    widgetSlot.addEventListener('mouseleave', scheduleClose);
    widgetSlot.addEventListener('mouseenter', cancelClose);
}
// #endregion

// #region 7: KULLANICI GİRİŞ/ÇIKIŞ VE ARAYÜZ (AUTH) SİSTEMİ
// ============================================================
let isLoginMode = true; // true = Giriş Ekranı, false = Kayıt Ekranı
let hataliGirisDenemesi = 0;
let girisKilitliMi = false;

// Şık Hata Gösterici Yardımcı Fonksiyon
function authHataGoster(mesaj) {
    document.querySelectorAll('.auth-error-box').forEach(box => {
        box.textContent = mesaj;
        box.style.display = 'block';
    });
}

function authHataTemizle() {
    document.querySelectorAll('.auth-error-box').forEach(box => {
        box.style.display = 'none';
    });
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
    
    // YENİ: Giriş başarılıysa kişinin kendi sayfasına yönlendir
    const { data: profileData } = await supabaseClient
        .from('profiles')
        .select('kullanici_adi')
        .eq('auth_id', data.user.id)
        .single();

    if (profileData && profileData.kullanici_adi) {
        window.location.href = `?user=${profileData.kullanici_adi}`;
    } else {
        window.location.reload(); 
    }
    return true;
}

async function sistemeKayitOl(email, password, username) {
    authHataTemizle();

    // YENİ: Kullanıcı adı çakışmasını önlemek için büyük harfleri küçült ve boşlukları sil
    const temizKullaniciAdi = username.toLowerCase().trim();

    if (temizKullaniciAdi.length > 15) { authHataGoster("Kullanıcı adı en fazla 15 karakter olabilir."); return false; }
    if (password.length < 6) { authHataGoster("Şifreniz en az 6 karakter olmalıdır."); return false; }

    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) { authHataGoster("Kayıt Hatası: " + error.message); return false; }
    
    if (data.user) {
        const { error: dbError } = await supabaseClient
            .from('profiles')
            .insert([{ 
                auth_id: data.user.id, 
                kullanici_adi: temizKullaniciAdi, // Temiz ismi veritabanına yaz
                profil_metinleri_ve_linkler: {},
                profil_gorselleri: {},
                widgetlar: [],
                icerik: {}
            }]);
            
        if (dbError) { authHataGoster("Bu kullanıcı adı zaten alınmış!"); return false; }
    }
    
    // Yönlendirme
    window.location.href = `?user=${temizKullaniciAdi}`;
    return true;
}

async function sistemdenCikisYap() {
    await supabaseClient.auth.signOut();
    window.location.href = window.location.pathname; // Çıkış yapınca ?user parametresini silip ana ekrana atar
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
    
    if (aktifKullaniciOturumu && triggerText) {
        triggerText.textContent = "Çıkış Yap";
    } else if (triggerText) {
        triggerText.textContent = "Giriş Yap";
    }

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

    const modaliKapat = () => {
        modal.classList.remove('is-open');
        authHataTemizle(); 
    };

    triggerBtn.addEventListener('click', modaliAc);
    closeBtn.addEventListener('click', modaliKapat);
    backdrop.addEventListener('click', modaliKapat);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) modaliKapat();
    });

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
    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitBtn.click();
        }
    });
}

function landingEkraniniBaslat() {
    const title = document.getElementById('landing-form-title');
    const usernameGroup = document.getElementById('landing-username-group');
    const usernameInput = document.getElementById('landing-username');
    const emailInput = document.getElementById('landing-email');
    const passwordInput = document.getElementById('landing-password');
    const submitBtn = document.getElementById('landing-submit-btn');
    const switchText = document.getElementById('landing-switch-text');
    const switchBtn = document.getElementById('landing-switch-action');
    
    let isLandingLoginMode = true;
    if (!submitBtn) return;

    switchBtn.addEventListener('click', () => {
        isLandingLoginMode = !isLandingLoginMode;
        if (isLandingLoginMode) {
            title.textContent = 'Arşivini oluşturmaya başla.';
            usernameGroup.style.display = 'none';
            submitBtn.textContent = 'Giriş Yap';
            switchText.textContent = 'Hesabın yok mu?';
            switchBtn.textContent = 'Kayıt Ol';
        } else {
            title.textContent = 'Yeni Arşiv Oluştur';
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
        if (e.key === 'Enter') {
            e.preventDefault(); // Sayfa yenilenmesini engelle
            submitBtn.click(); // Butona tıklanmış gibi davran
        }
    });
}
// #endregion

// #region 9: PROFİL DÜZENLEME MODALI (FAZ 3)
// ============================================================
function profilDuzenlemeBaslat() {
    const triggerBtn = document.getElementById('edit-profile-trigger');
    const modal = document.getElementById('edit-modal');
    const closeBtn = document.getElementById('edit-modal-close');
    const backdrop = document.getElementById('edit-modal-backdrop');
    const submitBtn = document.getElementById('edit-submit-btn');
    const errorBox = document.getElementById('edit-error-box');
    
    const pfpInput = document.getElementById('edit-pfp-url');
    const bannerInput = document.getElementById('edit-banner-url');
    const titleInput = document.getElementById('edit-title');
    const bioInput = document.getElementById('edit-bio');
    
    const linksContainer = document.getElementById('edit-links-container');
    const addLinkBtn = document.getElementById('edit-add-link-btn');

    if (!triggerBtn || !modal) return;

    // Dinamik Link Satırı Oluşturucu
    const linkSatiriOlustur = (isim = '', url = '') => {
        const div = document.createElement('div');
        div.className = 'link-input-group';
        div.innerHTML = `
            <input type="text" class="search-input link-name" placeholder="İsim (Örn: X)" value="${isim}">
            <input type="url" class="search-input link-url" placeholder="https://..." value="${url}">
            <button type="button" class="remove-link-btn" title="Sil">&times;</button>
        `;
        div.querySelector('.remove-link-btn').addEventListener('click', () => div.remove());
        linksContainer.appendChild(div);
    };

    // Modalı Aç ve Mevcut Verileri Formlara Doldur
    const modaliAc = () => {
        modal.classList.add('is-open');
        errorBox.style.display = 'none';
        
        pfpInput.value = siteVerisi.profil_gorselleri?.pfp_url || '';
        bannerInput.value = siteVerisi.profil_gorselleri?.banner_url || '';
        titleInput.value = siteVerisi.profil_metinleri?.unvan || '';
        bioInput.value = siteVerisi.profil_metinleri?.aciklama || '';
        
        linksContainer.innerHTML = ''; // Önceki linkleri temizle
        if (siteVerisi.linkler && siteVerisi.linkler.length > 0) {
            siteVerisi.linkler.forEach(link => linkSatiriOlustur(link.isim, link.url));
        }
    };

    const modaliKapat = () => modal.classList.remove('is-open');

    // Tetikleyiciler
    triggerBtn.addEventListener('click', modaliAc);
    closeBtn.addEventListener('click', modaliKapat);
    backdrop.addEventListener('click', modaliKapat);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) modaliKapat();
    });
    
    addLinkBtn.addEventListener('click', () => linkSatiriOlustur());

    // Değişiklikleri Veritabanına Kaydet
    submitBtn.addEventListener('click', async () => {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Kaydediliyor...';
        errorBox.style.display = 'none';

        // Inputlardaki verileri toparla
        const yeniGorseller = {
            pfp_url: pfpInput.value.trim(),
            banner_url: bannerInput.value.trim()
        };
        
        const yeniLinkler = [];
        linksContainer.querySelectorAll('.link-input-group').forEach(group => {
            const isim = group.querySelector('.link-name').value.trim();
            const url = group.querySelector('.link-url').value.trim();
            if (isim && url) yeniLinkler.push({ isim, url });
        });

        const yeniMetinler = {
            unvan: titleInput.value.trim(),
            aciklama: bioInput.value.trim(),
            linkler: yeniLinkler
        };

        // Güvenli (RLS) veritabanı güncellemesi
        const { error } = await supabaseClient
            .from('profiles')
            .update({
                profil_gorselleri: yeniGorseller,
                profil_metinleri_ve_linkler: yeniMetinler
            })
            .eq('auth_id', siteVerisi.profil_sahibi_id);

        if (error) {
            errorBox.textContent = "Hata: " + error.message;
            errorBox.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Değişiklikleri Kaydet';
            return;
        }

        // Başarılıysa sayfa verisini yerel olarak güncelle ve anında ekrana yansıt
        siteVerisi.profil_gorselleri = yeniGorseller;
        siteVerisi.profil_metinleri = yeniMetinler;
        siteVerisi.linkler = yeniLinkler;
        
        ekraniCiz(); // Sayfayı yenilemeye gerek kalmadan arayüzü anında değiştirir!
        modaliKapat();
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Değişiklikleri Kaydet';
    });
}
// #endregion

// #region 10: WIDGET EKLEME / DÜZENLEME MODALI (FAZ 3)
// ============================================================
function widgetModaliBaslat() {
    const addBtn = document.getElementById('add-widget-btn');
    const editBtn = document.getElementById('edit-widget-btn');
    const modal = document.getElementById('widget-modal');
    const closeBtn = document.getElementById('widget-modal-close');
    const backdrop = document.getElementById('widget-modal-backdrop');
    const submitBtn = document.getElementById('widget-submit-btn');
    const deleteBtn = document.getElementById('widget-delete-btn');
    const input = document.getElementById('widget-username-input');
    const errorBox = document.getElementById('widget-error-box');

    if (!modal) return;

    const modaliAc = (isEdit) => {
        modal.classList.add('is-open');
        errorBox.style.display = 'none';
        
        if (isEdit) {
            const mtWidget = siteVerisi.widgetlar.find(w => w.tur === 'monkeytype');
            input.value = mtWidget ? mtWidget.ayarlar.kullanici : '';
            deleteBtn.style.display = 'block';
            modal.querySelector('.auth-modal-title').textContent = "Widget Düzenle";
        } else {
            input.value = '';
            deleteBtn.style.display = 'none';
            modal.querySelector('.auth-modal-title').textContent = "Widget Ekle";
        }
    };

    const modaliKapat = () => modal.classList.remove('is-open');

    // Boşken yeni ekleme
    if(addBtn) addBtn.addEventListener('click', () => modaliAc(false));
    
    // Doluyken düzenleme (BÜYÜK SORUNUN ÇÖZÜMÜ: Hover Animasyonunu Tetiklemez)
    if(editBtn) editBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Tıklamanın aşağıdaki karta (hover koduna) geçmesini engeller!
        modaliAc(true);
    });
    
    closeBtn.addEventListener('click', modaliKapat);
    backdrop.addEventListener('click', modaliKapat);

    // Kaydetme
    submitBtn.addEventListener('click', async () => {
        const username = input.value.trim();
        if(!username) {
            errorBox.textContent = "Kullanıcı adı boş olamaz!";
            errorBox.style.display = 'block';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'İşleniyor...';

        const yeniWidgetlar = [{ tur: 'monkeytype', ayarlar: { kullanici: username } }];

        // Supabase profili güncelle
        const { error } = await supabaseClient
            .from('profiles')
            .update({ widgetlar: yeniWidgetlar })
            .eq('auth_id', siteVerisi.profil_sahibi_id);

        if (error) {
            errorBox.textContent = "Hata: " + error.message;
            errorBox.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Kaydet';
            return;
        }

        // Widget güncellendiğinde canlı istatistikleri çekmesi için sayfayı yenile
        window.location.reload();
    });

    // Widget'ı Silme
    deleteBtn.addEventListener('click', async () => {
        deleteBtn.disabled = true;
        deleteBtn.textContent = 'Kaldırılıyor...';

        const { error } = await supabaseClient
            .from('profiles')
            .update({ widgetlar: [] })
            .eq('auth_id', siteVerisi.profil_sahibi_id);

        if (error) {
            errorBox.textContent = "Hata: " + error.message;
            errorBox.style.display = 'block';
            deleteBtn.disabled = false;
            deleteBtn.textContent = 'Kaldır';
            return;
        }

        window.location.reload();
    });
}
// #endregion

// #region 8: BAŞLATMA (INIT)
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    await oturumuKontrolEt(); 
    
    // YENİ: URL'de isim var mı yok mu kontrolü
    if (!KULLANICI_ADI) {
        // ZİYARETÇİ MODU (LANDING PAGE EKRANI)
        document.getElementById('app-wrapper').style.display = 'none';
        document.getElementById('landing-screen').style.display = 'flex';
        landingEkraniniBaslat();
    } else {
        // UYGULAMA MODU (KULLANICI PROFİLİ EKRANI)
        document.getElementById('landing-screen').style.display = 'none';
        document.getElementById('app-wrapper').style.display = 'block';
        
        widgetEtkilesimBaslat();
        aramaModaliniBaslat();
        silmeEtkilesimBaslat();
        authModaliniBaslat();
        await tumVerileriCek(); 
        profilDuzenlemeBaslat();
        widgetModaliBaslat();
    }
});
// #endregion