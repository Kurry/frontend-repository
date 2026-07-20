const fs = require('fs');
const path = 'tasks/frontend-productivity-md-uy/solution/app/src/routes/[...path]/+page.svelte';
let content = fs.readFileSync(path, 'utf8');

const imports = `
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { ProfileSchema, JoinRoomSchema } from '$lib/schemas';
	let { data } = $props();

	const profileSuperForm = superForm(data.profileForm, {
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
		validators: zodClient(JoinRoomSchema),
		SPA: true,
		onSubmit({ cancel }) {
			// handled below
		},
		onUpdate({ form }) {
			if (form.valid) {
				window.location.href = \`/\${form.data.roomId}\`;
			}
		}
	});
	const { form: jForm, errors: jErrors, enhance: jEnhance } = joinSuperForm;
`;

content = content.replace("type EditorMode = 'edit' | 'preview' | 'presentation';", "type EditorMode = 'edit' | 'preview' | 'presentation';\n" + imports);

// Fix profile default values
content = content.replace(/let profileOpen = \$state\(false\);/,
	"let profileOpen = $state(false);\n\t$effect(() => {\n\t\t$pForm.displayName = userName;\n\t\t$pForm.color = userColor;\n\t});");

// Replace top bar join form
content = content.replace(/<div class="flex items-center gap-1">[\s\S]*?<button[\s\S]*?onclick=\{joinDocument\}[\s\S]*?<\/button>[\s\S]*?<\/div>/m,
`<form use:jEnhance class="flex items-center gap-1">
					<div class="relative flex flex-col">
					<input
						bind:value={$jForm.roomId}
						placeholder="Join room..."
						class="border-input bg-background w-28 rounded-l border py-1.5 pl-2 font-mono text-xs"
					/>
					{#if $jErrors.roomId}
						<span class="absolute top-full left-0 z-10 w-48 text-destructive text-[0.65rem] bg-background border p-1 rounded shadow-sm">{$jErrors.roomId}</span>
					{/if}
					</div>
					<button
						type="submit"
						class="border-input bg-background hover:bg-accent hover:text-accent-foreground flex size-7 items-center justify-center rounded-r border-y border-r transition-colors"
						aria-label="Open document"
						title="Open document"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
					</button>
				</form>`);

// Replace profile modal form
content = content.replace(/<div class="mt-4 grid gap-4">[\s\S]*?<button onclick=\{\(\) => \(profileOpen = false\)\}[\s\S]*?<\/button>\n\t\t\t<\/div>/m,
`<form use:pEnhance class="mt-4 grid gap-4">
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
			</form>`);

fs.writeFileSync(path, content, 'utf8');
