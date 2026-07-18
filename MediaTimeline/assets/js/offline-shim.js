/* Offline / static-hosting shim for SavePage restore — does not alter timeline engine logic.
   - Keeps history on the local index page
   - Renders event popups from historicEventsMap when fragment fetch is unavailable
   - Skips onboarding / about chrome that was stripped from the page
*/
(function () {
  "use strict";

  try {
    localStorage.setItem("skipOnboarding", String(Date.now()));
  } catch (e) {}

  function formatYear(y) {
    if (y < 0) return Math.abs(y) + " BCE";
    if (y === 0) return "1 CE";
    return y + " CE";
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function findEventByUrl(url) {
    if (!window.historicEventsMap || !historicEventsMap.events) return null;
    const needle = String(url || "");
    return (
      historicEventsMap.events.find(function (e) {
        return e.url === needle || needle.endsWith("/" + e.id) || needle.endsWith(e.id);
      }) || null
    );
  }

  function buildFragment(ev) {
    const yearLabel = formatYear(ev.year) + (ev.country_name ? ", " + ev.country_name : "");
    const img = ev.img ? String(ev.img) : "";
    const imgBlock = img
      ? '<button class="event-popup-img-wrap open-lightbox" type="button" data-src="' +
        escapeHtml(img) +
        '">' +
        '<img class="event-popup-img" src="' +
        escapeHtml(img) +
        '" alt="">' +
        "</button>"
      : "";
    const capsuleClass = img ? "event-popup-capsule" : "event-popup-capsule no-img-event";
    return (
      '<div class="event-popup-main" data-timeline="' +
      escapeHtml(ev.timeline || "highlights") +
      '">' +
      '<div class="empty-arrow"></div>' +
      '<div class="event-capsule-wrap">' +
      '<div class="' +
      capsuleClass +
      '">' +
      imgBlock +
      '<div class="event-popup-content expanded">' +
      '<h1 class="event-popup-title" tabindex="-1">' +
      escapeHtml(ev.title) +
      "</h1>" +
      '<div class="event-year-country">' +
      escapeHtml(yearLabel) +
      "</div>" +
      '<div class="event-description">' +
      (ev.intro || "<p></p>") +
      "</div>" +
      "</div></div>" +
      "<div>" +
      '<button class="event-bookmark-btn animated-btn" data-id="events/' +
      escapeHtml(ev.id) +
      '" data-title="' +
      escapeHtml(ev.title) +
      '" data-year="' +
      escapeHtml(formatYear(ev.year)) +
      '" data-country="' +
      escapeHtml(ev.country_name || "") +
      '" aria-label="Save event">' +
      '<svg width="12" height="16" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M0.75 2.75C0.75 1.64543 1.64543 0.75 2.75 0.75H9.25C10.3546 0.75 11.25 1.64543 11.25 2.75V15.25L6 10.75L0.75 15.25V2.75Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg>" +
      '<p class="event-bookmark-hover">Save event</p>' +
      "</button></div></div>" +
      '<div class="lightbox" id="lightbox"><div class="lightbox-content"><img src="" alt="" id="lightbox-img"></div>' +
      '<button class="close-lightbox animated-btn" aria-label="Close"><svg class="close-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L13 13" stroke="#353433" stroke-width="1.5"/><path d="M13 1L1 13" stroke="#353433" stroke-width="1.5"/></svg></button>' +
      "</div></div>"
    );
  }

  function forceBandsVisible() {
    if (!window.tali || !tali.timelines || !window.paper) return;
    try {
      if (typeof gsap !== "undefined" && gsap.globalTimeline) {
        gsap.globalTimeline.getChildren(true, true, false).forEach(function (t) {
          try {
            t.kill();
          } catch (e) {}
        });
      }
    } catch (e) {}
    try {
      if (typeof tali.expandTimelinesQuietly === "function") {
        tali.expandTimelinesQuietly();
      }
      Object.keys(tali.timelines).forEach(function (name) {
        var tl = tali.timelines[name];
        if (tl.backPath) {
          tl.backPath.visible = true;
          tl.backPath.opacity = 1;
        }
        if (tl.frontPath) {
          tl.frontPath.visible = true;
          tl.frontPath.opacity = 1;
        }
        if (tl.label) tl.label.visible = true;
        (tl.events || []).forEach(function (ev) {
          if (ev.point) ev.point.visible = !ev.isClustered || !ev.isClustered();
        });
        (tl.clusters || []).forEach(function (c) {
          if (c.point) c.point.visible = true;
        });
      });
      if (window.marker && marker.marker) {
        marker.marker.opacity = 1;
        if (marker.label) marker.label.opacity = 1;
      }
      paper.view.update();
      tali._collapsed = false;
      $(document).trigger("timelines-expanded");
    } catch (e) {}
  }

  function ensureTimelinesExpanded() {
    if (!window.tali || !tali.timelines) return;
    var culture = tali.timelines.culture;
    var bandsOk =
      culture && culture.backPath && culture.backPath.visible === true;
    if (bandsOk) return;
    if (tali._collapsed && typeof tali.expandTimelines === "function") {
      try {
        tali.expandTimelines(function () {
          setTimeout(forceBandsVisible, 100);
        });
        return;
      } catch (e) {}
    }
    forceBandsVisible();
  }

  function install() {
    if (window.tali) {
      tali.showOnboarding = function () {};
      tali.hideOnboarding = function () {};
      tali.expandAboutMenu = function () {};
      tali.collapseAboutMenu = function () {};
      tali.constructUrl = function () {
        return "./";
      };
      if (typeof tali.updateUrl === "function") {
        var origUpdate = tali.updateUrl.bind(tali);
        tali.updateUrl = function (fromYear, toYear, filters, searchText) {
          try {
            origUpdate(fromYear, toYear, filters, searchText);
          } catch (e) {}
          try {
            history.replaceState(history.state, "", "./");
          } catch (e2) {}
        };
      }
      // Recover if chrome teardown / GSAP drawPath leaves bands invisible.
      // Run immediately + on animation frames so first paint isn't empty beige.
      forceBandsVisible();
      ensureTimelinesExpanded();
      requestAnimationFrame(forceBandsVisible);
      setTimeout(ensureTimelinesExpanded, 50);
      setTimeout(forceBandsVisible, 200);
      setTimeout(forceBandsVisible, 600);
      setTimeout(forceBandsVisible, 1200);
      setTimeout(forceBandsVisible, 2200);
      window.addEventListener("load", function () {
        forceBandsVisible();
        ensureTimelinesExpanded();
      });
    }

    if (typeof window.putEvent === "function") {
      window.putEvent = function (url, cb) {
        cb = cb || function () {};
        var ev = findEventByUrl(url);
        $("body").addClass("loading-event");
        setTimeout(function () {
          $("body").removeClass("loading-event");
          if (!ev) {
            $(".event-popup").html(
              '<div class="event-popup-main"><div class="event-capsule-wrap"><div class="event-popup-capsule no-img-event"><div class="event-popup-content expanded"><h1 class="event-popup-title">Event unavailable offline</h1></div></div></div></div>'
            );
          } else {
            $(".event-popup").html(buildFragment(ev));
          }
          if (window.tali && typeof tali.initEventBookmarkButton === "function") {
            tali.initEventBookmarkButton();
          }
          $("body")
            .removeClass("home-page map-page country-page")
            .addClass("event-page");
          if (window.tali && typeof tali.saveState === "function") {
            tali.saveState("event-url-" + url);
          }
          $(".main-heading").remove();
          cb();
        }, 10);
      };
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(install, 0);
    });
  } else {
    setTimeout(install, 0);
  }
  if (window.jQuery) {
    $(install);
  }
})();
