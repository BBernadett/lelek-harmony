/* ============================================
   LÉLEK HARMONY – script.js
   ============================================ */

// ============================================
// PROMO BANNER — beállítások: js/config.js
// ============================================
(function initPromoBanner() {
  if (typeof PROMO_CONFIG === 'undefined' || !PROMO_CONFIG.enabled) return;

  const banner   = document.getElementById('promoBanner');
  const textEl   = banner && banner.querySelector('.promo-banner__text');
  const ctaEl    = banner && banner.querySelector('.promo-banner__cta');
  if (!banner || !textEl) return;

  const storageKey = `lh_promo_${PROMO_CONFIG.id}`;
  if (localStorage.getItem(storageKey) === 'closed') return;

  // Szöveg és CTA beállítása config alapján
  textEl.innerHTML = PROMO_CONFIG.text +
    (PROMO_CONFIG.cta
      ? ` <a href="${PROMO_CONFIG.cta.href}" class="promo-banner__cta">${PROMO_CONFIG.cta.label}</a>`
      : '');
  if (ctaEl) ctaEl.remove();

  banner.classList.add('promo-banner--visible');

  const headerEl = document.getElementById('header');

  function applyOffset() {
    if (headerEl) headerEl.style.top = banner.offsetHeight + 'px';
  }
  applyOffset();
  window.addEventListener('resize', applyOffset, { passive: true });

  document.getElementById('promoBannerClose').addEventListener('click', () => {
    banner.style.height = banner.offsetHeight + 'px';
    requestAnimationFrame(() => banner.classList.add('promo-banner--closing'));
    setTimeout(() => {
      banner.style.display = 'none';
      if (headerEl) headerEl.style.top = '';
      localStorage.setItem(storageKey, 'closed');
      window.removeEventListener('resize', applyOffset);
    }, 370);
  });
})();

// --- Sticky header ---
const header = document.getElementById("header");
window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 40);
}, { passive: true });

// --- Mobile nav ---
const navToggle = document.getElementById("navToggle");
const navMenu   = document.getElementById("navMenu");

navToggle.addEventListener("click", () => {
  const open = navMenu.classList.toggle("open");
  navToggle.classList.toggle("open", open);
  navToggle.setAttribute("aria-label", open ? "Menü bezárása" : "Menü megnyitása");
  document.body.style.overflow = open ? "hidden" : "";
});

navMenu.querySelectorAll(".nav__link").forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("open");
    navToggle.classList.remove("open");
    document.body.style.overflow = "";
  });
});

document.addEventListener("click", (e) => {
  if (
    navMenu.classList.contains("open") &&
    !navMenu.contains(e.target) &&
    !navToggle.contains(e.target)
  ) {
    navMenu.classList.remove("open");
    navToggle.classList.remove("open");
    document.body.style.overflow = "";
  }
});

// --- Smooth scroll ---
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const target = document.querySelector(this.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth" });
  });
});

// --- Scroll reveal (all variants) ---
const revealSelectors = ".reveal, .reveal-left, .reveal-right, .reveal-scale";
const revealEls = document.querySelectorAll(revealSelectors);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const siblings = [
      ...entry.target.parentElement.querySelectorAll(
        `${revealSelectors}:not(.visible)`
      ),
    ];
    const delay = Math.max(0, siblings.indexOf(entry.target)) * 80;
    setTimeout(() => entry.target.classList.add("visible"), delay);
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

revealEls.forEach((el) => revealObserver.observe(el));

// ============================================
// GALLERY LIGHTBOX
// ============================================
const galleryItems  = document.querySelectorAll(".gallery__item");
const lightbox      = document.getElementById("lightbox");
const lightboxImg   = document.getElementById("lightboxImg");
const lightboxCap   = document.getElementById("lightboxCaption");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxPrev  = document.getElementById("lightboxPrev");
const lightboxNext  = document.getElementById("lightboxNext");

let currentIndex = 0;

function openLightbox(index) {
  const total = galleryItems.length;
  currentIndex = ((index % total) + total) % total;

  // Forrás és felirat közvetlenül a DOM-ból
  const item  = galleryItems[currentIndex];
  const img   = item.querySelector(".gallery__img");
  const label = item.querySelector(".gallery__label");

  lightboxImg.src = img ? img.src : "";
  lightboxImg.alt = img ? img.alt : "";
  lightboxCap.textContent = label ? label.textContent : "";
  lightbox.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.remove("open");
  document.body.style.overflow = "";
}

galleryItems.forEach((item) => {
  item.addEventListener("click", () => openLightbox(Number(item.dataset.index)));
});

lightboxClose.addEventListener("click", closeLightbox);
lightboxPrev.addEventListener("click", (e) => { e.stopPropagation(); openLightbox(currentIndex - 1); });
lightboxNext.addEventListener("click", (e) => { e.stopPropagation(); openLightbox(currentIndex + 1); });

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("open")) return;
  if (e.key === "Escape")     closeLightbox();
  if (e.key === "ArrowLeft")  openLightbox(currentIndex - 1);
  if (e.key === "ArrowRight") openLightbox(currentIndex + 1);
});

// Touch swipe support
let touchStartX = 0;
lightbox.addEventListener("touchstart", (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
lightbox.addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) openLightbox(dx < 0 ? currentIndex + 1 : currentIndex - 1);
});

// ============================================
// TESTIMONIALS CAROUSEL
// ============================================
const track  = document.getElementById("testimonialsTrack");
const dotsWrap = document.getElementById("testimonialsDots");

if (track && dotsWrap) {
  const cards       = track.querySelectorAll(".testimonial-card");
  let perView       = getPerView();
  let current       = 0;
  let autoTimer     = null;

  function getPerView() {
    if (window.innerWidth <= 680) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  }

  function totalSlides() {
    return Math.ceil(cards.length / perView);
  }

  function buildDots() {
    dotsWrap.innerHTML = "";
    for (let i = 0; i < totalSlides(); i++) {
      const btn = document.createElement("button");
      btn.className = "testimonials__dot" + (i === current ? " active" : "");
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-label", `${i + 1}. vélemény`);
      btn.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(btn);
    }
  }

  function goTo(index) {
    current = ((index % totalSlides()) + totalSlides()) % totalSlides();
    const cardWidth   = cards[0].getBoundingClientRect().width;
    const gap         = 24;
    const offset      = current * perView * (cardWidth + gap);
    track.style.transform = `translateX(-${offset}px)`;
    dotsWrap.querySelectorAll(".testimonials__dot").forEach((d, i) => {
      d.classList.toggle("active", i === current);
    });
  }

  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 4500);
  }

  function stopAuto() { clearInterval(autoTimer); }

  buildDots();
  startAuto();

  track.addEventListener("mouseenter", stopAuto);
  track.addEventListener("mouseleave", startAuto);

  // Touch swipe
  let swipeStartX = 0;
  track.addEventListener("touchstart", (e) => {
    swipeStartX = e.changedTouches[0].clientX;
    stopAuto();
  }, { passive: true });
  track.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - swipeStartX;
    if (Math.abs(dx) > 40) goTo(dx < 0 ? current + 1 : current - 1);
    startAuto();
  });

  window.addEventListener("resize", () => {
    const newPer = getPerView();
    if (newPer !== perView) {
      perView = newPer;
      current = 0;
      buildDots();
      goTo(0);
    }
  });
}
