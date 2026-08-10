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
            if (typeof EditManager !== 'undefined' && durum.isGlobalEditActive) return;

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
            
            if (profilBosMu && !(typeof EditManager !== 'undefined' && durum.isGlobalEditActive)) {
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

    durum.KATEGORI_ARAMA_TURU = {};

    kategoriler.forEach((kat) => {
        durum.KATEGORI_ARAMA_TURU[kat.id] = kat.tur || 'dizi';

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
                if (!durum.isGlobalEditActive) return;

                durum.duzenlenenKategoriId = kat.id;
                
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
                    if (!durum.isGlobalEditActive) { 
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
                            if (typeof EditManager !== 'undefined' && !durum.isGlobalEditActive) {
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
