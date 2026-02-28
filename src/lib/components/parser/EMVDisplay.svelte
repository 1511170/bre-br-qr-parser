<script lang="ts">
	import { Building2, Globe, Tag } from 'lucide-svelte';
	import type { ParsedQR } from '$lib/core/parser/types';
	import FieldRow from './FieldRow.svelte';
	import RawData from './RawData.svelte';

	let { data }: { data: ParsedQR } = $props();
</script>

<div class="space-y-4">
	<!-- Standard Fields -->
	{#if data.fields.length > 0}
		<section>
			<h3 class="text-[10px] font-bold text-[#52525b] uppercase tracking-widest px-1 mb-2">
				Campos Estándar EMV
			</h3>
			<div
				class="rounded-2xl divide-y"
				style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); divide-color: rgba(255,255,255,0.04);"
			>
				{#each data.fields as field (field.id)}
					<FieldRow {field} />
				{/each}
			</div>
		</section>
	{/if}

	<!-- Merchant Accounts -->
	{#if data.merchantAccounts.length > 0}
		<section>
			<h3
				class="text-[10px] font-bold text-[#52525b] uppercase tracking-widest px-1 mb-2 flex items-center gap-1.5"
			>
				<Building2 class="w-3 h-3" />
				Cuentas de Comercio ({data.merchantAccounts.length})
			</h3>
			<div class="space-y-2">
				{#each data.merchantAccounts as account (account.id)}
					<div
						class="p-4 rounded-2xl"
						style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);"
					>
						<div class="flex items-center gap-2 mb-3">
							<span class="text-xs font-mono text-[#52525b]">ID {account.id}</span>
							{#if account.network}
								<span
									class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full"
									style="background-color: {account.network.color}20; color: {account.network.color}; border: 1px solid {account.network.color}40;"
								>
									{account.network.name}
								</span>
							{/if}
						</div>
						<div class="space-y-2">
							{#each account.subFields as sub (sub.id)}
								<div class="flex items-start justify-between gap-4 text-xs">
									<span class="text-[#52525b] shrink-0">{sub.label}</span>
									<span class="font-mono text-[#a1a1aa] break-all text-right">{sub.value}</span>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Additional Data -->
	{#if data.additionalData.length > 0}
		<section>
			<h3
				class="text-[10px] font-bold text-[#52525b] uppercase tracking-widest px-1 mb-2 flex items-center gap-1.5"
			>
				<Tag class="w-3 h-3" />
				Datos Adicionales
			</h3>
			<div
				class="rounded-2xl divide-y"
				style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); divide-color: rgba(255,255,255,0.04);"
			>
				{#each data.additionalData as field (field.id)}
					<div class="flex items-start gap-3 p-3">
						<span class="text-base shrink-0">{field.icon}</span>
						<div class="min-w-0 flex-1">
							<div class="text-xs text-[#52525b] mb-0.5">{field.name}</div>
							<div class="font-mono text-sm text-[#a1a1aa] break-all">{field.value}</div>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Language Template -->
	{#if data.merchantLang.length > 0}
		<section>
			<h3
				class="text-[10px] font-bold text-[#52525b] uppercase tracking-widest px-1 mb-2 flex items-center gap-1.5"
			>
				<Globe class="w-3 h-3" />
				Plantilla de Idioma
			</h3>
			<div
				class="rounded-2xl divide-y"
				style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); divide-color: rgba(255,255,255,0.04);"
			>
				{#each data.merchantLang as field (field.id)}
					<div class="flex items-start gap-3 p-3">
						<span class="text-base shrink-0">{field.icon}</span>
						<div class="min-w-0 flex-1">
							<div class="text-xs text-[#52525b] mb-0.5">{field.name}</div>
							<div class="font-mono text-sm text-[#a1a1aa] break-all">{field.value}</div>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Raw Data (collapsible) -->
	<RawData raw={data.raw} />
</div>
