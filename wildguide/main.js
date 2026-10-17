/* ═══════════════════════════════════════════════════════════════
   WildGuide · main.js
═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Mosaic Tile Background ─────────────────────────────── */
  const EMOJIS = [
    '🦋','🌿','🍄','🐦','🌸','🦅','🐾','🌱','🍃','🦜',
    '🌾','🐝','🦎','🌺','🦚','🐠','🌲','🦌','🍀','🌻',
    '🦊','🐺','🌊','🦩','🍁','🌵','🦢','🐛','🌴','🦋',
    '🌿','🍂','🦗','🌷','🦉','🐢','🌾','🐸','🍄','🦕',
    '🐨','🦔','🌈','🦦','🐿️','🪲','🌳','🦜','🐻','🌙',
  ];
  const grid = document.getElementById('mosaicGrid');
  if (grid) {
    for (let i = 0; i < 48; i++) {
      const cell = document.createElement('div');
      cell.className = 'mosaic-cell';
      cell.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      cell.style.setProperty('--duration', `${4 + Math.random() * 6}s`);
      cell.style.setProperty('--delay',    `${Math.random() * 5}s`);
      grid.appendChild(cell);
    }
  }

  /* ── Scroll-based nav style ─────────────────────────────── */
  const nav = document.getElementById('mainNav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 50);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Feature Carousel ───────────────────────────────────── */
  const track    = document.querySelector('.carousel-track');
  const items    = document.querySelectorAll('.feature-item');
  const prevBtn  = document.querySelector('.carousel-prev');
  const nextBtn  = document.querySelector('.carousel-next');
  const dotsWrap = document.querySelector('.carousel-dots');

  if (track && items.length) {
    let current = 0;
    const total = items.length;

    items.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });
    const dots = dotsWrap.querySelectorAll('.carousel-dot');

    const goTo = (n) => {
      current = (n + total) % total;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    };

    prevBtn?.addEventListener('click', () => goTo(current - 1));
    nextBtn?.addEventListener('click', () => goTo(current + 1));

    let timer = setInterval(() => goTo(current + 1), 5000);
    const container = track.closest('.features-carousel');
    container.addEventListener('mouseenter', () => clearInterval(timer));
    container.addEventListener('mouseleave', () => {
      timer = setInterval(() => goTo(current + 1), 5000);
    });

    // Touch/swipe support
    let startX = 0;
    container.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    container.addEventListener('touchend', e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
    });
  }

  /* ── Intersection Observer — reveal on scroll ───────────── */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Stagger children if a grid
        const children = entry.target.querySelectorAll('.service-card, .group-card, .step, .cta-card, .compare-card');
        if (children.length) {
          children.forEach((child, i) => {
            child.style.transitionDelay = `${i * 80}ms`;
            child.classList.add('visible');
          });
        }
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  /* ── Parallax hero ──────────────────────────────────────── */
  const heroContent = document.querySelector('.hero-content');
  const heroTags    = document.querySelector('.hero-tags');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight && heroContent) {
      heroContent.style.transform = `translateY(${y * 0.22}px)`;
      heroContent.style.opacity   = String(Math.max(0, 1 - y / 480));
    }
    if (heroTags) {
      heroTags.style.transform = `translateY(${y * 0.12}px)`;
    }
  }, { passive: true });

  /* ── Stats counter animation ────────────────────────────── */
  const statNums = document.querySelectorAll('.stat-num');
  const statsObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent;
        // Only animate pure numbers
        const num = parseFloat(text.replace(/[^0-9.]/g, ''));
        if (!isNaN(num) && num > 1) {
          let start = 0;
          const dur = 1200;
          const startTime = performance.now();
          const tick = (now) => {
            const progress = Math.min((now - startTime) / dur, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const prefix = text.match(/^[^0-9]*/)[0];
            const suffix = text.match(/[^0-9]*$/)[0];
            el.textContent = prefix + Math.round(eased * num) + suffix;
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
        statsObs.unobserve(el);
      }
    });
  }, { threshold: 1 });
  statNums.forEach(el => statsObs.observe(el));

  /* ── Contact form ────────────────────────────────────────── */
  const form = document.getElementById('contactForm');
  const note = document.getElementById('formNote');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = 'Sending…';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = '✅ Sent!';
      note.style.display = 'block';
      form.reset();
      setTimeout(() => {
        btn.textContent = orig;
        btn.disabled = false;
        note.style.display = 'none';
      }, 4500);
    }, 900);
  });

  /* ── Smooth anchor scroll ───────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

});
