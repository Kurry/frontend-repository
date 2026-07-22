(() => {
  const nativeMatchMedia = window.matchMedia.bind(window);
  window.matchMedia = (query) => {
    const result = nativeMatchMedia(query);
    if (!query.includes('prefers-reduced-motion')) return result;
    return { ...result, matches: true };
  };
})();
