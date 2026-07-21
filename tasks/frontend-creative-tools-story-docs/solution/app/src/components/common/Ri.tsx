/** Remix Icon glyph set (from @iconify-json/ri), bundled locally — no icon CDN. */
import type { SVGProps } from "react";

const PATHS: Record<string, string> = {
  "menu-line": "<path fill=\"currentColor\" d=\"M3 4h18v2H3zm0 7h18v2H3zm0 7h18v2H3z\"/>",
  "close-line": "<path fill=\"currentColor\" d=\"m12 10.587l4.95-4.95l1.414 1.414l-4.95 4.95l4.95 4.95l-1.415 1.414l-4.95-4.95l-4.949 4.95l-1.414-1.415l4.95-4.95l-4.95-4.95L7.05 5.638z\"/>",
  "more-2-fill": "<path fill=\"currentColor\" d=\"M12 3c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2m0 14c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2m0-7c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2\"/>",
  "notification-3-line": "<path fill=\"currentColor\" d=\"M20 17h2v2H2v-2h2v-7a8 8 0 1 1 16 0zm-2 0v-7a6 6 0 0 0-12 0v7zm-9 4h6v2H9z\"/>",
  "dashboard-3-line": "<path fill=\"currentColor\" d=\"M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2m0 2a8 8 0 1 0 0 16a8 8 0 0 0 0-16m3.833 3.337a.596.596 0 0 1 .763.067a.59.59 0 0 1 .063.76q-3.27 4.569-3.598 4.897a1.5 1.5 0 0 1-2.122-2.122q.56-.56 4.894-3.602M17.5 11a1 1 0 1 1 0 2a1 1 0 0 1 0-2m-11 0a1 1 0 1 1 0 2a1 1 0 0 1 0-2m2.318-3.596a1 1 0 1 1-1.414 1.414a1 1 0 0 1 1.414-1.414M12 5.5a1 1 0 1 1 0 2a1 1 0 0 1 0-2\"/>",
  "user-3-line": "<path fill=\"currentColor\" d=\"M20 22h-2v-2a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3v2H4v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5zm-8-9a6 6 0 1 1 0-12a6 6 0 0 1 0 12m0-2a4 4 0 1 0 0-8a4 4 0 0 0 0 8\"/>",
  "book-2-line": "<path fill=\"currentColor\" d=\"M21 18H6a1 1 0 1 0 0 2h15v2H6a3 3 0 0 1-3-3V4a2 2 0 0 1 2-2h16zM5 16.05q.243-.05.5-.05H19V4H5zM16 9H8V7h8z\"/>",
  "add-line": "<path fill=\"currentColor\" d=\"M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z\"/>",
  "question-line": "<path fill=\"currentColor\" d=\"M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m0-2a8 8 0 1 0 0-16a8 8 0 0 0 0 16m-1-5h2v2h-2zm2-1.645V14h-2v-1.5a1 1 0 0 1 1-1a1.5 1.5 0 1 0-1.471-1.794l-1.962-.393A3.501 3.501 0 1 1 13 13.355\"/>",
  "search-line": "<path fill=\"currentColor\" d=\"m18.031 16.617l4.283 4.282l-1.415 1.415l-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9s9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617m-2.006-.742A6.98 6.98 0 0 0 18 11c0-3.867-3.133-7-7-7s-7 3.133-7 7s3.133 7 7 7a6.98 6.98 0 0 0 4.875-1.975z\"/>",
  "arrow-left-s-line": "<path fill=\"currentColor\" d=\"m10.828 12l4.95 4.95l-1.414 1.415L8 12l6.364-6.364l1.414 1.414z\"/>",
  "arrow-right-s-line": "<path fill=\"currentColor\" d=\"m13.172 12l-4.95-4.95l1.414-1.413L16 12l-6.364 6.364l-1.414-1.415z\"/>",
  "arrow-go-back-line": "<path fill=\"currentColor\" d=\"m5.828 7l2.536 2.535L6.95 10.95L2 6l4.95-4.95l1.414 1.415L5.828 5H13a8 8 0 1 1 0 16H4v-2h9a6 6 0 0 0 0-12z\"/>",
  "arrow-go-forward-line": "<path fill=\"currentColor\" d=\"M18.172 7H11a6 6 0 0 0 0 12h9v2h-9a8 8 0 0 1 0-16h7.172l-2.536-2.536L17.05 1.05L22 6l-4.95 4.95l-1.414-1.415z\"/>",
  "download-2-line": "<path fill=\"currentColor\" d=\"M13 10h5l-6 6l-6-6h5V3h2zm-9 9h16v-7h2v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-8h2z\"/>",
  "file-copy-line": "<path fill=\"currentColor\" d=\"M7 6V3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3v3c0 .552-.45 1-1.007 1H4.007A1 1 0 0 1 3 21l.003-14c0-.552.45-1 1.006-1zM5.002 8L5 20h10V8zM9 6h8v10h2V4H9z\"/>",
  "upload-2-line": "<path fill=\"currentColor\" d=\"M4 19h16v-7h2v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-8h2zm9-10v7h-2V9H6l6-6l6 6z\"/>",
  "history-line": "<path fill=\"currentColor\" d=\"M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12h2a8 8 0 1 0 1.385-4.5H8v2H2v-6h2V6a9.99 9.99 0 0 1 8-4m1 5v4.585l3.243 3.243l-1.415 1.415L11 12.413V7z\"/>",
  "drag-move-2-line": "<path fill=\"currentColor\" d=\"M11 11V5.828L9.172 7.657L7.757 6.243L12 2l4.243 4.243l-1.415 1.414L13 5.828V11h5.172l-1.829-1.828l1.414-1.415L22 12l-4.243 4.243l-1.414-1.415L18.172 13H13v5.172l1.828-1.829l1.415 1.414L12 22l-4.243-4.243l1.415-1.414L11 18.172V13H5.828l1.829 1.828l-1.414 1.415L2 12l4.243-4.243l1.414 1.415L5.828 11z\"/>",
  "refresh-line": "<path fill=\"currentColor\" d=\"M5.463 4.433A9.96 9.96 0 0 1 12 2c5.523 0 10 4.477 10 10c0 2.136-.67 4.116-1.81 5.74L17 12h3A8 8 0 0 0 6.46 6.228zm13.074 15.134A9.96 9.96 0 0 1 12 22C6.477 22 2 17.523 2 12c0-2.136.67-4.116 1.81-5.74L7 12H4a8 8 0 0 0 13.54 5.772z\"/>",
  "pencil-line": "<path fill=\"currentColor\" d=\"m15.728 9.576l-1.414-1.414L5 17.476v1.414h1.414zm1.414-1.414l1.414-1.414l-1.414-1.414l-1.414 1.414zm-9.9 12.728H3v-4.243L16.435 3.212a1 1 0 0 1 1.414 0l2.829 2.829a1 1 0 0 1 0 1.414z\"/>",
  "delete-bin-line": "<path fill=\"currentColor\" d=\"M17 6h5v2h-2v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8H2V6h5V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1zm1 2H6v12h12zm-9 3h2v6H9zm4 0h2v6h-2zM9 4v2h6V4z\"/>",
  "film-line": "<path fill=\"currentColor\" d=\"M2 3.993A1 1 0 0 1 2.992 3h18.016c.548 0 .992.445.992.993v16.014a1 1 0 0 1-.992.993H2.992A.993.993 0 0 1 2 20.007zM8 5v14h8V5zM4 5v2h2V5zm14 0v2h2V5zM4 9v2h2V9zm14 0v2h2V9zM4 13v2h2v-2zm14 0v2h2v-2zM4 17v2h2v-2zm14 0v2h2v-2z\"/>",
  "apps-line": "<path fill=\"currentColor\" d=\"M6.75 2.5A4.25 4.25 0 0 1 11 6.75V11H6.75a4.25 4.25 0 0 1 0-8.5M9 9V6.75A2.25 2.25 0 1 0 6.75 9zm-2.25 4H11v4.25A4.25 4.25 0 1 1 6.75 13m0 2A2.25 2.25 0 1 0 9 17.25V15zm10.5-12.5a4.25 4.25 0 0 1 0 8.5H13V6.75a4.25 4.25 0 0 1 4.25-4.25m0 6.5A2.25 2.25 0 1 0 15 6.75V9zM13 13h4.25A4.25 4.25 0 1 1 13 17.25zm2 2v2.25A2.25 2.25 0 1 0 17.25 15z\"/>",
  "list-unordered": "<path fill=\"currentColor\" d=\"M8 4h13v2H8zM4.5 6.5a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3m0 7a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3m0 6.9a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3M8 11h13v2H8zm0 7h13v2H8z\"/>",
  "slideshow-line": "<path fill=\"currentColor\" d=\"M13 21v2h-2v-2H3a1 1 0 0 1-1-1V6h20v14a1 1 0 0 1-1 1zm-9-2h16V8H4zm9-9h5v2h-5zm0 4h5v2h-5zm-4-4v3h3a3 3 0 1 1-3-3M2 3h20v2H2z\"/>",
  "camera-line": "<path fill=\"currentColor\" d=\"m9.828 5l-2 2H4v12h16V7h-3.828l-2-2zM9 3h6l2 2h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4zm3 15a5.5 5.5 0 1 1 0-11a5.5 5.5 0 0 1 0 11m0-2a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7\"/>",
  "check-line": "<path fill=\"currentColor\" d=\"m10 15.17l9.192-9.191l1.414 1.414L10 17.999l-6.364-6.364l1.414-1.414z\"/>",
  "information-line": "<path fill=\"currentColor\" d=\"M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m0-2a8 8 0 1 0 0-16a8 8 0 0 0 0 16M11 7h2v2h-2zm0 4h2v6h-2z\"/>",
  "file-text-line": "<path fill=\"currentColor\" d=\"M21 8v12.993A1 1 0 0 1 20.007 22H3.993A.993.993 0 0 1 3 21.008V2.992C3 2.455 3.449 2 4.002 2h10.995zm-2 1h-5V4H5v16h14zM8 7h3v2H8zm0 4h8v2H8zm0 4h8v2H8z\"/>",
  "checkbox-circle-line": "<path fill=\"currentColor\" d=\"M4 12a8 8 0 1 1 16 0a8 8 0 0 1-16 0m8-10C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10S17.523 2 12 2m5.457 7.457l-1.414-1.414L11 13.086l-2.793-2.793l-1.414 1.414L11 15.914z\"/>",
  "alert-line": "<path fill=\"currentColor\" d=\"m12.866 3l9.526 16.5a1 1 0 0 1-.866 1.5H2.474a1 1 0 0 1-.866-1.5L11.134 3a1 1 0 0 1 1.732 0m-8.66 16h15.588L12 5.5zM11 16h2v2h-2zm0-7h2v5h-2z\"/>",
  "keyboard-line": "<path fill=\"currentColor\" d=\"M3 17h18v2H3zm0-6h3v3H3zm5 0h3v3H8zM3 5h3v3H3zm10 0h3v3h-3zm5 0h3v3h-3zm-5 6h3v3h-3zm5 0h3v3h-3zM8 5h3v3H8z\"/>",
  "sparkling-2-fill": "<path fill=\"currentColor\" d=\"m17 1.208l1.32 2.473L20.792 5L18.32 6.319L17 8.792l-1.318-2.473l-2.473-1.32l2.473-1.318zM8 4.333l2.667 5l5 2.667l-5 2.667l-2.666 5l-2.667-5l-5-2.667l5-2.667zm11.667 12l-1.666-3.125l-1.667 3.125L13.209 18l3.125 1.667l1.667 3.125l1.666-3.125L22.792 18z\"/>",
};

export type RiIconName =
  | 'menu-line'
  | 'close-line'
  | 'more-2-fill'
  | 'notification-3-line'
  | 'dashboard-3-line'
  | 'user-3-line'
  | 'book-2-line'
  | 'add-line'
  | 'question-line'
  | 'search-line'
  | 'arrow-left-s-line'
  | 'arrow-right-s-line'
  | 'arrow-go-back-line'
  | 'arrow-go-forward-line'
  | 'download-2-line'
  | 'file-copy-line'
  | 'upload-2-line'
  | 'history-line'
  | 'drag-move-2-line'
  | 'refresh-line'
  | 'pencil-line'
  | 'delete-bin-line'
  | 'film-line'
  | 'apps-line'
  | 'list-unordered'
  | 'slideshow-line'
  | 'camera-line'
  | 'check-line'
  | 'information-line'
  | 'file-text-line'
  | 'checkbox-circle-line'
  | 'alert-line'
  | 'keyboard-line'
  | 'sparkling-2-fill';

export function Ri({
  name,
  size = 20,
  className,
  label,
  ...rest
}: {
  name: RiIconName;
  size?: number;
  className?: string;
  label?: string;
} & SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      className={className}
      {...rest}
    >
      <g dangerouslySetInnerHTML={{ __html: PATHS[name] ?? '' }} />
    </svg>
  );
}
