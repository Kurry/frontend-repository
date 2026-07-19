import { useAtom } from "jotai";
import { toastsAtom, removeToastAtom } from "../store";

export default function Toast() {
  const [toasts] = useAtom(toastsAtom);
  const [, remove] = useAtom(removeToastAtom);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => {
        const bgColor =
          t.type === "success"
            ? "bg-[#0F9D74]"
            : t.type === "error"
            ? "bg-[#EF4444]"
            : "bg-[#475569]";

        const isAlert = t.type === "error" || t.type === "info";

        return (
          <div
            key={t.id}
            className={`${bgColor} text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium cursor-pointer toast-enter max-w-xs text-center pointer-events-auto`}
            onClick={() => remove(t.id)}
            role={isAlert ? "alert" : "status"}
            aria-live={isAlert ? "assertive" : "polite"}
          >
            {t.text}
          </div>
        );
      })}
    </div>
  );
}
