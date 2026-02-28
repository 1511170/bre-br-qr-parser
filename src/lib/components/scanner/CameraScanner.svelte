<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import { X, CameraOff, ScanLine } from 'lucide-svelte';
	import { browser } from '$app/environment';

	let {
		onResult,
		onClose
	}: {
		onResult: (data: string) => void;
		onClose: () => void;
	} = $props();

	let videoEl = $state<HTMLVideoElement | null>(null);
	let canvasEl = $state<HTMLCanvasElement | null>(null);
	let stream = $state<MediaStream | null>(null);
	let error = $state<string | null>(null);
	let scanning = $state(true);
	let scannerReady = $state(false);
	let lastDetected = $state<string | null>(null); // debug: último QR detectado

	let intervalId: ReturnType<typeof setInterval> | null = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let detector: any = null;

	onMount(async () => {
		if (!browser) return;
		await initScanner();
	});

	onDestroy(() => {
		cleanup();
	});

	async function initScanner() {
		try {
			if ('BarcodeDetector' in window) {
				console.log('[Scanner] Usando BarcodeDetector nativo');
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
				await startCamera();
				// Esperar a que el video tenga frames antes de detectar
				await waitForVideoReady();
				startNativeDetection();
			} else {
				console.log('[Scanner] BarcodeDetector no disponible, usando jsQR');
				await startCamera();
				await waitForVideoReady();
				await startJsQRDetection();
			}
		} catch (e) {
			console.error('[Scanner] Error al inicializar:', e);
			error = e instanceof Error ? e.message : 'Error accediendo a la cámara';
		}
	}

	async function startCamera() {
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
				audio: false
			});
			if (videoEl) {
				videoEl.srcObject = stream;
				await videoEl.play();
				scannerReady = true;
				console.log('[Scanner] Cámara iniciada, videoWidth:', videoEl.videoWidth);
			} else {
				console.warn('[Scanner] videoEl es null al intentar reproducir');
			}
		} catch (e) {
			console.error('[Scanner] Error accediendo a cámara:', e);
			throw new Error('No se pudo acceder a la cámara. Verifica los permisos.');
		}
	}

	function waitForVideoReady(): Promise<void> {
		return new Promise((resolve) => {
			const check = () => {
				if (videoEl && videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
					console.log('[Scanner] Video listo:', videoEl.videoWidth, 'x', videoEl.videoHeight);
					resolve();
				} else {
					setTimeout(check, 100);
				}
			};
			check();
		});
	}

	function startNativeDetection() {
		if (!detector || !videoEl) {
			console.warn('[Scanner] detector o videoEl null, no se puede iniciar detección');
			return;
		}

		console.log('[Scanner] Iniciando detección nativa...');
		intervalId = setInterval(async () => {
			if (!scanning || !videoEl || videoEl.readyState < 2) return;
			try {
				const barcodes = await detector.detect(videoEl);
				if (barcodes.length > 0) {
					const raw = barcodes[0].rawValue ?? '';
					console.log('[Scanner] QR detectado (nativo):', raw.slice(0, 60) + '...');
					lastDetected = raw.slice(0, 80);
					if (raw.length > 0) {
						handleFound(raw);
					}
				}
			} catch (e) {
				// Ignorar errores de fotogramas individuales
			}
		}, 200);
	}

	async function startJsQRDetection() {
		console.log('[Scanner] Cargando jsQR...');
		const jsQR = (await import('jsqr')).default;
		if (!videoEl || !canvasEl) {
			console.warn('[Scanner] videoEl o canvasEl null');
			return;
		}

		const ctx = canvasEl.getContext('2d', { willReadFrequently: true });
		if (!ctx) return;

		console.log('[Scanner] Iniciando detección jsQR...');
		intervalId = setInterval(() => {
			if (!scanning || !videoEl || videoEl.readyState < 2 || !canvasEl) return;

			canvasEl.width = videoEl.videoWidth;
			canvasEl.height = videoEl.videoHeight;
			if (canvasEl.width === 0 || canvasEl.height === 0) return;

			ctx.drawImage(videoEl, 0, 0);
			const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
			const code = jsQR(imageData.data, imageData.width, imageData.height);

			if (code?.data) {
				console.log('[Scanner] QR detectado (jsQR):', code.data.slice(0, 60) + '...');
				lastDetected = code.data.slice(0, 80);
				handleFound(code.data);
			}
		}, 200);
	}

	function handleFound(data: string) {
		if (!scanning) return; // evitar doble disparo
		console.log('[Scanner] handleFound, largo del dato:', data.length);
		scanning = false;
		cleanup();
		if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
		onResult(data);
	}

	function cleanup() {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
		if (stream) {
			stream.getTracks().forEach((t) => t.stop());
			stream = null;
		}
	}

	function handleClose() {
		cleanup();
		onClose();
	}
</script>

<div class="fixed inset-0 z-50 bg-black flex flex-col" transition:fade={{ duration: 150 }}>
	{#if error}
		<div class="flex-1 flex items-center justify-center p-6">
			<div class="max-w-xs w-full text-center space-y-4">
				<div class="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
					<CameraOff class="w-8 h-8 text-red-400" />
				</div>
				<h3 class="text-lg font-semibold text-white">Error de Cámara</h3>
				<p class="text-sm text-white/60">{error}</p>
				<button
					onclick={handleClose}
					class="w-full py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
				>
					Cerrar
				</button>
			</div>
		</div>
	{:else}
		<!-- Header -->
		<div
			class="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent"
		>
			<div class="flex items-center gap-2">
				<ScanLine class="w-4 h-4 text-[#10b981]" />
				<span class="text-white/90 font-medium text-sm">Escanea el código QR</span>
			</div>
			<button
				onclick={handleClose}
				class="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
				aria-label="Cerrar escáner"
			>
				<X class="w-5 h-5 text-white" />
			</button>
		</div>

		<!-- Video -->
		<div class="relative flex-1 flex items-center justify-center overflow-hidden">
			<!-- svelte-ignore a11y_media_has_caption -->
			<video bind:this={videoEl} class="absolute inset-0 w-full h-full object-cover" playsinline muted></video>
			<canvas bind:this={canvasEl} class="hidden"></canvas>

			<!-- Overlay -->
			<div class="absolute inset-0 pointer-events-none">
				<!-- Vignette oscura con apertura central -->
				<div
					class="absolute inset-0"
					style="background: radial-gradient(ellipse 280px 280px at 50% 50%, transparent 38%, rgba(0,0,0,0.65) 60%);"
				></div>

				<!-- Marco de escaneo -->
				<div
					class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72"
					style="isolation: isolate;"
				>
					<!-- Esquinas -->
					<div class="absolute top-0 left-0 w-8 h-8 border-l-[3px] border-t-[3px] border-[#10b981] rounded-tl-xl"></div>
					<div class="absolute top-0 right-0 w-8 h-8 border-r-[3px] border-t-[3px] border-[#10b981] rounded-tr-xl"></div>
					<div class="absolute bottom-0 left-0 w-8 h-8 border-l-[3px] border-b-[3px] border-[#10b981] rounded-bl-xl"></div>
					<div class="absolute bottom-0 right-0 w-8 h-8 border-r-[3px] border-b-[3px] border-[#10b981] rounded-br-xl"></div>

					<!-- Línea de escaneo animada -->
					{#if scannerReady && scanning}
						<div
							class="absolute left-1 right-1 h-[2px] rounded-full"
							style="background: linear-gradient(90deg, transparent, #10b981, transparent); box-shadow: 0 0 12px rgba(16,185,129,0.8); animation: scan 2.5s ease-in-out infinite;"
						></div>
					{/if}
				</div>

				<!-- Texto de guía -->
				<div class="absolute bottom-28 left-0 right-0 text-center px-8 space-y-2">
					<p class="text-white/70 text-sm">
						{scannerReady ? 'Apunta al código QR Bre-B / EMVCo' : 'Iniciando cámara...'}
					</p>
					<!-- Debug: mostrar último QR detectado -->
					{#if lastDetected}
						<p class="text-[#10b981] text-xs font-mono break-all px-4">
							✓ Detectado: {lastDetected}
						</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
