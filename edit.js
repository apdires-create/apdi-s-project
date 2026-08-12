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

// #region BLOK 2: DÜZENLEME YÖNETİCİSİ (EDIT MANAGER)
const EditManager = {
    
    // #region 0. STATE (ORTAK HAFIZA)
    state: {
        hasUnsavedChanges: false,
        orijinalVeri: null, 
        isProfileEditing: false,
        tempProfileLinks: [],
        aramaZamanlayici: null
    },
    // #endregion

    // #region 0.5 GLOBAL MOD YÖNETİMİ
    Global: {
        baslat() {
            const cancelBtn = document.getElementById('edit-cancel-btn');
            const saveBtn = document.getElementById('edit-save-btn');

            // Sahip sayfaya girdiği an düzenleme aktiftir. İptal ihtimaline karşı orijinal yedeği alıyoruz.
            EditManager.state.orijinalVeri = JSON.parse(JSON.stringify(siteVerisi));
            
            // Her şeyin aktif görünmesi için body class'ını kalıcı veriyoruz
            document.body.classList.add('global-edit-mode'); 

            if (cancelBtn) cancelBtn.addEventListener('click', () => this.sifirla());
            if (saveBtn) saveBtn.addEventListener('click', () => this.kaydet());

            // YENİ: Kaydedilmemiş değişiklik varken sekme kapatılırsa/yenilenirse
            // tarayıcının native "Ayrılmak istediğinize emin misiniz?" uyarısını tetikle.
            // NOT: Modern tarayıcılar özel mesaj metnini göstermez, sadece preventDefault +
            // returnValue set edilmesi tetikleyici olarak yeterlidir.
            window.addEventListener('beforeunload', (e) => {
                if (EditManager.state.hasUnsavedChanges) {
                    e.preventDefault();
                    e.returnValue = '';
                    return '';
                }
            });
        },

        degisiklikYapildi() {
            if (EditManager.state.orijinalVeri) {
                const guncelVeriString = JSON.stringify(siteVerisi);
                const orijinalVeriString = JSON.stringify(EditManager.state.orijinalVeri);
                EditManager.state.hasUnsavedChanges = (guncelVeriString !== orijinalVeriString);
            } else {
                EditManager.state.hasUnsavedChanges = true;
            }

            // Değişiklik varsa CSS devreye girer ve alttan Kaydet/Sıfırla çubuğu fırlar
            if (EditManager.state.hasUnsavedChanges) {
                document.body.classList.add('has-unsaved-changes');
            } else {
                document.body.classList.remove('has-unsaved-changes');
            }
        },

        sifirla() {
            EditManager.state.hasUnsavedChanges = false;
            document.body.classList.remove('has-unsaved-changes');
            
            if (EditManager.state.orijinalVeri) {
                siteVerisi = JSON.parse(JSON.stringify(EditManager.state.orijinalVeri));
            }
            
            // YENİ: Sıfırlama anında geçici link dizisini de orijinaline döndür
            const metinler = siteVerisi.profil_metinleri_ve_linkler || {};
            EditManager.state.tempProfileLinks = [...(metinler.linkler || [])];
            
            try { ekraniCiz(); } catch(error) { console.error("Çizim hatası:", error); }
        },

        async kaydet() {
            if (!EditManager.state.hasUnsavedChanges) return;

            // VİDGET GÜVENLİK KONTROLÜ
            if (siteVerisi.widgetlar && siteVerisi.widgetlar.length > 0) {
                let bosWidgetVarMi = false;
                siteVerisi.widgetlar.forEach((widget, index) => {
                    if (widget && widget.ayarlar) {
                        if (!widget.ayarlar.kullanici || widget.ayarlar.kullanici.trim() === '') {
                            bosWidgetVarMi = true;
                            const container = document.getElementById('widgets-container');
                            if (container) {
                                const slot = container.querySelector(`.widget-slot[data-index="${index}"]`);
                                if (slot) {
                                    slot.classList.add('shake-box-animation');
                                    setTimeout(() => slot.classList.remove('shake-box-animation'), 400);
                                }
                            }
                        }
                    }
                });
                if (bosWidgetVarMi) {
                    toastGoster("Lütfen eklediğiniz widget'ı doldurun veya silin!");
                    const saveBtn = document.getElementById('edit-save-btn');
                    if(saveBtn) {
                        saveBtn.classList.add('shake-box-animation');
                        setTimeout(() => saveBtn.classList.remove('shake-box-animation'), 400);
                    }
                    return; 
                }
            }

            const saveBtn = document.getElementById('edit-save-btn');
            saveBtn.textContent = "İşleniyor...";
            saveBtn.disabled = true;

            try {
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

                // Yeni orijinal veri, kaydettiğimiz güncel veri oluyor
                EditManager.state.orijinalVeri = JSON.parse(JSON.stringify(siteVerisi));
                
                EditManager.state.hasUnsavedChanges = false;
                document.body.classList.remove('has-unsaved-changes');
                
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
        const aramaTuru = durum.KATEGORI_ARAMA_TURU[kategoriId];
        if (!aramaTuru) return [];
        try {
            const data = await this.edgeCagir({ action: 'search', arama_metni: sorgu, arama_turu: aramaTuru });
            return data.sonuclar || [];
        } catch (err) { 
            console.error('Arama hatası:', err); 
            toastGoster('Arama sırasında bir hata oluştu.');
            return []; 
        }
    },
    // #endregion

    // #region 2. İÇERİK YÖNETİMİ (Arama, Ekleme, Silme, Sürükle-Bırak)
    Content: {
        baslat() {
            this.kategoriEklemeSisteminiKur();
            this.kategoriDuzenlemeSisteminiKur();
            this.sekmeSurukleBirakSisteminiKur();
            this.aramaMotorunuKur();
            this.icerikSilmeSisteminiKur();
            this.surukleBirakSisteminiKur();
        },

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
                catErrorBox.classList.remove('is-visible');
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
                    catErrorBox.style.display = ''; 
                    catErrorBox.classList.add('is-visible', 'shake-box-animation');
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

            submitBtn.addEventListener('click', () => {
                const metinler = siteVerisi.profil_metinleri_ve_linkler || {};
                const kategoriler = metinler.kategoriler || [];
                const duzenlenenId = durum.duzenlenenKategoriId;

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

            deleteBtn.addEventListener('click', () => {
                const duzenlenenId = durum.duzenlenenKategoriId;
                const metinler = siteVerisi.profil_metinleri_ve_linkler || {};
                const kategoriler = metinler.kategoriler || [];
                const kategori = kategoriler.find(k => k.id === duzenlenenId);

                if (!kategori) return;

                ozelOnayAl(`"${kategori.ad}" kategorisini ve içindeki tüm afişleri silmek istediğine emin misin?`, () => {
                    metinler.kategoriler = kategoriler.filter(k => k.id !== duzenlenenId);
                    delete siteVerisi.icerik[duzenlenenId]; 
                    
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
                const tab = e.target.closest('.tab');
                if(!tab) return;
                
                tab.classList.add('is-dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', tab.dataset.id); 
            });

            tabsContainer.addEventListener('dragover', (e) => {
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
                const draggingTab = e.target.closest('.tab');
                if (draggingTab) {
                    draggingTab.classList.remove('is-dragging');
                }

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

            searchCloseBtn.addEventListener('click', modaliKapat);
            searchBackdrop.addEventListener('click', modaliKapat);
            
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

            document.addEventListener('keydown', (e) => { 
                if (e.key === 'Escape') {
                    if (searchModal.classList.contains('is-open')) modaliKapat();
                    const catModal = document.getElementById('category-modal');
                    if (catModal && catModal.classList.contains('is-open')) catModal.classList.remove('is-open');
                }
            });
        },

        icerikSilmeSisteminiKur() {
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
                const kimlik = cardEl.dataset.kimlik;
                if (!kimlik || !aktifKategoriId) return;
                
                siteVerisi.icerik[aktifKategoriId] = siteVerisi.icerik[aktifKategoriId].filter(k => k.kimlik !== kimlik);
                kartlariGriddeListele(siteVerisi.icerik[aktifKategoriId]);
                EditManager.Global.degisiklikYapildi(); 
            });
        },

        surukleBirakSisteminiKur() {
            const contentGrid = document.getElementById('content-grid');
            if (!contentGrid) return;

            contentGrid.addEventListener('dragstart', (e) => {
                const card = e.target.closest('.content-card');
                if (!card || card.classList.contains('ghost-add-slot')) {
                    e.preventDefault();
                    return;
                }
                
                card.classList.add('is-dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', 'dragging'); 
            });

            contentGrid.addEventListener('dragover', (e) => {
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

            contentGrid.addEventListener('dragend', (e) => {
                const draggingCard = e.target.closest('.content-card');
                if (draggingCard) {
                    draggingCard.classList.remove('is-dragging');
                }

                const guncelSiraElementleri = [...contentGrid.querySelectorAll('.content-card:not(.ghost-add-slot)')];
                const yeniSiralamaKimlikleri = guncelSiraElementleri.map(el => el.dataset.kimlik);
                
                const eskiDizi = siteVerisi.icerik[aktifKategoriId] || [];
                const eskiSiralamaKimlikleri = eskiDizi.map(k => k.kimlik);

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
        cropperInstance: null,
        guncelHedefTur: null, // 'pfp' veya 'banner'

        async yukleVeGuncelle(fileBlob, tur) {
    if (!aktifKullaniciOturumu) return;
    const authId = aktifKullaniciOturumu.user.id;
    const fileName = `${tur}-${Date.now()}.webp`; 
    const filePath = `${authId}/${fileName}`; 

    // YENİ: Yeni dosya yüklenmeden önce eskisinin yolunu çıkar
    const eskiUrl = tur === 'banner' ? siteVerisi.profil_gorselleri?.banner_url : siteVerisi.profil_gorselleri?.pfp_url;
    let eskiDosyaYolu = null;
    if (eskiUrl) {
        const marker = '/avatars-and-banners/';
        const idx = eskiUrl.indexOf(marker);
        if (idx !== -1) eskiDosyaYolu = eskiUrl.slice(idx + marker.length);
    }

    try {
        const { error: uploadError } = await supabaseClient.storage.from('avatars-and-banners').upload(filePath, fileBlob, {
            contentType: 'image/webp',
        });
        
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabaseClient.storage.from('avatars-and-banners').getPublicUrl(filePath);
        const publicUrl = publicUrlData.publicUrl;

        const yeniGorseller = { ...siteVerisi.profil_gorselleri };
        if (tur === 'banner') yeniGorseller.banner_url = publicUrl;
        if (tur === 'pfp') yeniGorseller.pfp_url = publicUrl;

        siteVerisi.profil_gorselleri = yeniGorseller;
        
        EditManager.Global.degisiklikYapildi();
        ekraniCiz(); 
        toastGoster("Görsel başarıyla güncellendi!");

        // YENİ: Eski dosyayı arka planda temizle, hataysa sessizce logla (kritik yol değil)
        if (eskiDosyaYolu && eskiDosyaYolu !== filePath) {
            supabaseClient.storage.from('avatars-and-banners').remove([eskiDosyaYolu])
                .catch(err => console.error('Eski görsel silinemedi:', err));
        }

    } catch (error) {
        alert(`Yükleme hatası: ${error.message}`);
    }
},

        cropModaliniAc(file, tur) {
            const maxBoyut = 2 * 1024 * 1024; // 2 MB
            if (file.size > maxBoyut) {
                toastGoster(`Dosya çok büyük! Lütfen 2 MB'ın altında bir görsel seçin.`);
                return;
            }

            this.guncelHedefTur = tur;
            const reader = new FileReader();
            reader.onload = (e) => {
                const modal = document.getElementById('cropper-modal');
                const image = document.getElementById('cropper-image');
                
                image.src = e.target.result;
                modal.classList.add('is-open');

                if (this.cropperInstance) {
                    this.cropperInstance.destroy();
                }

                // Aspect Ratio Ayarları: PFP için 1:1, Banner için 5:1 
                const oran = tur === 'pfp' ? 1 / 1 : 5 / 1; 

                this.cropperInstance = new Cropper(image, {
                    aspectRatio: oran,
                    viewMode: 2,
                    background: false,
                    autoCropArea: 1,
                });
            };
            reader.readAsDataURL(file);
        },

        baslat() {
            const bannerOverlay = document.getElementById('banner-edit-overlay');
            const bannerInput = document.getElementById('banner-file-input');
            const pfpOverlay = document.getElementById('pfp-edit-overlay');
            const pfpInput = document.getElementById('pfp-file-input');

            // Crop Modal Elementleri
            const cropperModal = document.getElementById('cropper-modal');
            const btnClose = document.getElementById('cropper-modal-close');
            const btnCancel = document.getElementById('cropper-cancel-btn');
            const btnSave = document.getElementById('cropper-save-btn');
            const backdrop = document.getElementById('cropper-modal-backdrop');

            const modaliKapat = () => {
                cropperModal.classList.remove('is-open');
                if (this.cropperInstance) this.cropperInstance.destroy();
                if (bannerInput) bannerInput.value = '';
                if (pfpInput) pfpInput.value = '';
            };

            if (btnClose) btnClose.addEventListener('click', modaliKapat);
            if (btnCancel) btnCancel.addEventListener('click', modaliKapat);
            if (backdrop) backdrop.addEventListener('click', modaliKapat);

            if (btnSave) {
                btnSave.addEventListener('click', () => {
                    if (!this.cropperInstance) return;
                    
                    btnSave.textContent = 'İşleniyor...';
                    btnSave.disabled = true;

                    const canvasWidth = this.guncelHedefTur === 'pfp' ? 400 : 1200; 

                    const canvas = this.cropperInstance.getCroppedCanvas({
                        width: canvasWidth,
                        imageSmoothingEnabled: true,
                        imageSmoothingQuality: 'high',
                    });

                    // Supabase'i yormamak için sıkıştırılmış webp formatına çeviriyoruz
                    canvas.toBlob(async (blob) => {
                        await this.yukleVeGuncelle(blob, this.guncelHedefTur);
                        modaliKapat();
                        btnSave.textContent = 'Kırp ve Yükle';
                        btnSave.disabled = false;
                    }, 'image/webp', 0.85); 
                });
            }

            if (bannerOverlay && bannerInput) {
                bannerOverlay.addEventListener('click', () => bannerInput.click());
                bannerInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) this.cropModaliniAc(file, 'banner');
                });
            }

            if (pfpOverlay && pfpInput) {
                pfpOverlay.addEventListener('click', () => pfpInput.click());
                pfpInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) this.cropModaliniAc(file, 'pfp');
                });
            }
        }
    },
    // #endregion

    // #region 4. WIDGET YÖNETİMİ
    Widget: {
        aktifDüzenlenenSlot: null, // Hangi widget'ın arkası dönük?
        orijinalInputDegeri: "",   // İptal edilirse geri dönmek için yedeğimiz

        modalBaslat() {
            const modal = document.getElementById('widget-selection-modal');
            const closeBtn = document.getElementById('widget-modal-close');
            const backdrop = document.getElementById('widget-modal-backdrop');
            const buttons = document.querySelectorAll('.widget-select-btn:not(.disabled)');

            if (!modal) return;
            const modaliKapat = () => modal.classList.remove('is-open');
            if (closeBtn) closeBtn.addEventListener('click', modaliKapat);
            if (backdrop) backdrop.addEventListener('click', modaliKapat);

            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const type = btn.dataset.type;
                    if (!siteVerisi.widgetlar) siteVerisi.widgetlar = [];
                    
                    siteVerisi.widgetlar.push({ tur: type, ayarlar: { kullanici: '' } });
                    if(type === 'monkeytype') siteVerisi.monkeytype_skorlari = null;
                    
                    WidgetEngine.ciz();
                    EditManager.Global.degisiklikYapildi();
                    modaliKapat();
                    
                    // Yeni eklenen widget'ın ismini girmesi için kartı otomatik ters çeviriyoruz!
                    setTimeout(() => {
                        const container = document.getElementById('widgets-container');
                        const newSlot = container.querySelector(`.widget-slot[data-index="${siteVerisi.widgetlar.length - 1}"]`);
                        if (newSlot) {
                            const editBtn = newSlot.querySelector('.edit-trigger-btn');
                            if (editBtn) editBtn.click();
                        }
                    }, 50);
                });
            });
        },

        surukleBirakSisteminiKur() {
            const container = document.getElementById('widgets-container');
            if (!container) return;

            container.addEventListener('dragstart', (e) => {
                const slot = e.target.closest('.widget-slot');
                if (!slot || !slot.classList.contains('is-draggable')) return;
                
                slot.classList.add('is-dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', slot.dataset.index); 
            });

            container.addEventListener('dragover', (e) => {
                e.preventDefault();
                const draggingSlot = container.querySelector('.is-dragging');
                if (!draggingSlot) return;

                const targetSlot = e.target.closest('.widget-slot:not(.is-dragging)');
                if (targetSlot) {
                    const box = targetSlot.getBoundingClientRect();
                    const offset = e.clientY - box.top;
                    if (offset > box.height / 2) targetSlot.after(draggingSlot);
                    else targetSlot.before(draggingSlot);
                }
            });

            container.addEventListener('dragend', (e) => {
                const draggingSlot = e.target.closest('.widget-slot');
                if (draggingSlot) draggingSlot.classList.remove('is-dragging');

                const guncelSira = [...container.querySelectorAll('.widget-slot.is-draggable')];
                const yeniWidgetDizisi = guncelSira.map(slot => {
                    const oldIndex = parseInt(slot.dataset.index);
                    return siteVerisi.widgetlar[oldIndex];
                });

                if (JSON.stringify(siteVerisi.widgetlar) !== JSON.stringify(yeniWidgetDizisi)) {
                    siteVerisi.widgetlar = yeniWidgetDizisi;
                    EditManager.Global.degisiklikYapildi();
                    WidgetEngine.ciz(); // İndekslerin DOM'a işlemesi için arayüzü tekrar çiziyoruz
                }
            });
        },

        // Kartı kapatan güvenlik fonksiyonu
        kartiKapat(slot) {
            const inner = slot.querySelector('.widget-flip-inner');
            if (inner) inner.classList.remove('is-flipped');
            if (this.aktifDüzenlenenSlot === slot) {
                this.aktifDüzenlenenSlot = null;
                this.orijinalInputDegeri = "";
            }
        },

        baslat() {
            this.modalBaslat();
            this.surukleBirakSisteminiKur();
            
            const container = document.getElementById('widgets-container');
            if (!container) return;

            // Tıklama Olayları Yönetimi
            container.addEventListener('click', (e) => {
                const slot = e.target.closest('.widget-slot');
                if (!slot) return;
                const index = parseInt(slot.dataset.index);

                // 1. Yeni Ekle (+)'ya Tıklandıysa (Hayalet Yuva)
                if (e.target.closest('.widget-ghost-slot')) {
                    const modal = document.getElementById('widget-selection-modal');
                    if (modal) modal.classList.add('is-open');
                    return;
                }

                const inner = slot.querySelector('.widget-flip-inner');
                const input = slot.querySelector('.widget-username-input');

                // 2. Kalem (Düzenle) Butonuna Tıklandıysa -> Kartı Döndür
                if (e.target.closest('.edit-trigger-btn')) {
                    // Eğer açık bir kart varsa onu güvenlice kapatmayı dene
                    if (this.aktifDüzenlenenSlot && this.aktifDüzenlenenSlot !== slot) {
                        const aktifInput = this.aktifDüzenlenenSlot.querySelector('.widget-username-input');
                        if (aktifInput && aktifInput.value.trim() !== this.orijinalInputDegeri) {
                            // Diğer kartta değişiklik var, kapatılamaz! Onu titretip uyar.
                            this.aktifDüzenlenenSlot.classList.add('shake-box-animation');
                            setTimeout(() => { if(this.aktifDüzenlenenSlot) this.aktifDüzenlenenSlot.classList.remove('shake-box-animation') }, 400);
                            return; 
                        } else {
                            this.kartiKapat(this.aktifDüzenlenenSlot); // Değişiklik yoksa eski kartı kapat
                        }
                    }

                    inner.classList.add('is-flipped');
                    this.aktifDüzenlenenSlot = slot;
                    this.orijinalInputDegeri = input ? input.value.trim() : "";
                    
                    // Inputa odaklan ve metnin sonuna git
                    if (input) {
                        setTimeout(() => {
                            input.focus();
                            input.selectionStart = input.selectionEnd = input.value.length;
                        }, 300); // 3D dönüş süresini bekliyor
                    }
                    return;
                }

                // 3. İptal (X) Butonuna Tıklandıysa -> Yazıyı Geri Al ve Kapat
                if (e.target.closest('.cancel-btn')) {
                    if (input) input.value = this.orijinalInputDegeri;
                    const actions = slot.querySelector('.widget-save-actions');
                    if(actions) actions.classList.remove('is-visible');
                    this.kartiKapat(slot);
                    return;
                }

                // 4. Onayla (Check) Butonuna Tıklandıysa -> Sistemi Güncelle ve Kapat
                if (e.target.closest('.confirm-btn')) {
                    if (siteVerisi.widgetlar[index] && input) {
                        const yeniDeger = input.value.trim();
                        siteVerisi.widgetlar[index].ayarlar.kullanici = yeniDeger;
                        if(siteVerisi.widgetlar[index].tur === 'monkeytype') siteVerisi.monkeytype_skorlari = null;
                        
                        EditManager.Global.degisiklikYapildi();
                        WidgetEngine.ciz(); 
                        this.aktifDüzenlenenSlot = null; 
                    }
                    return;
                }

                // 5. Sil (Çöp Kutusu) Butonuna Tıklandıysa -> Direkt Sil
                if (e.target.closest('.delete-trigger-btn')) {
                    siteVerisi.widgetlar.splice(index, 1);
                    siteVerisi.monkeytype_skorlari = null; 
                    WidgetEngine.ciz(); 
                    EditManager.Global.degisiklikYapildi();
                    this.aktifDüzenlenenSlot = null;
                    return;
                }
            });

            // Girdi Dinleyicisi (Sadece değişiklik varsa Onay butonlarını gösterir)
            container.addEventListener('input', (e) => {
                const input = e.target.closest('.widget-username-input');
                if (input) {
                    const slot = input.closest('.widget-slot');
                    const actions = slot.querySelector('.widget-save-actions');
                    if (actions) {
                        if (input.value.trim() !== this.orijinalInputDegeri) {
                            actions.classList.add('is-visible');
                        } else {
                            actions.classList.remove('is-visible');
                        }
                    }
                }
            });

            // Ekranda boşluğa tıklama sensörü (Click Outside)
            document.addEventListener('click', (e) => {
                if (!this.aktifDüzenlenenSlot) return;

                // Tıklanan yer aktif widget değilse ve yeni widget ekleme ekranında değilsek
                if (!this.aktifDüzenlenenSlot.contains(e.target) && !e.target.closest('.widget-selection-grid')) {
                    const input = this.aktifDüzenlenenSlot.querySelector('.widget-username-input');
                    const actions = this.aktifDüzenlenenSlot.querySelector('.widget-save-actions');
                    
                    if (input && input.value.trim() !== this.orijinalInputDegeri) {
                        // Kilit mekanizması: Değişiklik varsa kapatmayı reddet ve titret
                        this.aktifDüzenlenenSlot.classList.add('shake-box-animation');
                        setTimeout(() => {
                            if(this.aktifDüzenlenenSlot) this.aktifDüzenlenenSlot.classList.remove('shake-box-animation');
                        }, 400);
                    } else {
                        // Değişiklik yoksa kartı geri kapat
                        if(actions) actions.classList.remove('is-visible');
                        this.kartiKapat(this.aktifDüzenlenenSlot);
                    }
                }
            });
            
            // Enter tuşu ile hızlı onay
            container.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const input = e.target.closest('.widget-username-input');
                    if (input) {
                        e.preventDefault();
                        const slot = input.closest('.widget-slot');
                        const confirmBtn = slot.querySelector('.confirm-btn');
                        if (confirmBtn && slot.querySelector('.widget-save-actions.is-visible')) {
                            confirmBtn.click();
                        } else if (input.value.trim() === this.orijinalInputDegeri) {
                            this.kartiKapat(slot);
                        }
                    }
                }
            });
        }
    },
    // #endregion

    // #region 5. PROFİL (METİN & LİNK) YÖNETİMİ
    Profile: {
        isClickOutsideAttached: false,
        isDraggingRow: false, 

        renderLinks() {
            const wrapper = document.getElementById('links-wrapper');
            if(!wrapper) return;
            wrapper.innerHTML = ''; 
            
            const KALEM_IKONU = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
            const SIL_IKONU = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

            const urlGecerliMi = (string) => {
                const res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
                return (res !== null);
            };

            const closeAccordion = (rowEl, collapseEl, urlInput) => {
                const currentUrl = urlInput.value.trim();
                const errorEl = rowEl.querySelector('.inline-url-error');
                
                if (currentUrl && !urlGecerliMi(currentUrl)) {
                    urlInput.style.borderColor = "var(--color-danger-rgb)";
                    errorEl.style.display = "block";
                    return false; // Hata varsa kapatma!
                }

                if (!rowEl.classList.contains('is-expanded')) return true;
                
                collapseEl.style.height = collapseEl.scrollHeight + 'px';
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => { collapseEl.style.height = '0px'; });
                });
                
                rowEl.classList.remove('is-expanded');
                rowEl.setAttribute('draggable', 'true');
                
                const toggleBtn = rowEl.querySelector('.nook-link-toggle');
                toggleBtn.innerHTML = KALEM_IKONU;
                toggleBtn.title = 'Düzenle';

                return true;
            };

            const openAccordion = (rowEl, collapseEl) => {
                if (rowEl.classList.contains('is-expanded')) return;
                
                let canOpen = true;
                wrapper.querySelectorAll('.nook-link-row.is-expanded').forEach(openRow => {
                    const otherUrlInput = openRow.querySelector('.edit-url-input');
                    const isClosed = closeAccordion(openRow, openRow.querySelector('.nook-link-collapse'), otherUrlInput);
                    if (!isClosed) canOpen = false; 
                });

                if (!canOpen) return; 
                
                rowEl.classList.add('is-expanded');
                rowEl.removeAttribute('draggable');
                
                const toggleBtn = rowEl.querySelector('.nook-link-toggle');
                toggleBtn.innerHTML = SIL_IKONU;
                toggleBtn.title = 'Sil';

                collapseEl.style.height = collapseEl.scrollHeight + 'px';
                setTimeout(() => {
                    if (rowEl.classList.contains('is-expanded')) collapseEl.style.height = 'auto';
                }, 220);
            };

            const deleteRowWithAnim = (rowEl, index) => {
                rowEl.classList.add('is-deleting');
                
                // Silinme işleminde global kaydet butonundaki kilit varsa açalım
                const saveBtn = document.getElementById('edit-save-btn');
                if (saveBtn) saveBtn.classList.remove('is-locked');

                setTimeout(() => {
                    EditManager.state.tempProfileLinks.splice(index, 1);
                    if (!siteVerisi.profil_metinleri_ve_linkler) siteVerisi.profil_metinleri_ve_linkler = {};
                    siteVerisi.profil_metinleri_ve_linkler.linkler = EditManager.state.tempProfileLinks;
                    EditManager.Global.degisiklikYapildi();
                    EditManager.Profile.renderLinks();
                }, 250); 
            };

            EditManager.state.tempProfileLinks.forEach((link, index) => {
                let domain = '';
                try { domain = new URL(link.url).hostname.replace(/^www\./, ''); } catch(e) { domain = 'Bağlantı'; }

                const row = document.createElement('div');
                row.className = 'nook-link-row';
                row.setAttribute('draggable', 'true');
                row.dataset.index = index; 

                // YENİ HTML: Başlık kaldırıldı, input altına hata mesajı satırı eklendi
                row.innerHTML = `
                    <div class="nook-link-main">
                        <div class="nook-link-icon">${getLinkIcon(link.url)}</div>
                        <div class="nook-link-info">
                            <span class="nook-link-name">${escapeHtml(link.isim) || 'Yeni bağlantı'}</span>
                            <input type="text" class="nook-link-input edit-isim-input" placeholder="Görünen İsim (Örn: Twitter)" value="${escapeHtml(link.isim)}" autocomplete="off" spellcheck="false">
                            <span class="nook-link-domain">${domain}</span>
                        </div>
                        <button class="nook-link-toggle" title="Düzenle">${KALEM_IKONU}</button>
                    </div>
                    
                    <div class="nook-link-collapse" style="height: 0px;">
                        <div class="nook-link-form">
                            <input type="url" class="nook-link-input edit-url-input" placeholder="https://ornek.com" value="${escapeHtml(link.url)}" autocomplete="off" spellcheck="false">
                            <span class="inline-url-error" style="display: none; color: var(--color-danger-light); font-size: 11px; margin-top: 2px;">Lütfen geçerli bir internet adresi girin.</span>
                        </div>
                    </div>
                `;
                
                const toggleBtn = row.querySelector('.nook-link-toggle');
                const collapseEl = row.querySelector('.nook-link-collapse');
                const nameInput = row.querySelector('.edit-isim-input');
                const urlInput = row.querySelector('.edit-url-input');
                const errorEl = row.querySelector('.inline-url-error');

                const autoSave = () => {
                    let val = urlInput.value.trim();
                    const saveBtn = document.getElementById('edit-save-btn');

                    // 1. HATA KONTROLÜ
                    if (val && !urlGecerliMi(val)) {
                        urlInput.style.borderColor = "var(--color-danger-rgb)";
                        errorEl.style.display = "block";
                        if (saveBtn) saveBtn.classList.add('is-locked'); // Onay Butonunu Kilitle
                        return; // Sistemi Güncelleme
                    } 
                    
                    // 2. HATA YOKSA NORMAL İŞLEYİŞE DÖN
                    urlInput.style.borderColor = "";
                    errorEl.style.display = "none";
                    
                    // Başka bir satırda hata var mı diye kontrol et, yoksa kilidi aç
                    if (saveBtn) {
                        const anyError = document.querySelector('.inline-url-error[style*="display: block"]');
                        if (!anyError) saveBtn.classList.remove('is-locked');
                    }

                    if (val && !val.startsWith('http')) val = 'https://' + val;
                    EditManager.state.tempProfileLinks[index] = { isim: nameInput.value.trim(), url: val };
                    
                    if (!siteVerisi.profil_metinleri_ve_linkler) siteVerisi.profil_metinleri_ve_linkler = {};
                    siteVerisi.profil_metinleri_ve_linkler.linkler = EditManager.state.tempProfileLinks;
                    EditManager.Global.degisiklikYapildi(); 
                };

                nameInput.addEventListener('input', autoSave);
                urlInput.addEventListener('input', autoSave);

                row.addEventListener('mousedown', (e) => e.stopPropagation());

                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (EditManager.Profile.isDraggingRow) return; 

                    if (row.classList.contains('is-expanded')) {
                        deleteRowWithAnim(row, index);
                    } else {
                        openAccordion(row, collapseEl);
                        setTimeout(() => nameInput.focus(), 50);
                    }
                });

                wrapper.appendChild(row);
            });
        },

        alanDuzenlemeyiBaslat(elementId, alanAdi, varsayilanMetin, maxKarakter, isTextarea = false) {
            const el = document.getElementById(elementId);
            if (!el) return;

            el.addEventListener('click', (e) => {
                if (el.querySelector('input') || el.querySelector('textarea') || e.target.closest('a') || e.target.closest('button')) return;

                const metinler = siteVerisi.profil_metinleri_ve_linkler || {};
                const guncelDeger = metinler[alanAdi] || (alanAdi === 'gorunen_isim' ? KULLANICI_ADI.charAt(0).toUpperCase() + KULLANICI_ADI.slice(1) : '');
                
                el.classList.add('is-input-active');
                
                let inputHTML = '';
                if (isTextarea) {
                    inputHTML = `
                        <div style="position: relative;">
                            <textarea class="search-input edit-input-rect auto-expand-textarea" maxlength="${maxKarakter}" placeholder="${varsayilanMetin}" style="padding-bottom: 24px;">${guncelDeger}</textarea>
                            <span class="bio-counter" style="position: absolute; bottom: 12px; right: 12px; font-size: 0.7rem; color: rgba(255,255,255,0.4); font-family: var(--font-mono); pointer-events: none;">${guncelDeger.length}/${maxKarakter}</span>
                        </div>
                    `;
                    el.classList.remove('ghost-text');
                } else {
                    inputHTML = `<input type="text" class="search-input edit-input-rect edit-name-input" maxlength="${maxKarakter}" value="${guncelDeger}" placeholder="${varsayilanMetin}">`;
                    if (elementId !== 'inline-name') el.classList.remove('ghost-text');
                }
                
                el.innerHTML = inputHTML;
                const inputEl = el.querySelector('input, textarea');
                
                if (isTextarea) {
                    inputEl.style.height = 'auto';
                    inputEl.style.height = (inputEl.scrollHeight) + 'px';
                    inputEl.addEventListener('input', function() {
                        this.style.height = 'auto';
                        this.style.height = (this.scrollHeight) + 'px';
                        const counterEl = el.querySelector('.bio-counter');
                        if (counterEl) counterEl.textContent = `${this.value.length}/${maxKarakter}`;
                    });
                }
                
                inputEl.focus();

                const kaydetVeKapat = () => {
                    const yeniDeger = inputEl.value.trim();
                    if (!siteVerisi.profil_metinleri_ve_linkler) siteVerisi.profil_metinleri_ve_linkler = {};
                    siteVerisi.profil_metinleri_ve_linkler[alanAdi] = yeniDeger;
                    el.classList.remove('is-input-active');
                    ekraniCiz(); 
                    EditManager.Global.degisiklikYapildi(); 
                };

                inputEl.addEventListener('blur', kaydetVeKapat);
                inputEl.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !isTextarea) {
                        e.preventDefault();
                        kaydetVeKapat();
                    }
                });
            });
        },

        linkSurukleBirakSisteminiKur() {
            const wrapper = document.getElementById('profile-links-container');
            if (!wrapper) return;

            wrapper.addEventListener('dragstart', (e) => {
                const linkItem = e.target.closest('.nook-link-row');
                if (!linkItem) { e.preventDefault(); return; }
                
                EditManager.Profile.isDraggingRow = true; 
                linkItem.classList.add('is-dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', linkItem.dataset.index); 
            });

            wrapper.addEventListener('dragover', (e) => {
                e.preventDefault(); 
                const draggingLink = wrapper.querySelector('.is-dragging');
                if (!draggingLink) return;

                const targetLink = e.target.closest('.nook-link-row:not(.is-dragging)');
                if (targetLink) {
                    const box = targetLink.getBoundingClientRect();
                    const offset = e.clientY - box.top;
                    
                    if (offset > box.height / 2) {
                        targetLink.after(draggingLink);
                    } else {
                        targetLink.before(draggingLink);
                    }
                }
            });

            wrapper.addEventListener('dragend', (e) => {
                const draggingLink = e.target.closest('.nook-link-row');
                if (draggingLink) draggingLink.classList.remove('is-dragging');

                setTimeout(() => { EditManager.Profile.isDraggingRow = false; }, 50);

                const actualWrapper = document.getElementById('links-wrapper');
                if(!actualWrapper) return;
                
                const guncelSira = [...actualWrapper.querySelectorAll('.nook-link-row')];
                const yeniDizi = guncelSira.map(el => {
                    const oldIndex = parseInt(el.dataset.index);
                    return EditManager.state.tempProfileLinks[oldIndex];
                });

                if (JSON.stringify(EditManager.state.tempProfileLinks) !== JSON.stringify(yeniDizi)) {
                    EditManager.state.tempProfileLinks = yeniDizi;
                    if (!siteVerisi.profil_metinleri_ve_linkler) siteVerisi.profil_metinleri_ve_linkler = {};
                    siteVerisi.profil_metinleri_ve_linkler.linkler = yeniDizi;
                    
                    EditManager.Global.degisiklikYapildi();
                    EditManager.Profile.renderLinks(); 
                }
            });
        },

        baslat() {
            this.alanDuzenlemeyiBaslat('inline-name', 'gorunen_isim', 'Görünen İsim', 20);
            this.alanDuzenlemeyiBaslat('inline-title', 'unvan', 'Ünvan Ekle (Örn: Designer)', 30);
            this.alanDuzenlemeyiBaslat('inline-bio', 'aciklama', 'Kendinden bahset...', 160, true);

            const metinler = siteVerisi.profil_metinleri_ve_linkler || {};
            EditManager.state.tempProfileLinks = [...(metinler.linkler || [])];
            
            this.renderLinks();
            this.linkSurukleBirakSisteminiKur();

            if (!this.isClickOutsideAttached) {
                document.addEventListener('mousedown', (e) => {
                    const wrapper = document.getElementById('links-wrapper');
                    if (!wrapper) return;
                    
                    wrapper.querySelectorAll('.nook-link-row.is-expanded').forEach(openRow => {
                        const idx = openRow.dataset.index;
                        const linkData = EditManager.state.tempProfileLinks[idx];
                        const urlInput = openRow.querySelector('.edit-url-input');
                        
                        const urlGecerliMi = (string) => {
                            const res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
                            return (res !== null);
                        };

                        if (urlInput.value.trim() && !urlGecerliMi(urlInput.value.trim())) {
                            urlInput.style.borderColor = "var(--color-danger-rgb)";
                            openRow.querySelector('.inline-url-error').style.display = "block";
                            return; 
                        }

                        if (linkData && !linkData.isim.trim() && !linkData.url.trim()) {
                            openRow.classList.add('is-deleting');
                            setTimeout(() => {
                                EditManager.state.tempProfileLinks.splice(idx, 1);
                                EditManager.Profile.renderLinks();
                            }, 250);
                        } else {
                            const collapseEl = openRow.querySelector('.nook-link-collapse');
                            collapseEl.style.height = collapseEl.scrollHeight + 'px';
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => { collapseEl.style.height = '0px'; });
                            });
                            
                            openRow.classList.remove('is-expanded');
                            openRow.setAttribute('draggable', 'true');
                            
                            const toggleBtn = openRow.querySelector('.nook-link-toggle');
                            toggleBtn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
                            toggleBtn.title = 'Düzenle';
                            
                            const nameInput = openRow.querySelector('.edit-isim-input');
                            openRow.querySelector('.nook-link-name').textContent = nameInput.value.trim() || 'Yeni bağlantı';
                            
                            let domain = '';
                            try { domain = new URL(urlInput.value.trim()).hostname.replace(/^www\./, ''); } catch(err) { domain = 'Bağlantı'; }
                            openRow.querySelector('.nook-link-domain').textContent = domain;
                        }
                    });
                });
                this.isClickOutsideAttached = true;
            }
        },
        
        linkModaliBaslat() {
            const addBtn = document.getElementById('inline-add-link-btn');
            if (!addBtn) return;

            addBtn.addEventListener('mousedown', (e) => e.stopPropagation()); 

            addBtn.addEventListener('click', (e) => {
                e.stopPropagation(); 
                if (EditManager.state.tempProfileLinks.length >= 10) {
                    toastGoster("Profiline maksimum 10 link ekleyebilirsin.");
                    return;
                }
                
                const hasEmpty = EditManager.state.tempProfileLinks.some(l => !l.isim.trim() && !l.url.trim());
                if (hasEmpty) {
                    const expandedInput = document.querySelector('.nook-link-row.is-expanded .edit-isim-input');
                    if (expandedInput) expandedInput.focus();
                    return;
                }
                
                EditManager.state.tempProfileLinks.push({ isim: '', url: '' });
                EditManager.Global.degisiklikYapildi(); 
                EditManager.Profile.renderLinks();
                
                const wrapper = document.getElementById('links-wrapper');
                if (wrapper) {
                    const newItem = wrapper.lastElementChild;
                    if (newItem) {
                        const toggleBtn = newItem.querySelector('.nook-link-toggle');
                        if (toggleBtn) toggleBtn.click(); 
                    }
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
                EditManager.Global.degisiklikYapildi(); 
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
