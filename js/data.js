// #region 1: SUPABASE PROFİL VERİ ÇEKME MOTORU (DATA FETCHING)
async function tumVerileriCek() {
    if (!KULLANICI_ADI || !supabaseClient) {
        yuklemeHataDurumunuGoster("Veritabanı bağlantısı kurulamadı veya kullanıcı adı bulunamadı.");
        return false;
    }

    try {
        const { data: profil, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .ilike('kullanici_adi', KULLANICI_ADI)
            .single();

        if (error || !profil) {
            console.warn("Profil bulunamadı:", error?.message);
            yuklemeHataDurumunuGoster("Aradığınız kullanıcı bulunamadı veya profil henüz oluşturulmamış.");
            return false;
        }

        const guvenliObje = (v) => {
            if (!v) return {};
            if (typeof v === 'string') {
                try {
                    const parsed = JSON.parse(v);
                    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
                } catch {
                    return {};
                }
            }
            return (typeof v === 'object' && !Array.isArray(v)) ? v : {};
        };

        const guvenliDizi = (v) => {
            if (!v) return [];
            if (typeof v === 'string') {
                try {
                    const parsed = JSON.parse(v);
                    return Array.isArray(parsed) ? parsed : [];
                } catch {
                    return [];
                }
            }
            return Array.isArray(v) ? v : [];
        };

        // Yeni veritabanı şemasına göre kartVerisi'ni doldur
        kartVerisi.auth_id = profil.auth_id;
        kartVerisi.kullanici_adi = profil.kullanici_adi;
        kartVerisi.front_data = guvenliObje(profil.front_data);
        kartVerisi.links = guvenliDizi(profil.links);
        kartVerisi.tops = guvenliObje(profil.tops);
        kartVerisi.trophies = guvenliDizi(profil.trophies);
        kartVerisi.widgets = guvenliDizi(profil.widgets);
        kartVerisi.working_on = guvenliObje(profil.working_on);
        kartVerisi.theme_config = guvenliObje(profil.theme_config);

        // Sahip kontrolü
        if (aktifKullaniciOturumu && profil.auth_id === aktifKullaniciOturumu.user.id) {
            isOwner = true;
            document.body.classList.add('is-owner');
        } else {
            isOwner = false;
            document.body.classList.remove('is-owner');
        }

        // Tema rengini uygula (varsa)
        if (kartVerisi.theme_config?.primary_color) {
            document.documentElement.style.setProperty('--accent-color', kartVerisi.theme_config.primary_color);
        }

        const loadingUserEl = document.getElementById('app-loading-user');
        if (loadingUserEl) {
            loadingUserEl.classList.add('is-loaded');
        }

        // Arayüzü yeni verilerle çiz
        if (typeof RenderEngine !== 'undefined') {
            RenderEngine.vitrinCiz(kartVerisi);
            RenderEngine.menuCiz(kartVerisi);
            RenderEngine.altEkranlariCiz(kartVerisi);
        }

        // Canlı Widget Skorlarını Asenkron Sorgula (Non-blocking)
        const mtWidget = Array.isArray(kartVerisi.widgets) 
            ? kartVerisi.widgets.find(w => w && w.tur === 'monkeytype')
            : null;

        if (mtWidget) {
            const mtUser = mtWidget.ayarlar?.kullanici || mtWidget.kullanici || mtWidget.username;
            if (mtUser) {
                canliMonkeytypeVerisiCek(mtUser).then(skorlar => {
                    if (skorlar) {
                        kartVerisi.canli_monkeytype = skorlar;
                        if (typeof RenderEngine !== 'undefined') {
                            RenderEngine.monkeytypeGuncelle(skorlar);
                        }
                    }
                });
            }
        }

        return true;
    } catch (err) {
        console.error("Veriler çekilirken beklenmeyen hata:", err);
        yuklemeHataDurumunuGoster("Profil yüklenirken bir sorun meydana geldi.");
        return false;
    }
}
// #endregion

// #region 2: CANLI WIDGET VERİLERİ (MONKEYTYPE API)
async function canliMonkeytypeVerisiCek(kullanici) {
    if (!kullanici) return null;
    try {
        const res = await fetch(`https://api.monkeytype.com/users/${encodeURIComponent(kullanici)}/profile`);
        if (res.ok) {
            const json = await res.json();
            if (json.data && json.data.personalBests) {
                return json.data.personalBests;
            }
        }
    } catch (err) {
        console.warn("Monkeytype profili API'den doğrudan çekilemedi:", err);
    }
    return null;
}
// #endregion

// #region 3: HATA VE BULUNAMADI DURUMU
function yuklemeHataDurumunuGoster(mesaj) {
    document.documentElement.classList.remove('is-profile-loading');
    const profileStage = document.getElementById('profileStage');
    const cardContainer = document.getElementById('cardContainer');
    const appLoadingEl = document.getElementById('app-loading-screen');
    const loadingUserEl = document.getElementById('app-loading-user');
    const errorHintEl = document.getElementById('app-loading-error-hint');
    const loadingBrandEl = document.getElementById('app-loading-brand');

    if (profileStage) profileStage.style.display = 'none';
    if (cardContainer) cardContainer.style.display = 'none';
    if (!appLoadingEl) return;

    appLoadingEl.classList.add('is-error');
    appLoadingEl.style.display = 'flex';
    appLoadingEl.classList.remove('is-hidden');

    if (loadingUserEl) {
        loadingUserEl.textContent = mesaj || "Aradığınız kullanıcı bulunamadı.";
        loadingUserEl.classList.remove('is-loaded');
    }

    if (errorHintEl) {
        errorHintEl.textContent = "Ana sayfaya dönmek için Nook logosuna tıklayın";
    }

    if (loadingBrandEl) {
        loadingBrandEl.title = "Ana Sayfaya Dön";
        loadingBrandEl.style.cursor = "pointer";
        loadingBrandEl.onclick = () => {
            window.location.href = window.location.pathname;
        };
    }
}
// #endregion
