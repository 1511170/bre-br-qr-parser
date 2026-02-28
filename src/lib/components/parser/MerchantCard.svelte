<script lang="ts">
	import { Check, Copy, MapPin, Wallet, Zap } from 'lucide-svelte';
	import type { ParsedQR } from '$lib/core/parser/types';
	import { formatCurrency, getCurrencySymbol, getCurrencyCode, formatKey } from '$lib/utils/currency';
	import { useCopyState } from '$lib/utils/clipboard';

	let { data }: { data: ParsedQR } = $props();

	const copyState = useCopyState();

	const currencySymbol = $derived(getCurrencySymbol(data.currency));
	const currencyCode = $derived(getCurrencyCode(data.currency));
	const formattedAmount = $derived(data.amount ? formatCurrency(data.amount, data.currency) : null);
</script>

<div class="relative overflow-hidden rounded-3xl glass-strong p-6 shadow-[var(--shadow-glow)]">
	<!-- Gradient background overlay -->
	<div
		class="absolute inset-0 pointer-events-none"
		style="background: linear-gradient(135deg, rgba(16,185,129,0.04) 0%, transparent 50%, rgba(59,130,246,0.04) 100%);"
	></div>

	<!-- Badges -->
	<div class="relative flex flex-wrap gap-2 mb-4">
		<span
			class="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase"
			style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3);"
		>
			{data.isDynamic ? 'Dinámico' : 'Estático'}
		</span>
		{#if data.isBreB}
			<span
				class="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-1"
				style="background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3);"
			>
				<Zap class="w-3 h-3" />
				Bre-B
			</span>
		{/if}
		{#if data.country === 'BR'}
			<span
				class="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase"
				style="background: rgba(139,92,246,0.15); color: #a78bfa; border: 1px solid rgba(139,92,246,0.3);"
			>
				PIX
			</span>
		{/if}
		{#if data.crc}
			<span
				class="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ml-auto"
				style="background: rgba(255,255,255,0.05); color: #52525b; border: 1px solid rgba(255,255,255,0.07);"
			>
				CRC {data.crc}
			</span>
		{/if}
	</div>

	<!-- Merchant info -->
	<div class="relative space-y-1 mb-5">
		<h2 class="text-2xl font-bold text-[#fafafa] tracking-tight leading-tight">
			{data.merchantName ?? 'Comercio Desconocido'}
		</h2>
		{#if data.merchantCity}
			<div class="flex items-center gap-1.5 text-[#a1a1aa]">
				<MapPin class="w-3.5 h-3.5 shrink-0" />
				<span class="text-sm"
					>{data.merchantCity}{data.country ? `, ${data.country}` : ''}</span
				>
			</div>
		{/if}
	</div>

	<!-- Amount -->
	{#if formattedAmount}
		<div
			class="relative mb-5 p-4 rounded-2xl"
			style="background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2);"
		>
			<div class="text-[10px] font-bold text-[#10b981] uppercase tracking-widest mb-1.5">
				Monto a Pagar
			</div>
			<div class="flex items-baseline gap-2">
				<span class="text-4xl font-bold text-[#fafafa] font-mono tracking-tight">
					{currencySymbol} {formattedAmount}
				</span>
				{#if currencyCode}
					<span class="text-sm font-semibold text-[#a1a1aa]">{currencyCode}</span>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Key / Llave -->
	{#if data.keyInfo}
		<div
			class="relative p-4 rounded-2xl transition-colors group"
			style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);"
		>
			<div class="flex items-start justify-between gap-3">
				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-1.5 mb-1.5">
						<Wallet class="w-3 h-3 text-[#10b981]" />
						<span class="text-[10px] font-bold text-[#10b981] uppercase tracking-widest"
							>Llave / Identificador</span
						>
					</div>
					<div class="font-mono text-sm text-[#fafafa] break-all leading-relaxed">
						{formatKey(data.keyInfo.value)}
					</div>
					<div class="flex items-center gap-2 mt-1.5">
						<span class="text-xs text-[#52525b]">vía {data.keyInfo.source}</span>
						<span
							class="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded"
							style="background: rgba(255,255,255,0.06); color: #71717a;"
						>
							{data.keyInfo.type}
						</span>
					</div>
				</div>

				<button
					onclick={() => copyState.copy(data.keyInfo!.value)}
					class="shrink-0 p-2.5 rounded-xl transition-all active:scale-90"
					style="background: rgba(255,255,255,0.05); color: #71717a;"
					aria-label="Copiar llave"
				>
					{#if copyState.copied}
						<Check class="w-4 h-4 text-[#10b981]" />
					{:else}
						<Copy class="w-4 h-4" />
					{/if}
				</button>
			</div>
		</div>
	{/if}
</div>
