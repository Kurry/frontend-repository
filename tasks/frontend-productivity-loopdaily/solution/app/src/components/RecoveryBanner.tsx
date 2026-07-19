import { useAtom } from "jotai";
import { recoveryAtom, retryRecoveryAtom, resetAppAtom, addToastAtom } from "../store";

export default function RecoveryBanner() {
  const [recovery] = useAtom(recoveryAtom);
  const [, retry] = useAtom(retryRecoveryAtom);
  const [, reset] = useAtom(resetAppAtom);
  const [, addToast] = useAtom(addToastAtom);

  if (!recovery.active || !recovery.message) return null;

  const handleRetry = () => {
    const restored = retry();
    addToast(
      restored ? "Last valid snapshot restored." : "No backup snapshot available.",
      restored ? "success" : "info"
    );
  };

  const handleReset = () => {
    reset();
    addToast("All data reset to a clean state.", "info");
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mx-4 mt-3 max-w-2xl md:mx-auto rounded-lg border border-[#FFB020] bg-[#FFFBEB] px-4 py-3 text-sm text-[#1B2430]"
    >
      <p className="mb-3 font-medium">{recovery.message}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleRetry}
          className="btn-primary px-4 py-2 text-sm font-medium"
          data-action="recovery-retry"
        >
          Retry
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="btn-secondary px-4 py-2 text-sm font-medium"
          data-action="recovery-reset"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
