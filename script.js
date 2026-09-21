/**
 * NOOK v2 — 5:7 Monolithic Card & Drill-Down Navigation Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Elementleri
    const cardContainer = document.getElementById('cardContainer');
    const nookCard = document.getElementById('nookCard');
    const flipToBackBtn = document.getElementById('flipToBackBtn');
    const flipToFrontBtn = document.getElementById('flipToFrontBtn');
    
    const viewMenu = document.getElementById('viewMenu');
    const navButtons = document.querySelectorAll('.nav-item-btn');
    const backButtons = document.querySelectorAll('.back-btn[data-action="back"]');
    const detailViews = document.querySelectorAll('.view-detail');

    let isFlipped = false;
    let activeDetailView = null;

    // 2. 180° Flip Mekanizması
    function setFlipped(flipped) {
        isFlipped = flipped;
        if (isFlipped) {
            cardContainer.classList.add('is-flipped');
        } else {
            cardContainer.classList.remove('is-flipped');
            // Ön yüze dönüldüğünde alt ekranları sıfırla ve ana menüye dön
            resetToMainMenu();
        }
    }

    if (flipToBackBtn) {
        flipToBackBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setFlipped(true);
        });
    }

    if (flipToFrontBtn) {
        flipToFrontBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setFlipped(false);
        });
    }

    // 3. Drill-Down Navigasyon Yöneticisi
    function openDetailView(targetId) {
        const targetView = document.getElementById(`view-${targetId}`);
        if (!targetView) return;

        // Ana menüyü sola kaydır
        viewMenu.classList.add('slide-left');
        viewMenu.classList.remove('active');

        // Hedef görünümü aktif et
        targetView.classList.add('active');
        activeDetailView = targetView;
    }

    function resetToMainMenu() {
        if (activeDetailView) {
            activeDetailView.classList.remove('active');
            activeDetailView = null;
        }
        viewMenu.classList.remove('slide-left');
        viewMenu.classList.add('active');
    }

    // Menü butonlarına tıklama
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            if (target) {
                openDetailView(target);
            }
        });
    });

    // Geri butonlarına tıklama
    backButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            resetToMainMenu();
        });
    });

    // Klavye Kısayolları (ESC: Geri dön veya ön yüze çevir)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (activeDetailView) {
                resetToMainMenu();
            } else if (isFlipped) {
                setFlipped(false);
            }
        }
    });

    // 4. 3D Tilt & Yumuşak Lerp Fare Takibi
    let mouseX = 0;
    let mouseY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;
    const maxTilt = 12; // Maksimum açı derecesi
    const lerpSpeed = 0.08;

    window.addEventListener('mousemove', (e) => {
        const { innerWidth, innerHeight } = window;
        // Normalize: -1 ile 1 arası
        mouseX = (e.clientX / innerWidth) * 2 - 1;
        mouseY = (e.clientY / innerHeight) * 2 - 1;
    });

    window.addEventListener('mouseleave', () => {
        mouseX = 0;
        mouseY = 0;
    });

    function updateTilt() {
        // İstenen hedef açıları
        const targetTiltX = -mouseY * maxTilt;
        const targetTiltY = mouseX * maxTilt;

        // Yumuşak geçiş (Linear Interpolation)
        currentTiltX += (targetTiltX - currentTiltX) * lerpSpeed;
        currentTiltY += (targetTiltY - currentTiltY) * lerpSpeed;

        if (cardContainer) {
            // Eğer kart arkaya çevrildiyse tilt açısını hafiflet
            const multiplier = isFlipped ? 0.35 : 1;
            cardContainer.style.transform = `rotateX(${currentTiltX * multiplier}deg) rotateY(${currentTiltY * multiplier}deg)`;
        }

        requestAnimationFrame(updateTilt);
    }

    requestAnimationFrame(updateTilt);
});
