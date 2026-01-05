/**
 * VIOLINO & RABECA INTERATIVA - VERSÃO CROMÁTICA COMPLETA
 */

const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const TUNINGS = {
    standard: [
        { name: 'C', rootIndex: 0, freq: 130.81 }, 
        { name: 'G', rootIndex: 7, freq: 196.00 },
        { name: 'D', rootIndex: 2, freq: 293.66 }, 
        { name: 'A', rootIndex: 9, freq: 440.00 }, 
        { name: 'E', rootIndex: 4, freq: 659.25 }
    ],
    cavalo: [
        { name: 'D', rootIndex: 2, freq: 146.83 }, 
        { name: 'A', rootIndex: 9, freq: 220.00 },
        { name: 'E', rootIndex: 4, freq: 329.63 }, 
        { name: 'B', rootIndex: 11, freq: 493.88 }, 
        { name: 'F#', rootIndex: 6, freq: 739.99 }
    ]
};

const POSITIONS = { 0: 20, 1: 65, 2: 110, 3: 155, 4: 200, 5: 255, 6: 305, 7: 355 };
const X_COORDS = [40, 70, 100, 130, 160];
const STRING_WIDTHS = [4.5, 3.5, 2.5, 1.8, 1.0];

let audioCtx, analyser, source, stream;
let isListening = false;
let smoothedFreq = 0;
const smoothingFactor = 0.15;

function updateDiagram() {
    const count = parseInt(document.getElementById('stringCount').value);
    const tuningKey = document.getElementById('tuningSelect').value;
    const rootNote = document.getElementById('rootNote').value;
    const intervalStep = parseInt(document.getElementById('intervalType').value);
    
    const currentTuning = TUNINGS[tuningKey].slice(0, count);

    const markersLayer = document.getElementById('markers-layer');
    const stringsLayer = document.getElementById('strings-layer');
    const labelsLayer = document.getElementById('labels-layer');
    const fretLayer = document.getElementById('frets-layer');
    const fingerboard = document.getElementById('fingerboard');
    const nut = document.getElementById('nut');
    
    markersLayer.innerHTML = '';
    stringsLayer.innerHTML = '';
    labelsLayer.innerHTML = '';
    fretLayer.innerHTML = '';

    const boardWidth = (count === 4) ? 120 : 150;
    fingerboard.setAttribute("width", boardWidth);
    nut.setAttribute("x2", 25 + boardWidth);

    // Linhas de posição (Trastes)
    Object.values(POSITIONS).forEach(y => {
        if (y === 20) return;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", "25"); line.setAttribute("y1", y);
        line.setAttribute("x2", 25 + boardWidth); line.setAttribute("y2", y);
        line.setAttribute("class", "fret-line");
        fretLayer.appendChild(line);
    });

    const rootIdx = CHROMATIC_SCALE.indexOf(rootNote);
    const intervalNote = CHROMATIC_SCALE[(rootIdx + intervalStep) % 12];

    currentTuning.forEach((conf, i) => {
        const x = X_COORDS[i];
        
        // Desenha Corda
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x); line.setAttribute("y1", 20);
        line.setAttribute("x2", x); line.setAttribute("y2", 540);
        line.setAttribute("stroke", "#ced6e0");
        line.setAttribute("stroke-width", STRING_WIDTHS[i]);
        stringsLayer.appendChild(line);

        // Nome da Corda
        const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
        txt.setAttribute("x", x); txt.setAttribute("y", 10);
        txt.setAttribute("class", "string-label");
        txt.textContent = conf.name;
        labelsLayer.appendChild(txt);

        // Busca de notas
        for (let s = 0; s <= 7; s++) {
            let noteIdx = (conf.rootIndex + s) % 12;
            let currentNoteName = CHROMATIC_SCALE[noteIdx];

            if (currentNoteName === rootNote) {
                drawMarker(x, POSITIONS[s], rootNote, 'marker-root');
            } else if (currentNoteName === intervalNote) {
                drawMarker(x, POSITIONS[s], intervalNote, 'marker-interval');
            }
        }
    });
}

function drawMarker(x, y, label, className) {
    const layer = document.getElementById('markers-layer');
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x); circle.setAttribute("cy", y);
    circle.setAttribute("r", "12"); circle.setAttribute("class", className);
    
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x); text.setAttribute("y", y + 4);
    text.setAttribute("class", "label-note " + (className === 'marker-interval' ? 'label-note-dark' : ''));
    text.textContent = label;

    g.appendChild(circle); g.appendChild(text);
    layer.appendChild(g);
}

// --- Funções de Áudio (Afinador Visual) ---

async function toggleMic() {
    const btn = document.getElementById('micBtn');
    if (!isListening) {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 2048;
            source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            isListening = true;
            btn.textContent = "Parar Escuta";
            btn.style.background = "#27ae60";
            drawLiveMarker(); 
        } catch (err) {
            alert("Acesso ao microfone negado.");
        }
    } else {
        if(stream) stream.getTracks().forEach(t => t.stop());
        isListening = false;
        btn.textContent = "Ativar Escuta";
        btn.style.background = "#e74c3c";
        const old = document.getElementById('live-marker-g');
        if (old) old.remove();
    }
}

function autoCorrelate(buffer, sampleRate) {
    let SIZE = buffer.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1;

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    
    let buf = buffer.slice(r1, r2);
    SIZE = buf.length;
    let c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++)
        for (let j = 0; j < SIZE - i; j++) c[i] = c[i] + buf[j] * buf[j + i];

    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
        if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    }
    return sampleRate / maxpos;
}

function drawLiveMarker() {
    if (!isListening) return;
    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);
    const freq = autoCorrelate(buffer, audioCtx.sampleRate);

    if (freq !== -1 && freq < 1000) {
        smoothedFreq = (smoothingFactor * freq) + (1 - smoothingFactor) * smoothedFreq;
        updateLiveVisuals(smoothedFreq);
    }
    requestAnimationFrame(drawLiveMarker);
}

function updateLiveVisuals(freq) {
    const tuningKey = document.getElementById('tuningSelect').value;
    const count = parseInt(document.getElementById('stringCount').value);
    const currentTuning = TUNINGS[tuningKey].slice(0, count);
    
    let bestStringIdx = -1;
    let bestY = -1;

    currentTuning.forEach((string, i) => {
        const semitonesAbove = 12 * Math.log2(freq / string.freq);
        if (semitonesAbove >= -0.5 && semitonesAbove <= 7.5) {
            bestStringIdx = i;
            const base = Math.floor(semitonesAbove);
            const frac = semitonesAbove - base;
            const yStart = POSITIONS[Math.max(0, Math.min(7, base))];
            const yEnd = POSITIONS[Math.max(0, Math.min(7, base + 1))];
            bestY = yStart + (yEnd - yStart) * frac;
        }
    });

    const layer = document.getElementById('markers-layer');
    let liveG = document.getElementById('live-marker-g');

    if (bestStringIdx !== -1 && bestY !== -1) {
        if (!liveG) {
            liveG = document.createElementNS("http://www.w3.org/2000/svg", "g");
            liveG.id = 'live-marker-g';
            liveG.innerHTML = `<circle id="live-circle" r="14" fill="none" stroke="#e74c3c" stroke-width="3" stroke-dasharray="4"/>`;
            layer.appendChild(liveG);
        }
        const circle = document.getElementById('live-circle');
        circle.setAttribute("cx", X_COORDS[bestStringIdx]);
        circle.setAttribute("cy", bestY);
    } else if (liveG) {
        liveG.remove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateDiagram();
    document.querySelectorAll('select').forEach(s => s.addEventListener('change', updateDiagram));
    document.getElementById('micBtn').addEventListener('click', toggleMic);
});
