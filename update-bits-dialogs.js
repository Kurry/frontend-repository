const fs = require('fs');
const path = 'tasks/frontend-productivity-md-uy/solution/app/src/routes/[...path]/+page.svelte';
let content = fs.readFileSync(path, 'utf8');

// Replace standard #if block with Bits UI Dialog for Share
const oldShare = `<!-- Share dialog -->
{#if shareOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<button class="absolute inset-0 bg-black/50" aria-label="Close" onclick={() => (shareOpen = false)}></button>
		<div class="bg-popover text-popover-foreground relative z-10 w-[90%] max-w-md rounded-lg border p-6 shadow-lg">`;
const newShare = `<!-- Share dialog -->
<Dialog.Root bind:open={shareOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/50 transition-opacity" />
		<Dialog.Content class="bg-popover text-popover-foreground fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg border p-6 shadow-lg outline-none">
			<Dialog.Close class="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
				<span class="sr-only">Close</span>
			</Dialog.Close>`;
content = content.replace(oldShare, newShare);

const shareTitle = `<h2 class="text-lg font-semibold">Share</h2>
			<p class="text-muted-foreground mt-1 text-sm">Choose how you want to share your note</p>`;
const newShareTitle = `<Dialog.Title class="text-lg font-semibold">Share</Dialog.Title>
			<Dialog.Description class="text-muted-foreground mt-1 text-sm">Choose how you want to share your note</Dialog.Description>`;
content = content.replace(shareTitle, newShareTitle);

const endShare = `</div>
			{/if}
		</div>
	</div>
{/if}`;
const newEndShare = `</div>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>`;
content = content.replace(endShare, newEndShare);

// Replace standard #if block with Bits UI Dialog for Profile
const oldProfile = `<!-- Profile dialog -->
{#if profileOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<button class="absolute inset-0 bg-black/50" aria-label="Close" onclick={() => (profileOpen = false)}></button>
		<div class="bg-popover text-popover-foreground relative z-10 w-[90%] max-w-sm rounded-lg border p-6 shadow-lg">`;
const newProfile = `<!-- Profile dialog -->
<Dialog.Root bind:open={profileOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/50 transition-opacity" />
		<Dialog.Content class="bg-popover text-popover-foreground fixed left-[50%] top-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%] rounded-lg border p-6 shadow-lg outline-none">
			<Dialog.Close class="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
				<span class="sr-only">Close</span>
			</Dialog.Close>`;
content = content.replace(oldProfile, newProfile);

const profileTitle = `<h2 class="text-lg font-semibold">Edit profile</h2>`;
const newProfileTitle = `<Dialog.Title class="text-lg font-semibold">Edit profile</Dialog.Title>
			<Dialog.Description class="sr-only">Edit your profile</Dialog.Description>`;
content = content.replace(profileTitle, newProfileTitle);

const endProfile = `</div>
			</form>
		</div>
	</div>
{/if}`;
const newEndProfile = `</div>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>`;
content = content.replace(endProfile, newEndProfile);


// Add Dialog to import
const importBits = `import { Dialog } from 'bits-ui';`;
content = content.replace("import { superForm } from 'sveltekit-superforms';", "import { superForm } from 'sveltekit-superforms';\n\t" + importBits);

// Skip-to-content
const headerContent = `<div class="mx-auto flex w-full max-w-7xl items-center justify-between px-4">`;
content = content.replace(headerContent, headerContent + `\n\t\t\t<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-background focus:text-foreground">Skip to main content</a>`);

// Main content marker
const mainContent = `<div class="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-4 pt-3 pb-4">`;
content = content.replace(mainContent, `<main id="main-content" class="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-4 pt-3 pb-4">`);

content = content.replace(`<!-- Panes -->
			<div class="border-border flex-1 overflow-hidden rounded border">
				<Editor {ytext} isVisible={viewMode === 'edit'} />
				<Preview {ytext} isVisible={viewMode === 'preview'} />
				<Presentation {ytext} isVisible={viewMode === 'presentation'} />
			</div>`, `<!-- Panes -->
			<div class="border-border flex-1 overflow-hidden rounded border">
				<Editor {ytext} isVisible={viewMode === 'edit'} />
				<Preview {ytext} isVisible={viewMode === 'preview'} />
				<Presentation {ytext} isVisible={viewMode === 'presentation'} />
			</div>\n\t\t</main>`);

content = content.replace(`</main>\n\n\t\t\t<!-- Status row: profile + connection -->`, `<!-- Status row: profile + connection -->`);

// Live region
const liveRegion = `
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
`;
content = content.replace(`</div>\n\n<!-- Share dialog -->`, `</div>\n\n${liveRegion}\n\n<!-- Share dialog -->`);


fs.writeFileSync(path, content, 'utf8');
