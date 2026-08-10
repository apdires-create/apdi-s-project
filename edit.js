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
    // NOT: isGlobalEditActive, KATEGORI_ARAMA_TURU ve duzenlenenKategoriId artık
    // burada değil, config.js'deki paylaşılan `durum` objesinde yaşıyor.
    // Sebebi: ui.js (render) bu üç alanı isOwner=false olan ziyaretçiler için de
    // okumak zorunda, ama edit.js sadece owner'sa yükleniyor. EditManager burada
    // sadece kendi iç/private durumunu tutuyor.
    state: {
        hasUnsavedChanges: false,
        orijinalVeri: null, // İptal edilirse geri döneceğimiz güvenli liman
        
        isProfileEditing: false,
        tempProfileLinks: [],
        aramaZamanlayici: null
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
            durum.isGlobalEditActive = !durum.isGlobalEditActive;
            
            if (durum.isGlobalEditActive) {
                document.body.classList.add('global-edit-mode');
                EditManager.state.orijinalVeri = JSON.parse(JSON.stringify(siteVerisi));
                
                // Mod açıldığında Profil inputlarını devreye sok
                EditManager.Profile.duzenlemeyeGec();
            } else {
                if (EditManager.state.hasUnsavedChanges) {
                    const onay = confirm("Kaydedilmemiş değişiklikler var. Çıkmak istediğine emin misin?");
                    if (!onay) {
                        durum.isGlobalEditActive = true; 
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
                durum.isGlobalEditActive = false;
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
        const aramaTuru = durum.KATEGORI_ARAMA_TURU[kategoriId];
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
                if (!durum.isGlobalEditActive) return;
                
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

            // Kategoriyi Komple Silme İşlemi
            deleteBtn.addEventListener('click', () => {
                const duzenlenenId = durum.duzenlenenKategoriId;
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
                if (!durum.isGlobalEditActive) {
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
                if (!durum.isGlobalEditActive) return;
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
                if (!durum.isGlobalEditActive) return;
                
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
                if (!durum.isGlobalEditActive) return;

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
                if (!durum.isGlobalEditActive) {
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
                if (!durum.isGlobalEditActive) return;
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
                if (!durum.isGlobalEditActive) return;
                
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
                
                if (durum.isGlobalEditActive) {
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
                bannerOverlay.addEventListener('click', () => {
                    if (!document.body.classList.contains('global-edit-mode')) {
            const ayarlarButonu = document.getElementById('settings-action-btn');
            if (ayarlarButonu) ayarlarButonu.click();
        }
                    bannerInput.click();
                });
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
                if (!durum.isGlobalEditActive) { e.preventDefault(); return; }
                const slot = e.target.closest('.widget-slot');
                
                // Sadece is-draggable sınıfı olanlar (dolu widgetlar) sürüklenebilir
                if (!slot || !slot.classList.contains('is-draggable')) { e.preventDefault(); return; }
                
                slot.classList.add('is-dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', slot.dataset.index); 
            });

            container.addEventListener('dragover', (e) => {
                if (!durum.isGlobalEditActive) return;
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
                if (!durum.isGlobalEditActive) return;
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
                if (!durum.isGlobalEditActive) return;

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
                if (!durum.isGlobalEditActive) return;
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
                    if (durum.isGlobalEditActive) return;
                    
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
