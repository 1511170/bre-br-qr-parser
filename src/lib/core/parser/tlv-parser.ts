import type {
	TLVEntry,
	ParsedQR,
	MerchantAccount,
	EMVField,
	KeyInfo,
	AdditionalField,
	LangField
} from './types';
import { EMV_DICTIONARY, NETWORK_PATTERNS } from './emv-constants';

export function parseTLV(data: string): TLVEntry[] {
	const entries: TLVEntry[] = [];
	let i = 0;

	while (i + 4 <= data.length) {
		const id = data.substring(i, i + 2);
		const lenStr = data.substring(i + 2, i + 4);
		const len = parseInt(lenStr, 10);

		if (isNaN(len) || len < 0 || i + 4 + len > data.length) {
			console.warn(`TLV Parse Warning at offset ${i}: id=${id}, lenStr="${lenStr}"`);
			break;
		}

		const value = data.substring(i + 4, i + 4 + len);
		entries.push({ id, len, value });
		i += 4 + len;
	}

	return entries;
}

export function detectNetwork(globalId: string) {
	if (!globalId) return null;
	const id = globalId.toLowerCase();

	for (const [pattern, info] of Object.entries(NETWORK_PATTERNS)) {
		if (id.includes(pattern)) return info;
	}
	return null;
}

export function detectKeyType(value: string): KeyInfo['type'] {
	if (value.startsWith('@')) return 'alias';
	if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
		return 'uuid';
	if (value.includes('@') && value.includes('.')) return 'email';
	if (/^\+?\d{10,13}$/.test(value)) return 'phone';
	if (/^\d{9,12}$/.test(value)) return 'nit';
	return 'alias';
}

export function parseEMVQR(rawData: string): ParsedQR {
	const trimmed = rawData.trim();
	const entries = parseTLV(trimmed);

	const result: ParsedQR = {
		raw: trimmed,
		fields: [],
		merchantAccounts: [],
		additionalData: [],
		merchantLang: [],
		keyInfo: null,
		isBreB: false,
		isDynamic: false,
		amount: null,
		currency: null,
		merchantName: null,
		merchantCity: null,
		country: null,
		crc: null,
		timestamp: new Date()
	};

	for (const entry of entries) {
		const idNum = parseInt(entry.id, 10);

		// Merchant Account Information (02–51)
		if (idNum >= 2 && idNum <= 51) {
			const subEntries = parseTLV(entry.value);
			const globalId = subEntries.find((s) => s.id === '00')?.value ?? '';
			const network = detectNetwork(globalId);

			const account: MerchantAccount = {
				id: entry.id,
				rawValue: entry.value,
				globalId,
				network,
				subFields: subEntries.map((s) => ({
					id: s.id,
					value: s.value,
					label:
						s.id === '00'
							? 'Identificador Global'
							: s.id === '01'
								? 'Llave / Destinatario'
								: `Campo ${s.id}`
				}))
			};

			// Detectar Bre-B
			if (/redeban|ach|entrecuentas|bre-?b/i.test(globalId)) {
				result.isBreB = true;
			}

			// Extraer llave del primer sub-campo válido (distinto al global ID)
			if (!result.keyInfo) {
				const candidate = subEntries.find((s) => s.id !== '00' && s.value.length > 3);
				if (candidate) {
					result.keyInfo = {
						value: candidate.value,
						source: network?.name ?? `Cuenta ${entry.id}`,
						type: detectKeyType(candidate.value)
					};
				}
			}

			result.merchantAccounts.push(account);
		}
		// Additional Data Field Template (62)
		else if (entry.id === '62') {
			const subEntries = parseTLV(entry.value);
			result.additionalData = subEntries.map(
				(s): AdditionalField => ({
					id: s.id,
					value: s.value,
					name: EMV_DICTIONARY.additional[s.id]?.name ?? `Campo Adicional ${s.id}`,
					icon: EMV_DICTIONARY.additional[s.id]?.icon ?? '📎'
				})
			);
		}
		// Merchant Information Language Template (64)
		else if (entry.id === '64') {
			const subEntries = parseTLV(entry.value);
			result.merchantLang = subEntries.map(
				(s): LangField => ({
					id: s.id,
					value: s.value,
					name: EMV_DICTIONARY.lang[s.id]?.name ?? `Campo Idioma ${s.id}`,
					icon: EMV_DICTIONARY.lang[s.id]?.icon ?? '🌐'
				})
			);
		}
		// Standard fields
		else {
			const fieldDef = EMV_DICTIONARY.standard[entry.id];
			const displayValue = fieldDef?.format ? fieldDef.format(entry.value) : entry.value;

			const field: EMVField = {
				id: entry.id,
				name: fieldDef?.name ?? `Campo ${entry.id}`,
				icon: fieldDef?.icon ?? '📋',
				rawValue: entry.value,
				displayValue
			};

			result.fields.push(field);

			// Extraer metadatos clave
			switch (entry.id) {
				case '01':
					result.isDynamic = entry.value === '12';
					break;
				case '54':
					result.amount = parseFloat(entry.value) || null;
					break;
				case '53':
					result.currency = entry.value;
					break;
				case '59':
					result.merchantName = entry.value;
					break;
				case '60':
					result.merchantCity = entry.value;
					break;
				case '58':
					result.country = entry.value;
					break;
				case '63':
					result.crc = entry.value;
					break;
			}
		}
	}

	return result;
}
