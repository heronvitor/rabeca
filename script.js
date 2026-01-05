/**
 * VIOLINO & RABECA INTERATIVA - VERSÃO CORRIGIDA
 */

const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const COLOR_MAP = {
    0: { color: '#27ae60', label: 'Tônica (T)' },
    1: { color: '#e67e22', label: '2ª Menor' },
    2: { color: '#e67e22', label: '2ª Maior' },
    3: { color: '#3498db', label: '3ª Menor' },
    4: { color: '#3498db', label: '3ª Maior' },
    5: { color: '#9b59b6', label: '4ª Justa' },
    6: { color: '#95a5a6', label: 'Tritono' },
    7: { color: '#f1c40f', label: '5ª Justa' },
    8: { color: '#d35400', label: '6ª Menor' },
    9: { color: '#d35400', label: '6ª Maior' },
    10: { color: '#e74c3c', label: '7ª Menor' },
    11: { color: '#e74c3c', label: '7ª Maior' },
    12: { color: '#2ecc71', label: 'Oitava' }
};

// MODIFICADO: Agora os intervalos incluem o passo [0] para mostrar a tônica
const MODES_DATA = {
    interval: [
        { name: "2ª Menor", steps: [0, 1] },
        { name: "2ª Maior", steps: [0, 2] },
        { name: "3ª Menor", steps: [0, 3] },
        { name: "3ª Maior", steps: [0, 4] },
        { name: "4ª Justa", steps: [0, 5] },
        { name: "5ª Justa", steps: [0, 7] },
        { name: "6ª Maior", steps: [0, 9] },
        { name: "7ª Menor", steps: [0, 10] },
        { name: "7ª Maior", steps: [0, 11] },
        { name: "Oitava", steps: [0, 12] }
    ],
    chord: [
        { name: "Maior (M)", steps: [0, 4, 7] },
        { name: "Menor (m)", steps: [0, 3, 7] },
        { name: "Aumentado (aug)", steps: [0, 4, 8] },
        { name: "Diminuto (dim)", steps: [0, 3, 6] },
        { name: "Sétima Dominante (7)", steps: [0, 4, 7, 10] },
        { name: "Sétima Maior (7M)", steps: [0, 4, 7, 11] },
        { name: "Menor com 7ª (m7)", steps: [0, 3, 7, 10] }
    ]
};

const TUNINGS = {
    standard: [{name:'C',idx:0,f:130.8},{name:'G',idx:7,f:196.0},{name:'D',idx:2,f:293.6},{name:'A',idx:9,f:440.0},{name:'E',idx:4,f:659.2}],
    cavalo: [{name:'D',idx:2,f:146.8},{name:'A',idx:9,f:220.0},{name:'E',idx:4,f:329.6},{name:'B',idx:11,f:493.8},{name:'F#',idx:6,f:739.9}]
};

const POSITIONS = { 0:20, 1:65, 2:110, 3:155, 4:200, 5:255, 6:305, 7:355 };
const X_COORDS = [40, 70, 100, 130, 160];

let audioCtx, analyser, isListening = false, smoothedFreq = 0;

function updateTypeOptions() {
    const mode = document.getElementById('analysisMode').value;
    const typeSelect = document.getElementById('typeSelect');
    typeSelect.innerHTML = '';
    
    MODES_DATA[mode].forEach((item, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = item.name;
        typeSelect.appendChild(opt);
    });
    updateDiagram();
}

function updateDiagram() {
    const count = parseInt(document.getElementById('stringCount').value);
    const tuningKey = document.getElementById('tuningSelect').value;
    const rootNote = document.getElementById('rootNote').value;
    const mode = document.getElementById('analysisMode').value;
    const typeIdx = document.getElementById('typeSelect').value;
    
    const selectedData = MODES_DATA[mode][typeIdx] || MODES_DATA[mode][0];
    const currentTuning = TUNINGS[tuningKey].slice(0, count);
    const rootIdx = CHROMATIC_SCALE.indexOf(rootNote);

    const targetNotes = selectedData.steps.map(step => ({
        name: CHROMATIC_SCALE[(rootIdx + step) % 12],
        color: COLOR_MAP[step].color,
        label: COLOR_MAP[step].label
    }));

    document.getElementById('markers-layer').innerHTML = '';
    document.getElementById('strings-layer').innerHTML = '';
    document.getElementById('labels-layer').innerHTML = '';
    document.getElementById('frets-layer').innerHTML = '';
    updateLegend(targetNotes);

    const boardWidth = (count === 4) ? 120 : 150;
    document.getElementById('fingerboard').setAttribute("width", boardWidth);
    document.getElementById('nut').setAttribute("x2", 25 + boardWidth);

    // Trastes
    Object.values(POSITIONS).forEach(y => {
        if (y === 20) return;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", 25); line.setAttribute("y1", y);
        line.setAttribute("x2", 25 + boardWidth); line.setAttribute("y2", y);
        line.setAttribute("class", "fret-line");
        line.setAttribute("stroke", "rgba(255,255,255,0.2)");
        document.getElementById('frets-layer').appendChild(line);
    });

    currentTuning.forEach((conf, i) => {
        const x = X_COORDS[i];
        
        const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
        l.setAttribute("x1", x); l.setAttribute("y1", 20); l.setAttribute("x2", x); l.setAttribute("y2", 540);
        l.setAttribute("stroke", "#ced6e0"); l.setAttribute("stroke-width", [4,3,2,1.5,1][i]);
        document.getElementById('strings-layer').appendChild(l);

        const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
        t.setAttribute("x", x); t.setAttribute("y", 10); t.setAttribute("class", "string-label");
        t.textContent = conf.name;
        document.getElementById('labels-layer').appendChild(t);

        for (let s = 0; s <= 7; s++) {
            const currentNoteName = CHROMATIC_SCALE[(conf.idx + s) % 12];
            const match = targetNotes.find(tn => tn.name === currentNoteName);
            if (match) {
                drawMarker(x, POSITIONS[s], currentNoteName, match.color);
            }
        }
    });
}

function updateLegend(targets) {
    const container = document.getElementById('legend');
    container.innerHTML = '';
    // Filtra duplicatas de labels para a legenda (importante para oitavas)
    const uniqueTargets = Array.from(new Set(targets.map(t => t.label)))
        .map(label => targets.find(t => t.label === label));

    uniqueTargets.forEach(t => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `<span class="dot" style="background:${t.color}"></span> ${t.label}`;
        container.appendChild(item);
    });
}

function drawMarker(x, y, label, color) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", "12");
    c.setAttribute("fill", color); c.setAttribute("stroke", "white");
    
    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("x", x); t.setAttribute("y", y + 4); t.setAttribute("class", "label-note");
    t.textContent = label;

    g.appendChild(c); g.appendChild(t);
    document.getElementById('markers-layer').appendChild(g);
}

// Inicialização e Listeners
document.addEventListener('DOMContentLoaded', () => {
    const analysisMode = document.getElementById('analysisMode');
    analysisMode.addEventListener('change', updateTypeOptions);
    
    document.querySelectorAll('select').forEach(s => {
        s.addEventListener('change', updateDiagram);
    });
    
    document.getElementById('micBtn').addEventListener('click', toggleMic);
    
    updateTypeOptions(); // Inicializa o seletor de tipos e o diagrama
});

/**
 * LÓGICA DO MICROFONE (PITCH DETECTION)
 */
async function toggleMic() {
    const btn = document.getElementById('micBtn');
    if (!isListening) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 2048;
            audioCtx.createMediaStreamSource(stream).connect(analyser);
            isListening = true;
            btn.textContent = "Parar";
            btn.style.background = "#2ecc71";
            runPitchDetection();
        } catch (e) { alert("Microfone não disponível."); }
    } else {
        location.reload(); 
    }
}

function runPitchDetection() {
    if (!isListening) return;
    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);
    const freq = autoCorrelate(buffer, audioCtx.sampleRate);
    if (freq !== -1 && freq < 1000) {
        smoothedFreq = 0.15 * freq + 0.85 * smoothedFreq;
        drawLiveMarker(smoothedFreq);
    }
    requestAnimationFrame(runPitchDetection);
}

function autoCorrelate(buffer, sampleRate) {
    let SIZE = buffer.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
    if (Math.sqrt(rms / SIZE) < 0.01) return -1;

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    
    let buf = buffer.slice(r1, r2);
    let c = new Array(buf.length).fill(0);
    for (let i = 0; i < buf.length; i++)
        for (let j = 0; j < buf.length - i; j++) c[i] = c[i] + buf[j] * buf[j + i];

    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < buf.length; i++) {
        if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    }
    return sampleRate / maxpos;
}

function drawLiveMarker(freq) {
    const tuningKey = document.getElementById('tuningSelect').value;
    const count = parseInt(document.getElementById('stringCount').value);
    const currentTuning = TUNINGS[tuningKey].slice(0, count);
    
    let bestStr = -1, bestY = -1;

    currentTuning.forEach((st, i) => {
        const semi = 12 * Math.log2(freq / st.f);
        if (semi >= -0.5 && semi <= 7.5) {
            bestStr = i;
            const base = Math.floor(semi), frac = semi - base;
            const y1 = POSITIONS[Math.max(0, base)], y2 = POSITIONS[Math.min(7, base + 1)];
            bestY = y1 + (y2 - y1) * frac;
        }
    });

    let live = document.getElementById('live-marker');
    if (bestStr !== -1 && bestY !== -1) {
        if (!live) {
            live = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            live.id = 'live-marker'; live.setAttribute("r", "15");
            live.setAttribute("fill", "none"); live.setAttribute("stroke", "cyan");
            live.setAttribute("stroke-width", "3"); live.setAttribute("stroke-dasharray", "4");
            document.getElementById('markers-layer').appendChild(live);
        }
        live.setAttribute("cx", X_COORDS[bestStr]); live.setAttribute("cy", bestY);
    } else if (live) {
        live.remove();
    }
}