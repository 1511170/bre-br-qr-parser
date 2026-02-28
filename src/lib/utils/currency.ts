import { CurrencyMap } from '$lib/core/parser/types';

export function formatCurrency(amount: number, currencyCode?: string | null): string {
	const locale = currencyCode === '840' ? 'en-US' : 'es-CO';
	return new Intl.NumberFormat(locale, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2
	}).format(amount);
}

export function getCurrencySymbol(currencyCode: string | null): string {
	if (!currencyCode) return '$';
	return CurrencyMap[currencyCode]?.symbol ?? '$';
}

export function getCurrencyCode(currencyCode: string | null): string {
	if (!currencyCode) return '';
	return CurrencyMap[currencyCode]?.code ?? currencyCode;
}

export function formatKey(key: string): string {
	if (key.startsWith('@')) return key;
	// Format Colombian phone numbers: 3001234567 → 300 123 4567
	if (/^\d{10}$/.test(key)) return key.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
	return key;
}
