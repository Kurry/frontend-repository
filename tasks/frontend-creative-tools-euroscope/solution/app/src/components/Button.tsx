import { JSX, splitProps } from "solid-js";

// Shared button chrome: eased border/shadow/scale on hover, an unmistakable
// press nudge that lands the instant the pointer goes down (`active:` with no
// transition delay), and a visible keyboard focus ring on every variant.

export default function Button(
  props: {
    variant?: "primary" | "ghost";
    small?: boolean;
    children: JSX.Element;
  } & JSX.ButtonHTMLAttributes<HTMLButtonElement>,
) {
  const [local, other] = splitProps(props, ["variant", "small", "children", "class"]);
  const primary = local.variant === "primary";

  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-md border-2 text-sm font-medium " +
    "select-none cursor-pointer transition-[border-color,background-color,box-shadow,transform] duration-150 ease-out " +
    "active:transition-none active:translate-y-px active:scale-[0.96] " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-scope-accent focus-visible:ring-offset-1 " +
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:translate-y-0 disabled:active:scale-100";

  // Primary wizard actions keep a comfortable >=44px tap target at every width.
  const size = local.small ? "h-9 px-2.5 text-xs" : "h-[46px] px-4";

  const skin = primary
    ? "bg-scope-accent border-scope-accent text-white hover:border-scope-accent2 hover:shadow-md active:bg-scope-accent2 active:shadow-inner"
    : "bg-scope-bg2 border-scope-bg2 text-scope-fg1 hover:border-scope-bg3 hover:bg-white hover:shadow-sm active:bg-scope-bg3 active:shadow-inner";

  return (
    <button class={`${base} ${size} ${skin} ${local.class ?? ""}`} {...other}>
      {local.children}
    </button>
  );
}
