import type { NetworkInfo } from './types';

interface FieldDef {
	name: string;
	icon: string;
	format?: (value: string) => string;
}

export const EMV_DICTIONARY: {
	standard: Record<string, FieldDef>;
	additional: Record<string, FieldDef>;
	lang: Record<string, FieldDef>;
} = {
	standard: {
		'00': { name: 'Versión del Payload', icon: '⚙️' },
		'01': {
			name: 'Indicador de Punto de Inicio',
			icon: '🔁',
			format: (v) => (v === '11' ? '11 — Estático (reutilizable)' : v === '12' ? '12 — Dinámico (uso único)' : v)
		},
		'52': { name: 'Código de Categoría del Comercio (MCC)', icon: '🏪' },
		'53': {
			name: 'Código de Moneda de Transacción',
			icon: '💱',
			format: (v) => {
				const map: Record<string, string> = {
					'170': '170 — COP (Peso Colombiano)',
					'840': '840 — USD (Dólar)',
					'986': '986 — BRL (Real Brasileño)',
					'032': '032 — ARS (Peso Argentino)'
				};
				return map[v] ?? v;
			}
		},
		'54': { name: 'Monto de la Transacción', icon: '💰', format: (v) => `$ ${v}` },
		'55': { name: 'Especificidad de la Punta', icon: '🎯' },
		'56': { name: 'Número de Referencia del Comercio', icon: '🔢' },
		'57': { name: 'Número de Referencia del Consumidor', icon: '👤' },
		'58': { name: 'Código de País', icon: '🌍' },
		'59': { name: 'Nombre del Comercio', icon: '🏷️' },
		'60': { name: 'Ciudad del Comercio', icon: '🏙️' },
		'61': { name: 'Código Postal del Comercio', icon: '📮' },
		'63': { name: 'CRC (Verificación de Integridad)', icon: '🔐' },
		'80': { name: 'Datos Definidos por el Sistema', icon: '🖥️' },
		'81': { name: 'Datos Reservados', icon: '🔒' },
		'82': { name: 'Datos Adicionales Reservados', icon: '🔒' }
	},
	additional: {
		'01': { name: 'BILL ID / Nro de Factura', icon: '🧾' },
		'02': { name: 'Código de Móvil', icon: '📱' },
		'03': { name: 'ID de Tienda', icon: '🏬' },
		'04': { name: 'ID de Terminal', icon: '🖥️' },
		'05': { name: 'Código de Fidelidad', icon: '🎁' },
		'06': { name: 'Referencia de la Propina', icon: '💵' },
		'07': { name: 'Propina de Valor Fijo', icon: '💵' },
		'08': { name: 'Porcentaje de Propina', icon: '📊' },
		'09': { name: 'Descripción del Producto', icon: '📝' },
		'10': { name: 'Referencia del Comerciante', icon: '#️⃣' }
	},
	lang: {
		'00': { name: 'Preferencia de Idioma', icon: '🌐' },
		'01': { name: 'Nombre del Comercio (Alterno)', icon: '🏷️' },
		'02': { name: 'Ciudad del Comercio (Alterno)', icon: '🏙️' }
	}
};

export const NETWORK_PATTERNS: Record<string, NetworkInfo> = {
	// Bre-B Colombia (identificadores oficiales Superfinanciera / ACH Colombia)
	'co.gov.superfinanciera': { name: 'Bre-B', color: '#10b981' },
	'co.bre-b': { name: 'Bre-B', color: '#10b981' },
	'bre-b': { name: 'Bre-B', color: '#10b981' },
	breb: { name: 'Bre-B', color: '#10b981' },
	'co.gov': { name: 'Bre-B (Gov CO)', color: '#10b981' },

	// Redes colombianas
	redeban: { name: 'Redeban', color: '#ef4444' },
	ach: { name: 'ACH Colombia', color: '#3b82f6' },
	entrecuentas: { name: 'EntreCuentas', color: '#8b5cf6' },
	bancolombia: { name: 'Bancolombia', color: '#fdda24' },
	daviplata: { name: 'Daviplata', color: '#e60000' },
	nequi: { name: 'Nequi', color: '#7c0cfa' },
	movii: { name: 'MOVii', color: '#00b4e0' },
	'co.com': { name: 'Red Colombia', color: '#3b82f6' },

	// Internacionales
	visa: { name: 'Visa', color: '#1a1f71' },
	mastercard: { name: 'Mastercard', color: '#eb001b' },
	pix: { name: 'PIX', color: '#32bcad' },
	'br.gov': { name: 'PIX Brasil', color: '#32bcad' }
};
