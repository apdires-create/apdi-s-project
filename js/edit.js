// #region 1: EDITMANAGER DEVLETİ VE BAŞLATICI (STATE & INIT)
const EditManager = {
    state: {
        hasUnsavedChanges: false,
        orijinalVeri: null,
        cropperInstance: null,
        guncelHedefTur: null
    },

    init() {
        if (typeof isOwner === 'undefined' || !isOwner) return;

        // Kart verisindeki boş kategorileri sessizce temizle ki orijinalVeri ile birebir aynı tabandan başlansın
        this.temizleBosKategorileri(true);

        // Orijinal verinin yedeğini al (İptal edilebilmesi için)
        this.state.orijinalVeri = JSON.parse(JSON.stringify(kartVerisi));

        this.domElemanlariniOlustur();
        this.Global.init();
        this.Media.init();
        this.Vitrin.init();
        this.BackViews.init();
        this.SectionPicker.init();
        this.TagPicker.init();

        document.body.classList.add('global-edit-mode');
    },

    temizleBosKategorileri(sessiz = false) {
        if (!kartVerisi) return;
        let degisiklik = false;

        // 1. Links
        if (kartVerisi.links && (!Array.isArray(kartVerisi.links) || kartVerisi.links.length === 0)) {
            delete kartVerisi.links;
            degisiklik = true;
        }

        // 2. Tops
        if (kartVerisi.tops) {
            const ogeler = Array.isArray(kartVerisi.tops.ogeler) ? kartVerisi.tops.ogeler : (Array.isArray(kartVerisi.tops) ? kartVerisi.tops : []);
            if (ogeler.length === 0) {
                delete kartVerisi.tops;
                degisiklik = true;
            }
        }

        // 3. Widgets
        if (kartVerisi.widgets && (!Array.isArray(kartVerisi.widgets) || kartVerisi.widgets.length === 0)) {
            delete kartVerisi.widgets;
            degisiklik = true;
        }

        // 4. Working on
        if (kartVerisi.working_on && (!kartVerisi.working_on.metin || kartVerisi.working_on.metin.trim() === '')) {
            kartVerisi.working_on = {};
            degisiklik = true;
        }

        if (degisiklik) {
            if (typeof RenderEngine !== 'undefined') {
                RenderEngine.menuCiz(kartVerisi);
                RenderEngine.altEkranlariCiz(kartVerisi);
            }
            if (this.BackViews) this.BackViews.init();
            if (this.SectionPicker) this.SectionPicker.bagla();
            if (!sessiz && this.Global) this.Global.degisiklikYapildi();
        }
    },

    domElemanlariniOlustur() {
        // 1. Action Bar Enjeksiyonu
        if (!document.getElementById('edit-action-bar')) {
            const bar = document.createElement('div');
            bar.id = 'edit-action-bar';
            bar.className = 'edit-action-bar';
            bar.innerHTML = `
                <div class="edit-action-status">
                    <span class="edit-status-dot"></span>
                    <span class="edit-status-text">Değişiklikler yapıldı...</span>
                </div>
                <div class="edit-action-btns">
                    <button type="button" id="edit-cancel-btn" class="edit-bar-btn cancel-btn">İptal</button>
                    <button type="button" id="edit-save-btn" class="edit-bar-btn save-btn">Kaydet</button>
                </div>
            `;
            document.body.appendChild(bar);
        }

        // 2. Cropper Modal Enjeksiyonu
        if (!document.getElementById('cropper-modal')) {
            const modal = document.createElement('div');
            modal.id = 'cropper-modal';
            modal.className = 'cropper-modal';
            modal.innerHTML = `
                <div class="cropper-backdrop" id="cropper-modal-backdrop"></div>
                <div class="cropper-box">
                    <div class="cropper-header">
                        <h3 class="cropper-title" id="cropper-title">Görseli Kırp</h3>
                        <button type="button" class="cropper-close-btn" id="cropper-modal-close">&times;</button>
                    </div>
                    <div class="cropper-image-wrapper">
                        <img id="cropper-image" src="" alt="Kırpılacak Görsel">
                    </div>
                    <div class="cropper-footer">
                        <button type="button" class="form-btn-sm form-btn-cancel" id="cropper-cancel-btn">Vazgeç</button>
                        <button type="button" class="form-btn-sm form-btn-submit" id="cropper-save-btn">Kırp ve Yükle</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // 3. Gizli Dosya Girişleri
        if (!document.getElementById('banner-file-input')) {
            const bannerInput = document.createElement('input');
            bannerInput.type = 'file';
            bannerInput.id = 'banner-file-input';
            bannerInput.accept = 'image/*';
            bannerInput.style.display = 'none';
            document.body.appendChild(bannerInput);
        }

        if (!document.getElementById('pfp-file-input')) {
            const pfpInput = document.createElement('input');
            pfpInput.type = 'file';
            pfpInput.id = 'pfp-file-input';
            pfpInput.accept = 'image/*';
            pfpInput.style.display = 'none';
            document.body.appendChild(pfpInput);
        }

        // 4. Toast Bildirim Kutusu
        if (!document.getElementById('nook-toast')) {
            const toast = document.createElement('div');
            toast.id = 'nook-toast';
            toast.className = 'nook-toast';
            document.body.appendChild(toast);
        }

        // 5. İçerik Ekleme Pop-up Modalı (Section Picker Modal)
        if (!document.getElementById('add-section-modal')) {
            const modal = document.createElement('div');
            modal.id = 'add-section-modal';
            modal.className = 'add-section-modal';
            modal.innerHTML = `
                <div class="add-section-backdrop" id="add-section-backdrop"></div>
                <div class="section-picker-panel">
                    <div class="section-picker-header">
                        <div>
                            <h3 class="section-picker-title">İçerik Ekle</h3>
                            <p class="section-picker-desc">Kartının arka yüzünde sergilemek istediğin bir içeriği seç.</p>
                        </div>
                        <button type="button" class="section-picker-close" id="add-section-close">&times;</button>
                    </div>
                    <div class="section-picker-list" id="sectionPickerList"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // 6. Etiket Seçici Modalı (Tag Picker Modal)
        if (!document.getElementById('tag-picker-modal')) {
            const tagModal = document.createElement('div');
            tagModal.id = 'tag-picker-modal';
            tagModal.className = 'tag-picker-modal';
            tagModal.innerHTML = `
                <div class="tag-picker-backdrop" id="tag-picker-backdrop"></div>
                <div class="tag-picker-panel">
                    <div class="tag-picker-header">
                        <div>
                            <h3 class="tag-picker-title">Etiket Seç</h3>
                            <p class="tag-picker-desc">Profiline eklemek istediğin etiketi havuzdan seçebilirsin.</p>
                        </div>
                        <button type="button" class="tag-picker-close" id="tag-picker-close">&times;</button>
                    </div>
                    <div class="tag-search-box">
                        <span class="tag-search-icon">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </span>
                        <input type="text" id="tag-search-input" class="tag-search-input" placeholder="Etiket ara..." autocomplete="off">
                    </div>
                    <div class="tag-pool-wrap" id="tagPoolWrap"></div>
                </div>
            `;
            document.body.appendChild(tagModal);
        }
    }
};
// #endregion

// #region 2: KÜRESEL İŞLEM ÇUBUĞU VE VERİ KAYIT (GLOBAL ACTIONS & SUPABASE SAVE)
EditManager.Global = {
    init() {
        const cancelBtn = document.getElementById('edit-cancel-btn');
        const saveBtn = document.getElementById('edit-save-btn');

        if (cancelBtn) cancelBtn.addEventListener('click', () => this.sifirla());
        if (saveBtn) saveBtn.addEventListener('click', () => this.kaydet());

        window.addEventListener('beforeunload', (e) => {
            if (EditManager.state.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    },

    getTemizVeri(veri) {
        if (!veri) return null;
        const front = veri.front_data || {};
        const links = (Array.isArray(veri.links) && veri.links.length > 0) ? veri.links : null;
        let tops = null;
        if (veri.tops) {
            const ogeler = Array.isArray(veri.tops.ogeler) ? veri.tops.ogeler : (Array.isArray(veri.tops) ? veri.tops : []);
            if (ogeler.length > 0) {
                tops = {
                    kategori: veri.tops.kategori || 'Tops',
                    harici_link: veri.tops.harici_link || null,
                    ogeler: ogeler
                };
            }
        }
        const trophies = (Array.isArray(veri.trophies) && veri.trophies.length > 0) ? veri.trophies : null;
        const widgets = (Array.isArray(veri.widgets) && veri.widgets.length > 0) ? veri.widgets : null;
        let working_on = null;
        if (veri.working_on && veri.working_on.metin && veri.working_on.metin.trim() !== '') {
            working_on = { metin: veri.working_on.metin.trim() };
        }
        const theme_config = veri.theme_config || {};
        return {
            front_data: front,
            links,
            tops,
            trophies,
            widgets,
            working_on,
            theme_config
        };
    },

    degisiklikYapildi() {
        if (EditManager.state.orijinalVeri) {
            const guncelStr = JSON.stringify(this.getTemizVeri(kartVerisi));
            const orijStr = JSON.stringify(this.getTemizVeri(EditManager.state.orijinalVeri));
            EditManager.state.hasUnsavedChanges = (guncelStr !== orijStr);
        } else {
            EditManager.state.hasUnsavedChanges = false;
        }

        document.body.classList.toggle('has-unsaved-changes', EditManager.state.hasUnsavedChanges);
    },

    sifirla() {
        if (!EditManager.state.orijinalVeri) return;

        kartVerisi = JSON.parse(JSON.stringify(EditManager.state.orijinalVeri));
        EditManager.state.hasUnsavedChanges = false;
        document.body.classList.remove('has-unsaved-changes');

        if (typeof RenderEngine !== 'undefined') {
            RenderEngine.vitrinCiz(kartVerisi);
            RenderEngine.menuCiz(kartVerisi);
            RenderEngine.altEkranlariCiz(kartVerisi);
        }

        EditManager.Vitrin.init();
        EditManager.BackViews.init();
    },

    async kaydet() {
        if (!EditManager.state.hasUnsavedChanges || !supabaseClient) return;

        // Açık olan tüm link akordeonlarını kaydet ve kapat (küçült)
        if (typeof EditManager.BackViews?.kapatTumLinkAkordeonlari === 'function') {
            EditManager.BackViews.kapatTumLinkAkordeonlari();
        }

        const saveBtn = document.getElementById('edit-save-btn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Kaydediliyor...';
        }

        try {
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

            let workingOnPayload = {};
            if (kartVerisi.working_on && typeof kartVerisi.working_on === 'object' && !Array.isArray(kartVerisi.working_on)) {
                if (kartVerisi.working_on.metin && kartVerisi.working_on.metin.trim() !== '') {
                    workingOnPayload = { metin: kartVerisi.working_on.metin.trim() };
                }
            }

            const { error } = await supabaseClient
                .from('profiles')
                .update({
                    front_data: guvenliObje(kartVerisi.front_data),
                    links: Array.isArray(kartVerisi.links) ? kartVerisi.links : [],
                    tops: guvenliObje(kartVerisi.tops),
                    trophies: Array.isArray(kartVerisi.trophies) ? kartVerisi.trophies : [],
                    widgets: Array.isArray(kartVerisi.widgets) ? kartVerisi.widgets : [],
                    working_on: workingOnPayload,
                    theme_config: guvenliObje(kartVerisi.theme_config)
                })
                .eq('auth_id', kartVerisi.auth_id);

            if (error) throw error;

            EditManager.state.orijinalVeri = JSON.parse(JSON.stringify(kartVerisi));
            EditManager.state.hasUnsavedChanges = false;
            document.body.classList.remove('has-unsaved-changes');

            this.toastGoster("Değişiklikler başarıyla kaydedildi!");
        } catch (err) {
            console.error("Kaydetme hatası:", err);
            alert("Kaydedilirken bir hata oluştu: " + err.message);
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Kaydet';
            }
        }
    },

    toastGoster(mesaj) {
        const toast = document.getElementById('nook-toast');
        if (!toast) return;

        toast.textContent = mesaj;
        toast.classList.add('is-visible');
        setTimeout(() => toast.classList.remove('is-visible'), 3000);
    }
};
// #endregion

// #region 3: MEDYA YÖNETİMİ VE GÖRSEL KIRPMA (AVATAR & BANNER CROPPER)
EditManager.Media = {
    init() {
        this.overlayleriYerlestir();

        const bannerInput = document.getElementById('banner-file-input');
        const pfpInput = document.getElementById('pfp-file-input');
        const modalCloseBtn = document.getElementById('cropper-modal-close');
        const modalCancelBtn = document.getElementById('cropper-cancel-btn');
        const modalSaveBtn = document.getElementById('cropper-save-btn');
        const backdrop = document.getElementById('cropper-modal-backdrop');

        const modaliKapat = () => {
            const modal = document.getElementById('cropper-modal');
            if (modal) modal.classList.remove('is-open');
            if (EditManager.state.cropperInstance) {
                EditManager.state.cropperInstance.destroy();
                EditManager.state.cropperInstance = null;
            }
            if (bannerInput) bannerInput.value = '';
            if (pfpInput) pfpInput.value = '';
        };

        if (modalCloseBtn) modalCloseBtn.addEventListener('click', modaliKapat);
        if (modalCancelBtn) modalCancelBtn.addEventListener('click', modaliKapat);
        if (backdrop) backdrop.addEventListener('click', modaliKapat);

        if (bannerInput) {
            bannerInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.cropModaliniAc(file, 'banner');
            });
        }

        if (pfpInput) {
            pfpInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.cropModaliniAc(file, 'pfp');
            });
        }

        if (modalSaveBtn) {
            modalSaveBtn.addEventListener('click', () => {
                if (!EditManager.state.cropperInstance) return;

                modalSaveBtn.disabled = true;
                modalSaveBtn.textContent = 'Yükleniyor...';

                const isPfp = (EditManager.state.guncelHedefTur === 'pfp');
                const canvas = EditManager.state.cropperInstance.getCroppedCanvas({
                    width: isPfp ? 400 : 1200,
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high'
                });

                canvas.toBlob(async (blob) => {
                    await this.yukleVeGuncelle(blob, EditManager.state.guncelHedefTur);
                    modaliKapat();
                    modalSaveBtn.disabled = false;
                    modalSaveBtn.textContent = 'Kırp ve Yükle';
                }, 'image/webp', 0.85);
            });
        }
    },

    overlayleriYerlestir() {
        const bannerBox = document.querySelector('.banner-box');
        const avatarBox = document.querySelector('.avatar-box');

        const cameraIconSvg = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
            </svg>
        `;

        if (bannerBox && !bannerBox.querySelector('.image-edit-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'image-edit-overlay';
            overlay.innerHTML = `${cameraIconSvg}<span>Bannerı Değiştir</span>`;
            overlay.addEventListener('click', () => {
                const input = document.getElementById('banner-file-input');
                if (input) input.click();
            });
            bannerBox.appendChild(overlay);
        }

        if (avatarBox && !avatarBox.querySelector('.image-edit-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'image-edit-overlay';
            overlay.innerHTML = `${cameraIconSvg}`;
            overlay.addEventListener('click', () => {
                const input = document.getElementById('pfp-file-input');
                if (input) input.click();
            });
            avatarBox.appendChild(overlay);
        }
    },

    cropModaliniAc(file, tur) {
        if (file.size > 3 * 1024 * 1024) {
            alert("Görsel çok büyük! Lütfen 3 MB'tan küçük bir görsel seçin.");
            return;
        }

        EditManager.state.guncelHedefTur = tur;
        const reader = new FileReader();

        reader.onload = (e) => {
            const modal = document.getElementById('cropper-modal');
            const image = document.getElementById('cropper-image');
            const title = document.getElementById('cropper-title');

            if (!modal || !image) return;

            image.src = e.target.result;
            if (title) title.textContent = (tur === 'pfp' ? 'Profil Fotoğrafını Kırp' : 'Bannerı Kırp');

            modal.classList.add('is-open');

            if (EditManager.state.cropperInstance) {
                EditManager.state.cropperInstance.destroy();
            }

            const oran = (tur === 'pfp' ? 1 : 2.5);

            if (typeof Cropper !== 'undefined') {
                EditManager.state.cropperInstance = new Cropper(image, {
                    aspectRatio: oran,
                    viewMode: 2,
                    background: false,
                    autoCropArea: 1
                });
            }
        };

        reader.readAsDataURL(file);
    },

    async yukleVeGuncelle(blob, tur) {
        if (!supabaseClient || !kartVerisi.auth_id) return;

        const dosyaYolu = `${kartVerisi.auth_id}/${tur}_${Date.now()}.webp`;

        try {
            const { error: uploadErr } = await supabaseClient.storage
                .from('avatars-and-banners')
                .upload(dosyaYolu, blob, { contentType: 'image/webp', upsert: true });

            if (uploadErr) throw uploadErr;

            const { data: publicUrlData } = supabaseClient.storage
                .from('avatars-and-banners')
                .getPublicUrl(dosyaYolu);

            const publicUrl = publicUrlData.publicUrl;

            if (!kartVerisi.front_data) kartVerisi.front_data = {};

            if (tur === 'pfp') {
                kartVerisi.front_data.pfp_url = publicUrl;
                const avatarImg = document.getElementById('avatarImg');
                if (avatarImg) avatarImg.src = publicUrl;
            } else {
                kartVerisi.front_data.banner_url = publicUrl;
                const bannerImg = document.getElementById('bannerImg');
                if (bannerImg) bannerImg.src = publicUrl;
            }

            EditManager.Global.degisiklikYapildi();
            EditManager.Global.toastGoster("Görsel güncellendi!");
        } catch (err) {
            console.error("Görsel yükleme hatası:", err);
            alert("Görsel yüklenemedi: " + err.message);
        }
    }
};
// #endregion

// #region 4: ÖN YÜZ İNLINE METİN VE TAG DÜZENLEME (VITRIN EDIT)
EditManager.Vitrin = {
    init() {
        this.metinDuzenlemeKur('profileName', 'gorunen_isim', 30, false);
        this.metinDuzenlemeKur('profileTitle', 'unvan', 50, false);
        this.metinDuzenlemeKur('profileBio', 'aciklama', 160, true);
        this.tagYonetimiKur();
    },

    metinDuzenlemeKur(elementId, fieldName, maxLen, isTextarea = false) {
        const el = document.getElementById(elementId);
        if (!el) return;

        el.classList.add('editable-hover');
        el.title = "Düzenlemek için tıkla";

        if (el._duzenlemeBagli) return;
        el._duzenlemeBagli = true;

        el.addEventListener('click', (e) => {
            if (el.querySelector('input, textarea') || e.target.closest('a') || e.target.closest('button')) return;
            e.stopPropagation();

            const front = kartVerisi.front_data || {};
            const guncelDeger = (fieldName === 'gorunen_isim')
                ? (front.gorunen_isim || kartVerisi.kullanici_adi || '')
                : (front[fieldName] || '');

            const mevcutYukseklik = el.offsetHeight;
            el.classList.add('is-input-active');
            window._frontEditingActive = true;

            let inputHtml = '';
            if (isTextarea) {
                inputHtml = `
                    <div class="edit-inline-textarea-wrap">
                        <textarea class="edit-input-rect auto-expand-textarea" maxlength="${maxLen}" placeholder="Kendinden bahset...">${EditManager.escapeHtml(guncelDeger)}</textarea>
                        <span class="bio-counter">${guncelDeger.length}/${maxLen}</span>
                    </div>
                `;
            } else {
                const placeholder = (fieldName === 'gorunen_isim') ? 'İsim gir...' : 'Ünvan ekle...';
                const charWidth = guncelDeger.length === 0 
                    ? Math.max(placeholder.length, 4) 
                    : Math.max(guncelDeger.length + 1, 2);
                inputHtml = `<input type="text" class="edit-input-rect edit-name-input" maxlength="${maxLen}" value="${EditManager.escapeHtml(guncelDeger)}" placeholder="${placeholder}" style="width: ${charWidth}ch;">`;
            }

            el.innerHTML = inputHtml;
            const inputEl = el.querySelector('input, textarea');
            if (!inputEl) return;

            if (isTextarea) {
                if (mevcutYukseklik > 0) {
                    inputEl.style.height = `${mevcutYukseklik}px`;
                }
                inputEl.addEventListener('input', function() {
                    const counter = el.querySelector('.bio-counter');
                    if (counter) counter.textContent = `${this.value.length}/${maxLen}`;
                });
            } else {
                const placeholder = (fieldName === 'gorunen_isim') ? 'İsim gir...' : 'Ünvan ekle...';
                inputEl.addEventListener('input', function() {
                    const len = this.value.length;
                    const w = len === 0 ? Math.max(placeholder.length, 4) : Math.max(len + 1, 2);
                    this.style.width = `${w}ch`;
                });
            }

            inputEl.focus();
            if (inputEl.setSelectionRange) {
                inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
            }

            const kaydetVeKapat = () => {
                const yeniDeger = inputEl.value.trim();
                const eskiDeger = guncelDeger.trim();

                window._frontEditingActive = false;
                window._frontEditJustClosed = Date.now();

                if (!kartVerisi.front_data) kartVerisi.front_data = {};

                if (fieldName === 'gorunen_isim') {
                    kartVerisi.front_data.gorunen_isim = yeniDeger;
                } else {
                    kartVerisi.front_data[fieldName] = yeniDeger;
                }

                el.classList.remove('is-input-active');

                if (typeof RenderEngine !== 'undefined') {
                    RenderEngine.vitrinCiz(kartVerisi);
                }

                if (yeniDeger !== eskiDeger) {
                    EditManager.Global.degisiklikYapildi();
                }
            };

            inputEl.addEventListener('blur', kaydetVeKapat);
            inputEl.addEventListener('keydown', (evt) => {
                if (evt.key === 'Enter' && !isTextarea) {
                    evt.preventDefault();
                    kaydetVeKapat();
                } else if (evt.key === 'Escape') {
                    evt.preventDefault();
                    window._frontEditingActive = false;
                    window._frontEditJustClosed = Date.now();
                    el.classList.remove('is-input-active');
                    if (typeof RenderEngine !== 'undefined') {
                        RenderEngine.vitrinCiz(kartVerisi);
                    }
                }
            });
        });
    },

    tagYonetimiKur() {
        const tagsGrid = document.getElementById('tagsGrid');
        if (!tagsGrid) return;

        // Tag silme butonlarını bağla ve sürüklenebilir yap
        tagsGrid.querySelectorAll('.tag-pill:not(.tag-add-pill)').forEach((pill, idx) => {
            pill.setAttribute('draggable', 'true');
            if (!pill.querySelector('.tag-remove-btn')) {
                const removeBtn = document.createElement('button');
                removeBtn.className = 'tag-remove-btn';
                removeBtn.innerHTML = '&times;';
                removeBtn.title = 'Etiketi Sil';
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const tags = Array.isArray(kartVerisi.front_data?.tags) ? kartVerisi.front_data.tags : [];
                    tags.splice(idx, 1);
                    kartVerisi.front_data.tags = tags;
                    RenderEngine.vitrinCiz(kartVerisi);
                    EditManager.Vitrin.init();
                    EditManager.Global.degisiklikYapildi();
                });
                pill.appendChild(removeBtn);
            }
        });

        // 6'dan az tag varsa "+ Tag Ekle" hapı ekle
        const tags = Array.isArray(kartVerisi.front_data?.tags) ? kartVerisi.front_data.tags : [];
        if (tags.length < 6 && !tagsGrid.querySelector('.tag-add-pill')) {
            const addPill = document.createElement('button');
            addPill.className = 'tag-add-pill';
            addPill.textContent = '+ Tag Ekle';
            addPill.addEventListener('click', () => {
                if (EditManager.TagPicker) {
                    EditManager.TagPicker.ac();
                }
            });
            tagsGrid.appendChild(addPill);
        }

        // Sürükle-Bırak Sistemi (Hover, Grab, Drop)
        if (!tagsGrid._dragBound) {
            tagsGrid._dragBound = true;
            let tagHareketEtti = false;

            tagsGrid.addEventListener('dragstart', (e) => {
                const pill = e.target.closest('.tag-pill:not(.tag-add-pill)');
                if (!pill) return;
                tagHareketEtti = false;
                pill.classList.add('is-dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', pill.textContent);
            });

            tagsGrid.addEventListener('dragover', (e) => {
                e.preventDefault();
                const draggingPill = tagsGrid.querySelector('.tag-pill.is-dragging');
                if (!draggingPill) return;

                const targetPill = e.target.closest('.tag-pill:not(.is-dragging):not(.tag-add-pill)');
                if (targetPill) {
                    tagHareketEtti = true;
                    const box = targetPill.getBoundingClientRect();
                    const offset = e.clientX - box.left;
                    if (offset > box.width / 2) {
                        targetPill.after(draggingPill);
                    } else {
                        targetPill.before(draggingPill);
                    }
                }
            });

            tagsGrid.addEventListener('dragend', () => {
                const draggingPill = tagsGrid.querySelector('.tag-pill.is-dragging');
                if (draggingPill) draggingPill.classList.remove('is-dragging');

                if (tagHareketEtti) {
                    const yeniTagler = [...tagsGrid.querySelectorAll('.tag-pill:not(.tag-add-pill)')]
                        .map(p => {
                            const clone = p.cloneNode(true);
                            const rm = clone.querySelector('.tag-remove-btn');
                            if (rm) rm.remove();
                            return clone.textContent.trim();
                        })
                        .filter(Boolean);

                    const eskiTagler = Array.isArray(kartVerisi.front_data?.tags) ? kartVerisi.front_data.tags : [];
                    if (JSON.stringify(yeniTagler) !== JSON.stringify(eskiTagler)) {
                        if (!kartVerisi.front_data) kartVerisi.front_data = {};
                        kartVerisi.front_data.tags = yeniTagler;
                        EditManager.Global.degisiklikYapildi();
                        RenderEngine.vitrinCiz(kartVerisi);
                        EditManager.Vitrin.init();
                    }
                }
            });
        }
    }
};
// #endregion

// #region 5: ARKA YÜZ PANEL DÜZENLEMELERİ (BACK VIEWS EDIT)
EditManager.BackViews = {
    init() {
        this.menuSurukleBirakKur();
        this.linksDuzenlemeKur();
        this.topsDuzenlemeKur();
        this.workingOnDuzenlemeKur();
        this.widgetsDuzenlemeKur();
    },

    menuSurukleBirakKur() {
        const menuNav = document.getElementById('menuNav');
        if (!menuNav) return;

        menuNav.querySelectorAll('.nav-item-btn').forEach(btn => {
            btn.setAttribute('draggable', 'true');
        });

        if (!menuNav._dragBound) {
            menuNav._dragBound = true;
            let menuHareketEtti = false;

            menuNav.addEventListener('dragstart', (e) => {
                const btn = e.target.closest('.nav-item-btn');
                if (!btn) return;
                menuHareketEtti = false;
                btn.classList.add('is-dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', btn.dataset.target || '');
            });

            menuNav.addEventListener('dragover', (e) => {
                e.preventDefault();
                const draggingBtn = menuNav.querySelector('.nav-item-btn.is-dragging');
                if (!draggingBtn) return;

                const targetBtn = e.target.closest('.nav-item-btn:not(.is-dragging)');
                if (targetBtn) {
                    menuHareketEtti = true;
                    const box = targetBtn.getBoundingClientRect();
                    const offset = e.clientY - box.top;
                    if (offset > box.height / 2) {
                        targetBtn.after(draggingBtn);
                    } else {
                        targetBtn.before(draggingBtn);
                    }
                }
            });

            menuNav.addEventListener('dragend', () => {
                const draggingBtn = menuNav.querySelector('.nav-item-btn.is-dragging');
                if (draggingBtn) draggingBtn.classList.remove('is-dragging');

                window._suruklemeBitti = Date.now();

                if (menuHareketEtti) {
                    const yeniSira = [...menuNav.querySelectorAll('.nav-item-btn')].map(b => b.dataset.target).filter(Boolean);
                    if (!kartVerisi.theme_config) kartVerisi.theme_config = {};
                    const eskiSira = kartVerisi.theme_config.menu_order || [];

                    if (JSON.stringify(yeniSira) !== JSON.stringify(eskiSira)) {
                        kartVerisi.theme_config.menu_order = yeniSira;
                        EditManager.Global.degisiklikYapildi();
                        RenderEngine.menuCiz(kartVerisi);
                        EditManager.BackViews.init();
                    }
                }
            });
        }
    },

    // --- Links ---
    urlGecerliMi(string) {
        if (!string) return false;
        const res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
        return (res !== null);
    },

    kapatTumLinkAkordeonlari() {
        const wrapper = document.getElementById('links-wrapper');
        if (!wrapper) return;

        const KALEM_IKONU = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;

        wrapper.querySelectorAll('.nook-link-row.is-expanded').forEach(openRow => {
            const idx = parseInt(openRow.dataset.index, 10);
            const linkData = (typeof kartVerisi !== 'undefined' && Array.isArray(kartVerisi.links)) ? kartVerisi.links[idx] : null;
            const urlInput = openRow.querySelector('.edit-url-input');

            // Eğer geçersiz URL varsa açık bırak
            if (urlInput && urlInput.value.trim() && !this.urlGecerliMi(urlInput.value.trim())) {
                urlInput.style.borderColor = "#ef4444";
                const errorEl = openRow.querySelector('.inline-url-error');
                if (errorEl) errorEl.style.display = "block";
                return;
            }

            // Eğer hem isim hem url boş ise sessizce temizle
            if (linkData && !(linkData.baslik || linkData.isim || '').trim() && !(linkData.url || '').trim()) {
                openRow.classList.add('is-deleting');
                setTimeout(() => {
                    if (Array.isArray(kartVerisi.links)) {
                        kartVerisi.links.splice(idx, 1);
                        EditManager.Global.degisiklikYapildi();
                        EditManager.BackViews.linksDuzenlemeKur();
                    }
                }, 200);
                return;
            }

            const collapseEl = openRow.querySelector('.nook-link-collapse');
            if (collapseEl) {
                collapseEl.style.height = collapseEl.scrollHeight + 'px';
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => { collapseEl.style.height = '0px'; });
                });
            }
            openRow.classList.remove('is-expanded');
            openRow.setAttribute('draggable', 'true');
            const toggleBtn = openRow.querySelector('.nook-link-toggle') || openRow.querySelector('.nook-edit-btn');
            if (toggleBtn) {
                toggleBtn.innerHTML = KALEM_IKONU;
                toggleBtn.title = 'Düzenle';
                toggleBtn.classList.remove('is-delete-mode', 'is-active');
            }

            const nameInput = openRow.querySelector('.edit-isim-input');
            const nameDisplay = openRow.querySelector('.nook-link-name');
            if (nameDisplay && nameInput) {
                nameDisplay.textContent = nameInput.value.trim() || 'Yeni bağlantı';
            }
            const domainDisplay = openRow.querySelector('.nook-link-domain');
            const testBtn = openRow.querySelector('.nook-link-test-btn');
            if (urlInput) {
                let d = 'Bağlantı';
                let p = urlInput.value.trim();
                try {
                    if (p && !p.startsWith('http')) p = 'https://' + p;
                    if (p) d = new URL(p).hostname.replace(/^www\./, '');
                } catch(err) {}
                if (domainDisplay) domainDisplay.textContent = d;
                if (testBtn && p) testBtn.href = RenderEngine.safeUrl(p);
            }
        });
    },

    linksDuzenlemeKur() {
        const panel = document.getElementById('view-links');
        if (!panel) return;

        const scrollWrap = panel.querySelector('.scrollable-fade');
        if (!scrollWrap) return;

        // Sahip modunda boş bildirim metnini kaldır
        const placeholder = scrollWrap.querySelector('.placeholder-text');
        if (placeholder) placeholder.remove();

        let wrapper = scrollWrap.querySelector('#links-wrapper');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = 'links-wrapper';
            wrapper.className = 'links-wrapper';
            scrollWrap.prepend(wrapper);
        }

        const KALEM_IKONU = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
        const COP_IKONU = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

        const renderLinks = () => {
            wrapper.innerHTML = '';
            if (!Array.isArray(kartVerisi.links)) kartVerisi.links = [];

            const closeAccordion = (rowEl, collapseEl, urlInput) => {
                const currentUrl = urlInput.value.trim();
                const errorEl = rowEl.querySelector('.inline-url-error');

                if (currentUrl && !this.urlGecerliMi(currentUrl)) {
                    urlInput.style.borderColor = "#ef4444";
                    if (errorEl) errorEl.style.display = "block";
                    return false;
                }

                if (!rowEl.classList.contains('is-expanded')) return true;

                collapseEl.style.height = collapseEl.scrollHeight + 'px';
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => { collapseEl.style.height = '0px'; });
                });

                rowEl.classList.remove('is-expanded');
                rowEl.setAttribute('draggable', 'true');

                const toggleBtn = rowEl.querySelector('.nook-link-toggle');
                if (toggleBtn) {
                    toggleBtn.innerHTML = KALEM_IKONU;
                    toggleBtn.title = 'Düzenle';
                    toggleBtn.classList.remove('is-delete-mode');
                }

                const nameInput = rowEl.querySelector('.edit-isim-input');
                const nameDisplay = rowEl.querySelector('.nook-link-name');
                if (nameDisplay && nameInput) {
                    nameDisplay.textContent = nameInput.value.trim() || 'Yeni bağlantı';
                }

                const domainDisplay = rowEl.querySelector('.nook-link-domain');
                const testBtn = rowEl.querySelector('.nook-link-test-btn');
                if (currentUrl) {
                    let d = 'Bağlantı';
                    let p = currentUrl;
                    try {
                        if (p && !p.startsWith('http')) p = 'https://' + p;
                        if (p) d = new URL(p).hostname.replace(/^www\./, '');
                    } catch(e) {}
                    if (domainDisplay) domainDisplay.textContent = d;
                    if (testBtn && p) testBtn.href = RenderEngine.safeUrl(p);
                    const anchor = rowEl.querySelector('.nook-link-anchor');
                    if (anchor && p) anchor.href = RenderEngine.safeUrl(p);
                }

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
                if (toggleBtn) {
                    toggleBtn.innerHTML = COP_IKONU;
                    toggleBtn.title = 'Sil';
                    toggleBtn.classList.add('is-delete-mode');
                }

                collapseEl.style.height = collapseEl.scrollHeight + 'px';
                setTimeout(() => {
                    if (rowEl.classList.contains('is-expanded')) collapseEl.style.height = 'auto';
                }, 220);
            };

            const deleteRowWithAnim = (rowEl, index) => {
                rowEl.classList.add('is-deleting');
                const saveBtn = document.getElementById('edit-save-btn');
                if (saveBtn) saveBtn.classList.remove('is-locked');

                setTimeout(() => {
                    kartVerisi.links.splice(index, 1);
                    EditManager.Global.degisiklikYapildi();
                    renderLinks();
                }, 250);
            };

            kartVerisi.links.forEach((link, index) => {
                let domain = 'Bağlantı';
                try {
                    let pUrl = link.url;
                    if (pUrl && !pUrl.startsWith('http')) pUrl = 'https://' + pUrl;
                    if (pUrl) domain = new URL(pUrl).hostname.replace(/^www\./, '');
                } catch(e) {}

                const row = document.createElement('div');
                row.className = 'nook-link-row';
                row.setAttribute('draggable', 'true');
                row.dataset.index = index;

                const baslik = link.baslik || link.isim || '';

                row.innerHTML = `
                    <div class="nook-link-actions" draggable="false">
                        <button type="button" class="nook-action-btn nook-link-toggle" title="Düzenle" draggable="false">
                            ${KALEM_IKONU}
                        </button>
                    </div>
                    <div class="nook-link-main">
                        <a href="${RenderEngine.safeUrl(link.url)}" target="_blank" rel="noopener noreferrer" class="nook-link-anchor" draggable="false">
                            <div class="nook-link-icon">${RenderEngine.getLinkIcon(link.url)}</div>
                            <div class="nook-link-texts">
                                <span class="nook-link-name">${RenderEngine.escapeHtml(baslik) || 'Yeni bağlantı'}</span>
                                <span class="nook-link-domain">${RenderEngine.escapeHtml(domain)}</span>
                            </div>
                        </a>
                        <div class="nook-link-edit-fields">
                            <div class="nook-link-icon">${RenderEngine.getLinkIcon(link.url)}</div>
                            <input type="text" class="nook-link-input edit-isim-input" placeholder="Görünen İsim (Örn: GitHub)" value="${RenderEngine.escapeHtml(baslik)}" autocomplete="off" spellcheck="false" draggable="false">
                        </div>
                    </div>
                    <div class="nook-link-collapse" style="height: 0px;">
                        <div class="nook-link-form">
                            <div class="nook-url-input-wrap">
                                <input type="url" class="nook-link-input edit-url-input" placeholder="https://..." value="${RenderEngine.escapeHtml(link.url || '')}" autocomplete="off" spellcheck="false" draggable="false">
                                <a href="${RenderEngine.safeUrl(link.url)}" target="_blank" rel="noopener noreferrer" class="nook-action-btn nook-link-test-btn" title="Bağlantıyı Aç" draggable="false">
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                        <polyline points="15 3 21 3 21 9"></polyline>
                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                    </svg>
                                </a>
                            </div>
                            <span class="inline-url-error" style="display: none; color: #ef4444; font-size: var(--cq-fs-mono); margin-top: 0.5cqw;">Lütfen geçerli bir internet adresi girin.</span>
                        </div>
                    </div>
                `;

                const toggleBtn = row.querySelector('.nook-link-toggle');
                const collapseEl = row.querySelector('.nook-link-collapse');
                const nameInput = row.querySelector('.edit-isim-input');
                const urlInput = row.querySelector('.edit-url-input');
                const testBtn = row.querySelector('.nook-link-test-btn');
                const errorEl = row.querySelector('.inline-url-error');
                const anchor = row.querySelector('.nook-link-anchor');

                // Tıklanabilir iç kontrollerin mousedown ve dragstart olayını durdur ki kart sürüklenmeye başlamasın
                [toggleBtn, testBtn, nameInput, urlInput, anchor].forEach(el => {
                    if (!el) return;
                    el.addEventListener('mousedown', (e) => e.stopPropagation());
                    el.addEventListener('dragstart', (e) => { e.preventDefault(); e.stopPropagation(); });
                });

                const autoSave = () => {
                    let val = urlInput.value.trim();
                    const saveBtn = document.getElementById('edit-save-btn');

                    if (val && !this.urlGecerliMi(val)) {
                        urlInput.style.borderColor = "#ef4444";
                        if (errorEl) errorEl.style.display = "block";
                        if (saveBtn) saveBtn.classList.add('is-locked');
                        return;
                    }

                    urlInput.style.borderColor = "";
                    if (errorEl) errorEl.style.display = "none";
                    if (saveBtn) {
                        const anyError = wrapper.querySelector('.inline-url-error[style*="display: block"]');
                        if (!anyError) saveBtn.classList.remove('is-locked');
                    }

                    if (val && !val.startsWith('http://') && !val.startsWith('https://')) val = 'https://' + val;

                    kartVerisi.links[index] = {
                        baslik: nameInput.value.trim(),
                        isim: nameInput.value.trim(),
                        url: val
                    };
                    const anchorEl = row.querySelector('.nook-link-anchor');
                    if (anchorEl && val) anchorEl.href = RenderEngine.safeUrl(val);
                    const nameDisplay = row.querySelector('.nook-link-name');
                    if (nameDisplay) nameDisplay.textContent = nameInput.value.trim() || 'Yeni bağlantı';
                    EditManager.Global.degisiklikYapildi();
                };

                let iconDebounceTimer = null;
                const updateLinkIconAndDomain = (forceImmediate = false) => {
                    let val = urlInput.value.trim();
                    if (!val) return;
                    if (!val.startsWith('http://') && !val.startsWith('https://')) val = 'https://' + val;

                    const doUpdate = () => {
                        const iconEls = row.querySelectorAll('.nook-link-icon');
                        const domainEl = row.querySelector('.nook-link-domain');
                        const testBtn = row.querySelector('.nook-link-test-btn');
                        const anchorEl = row.querySelector('.nook-link-anchor');

                        if (this.urlGecerliMi(val)) {
                            let d = 'Bağlantı';
                            try {
                                d = new URL(val).hostname.replace(/^www\./, '');
                            } catch(e) {}

                            if (domainEl) domainEl.textContent = d;
                            const newIconSvg = RenderEngine.getLinkIcon(val);
                            iconEls.forEach(iconEl => iconEl.innerHTML = newIconSvg);
                            if (testBtn) testBtn.href = RenderEngine.safeUrl(val);
                            if (anchorEl) anchorEl.href = RenderEngine.safeUrl(val);
                        }
                    };

                    clearTimeout(iconDebounceTimer);
                    if (forceImmediate) {
                        doUpdate();
                    } else {
                        iconDebounceTimer = setTimeout(doUpdate, 300);
                    }
                };

                nameInput.addEventListener('input', autoSave);
                urlInput.addEventListener('input', () => {
                    autoSave();
                    updateLinkIconAndDomain(false);
                });
                urlInput.addEventListener('blur', () => {
                    updateLinkIconAndDomain(true);
                });

                // Enter tuşuna basıldığında akordeonu kapat (küçült)
                const handleEnter = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        autoSave();
                        closeAccordion(row, collapseEl, urlInput);
                    }
                };
                nameInput.addEventListener('keydown', handleEnter);
                urlInput.addEventListener('keydown', handleEnter);

                // Düzenle / Sil butonu (Açıkken tıklandığında siler, kapalıyken akordeonu açar)
                if (toggleBtn) {
                    toggleBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (window._suruklemeBitti && Date.now() - window._suruklemeBitti < 250) return;

                        if (row.classList.contains('is-expanded')) {
                            deleteRowWithAnim(row, index);
                        } else {
                            openAccordion(row, collapseEl);
                            setTimeout(() => nameInput.focus(), 60);
                        }
                    });
                }

                wrapper.appendChild(row);
            });
        };

        // Mevcut linkleri çiz
        renderLinks();

        // En alta "+ Yeni Bağlantı Ekle" butonu koy
        let addBtn = scrollWrap.querySelector('.links-add-btn');
        if (!addBtn) {
            addBtn = document.createElement('button');
            addBtn.className = 'view-add-btn links-add-btn';
            addBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Yeni Bağlantı Ekle</span>
            `;
            scrollWrap.appendChild(addBtn);
        } else {
            scrollWrap.appendChild(addBtn);
        }

        addBtn.onclick = (e) => {
            e.stopPropagation();
            if (!Array.isArray(kartVerisi.links)) kartVerisi.links = [];
            if (kartVerisi.links.length >= 15) {
                alert("Maksimum bağlantı sayısına ulaşıldı.");
                return;
            }

            const hasEmpty = kartVerisi.links.some(l => !(l.baslik || l.isim || '').trim() && !(l.url || '').trim());
            if (hasEmpty) {
                const expandedInput = wrapper.querySelector('.nook-link-row.is-expanded .edit-isim-input');
                if (expandedInput) expandedInput.focus();
                return;
            }

            kartVerisi.links.push({ baslik: '', isim: '', url: '' });
            EditManager.Global.degisiklikYapildi();
            renderLinks();

            const lastItem = wrapper.lastElementChild;
            if (lastItem) {
                const toggleBtn = lastItem.querySelector('.nook-link-toggle');
                if (toggleBtn) toggleBtn.click();
            }
        };

        // Tıklama dışı akordeon kapatma (Click outside)
        if (!window._linksClickOutsideBound) {
            window._linksClickOutsideBound = true;
            document.addEventListener('mousedown', (e) => {
                if (!e.target.closest('.nook-link-row.is-expanded') && !e.target.closest('.links-add-btn') && !e.target.closest('#edit-action-bar')) {
                    const expanded = wrapper.querySelectorAll('.nook-link-row.is-expanded');
                    if (expanded.length > 0) {
                        window._linkAccordionJustClosed = Date.now();
                    }
                    EditManager.BackViews.kapatTumLinkAkordeonlari();
                }
            });
        }

        // Link Satırları Sürükle-Bırak Sistemi
        if (!wrapper._linksDragBound) {
            wrapper._linksDragBound = true;
            let linkHareketEtti = false;

            wrapper.addEventListener('dragstart', (e) => {
                if (e.target.closest('.nook-link-anchor, .nook-link-actions, .nook-action-btn, input, button, a')) {
                    e.preventDefault();
                    return;
                }
                const row = e.target.closest('.nook-link-row');
                if (!row || row.classList.contains('is-expanded')) {
                    e.preventDefault();
                    return;
                }
                linkHareketEtti = false;
                row.classList.add('is-dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', row.dataset.index || '');
            });

            wrapper.addEventListener('dragover', (e) => {
                e.preventDefault();
                const draggingRow = wrapper.querySelector('.nook-link-row.is-dragging');
                if (!draggingRow) return;

                const targetRow = e.target.closest('.nook-link-row:not(.is-dragging)');
                if (targetRow) {
                    linkHareketEtti = true;
                    const box = targetRow.getBoundingClientRect();
                    const offset = e.clientY - box.top;
                    if (offset > box.height / 2) {
                        targetRow.after(draggingRow);
                    } else {
                        targetRow.before(draggingRow);
                    }
                }
            });

            wrapper.addEventListener('dragend', () => {
                const draggingRow = wrapper.querySelector('.nook-link-row.is-dragging');
                if (draggingRow) draggingRow.classList.remove('is-dragging');

                window._suruklemeBitti = Date.now();

                if (linkHareketEtti && Array.isArray(kartVerisi.links)) {
                    const yeniSiraIndices = [...wrapper.querySelectorAll('.nook-link-row')].map(r => parseInt(r.dataset.index, 10));
                    const yeniLinks = yeniSiraIndices.map(i => kartVerisi.links[i]).filter(Boolean);

                    if (JSON.stringify(yeniLinks) !== JSON.stringify(kartVerisi.links)) {
                        kartVerisi.links = yeniLinks;
                        EditManager.Global.degisiklikYapildi();
                        renderLinks();
                    }
                }
            });
        }
    },

    // --- Tops ---
    acTopFormu() {
        const panel = document.getElementById('view-tops');
        if (!panel) return;
        const scrollWrap = panel.querySelector('.scrollable-fade');
        if (!scrollWrap) return;

        let form = scrollWrap.querySelector('.top-add-form');
        if (form) {
            form.querySelector('.top-title-input')?.focus();
            return;
        }

        form = document.createElement('div');
        form.className = 'inline-form-card top-add-form';
        form.innerHTML = `
            <h4 class="inline-form-title">Yeni Vitrin Öğesi</h4>
            <input type="text" class="inline-form-input top-title-input" placeholder="Başlık (Örn: Interstellar, Radiohead)">
            <input type="text" class="inline-form-input top-desc-input" placeholder="Açıklama / Yıl (Örn: 2014, Christopher Nolan)">
            <input type="url" class="inline-form-input top-img-input" placeholder="Afiş Görsel URL'si (İsteğe bağlı)">
            <div class="inline-form-actions">
                <button type="button" class="form-btn-sm form-btn-cancel top-cancel-btn">İptal</button>
                <button type="button" class="form-btn-sm form-btn-submit top-save-btn">Ekle</button>
            </div>
        `;

        const addBtn = scrollWrap.querySelector('.tops-add-btn');
        if (addBtn) {
            scrollWrap.insertBefore(form, addBtn);
        } else {
            scrollWrap.appendChild(form);
        }

        const titleInput = form.querySelector('.top-title-input');
        if (titleInput) setTimeout(() => titleInput.focus(), 50);

        form.querySelector('.top-cancel-btn').onclick = () => {
            form.remove();
            const ogeler = Array.isArray(kartVerisi.tops?.ogeler) ? kartVerisi.tops.ogeler : [];
            if (ogeler.length === 0) {
                if (typeof Router !== 'undefined') Router.resetToMainMenu();
            }
        };

        form.querySelector('.top-save-btn').onclick = () => {
            const baslik = form.querySelector('.top-title-input').value.trim();
            const aciklama = form.querySelector('.top-desc-input').value.trim();
            const afis_url = form.querySelector('.top-img-input').value.trim();
            if (!baslik) {
                alert("Lütfen bir başlık girin!");
                return;
            }

            if (!kartVerisi.tops || Array.isArray(kartVerisi.tops)) {
                kartVerisi.tops = { kategori: kartVerisi.tops?.kategori || 'Tops', ogeler: [] };
            }
            if (!Array.isArray(kartVerisi.tops.ogeler)) {
                kartVerisi.tops.ogeler = [];
            }

            kartVerisi.tops.ogeler.push({
                baslik,
                aciklama,
                afis_url: afis_url || null
            });

            RenderEngine.menuCiz(kartVerisi);
            RenderEngine.altEkranlariCiz(kartVerisi);
            EditManager.BackViews.init();
            EditManager.Global.degisiklikYapildi();
        };
    },

    topsDuzenlemeKur() {
        const panel = document.getElementById('view-tops');
        if (!panel) return;

        const titleEl = panel.querySelector('.view-title');
        if (titleEl && !titleEl.classList.contains('editable-hover')) {
            titleEl.classList.add('editable-hover');
            titleEl.title = "Kategori adını değiştirmek için tıkla";
            titleEl.onclick = () => {
                const mevcutKategori = kartVerisi.tops?.kategori || titleEl.textContent.trim();
                const yeniAd = prompt("Yeni kategori adı (Örn: Favorite Movies, Anime, Games):", mevcutKategori);
                if (yeniAd !== null && yeniAd.trim() && yeniAd.trim() !== mevcutKategori) {
                    if (!kartVerisi.tops) kartVerisi.tops = {};
                    kartVerisi.tops.kategori = yeniAd.trim();
                    titleEl.textContent = yeniAd.trim();
                    RenderEngine.menuCiz(kartVerisi);
                    EditManager.Global.degisiklikYapildi();
                }
            };
        }

        const scrollWrap = panel.querySelector('.scrollable-fade');
        if (!scrollWrap) return;

        // Sahip modunda boş bildirim metnini kaldır ki ekleme butonu en yukarıda dursun
        const placeholder = scrollWrap.querySelector('.placeholder-text');
        if (placeholder) placeholder.remove();

        // En alta "+ Yeni Öğe Ekle" butonu koy
        let addBtn = scrollWrap.querySelector('.tops-add-btn');
        if (!addBtn) {
            addBtn = document.createElement('button');
            addBtn.className = 'view-add-btn tops-add-btn';
            addBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Yeni Öğe Ekle</span>
            `;

            addBtn.addEventListener('click', () => {
                this.acTopFormu();
            });

            scrollWrap.appendChild(addBtn);
        } else {
            scrollWrap.appendChild(addBtn);
        }

        // Tops öğelerine silme butonu ekle ve sürüklenebilir yap
        scrollWrap.querySelectorAll('.top-item-card').forEach((card, idx) => {
            card.setAttribute('draggable', 'true');
            card.dataset.index = idx;
            if (!card.querySelector('.item-delete-btn')) {
                const delBtn = document.createElement('button');
                delBtn.className = 'item-delete-btn';
                delBtn.style.position = 'absolute';
                delBtn.style.top = '8px';
                delBtn.style.right = '8px';
                delBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                `;
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (kartVerisi.tops?.ogeler) {
                        kartVerisi.tops.ogeler.splice(idx, 1);
                        if (kartVerisi.tops.ogeler.length === 0) {
                            delete kartVerisi.tops;
                            RenderEngine.menuCiz(kartVerisi);
                            RenderEngine.altEkranlariCiz(kartVerisi);
                            EditManager.BackViews.init();
                            EditManager.Global.degisiklikYapildi();
                            if (typeof Router !== 'undefined') Router.resetToMainMenu();
                        } else {
                            RenderEngine.menuCiz(kartVerisi);
                            RenderEngine.altEkranlariCiz(kartVerisi);
                            EditManager.BackViews.init();
                            EditManager.Global.degisiklikYapildi();
                        }
                    }
                });
                card.appendChild(delBtn);
            }
        });

        // Tops Kartları Sürükle-Bırak Sistemi
        if (!scrollWrap._topsDragBound) {
            scrollWrap._topsDragBound = true;
            let topHareketEtti = false;

            scrollWrap.addEventListener('dragstart', (e) => {
                const card = e.target.closest('.top-item-card');
                if (!card) return;
                topHareketEtti = false;
                card.classList.add('is-dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', card.dataset.index || '');
            });

            scrollWrap.addEventListener('dragover', (e) => {
                e.preventDefault();
                const draggingCard = scrollWrap.querySelector('.top-item-card.is-dragging');
                if (!draggingCard) return;

                const targetCard = e.target.closest('.top-item-card:not(.is-dragging)');
                if (targetCard) {
                    topHareketEtti = true;
                    const box = targetCard.getBoundingClientRect();
                    const offset = e.clientY - box.top;
                    if (offset > box.height / 2) {
                        targetCard.after(draggingCard);
                    } else {
                        targetCard.before(draggingCard);
                    }
                }
            });

            scrollWrap.addEventListener('dragend', () => {
                const draggingCard = scrollWrap.querySelector('.top-item-card.is-dragging');
                if (draggingCard) draggingCard.classList.remove('is-dragging');

                // addBtn ve açık form her zaman en altta kalmalı
                const currentAddBtn = scrollWrap.querySelector('.tops-add-btn');
                const currentForm = scrollWrap.querySelector('.top-add-form');
                if (currentForm) scrollWrap.appendChild(currentForm);
                if (currentAddBtn) scrollWrap.appendChild(currentAddBtn);

                if (topHareketEtti && kartVerisi.tops && Array.isArray(kartVerisi.tops.ogeler)) {
                    const yeniSiraIndices = [...scrollWrap.querySelectorAll('.top-item-card')].map(c => parseInt(c.dataset.index, 10));
                    const yeniOgeler = yeniSiraIndices.map(i => kartVerisi.tops.ogeler[i]).filter(Boolean);

                    if (JSON.stringify(yeniOgeler) !== JSON.stringify(kartVerisi.tops.ogeler)) {
                        kartVerisi.tops.ogeler = yeniOgeler;
                        EditManager.Global.degisiklikYapildi();
                        RenderEngine.altEkranlariCiz(kartVerisi);
                        EditManager.BackViews.init();
                    }
                }
            });
        }
    },

    // --- Working On ---
    acWorkingFormu() {
        const panel = document.getElementById('view-working-on');
        if (!panel) return;
        const scrollWrap = panel.querySelector('.scrollable-fade');
        if (!scrollWrap) return;

        let form = scrollWrap.querySelector('.working-edit-form');
        if (form) {
            form.querySelector('.working-text-input')?.focus();
            return;
        }

        const statusCard = scrollWrap.querySelector('.status-card');
        if (statusCard) statusCard.style.display = 'none';

        const placeholder = scrollWrap.querySelector('.placeholder-text');
        if (placeholder) placeholder.style.display = 'none';

        const addBtn = scrollWrap.querySelector('.working-add-btn');
        if (addBtn) addBtn.style.display = 'none';

        const mevcutMetin = kartVerisi.working_on?.metin || '';

        form = document.createElement('div');
        form.className = 'inline-form-card working-edit-form';
        form.innerHTML = `
            <h4 class="inline-form-title">Şu Anda Ne Yapıyorum?</h4>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0 0 8px 0;">
                Üzerinde çalıştığın proje veya anlık durumunu güncelle.
            </p>
            <textarea class="inline-form-input working-text-input" rows="3" placeholder="Örn: Building next-gen UI components on Nook...">${EditManager.escapeHtml(mevcutMetin)}</textarea>
            <div class="inline-form-actions">
                <button type="button" class="form-btn-sm form-btn-cancel working-cancel-btn">İptal</button>
                <button type="button" class="form-btn-sm form-btn-submit working-save-btn">Kaydet</button>
            </div>
        `;

        if (addBtn) {
            scrollWrap.insertBefore(form, addBtn);
        } else {
            scrollWrap.appendChild(form);
        }

        const textarea = form.querySelector('.working-text-input');
        if (textarea) {
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(textarea.value.length, textarea.value.length);
            }, 50);
        }

        form.querySelector('.working-cancel-btn').onclick = () => {
            form.remove();
            if (!kartVerisi.working_on || !kartVerisi.working_on.metin || kartVerisi.working_on.metin.trim() === '') {
                if (typeof Router !== 'undefined') Router.resetToMainMenu();
            } else {
                if (statusCard) statusCard.style.display = '';
                if (placeholder) placeholder.style.display = '';
                if (addBtn) addBtn.style.display = '';
            }
        };

        form.querySelector('.working-save-btn').onclick = () => {
            const metin = form.querySelector('.working-text-input').value.trim();
            if (!metin) {
                alert("Lütfen durum metni girin!");
                return;
            }

            if (!kartVerisi.working_on) kartVerisi.working_on = {};
            kartVerisi.working_on.metin = metin;

            RenderEngine.menuCiz(kartVerisi);
            RenderEngine.altEkranlariCiz(kartVerisi);
            EditManager.BackViews.init();
            EditManager.Global.degisiklikYapildi();
        };
    },

    workingOnDuzenlemeKur() {
        const panel = document.getElementById('view-working-on');
        if (!panel) return;
        const scrollWrap = panel.querySelector('.scrollable-fade');
        if (!scrollWrap) return;

        const card = scrollWrap.querySelector('.status-card');
        if (card && !card.querySelector('.working-owner-actions')) {
            card.classList.add('editable-hover');
            card.title = "Durumunuzu güncellemek için tıklayın";
            card.onclick = (e) => {
                if (e.target.closest('button')) return;
                this.acWorkingFormu();
            };

            const actionsWrap = document.createElement('div');
            actionsWrap.className = 'working-owner-actions';
            actionsWrap.style.display = 'flex';
            actionsWrap.style.justifyContent = 'flex-end';
            actionsWrap.style.gap = '8px';
            actionsWrap.style.marginTop = '8px';

            actionsWrap.innerHTML = `
                <button type="button" class="form-btn-sm form-btn-cancel working-edit-btn" style="font-size: 0.75rem;">Düzenle</button>
                <button type="button" class="form-btn-sm form-btn-cancel working-remove-btn" style="color: #ef4444; font-size: 0.75rem;">Kaldır</button>
            `;

            actionsWrap.querySelector('.working-edit-btn').onclick = (e) => {
                e.stopPropagation();
                this.acWorkingFormu();
            };

            actionsWrap.querySelector('.working-remove-btn').onclick = (e) => {
                e.stopPropagation();
                kartVerisi.working_on = {};
                RenderEngine.menuCiz(kartVerisi);
                RenderEngine.altEkranlariCiz(kartVerisi);
                EditManager.BackViews.init();
                EditManager.Global.degisiklikYapildi();
                if (typeof Router !== 'undefined') Router.resetToMainMenu();
            };

            card.appendChild(actionsWrap);
        } else if (!card && !panel.querySelector('.working-add-btn') && !scrollWrap.querySelector('.working-edit-form')) {
            const placeholder = scrollWrap.querySelector('.placeholder-text');
            if (placeholder) placeholder.remove();

            const addBtn = document.createElement('button');
            addBtn.className = 'view-add-btn working-add-btn';
            addBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Durum Bildirimi Ekle</span>
            `;
            addBtn.onclick = () => {
                this.acWorkingFormu();
            };
            scrollWrap.appendChild(addBtn);
        }
    },

    // --- Widgets ---
    acWidgetFormu(mevcutUser = '') {
        const panel = document.getElementById('view-widgets');
        if (!panel) return;
        const scrollWrap = panel.querySelector('.scrollable-fade');
        if (!scrollWrap) return;

        let form = scrollWrap.querySelector('.widget-add-form');
        if (form) {
            form.querySelector('.widget-user-input')?.focus();
            return;
        }

        form = document.createElement('div');
        form.className = 'inline-form-card widget-add-form';
        form.innerHTML = `
            <h4 class="inline-form-title">${mevcutUser ? 'Monkeytype Kullanıcısını Değiştir' : 'Monkeytype Widget\'ı Ekle'}</h4>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0 0 8px 0;">
                ${mevcutUser ? 'Yeni Monkeytype kullanıcı adını gir:' : 'Monkeytype kullanıcı adını girerek canlı klavye yazma skorlarını kartına ekle:'}
            </p>
            <input type="text" class="inline-form-input widget-user-input" placeholder="Kullanıcı Adı (Örn: miodec)" value="${EditManager.escapeHtml(mevcutUser)}">
            <div class="inline-form-actions">
                <button type="button" class="form-btn-sm form-btn-cancel widget-cancel-btn">İptal</button>
                <button type="button" class="form-btn-sm form-btn-submit widget-save-btn">${mevcutUser ? 'Güncelle' : 'Ekle'}</button>
            </div>
        `;

        const addBtn = scrollWrap.querySelector('.widget-add-btn');
        if (addBtn) {
            scrollWrap.insertBefore(form, addBtn);
        } else {
            scrollWrap.appendChild(form);
        }

        const userInput = form.querySelector('.widget-user-input');
        if (userInput) setTimeout(() => userInput.focus(), 50);

        form.querySelector('.widget-cancel-btn').onclick = () => {
            form.remove();
            if (!kartVerisi.widgets || kartVerisi.widgets.length === 0) {
                if (typeof Router !== 'undefined') Router.resetToMainMenu();
            }
        };

        form.querySelector('.widget-save-btn').onclick = () => {
            const yeniUser = form.querySelector('.widget-user-input').value.trim();
            if (!yeniUser) {
                alert("Lütfen Monkeytype kullanıcı adınızı girin!");
                return;
            }

            if (!Array.isArray(kartVerisi.widgets)) kartVerisi.widgets = [];
            let w = kartVerisi.widgets.find(item => item.tur === 'monkeytype');
            if (w) {
                if (!w.ayarlar) w.ayarlar = {};
                w.ayarlar.kullanici = yeniUser;
            } else {
                kartVerisi.widgets.push({
                    tur: 'monkeytype',
                    ayarlar: { kullanici: yeniUser }
                });
            }

            RenderEngine.menuCiz(kartVerisi);
            RenderEngine.altEkranlariCiz(kartVerisi);
            EditManager.BackViews.init();

            if (typeof canliMonkeytypeVerisiCek === 'function') {
                canliMonkeytypeVerisiCek(yeniUser).then(skorlar => {
                    if (skorlar) {
                        kartVerisi.canli_monkeytype = skorlar;
                        RenderEngine.monkeytypeGuncelle(skorlar);
                    }
                });
            }
            EditManager.Global.degisiklikYapildi();
        };
    },

    widgetsDuzenlemeKur() {
        const panel = document.getElementById('view-widgets');
        if (!panel) return;
        const scrollWrap = panel.querySelector('.scrollable-fade');
        if (!scrollWrap) return;

        // Sahip modunda boş bildirim metnini kaldır
        const placeholder = scrollWrap.querySelector('.placeholder-text');
        if (placeholder) placeholder.remove();

        // Monkeytype kartı varsa kullanıcı adını güncelleme ve widget'ı kaldırma butonu koy
        const mtCard = panel.querySelector('.monkeytype-card');
        if (mtCard && !mtCard.querySelector('.mt-owner-actions')) {
            const actionsWrap = document.createElement('div');
            actionsWrap.className = 'mt-owner-actions';
            actionsWrap.style.display = 'flex';
            actionsWrap.style.justifyContent = 'flex-end';
            actionsWrap.style.gap = '8px';
            actionsWrap.style.marginTop = '8px';

            actionsWrap.innerHTML = `
                <button type="button" class="form-btn-sm form-btn-cancel mt-edit-user-btn" style="font-size: 0.75rem;">Kullanıcıyı Değiştir</button>
                <button type="button" class="form-btn-sm form-btn-cancel mt-remove-btn" style="color: #ef4444; font-size: 0.75rem;">Widget'ı Kaldır</button>
            `;

            actionsWrap.querySelector('.mt-edit-user-btn').onclick = () => {
                const mevcutUser = mtCard.dataset.username || '';
                this.acWidgetFormu(mevcutUser);
            };

            actionsWrap.querySelector('.mt-remove-btn').onclick = () => {
                kartVerisi.widgets = (kartVerisi.widgets || []).filter(item => item.tur !== 'monkeytype');
                if (kartVerisi.widgets.length === 0) {
                    delete kartVerisi.widgets;
                    RenderEngine.menuCiz(kartVerisi);
                    RenderEngine.altEkranlariCiz(kartVerisi);
                    EditManager.BackViews.init();
                    EditManager.Global.degisiklikYapildi();
                    if (typeof Router !== 'undefined') Router.resetToMainMenu();
                } else {
                    RenderEngine.menuCiz(kartVerisi);
                    RenderEngine.altEkranlariCiz(kartVerisi);
                    EditManager.BackViews.init();
                    EditManager.Global.degisiklikYapildi();
                }
            };

            mtCard.appendChild(actionsWrap);
        } else if (!mtCard && !panel.querySelector('.widget-add-btn') && !scrollWrap.querySelector('.widget-add-form')) {
            // Widget yoksa "+ Monkeytype Widget'ı Ekle" butonu koy
            const addBtn = document.createElement('button');
            addBtn.className = 'view-add-btn widget-add-btn';
            addBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Monkeytype Widget'ı Ekle</span>
            `;
            addBtn.onclick = () => {
                this.acWidgetFormu();
            };
            scrollWrap.appendChild(addBtn);
        }
    }
};
// #endregion

// #region 6: BÖLÜM SEÇİCİ VE YENİ KATEGORİ OLUŞTURMA (SECTION PICKER)
EditManager.SectionPicker = {
    init() {
        const closeBtn = document.getElementById('add-section-close');
        const backdrop = document.getElementById('add-section-backdrop');
        if (closeBtn) closeBtn.onclick = () => this.kapat();
        if (backdrop) backdrop.onclick = () => this.kapat();

        this.bagla();
    },

    bagla() {
        document.querySelectorAll('#open-add-section-modal').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                this.ac();
            };
        });
    },

    ac() {
        const modal = document.getElementById('add-section-modal');
        const list = document.getElementById('sectionPickerList');
        if (!modal || !list) return;

        const hasLinks = Array.isArray(kartVerisi.links) && kartVerisi.links.length > 0;
        const hasTops = (kartVerisi.tops && Array.isArray(kartVerisi.tops.ogeler) && kartVerisi.tops.ogeler.length > 0) || (Array.isArray(kartVerisi.tops) && kartVerisi.tops.length > 0);
        const hasWidgets = Array.isArray(kartVerisi.widgets) && kartVerisi.widgets.length > 0;
        const hasWorking = !!(kartVerisi.working_on && (kartVerisi.working_on.metin || kartVerisi.working_on.status));

        const kategoriler = [
            {
                id: 'links',
                baslik: 'Bağlantılar (Links)',
                alt: 'Sosyal medya, GitHub ve web bağlantılarını listele',
                ikon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
                varMi: hasLinks
            },
            {
                id: 'tops',
                baslik: 'Vitrin & Favoriler (Tops)',
                alt: 'En sevdiğin film, dizi, oyun veya müzikleri sergile',
                ikon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
                varMi: hasTops
            },
            {
                id: 'widgets',
                baslik: 'Monkeytype Skoru (Widgets)',
                alt: 'Canlı klavye yazma hızı ve doğruluk widgetı',
                ikon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="6" y1="8" x2="6" y2="8.01"></line><line x1="10" y1="8" x2="10" y2="8.01"></line><line x1="14" y1="8" x2="14" y2="8.01"></line><line x1="18" y1="8" x2="18" y2="8.01"></line><line x1="6" y1="12" x2="6" y2="12.01"></line><line x1="10" y1="12" x2="10" y2="12.01"></line><line x1="14" y1="12" x2="14" y2="12.01"></line><line x1="18" y1="12" x2="18" y2="12.01"></line><line x1="7" y1="16" x2="17" y2="16"></line></svg>`,
                varMi: hasWidgets
            },
            {
                id: 'working-on',
                baslik: 'Şu Anda Ne Yapıyorum (Working on)',
                alt: 'Üzerinde çalıştığın proje veya anlık durum bildirimi',
                ikon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
                varMi: hasWorking
            }
        ];

        list.innerHTML = kategoriler.map(k => `
            <div class="section-picker-item ${k.varMi ? 'is-already-added' : ''}" data-cat="${k.id}">
                <div class="picker-item-icon">${k.ikon}</div>
                <div class="picker-item-info">
                    <div class="picker-item-title-row">
                        <span class="picker-item-title">${k.baslik}</span>
                        ${k.varMi ? '<span class="picker-added-badge">Mevcut</span>' : ''}
                    </div>
                    <span class="picker-item-desc">${k.alt}</span>
                </div>
                <div class="picker-item-action">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.section-picker-item').forEach(item => {
            item.onclick = () => {
                const catId = item.dataset.cat;
                this.kategoriSecildi(catId);
            };
        });

        modal.classList.add('is-open');
    },

    kapat() {
        const modal = document.getElementById('add-section-modal');
        if (modal) modal.classList.remove('is-open');
    },

    kategoriSecildi(catId) {
        this.kapat();

        if (catId === 'links') {
            if (!Array.isArray(kartVerisi.links)) kartVerisi.links = [];
        } else if (catId === 'tops') {
            if (!kartVerisi.tops || Array.isArray(kartVerisi.tops)) {
                kartVerisi.tops = { kategori: kartVerisi.tops?.kategori || 'Tops', ogeler: [] };
            }
            if (!Array.isArray(kartVerisi.tops.ogeler)) kartVerisi.tops.ogeler = [];
        } else if (catId === 'widgets') {
            if (!Array.isArray(kartVerisi.widgets)) kartVerisi.widgets = [];
        } else if (catId === 'working-on') {
            if (!kartVerisi.working_on) kartVerisi.working_on = { metin: '' };
        }

        // Arayüzü yeniden çiz
        RenderEngine.menuCiz(kartVerisi);
        RenderEngine.altEkranlariCiz(kartVerisi);
        EditManager.BackViews.init();
        this.bagla();

        // Doğrudan oluşturulan kategorinin detay ekranına git
        if (typeof Router !== 'undefined') {
            Router.openDetailView(catId);
        }
    }
};
// #endregion

// #region 7: ETİKET SEÇİCİ VE HAVUZ YÖNETİMİ (TAG PICKER)
EditManager.TagPicker = {
    init() {
        const closeBtn = document.getElementById('tag-picker-close');
        const backdrop = document.getElementById('tag-picker-backdrop');
        const searchInput = document.getElementById('tag-search-input');

        if (closeBtn) closeBtn.onclick = () => this.kapat();
        if (backdrop) backdrop.onclick = () => this.kapat();

        if (searchInput) {
            searchInput.oninput = (e) => {
                this.filtrele(e.target.value);
            };
        }
    },

    ac() {
        const modal = document.getElementById('tag-picker-modal');
        const searchInput = document.getElementById('tag-search-input');
        if (!modal) return;

        if (searchInput) {
            searchInput.value = '';
        }

        this.havuzuCiz('');
        modal.classList.add('is-open');

        if (searchInput) {
            setTimeout(() => searchInput.focus(), 50);
        }
    },

    kapat() {
        const modal = document.getElementById('tag-picker-modal');
        if (modal) modal.classList.remove('is-open');
    },

    filtrele(arama) {
        this.havuzuCiz(arama);
    },

    havuzuCiz(arama = '') {
        const wrap = document.getElementById('tagPoolWrap');
        if (!wrap) return;

        const mevcutTags = Array.isArray(kartVerisi.front_data?.tags) ? kartVerisi.front_data.tags : [];
        const havuz = (typeof TAG_HAVUZU !== 'undefined' && Array.isArray(TAG_HAVUZU)) ? TAG_HAVUZU : [
            "Coder", "Developer", "Designer", "Gamer", "Music", "Stylist", "Sci-Fi", "Anime",
            "Minimalist", "Writer", "Artist", "Cyberpunk", "Photographer", "Reader", "Coffee", "Tech"
        ];

        const filtreMetni = arama.trim().toLowerCase();
        const filtrelenmis = havuz.filter(tag => tag.toLowerCase().includes(filtreMetni));

        if (filtrelenmis.length === 0) {
            wrap.innerHTML = `<div class="tag-pool-empty">Eşleşen etiket bulunamadı.</div>`;
            return;
        }

        wrap.innerHTML = filtrelenmis.map(tag => {
            const secili = mevcutTags.includes(tag);
            return `
                <div class="tag-pool-item ${secili ? 'is-already-selected' : ''}" data-tag="${EditManager.escapeHtml(tag)}">
                    <span>${secili ? '✓' : '+'}</span>
                    <span>${EditManager.escapeHtml(tag)}</span>
                </div>
            `;
        }).join('');

        wrap.querySelectorAll('.tag-pool-item').forEach(item => {
            if (item.classList.contains('is-already-selected')) return;
            item.onclick = () => {
                const tag = item.dataset.tag;
                this.etiketSec(tag);
            };
        });
    },

    etiketSec(tag) {
        if (!tag) return;
        if (!kartVerisi.front_data) kartVerisi.front_data = {};
        if (!Array.isArray(kartVerisi.front_data.tags)) kartVerisi.front_data.tags = [];

        if (kartVerisi.front_data.tags.length >= 6) {
            alert("En fazla 6 etiket seçebilirsiniz!");
            this.kapat();
            return;
        }

        if (kartVerisi.front_data.tags.includes(tag)) {
            return;
        }

        kartVerisi.front_data.tags.push(tag);
        this.kapat();

        RenderEngine.vitrinCiz(kartVerisi);
        EditManager.Vitrin.init();
        EditManager.Global.degisiklikYapildi();
    }
};

EditManager.escapeHtml = function(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};
// #endregion
