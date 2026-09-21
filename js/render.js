// #region 1: RENDER MOTORU (DATA-DRIVEN RENDER ENGINE)
const RenderEngine = {
    
    // 1.1: Ön Yüz (Vitrin) Render Fonksiyonu
    vitrinCiz(data) {
        const { profil } = data;
        if (!profil) return;

        const bannerImg = document.getElementById('bannerImg');
        const avatarImg = document.getElementById('avatarImg');
        const profileName = document.getElementById('profileName');
        const profileTitle = document.getElementById('profileTitle');
        const profileBio = document.getElementById('profileBio');
        const tagsGrid = document.getElementById('tagsGrid');
        const menuOwnerName = document.getElementById('menuOwnerName');

        if (bannerImg && profil.banner_url) bannerImg.src = profil.banner_url;
        if (avatarImg && profil.avatar_url) avatarImg.src = profil.avatar_url;
        if (profileName) profileName.textContent = profil.gorunen_isim || '-';
        if (profileTitle) profileTitle.textContent = profil.unvan || '';
        if (profileBio) profileBio.textContent = profil.bio || '';
        if (menuOwnerName) menuOwnerName.textContent = profil.gorunen_isim || '-';

        if (tagsGrid && Array.isArray(profil.taglar)) {
            tagsGrid.innerHTML = profil.taglar
                .slice(0, 6)
                .map(tag => `<span class="tag-pill">${this.escapeHtml(tag)}</span>`)
                .join('');
        }
    },

    // 1.2: Arka Yüz (Kök Menü) Render Fonksiyonu
    menuCiz(data) {
        const menuNav = document.getElementById('menuNav');
        if (!menuNav || !Array.isArray(data.menuler)) return;

        menuNav.innerHTML = data.menuler.map(item => `
            <button class="nav-item-btn" data-target="${item.id}">
                <span>${this.escapeHtml(item.baslik)}</span>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
        `).join('');
    },

    // 1.3: Arka Yüz (Alt Ekranlar) Dinamik Render Fonksiyonu
    altEkranlariCiz(data) {
        const viewsWrapper = document.getElementById('viewsWrapper');
        if (!viewsWrapper) return;

        // Kök menü haricindeki eski dinamik ekranları temizle
        const existingDetails = viewsWrapper.querySelectorAll('.view-detail');
        existingDetails.forEach(el => el.remove());

        // 1. Links Ekranı
        viewsWrapper.appendChild(this.ekranKabuguOlustur('links', 'Links', this.linksIcerikHTML(data.linkler)));

        // 2. Tops Ekranı
        const topsTitle = data.tops?.kategori || 'Tops';
        viewsWrapper.appendChild(this.ekranKabuguOlustur('tops', topsTitle, this.topsIcerikHTML(data.tops)));

        // 3. Trophies Ekranı
        viewsWrapper.appendChild(this.ekranKabuguOlustur('trophies', 'Trophies', `
            <p class="placeholder-text">Trophies & achievements showcase coming soon.</p>
        `));

        // 4. Widgets Ekranı
        viewsWrapper.appendChild(this.ekranKabuguOlustur('widgets', 'Widgets', `
            <p class="placeholder-text">Live widgets (Monkeytype, GitHub stats) coming soon.</p>
        `));

        // 5. Working on Ekranı
        viewsWrapper.appendChild(this.ekranKabuguOlustur('working-on', 'Working on', `
            <div class="status-card">
                <span class="status-dot"></span>
                <p class="status-text">${this.escapeHtml(data.working_on?.metin || 'Building Nook v2.')}</p>
            </div>
        `));
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
    linksIcerikHTML(linkler) {
        if (!Array.isArray(linkler) || linkler.length === 0) {
            return `<p class="placeholder-text">Henüz bağlantı eklenmemiş.</p>`;
        }
        return linkler.map(link => `
            <a href="${this.escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="link-item-row">
                <div class="link-icon-box" style="background: ${link.renk || '#3b5bdb'};">
                    ${link.ikon || ''}
                </div>
                <div class="link-info">
                    <span class="link-label">${this.escapeHtml(link.baslik)}</span>
                    <span class="link-url">${this.escapeHtml(link.url)}</span>
                </div>
            </a>
        `).join('');
    },

    topsIcerikHTML(tops) {
        if (!tops || !Array.isArray(tops.ogeler)) {
            return `<p class="placeholder-text">Henüz içerik eklenmemiş.</p>`;
        }
        const kartlarHtml = tops.ogeler.map(item => `
            <div class="top-item-card">
                <div class="top-item-thumb" style="${item.afis_url ? `background-image: url('${item.afis_url}');` : ''}"></div>
                <div class="top-item-content">
                    <h4 class="top-item-title">${this.escapeHtml(item.baslik)}</h4>
                    <p class="top-item-desc">${this.escapeHtml(item.aciklama)}</p>
                </div>
            </div>
        `).join('');

        const linkHtml = tops.harici_link ? `
            <div class="top-external-link">
                <a href="${this.escapeHtml(tops.harici_link.url)}" target="_blank" rel="noopener noreferrer" class="letterboxd-link">
                    ${this.escapeHtml(tops.harici_link.baslik)}
                </a>
            </div>
        ` : '';

        return kartlarHtml + linkHtml;
    },

    // Yardımcı: HTML XSS Engelleme
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
