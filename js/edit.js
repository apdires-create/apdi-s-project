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

        // Orijinal verinin yedeğini al (İptal edilebilmesi için)
        this.state.orijinalVeri = JSON.parse(JSON.stringify(kartVerisi));

        this.domElemanlariniOlustur();
        this.Global.init();
        this.Media.init();
        this.Vitrin.init();
        this.BackViews.init();
        this.SectionPicker.init();

        document.body.classList.add('global-edit-mode');
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

        // 5. Bölüm Ekleme Pop-up Modalı (Section Picker Modal)
        if (!document.getElementById('add-section-modal')) {
            const modal = document.createElement('div');
            modal.id = 'add-section-modal';
            modal.className = 'add-section-modal';
            modal.innerHTML = `
                <div class="add-section-backdrop" id="add-section-backdrop"></div>
                <div class="section-picker-panel">
                    <div class="section-picker-header">
                        <div>
                            <h3 class="section-picker-title">Bölüm Ekle</h3>
                            <p class="section-picker-desc">Kartının arka yüzünde sergilemek istediğin bir kategoriyi seç.</p>
                        </div>
                        <button type="button" class="section-picker-close" id="add-section-close">&times;</button>
                    </div>
                    <div class="section-picker-list" id="sectionPickerList"></div>
                </div>
            `;
            document.body.appendChild(modal);
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

    degisiklikYapildi() {
        if (EditManager.state.orijinalVeri) {
            const guncelStr = JSON.stringify(kartVerisi);
            const orijStr = JSON.stringify(EditManager.state.orijinalVeri);
            EditManager.state.hasUnsavedChanges = (guncelStr !== orijStr);
        } else {
            EditManager.state.hasUnsavedChanges = true;
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
        this.toastGoster("Değişiklikler geri alındı.");
    },

    async kaydet() {
        if (!EditManager.state.hasUnsavedChanges || !supabaseClient) return;

        const saveBtn = document.getElementById('edit-save-btn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Kaydediliyor...';
        }

        try {
            const { error } = await supabaseClient
                .from('profiles')
                .update({
                    front_data: kartVerisi.front_data,
                    links: kartVerisi.links,
                    tops: kartVerisi.tops,
                    trophies: kartVerisi.trophies,
                    widgets: kartVerisi.widgets,
                    working_on: kartVerisi.working_on,
                    theme_config: kartVerisi.theme_config
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
        this.metinDuzenlemeKur('profileBio', 'aciklama', 170, true);
        this.tagYonetimiKur();
    },

    metinDuzenlemeKur(elementId, fieldName, maxLen, isTextarea = false) {
        const el = document.getElementById(elementId);
        if (!el) return;

        el.classList.add('editable-hover');
        el.title = "Düzenlemek için tıkla";

        el.onclick = (e) => {
            if (el.querySelector('input, textarea')) return;

            const front = kartVerisi.front_data || {};
            const guncelDeger = (fieldName === 'gorunen_isim')
                ? (front.gorunen_isim || kartVerisi.kullanici_adi || '')
                : (front[fieldName] || '');

            let inputHtml = '';
            if (isTextarea) {
                inputHtml = `
                    <div class="edit-inline-textarea-wrap">
                        <textarea class="edit-inline-textarea" maxlength="${maxLen}" placeholder="Bir bio yaz...">${EditManager.escapeHtml(guncelDeger)}</textarea>
                        <span class="bio-counter">${guncelDeger.length}/${maxLen}</span>
                    </div>
                `;
            } else {
                inputHtml = `<input type="text" class="edit-inline-input" maxlength="${maxLen}" value="${EditManager.escapeHtml(guncelDeger)}" placeholder="${elementId === 'profileTitle' ? 'Unvan ekle...' : 'İsim gir...'}">`;
            }

            el.innerHTML = inputHtml;
            const inputEl = el.querySelector('input, textarea');
            if (!inputEl) return;

            inputEl.focus();

            if (isTextarea) {
                inputEl.addEventListener('input', () => {
                    const counter = el.querySelector('.bio-counter');
                    if (counter) counter.textContent = `${inputEl.value.length}/${maxLen}`;
                });
            }

            const kaydetVeKapat = () => {
                const yeniDeger = inputEl.value.trim();
                if (!kartVerisi.front_data) kartVerisi.front_data = {};

                if (fieldName === 'gorunen_isim') {
                    kartVerisi.front_data.gorunen_isim = yeniDeger;
                    el.textContent = yeniDeger || `@${kartVerisi.kullanici_adi}`;
                } else {
                    kartVerisi.front_data[fieldName] = yeniDeger;
                    el.textContent = yeniDeger || (fieldName === 'unvan' ? 'Nook Üyesi' : 'Kendi dijital köşesini inşa ediyor.');
                }

                EditManager.Global.degisiklikYapildi();
            };

            inputEl.addEventListener('blur', kaydetVeKapat);
            inputEl.addEventListener('keydown', (evt) => {
                if (evt.key === 'Enter' && !isTextarea) {
                    evt.preventDefault();
                    inputEl.blur();
                }
            });
        };
    },

    tagYonetimiKur() {
        const tagsGrid = document.getElementById('tagsGrid');
        if (!tagsGrid) return;

        // Tag silme butonlarını bağla
        tagsGrid.querySelectorAll('.tag-pill').forEach((pill, idx) => {
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
                const yeniTag = prompt("Yeni etiket girin (Maks. 15 karakter):");
                if (yeniTag && yeniTag.trim()) {
                    const temiz = yeniTag.trim().slice(0, 15);
                    if (!kartVerisi.front_data) kartVerisi.front_data = {};
                    if (!Array.isArray(kartVerisi.front_data.tags)) kartVerisi.front_data.tags = [];
                    kartVerisi.front_data.tags.push(temiz);
                    RenderEngine.vitrinCiz(kartVerisi);
                    EditManager.Vitrin.init();
                    EditManager.Global.degisiklikYapildi();
                }
            });
            tagsGrid.appendChild(addPill);
        }
    }
};
// #endregion

// #region 5: ARKA YÜZ PANEL DÜZENLEMELERİ (BACK VIEWS EDIT)
EditManager.BackViews = {
    init() {
        this.linksDuzenlemeKur();
        this.topsDuzenlemeKur();
        this.workingOnDuzenlemeKur();
        this.widgetsDuzenlemeKur();
    },

    linksDuzenlemeKur() {
        const panel = document.getElementById('view-links');
        if (!panel) return;

        const scrollWrap = panel.querySelector('.scrollable-fade');
        if (!scrollWrap) return;

        // En üste "+ Yeni Bağlantı Ekle" butonu koy
        if (!panel.querySelector('.links-add-btn')) {
            const header = panel.querySelector('.view-header');
            const addBtn = document.createElement('button');
            addBtn.className = 'view-add-btn links-add-btn';
            addBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Yeni Bağlantı Ekle</span>
            `;

            addBtn.addEventListener('click', () => {
                let form = scrollWrap.querySelector('.link-add-form');
                if (form) {
                    form.remove();
                    return;
                }

                form = document.createElement('div');
                form.className = 'inline-form-card link-add-form';
                form.innerHTML = `
                    <h4 class="inline-form-title">Yeni Bağlantı</h4>
                    <input type="text" class="inline-form-input link-title-input" placeholder="Başlık (Örn: GitHub, Spotify)">
                    <input type="url" class="inline-form-input link-url-input" placeholder="https://...">
                    <div class="inline-form-actions">
                        <button type="button" class="form-btn-sm form-btn-cancel link-cancel-btn">İptal</button>
                        <button type="button" class="form-btn-sm form-btn-submit link-save-btn">Ekle</button>
                    </div>
                `;

                scrollWrap.insertBefore(form, scrollWrap.firstChild);

                form.querySelector('.link-cancel-btn').onclick = () => form.remove();
                form.querySelector('.link-save-btn').onclick = () => {
                    const baslik = form.querySelector('.link-title-input').value.trim();
                    const url = form.querySelector('.link-url-input').value.trim();
                    if (!baslik || !url) {
                        alert("Lütfen başlık ve URL girin!");
                        return;
                    }

                    if (!Array.isArray(kartVerisi.links)) kartVerisi.links = [];
                    kartVerisi.links.push({
                        baslik,
                        url,
                        renk: '#3b5bdb',
                        ikon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>'
                    });

                    RenderEngine.menuCiz(kartVerisi);
                    RenderEngine.altEkranlariCiz(kartVerisi);
                    EditManager.BackViews.init();
                    EditManager.Global.degisiklikYapildi();
                };
            });

            if (header) header.after(addBtn);
        }

        // Mevcut link satırlarına silme butonu koy
        scrollWrap.querySelectorAll('.link-item-row').forEach((row, idx) => {
            if (!row.querySelector('.item-delete-btn')) {
                const delBtn = document.createElement('button');
                delBtn.className = 'item-delete-btn';
                delBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                `;
                delBtn.title = "Bağlantıyı Sil";
                delBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    kartVerisi.links.splice(idx, 1);
                    RenderEngine.menuCiz(kartVerisi);
                    RenderEngine.altEkranlariCiz(kartVerisi);
                    EditManager.BackViews.init();
                    EditManager.Global.degisiklikYapildi();
                });
                row.appendChild(delBtn);
            }
        });
    },

    topsDuzenlemeKur() {
        const panel = document.getElementById('view-tops');
        if (!panel) return;

        const titleEl = panel.querySelector('.view-title');
        if (titleEl && !titleEl.classList.contains('editable-hover')) {
            titleEl.classList.add('editable-hover');
            titleEl.title = "Kategori adını değiştirmek için tıkla";
            titleEl.onclick = () => {
                const yeniAd = prompt("Yeni kategori adı (Örn: Favorite Movies, Anime, Games):", titleEl.textContent);
                if (yeniAd && yeniAd.trim()) {
                    if (!kartVerisi.tops) kartVerisi.tops = {};
                    kartVerisi.tops.kategori = yeniAd.trim();
                    titleEl.textContent = yeniAd.trim();
                    RenderEngine.menuCiz(kartVerisi);
                    EditManager.Global.degisiklikYapildi();
                }
            };
        }

        // En üste "+ Yeni Öğe Ekle" butonu koy
        const scrollWrap = panel.querySelector('.scrollable-fade');
        if (scrollWrap && !panel.querySelector('.tops-add-btn')) {
            const header = panel.querySelector('.view-header');
            const addBtn = document.createElement('button');
            addBtn.className = 'view-add-btn tops-add-btn';
            addBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Yeni Öğe Ekle</span>
            `;

            addBtn.addEventListener('click', () => {
                let form = scrollWrap.querySelector('.top-add-form');
                if (form) {
                    form.remove();
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

                scrollWrap.insertBefore(form, scrollWrap.firstChild);

                form.querySelector('.top-cancel-btn').onclick = () => form.remove();
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
            });

            if (header) header.after(addBtn);
        }

        // Tops öğelerine silme butonu ekle
        if (scrollWrap) {
            scrollWrap.querySelectorAll('.top-item-card').forEach((card, idx) => {
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
                            RenderEngine.menuCiz(kartVerisi);
                            RenderEngine.altEkranlariCiz(kartVerisi);
                            EditManager.BackViews.init();
                            EditManager.Global.degisiklikYapildi();
                        }
                    });
                    card.appendChild(delBtn);
                }
            });
        }
    },

    workingOnDuzenlemeKur() {
        const panel = document.getElementById('view-working-on');
        if (!panel) return;

        const textEl = panel.querySelector('.status-text');
        if (textEl && !textEl.classList.contains('editable-hover')) {
            textEl.classList.add('editable-hover');
            textEl.title = "Durumunuzu güncellemek için tıklayın";
            textEl.onclick = () => {
                const yeniMetin = prompt("Şu anda ne üzerinde çalışıyorsunuz?", textEl.textContent);
                if (yeniMetin !== null) {
                    if (!kartVerisi.working_on) kartVerisi.working_on = {};
                    kartVerisi.working_on.metin = yeniMetin.trim() || 'Building on Nook.';
                    textEl.textContent = kartVerisi.working_on.metin;
                    RenderEngine.menuCiz(kartVerisi);
                    EditManager.Global.degisiklikYapildi();
                }
            };
        }
    },

    widgetsDuzenlemeKur() {
        const panel = document.getElementById('view-widgets');
        if (!panel) return;

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
                const yeniKullanici = prompt("Yeni Monkeytype kullanıcı adı:", mtCard.dataset.username || '');
                if (yeniKullanici && yeniKullanici.trim()) {
                    const temiz = yeniKullanici.trim();
                    const w = (kartVerisi.widgets || []).find(item => item.tur === 'monkeytype');
                    if (w) {
                        if (!w.ayarlar) w.ayarlar = {};
                        w.ayarlar.kullanici = temiz;
                    }
                    RenderEngine.altEkranlariCiz(kartVerisi);
                    EditManager.BackViews.init();
                    if (typeof canliMonkeytypeVerisiCek === 'function') {
                        canliMonkeytypeVerisiCek(temiz).then(skorlar => {
                            kartVerisi.canli_monkeytype = skorlar;
                            RenderEngine.monkeytypeGuncelle(skorlar);
                        });
                    }
                    EditManager.Global.degisiklikYapildi();
                }
            };

            actionsWrap.querySelector('.mt-remove-btn').onclick = () => {
                kartVerisi.widgets = (kartVerisi.widgets || []).filter(item => item.tur !== 'monkeytype');
                RenderEngine.menuCiz(kartVerisi);
                RenderEngine.altEkranlariCiz(kartVerisi);
                EditManager.BackViews.init();
                EditManager.Global.degisiklikYapildi();
            };

            mtCard.appendChild(actionsWrap);
        } else if (!mtCard && !panel.querySelector('.widget-add-btn')) {
            // Widget yoksa "+ Monkeytype Widget'ı Ekle" butonu koy
            const addBtn = document.createElement('button');
            addBtn.className = 'view-add-btn widget-add-btn';
            addBtn.innerHTML = `<span>+ Monkeytype Widget'ı Ekle</span>`;
            addBtn.onclick = () => {
                const mtKullanici = prompt("Monkeytype kullanıcı adınızı girin:");
                if (mtKullanici && mtKullanici.trim()) {
                    if (!Array.isArray(kartVerisi.widgets)) kartVerisi.widgets = [];
                    kartVerisi.widgets.push({
                        tur: 'monkeytype',
                        ayarlar: { kullanici: mtKullanici.trim() }
                    });
                    RenderEngine.menuCiz(kartVerisi);
                    RenderEngine.altEkranlariCiz(kartVerisi);
                    EditManager.BackViews.init();
                    if (typeof canliMonkeytypeVerisiCek === 'function') {
                        canliMonkeytypeVerisiCek(mtKullanici.trim()).then(skorlar => {
                            kartVerisi.canli_monkeytype = skorlar;
                            RenderEngine.monkeytypeGuncelle(skorlar);
                        });
                    }
                    EditManager.Global.degisiklikYapildi();
                }
            };
            const scrollWrap = panel.querySelector('.scrollable-fade');
            if (scrollWrap) scrollWrap.appendChild(addBtn);
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
            if (!Array.isArray(kartVerisi.links) || kartVerisi.links.length === 0) {
                kartVerisi.links = [
                    {
                        baslik: 'GitHub',
                        url: 'https://github.com',
                        renk: '#24292e',
                        ikon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>'
                    }
                ];
                EditManager.Global.degisiklikYapildi();
            }
        } else if (catId === 'tops') {
            if (!kartVerisi.tops || !Array.isArray(kartVerisi.tops.ogeler) || kartVerisi.tops.ogeler.length === 0) {
                kartVerisi.tops = {
                    kategori: kartVerisi.tops?.kategori || 'Favorite Movies',
                    harici_link: { baslik: 'Letterboxd →', url: 'https://letterboxd.com' },
                    ogeler: [
                        {
                            baslik: 'Örnek Başlık',
                            aciklama: 'Kısa not veya açıklama',
                            afis_url: ''
                        }
                    ]
                };
                EditManager.Global.degisiklikYapildi();
            }
        } else if (catId === 'widgets') {
            if (!Array.isArray(kartVerisi.widgets) || kartVerisi.widgets.length === 0) {
                const defaultUser = kartVerisi.kullanici_adi || '';
                kartVerisi.widgets = [
                    {
                        tur: 'monkeytype',
                        ayarlar: { kullanici: defaultUser }
                    }
                ];
                if (defaultUser && typeof canliMonkeytypeVerisiCek === 'function') {
                    canliMonkeytypeVerisiCek(defaultUser).then(skorlar => {
                        if (skorlar) {
                            kartVerisi.canli_monkeytype = skorlar;
                            RenderEngine.monkeytypeGuncelle(skorlar);
                        }
                    });
                }
                EditManager.Global.degisiklikYapildi();
            }
        } else if (catId === 'working-on') {
            if (!kartVerisi.working_on || !kartVerisi.working_on.metin) {
                kartVerisi.working_on = {
                    metin: 'Building on Nook.'
                };
                EditManager.Global.degisiklikYapildi();
            }
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
