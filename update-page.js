const fs = require('fs');

const path = 'tasks/frontend-productivity-md-uy/solution/app/src/routes/[...path]/+page.svelte';
let content = fs.readFileSync(path, 'utf8');

const importsToAdd = `
	import DocumentPackageModal from '$lib/components/DocumentPackageModal.svelte';
`;

content = content.replace("import { installWebmcp } from '$lib/webmcp';", "import { installWebmcp } from '$lib/webmcp';" + importsToAdd);

const funcsToAdd = `
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
`;

content = content.replace("function openShare() {", funcsToAdd + "\n\tfunction openShare() {");

const buttonToAdd = `
				<button
					onclick={openPackage}
					class="border-input bg-background hover:bg-accent hover:text-accent-foreground ml-2 flex h-7 items-center gap-1 rounded border px-2 text-xs font-medium transition-colors"
					title="Document Package"
				>
					Package
				</button>
`;

content = content.replace("<span>{isSyncing ? 'Live sync on — no users connected' : 'Local only'}</span>\n\t\t\t\t</div>\n\t\t\t</div>", "<span>{isSyncing ? 'Live sync on — no users connected' : 'Local only'}</span>\n\t\t\t\t</div>\n\t\t\t\t" + buttonToAdd + "\n\t\t\t</div>");


const modalToAdd = `
<DocumentPackageModal bind:open={packageOpen} packageJson={packageJsonPreview} onImport={handleImport} onCopy={copyPackage} onDownload={downloadPackage} />
`;

content = content + "\n" + modalToAdd;

fs.writeFileSync(path, content, 'utf8');
