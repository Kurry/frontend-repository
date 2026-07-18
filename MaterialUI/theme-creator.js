/* Material-UI Theme Creator — local runtime polish
 * - Block navigational <a href> (external + leaving the document)
 * - Demote React-rendered links to <button class="inert-nav"> while preserving look
 * - Allow same-document hash updates used by component drawer (#Accordion, etc.)
 */
(function () {
  "use strict";

  function isResourceUrl(href) {
    if (!href) return true;
    try {
      var u = new URL(href, location.href);
      if (u.protocol === "blob:" || u.protocol === "data:") return true;
      // same document (incl. hash) is OK for in-app component deep links
      if (u.origin === location.origin && u.pathname === location.pathname) return true;
      return false;
    } catch (e) {
      return href.charAt(0) === "#";
    }
  }

  function shouldDemote(a) {
    if (!a || a.tagName !== "A") return false;
    // Demote every anchor — including MUI <Link> rendered without href
    return true;
  }

  function demoteAnchor(a) {
    if (!shouldDemote(a) || a.dataset.inertNav === "1") return;
    // Skip if inside monaco or contenteditable
    if (a.closest(".monaco-editor, .monaco-editor-background, [contenteditable=true]")) return;

    var btn = document.createElement("button");
    btn.type = "button";
    // copy attributes except href/target/rel/download
    for (var i = 0; i < a.attributes.length; i++) {
      var attr = a.attributes[i];
      var name = attr.name.toLowerCase();
      if (name === "href" || name === "target" || name === "rel" || name === "download") continue;
      btn.setAttribute(attr.name, attr.value);
    }
    var cls = btn.getAttribute("class") || "";
    if (cls.indexOf("inert-nav") === -1) {
      btn.setAttribute("class", (cls + " inert-nav").trim());
    }
    btn.dataset.inertNav = "1";
    while (a.firstChild) btn.appendChild(a.firstChild);
    if (a.parentNode) a.parentNode.replaceChild(btn, a);
  }

  function demoteAll(root) {
    var scope = root || document;
    var list = scope.querySelectorAll ? scope.querySelectorAll("a") : [];
    for (var i = 0; i < list.length; i++) demoteAnchor(list[i]);
  }

  document.addEventListener(
    "click",
    function (e) {
      var a = e.target && e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      var href = a.getAttribute("href");
      if (!isResourceUrl(href) || href === "" || href === "#") {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // same-doc hash: allow hash change for component drawer without full navigation
      if (href && href.charAt(0) === "#") {
        // still demote later; prevent default browser jump fights with React router
        // Gatsby uses hash for component selection — let React handle via its listeners
        return;
      }
      if (!isResourceUrl(href)) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );

  // Block history navigations that leave this document path
  var push = history.pushState.bind(history);
  var replace = history.replaceState.bind(history);
  function sameDoc(url) {
    if (url == null) return true;
    try {
      var u = new URL(String(url), location.href);
      return u.origin === location.origin && u.pathname === location.pathname;
    } catch (e) {
      return true;
    }
  }
  history.pushState = function (state, title, url) {
    if (!sameDoc(url)) return;
    return push(state, title, url);
  };
  history.replaceState = function (state, title, url) {
    if (!sameDoc(url)) return;
    return replace(state, title, url);
  };

  // Disable service worker registration noise if any leftover SW tries to load
  if ("serviceWorker" in navigator) {
    try {
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        regs.forEach(function (r) {
          r.unregister();
        });
      });
    } catch (e) {}
  }

  function boot() {
    demoteAll(document);
    var obs = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type === "childList") {
          for (var j = 0; j < m.addedNodes.length; j++) {
            var n = m.addedNodes[j];
            if (n.nodeType !== 1) continue;
            if (n.tagName === "A") demoteAnchor(n);
            else demoteAll(n);
          }
        } else if (m.type === "attributes" && m.target && m.target.tagName === "A") {
          demoteAnchor(m.target);
        }
      }
    });
    obs.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href"],
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
