/* No-nav guard: block outbound navigation; demote anchors to inert buttons */
(function () {
  "use strict";

  function isSameDocument(href) {
    if (!href) return true;
    try {
      var u = new URL(href, location.href);
      if (u.protocol === "blob:" || u.protocol === "data:") return true;
      return u.origin === location.origin && u.pathname === location.pathname;
    } catch (e) {
      return href.charAt(0) === "#";
    }
  }

  function demoteAnchor(a) {
    if (!a || a.tagName !== "A" || a.dataset.inertNav === "1") return;
    if (a.closest(".monaco-editor, [contenteditable=true]")) return;

    var btn = document.createElement("button");
    btn.type = "button";
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
      if (!isSameDocument(href) || href === "" || href === "#") {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );

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
