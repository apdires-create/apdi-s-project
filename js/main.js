// #region 1: UYGULAMA BAŞLATICI (BOOTSTRAP)
document.addEventListener('DOMContentLoaded', () => {
    // 1. Veri ile arayüzü çiz
    if (typeof RenderEngine !== 'undefined' && typeof kartVerisi !== 'undefined') {
        RenderEngine.vitrinCiz(kartVerisi);
        RenderEngine.menuCiz(kartVerisi);
        RenderEngine.altEkranlariCiz(kartVerisi);
    }

    // 2. Navigasyon ve Flip yöneticisini başlat
    if (typeof Router !== 'undefined') {
        Router.init();
    }

    // 3. 3D Tilt fare takip motorunu başlat
    if (typeof TiltEngine !== 'undefined') {
        TiltEngine.init();
    }
});
// #endregion
