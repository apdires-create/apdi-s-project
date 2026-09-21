// #region 1: AUTH MODAL ETKİLEŞİM YÖNETİCİSİ (UI CONTROLLER)
const AuthModal = {
    modalEl: null,
    backdropEl: null,
    closeBtn: null,
    triggerBtn: null,
    switchBtn: null,
    formEl: null,
    titleEl: null,
    submitBtn: null,
    switchTextEl: null,
    usernameGroupEl: null,
    errorBoxEl: null,

    mode: 'login', // 'login' | 'register'
    isOpen: false,

    init() {
        this.modalEl = document.getElementById('authModal');
        this.backdropEl = document.getElementById('authModalBackdrop');
        this.closeBtn = document.getElementById('authModalClose');
        this.triggerBtn = document.getElementById('authTriggerBtn');
        this.switchBtn = document.getElementById('authSwitchBtn');
        this.formEl = document.getElementById('authForm');
        this.titleEl = document.getElementById('authTitle');
        this.submitBtn = document.getElementById('authSubmitBtn');
        this.switchTextEl = document.getElementById('authSwitchText');
        this.usernameGroupEl = document.getElementById('authUsernameGroup');
        this.errorBoxEl = document.getElementById('authErrorBox');

        if (this.triggerBtn) {
            this.triggerBtn.addEventListener('click', () => this.open('login'));
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }

        if (this.backdropEl) {
            this.backdropEl.addEventListener('click', () => this.close());
        }

        if (this.switchBtn) {
            this.switchBtn.addEventListener('click', () => this.toggleMode());
        }

        if (this.formEl) {
            this.formEl.addEventListener('submit', (e) => {
                e.preventDefault();
                // Auth backend henüz bağlanmadığı için geçici bilgilendirme
                this.hataGoster("Kimlik doğrulama altyapısı bir sonraki adımda bağlanacaktır.");
            });
        }

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    },

    open(mode = 'login') {
        this.setMode(mode);
        this.hataGizle();
        if (this.modalEl) {
            this.modalEl.classList.add('is-open');
            this.isOpen = true;
        }
    },

    close() {
        if (this.modalEl) {
            this.modalEl.classList.remove('is-open');
            this.isOpen = false;
        }
        this.hataGizle();
    },

    setMode(mode) {
        this.mode = mode;
        const isRegister = this.mode === 'register';

        if (this.usernameGroupEl) {
            this.usernameGroupEl.style.display = isRegister ? 'flex' : 'none';
        }

        if (this.titleEl) {
            this.titleEl.textContent = isRegister ? 'Kayıt Ol' : 'Giriş Yap';
        }

        if (this.submitBtn) {
            this.submitBtn.textContent = isRegister ? 'Kayıt Ol' : 'Giriş Yap';
        }

        if (this.switchTextEl) {
            this.switchTextEl.textContent = isRegister ? 'Zaten hesabın var mı?' : 'Hesabın yok mu?';
        }

        if (this.switchBtn) {
            this.switchBtn.textContent = isRegister ? 'Giriş Yap' : 'Kayıt Ol';
        }
    },

    toggleMode() {
        this.setMode(this.mode === 'login' ? 'register' : 'login');
        this.hataGizle();
    },

    hataGoster(mesaj) {
        if (!this.errorBoxEl) return;
        this.errorBoxEl.textContent = mesaj;
        this.errorBoxEl.style.display = 'block';
    },

    hataGizle() {
        if (!this.errorBoxEl) return;
        this.errorBoxEl.style.display = 'none';
        this.errorBoxEl.textContent = '';
    }
};
// #endregion
