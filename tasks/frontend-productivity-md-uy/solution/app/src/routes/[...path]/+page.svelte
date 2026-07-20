<script lang="ts">
	import { onMount } from 'svelte';
	import * as Y from 'yjs';
	import { marked } from 'marked';
	import Editor from '$lib/components/Editor.svelte';
	import Preview from '$lib/components/Preview.svelte';
	import Presentation from '$lib/components/Presentation.svelte';
	import { initYjs } from '$lib/editor/initYjs';
	import { generateId, isValidId } from '$lib/utils';
	import { SEED_ROOM_ID, SEED_CONTENT, Y_TEXT_KEY } from '$lib/constants';
	import { installWebmcp } from '$lib/webmcp';
	import DocumentPackageModal from '$lib/components/DocumentPackageModal.svelte';


	type EditorMode = 'edit' | 'preview' | 'presentation';

	import { fade, slide } from 'svelte/transition';
import { cubicInOut } from 'svelte/easing';
import { prefersReducedMotion } from 'svelte/motion';
import { derived } from 'svelte/store';
import { superForm } from 'sveltekit-superforms';
	import { Dialog } from 'bits-ui';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { ProfileSchema, JoinRoomSchema } from '$lib/schemas';
	let { data } = $props();

	const profileSuperForm = superForm(data.profileForm, {
		resetForm: false,
		validators: zodClient(ProfileSchema),
		SPA: true,
		onSubmit({ cancel }) {
			// handled below
		},
		onUpdate({ form }) {
			if (form.valid) {
				userName = form.data.displayName;
				userColor = form.data.color;
				try {
					localStorage.setItem('mduy-user', JSON.stringify({ name: userName, color: userColor }));
				} catch {}
				profileOpen = false;
			}
		}
	});
	const { form: pForm, errors: pErrors, enhance: pEnhance } = profileSuperForm;

	const joinSuperForm = superForm(data.joinForm, {
		resetForm: false,
		validators: zodClient(JoinRoomSchema),
		SPA: true,
		onSubmit({ cancel }) {
			// handled below
		},
		onUpdate({ form }) {
			if (form.valid) {
				window.location.href = `/${form.data.roomId}`;
			}
		}
	});
	const { form: jForm, errors: jErrors, enhance: jEnhance } = joinSuperForm;


	let ready = $state(false);
	let roomId = $state('');
	let viewMode = $state<EditorMode>('edit');
	let theme = $state<'light' | 'dark'>('light');
	let joinId = $state('');

	let shareOpen = $state(false);
	let isSyncing = $state(false);
	let shareTab = $state<'live' | 'static'>('live');
	let liveUrl = $state('');
	let staticUrl = $state('');
	let staticGenerated = $state(false);
	let copied = $state(false);

	let profileOpen = $state(false);
	$effect(() => {
		$pForm.displayName = userName;
		$pForm.color = userColor;
	});
	let userName = $state('Anonymous');
	let userColor = $state('#559ede');

	let contentCopied = $state(false);
	let packageOpen = $state(false);
	let packageJsonPreview = $state("");
	let packageCopied = $state(false);
	let packageDownloaded = $state(false);
	let downloaded = $state(false);

	let ydoc = $state<Y.Doc | null>(null);
	let ytext = $state<Y.Text | null>(null);
	let cleanup: () => void = () => {};

	function resolveRoomId(): string {
		const path = window.location.pathname.replace(/^\/+/, '').split('/')[0];
		if (path && isValidId(path)) return path;
		// Default: open directly into the seeded welcome document.
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
		if (ydoc && ytext) { ydoc.transact(() => {
			ytext.delete(0, ytext?.length ?? 0);
			ytext.insert(0, content);
		});
		}
	}

	function copyContent() {
		const text = ytext?.toString() ?? "";
		navigator.clipboard?.writeText(text).catch(() => {});
		contentCopied = true;
		setTimeout(() => (contentCopied = false), 800);
		return text;
	}

	function downloadFile() {
		const content = ytext?.toString() ?? "";
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
		setTimeout(() => (downloaded = false), 800);
		return content;
	}


	function openPackage() {
		const pkg = {
			schemaVersion: "mduy-document-v1",
			roomId,
			markdown: ytext?.toString() ?? "",
			theme,
			profile: {
				displayName: userName,
				color: userColor
			}
		};
		packageJsonPreview = JSON.stringify(pkg, null, 2);
		packageOpen = true;
	}

	function handleImport(importText: string) {
		const parsed = JSON.parse(importText);
		if (ydoc && ytext) {
			ydoc.transact(() => {
				ytext.delete(0, ytext?.length ?? 0);
				ytext.insert(0, parsed.markdown);
			});
		}

		userName = parsed.profile.displayName;
		userColor = parsed.profile.color;
		try {
			localStorage.setItem('mduy-user', JSON.stringify({ name: userName, color: userColor }));
		} catch {}

		applyTheme(parsed.theme);
	}

	function copyPackage() {
		navigator.clipboard?.writeText(packageJsonPreview).catch(() => {});
		packageCopied = true;
		setTimeout(() => (packageCopied = false), 800);
	}

	function downloadPackage() {
		const blob = new Blob([packageJsonPreview], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'document-package.json';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		packageDownloaded = true;
		setTimeout(() => (packageDownloaded = false), 800);
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
		const content = ytext?.toString() ?? "";
		staticUrl = `${window.location.origin}/import?content=${encodeURIComponent(content)}`;
		staticGenerated = true;
	}

	function copyShareUrl(url: string) {
		navigator.clipboard?.writeText(url).catch(() => {});
		copied = true;
		setTimeout(() => (copied = false), 800);
	}

	function newDocument() {
		const id = generateId();
		window.location.href = `/${id}`;
	}

	function joinDocument() {
		const id = joinId.trim();
		if (isValidId(id)) window.location.href = `/${id}`;
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
		} catch {
			/* storage optional */
		}

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
			cleanup = res.cleanup;

			// Seed the welcome document only when it is genuinely empty.
			if (roomId === SEED_ROOM_ID && (ytext?.length ?? 0) === 0) {
				ytext.insert(0, SEED_CONTENT);
			}

			installWebmcp({
				setContent,
				switchMode: (m) => (viewMode = m),
				showPreview: () => {
					viewMode = 'preview';
					return marked.parse(ytext?.toString() ?? "", { gfm: true, breaks: true }) as string;
				},
				exportMarkdown: () => downloadFile(),
				copyMarkdown: () => copyContent(),
				getState: () => ({
					roomId,
					viewMode,
					theme,
					isSyncing,
					sourceLength: ytext?.length ?? 0
				})
			});

			ready = true;
		});

		return () => {
			disposed = true;
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
</script>

<div class="flex h-screen w-full flex-col overflow-hidden">
	<!-- Top bar: brand + room breadcrumb, theme, join, new -->
	<header class="flex items-center justify-between gap-2 border-b px-4 py-2">
		<div class="flex items-center text-xs">
			<a href="/" class="text-foreground/70 hover:text-foreground transition-colors">md.uy</a>
			{#if roomId}
				<span class="text-foreground/30 ml-1">/</span>
				<span class="ml-1 pt-[2px] font-mono" data-testid="room-id">{roomId}</span>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			<button
				onclick={toggleTheme}
				class="hover:bg-accent hover:text-accent-foreground relative flex size-7 items-center justify-center rounded transition-colors"
				aria-label="Toggle theme"
				title="Toggle theme"
			>
				{#if theme === 'dark'}
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
				{/if}
			</button>
			<div class="relative hidden md:block">
				<input
					bind:value={joinId}
					placeholder="document id"
					autocomplete="off"
					maxlength={20}
					onkeydown={(e) => e.key === 'Enter' && joinDocument()}
					class="border-input bg-background h-7 w-32 rounded border pr-8 pl-2 font-mono text-xs focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2"
				/>
				<button
					onclick={joinDocument}
					disabled={!isValidId(joinId)}
					aria-label="Open document"
					title="Open document"
					class="hover:bg-accent hover:text-accent-foreground absolute top-1/2 right-1 flex size-5 -translate-y-1/2 items-center justify-center rounded transition-colors disabled:pointer-events-none disabled:opacity-40"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
				</button>
			</div>
			<button
				onclick={newDocument}
				class="bg-primary text-primary-foreground hover:bg-primary/90 flex size-7 items-center justify-center rounded transition-colors"
				aria-label="New document"
				title="New document"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
			</button>
		</div>
	</header>

	{#if ready}
		<main id="main-content" class="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-4 pt-3 pb-4">
			<!-- Toolbar: mode toggle + actions -->
			<div class="mb-3 flex flex-row flex-wrap items-center justify-between gap-3">
				<div class="flex items-center gap-2" role="group" aria-label="Editor mode">
					{#each [['edit', 'Edit'], ['preview', 'Preview'], ['presentation', 'Present']] as [mode, label] (mode)}
						<button
							onclick={() => (viewMode = mode as EditorMode)}
							aria-pressed={viewMode === mode}
							class={'h-7 rounded px-2 text-xs font-medium transition-colors ' +
								(viewMode === mode
									? 'bg-secondary text-secondary-foreground'
									: 'hover:bg-accent hover:text-accent-foreground')}
						>
							{label}
						</button>
					{/each}
				</div>
				<div class="flex items-center gap-1">
					<button
						onclick={copyContent}
						class="hover:bg-accent hover:text-accent-foreground flex h-7 items-center gap-1 rounded px-2 text-xs font-medium transition-colors"
						title="Copy content"
					>
						{#if contentCopied}
							<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-green-500" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
						{/if}
						Copy
					</button>
					<button
						onclick={downloadFile}
						class="hover:bg-accent hover:text-accent-foreground flex h-7 items-center gap-1 rounded px-2 text-xs font-medium transition-colors"
						title="Download markdown"
					>
						{#if downloaded}
							<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-green-500" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
						{/if}
						Download
					</button>
					<button
						onclick={openShare}
						class="border-input bg-background hover:bg-accent hover:text-accent-foreground relative ml-2 flex h-7 items-center gap-1 rounded border px-2 text-xs font-medium transition-colors"
						title="Share"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
						Share
						{#if isSyncing}
							<span class="absolute -top-1 -right-1 flex size-2">
								<span class="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
								<span class="bg-primary relative inline-flex size-2 rounded-full"></span>
							</span>
						{/if}
					</button>
				</div>
			</div>

			<!-- Panes -->
			<div class="border-border flex-1 overflow-hidden rounded border">
				<Editor {ytext} isVisible={viewMode === 'edit'} />
				<Preview {ytext} isVisible={viewMode === 'preview'} />
				<Presentation {ytext} isVisible={viewMode === 'presentation'} />
			</div>
		<!-- Status row: profile + connection -->
			<div class="mt-3 flex items-center justify-between text-xs">
				<button
					onclick={() => (profileOpen = true)}
					class="border-input bg-background hover:bg-accent hover:text-accent-foreground flex h-7 items-center gap-2 rounded border px-2 font-medium transition-colors"
				>
					<span class="border-foreground size-3 rounded-full border" style:background-color={userColor}></span>
					<span>{userName}</span>
				</button>
				<div class="text-muted-foreground/70 flex items-center gap-2">
					<span class="size-2 rounded-full {isSyncing ? 'bg-primary' : 'bg-muted-foreground/40'}"></span>
					<span>{isSyncing ? 'Live sync on — no users connected' : 'Local only'}</span>
				</div>

				<button
					onclick={openPackage}
					class="border-input bg-background hover:bg-accent hover:text-accent-foreground ml-2 flex h-7 items-center gap-1 rounded border px-2 text-xs font-medium transition-colors"
					title="Document Package"
				>
					Package
				</button>

						</div>
				</main>
	{:else}
		<div class="text-muted-foreground flex flex-1 items-center justify-center text-sm">Loading…</div>
	{/if}

	<footer class="text-foreground/50 flex items-center justify-center gap-2 border-t px-3 py-2 font-mono text-[0.7rem]">
		<span>md.uy</span>
		<span>•</span>
		<span>the peer-to-peer markdown editor</span>
		<span>•</span>
		<span>download important notes</span>
	</footer>
</div>


	<div aria-live="polite" class="sr-only">
		{#if contentCopied}
			Copied markdown to clipboard
		{/if}
		{#if downloaded}
			Downloaded markdown file
		{/if}
		{#if packageCopied}
			Copied document package to clipboard
		{/if}
		{#if packageDownloaded}
			Downloaded document package file
		{/if}
	</div>


<!-- Share dialog -->
<Dialog.Root bind:open={shareOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/50" transition={fade} transitionConfig={{ duration: prefersReducedMotion.current ? 0 : 150 }} />
		<Dialog.Content class="bg-popover text-popover-foreground fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg border p-6 shadow-lg outline-none" transition={fade} transitionConfig={{ duration: prefersReducedMotion.current ? 0 : 150 }}>
			<Dialog.Close class="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
				<span class="sr-only">Close</span>
			</Dialog.Close>
			<Dialog.Title class="text-lg font-semibold">Share</Dialog.Title>
			<Dialog.Description class="text-muted-foreground mt-1 text-sm">Choose how you want to share your note</Dialog.Description>
			<div class="mt-4 grid grid-cols-2 gap-1">
				<button
					onclick={() => (shareTab = 'live')}
					class={'flex items-center justify-center gap-2 rounded px-3 py-1.5 text-sm transition-colors ' +
						(shareTab === 'live' ? 'bg-secondary text-secondary-foreground' : 'hover:bg-accent')}
				>Live sync</button>
				<button
					onclick={() => (shareTab = 'static')}
					class={'flex items-center justify-center gap-2 rounded px-3 py-1.5 text-sm transition-colors ' +
						(shareTab === 'static' ? 'bg-secondary text-secondary-foreground' : 'hover:bg-accent')}
				>Static</button>
			</div>
			{#if shareTab === 'live'}
				<div class="flex flex-col items-center gap-3 py-4">
					{#if isSyncing}
						<div class="flex items-center gap-2">
							<span class="text-sm font-medium">Live sync is active</span>
							<button onclick={toggleSync} class="border-input hover:bg-accent rounded border px-2 py-1 text-xs">Turn off</button>
						</div>
						<p class="text-muted-foreground text-center text-sm">Anyone with this link can view and edit this note in real time.</p>
						<div class="relative w-full">
							<input readonly value={liveUrl} class="border-input bg-background w-full rounded border py-1.5 pr-9 pl-2 text-xs" />
							<button onclick={() => copyShareUrl(liveUrl)} title="Copy to clipboard" class="hover:bg-accent absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded">
								{#if copied}✓{:else}⧉{/if}
							</button>
						</div>
					{:else}
						<p class="text-muted-foreground text-center text-sm">Enable live sync to collaborate in real time with anyone who has the link.</p>
						<button onclick={toggleSync} class="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-3 py-1.5 text-sm">Start live sync</button>
					{/if}
				</div>
			{:else}
				<div class="flex flex-col items-center gap-3 py-4">
					<p class="text-muted-foreground text-center text-sm">Share a static copy of this note. Changes will not sync between copies.</p>
					<button onclick={generateStaticLink} disabled={staticGenerated} class="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-3 py-1.5 text-sm disabled:opacity-50">
						{staticGenerated ? 'Link generated' : 'Generate static link'}
					</button>
					{#if staticGenerated}
						<div class="relative w-full">
							<input readonly value={staticUrl} class="border-input bg-background w-full rounded border py-1.5 pr-9 pl-2 text-xs" />
							<button onclick={() => copyShareUrl(staticUrl)} title="Copy to clipboard" class="hover:bg-accent absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded">
								{#if copied}✓{:else}⧉{/if}
							</button>
						</div>
					{/if}
				</div>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<!-- Profile dialog -->
<Dialog.Root bind:open={profileOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/50" transition={fade} transitionConfig={{ duration: prefersReducedMotion.current ? 0 : 150 }} />
		<Dialog.Content class="bg-popover text-popover-foreground fixed left-[50%] top-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%] rounded-lg border p-6 shadow-lg outline-none" transition={fade} transitionConfig={{ duration: prefersReducedMotion.current ? 0 : 150 }}>
			<Dialog.Close class="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
				<span class="sr-only">Close</span>
			</Dialog.Close>
			<Dialog.Title class="text-lg font-semibold">Edit profile</Dialog.Title>
			<Dialog.Description class="sr-only">Edit your profile</Dialog.Description>
			<form use:pEnhance class="mt-4 grid gap-4">
				<div class="grid grid-cols-5 items-center gap-3">
					<label for="pname" class="text-right text-sm">Name</label>
					<div class="col-span-4 flex flex-col">
					<input id="pname" name="displayName" bind:value={$pForm.displayName} placeholder="Enter your name" class="border-input bg-background w-full rounded border px-2 py-1.5 text-sm" />
					{#if $pErrors.displayName}
						<span class="text-destructive mt-1 text-xs text-red-500">{$pErrors.displayName}</span>
					{/if}
					</div>
				</div>
				<div class="grid grid-cols-5 items-center gap-3">
					<label for="pcolor" class="text-right text-sm">Color</label>
					<div class="col-span-4 flex flex-col">
					<div class="flex items-center gap-2">
						<input id="pcolor" name="color" type="color" bind:value={$pForm.color} class="size-8 cursor-pointer rounded" />
						<span class="font-mono text-sm">{$pForm.color}</span>
					</div>
					{#if $pErrors.color}
						<span class="text-destructive mt-1 text-xs text-red-500">{$pErrors.color}</span>
					{/if}
					</div>
				</div>
				<div class="mt-5 flex justify-end">
					<button type="submit" class="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-3 py-1.5 text-sm">Done</button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>


<DocumentPackageModal bind:open={packageOpen} packageJson={packageJsonPreview} onImport={handleImport} onCopy={copyPackage} onDownload={downloadPackage} />
