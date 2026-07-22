import React, { useEffect } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export default function MotionManager() {
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');

    const applyReducedMotion = () => {
      document.documentElement.style.scrollBehavior = 'auto';
      document.documentElement.classList.add('is-mounted');
      const headline = document.getElementById('eventsHeadline');
      if (headline) { headline.textContent = 'Ridge Global Events'; headline.setAttribute('aria-label', 'Ridge Global Events'); }
      const trio = document.getElementById('trio');
      if (trio) trio.classList.add('trio-in');

      // also instantly clear any gsap properties on these targets if they were mid-animation
      gsap.set('#chrome, .bento-mission, .bento-clock, .hero-plane, .blurb-line', { clearProps: 'all' });
    };

    if (mql.matches) {
      applyReducedMotion();
    }

    const listener = (e: MediaQueryListEvent) => {
      if (e.matches) applyReducedMotion();
    };

    mql.addEventListener('change', listener);

    // --- Reduced motion: paint fully settled, no smoothing, no decode. ---
    if (mql.matches) {
      return () => { mql.removeEventListener('change', listener); };
    }

    // --- Lenis Smooth Scrolling (desktop only) ---
    let lenis: Lenis | undefined;
    if (window.innerWidth >= 1024) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      const raf = (time: number) => { lenis?.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }

    // --- Page Load Entrance Sequence (double rAF mount, NOT IntersectionObserver) ---
    const entranceTimeline = gsap.timeline();
    gsap.set('#chrome', { yPercent: -100 });
    gsap.set('.bento-mission, .bento-clock', { clipPath: 'inset(100% 0 0 0)', y: 20 });
    gsap.set('.hero-plane', { clipPath: 'inset(100% 0 0 0)', scale: 1.05 });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.add('is-mounted');
        entranceTimeline
          .to('#chrome', { yPercent: 0, duration: 1.75, ease: 'power4.inOut' }, 0.85)
          .to('.bento-mission', { clipPath: 'inset(0% 0 0 0)', y: 0, duration: 1.8, ease: 'power4.inOut' }, 0.9)
          .to('.bento-clock', { clipPath: 'inset(0% 0 0 0)', y: 0, duration: 1.8, ease: 'power4.inOut' }, 1.05)
          .to('.hero-plane', { clipPath: 'inset(0% 0 0 0)', scale: 1, duration: 1.85, ease: 'power4.inOut' }, 1.35);
      });
    });

    // Why Ridge sticky pile is driven by CSS (.why-card position:sticky via --i at >=768px).

    // --- Get Started Trio Rise (below lg): add class, CSS handles per-card stagger. ---
    let trioTrigger: ScrollTrigger | undefined;
    if (window.innerWidth < 1024) {
      trioTrigger = ScrollTrigger.create({
        trigger: '#getStarted',
        start: 'top 75%',
        once: true,
        onEnter: () => document.getElementById('trio')?.classList.add('trio-in'),
      });
    } else {
      document.getElementById('trio')?.classList.add('trio-in');
    }

    // --- Global Events character-decode + line-mask reveal ---
    const headlineText = 'Ridge Global Events';
    const headlineElement = document.getElementById('eventsHeadline');
    const blurbElement = document.getElementById('eventsBlurb');
    const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*<>?';

    if (headlineElement && blurbElement) {
      let animated = false;

      const lines = ['Join our worldwide network', 'of developers, founders, and', 'enterprise partners building', 'the future of institutional infrastructure.'];
      blurbElement.innerHTML = '';
      lines.forEach(line => {
        const wrapper = document.createElement('div');
        wrapper.style.overflow = 'hidden';
        const text = document.createElement('span');
        // Preserve word boundaries for text-only and assistive representations.
        text.textContent = `${line} `;
        text.style.display = 'block';
        text.style.transform = 'translateY(-100%)';
        text.classList.add('blurb-line');
        wrapper.appendChild(text);
        blurbElement.appendChild(wrapper);
      });

      ScrollTrigger.create({
        trigger: '#events',
        start: 'top 72%',
        once: true,
        onEnter: () => {
          if (animated) return;
          animated = true;
          headlineElement.setAttribute('aria-label', headlineText);

          const items = headlineText.split('').map((finalChar) => {
            const span = document.createElement('span');
            span.style.display = 'inline-block';
            span.style.opacity = '0';
            span.setAttribute('aria-hidden', 'true');
            if (finalChar === ' ') span.style.width = '0.3em';
            headlineElement.appendChild(span);
            return { el: span, finalChar };
          });

          items.forEach((item, index) => {
            const startDelay = index * 60;
            const duration = 50 + (index + 1) * 75; // later glyphs scramble longer -> visible wave
            const stepMs = 60;
            const steps = Math.max(2, Math.round(duration / stepMs));
            let step = 0;
            window.setTimeout(() => {
              item.el.style.opacity = '1';
              if (item.finalChar === ' ') { item.el.textContent = ' '; item.el.style.width = '0.3em'; return; }
              const tick = window.setInterval(() => {
                step += 1;
                if (step >= steps) {
                  window.clearInterval(tick);
                  item.el.textContent = item.finalChar;
                } else {
                  item.el.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
                }
              }, stepMs);
            }, startDelay);
          });

          gsap.to('.blurb-line', { y: '0%', duration: 2, ease: 'power2.out', stagger: 0.15 });
        }
      });
    }

    return () => {
      lenis?.destroy();
      trioTrigger?.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
      mql.removeEventListener('change', listener);
    };
  }, []);

  return null;
}
