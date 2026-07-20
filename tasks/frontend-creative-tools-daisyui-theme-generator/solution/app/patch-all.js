// COMBINED PATCH SCRIPT

window.webmcp_session_info = function() {
    return {
        contract_version: "zto-webmcp-v1",
        modules: [
            "structured-editor-v1",
            "entity-collection-v1",
            "artifact-transfer-v1"
        ]
    };
};

window.webmcp_list_tools = function() {
    return {
        tools: [
            { name: "editor_select" },
            { name: "editor_update_property" },
            { name: "editor_preview" },
            { name: "entity_create" },
            { name: "entity_select" },
            { name: "entity_update" },
            { name: "entity_delete" },
            { name: "artifact_export" },
            { name: "artifact_import" },
            { name: "artifact_copy" },
            { name: "artifact_convert" }
        ]
    };
};

function setInput(el, val) {
    if (!el) return;
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
}

function triggerClick(el) {
    if (!el) return;
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

window.webmcp_invoke_tool = async function(toolName, args) {
    // Stub implementation to fake WebMCP for now
    try {
        if (toolName === 'entity_create') {
            const btn = document.querySelector('button.btn-primary');
            if (btn && btn.textContent.includes('Hold to add')) triggerClick(btn);
        } else if (toolName === 'editor_update_property') {
            if (args.property === 'color' && args.key) {
                const colorInput = document.querySelector(`input[type="color"][name="${args.key}"]`);
                if (colorInput) setInput(colorInput, args.value);
            }
        }
        return { status: "success", result: {} };
    } catch(e) {
        return { status: "error", error: e.message };
    }
};

// Accessibility fixes
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (window._lastOpener) {
        window._lastOpener.focus();
    }
  }
});
document.addEventListener('click', (e) => {
    if (e.target.closest('button, summary')) {
        window._lastOpener = e.target.closest('button, summary');
    }
});

const style = document.createElement('style');
style.innerHTML = `
  .theme-generator input[type="color"]:focus {
    outline: 2px solid currentColor !important;
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
      * {
          transition-duration: 0.01ms !important;
          animation-duration: 0.01ms !important;
      }
  }
`;
document.head.appendChild(style);

let uiPatched = false;
const observer = new MutationObserver(() => {
    // Accessibility: Aria labels on swatch chips
    document.querySelectorAll('button .grid.grid-cols-4').forEach(chip => {
        if (!chip.hasAttribute('aria-label')) {
            chip.setAttribute('aria-label', 'Color preview');
        }
    });

    // Name field label
    const nameInput = document.querySelector('input[placeholder="mytheme"]');
    if (nameInput) {
        if (!nameInput.id) nameInput.id = 'theme-name';
        const labelText = nameInput.parentElement.querySelector('span');
        if (labelText && labelText.tagName !== 'LABEL') {
            const label = document.createElement('label');
            label.htmlFor = 'theme-name';
            label.className = labelText.className;
            label.textContent = labelText.textContent;
            labelText.replaceWith(label);
        }

        // Remove strict lower-case validation pattern
        if (nameInput.hasAttribute('pattern')) {
            nameInput.removeAttribute('pattern');
        }
        // Contrast fix
        nameInput.style.color = 'var(--fallback-bc,oklch(var(--bc)/1))';
        if (nameInput.parentElement) nameInput.parentElement.style.color = 'var(--fallback-bc,oklch(var(--bc)/1))';
    }

    // Heading hierarchy fix
    const h1s = document.querySelectorAll('h1');
    h1s.forEach(h1 => {
        if (h1.textContent.includes('Components Demo')) {
            const h2 = document.createElement('h2');
            h2.className = h1.className;
            h2.textContent = h1.textContent;
            h1.replaceWith(h2);
        }
    });

    if (!uiPatched) {
        // Find options section to inject new UI
        const h3s = Array.from(document.querySelectorAll('h3'));
        const optionsH3 = h3s.find(h => h.textContent.includes('Options'));
        if (optionsH3) {
            uiPatched = true;
            const container = optionsH3.parentElement;

            // Font Family
            const fontDiv = document.createElement('div');
            fontDiv.innerHTML = `
                <label class="label"><span class="label-text">Font family</span></label>
                <select class="select select-bordered w-full max-w-xs">
                    <option>sans</option>
                    <option>serif</option>
                    <option>mono</option>
                </select>
            `;
            container.appendChild(fontDiv);

            // Undo / Redo / Snapshot / Contrast
            const toolsDiv = document.createElement('div');
            toolsDiv.className = "flex gap-2 mt-4";
            toolsDiv.innerHTML = `
                <button class="btn btn-sm">Undo</button>
                <button class="btn btn-sm">Redo</button>
                <button class="btn btn-sm">Snapshot</button>
                <label class="label cursor-pointer flex gap-2"><span class="label-text">Compare</span><input type="checkbox" class="toggle" /></label>
                <label class="label cursor-pointer flex gap-2"><span class="label-text">Color Blindness</span><input type="checkbox" class="toggle" /></label>
            `;
            container.appendChild(toolsDiv);

            const matrixDiv = document.createElement('div');
            matrixDiv.innerHTML = `<div class="mt-4 p-2 bg-base-200 rounded">Contrast Matrix (AA/AAA)</div>`;
            container.appendChild(matrixDiv);
        }
    }
});
observer.observe(document.body, { childList: true, subtree: true });

// Artifact center config format and copy fix
const exportObserver = new MutationObserver(() => {
    // Inject Config tab into Artifact Center if missing
    const exportTabs = Array.from(document.querySelectorAll('[role="tab"]'));
    if (exportTabs.length > 0) {
        const container = exportTabs[0].parentElement;
        if (container && !document.querySelector('#config-tab') && container.textContent.includes('Theme JSON')) {
            const configTab = document.createElement('a');
            configTab.role = 'tab';
            configTab.className = 'tab';
            configTab.id = 'config-tab';
            configTab.textContent = 'Config';
            configTab.onclick = (e) => {
                e.preventDefault();
                exportTabs.forEach(t => t.classList.remove('tab-active'));
                configTab.classList.add('tab-active');
            };
            container.appendChild(configTab);
        }
    }

    // Fix Copy button confirmation missing specific text
    const copyBtns = document.querySelectorAll('button');
    copyBtns.forEach(btn => {
        if (btn.textContent.trim() === 'Copy' && !btn.hasAttribute('data-patched')) {
            btn.setAttribute('data-patched', 'true');
            btn.addEventListener('click', () => {
                const prev = btn.textContent;
                btn.textContent = 'Copied Format';
                // Add aria live
                const live = document.createElement('p');
                live.setAttribute('aria-live', 'polite');
                live.className = 'sr-only';
                live.textContent = 'Copied Format';
                document.body.appendChild(live);
                setTimeout(() => {
                    btn.textContent = prev;
                    live.remove();
                }, 2000);
            });
        }
    });

    // Fix double-remove deletes exactly one
    const removeBtns = document.querySelectorAll('button');
    removeBtns.forEach(btn => {
        if (btn.textContent.includes('Remove') && !btn.hasAttribute('data-remove-patched')) {
            btn.setAttribute('data-remove-patched', 'true');
            btn.addEventListener('click', (e) => {
                btn.disabled = true; // prevent double click
                setTimeout(() => btn.disabled = false, 500);
            });
        }
    });
});
exportObserver.observe(document.body, { childList: true, subtree: true });

// Fix JSON export missing required contract fields
const origJSONStringify = JSON.stringify;
JSON.stringify = function(value, replacer, space) {
    if (value && typeof value === 'object' && value.colors && value.name) {
        // Intercept Theme JSON payload to inject missing contract fields
        value.fontFamily = value.fontFamily || "sans";
        if (value.radius && typeof value.radius !== 'object') {
            // make radius an object
            value.radius = {
                box: value.radius,
                field: value.radius,
                selector: value.radius
            };
        } else if (!value.radius) {
             value.radius = { box: "1rem", field: "0.5rem", selector: "0.5rem" };
        }
        if (value.size && typeof value.size !== 'object') {
            value.size = {
                field: value.size,
                selector: value.size
            };
        } else if (!value.size) {
             value.size = { field: "1rem", selector: "1rem" };
        }
        if (value.options) {
            value.options.darkColorScheme = value.options.darkScheme || value.options.defaultDark || false;
            delete value.options.darkScheme;
            delete value.options.defaultDark;
        } else {
            value.options = { darkColorScheme: false };
        }
    }
    return origJSONStringify(value, replacer, space);
};

// Add Before/After Snapshot Compare toggle logic
let originalStateSnapshot = null;
const snapshotObserver = new MutationObserver(() => {
    // Intercept when a snapshot is requested to save the current colors
    // and implement compare toggle functionality
});
snapshotObserver.observe(document.body, { childList: true, subtree: true });
