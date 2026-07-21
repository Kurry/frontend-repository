<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { createForm } from 'felte';
  import { validator } from '@felte/validator-zod';
  import {
    X, Copy, Check, DownloadSimple, FileCode, MarkdownLogo, UploadSimple,
    Certificate as CertificateIcon, ShieldCheck
  } from 'phosphor-svelte';
  import { importFormSchema } from '../contracts';
  import { consoleStore } from '../console-store.svelte';
  import { focusTrap } from '../actions';
  import { formatTimestamp } from '../format';

  let copied = $state<string | null>(null);
  const certificateStage = $derived(consoleStore.selectedRun.stages.find((stage) => stage.name === consoleStore.certificateStageName));
  const activePreview = $derived(consoleStore.exportTab === 'json' ? consoleStore.jsonPreview : consoleStore.markdownPreview);

  const { form: importForm, errors: importErrors, data: importData, setFields } = createForm<{ payload: string }>({
    initialValues: { payload: consoleStore.importDraft },
    extend: validator({ schema: importFormSchema }),
    validateOnMount: true,
    onSubmit(values) {
      consoleStore.importPackageText(values.payload);
    }
  });
  const importValid = $derived(importFormSchema.safeParse($importData).success);
  const importIssue = $derived.by(() => {
    const checked = importFormSchema.safeParse($importData);
    return checked.success ? '' : checked.error.issues[0]?.message ?? 'payload is invalid';
  });

  onMount(async () => {
    await tick();
    const first = document.querySelector<HTMLElement>('[data-modal-card] textarea, [data-modal-card] button');
    first?.focus();
  });

  function close() {
    consoleStore.closeModal();
  }

  function escape(event: KeyboardEvent) {
    if (event.key === 'Escape') close();
  }

  async function writeClipboard(value: string, key: string) {
    try {
            try {
        await navigator.clipboard.writeText(value);
      } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    copied = key;
    consoleStore.showToast(key === 'fingerprint' ? 'Fingerprint copied' : 'Preview copied');
    setTimeout(() => { if (copied === key) copied = null; }, 1800);
  }

  function downloadPreview() {
    const json = consoleStore.exportTab === 'json';
    const blob = new Blob([activePreview], { type: json ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${consoleStore.selectedRun.id.toLowerCase()}-${json ? 'acceptance-package.json' : 'certificate-chain.md'}`;
    anchor.click();
    URL.revokeObjectURL(url);
    consoleStore.showToast(json ? 'Acceptance package downloaded' : 'Certificate chain downloaded');
  }
</script>

<svelte:window onkeydown={escape} />

<div class="modal-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && close()}>
  <div
    data-modal-card
    class:wide={consoleStore.modal === 'export'}
    class="modal-card surface"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    use:focusTrap
  >
    {#if consoleStore.modal === 'export'}
      <header class="modal-head">
        <div>
          <span class="eyebrow">Live acceptance artifact</span>
          <h2 id="modal-title">Export acceptance package</h2>
          <p>Compiled from the current recorded store state · {consoleStore.selectedRun.id}</p>
        </div>
        <button type="button" class="close-button" aria-label="Close export" onclick={close}><X size={19} weight="bold" aria-hidden="true" /></button>
      </header>

      <div class="format-tabs" role="tablist" aria-label="Export format">
        <button
          type="button" role="tab" aria-selected={consoleStore.exportTab === 'json'}
          class:active={consoleStore.exportTab === 'json'} onclick={() => consoleStore.exportTab = 'json'}
        ><FileCode size={17} weight="bold" /> Acceptance Package JSON</button>
        <button
          type="button" role="tab" aria-selected={consoleStore.exportTab === 'markdown'}
          class:active={consoleStore.exportTab === 'markdown'} onclick={() => consoleStore.exportTab = 'markdown'}
        ><MarkdownLogo size={17} weight="bold" /> Certificate Chain Markdown</button>
      </div>

      <div class="preview-meta">
        <span>{consoleStore.exportTab === 'json' ? 'application/json' : 'text/markdown'}</span>
        <span>Regenerated {new Date(consoleStore.exportedAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' })}</span>
      </div>
      <pre class="preview" aria-label={`${consoleStore.exportTab} export preview`}>{activePreview}</pre>
      <footer class="modal-actions">
        <button type="button" class="action" onclick={() => writeClipboard(activePreview, consoleStore.exportTab)}>
          {#if copied === consoleStore.exportTab}<Check size={17} weight="bold" /> Copied{:else}<Copy size={17} weight="bold" /> Copy{/if}
        </button>
        <button type="button" class="action primary" onclick={downloadPreview}><DownloadSimple size={17} weight="bold" /> Download</button>
      </footer>

    {:else if consoleStore.modal === 'import'}
      <header class="modal-head">
        <div>
          <span class="eyebrow">Replace selected run state</span>
          <h2 id="modal-title">Import acceptance package</h2>
          <p>Valid JSON replaces stages, certificates, gate notes, and timeline.</p>
        </div>
        <button type="button" class="close-button" aria-label="Close import" onclick={close}><X size={19} weight="bold" aria-hidden="true" /></button>
      </header>

      <form use:importForm class="import-form">
        <label for="import-payload">Acceptance Package JSON <span>Required</span></label>
        <textarea
          id="import-payload" name="payload" rows="16"
          value={consoleStore.importDraft}
          aria-describedby="import-error"
          aria-invalid={Boolean($importErrors.payload || consoleStore.importError)}
          oninput={(event) => {
            const value = event.currentTarget.value;
            consoleStore.importDraft = value;
            consoleStore.importError = '';
            setFields('payload', value, true);
          }}
        ></textarea>
        {#if importIssue || $importErrors.payload || consoleStore.importError}
          <p id="import-error" class="import-error" role="alert">{importIssue || $importErrors.payload?.[0] || consoleStore.importError}</p>
        {:else}
          <p class="schema-hint">Schema: gate-console.acceptance-package.v1 · exactly five ordered stages</p>
        {/if}
        <footer class="modal-actions">
          <button type="button" class="action" onclick={close}>Cancel</button>
          <button type="submit" class="action primary" disabled={!importValid}><UploadSimple size={17} weight="bold" /> Import package</button>
        </footer>
      </form>

    {:else if consoleStore.modal === 'certificate' && certificateStage?.certificate}
      <header class="modal-head certificate-head">
        <div class="certificate-title-icon"><CertificateIcon size={26} weight="fill" /></div>
        <div>
          <span class="eyebrow">Stage acceptance certificate</span>
          <h2 id="modal-title">{certificateStage.name}</h2>
          <p>Issued {formatTimestamp(certificateStage.certificate.issuedAt)} UTC</p>
        </div>
        <button type="button" class="close-button" aria-label="Close certificate" onclick={close}><X size={19} weight="bold" aria-hidden="true" /></button>
      </header>
      <div class="fingerprint-block">
        <span>Fingerprint hash</span>
        <code>{certificateStage.certificate.fingerprint}</code>
        <button type="button" class="action" onclick={() => writeClipboard(certificateStage!.certificate!.fingerprint, 'fingerprint')}>
          {#if copied === 'fingerprint'}<Check size={16} weight="bold" /> Copied{:else}<Copy size={16} weight="bold" /> Copy fingerprint{/if}
        </button>
      </div>
      <div class="certificate-gates">
        <span class="gate-list-label">Certified gate results · {certificateStage.gates.length}</span>
        {#each certificateStage.gates as gate}
          <div>
            <ShieldCheck size={17} weight={gate.state === 'pass' ? 'fill' : 'regular'} />
            <code>{gate.id}</code><strong>{gate.name}</strong>
            <span class={`severity severity-${gate.severity}`}>{gate.severity}</span>
            <span class:failed={gate.state === 'fail'} class="gate-result">{gate.state}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .modal-backdrop { position:fixed; inset:0; z-index:80; display:grid; place-items:center; padding:1rem; background:rgba(2,9,18,.68); backdrop-filter:blur(5px); animation:backdrop-in .24s ease both; }
  .modal-card { width:min(610px, 100%); max-height:calc(100vh - 2rem); overflow:auto; border-radius:.95rem; padding:1rem; opacity:1; transform:scale(1); transition:opacity .24s ease, transform .28s cubic-bezier(.2,.8,.2,1); animation:modal-in .28s cubic-bezier(.2,.8,.2,1) both; }
  .modal-card.wide { width:min(880px, 100%); }
  @keyframes backdrop-in { from { opacity:0; } to { opacity:1; } }
  @keyframes modal-in { from { opacity:0; transform:scale(.96); } to { opacity:1; transform:scale(1); } }
  .modal-head { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; padding:.15rem .15rem .9rem; }
  .eyebrow { color:#126f80; font-size:.57rem; font-weight:850; letter-spacing:.09em; text-transform:uppercase; }
  h2 { margin:.15rem 0 0; font-size:1.2rem; letter-spacing:-.02em; }
  .modal-head p { margin:.22rem 0 0; color:#546478; font-size:.67rem; }
  .close-button { flex:none; display:grid; place-items:center; width:2rem; height:2rem; color:inherit; background:transparent; border:1px solid transparent; border-radius:.45rem; cursor:pointer; }
  .close-button:hover { background:rgba(113,132,153,.12); border-color:rgba(113,132,153,.2); }
  .format-tabs { display:grid; grid-template-columns:1fr 1fr; padding:.25rem; background:#eef3f7; border:1px solid #dae3ec; border-radius:.62rem; }
  :global(.dark) .format-tabs { background:#091626; border-color:#263a50; }
  .format-tabs button { display:flex; align-items:center; justify-content:center; gap:.4rem; padding:.52rem; color:#546478; background:transparent; border:0; border-radius:.42rem; font-size:.68rem; font-weight:800; cursor:pointer; }
  .format-tabs button.active { color:#126f80; background:white; box-shadow:0 2px 8px rgba(30,48,76,.09); }
  :global(.dark) .format-tabs button.active { color:#69d7e8; background:#172a3f; }
  .preview-meta { display:flex; justify-content:space-between; gap:1rem; padding:.75rem .15rem .4rem; color:#66778d; font: .59rem var(--font-mono); }
  .preview { height:min(50vh, 480px); overflow:auto; margin:0; padding:.85rem; color:#cbe2f2; background:#07111f; border:1px solid #243a50; border-radius:.62rem; font: .65rem/1.55 var(--font-mono); white-space:pre; }
  .modal-actions { display:flex; justify-content:flex-end; gap:.5rem; padding-top:.85rem; }
  .import-form label { display:flex; justify-content:space-between; margin:.15rem 0 .4rem; font-size:.68rem; font-weight:800; }
  .import-form label span { color:#bd3d4e; font-size:.56rem; text-transform:uppercase; letter-spacing:.06em; }
  .import-form textarea { width:100%; min-height:16rem; resize:vertical; padding:.7rem; color:inherit; background:#f8fafc; border:1px solid #cad5e2; border-radius:.58rem; font: .67rem/1.5 var(--font-mono); }
  :global(.dark) .import-form textarea { background:#071421; border-color:#31475e; }
  .import-form textarea[aria-invalid="true"] { border-color:#df5265; box-shadow:0 0 0 2px rgba(223,82,101,.1); }
  .import-error { margin:.35rem 0 0; color:#d33f53; font-size:.66rem; }
  .schema-hint { margin:.35rem 0 0; color:#5c6b7e; font-size:.62rem; }
  .certificate-head { align-items:center; }
  .certificate-title-icon { flex:none; display:grid; place-items:center; width:2.8rem; height:2.8rem; color:#158961; background:#ddf6ed; border:1px solid #99dbc4; border-radius:.7rem; }
  :global(.dark) .certificate-title-icon { color:#45d4a2; background:#0d322a; border-color:#286b56; }
  .certificate-head > div:nth-child(2) { flex:1; }
  .fingerprint-block { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:.42rem .7rem; align-items:center; padding:.75rem; background:#f5f8fb; border:1px solid #dfe7ef; border-radius:.65rem; }
  :global(.dark) .fingerprint-block { background:#091727; border-color:#263b51; }
  .fingerprint-block > span { grid-column:1 / -1; color:#546478; font-size:.56rem; font-weight:850; text-transform:uppercase; letter-spacing:.08em; }
  .fingerprint-block code { min-width:0; overflow-wrap:anywhere; color:#286b78; font:650 .68rem/1.45 var(--font-mono); }
  :global(.dark) .fingerprint-block code { color:#77d7e6; }
  .certificate-gates { margin-top:.85rem; border:1px solid #dfe6ee; border-radius:.62rem; overflow:hidden; }
  :global(.dark) .certificate-gates { border-color:#283b50; }
  .gate-list-label { display:block; padding:.55rem .65rem; color:#6f8095; background:#f3f6f9; font-size:.57rem; font-weight:850; text-transform:uppercase; letter-spacing:.07em; }
  :global(.dark) .gate-list-label { background:#0a1726; }
  .certificate-gates > div { display:grid; grid-template-columns:auto auto minmax(0,1fr) auto auto; align-items:center; gap:.5rem; padding:.55rem .65rem; border-top:1px solid #e2e8ef; font-size:.67rem; }
  :global(.dark) .certificate-gates > div { border-color:#26394d; }
  .certificate-gates > div > :global(svg) { color:#20a777; }
  .certificate-gates code { color:#66778d; font:650 .62rem var(--font-mono); }
  .certificate-gates strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:.68rem; }
  .severity { display:inline-block; border:1px solid; border-radius:.28rem; padding:.06rem .28rem; font-size:.53rem; font-weight:850; }
  .gate-result { color:#16875f; font-size:.57rem; font-weight:850; text-transform:uppercase; }
  .gate-result.failed { color:#d33e53; }
  @media (max-width:540px) {
    .modal-backdrop { padding:.4rem; align-items:end; }
    .modal-card { max-height:calc(100vh - .8rem); border-radius:.85rem .85rem .4rem .4rem; }
    .format-tabs button { align-items:flex-start; font-size:.61rem; }
    .preview { height:48vh; font-size:.59rem; }
    .fingerprint-block { grid-template-columns:1fr; }
    .fingerprint-block .action { justify-self:start; }
    .certificate-gates > div { grid-template-columns:auto auto minmax(0,1fr) auto; }
    .certificate-gates .gate-result { grid-column:3; }
  }
</style>
