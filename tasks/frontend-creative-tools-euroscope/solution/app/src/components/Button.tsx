import { JSX, splitProps } from "solid-js";

export default function Button(
  props: {
    variant?: "primary" | "ghost";
    square?: boolean;
    children: JSX.Element;
  } & JSX.ButtonHTMLAttributes<HTMLButtonElement>,
) {
  const [local, other] = splitProps(props, ["variant", "square", "children", "class"]);
  const primary = local.variant === "primary";

  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-md border-2 text-sm font-medium " +
    "transition-all duration-100 select-none cursor-pointer active:scale-[0.98] " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-scope-accent focus-visible:ring-offset-1 " +
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100";

  const size = local.square ? "h-[30px] w-[30px] p-0" : "h-[30px] px-3";

  const skin = primary
    ? "bg-scope-accent border-scope-accent text-white hover:border-scope-accent2 hover:shadow-md active:bg-scope-accent2"
    : "bg-scope-bg2 border-scope-bg2 text-scope-fg1 hover:border-scope-bg3 hover:shadow-sm active:bg-scope-bg3";

  return (
    <button class={`${base} ${size} ${skin} ${local.class ?? ""}`} {...other}>
      {local.children}
    </button>
  );
}
