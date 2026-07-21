import { createSignal } from "solid-js";
import Alert from "../components/Alert";
import Button from "../components/Button";
import { ArrowRight, Check, Upload } from "../components/Icon";
import { goNext, setFileName, state } from "../store";

export default function StepUpload() {
  const [dragging, setDragging] = createSignal(false);
  let fileRef: HTMLInputElement | undefined;

  const acceptFile = (f: File | undefined) => {
    if (!f) return;
    setFileName(f.name);
  };

  return (
    <>
      <div class="rounded-lg border border-scope-bg3 bg-white p-4">
        <p class="text-sm leading-relaxed">
          This app patches a EuroScope binary to apply theme and icon
          customisations. A sample scope is already loaded so you can try the
          patcher right away; all processing happens locally in your browser.
        </p>
      </div>

      <Alert type="info">
        <p>
          All processing happens locally within your web browser, and your
          uploaded files never leave your computer.
        </p>
      </Alert>

      <Alert type="caut">
        <p>
          Upload an original copy of EuroScope, not a binary already patched
          with this app or a similar tool.
        </p>
      </Alert>

      <div class="flex flex-col gap-2.5 rounded-lg border border-scope-bg3 bg-white p-4">
        <h2 class="text-base font-medium text-scope-fg1">Select EuroScope.exe</h2>

        <div class="flex items-center gap-2 rounded-md bg-scope-info px-3 py-2 text-sm text-scope-fg2">
          <span class="text-scope-infofg">
            <Check size={16} label="Sample loaded" />
          </span>
          <span>
            Loaded sample:{" "}
            <span class="font-medium text-scope-fg1">{state.fileName}</span>
          </span>
        </div>

        <div
          classList={{
            "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors duration-150":
              true,
            "border-scope-accent bg-scope-info": dragging(),
            "border-scope-bg3 bg-scope-bg2/40 hover:border-scope-accent2 hover:bg-scope-bg2/70":
              !dragging(),
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            acceptFile(e.dataTransfer?.files?.[0]);
          }}
          onClick={() => fileRef?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileRef?.click();
            }
          }}
          role="button"
          tabindex="0"
          aria-label="Drop a EuroScope executable here, or activate to browse"
        >
          <span class="text-scope-fg2">
            <Upload size={20} />
          </span>
          <p class="text-sm font-medium text-scope-fg1">
            Drop your EuroScope.exe here
          </p>
          <p class="text-xs text-scope-fg2">or click to browse — .exe only</p>
          <input
            ref={fileRef}
            type="file"
            accept=".exe"
            aria-label="Select EuroScope executable"
            class="hidden"
            onChange={(e) => {
              acceptFile(e.currentTarget.files?.[0]);
              e.currentTarget.value = "";
            }}
          />
        </div>
        <p class="text-xs text-scope-fg2">
          Optional. Keep the loaded sample to explore the patcher without a file
          of your own.
        </p>
      </div>

      <div class="flex justify-end">
        <Button variant="primary" class="w-[120px]" onClick={() => goNext()}>
          <span>Continue</span>
          <ArrowRight />
        </Button>
      </div>
    </>
  );
}
