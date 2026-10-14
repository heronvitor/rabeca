import { getAudioContext } from './audio.js';

const MAX_FREQ = 1000;
const SMOOTHING = 0.15;

export function autoCorrelate(buffer, sampleRate) {
    const SIZE = buffer.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
    if (Math.sqrt(rms / SIZE) < 0.01) return -1;

    let r1 = 0, r2 = SIZE - 1;
    const thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }

    const buf = buffer.slice(r1, r2);
    const c = new Array(buf.length).fill(0);
    for (let i = 0; i < buf.length; i++)
        for (let j = 0; j < buf.length - i; j++) c[i] = c[i] + buf[j] * buf[j + i];

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < buf.length; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    return sampleRate / maxpos;
}

// Abre o microfone e chama onPitch(freqSuavizada) a cada frame com nota detectada
export async function startPitchDetection(onPitch) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = getAudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    ctx.createMediaStreamSource(stream).connect(analyser);

    const buffer = new Float32Array(analyser.fftSize);
    let smoothedFreq = 0;

    const loop = () => {
        analyser.getFloatTimeDomainData(buffer);
        const freq = autoCorrelate(buffer, ctx.sampleRate);
        if (freq !== -1 && freq < MAX_FREQ) {
            smoothedFreq = SMOOTHING * freq + (1 - SMOOTHING) * smoothedFreq;
            onPitch(smoothedFreq);
        }
        requestAnimationFrame(loop);
    };
    loop();
}
