import type { APIRoute } from "astro";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const prerender = false;

// Local form sink: every submission is written to form-submissions/ as
// <ISO-stamp>.txt with the request path, content type, and raw body —
// the app never calls an external form endpoint.
export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const outDir = join(process.cwd(), "form-submissions");
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const url = new URL(request.url);
  writeFileSync(
    join(outDir, `${stamp}.txt`),
    `path=${url.pathname}\ncontent-type=${request.headers.get("content-type") || ""}\n\n${body}\n`
  );
  return new Response(
    JSON.stringify({ msg: "ok", code: 200, oracle: true, offline: true }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
};

export const OPTIONS: APIRoute = () =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
