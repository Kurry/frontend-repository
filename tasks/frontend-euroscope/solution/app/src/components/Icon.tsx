import { JSX } from "solid-js";

function svg(path: string) {
  return (props: { size?: number; class?: string; style?: JSX.CSSProperties }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={props.size ?? 16}
      height={props.size ?? 16}
      fill="currentColor"
      aria-hidden="true"
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
export const ArrowRight = (p: { size?: number; class?: string }) => (
  <ArrowUp size={p.size} class={p.class} style={{ transform: "rotate(90deg)" }} />
);
export const ArrowLeft = (p: { size?: number; class?: string }) => (
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
  "M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11 7H13V9H11V7ZM11 11H13V17H11V11Z",
);
export const Warning = (p: { size?: number; class?: string }) => (
  <Information size={p.size} class={p.class} style={{ transform: "scaleY(-1)" }} />
);
export const Dropdown = svg(
  "M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z",
);
