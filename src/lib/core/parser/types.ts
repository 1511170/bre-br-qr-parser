export interface TLVEntry {
	id: string;
	len: number;
	value: string;
}

export interface EMVField {
	id: string;
	name: string;
	icon: string;
	rawValue: string;
	displayValue: string;
}

export interface SubField {
	id: string;
	value: string;
	label: string;
}

export interface NetworkInfo {
	name: string;
	color: string;
}

export interface MerchantAccount {
	id: string;
	rawValue: string;
	globalId: string;
	network: NetworkInfo | null;
	subFields: SubField[];
}

export interface AdditionalField {
	id: string;
	value: string;
	name: string;
	icon: string;
}

export interface LangField {
	id: string;
	value: string;
	name: string;
	icon: string;
}

export interface KeyInfo {
	value: string;
	source: string;
	type: 'email' | 'phone' | 'nit' | 'alias' | 'uuid';
}

export interface ParsedQR {
	raw: string;
	fields: EMVField[];
	merchantAccounts: MerchantAccount[];
	additionalData: AdditionalField[];
	merchantLang: LangField[];
	keyInfo: KeyInfo | null;
	isBreB: boolean;
	isDynamic: boolean;
	amount: number | null;
	currency: string | null;
	merchantName: string | null;
	merchantCity: string | null;
	country: string | null;
	crc: string | null;
	timestamp: Date;
}

export const CurrencyMap: Record<string, { code: string; symbol: string; name: string }> = {
	'170': { code: 'COP', symbol: '$', name: 'Peso Colombiano' },
	'840': { code: 'USD', symbol: 'US$', name: 'Dólar Estadounidense' },
	'986': { code: 'BRL', symbol: 'R$', name: 'Real Brasileño' },
	'032': { code: 'ARS', symbol: '$', name: 'Peso Argentino' }
};
