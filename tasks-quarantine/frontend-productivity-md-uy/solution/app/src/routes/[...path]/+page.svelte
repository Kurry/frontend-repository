<script lang="ts">
	import '../../app.css';
	import { onMount } from 'svelte';
	import { Dialog } from 'bits-ui';
	import * as Y from 'yjs';
	import { marked } from 'marked';
	import {
		Sun,
		Moon,
		ArrowRight,
		Plus,
		Copy,
		DownloadSimple,
		ShareNetwork,
		Check,
		Package,
		X
	} from 'phosphor-svelte';
	import Editor from '$lib/components/Editor.svelte';
	import Preview from '$lib/components/Preview.svelte';
	import Presentation from '$lib/components/Presentation.svelte';
	import DocumentPackageModal from '$lib/components/DocumentPackageModal.svelte';
	import { initYjs } from '$lib/editor/initYjs';
	import { generateId, isValidId } from '$lib/utils';
	import { SEED_ROOM_ID, SEED_CONTENT } from '$lib/constants';
	import { installWebmcp } from '$lib/webmcp';
	import { ProfileSchema, JoinRoomSchema, type DocumentPackage } from '$lib/schemas';
	import { loadDocument, saveDocument } from '$lib/persistence';

	type EditorMode = 'edit' | 'preview' | 'presentation';

	let ready = $state(false);
	let roomId = $state('');
	let viewMode = $state<EditorMode>('edit');
	let theme = $state<'light' | 'dark'>('light');
	let joinId = $state('');
	let joinError = $state<string | null>(null);
	let isDesktop = $state(true);

	let shareOpen = $state(false);
	let isSyncing = $state(false);
	let shareTab = $state<'live' | 'static'>('live');
	let liveUrl = $state('');
	let staticUrl = $state('');
	let staticGenerated = $state(false);
	let copied = $state(false);

	let profileOpen = $state(false);
	let userName = $state('Anonymous');
	let userColor = $state('#559ede');
	let profileNameDraft = $state('');
	let profileColorDraft = $state('');
	let profileErrors = $state<{ displayName?: string; color?: string }>({});
	let profileValid = $state(false);
	let profileSavedFlash = $state(false);

	let contentCopied = $state(false);
	let packageOpen = $state(false);
	let packageCopied = $state(false);
	let packageDownloaded = $state(false);
	let downloaded = $state(false);
	let liveRegion = $state('');

	let showOnboarding = $state(false);
	let onboardingStep = $state(0);
	let readingMinutes = $state(1);
	let paneAnimKey = $state(0);

	// Do NOT put Y.Doc / Y.Text in $state — proxies break y-codemirror + persistence.
	let ydoc: Y.Doc | null = null;
	let ytext: Y.Text | null = null;
	let ytextRef = $state.raw<Y.Text | null>(null);
	let sourceText = $state('');
	let cleanup: () => void = () => {};

	const documentPackage = $derived<DocumentPackage>({
		schemaVersion: 'mduy-document-v1',
		roomId,
		markdown: sourceText,
		theme,
		profile: { displayName: userName, color: userColor }
	});

	const packageJson = $derived(JSON.stringify(documentPackage, null, 2));
	const connectedUsers = $derived(0);
	const syncLabel = $derived(
		isSyncing
			? `${connectedUsers} users connected`
			: `${connectedUsers} users connected · local only`
	);

	function resolveRoomId(): string {
		const path = window.location.pathname.replace(/^\/+/, '').split('/')[0];
		if (path && isValidId(path)) return path;
		window.history.replaceState({}, '', `/${SEED_ROOM_ID}`);
		return SEED_ROOM_ID;
	}

	function applyTheme(next: 'light' | 'dark') {
		theme = next;
		document.documentElement.classList.toggle('dark', next === 'dark');
		try {
			localStorage.setItem('mduy-theme', next);
		} catch {
			/* storage optional */
		}
	}

	function toggleTheme() {
		applyTheme(theme === 'dark' ? 'light' : 'dark');
	}

	function setContent(content: string) {
		if (!ydoc || !ytext) return;
		ydoc.transact(() => {
			if (ytext!.length > 0) ytext!.delete(0, ytext!.length);
			if (content.length > 0) ytext!.insert(0, content);
		});
		sourceText = content;
		if (roomId) saveDocument(roomId, content);
	}

	function announce(msg: string) {
		liveRegion = msg;
	}

	function copyContent() {
		const text = ytext?.toString() ?? '';
		navigator.clipboard?.writeText(text).catch(() => {});
		contentCopied = true;
		announce('Markdown copied');
		setTimeout(() => (contentCopied = false), 800);
		return text;
	}

	function downloadFile() {
		const content = ytext?.toString() ?? '';
		const blob = new Blob([content], { type: 'text/markdown' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'document.md';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		downloaded = true;
		announce('Markdown downloaded');
		setTimeout(() => (downloaded = false), 800);
		return content;
	}

	function copyPackage() {
		navigator.clipboard?.writeText(packageJson).catch(() => {});
		packageCopied = true;
		announce('Package copied');
		setTimeout(() => (packageCopied = false), 800);
		return packageJson;
	}

	function downloadPackage() {
		const blob = new Blob([packageJson], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'document-package.json';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		packageDownloaded = true;
		announce('Package downloaded');
		setTimeout(() => (packageDownloaded = false), 800);
		return packageJson;
	}

	function importPackage(data: DocumentPackage) {
		setContent(data.markdown);
		applyTheme(data.theme);
		userName = data.profile.displayName;
		userColor = data.profile.color;
		announce('Package imported');
	}

	function switchMode(mode: EditorMode) {
		if (viewMode === mode) return;
		viewMode = mode;
		paneAnimKey++;
	}

	function openShare() {
		const url = new URL(window.location.href);
		url.searchParams.set('sync', 'true');
		liveUrl = url.toString();
		shareTab = 'live';
		staticGenerated = false;
		staticUrl = '';
		shareOpen = true;
	}

	function toggleSync() {
		isSyncing = !isSyncing;
		const url = new URL(window.location.href);
		if (isSyncing) url.searchParams.set('sync', 'true');
		else url.searchParams.delete('sync');
		window.history.replaceState({}, '', url);
	}

	function generateStaticLink() {
		const content = ytext?.toString() ?? '';
		staticUrl = `${window.location.origin}/import?content=${encodeURIComponent(content)}`;
		staticGenerated = true;
	}

	function copyShareUrl(url: string) {
		navigator.clipboard?.writeText(url).catch(() => {});
		copied = true;
		announce('Link copied');
		setTimeout(() => (copied = false), 800);
	}

	function newDocument() {
		const id = generateId();
		window.location.href = `/${id}`;
	}

	function validateJoin(value: string) {
		const result = JoinRoomSchema.safeParse({ roomId: value.trim() });
		if (!result.success) {
			joinError = `roomId: ${result.error.issues[0]?.message ?? 'invalid'}`;
			return null;
		}
		joinError = null;
		return result.data.roomId;
	}

	function joinDocument() {
		const id = validateJoin(joinId);
		if (!id) return;
		window.location.href = `/${id}`;
	}

	function openProfile() {
		profileNameDraft = userName;
		profileColorDraft = userColor;
		validateProfileDraft(userName, userColor);
		profileOpen = true;
	}

	function validateProfileDraft(name: string, color: string) {
		const result = ProfileSchema.safeParse({ displayName: name, color });
		if (!result.success) {
			const errors: { displayName?: string; color?: string } = {};
			for (const issue of result.error.issues) {
				const key = issue.path[0] as 'displayName' | 'color' | undefined;
				if (key && !errors[key]) errors[key] = `${key}: ${issue.message}`;
			}
			profileErrors = errors;
			profileValid = false;
			return null;
		}
		profileErrors = {};
		profileValid = true;
		return result.data;
	}

	function onProfileNameInput(e: Event) {
		const v = (e.currentTarget as HTMLInputElement).value;
		profileNameDraft = v;
		validateProfileDraft(v, profileColorDraft);
	}

	function onProfileColorInput(e: Event) {
		const v = (e.currentTarget as HTMLInputElement).value;
		profileColorDraft = v;
		validateProfileDraft(profileNameDraft, v);
	}

	function saveProfile() {
		const data = validateProfileDraft(profileNameDraft, profileColorDraft);
		if (!data) return;
		userName = data.displayName;
		userColor = data.color;
		profileOpen = false;
		profileSavedFlash = true;
		announce('Profile saved');
		setTimeout(() => (profileSavedFlash = false), 900);
	}

	function updateReadingStats(text: string) {
		const words = text.trim() ? text.trim().split(/\s+/).length : 0;
		readingMinutes = Math.max(1, Math.ceil(words / 200));
	}

	onMount(() => {
		try {
			const savedTheme = localStorage.getItem('mduy-theme');
			if (savedTheme === 'dark' || savedTheme === 'light') applyTheme(savedTheme);
			const savedUser = localStorage.getItem('mduy-user');
			if (savedUser) {
				const u = JSON.parse(savedUser);
				if (u.name) userName = u.name;
				if (u.color) userColor = u.color;
			}
			if (!localStorage.getItem('mduy-onboarded')) showOnboarding = true;
		} catch {
			/* storage optional */
		}

		const mq = window.matchMedia('(min-width: 768px)');
		const syncDesktop = () => (isDesktop = mq.matches);
		syncDesktop();
		mq.addEventListener('change', syncDesktop);

		const onScroll = () => {
			const y = window.scrollY || document.documentElement.scrollTop || 0;
			document.documentElement.style.setProperty('--ambient-shift', `${Math.min(40, y * 0.08)}px`);
		};
		window.addEventListener('scroll', onScroll, { passive: true });

		if (new URLSearchParams(window.location.search).get('sync') === 'true') isSyncing = true;

		roomId = resolveRoomId();

		let disposed = false;
		initYjs(roomId).then((res) => {
			if (disposed) {
				res.cleanup();
				return;
			}
			ydoc = res.ydoc;
			ytext = res.ytext;
			ytextRef = res.ytext;
			cleanup = res.cleanup;

			const fromLs = loadDocument(roomId);
			if ((ytext?.length ?? 0) === 0 && fromLs != null && fromLs.length > 0) {
				ytext!.insert(0, fromLs);
			} else if (roomId === SEED_ROOM_ID && (ytext?.length ?? 0) === 0) {
				ytext!.insert(0, SEED_CONTENT);
			}

			sourceText = ytext!.toString();
			saveDocument(roomId, sourceText);
			updateReadingStats(sourceText);

			installWebmcp({
				setContent,
				switchMode,
				showPreview: () => {
					switchMode('preview');
					return marked.parse(ytext?.toString() ?? '', { gfm: true, breaks: true }) as string;
				},
				exportMarkdown: () => downloadFile(),
				exportJson: () => downloadPackage(),
				copyMarkdown: () => copyContent(),
				copyJson: () => copyPackage(),
				importArtifact: () => {
					packageOpen = true;
					return { ok: true, restored: false };
				},
				getState: () => ({
					roomId,
					viewMode,
					theme,
					isSyncing,
					sourceLength: ytext?.length ?? 0,
					sourcePreview: (ytext?.toString() ?? '').slice(0, 80)
				})
			});

			ready = true;
		});

		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js').catch(() => {});
		}

		return () => {
			disposed = true;
			mq.removeEventListener('change', syncDesktop);
			window.removeEventListener('scroll', onScroll);
			cleanup();
		};
	});

	$effect(() => {
		try {
			localStorage.setItem('mduy-user', JSON.stringify({ name: userName, color: userColor }));
		} catch {
			/* storage optional */
		}
	});

	$effect(() => {
		const yt = ytextRef;
		if (!yt) {
			sourceText = '';
			return;
		}
		sourceText = yt.toString();
		updateReadingStats(sourceText);
		const observer = () => {
			const next = yt.toString();
			sourceText = next;
			if (roomId) saveDocument(roomId, next);
			updateReadingStats(next);
		};
		yt.observe(observer);
		return () => {
			yt.unobserve(observer);
		};
	});

	function dismissOnboarding() {
		showOnboarding = false;
		try {
			localStorage.setItem('mduy-onboarded', '1');
		} catch {
			/* optional */
		}
	}
</script>

<a class="skip-link" href="#main-content">Skip to content</a>

<div class="flex h-screen w-full flex-col overflow-hidden">
	<header class="flex items-center justify-between gap-2 border-b px-3 py-2 sm:px-4">
		<nav class="flex min-w-0 items-center gap-1 text-xs" aria-label="Document breadcrumb">
			<a href="/" class="brand-mark text-foreground hover:text-primary chrome-btn truncate">md.uy</a>
			{#if roomId}
				<span class="text-foreground/30" aria-hidden="true">/</span>
				<span class="truncate pt-[2px] font-mono text-[0.8rem] sm:text-xs" data-testid="room-id"
					>{roomId}</span
				>
			{/if}
		</nav>
		<div class="flex shrink-0 items-center gap-2">
			<button
				type="button"
				onclick={toggleTheme}
				class="chrome-btn hover:bg-accent hover:text-accent-foreground relative flex size-11 items-center justify-center rounded"
				aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
				title="Toggle theme"
			>
				{#if theme === 'dark'}
					<Sun size={18} aria-hidden="true" />
				{:else}
					<Moon size={18} aria-hidden="true" />
				{/if}
			</button>
			{#if isDesktop}
				<div class="relative">
					<label for="join-room-id" class="sr-only">Document room id</label>
					<input
						id="join-room-id"
						bind:value={joinId}
						oninput={() => validateJoin(joinId)}
						placeholder="document id"
						autocomplete="off"
						maxlength={20}
						aria-invalid={joinError ? 'true' : undefined}
						aria-describedby={joinError ? 'join-room-error' : undefined}
						onkeydown={(e) => e.key === 'Enter' && joinDocument()}
						class="border-input bg-background h-11 w-36 rounded border pr-10 pl-2 font-mono text-sm focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2"
					/>
					<button
						type="button"
						onclick={joinDocument}
						disabled={!isValidId(joinId)}
						aria-label="Open room"
						title="Open room"
						class="chrome-btn hover:bg-accent hover:text-accent-foreground absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded disabled:pointer-events-none disabled:opacity-40"
					>
						<ArrowRight size={16} aria-hidden="true" />
					</button>
					{#if joinError}
						<span
							id="join-room-error"
							class="text-destructive bg-popover border-border absolute top-full left-0 z-20 mt-1 w-max max-w-64 rounded border px-2 py-1 text-xs text-red-500 shadow-sm"
							role="alert"
						>
							{joinError}
						</span>
					{/if}
				</div>
			{/if}
			<button
				type="button"
				onclick={newDocument}
				class="chrome-btn bg-primary text-primary-foreground hover:bg-primary/90 flex size-11 items-center justify-center rounded"
				aria-label="New document"
				title="New document"
			>
				<Plus size={16} aria-hidden="true" />
			</button>
		</div>
	</header>

	{#if ready}
		<main
			id="main-content"
			class="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-3 pt-3 pb-4 sm:px-4"
			tabindex="-1"
		>
			{#if showOnboarding}
				<div
					class="onboarding-card border-primary/30 bg-card/90 mb-3 rounded border px-3 py-2 text-sm shadow-sm"
					role="status"
				>
					<p class="font-medium">
						{#if onboardingStep === 0}
							Welcome to md.uy — a peer-to-peer markdown workspace.
						{:else if onboardingStep === 1}
							Edit, Preview, and Present share one live document.
						{:else}
							Export a Document package anytime from Package.
						{/if}
					</p>
					<div class="mt-2 flex flex-wrap gap-2">
						{#if onboardingStep < 2}
							<button
								type="button"
								class="chrome-btn bg-primary text-primary-foreground min-h-11 rounded px-3 text-sm"
								onclick={() => (onboardingStep += 1)}>Next tip</button
							>
						{:else}
							<button
								type="button"
								class="chrome-btn bg-primary text-primary-foreground min-h-11 rounded px-3 text-sm"
								onclick={dismissOnboarding}>Got it</button
							>
						{/if}
						<button
							type="button"
							class="chrome-btn border-input min-h-11 rounded border px-3 text-sm"
							onclick={dismissOnboarding}>Skip</button
						>
					</div>
				</div>
			{/if}

			<div class="mb-3 flex flex-row flex-wrap items-center justify-between gap-3">
				<div class="flex flex-wrap items-center gap-2" role="group" aria-label="Editor mode">
					{#each [['edit', 'Edit'], ['preview', 'Preview'], ['presentation', 'Present']] as [mode, label] (mode)}
						<button
							type="button"
							tabindex="0"
							onclick={() => switchMode(mode as EditorMode)}
							aria-pressed={viewMode === mode}
							class={'mode-btn toolbar-label min-h-11 rounded px-3 font-medium ' +
								(viewMode === mode
									? 'bg-secondary text-secondary-foreground'
									: 'hover:bg-accent hover:text-accent-foreground')}
						>
							{label}
						</button>
					{/each}
				</div>
				<div class="flex flex-wrap items-center gap-1">
					<button
						type="button"
						onclick={copyContent}
						class="chrome-btn hover:bg-accent hover:text-accent-foreground flex min-h-11 items-center gap-1.5 rounded px-3 font-medium"
						title="Copy content"
						aria-label="Copy markdown"
					>
						{#if contentCopied}
							<Check size={16} class="text-green-500" aria-hidden="true" />
						{:else}
							<Copy size={16} aria-hidden="true" />
						{/if}
						<span class="toolbar-label">Copy</span>
					</button>
					<button
						type="button"
						onclick={downloadFile}
						class="chrome-btn hover:bg-accent hover:text-accent-foreground flex min-h-11 items-center gap-1.5 rounded px-3 font-medium"
						title="Download markdown"
						aria-label="Download markdown"
					>
						{#if downloaded}
							<Check size={16} class="text-green-500" aria-hidden="true" />
						{:else}
							<DownloadSimple size={16} aria-hidden="true" />
						{/if}
						<span class="toolbar-label">Download</span>
					</button>
					<button
						type="button"
						onclick={openShare}
						class="chrome-btn border-input bg-background hover:bg-accent hover:text-accent-foreground relative ml-1 flex min-h-11 items-center gap-1.5 rounded border px-3 font-medium"
						title="Share"
						aria-label="Share"
					>
						<ShareNetwork size={16} aria-hidden="true" />
						<span class="toolbar-label">Share</span>
						{#if isSyncing}
							<span class="absolute -top-1 -right-1 flex size-2">
								<span
									class="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
								></span>
								<span class="bg-primary relative inline-flex size-2 rounded-full"></span>
							</span>
						{/if}
					</button>
					<button
						type="button"
						onclick={() => (packageOpen = true)}
						class="chrome-btn border-input bg-background hover:bg-accent hover:text-accent-foreground relative ml-1 flex min-h-11 items-center gap-1.5 rounded border px-3 font-medium"
						title="Document package"
						aria-label="Document package"
					>
						<Package size={16} aria-hidden="true" />
						<span class="toolbar-label">Package</span>
					</button>
				</div>
			</div>

			<div class="border-border relative flex-1 overflow-hidden rounded border">
				<div
					class="absolute inset-0"
					class:hidden={viewMode !== 'edit'}
					style:animation={viewMode === 'edit'
						? `pane-in ${180 + (paneAnimKey % 5) * 4}ms ease both`
						: 'none'}
				>
					<Editor ytext={ytextRef} isVisible={viewMode === 'edit'} />
				</div>
				<div
					class="absolute inset-0"
					class:hidden={viewMode !== 'preview'}
					style:animation={viewMode === 'preview'
						? `pane-in ${180 + (paneAnimKey % 5) * 4}ms ease both`
						: 'none'}
				>
					<Preview ytext={ytextRef} isVisible={viewMode === 'preview'} />
				</div>
				<div
					class="absolute inset-0"
					class:hidden={viewMode !== 'presentation'}
					style:animation={viewMode === 'presentation'
						? `pane-in ${180 + (paneAnimKey % 5) * 4}ms ease both`
						: 'none'}
				>
					<Presentation ytext={ytextRef} isVisible={viewMode === 'presentation'} />
				</div>
			</div>

			<div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
				<button
					type="button"
					onclick={openProfile}
					class="chrome-btn border-input bg-background hover:bg-accent hover:text-accent-foreground relative flex min-h-11 items-center gap-2 rounded border px-3 font-medium"
				>
					<span
						class="border-foreground size-3 rounded-full border"
						style:background-color={userColor}
					></span>
					<span>{userName}</span>
					{#if profileSavedFlash}
						<span class="ink-burst bg-primary/40 pointer-events-none absolute inset-0 rounded"></span>
					{/if}
				</button>
				<div class="text-muted-foreground/80 flex flex-wrap items-center gap-3">
					<span class="inline-flex items-center gap-2" title="Estimated reading time">
						<span
							class="bg-secondary relative h-2 w-16 overflow-hidden rounded"
							aria-hidden="true"
						>
							<span
								class="bg-primary absolute inset-y-0 left-0 rounded"
								style:width="{Math.min(100, readingMinutes * 12)}%"
							></span>
						</span>
						<span>~{readingMinutes} min read</span>
					</span>
					<span class="inline-flex items-center gap-2">
						<span
							class="size-2 rounded-full {isSyncing ? 'bg-primary' : 'bg-muted-foreground/40'}"
						></span>
						<span>{syncLabel}</span>
					</span>
				</div>
			</div>
		</main>
	{:else}
		<div class="text-muted-foreground flex flex-1 items-center justify-center text-sm">Loading…</div>
	{/if}

	<footer
		class="text-foreground/50 flex items-center justify-center gap-2 border-t px-3 py-2 font-mono text-[0.7rem] sm:text-xs"
	>
		<span>md.uy</span>
		<span aria-hidden="true">•</span>
		<span>the peer-to-peer markdown editor</span>
		<span aria-hidden="true">•</span>
		<span>download important notes</span>
	</footer>
</div>

<div class="sr-only" aria-live="polite">{liveRegion}</div>

<!-- Share dialog (Bits UI) -->
<Dialog.Root bind:open={shareOpen}>
	<Dialog.Portal>
		<Dialog.Overlay
			class="dialog-overlay fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-dialog-in"
		/>
		<Dialog.Content
			class="dialog-content bg-popover text-popover-foreground fixed top-[50%] left-[50%] z-50 w-[min(92vw,28rem)] translate-x-[-50%] translate-y-[-50%] rounded-lg border p-6 shadow-lg data-[state=open]:animate-dialog-pop-in"
		>
			<Dialog.Title class="text-lg font-semibold">Share</Dialog.Title>
			<Dialog.Description class="text-muted-foreground mt-1 text-sm"
				>Choose how you want to share your note</Dialog.Description
			>
			<div class="mt-4 grid grid-cols-2 gap-1">
				<button
					type="button"
					onclick={() => (shareTab = 'live')}
					class={'chrome-btn flex min-h-11 items-center justify-center gap-2 rounded px-3 text-sm ' +
						(shareTab === 'live' ? 'bg-secondary text-secondary-foreground' : 'hover:bg-accent')}
					>Live sync</button
				>
				<button
					type="button"
					onclick={() => (shareTab = 'static')}
					class={'chrome-btn flex min-h-11 items-center justify-center gap-2 rounded px-3 text-sm ' +
						(shareTab === 'static' ? 'bg-secondary text-secondary-foreground' : 'hover:bg-accent')}
					>Static</button
				>
			</div>
			{#if shareTab === 'live'}
				<div class="flex flex-col items-center gap-3 py-4">
					{#if isSyncing}
						<div class="flex items-center gap-2">
							<span class="text-sm font-medium">Live sync is active</span>
							<button
								type="button"
								onclick={toggleSync}
								class="chrome-btn border-input hover:bg-accent min-h-11 rounded border px-3 text-sm"
								>Turn off</button
							>
						</div>
						<p class="text-muted-foreground text-center text-sm">
							Anyone with this link can view and edit this note in real time.
						</p>
						<p class="text-muted-foreground text-center text-xs">{syncLabel}</p>
						<div class="relative w-full">
							<input
								readonly
								value={liveUrl}
								aria-label="Live sync URL"
								class="border-input bg-background w-full rounded border py-2 pr-10 pl-2 text-xs"
							/>
							<button
								type="button"
								onclick={() => copyShareUrl(liveUrl)}
								title="Copy to clipboard"
								aria-label="Copy live sync URL"
								class="chrome-btn hover:bg-accent absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded"
							>
								{#if copied}
									<Check size={14} class="text-green-500" aria-hidden="true" />
								{:else}
									<Copy size={14} aria-hidden="true" />
								{/if}
							</button>
						</div>
					{:else}
						<p class="text-muted-foreground text-center text-sm">
							Enable live sync to collaborate in real time with anyone who has the link.
						</p>
						<button
							type="button"
							onclick={toggleSync}
							class="chrome-btn bg-primary text-primary-foreground hover:bg-primary/90 min-h-11 rounded px-3 text-sm"
							>Start live sync</button
						>
					{/if}
				</div>
			{:else}
				<div class="flex flex-col items-center gap-3 py-4">
					<p class="text-muted-foreground text-center text-sm">
						Share a static copy of this note. Changes will not sync between copies.
					</p>
					<button
						type="button"
						onclick={generateStaticLink}
						disabled={staticGenerated}
						class="chrome-btn bg-primary text-primary-foreground hover:bg-primary/90 min-h-11 rounded px-3 text-sm disabled:opacity-50"
					>
						{staticGenerated ? 'Link generated' : 'Generate static link'}
					</button>
					{#if staticGenerated}
						<div class="relative w-full">
							<input
								readonly
								value={staticUrl}
								aria-label="Static import URL"
								class="border-input bg-background w-full rounded border py-2 pr-10 pl-2 text-xs"
							/>
							<button
								type="button"
								onclick={() => copyShareUrl(staticUrl)}
								title="Copy to clipboard"
								aria-label="Copy static URL"
								class="chrome-btn hover:bg-accent absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded"
							>
								{#if copied}
									<Check size={14} class="text-green-500" aria-hidden="true" />
								{:else}
									<Copy size={14} aria-hidden="true" />
								{/if}
							</button>
						</div>
					{/if}
				</div>
			{/if}
			<Dialog.Close
				class="chrome-btn absolute top-4 right-4 rounded-sm opacity-70 hover:opacity-100"
				aria-label="Close share dialog"
			>
				<X size={16} aria-hidden="true" />
			</Dialog.Close>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<!-- Profile dialog -->
<Dialog.Root bind:open={profileOpen}>
	<Dialog.Portal>
		<Dialog.Overlay
			class="dialog-overlay fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-dialog-in"
		/>
		<Dialog.Content
			class="dialog-content bg-popover text-popover-foreground fixed top-[50%] left-[50%] z-50 w-[min(92vw,24rem)] translate-x-[-50%] translate-y-[-50%] rounded-lg border p-6 shadow-lg data-[state=open]:animate-dialog-pop-in"
		>
			<Dialog.Title class="text-lg font-semibold">Edit profile</Dialog.Title>
			<div class="mt-4 grid gap-4">
				<div class="grid grid-cols-5 items-start gap-3">
					<label for="pname" class="pt-1.5 text-right text-sm">Name</label>
					<div class="col-span-4">
						<input
							id="pname"
							value={profileNameDraft}
							oninput={onProfileNameInput}
							placeholder="Enter your name"
							aria-invalid={profileErrors.displayName ? 'true' : undefined}
							aria-describedby={profileErrors.displayName ? 'pname-error' : undefined}
							class="border-input bg-background w-full rounded border px-2 py-2 text-sm"
						/>
						{#if profileErrors.displayName}
							<p id="pname-error" class="text-destructive mt-1 text-xs text-red-500" role="alert">
								{profileErrors.displayName}
							</p>
						{/if}
					</div>
				</div>
				<div class="grid grid-cols-5 items-start gap-3">
					<label for="pcolor" class="pt-1.5 text-right text-sm">Color</label>
					<div class="col-span-4">
						<div class="flex items-center gap-2">
							<input
								id="pcolor"
								type="color"
								value={profileColorDraft}
								oninput={onProfileColorInput}
								class="size-11 cursor-pointer rounded"
							/>
							<span class="font-mono text-sm">{profileColorDraft}</span>
						</div>
						{#if profileErrors.color}
							<p class="text-destructive mt-1 text-xs text-red-500" role="alert">
								{profileErrors.color}
							</p>
						{/if}
					</div>
				</div>
			</div>
			<div class="mt-5 flex justify-end gap-2">
				<button
					type="button"
					onclick={() => (profileOpen = false)}
					class="chrome-btn border-input hover:bg-accent min-h-11 rounded border px-3 text-sm"
					>Cancel</button
				>
				<button
					type="button"
					onclick={saveProfile}
					disabled={!profileValid}
					class="chrome-btn bg-primary text-primary-foreground hover:bg-primary/90 min-h-11 rounded px-3 text-sm disabled:opacity-40"
					>Save</button
				>
			</div>
			<Dialog.Close
				class="chrome-btn absolute top-4 right-4 rounded-sm opacity-70 hover:opacity-100"
				aria-label="Close profile dialog"
			>
				<X size={16} aria-hidden="true" />
			</Dialog.Close>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<DocumentPackageModal
	bind:open={packageOpen}
	{packageJson}
	onImport={importPackage}
	onCopy={copyPackage}
	onDownload={downloadPackage}
	copied={packageCopied}
	downloaded={packageDownloaded}
/>
