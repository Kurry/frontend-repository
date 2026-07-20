import { createForm } from "@tanstack/solid-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { Show, createEffect, on } from "solid-js";
import { Motion } from "@motionone/solid";
import { state, setName, joinRoom, leaveRoom, setRoomIdle } from "../store";
import { PeerIdentitySchema, JoinSessionSchema } from "../schemas";
import { usePrefersReducedMotion } from "../reducedMotion";

const STATUS_LABEL: Record<string, string> = {
  idle: "Not connected",
  connecting: "Connecting…",
  waiting: "Waiting for peer…",
  disconnected: "Disconnected",
};

const STATUS_CLASS: Record<string, string> = {
  idle: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  connecting: "bg-amber-200 text-amber-800 dark:bg-amber-500/30 dark:text-amber-300",
  waiting: "bg-sky-200 text-sky-800 dark:bg-sky-500/30 dark:text-sky-300",
  disconnected: "bg-rose-200 text-rose-800 dark:bg-rose-500/30 dark:text-rose-300",
};

export default function SessionPanel() {
  const reducedMotion = usePrefersReducedMotion();
  const nameForm = createForm(() => ({
    defaultValues: {
      displayName: state.identity.name,
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      setName(value.displayName);
    },
  }));

  const roomForm = createForm(() => ({
    defaultValues: {
      roomId: state.room.roomId,
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
       if (state.room.status === "connecting" || state.room.status === "waiting") return;
       joinRoom(value.roomId);
    },
    onSubmitInvalid: () => {
      setRoomIdle();
    },
  }));

  // Auto-submit name form on valid input change
  createEffect(on(() => nameForm.state.values.displayName, () => {
    nameForm.handleSubmit();
  }));

  // Keep name form in sync if state.identity.name changes externally (e.g. Session Pack import)
  createEffect(on(() => state.identity.name, (newName) => {
    if (nameForm.state.values.displayName !== newName) {
      nameForm.setFieldValue("displayName", newName);
    }
  }));

  // Keep room form in sync if state.room.roomId changes externally
  createEffect(on(() => state.room.roomId, (newId) => {
    roomForm.setFieldValue("roomId", newId);
  }));

  const sessionActive = () => state.room.status === "connecting" || state.room.status === "waiting";

  return (
    <section
      class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-800/60 flex flex-col"
      data-testid="session-panel"
    >
      <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Session
      </h2>

      <div class="mb-4">
        <nameForm.Field
          name="displayName"
          validators={{ onChange: PeerIdentitySchema.shape.displayName }}
        >
          {(field) => (
            <div class="relative">
              <label class="mb-1 block text-xs font-medium text-slate-500" for="peer-name">
                Your name
              </label>
              <input
                id="peer-name"
                class="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-1.5 text-sm transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:focus:ring-sky-900"
                value={field().state.value}
                onInput={(e) => field().handleChange(e.target.value)}
                onBlur={field().handleBlur}
                data-testid="peer-name-input"
              />
              <Show when={field().state.meta.errors.length > 0}>
                <Motion.p
                  initial={reducedMotion() ? false : { opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  class="mt-1 text-xs text-rose-500"
                  role="alert"
                >
                  {field().state.meta.errors[0]?.toString()}
                </Motion.p>
              </Show>
            </div>
          )}
        </nameForm.Field>
      </div>

      <div class="mb-4">
        <label class="mb-1 block text-xs font-medium text-slate-500">Client ID</label>
        <div
          class="truncate rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/40"
          data-testid="client-id"
        >
          {state.identity.clientId}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          roomForm.handleSubmit();
        }}
        class="mb-4"
        noValidate
      >
        <roomForm.Field
          name="roomId"
          validators={{ onSubmit: JoinSessionSchema.shape.roomId }}
        >
          {(field) => (
            <div class="mb-2 relative">
              <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400" for="room-id">
                Room / peer identifier
              </label>
              <input
                id="room-id"
                class="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-1.5 text-sm transition focus:border-sky-400 focus:ring-2 focus:ring-sky-300 focus-visible:outline-none dark:border-slate-700 dark:focus:ring-sky-800"
                placeholder="e.g. sunset-otter-42"
                value={field().state.value}
                onInput={(e) => field().handleChange(e.target.value)}
                onBlur={field().handleBlur}
                aria-invalid={field().state.meta.errors.length > 0 ? "true" : "false"}
                aria-describedby={field().state.meta.errors.length > 0 ? "roomId-error" : undefined}
                data-testid="room-id-input"
              />
              <Show when={field().state.meta.errors.length > 0}>
                <Motion.p
                  id="roomId-error"
                  initial={reducedMotion() ? false : { opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  class="mt-1 text-xs text-rose-600"
                  role="alert"
                  aria-live="assertive"
                >
                  {field().state.meta.errors[0]?.toString()}
                </Motion.p>
              </Show>
            </div>
          )}
        </roomForm.Field>

        <div class="flex gap-2">
          <button
            type="submit"
            class="touch-target flex-1 rounded-lg bg-sky-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-600 hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={sessionActive()}
            data-testid="join-room-button"
          >
            Join Room
          </button>
          <button
            type="button"
            class="touch-target flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
            disabled={!sessionActive()}
            onClick={leaveRoom}
            data-testid="leave-room-button"
          >
            Leave Room
          </button>
        </div>
      </form>

      <div class="mt-auto">
        <span class="mb-1 block text-xs font-medium text-slate-500">Connection status</span>
        <div aria-live="polite">
          <span
            class={`inline-block rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-300 ${STATUS_CLASS[state.room.status]}`}
            data-testid="connection-badge"
            data-status={state.room.status}
          >
            {STATUS_LABEL[state.room.status]}
          </span>
          <Show when={state.room.status === "waiting"}>
            <p class="mt-2 text-xs text-slate-400">
              Waiting for a peer to join room "{state.room.roomId}". No peer has connected.
            </p>
          </Show>
          <Show when={state.room.status === "disconnected"}>
            <p class="mt-2 text-xs text-slate-400">
              Session left. No peer is connected.
            </p>
          </Show>
        </div>
      </div>
    </section>
  );
}
