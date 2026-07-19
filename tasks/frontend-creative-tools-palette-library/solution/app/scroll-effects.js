
document.addEventListener('DOMContentLoaded', function () {
  if (typeof Lenis === 'undefined' || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const lenis = window.lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  document.addEventListener('modalOpen', () => lenis.stop());
  document.addEventListener('modalClose', () => lenis.start());

  const revealSections = document.querySelectorAll('[data-scroll-reveal]');
  revealSections.forEach((section) => {
    gsap.fromTo(section,
      { y: 120 },
      {
        y: 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 95%',
          end: 'top 10%',
          scrub: 1.2,
        }
      }
    );
  });

  const parallaxElements = document.querySelectorAll('[data-parallax]');
  parallaxElements.forEach((el) => {
    if (window.innerWidth < 750) return;
    gsap.to(el, {
      yPercent: 25,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      }
    });
  });

  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.fromTo(el,
      { opacity: 0, filter: 'blur(8px)' },
      {
        opacity: 1,
        filter: 'blur(0px)',
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
        }
      }
    );
  });

  gsap.utils.toArray('[data-reveal-group]').forEach((group) => {
    const children = group.children;
    gsap.fromTo(children,
      { opacity: 0, filter: 'blur(8px)' },
      {
        opacity: 1,
        filter: 'blur(0px)',
        duration: 1.2,
        ease: 'power2.out',
        stagger: 0.15,
        scrollTrigger: {
          trigger: group,
          start: 'top 88%',
          toggleActions: 'play none none none',
        }
      }
    );
  });

  function setFooterReveal() {
    const footerSection = document.querySelector('.shopify-section-group-footer-group');
    const mainContent = document.getElementById('MainContent');
    if (!footerSection || !mainContent) return;
    mainContent.style.setProperty('padding-bottom', footerSection.offsetHeight + 'px', 'important');
  }

  setFooterReveal();
  window.addEventListener('resize', setFooterReveal);
});
