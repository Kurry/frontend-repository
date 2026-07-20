import React, { useEffect } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export default function MotionManager() {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- Lenis Smooth Scrolling ---
    let lenis: Lenis | undefined;
    let lenisRafId: number | undefined;
    const syncScrollTrigger = () => ScrollTrigger.update();
    const startLenis = () => {
      if (lenis || window.innerWidth < 1024) return;
      lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
      });
      lenis.on('scroll', syncScrollTrigger);

      function raf(time: number) {
        lenis?.raf(time);
        lenisRafId = requestAnimationFrame(raf);
      }
      lenisRafId = requestAnimationFrame(raf);
    };
    const stopLenis = () => {
      if (lenisRafId !== undefined) cancelAnimationFrame(lenisRafId);
      lenisRafId = undefined;
      lenis?.off('scroll', syncScrollTrigger);
      lenis?.destroy();
      lenis = undefined;
    };
    const syncLenisForViewport = () => {
      if (window.innerWidth >= 1024) startLenis();
      else stopLenis();
    };

    if (reduceMotion) {
      document.documentElement.classList.add('is-mounted');
      const blurb = document.getElementById('eventsBlurb');
      if (blurb) blurb.classList.add('opacity-100');
      gsap.set('.blurb-line', { y: '0%' });
      return;
    }
    syncLenisForViewport();
    window.addEventListener('resize', syncLenisForViewport);

    // --- Page Load Entrance Sequence ---
    const entranceTimeline = gsap.timeline();

    // Initial states
    gsap.set('#chrome', { yPercent: -100 });
    gsap.set('.bento-mission, .bento-clock', { clipPath: 'inset(100% 0 0 0)', y: 20 });
    gsap.set('.hero-plane', { clipPath: 'inset(100% 0 0 0)', scale: 1.05 });

    // Mount sequence
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.add('is-mounted');

        entranceTimeline
          .to('#chrome', { yPercent: 0, duration: 1.7, ease: "power4.inOut" }, 0.85)
          .to('.bento-mission', { clipPath: 'inset(0% 0 0 0)', y: 0, duration: 1.8, ease: "power4.inOut" }, 0.9)
          .to('.bento-clock', { clipPath: 'inset(0% 0 0 0)', y: 0, duration: 1.8, ease: "power4.inOut" }, 1.05)
          .to('.hero-plane', { clipPath: 'inset(0% 0 0 0)', scale: 1, duration: 1.9, ease: "power4.inOut" }, 1.35);
      });
    });

    // --- Why Ridge Sticky Pile ---
    // In CSS, handled via sticky positioning, but we apply the dynamic offsets here.
    const updateSticky = () => {
      if (window.innerWidth >= 768) {
        const cards = document.querySelectorAll('.why-card');
        cards.forEach((card, index) => {
          (card as HTMLElement).style.position = 'sticky';
          // Progressive top offsets: e.g. 100px, 132px, 164px, etc.
          (card as HTMLElement).style.top = `calc(100px + ${index * 32}px)`;
        });
      } else {
        const cards = document.querySelectorAll('.why-card');
        cards.forEach((card) => {
          (card as HTMLElement).style.position = 'relative';
          (card as HTMLElement).style.top = '0px';
        });
      }
    };
    updateSticky();
    window.addEventListener('resize', updateSticky);

    // --- Get Started Trio Rise ---
    const showTrioOnDesktop = () => {
      if (window.innerWidth >= 1024) {
        gsap.set('.trio-card', { y: '0%', opacity: 1 });
      }
    };
    if (window.innerWidth < 1024) {
       gsap.set('.trio-card', { y: '50%', opacity: 0 });
       ScrollTrigger.create({
         trigger: '#getStarted',
         start: 'top 70%',
         onEnter: () => {
           gsap.to('.trio-card', {
             y: '0%',
             opacity: 1,
             duration: 0.8,
             ease: 'power3.out',
             stagger: 0.4
           });
         }
       });
    }
    window.addEventListener('resize', showTrioOnDesktop);

    // --- Global Events Text Decode ---
    const headlineElement = document.getElementById('eventsHeadline');
    const blurbElement = document.getElementById('eventsBlurb');
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}|:<>?";

    if (headlineElement && blurbElement) {
       let animated = false;

       ScrollTrigger.create({
         trigger: '#events',
         start: 'top 70%',
         onEnter: () => {
           if (animated) return;
           animated = true;

           // Headline Decode
           const spanArray = Array.from(headlineElement.querySelectorAll<HTMLElement>('[data-decode-character]'))
             .map(el => ({ el, finalChar: el.dataset.decodeCharacter ?? '' }));

           spanArray.forEach((item, index) => {
             const startDelay = index * 60;
             setTimeout(() => {
               item.el.style.opacity = '1';
               if (item.finalChar === ' ') {
                 item.el.textContent = ' ';
                 return;
               }

               let step = 0;
               const maxSteps = Math.floor(Math.random() * 3) + 2; // 2-4 decoy steps

               const interval = setInterval(() => {
                 if (step >= maxSteps) {
                   clearInterval(interval);
                   item.el.textContent = item.finalChar;
                 } else {
                   item.el.textContent = characters[Math.floor(Math.random() * characters.length)];
                   step++;
                 }
               }, 50); // ~50ms duration per frame

             }, startDelay);
           });

           // Blurb Line Reveal
           gsap.to('.blurb-line', {
             y: '0%',
             duration: 2,
             ease: 'power2.out',
             stagger: 0.15
           });
         }
       });
    }

    return () => {
      stopLenis();
      ScrollTrigger.getAll().forEach(t => t.kill());
      window.removeEventListener('resize', updateSticky);
      window.removeEventListener('resize', syncLenisForViewport);
      window.removeEventListener('resize', showTrioOnDesktop);
    };
  }, []);

  return null;
}
