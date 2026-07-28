(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  document.querySelectorAll('[data-split]').forEach(el => {
    const base = parseFloat(el.dataset.splitDelay || 0);
    el.querySelectorAll('.split-line').forEach((line, i) => {
      const inner = document.createElement('span');
      inner.className = 'split-inner';
      inner.style.transitionDelay = (base + i * 150) + 'ms';
      while (line.firstChild) inner.appendChild(line.firstChild);
      line.appendChild(inner);
    });
  });

  const scroller = (() => {
    if (reduced || !window.matchMedia('(pointer: fine)').matches) return null;
    let target = null;
    let current = 0;
    let raf = null;
    const maxY = () => document.documentElement.scrollHeight - window.innerHeight;

    const loop = () => {
      raf = requestAnimationFrame(() => {
        current += (target - current) * 0.06;
        if (Math.abs(target - current) < 0.5) current = target;
        window.scrollTo({ top: current, behavior: 'instant' });
        if (current !== target) {
          loop();
        } else {
          raf = null;
          target = null;
        }
      });
    };

    window.addEventListener('scroll', () => {
      if (raf === null) target = null;
    }, { passive: true });

    return {
      nudge(delta) {
        if (target === null) target = current = window.scrollY;
        target = clamp(target + delta, 0, maxY());
        if (!raf) loop();
      },
      to(y) {
        if (target === null) current = window.scrollY;
        target = clamp(y, 0, maxY());
        if (!raf) loop();
      }
    };
  })();

  if (scroller) {
    window.addEventListener('wheel', e => {
      if (e.ctrlKey || document.body.classList.contains('menu-open') || document.body.classList.contains('lightbox-open')) return;
      if (e.target.closest && e.target.closest('.theme-rail')) return;
      e.preventDefault();
      scroller.nudge(e.deltaY);
    }, { passive: false });
  }

  const navOffset = () => {
    const navEl = document.querySelector('.nav-inner');
    return navEl ? navEl.getBoundingClientRect().bottom + 24 : 130;
  };

  const scrollToEl = el => {
    const r = el.getBoundingClientRect();
    const offset = navOffset();
    const y = r.height < window.innerHeight * 0.75
      ? r.top + window.scrollY - Math.max((window.innerHeight - r.height) / 2, offset)
      : r.top + window.scrollY - offset;
    if (scroller) scroller.to(y);
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (!id) return;
    const dest = document.getElementById(id);
    if (!dest) return;
    e.preventDefault();
    scrollToEl(dest);
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('[data-reveal],[data-split],[data-stagger],[data-observe]').forEach(el => {
    if (el.hasAttribute('data-stagger')) {
      [...el.children].forEach((c, i) => c.style.setProperty('--i', i));
    }
    io.observe(el);
  });

  const burger = document.querySelector('.nav-burger');
  if (burger) {
    const menuLinks = document.querySelectorAll('.mobile-menu a');
    menuLinks.forEach((a, i) => a.style.setProperty('--i', i));
    const closeMenu = () => {
      document.body.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
    };
    burger.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open);
    });
    const overlay = document.querySelector('.nav-overlay');
    if (overlay) overlay.addEventListener('click', closeMenu);
    menuLinks.forEach(a => a.addEventListener('click', closeMenu));
    window.addEventListener('resize', () => {
      if (window.innerWidth > 880) closeMenu();
    });
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  const counterIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      counterIO.unobserve(e.target);
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      if (reduced) {
        el.textContent = prefix + target + suffix;
        return;
      }
      const t0 = performance.now();
      const dur = 1600;
      const tick = now => {
        const p = clamp((now - t0) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = prefix + Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => counterIO.observe(el));

  if (!reduced) {
    [
      ['.ed-video', '0.05'],
      ['.phone-mock', '0.06'],
      ['.exp-stat-block', '0.045'],
      ['.intro-kicker', '0.035']
    ].forEach(([sel, speed]) => {
      document.querySelectorAll(sel).forEach(el => {
        if (!el.hasAttribute('data-speed') && !el.hasAttribute('data-reveal')) {
          el.setAttribute('data-speed', speed);
        }
      });
    });
  }

  const statementText = document.querySelector('.statement-text');
  let statementUnits = [];
  if (statementText) {
    const wrapChars = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const ch of child.textContent) {
            if (/\s/.test(ch)) {
              frag.appendChild(document.createTextNode(ch));
            } else {
              const s = document.createElement('span');
              s.className = 'st-char';
              s.textContent = ch;
              s.style.setProperty('--ty', (0.35 + Math.random() * 0.45).toFixed(2) + 'em');
              frag.appendChild(s);
            }
          }
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && !child.classList.contains('inline-media')) {
          wrapChars(child);
        }
      });
    };
    wrapChars(statementText);
    statementUnits = [...statementText.querySelectorAll('.st-char, .inline-media')];
    if (reduced) statementUnits.forEach(u => u.classList.add('on'));
  }

  const speedEls = [...document.querySelectorAll('[data-speed]')];
  const stretchEls = [...document.querySelectorAll('[data-stretch]')];
  const growEls = [...document.querySelectorAll('[data-grow]')];
  const watermark = document.querySelector('.cta-watermark');
  const progress = document.querySelector('.scroll-progress');
  const heroPin = document.querySelector('[data-hero-pin]');
  const heroSticky = document.querySelector('.hero-sticky');
  const heroMedia = document.querySelector('[data-hero-media]');
  const heroContent = document.querySelector('[data-hero-content]');
  const heroHint = document.querySelector('.hero-scroll-hint');
  let ticking = false;

  const HERO_SCROLL_GAP = 1.8;
  const HERO_SCALE_AMOUNT = 0.32;
  const HERO_FADE_START = 0.62;

  function sizeHeroPin() {
    if (!heroPin || !heroSticky) return;
    if (reduced || coarse) {
      heroPin.style.height = '';
      return;
    }
    heroPin.style.height = (heroSticky.offsetHeight + window.innerHeight * HERO_SCROLL_GAP) + 'px';
  }

  function scrollUpdate() {
    ticking = false;
    const vh = window.innerHeight;
    const doc = document.documentElement;

    if (progress) {
      const p = doc.scrollTop / (doc.scrollHeight - vh || 1);
      progress.style.transform = 'scaleX(' + clamp(p, 0, 1) + ')';
    }

    if (reduced) return;

    if (heroPin && heroMedia && heroSticky && !coarse) {
      const distance = heroPin.offsetHeight - heroSticky.offsetHeight;
      const p = distance > 0 ? clamp(-heroPin.getBoundingClientRect().top / distance, 0, 1) : 0;
      const eased = 1 - Math.pow(1 - p, 2);
      const scale = 1 - eased * HERO_SCALE_AMOUNT;

      heroMedia.style.transform = 'scale(' + scale.toFixed(4) + ')';
      heroMedia.style.borderRadius = (eased * 44).toFixed(1) + 'px';

      if (heroContent) {
        const fadeP = clamp((p - HERO_FADE_START) / (1 - HERO_FADE_START), 0, 1);
        const fadeEased = fadeP * fadeP * (3 - 2 * fadeP);
        heroContent.style.transform =
          'translateY(' + (-fadeEased * 70).toFixed(1) + 'px) scale(' + scale.toFixed(4) + ')';
        heroContent.style.opacity = (1 - fadeEased).toFixed(3);
        heroContent.style.filter = fadeEased > 0 ? 'blur(' + (fadeEased * 8).toFixed(1) + 'px)' : '';
        heroContent.style.pointerEvents = fadeEased > 0.4 ? 'none' : '';
      }

      if (heroHint) heroHint.style.opacity = clamp(1 - p * 5, 0, 1).toFixed(3);
    }

    speedEls.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const center = r.top + r.height / 2 - vh / 2;
      el.style.transform = 'translateY(' + (center * -parseFloat(el.dataset.speed)).toFixed(1) + 'px)';
    });

    stretchEls.forEach(el => {
      const r = el.getBoundingClientRect();
      const p = clamp((vh - r.top) / (vh * 0.85), 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.style.setProperty('--stretch', (0.86 + eased * 0.14).toFixed(4));
      el.style.setProperty('--stretch-r', (28 - eased * 22).toFixed(1) + 'px');
    });

    growEls.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      const p = clamp((vh * 0.82 - r.top) / (r.height || 1), 0, 1);
      el.style.transform = 'scaleY(' + p.toFixed(4) + ')';
    });

    if (statementUnits.length) {
      const r = statementText.getBoundingClientRect();
      const start = vh * 0.88;
      const span = r.height + vh * 0.42;
      const p = clamp((start - r.top) / span, 0, 1);
      const n = statementUnits.length;
      statementUnits.forEach((u, i) => u.classList.toggle('on', p * n >= i + 0.4));
    }

    if (watermark) {
      const r = watermark.parentElement.getBoundingClientRect();
      const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
      watermark.style.transform = 'translateX(' + ((1 - p) * 120 - 60).toFixed(1) + 'px)';
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(scrollUpdate);
    }
  }

  sizeHeroPin();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    sizeHeroPin();
    onScroll();
  });
  scrollUpdate();

  const nav = document.querySelector('.nav');
  if (nav) {
    let navTick = false;
    const onNavScroll = () => {
      if (navTick) return;
      navTick = true;
      requestAnimationFrame(() => {
        nav.classList.toggle('scrolled', window.scrollY > 100);
        navTick = false;
      });
    };
    window.addEventListener('scroll', onNavScroll, { passive: true });
    onNavScroll();
  }

  const stepNodes = [...document.querySelectorAll('.sn[data-target]')];
  if (stepNodes.length) {
    const panelIds = stepNodes.map(n => n.dataset.target);
    const setActiveStep = idx => {
      if (idx < 0 || !stepNodes[idx]) return;
      stepNodes.forEach(n => n.classList.remove('active'));
      stepNodes[idx].classList.add('active');
    };
    const panelIO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        setActiveStep(panelIds.indexOf(e.target.id));
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    panelIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) panelIO.observe(el);
    });
    stepNodes.forEach((n, idx) => n.addEventListener('click', ev => {
      ev.preventDefault();
      const el = document.getElementById(n.dataset.target);
      if (!el) return;
      setActiveStep(idx);
      scrollToEl(el);
    }));
  }

  const lightboxTargets = document.querySelectorAll('[data-lightbox]');
  if (lightboxTargets.length) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Video player');
    lightbox.innerHTML = '<div class="lightbox-backdrop"></div><div class="lightbox-frame"><button class="lightbox-close" aria-label="Close video">✕</button><video controls playsinline></video></div>';
    document.body.appendChild(lightbox);
    const lightboxVideo = lightbox.querySelector('video');
    let clearTimer = null;

    const openLightbox = src => {
      if (clearTimer) {
        clearTimeout(clearTimer);
        clearTimer = null;
      }
      lightboxVideo.src = src;
      lightboxVideo.muted = false;
      document.body.classList.add('lightbox-open');
      lightboxVideo.play().catch(() => {});
    };

    const closeLightbox = () => {
      if (!document.body.classList.contains('lightbox-open')) return;
      document.body.classList.remove('lightbox-open');
      lightboxVideo.pause();
      clearTimer = setTimeout(() => {
        lightboxVideo.removeAttribute('src');
        lightboxVideo.load();
      }, 400);
    };

    lightboxTargets.forEach(el => {
      el.addEventListener('click', () => openLightbox(el.dataset.lightbox));
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(el.dataset.lightbox);
        }
      });
    });
    lightbox.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  document.querySelectorAll('.theme-rail').forEach(rail => {
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;
    let target = 0;
    let current = 0;
    let railRaf = null;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;

    const maxScroll = () => rail.scrollWidth - rail.clientWidth;

    const settle = () => {
      railRaf = null;
      rail.classList.remove('gliding');
    };

    const glide = () => {
      railRaf = requestAnimationFrame(() => {
        current += (target - current) * 0.14;
        if (Math.abs(target - current) < 0.5) current = target;
        rail.scrollLeft = current;
        if (current !== target || dragging) glide();
        else settle();
      });
    };

    const startGlide = () => {
      rail.classList.add('gliding');
      if (!railRaf) glide();
    };

    rail.addEventListener('dragstart', e => e.preventDefault());

    rail.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      lastX = e.clientX;
      lastT = performance.now();
      startScroll = rail.scrollLeft;
      target = current = startScroll;
      velocity = 0;
      rail.classList.add('dragging');
      startGlide();
    });

    window.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      target = clamp(startScroll - dx, 0, maxScroll());
      const now = performance.now();
      const dt = now - lastT || 16;
      velocity = (lastX - e.clientX) / dt * 16;
      lastX = e.clientX;
      lastT = now;
      startGlide();
    });

    window.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      rail.classList.remove('dragging');
      target = clamp(target + velocity * 16, 0, maxScroll());
      startGlide();
    });

    rail.addEventListener('click', e => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  });

  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      q.setAttribute('aria-expanded', open);
      a.style.maxHeight = open ? a.scrollHeight + 'px' : '0px';
    });
  });

  if (!reduced && window.matchMedia('(pointer: fine)').matches) {
    const cursorEl = document.createElement('div');
    cursorEl.className = 'cursor hidden';
    cursorEl.setAttribute('aria-hidden', 'true');
    cursorEl.innerHTML =
      '<div class="cursor-spark"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 27.68 28.38"><path fill="#FB9C44" d="M13.84,2.9c.25.88.47,2.08.63,2.93.44,2.4.82,4.48,1.98,5.68,1.17,1.22,3.22,1.61,5.6,2.06.51.1,1.03.2,1.52.3.54.12.96.23,1.28.33-.32.1-.73.21-1.27.33-.5.11-1.03.21-1.55.31-2.36.45-4.4.84-5.57,2.04-1.17,1.2-1.55,3.28-1.99,5.69-.15.84-.37,2.05-.63,2.93-.25-.88-.47-2.08-.62-2.92-.44-2.41-.82-4.49-2-5.71-1.19-1.2-3.23-1.59-5.59-2.03-.29-.05-.58-.11-.86-.17-.87-.17-1.48-.33-1.92-.46.44-.13,1.06-.29,1.93-.46.32-.07.65-.13.98-.19,2.31-.44,4.31-.83,5.48-2.03,1.17-1.2,1.55-3.28,1.99-5.69.15-.84.37-2.04.62-2.92M13.83,0C11.14,0,11.6,8.28,9.83,10.08c-.88.9-3.26,1.23-5.45,1.67-2.29.46-4.38,1.03-4.38,2.43s2.09,1.98,4.38,2.44c2.2.43,4.58.77,5.45,1.66,1.76,1.81,1.31,10.1,4,10.1s2.24-8.29,4.01-10.1c.94-.97,3.76-1.28,6.14-1.8,2-.44,3.7-1.03,3.7-2.3s-1.7-1.84-3.7-2.29c-2.38-.51-5.19-.83-6.14-1.81-1.76-1.81-1.31-10.08-4.01-10.08h0Z"/></svg></div>' +
      '<div class="cursor-bg"></div><div class="cursor-text"></div>';
    document.body.appendChild(cursorEl);
    const cursorText = cursorEl.querySelector('.cursor-text');
    let mx = 0;
    let my = 0;
    let cx = 0;
    let cy = 0;
    let cursorRaf = null;
    let cursorSeen = false;

    const followCursor = () => {
      cx += (mx - cx) * 0.12;
      cy += (my - cy) * 0.12;
      cursorEl.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      cursorRaf = requestAnimationFrame(followCursor);
    };

    document.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
      if (!cursorSeen) {
        cursorSeen = true;
        cx = mx;
        cy = my;
        cursorEl.classList.remove('hidden');
      }
      if (!cursorRaf) followCursor();
    });

    document.documentElement.addEventListener('mouseleave', () => {
      cursorEl.classList.add('hidden');
      cursorSeen = false;
    });

    document.addEventListener('mouseover', e => {
      const labeled = e.target.closest('[data-cursor]');
      if (labeled) {
        cursorText.textContent = labeled.dataset.cursor || 'View';
        cursorEl.classList.add('label');
        cursorEl.classList.remove('pointer');
        return;
      }
      if (e.target.closest('a, button, .faq-q, .session-pill, .sn')) {
        cursorEl.classList.add('pointer');
        cursorEl.classList.remove('label');
        return;
      }
      cursorEl.classList.remove('label', 'pointer');
    });

    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18;
        const y = (e.clientY - r.top - r.height / 2) * 0.3;
        btn.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('video[autoplay]').forEach(v => {
      v.muted = true;
      const tryPlay = () => v.play().catch(() => {});
      tryPlay();
      new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) tryPlay();
        else v.pause();
      }), { rootMargin: '200px' }).observe(v);
    });
    if (reduced) {
      document.querySelectorAll('video[loop][autoplay]').forEach(v => {
        v.removeAttribute('autoplay');
        v.pause();
      });
    }
  });
})();
