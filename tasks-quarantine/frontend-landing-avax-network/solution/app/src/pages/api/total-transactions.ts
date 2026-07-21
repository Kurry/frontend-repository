import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = async () => {
  // Frozen build-time snapshot. Keeping this deterministic avoids introducing
  // time drift into otherwise identical reference builds.
  const value = 60_932_291;
  return new Response(JSON.stringify({ value, data: { results: [{ value }] } }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
};
