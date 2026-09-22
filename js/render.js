// #region 1: RENDER MOTORU (DATA-DRIVEN RENDER ENGINE)
const RenderEngine = {
    
    // 1.1: Ön Yüz (Vitrin) Render Fonksiyonu
    vitrinCiz(data) {
        if (!data) return;
        const front = data.front_data || {};
        const isim = front.gorunen_isim || data.kullanici_adi || '-';

        const bannerImg = document.getElementById('bannerImg');
        const avatarImg = document.getElementById('avatarImg');
        const profileName = document.getElementById('profileName');
        const profileTitle = document.getElementById('profileTitle');
        const profileBio = document.getElementById('profileBio');
        const tagsGrid = document.getElementById('tagsGrid');
        const menuOwnerName = document.getElementById('menuOwnerName');

        const defaultBanner = "https://i.ibb.co/RTNFJZXT/banner-placeholder.png";
        const defaultAvatar = "https://i.ibb.co/8gvf4SNF/pfp-placeholder.png";
        const defaultUnvan = "Nook Üyesi";
        const defaultBio = "Kendi dijital köşesini inşa ediyor.";

        if (bannerImg) {
            const safeBanner = this.safeUrl(front.banner_url);
            bannerImg.src = (safeBanner && safeBanner !== '#') ? safeBanner : defaultBanner;
            bannerImg.onerror = () => { bannerImg.src = defaultBanner; };
        }
        if (avatarImg) {
            const safeAvatar = this.safeUrl(front.pfp_url);
            avatarImg.src = (safeAvatar && safeAvatar !== '#') ? safeAvatar : defaultAvatar;
            avatarImg.onerror = () => { avatarImg.src = defaultAvatar; };
        }
        if (profileName) profileName.textContent = isim;
        if (profileTitle) profileTitle.textContent = front.unvan || defaultUnvan;
        if (profileBio) profileBio.textContent = front.aciklama || defaultBio;
        if (menuOwnerName) menuOwnerName.textContent = isim;

        if (tagsGrid) {
            const tags = Array.isArray(front.tags) ? front.tags.filter(t => t && String(t).trim() !== '') : [];
            tagsGrid.innerHTML = tags
                .slice(0, 6)
                .map(tag => `<span class="tag-pill">${this.escapeHtml(tag)}</span>`)
                .join('');
        }

        // Eğer sahip modundaysak ve EditManager yüklüyse düzenleme kontrollerini bağla
        if (typeof isOwner !== 'undefined' && isOwner && typeof EditManager !== 'undefined') {
            EditManager.Vitrin?.init();
            EditManager.Media?.overlayleriYerlestir();
        }
    },

    // 1.2: Arka Yüz (Kök Menü) Render Fonksiyonu
    menuCiz(data) {
        const menuNav = document.getElementById('menuNav');
        if (!menuNav) return;

        const kart = (data && data.kullanici_adi) ? data : (typeof kartVerisi !== 'undefined' ? kartVerisi : {});
        const isUserOwner = (typeof isOwner !== 'undefined' && isOwner);

        const aktifMenuler = [];

        // Links - SADECE içerik varsa
        if (Array.isArray(kart.links) && kart.links.length > 0) {
            aktifMenuler.push({ id: "links", baslik: "Links" });
        }

        // Tops - SADECE içerik varsa
        const hasTops = (kart.tops && Array.isArray(kart.tops.ogeler) && kart.tops.ogeler.length > 0) || (Array.isArray(kart.tops) && kart.tops.length > 0);
        if (hasTops) {
            aktifMenuler.push({ id: "tops", baslik: kart.tops?.kategori || "Tops" });
        }

        // Trophies - SADECE içerik varsa
        if (Array.isArray(kart.trophies) && kart.trophies.length > 0) {
            aktifMenuler.push({ id: "trophies", baslik: "Trophies" });
        }

        // Widgets - SADECE içerik varsa
        if (Array.isArray(kart.widgets) && kart.widgets.length > 0) {
            aktifMenuler.push({ id: "widgets", baslik: "Widgets" });
        }

        // Working on - SADECE içerik varsa
        if (kart.working_on && (kart.working_on.metin || kart.working_on.status)) {
            aktifMenuler.push({ id: "working-on", baslik: "Working on" });
        }

        // Kullanıcının belirlediği özel sıralama varsa ona göre diz
        if (kart.theme_config && Array.isArray(kart.theme_config.menu_order)) {
            aktifMenuler.sort((a, b) => {
                const idxA = kart.theme_config.menu_order.indexOf(a.id);
                const idxB = kart.theme_config.menu_order.indexOf(b.id);
                return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
            });
        }

        let html = '';

        if (aktifMenuler.length === 0) {
            if (isUserOwner) {
                html = `
                    <div class="empty-menu-container">
                        <p class="empty-menu-notice-text">Arka taraf henüz boş.</p>
                        <button type="button" class="add-section-big-btn" id="open-add-section-modal">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <span>İçerik Ekle</span>
                        </button>
                    </div>
                `;
            } else {
                html = `
                    <div class="empty-menu-notice">
                        <p class="empty-menu-text">Henüz içerik veya bağlantı eklenmemiş.</p>
                    </div>
                `;
            }
        } else {
            // İçeriği olan kategorilerin butonları
            const butonlarHtml = aktifMenuler.map(item => `
                <button class="nav-item-btn" data-target="${item.id}">
                    <span>${this.escapeHtml(item.baslik)}</span>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            `).join('');

            // Sahip ise yeni içerik ekleme butonu
            const addBtnHtml = isUserOwner ? `
                <button type="button" class="add-section-nav-btn" id="open-add-section-modal">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    <span>İçerik Ekle</span>
                </button>
            ` : '';

            html = butonlarHtml + addBtnHtml;
        }

        menuNav.innerHTML = html;

        // Sahip modunda buton olaylarını bağla
        if (isUserOwner && typeof EditManager !== 'undefined' && EditManager.SectionPicker) {
            EditManager.SectionPicker.bagla();
        }
    },

    // 1.3: Arka Yüz (Alt Ekranlar) Dinamik Render Fonksiyonu
    altEkranlariCiz(data) {
        const viewsWrapper = document.getElementById('viewsWrapper');
        if (!viewsWrapper || !data) return;

        // O anda açık olan bir alt detay ekranı varsa ID'sini kaydet
        const activeDetailId = (typeof Router !== 'undefined' && Router.activeDetailView)
            ? Router.activeDetailView.id
            : null;

        // Kök menü haricindeki eski dinamik ekranları temizle
        const existingDetails = viewsWrapper.querySelectorAll('.view-detail');
        existingDetails.forEach(el => el.remove());

        // 1. Links Ekranı
        viewsWrapper.appendChild(this.ekranKabuguOlustur('links', 'Links', this.linksIcerikHTML(data.links)));

        // 2. Tops Ekranı
        const topsTitle = data.tops?.kategori || 'Tops';
        viewsWrapper.appendChild(this.ekranKabuguOlustur('tops', topsTitle, this.topsIcerikHTML(data.tops)));

        // 3. Trophies Ekranı
        viewsWrapper.appendChild(this.ekranKabuguOlustur('trophies', 'Trophies', this.trophiesIcerikHTML(data.trophies)));

        // 4. Widgets Ekranı
        viewsWrapper.appendChild(this.ekranKabuguOlustur('widgets', 'Widgets', this.widgetsIcerikHTML(data.widgets)));

        // 5. Working on Ekranı
        const workingText = data.working_on?.metin || '';
        viewsWrapper.appendChild(this.ekranKabuguOlustur('working-on', 'Working on', workingText ? `
            <div class="status-card">
                <span class="status-dot"></span>
                <p class="status-text">${this.escapeHtml(workingText)}</p>
            </div>
        ` : `<p class="placeholder-text">Henüz durum bilgisi eklenmemiş.</p>`));

        // Eğer önceden aktif olan bir alt ekran varsa, yeniden üretilen DOM paneline .active sınıfını ve Router referansını aktar
        if (activeDetailId) {
            const restoredPanel = document.getElementById(activeDetailId);
            if (restoredPanel) {
                restoredPanel.classList.add('active');
                if (typeof Router !== 'undefined') {
                    Router.activeDetailView = restoredPanel;
                }
            } else if (typeof Router !== 'undefined') {
                Router.resetToMainMenu();
            }
        }

        // Eğer sahip modundaysak ve EditManager yüklüyse arka ekran kontrollerini bağla
        if (typeof isOwner !== 'undefined' && isOwner && typeof EditManager !== 'undefined') {
            EditManager.BackViews?.init();
        }
    },

    // 1.4: Tekrarlayan Alt Ekran Şablonu (DRY)
    ekranKabuguOlustur(id, baslik, icerikHtml) {
        const panel = document.createElement('div');
        panel.className = 'view-panel view-detail';
        panel.id = `view-${id}`;

        panel.innerHTML = `
            <div class="view-header">
                <button class="nook-icon-btn back-btn" data-action="back" title="Geri">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <h3 class="view-title">${this.escapeHtml(baslik)}</h3>
            </div>
            <div class="scrollable-fade">
                ${icerikHtml}
            </div>
        `;
        return panel;
    },

    // 1.5: Alt İçerik Üreticileri
    linksIcerikHTML(links) {
        if (!Array.isArray(links) || links.length === 0) {
            return `<div class="links-wrapper" id="links-wrapper"><p class="placeholder-text">Henüz bağlantı eklenmemiş.</p></div>`;
        }
        return `
            <div class="links-wrapper" id="links-wrapper">
                ${links.map(link => {
                    const baslik = link.baslik || link.isim || 'Bağlantı';
                    let domain = 'Bağlantı';
                    try {
                        let parsedUrl = link.url;
                        if (parsedUrl && !parsedUrl.startsWith('http://') && !parsedUrl.startsWith('https://')) {
                            parsedUrl = 'https://' + parsedUrl;
                        }
                        if (parsedUrl) domain = new URL(parsedUrl).hostname.replace(/^www\./, '');
                    } catch(e) {}

                    return `
                        <a href="${this.safeUrl(link.url)}" target="_blank" rel="noopener noreferrer" class="nook-link-row">
                            <div class="nook-link-main">
                                <div class="nook-link-icon">${this.getLinkIcon(link.url)}</div>
                                <div class="nook-link-info">
                                    <span class="nook-link-name">${this.escapeHtml(baslik)}</span>
                                    <span class="nook-link-domain">${this.escapeHtml(domain)}</span>
                                </div>
                            </div>
                        </a>
                    `;
                }).join('')}
            </div>
        `;
    },

    topsIcerikHTML(tops) {
        if (!tops || (!Array.isArray(tops.ogeler) && !Array.isArray(tops))) {
            return `<p class="placeholder-text">Henüz içerik eklenmemiş.</p>`;
        }
        const ogeler = Array.isArray(tops.ogeler) ? tops.ogeler : (Array.isArray(tops) ? tops : []);
        if (ogeler.length === 0) {
            return `<p class="placeholder-text">Henüz içerik eklenmemiş.</p>`;
        }

        const kartlarHtml = ogeler.map(item => {
            const safeAfis = this.safeUrl(item.afis_url);
            const thumbHtml = (safeAfis && safeAfis !== '#')
                ? `<img class="top-item-thumb" src="${safeAfis}" alt="${this.escapeHtml(item.baslik || '')}" loading="lazy" onerror="this.style.display='none'">`
                : `<div class="top-item-thumb"></div>`;

            return `
                <div class="top-item-card">
                    ${thumbHtml}
                    <div class="top-item-content">
                        <h4 class="top-item-title">${this.escapeHtml(item.baslik)}</h4>
                        <p class="top-item-desc">${this.escapeHtml(item.aciklama || '')}</p>
                    </div>
                </div>
            `;
        }).join('');

        const linkHtml = (tops.harici_link && tops.harici_link.url) ? `
            <div class="top-external-link">
                <a href="${this.safeUrl(tops.harici_link.url)}" target="_blank" rel="noopener noreferrer" class="letterboxd-link">
                    ${this.escapeHtml(tops.harici_link.baslik || 'Harici Profil →')}
                </a>
            </div>
        ` : '';

        return kartlarHtml + linkHtml;
    },

    trophiesIcerikHTML(trophies) {
        if (!Array.isArray(trophies) || trophies.length === 0) {
            return `<p class="placeholder-text">Trophies & achievements showcase coming soon.</p>`;
        }
        return trophies.map(t => `
            <div class="status-card">
                <span class="status-dot"></span>
                <p class="status-text"><strong>${this.escapeHtml(t.baslik || '')}</strong>: ${this.escapeHtml(t.aciklama || '')}</p>
            </div>
        `).join('');
    },

    widgetsIcerikHTML(widgets) {
        if (!Array.isArray(widgets) || widgets.length === 0) {
            return `<p class="placeholder-text">Henüz bir widget eklenmemiş.</p>`;
        }

        return widgets.map(w => {
            if (w.tur === 'monkeytype') {
                const username = w.ayarlar?.kullanici || w.kullanici || w.username || '';
                const live = (typeof kartVerisi !== 'undefined' && kartVerisi.canli_monkeytype) ? kartVerisi.canli_monkeytype : null;

                const getStat = (mode, amount) => {
                    if (!live) return { wpm: '-', acc: '-' };
                    const modeData = live[mode];
                    const stat = (modeData && modeData[amount]) ? modeData[amount][0] : null;
                    if (!stat) return { wpm: '-', acc: '-' };
                    return {
                        wpm: Math.round(stat.wpm || 0),
                        acc: Math.round(stat.acc || 0)
                    };
                };

                const t15 = getStat('time', '15');
                const t60 = getStat('time', '60');
                const w10 = getStat('words', '10');
                const w25 = getStat('words', '25');

                return `
                    <div class="monkeytype-card" data-username="${this.escapeHtml(username)}">
                        <div class="mt-card-header">
                            <div class="mt-brand-badge">
                                <span class="mt-brand-icon">mt</span>
                                <span class="mt-brand-name">monkeytype</span>
                            </div>
                            ${username ? `
                                <a href="https://monkeytype.com/profile/${encodeURIComponent(username)}" target="_blank" rel="noopener noreferrer" class="mt-profile-link" title="Monkeytype Profilini Gör">
                                    <span>@${this.escapeHtml(username)}</span>
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                        <polyline points="15 3 21 3 21 9"></polyline>
                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                    </svg>
                                </a>
                            ` : ''}
                        </div>

                        <div class="mt-scores-grid">
                            <div class="mt-score-box" data-mode="time" data-amount="15">
                                <span class="mt-score-title">15s Time</span>
                                <div class="mt-score-main">
                                    <span class="mt-score-wpm">${t15.wpm}</span>
                                    <span class="mt-score-unit">wpm</span>
                                </div>
                                <span class="mt-score-acc">${t15.acc !== '-' ? `${t15.acc}% acc` : '-% acc'}</span>
                            </div>

                            <div class="mt-score-box" data-mode="time" data-amount="60">
                                <span class="mt-score-title">60s Time</span>
                                <div class="mt-score-main">
                                    <span class="mt-score-wpm">${t60.wpm}</span>
                                    <span class="mt-score-unit">wpm</span>
                                </div>
                                <span class="mt-score-acc">${t60.acc !== '-' ? `${t60.acc}% acc` : '-% acc'}</span>
                            </div>

                            <div class="mt-score-box" data-mode="words" data-amount="10">
                                <span class="mt-score-title">10 Words</span>
                                <div class="mt-score-main">
                                    <span class="mt-score-wpm">${w10.wpm}</span>
                                    <span class="mt-score-unit">wpm</span>
                                </div>
                                <span class="mt-score-acc">${w10.acc !== '-' ? `${w10.acc}% acc` : '-% acc'}</span>
                            </div>

                            <div class="mt-score-box" data-mode="words" data-amount="25">
                                <span class="mt-score-title">25 Words</span>
                                <div class="mt-score-main">
                                    <span class="mt-score-wpm">${w25.wpm}</span>
                                    <span class="mt-score-unit">wpm</span>
                                </div>
                                <span class="mt-score-acc">${w25.acc !== '-' ? `${w25.acc}% acc` : '-% acc'}</span>
                            </div>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="status-card">
                    <span class="status-dot"></span>
                    <p class="status-text">${this.escapeHtml(w.tur || 'Widget')}</p>
                </div>
            `;
        }).join('');
    },

    monkeytypeGuncelle(data) {
        if (!data) return;
        const veriyiYaz = (mode, amount) => {
            const modeData = data[mode];
            const stat = (modeData && modeData[amount]) ? modeData[amount][0] : null;
            if (stat && stat.wpm) {
                const box = document.querySelector(`.mt-score-box[data-mode="${mode}"][data-amount="${amount}"]`);
                if (box) {
                    const wpmEl = box.querySelector('.mt-score-wpm');
                    const accEl = box.querySelector('.mt-score-acc');
                    if (wpmEl) wpmEl.textContent = Math.round(stat.wpm);
                    if (accEl) accEl.textContent = `${Math.round(stat.acc)}% acc`;
                }
            }
        };

        ['15', '60'].forEach(a => veriyiYaz('time', a));
        ['10', '25'].forEach(a => veriyiYaz('words', a));
    },

    safeUrl(url) {
        if (!url) return '#';
        let temiz = String(url).trim();
        if (!temiz.startsWith('http://') && !temiz.startsWith('https://')) {
            temiz = 'https://' + temiz;
        }
        return /^https?:\/\/[^"'\s<>]+$/i.test(temiz) ? this.escapeHtml(temiz) : '#';
    },

    getLinkIcon(url) {
        const fallbackSvg = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
        if (!url) return fallbackSvg;
        try {
            let parsed = String(url).trim();
            if (!parsed.startsWith('http://') && !parsed.startsWith('https://')) {
                parsed = 'https://' + parsed;
            }
            const domain = new URL(parsed).hostname.replace(/^www\./, '');
            if (!domain) return fallbackSvg;
            return `<img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64" alt="Site İkonu" onerror="this.onerror=null; this.src=''; this.parentElement.innerHTML='${fallbackSvg}';">`;
        } catch (e) {
            return fallbackSvg;
        }
    },

    getSafeLinkIcon(ikon) {
        const SAFE_ICONS = {
            youtube: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>',
            github: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
            twitter: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
            x: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>'
        };
        const defaultSvg = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>';

        if (!ikon || typeof ikon !== 'string') return defaultSvg;
        const key = ikon.toLowerCase().trim();
        if (SAFE_ICONS[key]) return SAFE_ICONS[key];

        // config.js içerisindeki SVG kalıbıyla tam eşleşen bilinen SVG'ler
        for (const safeKey in SAFE_ICONS) {
            if (SAFE_ICONS[safeKey].replace(/\s+/g, '') === key.replace(/\s+/g, '')) {
                return SAFE_ICONS[safeKey];
            }
        }
        return defaultSvg;
    },

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};
// #endregion
