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
    if (!reduceMotion && window.innerWidth >= 1024) {
      lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
      });

      function raf(time: number) {
        lenis?.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    if (reduceMotion) {
      document.documentElement.classList.add('is-mounted');
      const headline = document.getElementById('eventsHeadline');
      if (headline) headline.textContent = "RIDGE GLOBAL EVENTS";
      const blurb = document.getElementById('eventsBlurb');
      if (blurb) blurb.classList.add('opacity-100');
      return;
    }

    // --- Page Load Entrance Sequence ---
    const entranceTimeline = gsap.timeline();

    // Initial states
    gsap.set('#chrome', { yPercent: -100 });
    gsap.set('.bento-mission, .bento-clock', { clipPath: 'inset(100% 0 0 0)', y: 20 });
    gsap.set('.hero-plane', { clipPath: 'inset(100% 0 0 0)', scale: 1.05 });

    // Mount sequence
    requestAnimationFrame(() => {
      document.documentElement.classList.add('is-mounted');

      entranceTimeline
        .to('#chrome', { yPercent: 0, duration: 1.7, ease: "power4.inOut" }, 0.85)
        .to('.bento-mission', { clipPath: 'inset(0% 0 0 0)', y: 0, duration: 1.8, ease: "power4.inOut" }, 0.9)
        .to('.bento-clock', { clipPath: 'inset(0% 0 0 0)', y: 0, duration: 1.8, ease: "power4.inOut" }, 1.05)
        .to('.hero-plane', { clipPath: 'inset(0% 0 0 0)', scale: 1, duration: 1.9, ease: "power4.inOut" }, 1.35);
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

    // --- Global Events Text Decode ---
    const headlineText = "RIDGE GLOBAL EVENTS";
    const headlineElement = document.getElementById('eventsHeadline');
    const blurbElement = document.getElementById('eventsBlurb');
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}|:<>?";

    if (headlineElement && blurbElement) {
       let animated = false;

       // Setup blurb lines (wrapped for reveal)
       const lines = ["Join our worldwide network", "of developers, founders, and", "enterprise partners building", "the future of institutional infrastructure."];
       blurbElement.innerHTML = '';
       lines.forEach(line => {
         const wrapper = document.createElement('div');
         wrapper.style.overflow = 'hidden';
         const text = document.createElement('span');
         text.textContent = line;
         text.style.display = 'block';
         text.style.transform = 'translateY(-100%)';
         text.classList.add('blurb-line');
         wrapper.appendChild(text);
         blurbElement.appendChild(wrapper);
       });

       ScrollTrigger.create({
         trigger: '#events',
         start: 'top 70%',
         onEnter: () => {
           if (animated) return;
           animated = true;

           // Headline Decode
           const spanArray = headlineText.split('').map(char => {
             const span = document.createElement('span');
             span.style.opacity = '0';
             span.setAttribute('aria-hidden', 'true');
             headlineElement.appendChild(span);
             return { el: span, finalChar: char };
           });
           // Set accessible name fully, hide visual chars from screen readers.
           headlineElement.setAttribute('aria-label', headlineText);

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
      lenis?.destroy();
      ScrollTrigger.getAll().forEach(t => t.kill());
      window.removeEventListener('resize', updateSticky);
    };
  }, []);

  return null;
}
