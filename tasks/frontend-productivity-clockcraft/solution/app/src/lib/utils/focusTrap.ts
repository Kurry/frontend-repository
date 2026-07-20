export function focusTrap(node: HTMLElement) {
	const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	const getFocusable = () => Array.from(node.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(el => !el.hasAttribute('disabled'));

	function handleKeydown(e: KeyboardEvent) {
		if (e.key !== 'Tab') return;

		const focusable = getFocusable();
		if (focusable.length === 0) {
			e.preventDefault();
			return;
		}

		const first = focusable[0];
		const last = focusable[focusable.length - 1];

		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}

	node.addEventListener('keydown', handleKeydown);

	// Focus the first element on mount
	const focusTimer = setTimeout(() => {
		const focusable = getFocusable();
		if (focusable.length > 0) {
			focusable[0].focus();
		} else {
			node.focus();
		}
	}, 10);

	return {
		destroy() {
			clearTimeout(focusTimer);
			node.removeEventListener('keydown', handleKeydown);
			previouslyFocused?.focus();
		}
	};
}
