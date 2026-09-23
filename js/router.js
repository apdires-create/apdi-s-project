// #region 1: NAVİGASYON VE DRILL-DOWN ROUTER
const Router = {
    cardContainer: null,
    viewMenu: null,
    viewsWrapper: null,
    isFlipped: false,
    isFlipping: false,
    _flipTimeout: null,
    activeDetailView: null,

    // =========================================================================
    // FLIP KALKANI AKTİF KALMA SÜRESİ (ms)
    // Kart çevrilirken içerideki buton, link vb. öğeleri örten "Flip Kalkanı"nın
    // aktif kalacağı süre. CSS animasyonu toplam 600ms sürer.
    // Dönüş optik olarak yeterli açıya ulaştığında (örn. 300ms) kalkan kalkar ve
    // altındaki elemanlar etkileşime açılır.
    // Kalkan aktifken karta basılırsa kart anında ters yöne çevrilir (seri flip).
    // İhtiyacınıza göre bu süreyi buradan doğrudan değiştirebilirsiniz (Örn: 250, 300, 350).
    // =========================================================================
    FLIP_SHIELD_LOCK_MS: 300,

    init() {
        this.cardContainer = document.getElementById('cardContainer');
        this.viewMenu = document.getElementById('viewMenu');
        this.viewsWrapper = document.getElementById('viewsWrapper');

        const flipToBackBtn = document.getElementById('flipToBackBtn');
        const flipToFrontBtn = document.getElementById('flipToFrontBtn');

        // Flip butonları
        if (flipToBackBtn) {
            flipToBackBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setFlipped(true);
            });
        }

        if (flipToFrontBtn) {
            flipToFrontBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setFlipped(false);
            });
        }

        // Flip Kalkanı (Dönüş sırasında tıklanırsa kartı anında tersine çevir - Seri Flip)
        const shields = document.querySelectorAll('.flip-shield');
        shields.forEach(shield => {
            shield.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.setFlipped(!this.isFlipped);
            });
        });

        // Tıklama Olay Delegasyonu (Menü butonları ve Geri butonları için)
        if (this.viewsWrapper) {
            this.viewsWrapper.addEventListener('click', (e) => {
                // Menü butonuna tıklandıysa
                const navBtn = e.target.closest('.nav-item-btn');
                if (navBtn) {
                    if (window._suruklemeBitti && Date.now() - window._suruklemeBitti < 250) return;
                    const target = navBtn.getAttribute('data-target');
                    if (target) this.openDetailView(target);
                    return;
                }

                // Geri butonuna tıklandıysa
                const backBtn = e.target.closest('.back-btn[data-action="back"]');
                if (backBtn) {
                    this.resetToMainMenu();
                    return;
                }
            });
        }

        // Ön yüzde aktif düzenleme açıkken dışarıya tıklandığını en erken fazda (capture) yakala
        document.addEventListener('pointerdown', (e) => {
            const activeEdit = document.querySelector('.editable-hover.is-input-active');
            if (activeEdit && !e.target.closest('.editable-hover.is-input-active')) {
                window._frontEditJustClosed = Date.now();
            }
        }, true);

        // Kartın boş alanlarına tıklandığında çevirme ve hiyerarşik geri dönme sistemi
        if (this.cardContainer) {
            this.cardContainer.addEventListener('click', (e) => {
                // Kart dönüş animasyonu sürerken tıklanırsa kartı anında tersine çevir (seri flip)
                if (this.isFlipping) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.setFlipped(!this.isFlipped);
                    return;
                }

                const interactiveSelector = [
                    'button',
                    'a',
                    'input',
                    'textarea',
                    'select',
                    '.tag-pill',
                    '.tag-add-pill',
                    '.tag-remove-btn',
                    '.editable-hover',
                    '.image-edit-overlay',
                    '.edit-action-bar',
                    '.cropper-modal',
                    '.tag-picker-modal',
                    '.add-section-modal',
                    '.nook-toast',
                    '.inline-form-card',
                    '.inline-form-input',
                    '.form-btn-sm',
                    '.item-delete-btn',
                    '.nav-item-btn',
                    '.add-section-nav-btn',
                    '.add-section-big-btn',
                    '.view-add-btn',
                    '.nook-link-row',
                    '.top-item-card',
                    '.status-card',
                    '.profile-edit-avatar-wrap',
                    '.profile-edit-banner-wrap'
                ].join(', ');

                // 1. İnteraktif öğelere veya kart satırlarına tıklandıysa işlemi kesme
                if (e.target.closest(interactiveSelector)) return;

                // 2. Ön yüzde düzenleme modu açıkken dışarıdaki boş alana tıklandıysa:
                // İlk vuruşta sadece düzenlemeyi kapat, kartı çevirme
                if (window._frontEditingActive || (window._frontEditJustClosed && Date.now() - window._frontEditJustClosed < 450)) {
                    window._frontEditingActive = false;
                    window._frontEditJustClosed = 0;
                    const activeInput = document.querySelector('.editable-hover.is-input-active input, .editable-hover.is-input-active textarea');
                    if (activeInput) activeInput.blur();
                    return;
                }

                // 3. Arka yüzde akordeon düzenlemesi yeni kapandıysa ilk vuruşta geri dönme
                if (window._linkAccordionJustClosed && Date.now() - window._linkAccordionJustClosed < 400) {
                    window._linkAccordionJustClosed = 0;
                    return;
                }

                const selection = window.getSelection();
                if (selection && selection.toString().trim().length > 0) return;
                if (window._suruklemeBitti && Date.now() - window._suruklemeBitti < 300) return;

                // 4. HİYERARŞİK GEZİNME (Boş alana tıklama):
                // A. ÖN YÜZ: Ön yüzdeyken boş alana tıklandığında arka yüze git
                if (!this.isFlipped) {
                    this.setFlipped(true);
                    return;
                }

                // B. ARKA YÜZ:
                // B.1. Eğer bir alt detay ekranındaysak (örn. linkler, profil vb.):
                // Boş alana tıklamak bizi hep bir adım geriye (arka yüz ana menüsüne) atsın
                if (this.activeDetailView) {
                    this.resetToMainMenu();
                    return;
                }

                // B.2. Eğer arka yüzün ana menüsündeysek:
                // Boş alana tıklamak bizi bir adım daha geriye (kartın ön yüzüne) atsın
                this.setFlipped(false);
            });
        }

        // Klavye Kısayolları (ESC)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.activeDetailView) {
                    this.resetToMainMenu();
                } else if (this.isFlipped) {
                    this.setFlipped(false);
                }
            }
        });
    },

    setFlipped(flipped) {
        this.isFlipped = flipped;
        if (!this.cardContainer) return;

        // Kartı etkileşime geçici olarak kilitle (animasyon sırasında)
        this.isFlipping = true;
        this.cardContainer.classList.add('is-flipping');

        clearTimeout(this._flipTimeout);
        this._flipTimeout = setTimeout(() => {
            this.isFlipping = false;
            if (this.cardContainer) {
                this.cardContainer.classList.remove('is-flipping');
            }
        }, this.FLIP_SHIELD_LOCK_MS);

        if (this.isFlipped) {
            this.cardContainer.classList.add('is-flipped');
        } else {
            this.cardContainer.classList.remove('is-flipped');
            this.resetToMainMenu();
        }
    },

    openDetailView(targetId) {
        const targetView = document.getElementById(`view-${targetId}`);
        if (!targetView || !this.viewMenu) return;

        this.viewMenu.classList.add('slide-left');
        this.viewMenu.classList.remove('active');

        targetView.classList.add('active');
        this.activeDetailView = targetView;
    },

    resetToMainMenu() {
        if (this.activeDetailView) {
            this.activeDetailView.classList.remove('active');
            this.activeDetailView = null;
        }
        if (this.viewMenu) {
            this.viewMenu.classList.remove('slide-left');
            this.viewMenu.classList.add('active');
        }
        if (typeof EditManager !== 'undefined' && typeof EditManager.temizleBosKategorileri === 'function') {
            EditManager.temizleBosKategorileri();
        }
    }
};
// #endregion
