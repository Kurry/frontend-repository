document.addEventListener("DOMContentLoaded", function () {
  if (typeof Lenis === "undefined" || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    return;
  }

  document.documentElement.classList.add("lenis");
  gsap.registerPlugin(ScrollTrigger);

  var lenis = (window.lenis = new Lenis({
    duration: 1.4,
    easing: function (t) {
      return Math.min(1, 1.001 - Math.pow(2, -10 * t));
    },
    orientation: "vertical",
    smoothWheel: true,
  }));

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(function (time) {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  document.querySelectorAll("[data-scroll-reveal]").forEach(function (section) {
    gsap.fromTo(
      section,
      { y: 80 },
      {
        y: 0,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: "top 95%",
          end: "top 15%",
          scrub: 1.2,
        },
      }
    );
  });

  document.querySelectorAll("[data-parallax]").forEach(function (el) {
    if (window.innerWidth < 750) return;
    gsap.to(el, {
      yPercent: 12,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  });

  gsap.utils.toArray("[data-reveal]").forEach(function (el) {
    gsap.fromTo(
      el,
      { opacity: 0, filter: "blur(8px)" },
      {
        opacity: 1,
        filter: "blur(0px)",
        duration: 1.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      }
    );
  });

  gsap.utils.toArray("[data-reveal-group]").forEach(function (group) {
    gsap.fromTo(
      group.children,
      { opacity: 0, filter: "blur(8px)" },
      {
        opacity: 1,
        filter: "blur(0px)",
        duration: 1.2,
        ease: "power2.out",
        stagger: 0.15,
        scrollTrigger: {
          trigger: group,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      }
    );
  });

  function setFooterReveal() {
    var footerSection = document.querySelector(".shopify-section-group-footer-group");
    var mainContent = document.getElementById("MainContent");
    if (!footerSection || !mainContent) return;
    mainContent.style.setProperty("padding-bottom", footerSection.offsetHeight + "px", "important");
  }

  setFooterReveal();
  window.addEventListener("resize", setFooterReveal);
});
