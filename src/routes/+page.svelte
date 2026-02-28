<script lang="ts">
	import { slide, fade } from 'svelte/transition';
	import { ScanLine, Keyboard, Zap, History, Trash2, X } from 'lucide-svelte';
	import { parseEMVQR } from '$lib/core/parser/tlv-parser';
	import type { ParsedQR } from '$lib/core/parser/types';
	import { formatCurrency, getCurrencySymbol } from '$lib/utils/currency';
	import CameraScanner from '$lib/components/scanner/CameraScanner.svelte';
	import MerchantCard from '$lib/components/parser/MerchantCard.svelte';
	import EMVDisplay from '$lib/components/parser/EMVDisplay.svelte';

	// ─── State ───────────────────────────────────────────────────────────────────
	let rawInput = $state('');
	let parsed = $state<ParsedQR | null>(null);
	let showScanner = $state(false);
	let error = $state<string | null>(null);
	let history = $state<ParsedQR[]>([]);

	// ─── Samples ─────────────────────────────────────────────────────────────────
	const SAMPLES = [
		{
			name: 'Café Estático',
			data: '00020101021126350017com.redeban.ec.qr011012345678905204581253031705802CO5912CAFE CENTRAL6006BOGOTA62070503***6304A1B2'
		},
		{
			name: 'Rest. $45.000',
			data: '00020101021226350017com.redeban.ec.qr01101234567890520458125303170540845000.005802CO5916RESTAURANTE LUNA6006BOGOTA62190115FACT-2025-008476304F3D1'
		},
		{
			name: 'Tienda @alias',
			data: '00020101021226400017com.redeban.ec.qr0115@BBVA310555123452045411530317054058500052015802CO5920TIENDA DONA MERCEDES6008MEDELLIN62130109ORD-987656304B7C3'
		}
	];

	// ─── Handlers ─────────────────────────────────────────────────────────────────
	function handleParse(data?: string) {
		const input = (data ?? rawInput).trim();
		if (!input) {
			error = 'Ingresa el contenido del código QR.';
			return;
		}

		try {
			const result = parseEMVQR(input);
			const hasContent =
				result.fields.length > 0 ||
				result.merchantAccounts.length > 0;

			if (!hasContent) {
				error = 'Código QR no reconocido o formato no soportado';
				parsed = null;
				return;
			}

			parsed = result;
			rawInput = input;
			error = null;

			// Add to history (no duplicates)
			if (!history.find((h) => h.raw === input)) {
				history = [result, ...history].slice(0, 10);
			}
		} catch (e) {
			error = `Error al procesar: ${e instanceof Error ? e.message : 'Formato inválido'}`;
			parsed = null;
		}
	}

	function handleScanResult(data: string) {
		showScanner = false;
		rawInput = data;
		handleParse(data);
	}

	function handleClear() {
		rawInput = '';
		parsed = null;
		error = null;
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			handleParse();
		}
	}
</script>

<svelte:head>
	<title>Bre-B QR Parser</title>
</svelte:head>

<div
	class="min-h-screen font-sans"
	style="background-color: #050507; color: #fafafa;"
>
	<div class="max-w-lg mx-auto px-4 py-8 pb-24">

		<!-- ── Header ── -->
		<header class="text-center mb-8 space-y-2">
			<div
				class="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-2 shadow-[var(--shadow-glow)]"
				style="background: linear-gradient(135deg, #10b981, #059669);"
			>
				<Zap class="w-7 h-7 text-white" />
			</div>
			<h1
				class="text-3xl font-bold tracking-tight"
				style="background: linear-gradient(90deg, #fafafa 0%, #a1a1aa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;"
			>
				Bre-B Parser
			</h1>
			<p class="text-sm" style="color: #71717a;">
				Decodifica códigos QR de pago EMVCo / Bre-B
			</p>
		</header>

		<!-- ── Input Section ── -->
		<div class="space-y-3 mb-6">
			<div class="relative group">
				<textarea
					bind:value={rawInput}
					onkeydown={handleKeydown}
					placeholder="Pega el contenido del QR aquí…"
					rows={4}
					class="w-full rounded-2xl p-4 pr-10 text-sm font-mono resize-none transition-all focus:outline-none placeholder:text-[#3f3f46]"
					style="background: #0a0a0f; border: 1px solid rgba(255,255,255,0.07); color: #e4e4e7;"
				></textarea>
				{#if rawInput}
					<button
						onclick={handleClear}
						class="absolute top-3 right-3 p-1.5 rounded-lg transition-colors"
						style="color: #52525b;"
						aria-label="Limpiar"
					>
						<X class="w-4 h-4" />
					</button>
				{/if}
			</div>

			<div class="grid grid-cols-2 gap-3">
				<button
					onclick={() => handleParse()}
					class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all active:scale-[0.97] text-white"
					style="background: #10b981; box-shadow: var(--shadow-glow);"
				>
					<Keyboard class="w-4 h-4" />
					<span>Procesar</span>
					<span class="text-[10px] opacity-60 ml-0.5 hidden sm:inline">⌘↵</span>
				</button>

				<button
					onclick={() => (showScanner = true)}
					class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all active:scale-[0.97]"
					style="background: #12121a; border: 1px solid rgba(255,255,255,0.07); color: #fafafa;"
				>
					<ScanLine class="w-4 h-4 text-[#10b981]" />
					<span>Escanear</span>
				</button>
			</div>
		</div>

		<!-- ── Error ── -->
		{#if error}
			<div
				class="mb-4 p-4 rounded-xl text-sm"
				style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #f87171;"
				transition:slide={{ duration: 200 }}
			>
				{error}
			</div>
		{/if}

		<!-- ── Samples (only when no result) ── -->
		{#if !parsed}
			<div class="space-y-3 mb-6" transition:fade={{ duration: 150 }}>
				<p class="text-[10px] font-bold uppercase tracking-widest px-1" style="color: #3f3f46;">
					Ejemplos rápidos
				</p>
				<div class="flex flex-wrap gap-2">
					{#each SAMPLES as sample}
						<button
							onclick={() => { rawInput = sample.data; handleParse(sample.data); }}
							class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all active:scale-95"
							style="background: #0a0a0f; border: 1px solid rgba(255,255,255,0.07); color: #a1a1aa;"
						>
							{sample.name}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- ── Results ── -->
		{#if parsed}
			<div class="space-y-4" transition:fade={{ duration: 200 }}>
				<MerchantCard data={parsed} />
				<EMVDisplay data={parsed} />

				<!-- Back button -->
				<button
					onclick={handleClear}
					class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-colors"
					style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); color: #71717a;"
				>
					<Trash2 class="w-4 h-4" />
					<span>Nueva consulta</span>
				</button>
			</div>
		{/if}

		<!-- ── History ── -->
		{#if history.length > 0 && !parsed}
			<div class="mt-8 space-y-3" transition:slide={{ duration: 200 }}>
				<div
					class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-1"
					style="color: #3f3f46;"
				>
					<History class="w-3 h-3" />
					<span>Historial reciente</span>
				</div>

				<div class="space-y-2">
					{#each history as item (item.raw)}
						<button
							onclick={() => { rawInput = item.raw; handleParse(item.raw); }}
							class="w-full p-3 rounded-xl text-left transition-all active:scale-[0.99] group"
							style="background: #0a0a0f; border: 1px solid rgba(255,255,255,0.06);"
						>
							<div class="flex justify-between items-start mb-1">
								<span
									class="font-medium text-sm truncate pr-3 transition-colors group-hover:text-[#10b981]"
									style="color: #fafafa;"
								>
									{item.merchantName ?? 'Desconocido'}
								</span>
								{#if item.amount}
									<span class="text-sm font-mono font-semibold shrink-0" style="color: #10b981;">
										{getCurrencySymbol(item.currency)}{formatCurrency(item.amount, item.currency)}
									</span>
								{/if}
							</div>
							<div class="text-xs font-mono truncate" style="color: #3f3f46;">
								{item.raw.slice(0, 48)}…
							</div>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- ── Scanner Modal ── -->
	{#if showScanner}
		<CameraScanner onResult={handleScanResult} onClose={() => (showScanner = false)} />
	{/if}
</div>
