// #region 1: NAVİGASYON VE DRILL-DOWN ROUTER
const Router = {
    cardContainer: null,
    viewMenu: null,
    viewsWrapper: null,
    isFlipped: false,
    activeDetailView: null,

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

        // Tıklama Olay Delegasyonu (Menü butonları ve Geri butonları için)
        if (this.viewsWrapper) {
            this.viewsWrapper.addEventListener('click', (e) => {
                // Menü butonuna tıklandıysa
                const navBtn = e.target.closest('.nav-item-btn');
                if (navBtn) {
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
    }
};
// #endregion
