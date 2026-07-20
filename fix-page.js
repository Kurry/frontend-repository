const fs = require('fs');
const path = 'tasks/frontend-productivity-md-uy/solution/app/src/routes/[...path]/+page.svelte';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(`</main>

			<!-- Status row: profile + connection -->`, `<!-- Status row: profile + connection -->`);
content = content.replace(`</div>
		</div>
	{:else}`, `</main>\n\t\t</div>\n\t{:else}`);

fs.writeFileSync(path, content, 'utf8');
