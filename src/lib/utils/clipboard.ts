export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		if (navigator.clipboard && window.isSecureContext) {
			await navigator.clipboard.writeText(text);
			return true;
		}
		// Fallback for older browsers
		const textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
		document.body.appendChild(textarea);
		textarea.focus();
		textarea.select();
		const success = document.execCommand('copy');
		document.body.removeChild(textarea);
		return success;
	} catch {
		return false;
	}
}

export function useCopyState(resetMs = 2000) {
	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | null = null;

	async function copy(text: string): Promise<boolean> {
		const success = await copyToClipboard(text);
		if (success) {
			copied = true;
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => {
				copied = false;
			}, resetMs);
		}
		return success;
	}

	return {
		get copied() {
			return copied;
		},
		copy
	};
}
