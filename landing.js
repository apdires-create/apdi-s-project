// #region 4: LANDING PAGE DİNAMİK PROFİL KARTI MİMARİSİ
(function () {
    const NOOK_PROFILES = [
        {name: "Luna", role: "Professional Backlog Ignorer", bio: "Currently pretending I'll finish Hollow Knight before buying another indie game. My Steam wishlist has become its own ecosystem.", links: ["Steam", "Backloggd", "GitHub"], avatar: "linear-gradient(160deg,#7fdcff,#5b6bff)", accent: "#7fdcff"},
        {name: "Kite", role: "Chronic Tab Hoarder", bio: "137 browser tabs open, 4 of them are things I actually need. The rest are just... company, I guess.", links: ["GitHub", "Letterboxd"], avatar: "linear-gradient(160deg,#ffb26b,#f2795c)", accent: "#ffb26b"},
        {name: "Mira", role: "Part-Time Main Character", bio: "Ranks anime openings more seriously than actual life decisions. Currently three rewatches deep into Frieren.", links: ["AniList", "Spotify", "Twitch"], avatar: "linear-gradient(160deg,#c98bff,#7a5cff)", accent: "#c98bff"},
        {name: "Dex", role: "Undefeated at Losing Save Files", bio: "Lost 40 hours of a Stardew Valley save to a coffee spill. Rebuilt the farm out of spite. It's better now.", links: ["Steam", "itch.io", "GitHub"], avatar: "linear-gradient(160deg,#8fe38f,#3fae6a)", accent: "#8fe38f"},
        {name: "Sable", role: "Freelance Vibes Consultant", bio: "Designs interfaces, then spends four hours picking the border-radius. It's a whole personality now.", links: ["Dribbble", "Behance", "GitHub"], avatar: "linear-gradient(160deg,#ff9ecf,#c15cff)", accent: "#ff9ecf"},
        {name: "Rook", role: "Amateur Speedrunner, Professional Rage Quitter", bio: "PB is 12:04. Personal worst is throwing the controller across the room at 11:58. Working on both.", links: ["Twitch", "YouTube"], avatar: "linear-gradient(160deg,#ffd166,#f2a93b)", accent: "#ffd166"},
        {name: "Wren", role: "Self-Appointed Playlist Curator", bio: "Makes a new playlist for every mood, every season, and one specifically for 'walking home in the rain thinking about anime.'", links: ["Spotify", "Letterboxd"], avatar: "linear-gradient(160deg,#6be7d4,#3f9ea8)", accent: "#6be7d4"},
        {name: "Nyx", role: "Full-Time Manga Chapter Refresher", bio: "Checks for new chapters every day at 9am like it's a job. Technically it kind of is now.", links: ["AniList", "GitHub", "Bionluk"], avatar: "linear-gradient(160deg,#a29bfe,#6c5ce7)", accent: "#a29bfe"},
        {name: "Ash", role: "Certified Overthinker of Character Builds", bio: "Spent longer theorycrafting a Baldur's Gate 3 party comp than actually playing the game. No regrets.", links: ["Steam", "GitHub"], avatar: "linear-gradient(160deg,#ff8a65,#d84315)", accent: "#ff8a65"},
        {name: "Yuki", role: "Backyard Astronomer, Indoor Cat", bio: "Owns a telescope. Has used it twice. Mostly just likes knowing it's there, like a very expensive houseplant.", links: ["GitHub", "Letterboxd", "Spotify"], avatar: "linear-gradient(160deg,#89c4f4,#3468c0)", accent: "#89c4f4"}
    ];

    const STORAGE_PREFIX = "nook_last_profile__";

    function pickRandomIndex(poolLength, excludeIndex) {
        if (poolLength <= 1) return 0;
        let index;
        do { index = Math.floor(Math.random() * poolLength); } while (index === excludeIndex);
        return index;
    }

    function getLastIndex(key) {
        try {
            const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
            return raw === null ? -1 : parseInt(raw, 10);
        } catch (e) { return -1; }
    }

    function setLastIndex(key, index) {
        try { window.localStorage.setItem(STORAGE_PREFIX + key, String(index)); } catch (e) {}
    }

    function initials(name) { return name.trim().charAt(0).toUpperCase(); }

    function render(container, profile) {
    // Profilin kendi accent rengi yoksa Nook'un orijinal kehribar rengini kullanır
    const liveAccent = profile.accent || "var(--amber-2)";
    container.style.setProperty('--nook-accent-live', liveAccent);

    container.innerHTML = `
    <div class="nook-card__body">
        <div class="nook-card__avatar" style="background:${profile.avatar}">
        ${initials(profile.name)}
        </div>
        <div class="nook-card__name">${profile.name}</div>
        
        <!-- Ünvan rengi dinamik değişkenden çekiliyor ve başına ikonik nokta eklendi -->
        <div class="nook-card__role" style="color: var(--nook-accent-live);">
            <span style="opacity: 0.5; margin-right: 4px;">•</span>${profile.role}
        </div>
        
        <div class="nook-card__bio">${profile.bio}</div>
        <div class="nook-card__links">
        ${profile.links.map(l => `<span class="nook-card__chip">${l}</span>`).join("")}
        </div>
    </div>
    `;
}

    function mount(container) {
        const key = container.dataset.nookKey || "global";
        const lastIndex = getLastIndex(key);
        const nextIndex = pickRandomIndex(NOOK_PROFILES.length, lastIndex);
        setLastIndex(key, nextIndex);
        render(container, NOOK_PROFILES[nextIndex]);
    }

    function mountAll() { document.querySelectorAll("[data-nook-card]").forEach(mount); }

    window.NookProfileCard = { mountAll, mount, profiles: NOOK_PROFILES };
    document.addEventListener("DOMContentLoaded", mountAll);
})();
// #endregion
// #region 5: LANDING PAGE 3D FLIP KONTROLÜ
document.addEventListener('DOMContentLoaded', () => {
    const flipCardInner = document.getElementById('hero-flip-card');
    const visualWrapper = document.querySelector('.tilted-visual-wrapper');
    
    // Tetikleyici Butonlar
    const btnLogin = document.getElementById('hero-login-btn'); 
    const btnStart = document.getElementById('hero-start-btn'); // Hero sol taraftaki start butonu
    const btnFrontCard = document.getElementById('flip-front-trigger'); // Profil kartının kendisine tıklamak
    const btnCloseBack = document.getElementById('flip-back-btn'); // Formun içindeki X butonu

    // Döndürme ve Düzleştirme Fonksiyonu
    const toggleFlip = (e) => {
        if(e) e.stopPropagation();
        
        // İç kartı 180 derece çevir
        if(flipCardInner) flipCardInner.classList.toggle('is-flipped');
        
        // Dış kasayı düzleştir ve büyüt
        if(visualWrapper) visualWrapper.classList.toggle('is-flat');
    };

    // Dinleyicileri Ekle
    if(btnLogin) btnLogin.addEventListener('click', toggleFlip);
    if(btnStart) btnStart.addEventListener('click', toggleFlip);
    if(btnFrontCard) btnFrontCard.addEventListener('click', toggleFlip);
    if(btnCloseBack) btnCloseBack.addEventListener('click', toggleFlip);
});
// #endregion
