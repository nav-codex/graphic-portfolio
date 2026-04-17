'use strict';

// ─── UTILITIES ───────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

// ─── CUSTOM CURSOR ───────────────────────────────────
const cursor         = document.getElementById('cursor');
const cursorFollower = document.getElementById('cursorFollower');
const cursorLabel    = document.getElementById('cursorLabel');

let mouseX = 0, mouseY = 0;
let followerX = 0, followerY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  // Main cursor — instant
  cursor.style.left = mouseX + 'px';
  cursor.style.top  = mouseY + 'px';
  // Label follows instantly too
  cursorLabel.style.left = (mouseX + 20) + 'px';
  cursorLabel.style.top  = mouseY + 'px';
});

// Follower — lerped (smooth lag)
function animateCursor() {
  followerX = lerp(followerX, mouseX, 0.12);
  followerY = lerp(followerY, mouseY, 0.12);
  cursorFollower.style.left = followerX + 'px';
  cursorFollower.style.top  = followerY + 'px';
  requestAnimationFrame(animateCursor);
}
animateCursor();

// Hover state for interactive elements
document.querySelectorAll('a, button, .card').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

// Hide cursor when out of window
document.addEventListener('mouseleave', () => {
  cursor.style.opacity = '0';
  cursorFollower.style.opacity = '0';
});
document.addEventListener('mouseenter', () => {
  cursor.style.opacity = '1';
  cursorFollower.style.opacity = '1';
});

// ─── GALLERY — GLITCH HOVER + LABEL ──────────────────
const gallery = document.getElementById('gallery');
const cards   = document.querySelectorAll('.card');

let glitchTimers = {};

cards.forEach((card) => {
  const title = card.dataset.title || '';
  let isHovered = false;

  card.addEventListener('mouseenter', () => {
    isHovered = true;
    cursorLabel.textContent = title;
    cursorLabel.classList.add('visible');
    startGlitch(card);
  });

  card.addEventListener('mouseleave', () => {
    isHovered = false;
    cursorLabel.classList.remove('visible');
    stopGlitch(card);
  });
});

function startGlitch(card) {
  const id = card.id;
  if (glitchTimers[id]) return;

  function trigger() {
    if (!card.matches(':hover')) { delete glitchTimers[id]; return; }
    card.classList.add('glitch-active');
    const flashDuration = 80 + Math.random() * 80;
    setTimeout(() => {
      card.classList.remove('glitch-active');
      const nextDelay = 600 + Math.random() * 1400;
      glitchTimers[id] = setTimeout(trigger, nextDelay);
    }, flashDuration);
  }

  glitchTimers[id] = setTimeout(trigger, 200 + Math.random() * 600);
}

function stopGlitch(card) {
  const id = card.id;
  clearTimeout(glitchTimers[id]);
  delete glitchTimers[id];
  card.classList.remove('glitch-active');
}

// ─── CARD TILT (3D mouse tracking) ───────────────────
cards.forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect   = card.getBoundingClientRect();
    const cx     = rect.left + rect.width / 2;
    const cy     = rect.top  + rect.height / 2;
    const dx     = (e.clientX - cx) / (rect.width  / 2);
    const dy     = (e.clientY - cy) / (rect.height / 2);
    const rotX   = clamp(dy * -6, -6, 6);
    const rotY   = clamp(dx *  8, -8, 8);
    card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.03)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease, opacity 0.4s ease, filter 0.4s ease';
  });

  card.addEventListener('mouseenter', () => {
    card.style.transition = 'transform 0.1s ease, box-shadow 0.4s ease';
  });
});

// ─── PARALLAX — PROFILE IMAGE ────────────────────────
const parallaxEl = document.getElementById('parallaxImg');

if (parallaxEl) {
  let lastScrollY = 0;
  let rafPending  = false;

  function updateParallax() {
    rafPending = false;
    const section = parallaxEl.closest('.architect');
    if (!section) return;
    const rect   = section.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const vhalf  = window.innerHeight / 2;
    const offset = (center - vhalf) * 0.18;
    parallaxEl.style.transform = `translateY(${clamp(offset, -50, 50)}px)`;
  }

  window.addEventListener('scroll', () => {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(updateParallax);
    }
  }, { passive: true });
}

// ─── SMOOTH SCROLL — NAV LINKS ───────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ─── REVEAL ON SCROLL (Intersection Observer) ─────────
const revealEls = document.querySelectorAll(
  '.vault-header, .card, .architect-inner, .comms-eyebrow, .comms-ig, .comms-email'
);

revealEls.forEach(el => el.classList.add('reveal'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger cards
      const delay = entry.target.classList.contains('card') ? i * 60 : 0;
      setTimeout(() => entry.target.classList.add('in-view'), delay);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

revealEls.forEach(el => observer.observe(el));

// ─── NAV — SCROLL SHRINK ──────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 80) {
    nav.style.padding = '0.9rem 3rem';
    nav.style.backdropFilter = 'blur(12px)';
  } else {
    nav.style.padding = '1.4rem 3rem';
    nav.style.backdropFilter = 'none';
  }
}, { passive: true });

// ─── HERO TITLE — micro-tilt on mouse ────────────────
const heroTitle = document.getElementById('heroTitle');
if (heroTitle) {
  document.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;
    heroTitle.style.transform = `perspective(1200px) rotateX(${dy * -1.5}deg) rotateY(${dx * 1.5}deg)`;
  });
}

// ─── INSTAGRAM LINK — cursor label ───────────────────
const igLink = document.getElementById('igLink');
if (igLink) {
  igLink.addEventListener('mouseenter', () => {
    cursorLabel.textContent = '↗ open instagram';
    cursorLabel.classList.add('visible');
  });
  igLink.addEventListener('mouseleave', () => {
    cursorLabel.classList.remove('visible');
  });
}

// ─── CONSOLE SIGNATURE ───────────────────────────────
console.log(
  '%cDESIGNCORE.NAV',
  'color: #ff2d78; font-size: 2rem; font-weight: 900; letter-spacing: 0.1em;'
);
console.log('%cVisual Noise. Intentional Chaos.', 'color: #7a7570; font-size: 0.9rem;');
