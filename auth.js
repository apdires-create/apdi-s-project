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
        box.style.display = ''; // block iptal edildi
        box.classList.add('is-visible', 'shake-box-animation');
        setTimeout(() => box.classList.remove('shake-box-animation'), 400);
    });
}

function authHataTemizle() {
    document.querySelectorAll('.auth-error-box').forEach(box => {
        box.classList.remove('is-visible');
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
        
        // YENİ: RPC'den önce storage'daki dosyaları temizle
        try {
            const authId = aktifKullaniciOturumu.user.id;
            const { data: dosyalar, error: listError } = await supabaseClient.storage
                .from('avatars-and-banners')
                .list(authId);
            
            if (!listError && dosyalar && dosyalar.length > 0) {
                const silinecekYollar = dosyalar.map(d => `${authId}/${d.name}`);
                await supabaseClient.storage.from('avatars-and-banners').remove(silinecekYollar);
            }
        } catch (storageErr) {
            console.error('Storage temizliği sırasında hata (devam ediliyor):', storageErr);
            // Storage temizlenemese bile hesap silme işlemi durmamalı
        }
        
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
