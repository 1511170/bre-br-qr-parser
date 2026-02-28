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

// ─── TLV Core ────────────────────────────────────────────────────────────────

export function parseTLV(data: string): TLVEntry[] {
	const entries: TLVEntry[] = [];
	let i = 0;

	while (i + 4 <= data.length) {
		const id = data.substring(i, i + 2);
		const lenStr = data.substring(i + 2, i + 4);
		const len = parseInt(lenStr, 10);

		if (isNaN(len) || len < 0 || i + 4 + len > data.length) {
			console.warn(`[TLV] Break at offset ${i}: id="${id}", lenStr="${lenStr}", data length=${data.length}`);
			break;
		}

		const value = data.substring(i + 4, i + 4 + len);
		entries.push({ id, len, value });
		i += 4 + len;
	}

	return entries;
}

// ─── Pre-processing: extrae EMV de URLs y otros formatos ─────────────────────

/**
 * Intenta extraer el payload EMVCo puro de un string que puede ser:
 * - EMV directo: "000201..."
 * - URL con param: "https://pay.app/qr?payload=000201..."
 * - Deeplink: "bancolombia://pay?qr=000201..."
 * - Base64: "MDAwMjAx..."
 */
export function extractEMVPayload(raw: string): string {
	const trimmed = raw.trim();

	// Ya es EMV directo
	if (trimmed.startsWith('0002')) {
		return trimmed;
	}

	// Es una URL o deeplink → buscar el payload EMV en query params
	try {
		// Normalizar deeplinks para que URL() los parsee
		const urlStr = trimmed.includes('://')
			? trimmed.replace(/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//, 'https://')
			: trimmed;

		const url = new URL(urlStr.startsWith('http') ? urlStr : 'https://x.co?' + urlStr);
		const params = url.searchParams;

		// Nombres comunes de parámetros EMV en LatAm
		const candidateParams = [
			'payload', 'Payload', 'qr', 'QR', 'data', 'Data',
			'emv', 'EMV', 'p', 'q', 'code', 'qrcode', 'content',
			'br_code', 'brcode' // PIX Brasil
		];

		for (const name of candidateParams) {
			const val = params.get(name);
			if (val && val.startsWith('0002')) {
				console.log(`[Parser] EMV extraído del parámetro URL "${name}"`);
				return decodeURIComponent(val);
			}
		}

		// Si ningún param empieza con 0002, buscar en TODOS los params
		for (const [key, val] of params.entries()) {
			const decoded = decodeURIComponent(val);
			if (decoded.startsWith('0002')) {
				console.log(`[Parser] EMV extraído del parámetro URL "${key}" (fallback)`);
				return decoded;
			}
		}
	} catch {
		// No es una URL válida, continúa
	}

	// Intentar base64 decode
	try {
		const decoded = atob(trimmed);
		if (decoded.startsWith('0002')) {
			console.log('[Parser] EMV extraído de base64');
			return decoded;
		}
	} catch {
		// No es base64
	}

	// Devolver tal cual para que el parseTLV intente lo que pueda
	return trimmed;
}

// ─── Network / Key detection ──────────────────────────────────────────────────

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

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseEMVQR(rawData: string): ParsedQR {
	// 1. Pre-procesar: extraer EMV puro si viene en URL/base64
	const emvPayload = extractEMVPayload(rawData.trim());
	console.log('[Parser] Payload EMV a parsear:', emvPayload.slice(0, 80));

	// 2. Parsear TLV
	const entries = parseTLV(emvPayload);
	console.log('[Parser] Entradas TLV encontradas:', entries.length, entries.map(e => `${e.id}(${e.len})`).join(' '));

	const result: ParsedQR = {
		raw: rawData.trim(),
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
		// También acepta IDs no numéricos como fallback mostrándolos como campo genérico
		if (!isNaN(idNum) && idNum >= 2 && idNum <= 51) {
			const subEntries = parseTLV(entry.value);
			const globalId = subEntries.find((s) => s.id === '00')?.value ?? '';
			const network = detectNetwork(globalId);

			// Detectar Bre-B / Colombia
			if (/redeban|ach|entrecuentas|bre-?b|superfinanciera|co\.gov|co\.bre/i.test(globalId)) {
				result.isBreB = true;
			}

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
								: s.id === '02'
									? 'Datos de Acceso'
									: `Campo ${s.id}`
				}))
			};

			// Si no hay sub-campos parsables, mostrar como campo genérico
			if (subEntries.length === 0 && entry.value.length > 0) {
				account.subFields = [{ id: '??', value: entry.value, label: 'Valor raw' }];
			}

			if (!result.keyInfo) {
				const candidate = subEntries.find((s) => s.id !== '00' && s.value.length > 0);
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
			// Si no parsea sub-campos, mostrar el valor raw como un campo
			if (subEntries.length === 0 && entry.value) {
				result.additionalData = [{ id: '??', value: entry.value, name: 'Datos Adicionales (raw)', icon: '📎' }];
			}
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
		// Standard + Unknown fields (todo lo demás)
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

			switch (entry.id) {
				case '01': result.isDynamic = entry.value === '12'; break;
				case '54': result.amount = parseFloat(entry.value) || null; break;
				case '53': result.currency = entry.value; break;
				case '59': result.merchantName = entry.value; break;
				case '60': result.merchantCity = entry.value; break;
				case '58': result.country = entry.value; break;
				case '63': result.crc = entry.value; break;
			}
		}
	}

	// Si el payload era una URL que no pudo extraerse como EMV, registrar el raw como campo
	if (entries.length === 0 && emvPayload.length > 0) {
		console.warn('[Parser] No se pudo parsear TLV. Raw:', emvPayload.slice(0, 100));
	}

	return result;
}
