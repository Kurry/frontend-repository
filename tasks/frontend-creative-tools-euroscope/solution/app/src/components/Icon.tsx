import { JSX } from "solid-js";

// One consistent icon set (24x24 filled glyphs, one stroke weight/style) for
// the header badge, alert icons, check marks, and control icons. Icons that
// convey meaning on their own take a `label` (role="img" + aria-label);
// icons that sit next to a text label stay decorative (aria-hidden).

type IconProps = {
  size?: number;
  class?: string;
  style?: JSX.CSSProperties;
  label?: string;
};

function svg(path: string, rule?: "evenodd") {
  return (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={props.size ?? 16}
      height={props.size ?? 16}
      fill="currentColor"
      fill-rule={rule}
      role={props.label ? "img" : undefined}
      aria-label={props.label}
      aria-hidden={props.label ? undefined : "true"}
      class={props.class}
      style={props.style}
    >
      <path d={path} />
    </svg>
  );
}

const ArrowUp = svg(
  "M13.0001 7.82843V20H11.0001V7.82843L5.63614 13.1924L4.22192 11.7782L12.0001 4L19.7783 11.7782L18.3641 13.1924L13.0001 7.82843Z",
);
export const ArrowRight = (p: IconProps) => (
  <ArrowUp size={p.size} class={p.class} style={{ transform: "rotate(90deg)" }} />
);
export const ArrowLeft = (p: IconProps) => (
  <ArrowUp size={p.size} class={p.class} style={{ transform: "rotate(270deg)" }} />
);
export const Download = svg(
  "M3 19H21V21H3V19ZM13 13.1716L19.0711 7.1005L20.4853 8.51472L12 17L3.51472 8.51472L4.92893 7.1005L11 13.1716V2H13V13.1716Z",
);
export const Upload = svg(
  "M3 19H21V21H3V19ZM13 5.82843V17H11V5.82843L4.92893 11.8995L3.51472 10.4853L12 2L20.4853 10.4853L19.0711 11.8995L13 5.82843Z",
);
export const Swap = svg(
  "M16.0503 12.0498L21 16.9996L16.0503 21.9493L14.636 20.5351L17.172 17.9988L4 17.9996V15.9996L17.172 15.9988L14.636 13.464L16.0503 12.0498ZM7.94975 2.0498L9.36396 3.46402L6.828 5.9988L20 5.99955V7.99955L6.828 7.9988L9.36396 10.5351L7.94975 11.9493L3 6.99955L7.94975 2.0498Z",
);
export const Reset = svg(
  "M18.5374 19.5674C16.7844 21.0831 14.4993 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 14.1361 21.3302 16.1158 20.1892 17.7406L17 12H20C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C14.1502 20 16.1022 19.1517 17.5398 17.7716L18.5374 19.5674Z",
);
export const Check = svg("M4 12l6 6L20 4l-1.6-1.4L10 14.6 5.4 10 4 12Z");
export const Information = svg(
  "M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM11 7H13V9H11V7ZM11 11H13V17H11V11Z",
  "evenodd",
);
export const Warning = svg(
  "M12 2L23 21H1L12 2ZM11 9H13V15H11V9ZM11 17H13V19H11V17Z",
  "evenodd",
);
export const UndoIcon = svg(
  "M8 7V3L2 9l6 6v-4c3.5 0 6.6 1.4 8.9 4.1C16 10.7 12.5 7.3 8 7Z",
);
export const RedoIcon = svg(
  "M16 7V3l6 6-6 6v-4c-3.5 0-6.6 1.4-8.9 4.1C8 10.7 11.5 7.3 16 7Z",
);
export const Search = svg(
  "M10 2a8 8 0 1 0 4.9 14.3l5.4 5.4 1.4-1.4-5.4-5.4A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z",
);
export const Close = svg(
  "M12 10.6 6.7 5.3 5.3 6.7 10.6 12l-5.3 5.3 1.4 1.4 5.3-5.3 5.3 5.3 1.4-1.4-5.3-5.3 5.3-5.3-1.4-1.4-5.3 5.3Z",
);
export const Copy = svg(
  "M7 2h11a1 1 0 0 1 1 1v13h-2V4H7V2ZM4 6h11a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm1 2v12h9V8H5Z",
);
export const ImportIcon = svg(
  "M12 3v8.2l3.1-3.1 1.4 1.4L12 14 7.5 9.5l1.4-1.4L12 11.2V3ZM4 17h16v2H4v-2Z",
);
export const SnapshotIcon = svg(
  "M9 3h6l2 3h3a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3l2-3Zm3 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z",
);
export const Trash = svg(
  "M9 3h6v2h5v2h-2v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7H4V5h5V3Zm2 4v11h2V7h-2Zm4 0v11h2V7h-2Z",
);
export const Dropdown = svg(
  "M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z",
);
