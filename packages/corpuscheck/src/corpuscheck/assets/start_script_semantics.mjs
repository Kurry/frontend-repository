// Classify app start scripts without executing them. Both the screenshot
// capture harness and its regression tests use this narrow helper so an
// output-serving start command cannot silently bypass the build-on-demand
// path.
export function needsPrebuiltOutput(start) {
  if (!start || start.includes('&&')) return false;
  if (/\bvite preview\b/.test(start) || /\bastro preview\b/.test(start)) return true;
  return (
    /\b(?:http-server|serve(?:@\S+)?)\b/.test(start)
    && /(?:^|\s)(?:\.\/)?(?:dist|build|out|\.next|\.nuxt|\.svelte-kit|storybook-static)(?:\/|\s|$)/.test(start)
  );
}
