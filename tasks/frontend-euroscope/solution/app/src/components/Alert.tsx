import { JSX } from "solid-js";
import { Information, Warning } from "./Icon";

type AlertType = "info" | "caut" | "warn";

const SKIN: Record<AlertType, { box: string; icon: string; title: string }> = {
  info: {
    box: "bg-scope-info border-scope-infofg/40",
    icon: "text-scope-infofg",
    title: "Information",
  },
  caut: {
    box: "bg-scope-caut border-scope-cautfg/40",
    icon: "text-scope-cautfg",
    title: "Caution",
  },
  warn: {
    box: "bg-scope-warn border-scope-warnfg/40",
    icon: "text-scope-warnfg",
    title: "Warning",
  },
};

export default function Alert(props: {
  type: AlertType;
  children: JSX.Element;
}) {
  const skin = SKIN[props.type];
  return (
    <div class={`rounded-lg border p-3 flex flex-col gap-1.5 ${skin.box}`}>
      <div class="flex items-center gap-2">
        <span class={skin.icon}>
          {props.type === "info" ? <Information size={20} /> : <Warning size={20} />}
        </span>
        <h2 class="text-scope-fg1 text-base font-medium">{skin.title}</h2>
      </div>
      <div class="text-sm text-scope-fg2 leading-relaxed">{props.children}</div>
    </div>
  );
}
