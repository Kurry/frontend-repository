import { Match, Switch } from "solid-js";
import Progress from "./components/Progress";
import StepUpload from "./pages/StepUpload";
import StepColours from "./pages/StepColours";
import StepBitmaps from "./pages/StepBitmaps";
import StepDownload from "./pages/StepDownload";
import { state } from "./store";

export default function App() {
  return (
    <div class="relative min-h-screen">
      {/* soft radial accent wash */}
      <div
        class="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 0%, rgba(37,99,235,0.08), transparent 70%)",
        }}
      />
      <div class="relative mx-auto flex w-full max-w-[600px] flex-col gap-5 px-4 py-8">
        <header class="flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-md bg-scope-accent text-sm font-semibold text-white">
            ES
          </div>
          <span class="text-base font-semibold text-scope-fg1">
            Custom EuroScope
          </span>
          <span class="ml-auto text-xs text-scope-fg2">theme &amp; icon patcher</span>
        </header>

        <Progress current={state.step} />

        <Switch>
          <Match when={state.step === 0}>
            <StepUpload />
          </Match>
          <Match when={state.step === 1}>
            <StepColours />
          </Match>
          <Match when={state.step === 2}>
            <StepBitmaps />
          </Match>
          <Match when={state.step === 3}>
            <StepDownload />
          </Match>
        </Switch>
      </div>
    </div>
  );
}
