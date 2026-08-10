// #region BLOK 3: UYGULAMA BAŞLATICI (INIT)
// ============================================================

// YENİ: edit.js sadece isOwner=true olduğunda, gerektiği anda yükleniyor.
// Modül sistemi kullanmıyoruz (mevcut kod global scope'a dayanıyor), o yüzden
// dynamic import() yerine klasik <script> enjeksiyonu ile lazy-load yapıyoruz.
// Bu sayede EditManager, ui.js/main.js için de her zamanki gibi global bir
// değişken olarak kalıyor, hiçbir çağrı noktasını değiştirmemize gerek kalmıyor.
function editJsYukle() {
    return new Promise((resolve, reject) => {
        if (typeof EditManager !== 'undefined') { resolve(); return; } // zaten yüklüyse tekrar yükleme
        const script = document.createElement('script');
        script.src = 'edit.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('edit.js yüklenemedi.'));
        document.head.appendChild(script);
    });
}

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
        
        // NOT: tumVerileriCek() içeride isOwner'ı belirledikten SONRA ekraniCiz()'i
        // zaten çağırıyor (bkz. ui.js). Bu ilk çizim edit.js yokken de güvenli,
        // çünkü ui.js artık EditManager.state'e değil, config.js'deki her zaman
        // var olan `durum` objesine bakıyor (isGlobalEditActive başlangıçta false).
        await tumVerileriCek();

        // isOwner=false ise edit.js'e hiç dokunmuyoruz -> ziyaretçi düzenleme
        // motorunu asla indirmez. isOwner=true ise, kullanıcı "Ayarlar" butonuna
        // basıp gerçekten düzenlemeye başlamadan önce edit.js'in yüklenip
        // EditManager.init()'in çalışmasını garanti ediyoruz.
        if (isOwner) {
            await editJsYukle();
            EditManager.init();  // Tüm düzenleme araçlarını aktif eder!
        }
    }
});
// #endregion
