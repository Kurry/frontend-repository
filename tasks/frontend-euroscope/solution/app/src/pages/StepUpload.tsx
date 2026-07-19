import { createSignal } from "solid-js";
import Alert from "../components/Alert";
import Button from "../components/Button";
import { ArrowRight, Check } from "../components/Icon";
import { goNext, setFileName, state } from "../store";

export default function StepUpload() {
  const [name, setName] = createSignal(state.fileName);

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
            <Check size={16} />
          </span>
          <span>
            Loaded sample: <span class="font-medium text-scope-fg1">{name()}</span>
          </span>
        </div>

        <input
          type="file"
          accept=".exe"
          aria-label="Select EuroScope executable"
          class="text-sm text-scope-fg2 file:mr-3 file:h-[27px] file:cursor-pointer file:rounded-md file:border-2 file:border-scope-bg2 file:bg-scope-bg2 file:px-2 file:text-sm hover:file:border-scope-bg3"
          onChange={(e) => {
            const f = e.currentTarget.files?.[0];
            if (f) {
              setName(f.name);
              setFileName(f.name);
            }
          }}
        />
        <p class="text-xs text-scope-fg2">
          Optional. Keep the loaded sample to explore the patcher without a file
          of your own.
        </p>
      </div>

      <div class="flex justify-end">
        <Button variant="primary" class="w-[110px]" onClick={() => goNext()}>
          <span>Continue</span>
          <ArrowRight />
        </Button>
      </div>
    </>
  );
}
