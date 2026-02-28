<script lang="ts">
	import { Check, Copy } from 'lucide-svelte';
	import type { EMVField } from '$lib/core/parser/types';
	import { copyToClipboard } from '$lib/utils/clipboard';

	let { field }: { field: EMVField } = $props();

	let copied = $state(false);

	async function handleCopy() {
		await copyToClipboard(field.rawValue);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<div
	class="group flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-white/[0.02]"
	style="border: 1px solid transparent;"
>
	<span class="text-base shrink-0 mt-0.5" aria-hidden="true">{field.icon}</span>

	<div class="min-w-0 flex-1">
		<div class="flex items-center gap-2 mb-0.5">
			<span class="text-xs font-semibold text-[#52525b] font-mono">ID {field.id}</span>
			<span class="text-xs text-[#52525b]">·</span>
			<span class="text-xs text-[#71717a]">{field.name}</span>
		</div>
		<div class="font-mono text-sm text-[#a1a1aa] break-all leading-relaxed">
			{field.displayValue}
		</div>
	</div>

	<button
		onclick={handleCopy}
		class="shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all active:scale-90"
		style="color: #52525b;"
		aria-label="Copiar valor"
	>
		{#if copied}
			<Check class="w-3.5 h-3.5 text-[#10b981]" />
		{:else}
			<Copy class="w-3.5 h-3.5" />
		{/if}
	</button>
</div>
