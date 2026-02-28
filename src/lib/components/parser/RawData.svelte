<script lang="ts">
	import { Check, Copy, ChevronDown } from 'lucide-svelte';
	import { slide } from 'svelte/transition';
	import { useCopyState } from '$lib/utils/clipboard';

	let { raw }: { raw: string } = $props();

	const copyState = useCopyState();
	let expanded = $state(false);
</script>

<div
	class="rounded-2xl overflow-hidden"
	style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);"
>
	<button
		onclick={() => (expanded = !expanded)}
		class="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-white/[0.02]"
	>
		<span class="text-xs font-bold text-[#52525b] uppercase tracking-wider">Datos Crudos (Raw)</span>
		<ChevronDown
			class="w-4 h-4 text-[#52525b] transition-transform duration-200"
			style={expanded ? 'transform: rotate(180deg)' : ''}
		/>
	</button>

	{#if expanded}
		<div transition:slide={{ duration: 200 }}>
			<div class="relative px-4 pb-4">
				<pre
					class="font-mono text-xs text-[#71717a] break-all whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">{raw}</pre>
				<button
					onclick={() => copyState.copy(raw)}
					class="absolute top-0 right-6 p-1.5 rounded-lg transition-all active:scale-90"
					style="background: rgba(255,255,255,0.05); color: #52525b;"
					aria-label="Copiar raw"
				>
					{#if copyState.copied}
						<Check class="w-3.5 h-3.5 text-[#10b981]" />
					{:else}
						<Copy class="w-3.5 h-3.5" />
					{/if}
				</button>
			</div>
		</div>
	{/if}
</div>
