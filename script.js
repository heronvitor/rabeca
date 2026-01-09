/**
 * VIOLINO & RABECA INTERATIVA - COM ESCALAS NORDESTINAS
 */

const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const COLOR_MAP = {
    0: { color: '#27ae60', label: 'Tônica (1)' },
    1: { color: '#e67e22', label: '2ª menor' },
    2: { color: '#e74c3c', label: '2ª maior' },
    3: { color: '#3498db', label: '3ª menor' },
    4: { color: '#3498db', label: '3ª maior' },
    5: { color: '#9b59b6', label: '4ª justa' },
    6: { color: '#95a5a6', label: 'Tritono' },
    7: { color: '#f1c40f', label: '5ª justa' },
    8: { color: '#d35400', label: '6ª menor' },
    9: { color: '#d35400', label: '6ª maior' },
    10: { color: '#e74c3c', label: '7ª menor' },
    11: { color: '#e74c3c', label: '7ª maior' },
    12: { color: '#2ecc71', label: 'Oitava' }
};

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
    ],
    scale: [
        { name: "Maior", steps: [0, 2, 4, 5, 7, 9, 11] },
        { name: "Menor Natural", steps: [0, 2, 3, 5, 7, 8, 10] },
        { name: "Menor Melódica", steps: [0, 2, 3, 5, 7, 9, 11] },
        { name: "Mixolídio", steps: [0, 2, 4, 5, 7, 9, 10] },
        { name: "Lídio b7", steps: [0, 2, 4, 6, 7, 9, 10] },
        { name: "Dórico", steps: [0, 2, 3, 5, 7, 9, 10] },
        { name: "Pentatônica Maior", steps: [0, 2, 4, 7, 9] },
        { name: "Pentatônica Menor", steps: [0, 3, 5, 7, 10] },
    ]
};

const TUNINGS = {
    standard: [{name:'C',idx:0,f:130.8},{name:'G',idx:7,f:196.0},{name:'D',idx:2,f:293.6},{name:'A',idx:9,f:440.0},{name:'E',idx:4,f:659.2}],
    cavalo: [{name:'D',idx:2,f:146.8},{name:'A',idx:9,f:220.0},{name:'E',idx:4,f:329.6},{name:'B',idx:11,f:493.8},{name:'F#',idx:6,f:739.9}]
};

const POSITIONS = { 0:20, 1:65, 2:110, 3:155, 4:200, 5:255, 6:305, 7:355 };
const X_COORDS = [40, 70, 100, 130, 160];

let audioCtx, analyser, isListening = false, smoothedFreq = 0;

// === NOVA FUNÇÃO PARA REPRODUZIR SOM ===
function playNote(freq) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter(); // Adicionamos um filtro para dar o tom "rouco"

    // 'sawtooth' (dente de serra) é o timbre padrão para simular violinos
    osc.type = 'sawtooth'; 
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    // Configuração do Filtro (Aqui é onde transformamos violino em rabeca)
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, audioCtx.currentTime); // Corta o agudo "ardido" do digital
    filter.Q.setValueAtTime(5, audioCtx.currentTime); // Dá uma leve ressonância na região média

    // Envelope de Volume (Sustentação longa conforme solicitado)
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.15); // Ataque um pouco mais lento para simular a arcada
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2.5); // Decaimento suave

    // Conexão: Oscilador -> Filtro -> Ganho -> Saída
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 2.6);
    updateStaff(freq);
}

// === NOVA FUNÇÃO PARA IDENTIFICAR CLIQUE NO BRAÇO ===
function handleSVGClick(event) {
    event.preventDefault(); // Adicione isso para evitar conflitos no touch do celular
    
    const svg = document.getElementById('violin-svg');
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    
    const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
    const x = svgPoint.x - 30; // Ajuste do translate
    const y = svgPoint.y - 40; // Ajuste do translate

    const count = parseInt(document.getElementById('stringCount').value);
    const tuningKey = document.getElementById('tuningSelect').value;
    const currentTuning = TUNINGS[tuningKey].slice(0, count);

    // Achar corda mais próxima
    let strIdx = -1;
    let minDistX = 15;
    X_COORDS.slice(0, count).forEach((cx, i) => {
        if (Math.abs(cx - x) < minDistX) {
            minDistX = Math.abs(cx - x);
            strIdx = i;
        }
    });

    // Achar traste/posição mais próxima
    let semi = -1;
    let minDistY = 22;
    Object.entries(POSITIONS).forEach(([s, cy]) => {
        if (Math.abs(cy - y) < minDistY) {
            minDistY = Math.abs(cy - y);
            semi = parseInt(s);
        }
    });

    if (strIdx !== -1 && semi !== -1) {
        const freq = currentTuning[strIdx].f * Math.pow(2, semi / 12);
        playNote(freq);
    }
}

// === PERSISTÊNCIA  ===
function saveSettings() {
    const settings = {
        stringCount: document.getElementById('stringCount').value,
        tuningSelect: document.getElementById('tuningSelect').value,
        rootNote: document.getElementById('rootNote').value,
        analysisMode: document.getElementById('analysisMode').value,
        typeSelect: document.getElementById('typeSelect').value,
        showStaff: document.getElementById('showStaff').value // ADICIONE ESTA LINHA
    };
    localStorage.setItem('violinAppSettings', JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem('violinAppSettings');
    if (!saved) return false;

    try {
        const settings = JSON.parse(saved);
        document.getElementById('stringCount').value = settings.stringCount || '4';
        document.getElementById('tuningSelect').value = settings.tuningSelect || 'cavalo';
        document.getElementById('rootNote').value = settings.rootNote || 'G';
        document.getElementById('analysisMode').value = settings.analysisMode || 'interval';
        
        const showStaffValue = settings.showStaff || 'true';
        document.getElementById('showStaff').value = showStaffValue;
        document.getElementById('staff-container').style.display = (showStaffValue === 'true') ? 'block' : 'none';

        if (settings.typeSelect) {
            window.tempTypeSelect = settings.typeSelect;
        }
        return true;
    } catch (e) {
        console.warn("Erro ao carregar configurações:", e);
        return false;
    }
}

// === FUNÇÕES PRINCIPAIS ===
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

    if (window.tempTypeSelect !== undefined) {
        typeSelect.value = window.tempTypeSelect;
        delete window.tempTypeSelect;
    }

    updateDiagram();
}

function updateDiagram() {
    const count = parseInt(document.getElementById('stringCount').value);
    const tuningKey = document.getElementById('tuningSelect').value;
    const rootNote = document.getElementById('rootNote').value;
    const mode = document.getElementById('analysisMode').value;
    const typeIdx = parseInt(document.getElementById('typeSelect').value);
    
    const selectedData = MODES_DATA[mode][typeIdx] || MODES_DATA[mode][0];
    const currentTuning = TUNINGS[tuningKey].slice(0, count);
    const rootIdx = CHROMATIC_SCALE.indexOf(rootNote);

    const targetNotes = selectedData.steps.map(step => ({
        name: CHROMATIC_SCALE[(rootIdx + step) % 12],
        color: COLOR_MAP[step % 12].color,
        label: COLOR_MAP[step % 12].label
    }));

    document.getElementById('markers-layer').innerHTML = '';
    document.getElementById('strings-layer').innerHTML = '';
    document.getElementById('labels-layer').innerHTML = '';
    document.getElementById('frets-layer').innerHTML = '';
    updateLegend(targetNotes);

    const boardWidth = (count === 4) ? 120 : 150;
    document.getElementById('fingerboard').setAttribute("width", boardWidth);
    document.getElementById('nut').setAttribute("x2", 25 + boardWidth);

    Object.values(POSITIONS).forEach(y => {
        if (y === 20) return;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", 25); line.setAttribute("y1", y);
        line.setAttribute("x2", 25 + boardWidth); line.setAttribute("y2", y);
        line.setAttribute("stroke", "rgba(255,255,255,0.2)");
        document.getElementById('frets-layer').appendChild(line);
    });

    let tonicStringIndex = null;
    let tonicStepIndex = null;

    for (let i = 0; i < currentTuning.length; i++) {
        const conf = currentTuning[i];
        for (let s = 0; s <= 7; s++) {
            const noteName = CHROMATIC_SCALE[(conf.idx + s) % 12];
            if (noteName === rootNote) {
                tonicStringIndex = i;
                tonicStepIndex = s;
                break;
            }
        }
        if (tonicStringIndex !== null) break;
    }

    for (let i = currentTuning.length - 1; i >= 0; i--) {
        const conf = currentTuning[i];
        const x = X_COORDS[i];
        
        const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
        l.setAttribute("x1", x); l.setAttribute("y1", 20); l.setAttribute("x2", x); l.setAttribute("y2", 540);
        l.setAttribute("stroke", "#ced6e0"); 
        l.setAttribute("stroke-width", [4,3,2,1.5,1][i]);
        document.getElementById('strings-layer').appendChild(l);

        const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
        t.setAttribute("x", x); t.setAttribute("y", 10); t.setAttribute("class", "string-label");
        t.textContent = conf.name;
        document.getElementById('labels-layer').appendChild(t);

        for (let s = 6; s >= 0; s--) {
            if (
                tonicStringIndex !== null &&
                (i < tonicStringIndex || (i === tonicStringIndex && s < tonicStepIndex))
            ) {
                continue;
            }

            const currentNoteName = CHROMATIC_SCALE[(conf.idx + s) % 12];
            const match = targetNotes.find(tn => tn.name === currentNoteName);

            if (match) {
                drawMarker(x, POSITIONS[s], currentNoteName, match.color);
            }
        }
    }

    saveSettings();
}

function updateLegend(targets) {
    const container = document.getElementById('legend');
    container.innerHTML = '';
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
    c.style.cursor = "pointer"; // Indica que é clicável
    
    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("x", x); t.setAttribute("y", y + 4); t.setAttribute("class", "label-note");
    t.textContent = label;

    g.appendChild(c); g.appendChild(t);
    document.getElementById('markers-layer').appendChild(g);
}

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    updateTypeOptions();

    const svgElement = document.getElementById('violin-svg');

    // Função única para desbloquear e tocar
    const handleInteraction = (e) => {
        // 1. Criar/Retomar o contexto (Obrigatório para iOS)
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        // 2. Chamar sua função de clique original
        handleSVGClick(e);
    };

    // Usamos pointerdown que funciona em Mouse e Touch
    svgElement.addEventListener('pointerdown', handleInteraction);

    // Impedir que o toque cause scroll ou zoom no SVG
    svgElement.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

    // Restante dos eventos (mantidos iguais)
    document.getElementById('analysisMode').addEventListener('change', () => {
        updateTypeOptions();
        saveSettings();
    });

    ['stringCount', 'tuningSelect', 'rootNote', 'typeSelect'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateDiagram);
    });

    document.getElementById('micBtn').addEventListener('click', toggleMic);
});

// === LÓGICA DO MICROFONE (mantida inalterada) ===
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
        updateStaff(smoothedFreq);
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
    for (let i = d; i < buf.length; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    return sampleRate / maxpos;
}

function drawLiveMarker(freq) {
    const tuningKey = document.getElementById('tuningSelect').value;
    const count = parseInt(document.getElementById('stringCount').value);
    const tuning = TUNINGS[tuningKey].slice(0, count);
    let bestStr = -1, bestY = -1, nearestNoteName = "";
    tuning.forEach((st, i) => {
        const semi = 12 * Math.log2(freq / st.f);
        if (semi >= -0.5 && semi <= 7.5) {
            bestStr = i;
            const base = Math.floor(semi), frac = semi - base;
            const y1 = POSITIONS[Math.max(0,base)], y2 = POSITIONS[Math.min(7,base+1)];
            bestY = y1 + (y2-y1)*frac;
            const closestSemiIndex = Math.round(semi);
            const chromaticIdx = (st.idx + closestSemiIndex) % 12;
            nearestNoteName = CHROMATIC_SCALE[(chromaticIdx + 12) % 12];
        }
    });
    let liveGroup = document.getElementById('live-marker-group');
    if (bestStr !== -1 && bestY !== -1) {
        const xPos = X_COORDS[bestStr];
        if(!liveGroup) {
            liveGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            liveGroup.id = 'live-marker-group';
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.id = 'live-marker-circle';
            circle.setAttribute("r", "15");
            circle.setAttribute("fill", "none"); 
            circle.setAttribute("stroke", "cyan");
            circle.setAttribute("stroke-width", "3"); 
            circle.setAttribute("stroke-dasharray", "4");
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.id = 'live-marker-text';
            text.setAttribute("class", "live-note-label");
            liveGroup.appendChild(circle); liveGroup.appendChild(text);
            document.getElementById('markers-layer').appendChild(liveGroup);
        }
        const circle = document.getElementById('live-marker-circle');
        const text = document.getElementById('live-marker-text');
        circle.setAttribute("cx", xPos); circle.setAttribute("cy", bestY);
        text.setAttribute("x", xPos); text.setAttribute("y", bestY); 
        text.textContent = nearestNoteName;
    } else if (liveGroup) {
        liveGroup.remove();
    }
}

function updateStaff(freq) {
    const noteLayer = document.getElementById('note-layer');
    if (!noteLayer) return;
    noteLayer.innerHTML = ''; 

    if (freq < 130) return; 

    const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const STAFF_POS = { 'C': 0, 'C#': 0, 'D': 1, 'D#': 1, 'E': 2, 'F': 3, 'F#': 3, 'G': 4, 'G#': 4, 'A': 5, 'A#': 5, 'B': 6 };
    
    const midi = Math.round(12 * Math.log2(freq / 440) + 69);
    const noteName = CHROMATIC_SCALE[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    
    const staffBaseIndex = (octave - 4) * 7 + STAFF_POS[noteName];
    const yPos = 160 - (staffBaseIndex * 10);

    if (yPos >= 160) {
        for (let y = 160; y <= yPos; y += 20) {
            drawLedgerLine(y, noteLayer);
        }
    }
    
    if (yPos <= 40) {
        for (let y = 40; y >= yPos; y -= 20) {
            drawLedgerLine(y, noteLayer);
        }
    }

    const noteText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    noteText.setAttribute("x", 290);
    noteText.setAttribute("y", yPos + 8);
    noteText.setAttribute("style", "font-size: 60px; font-family: serif; pointer-events: none;");
    noteText.textContent = "𝅗𝅥"; 
    noteLayer.appendChild(noteText);

    if (noteName.includes('#')) {
        const sharp = document.createElementNS("http://www.w3.org/2000/svg", "text");
        sharp.setAttribute("x", 265);
        sharp.setAttribute("y", yPos + 5);
        sharp.setAttribute("style", "font-size: 35px; font-family: serif; font-weight: bold; pointer-events: none;");
        sharp.textContent = "#";
        noteLayer.appendChild(sharp);
    }
}

function drawLedgerLine(y, layer) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", 280); 
    line.setAttribute("x2", 330);
    line.setAttribute("y1", y); 
    line.setAttribute("y2", y);
    line.setAttribute("stroke", "black"); 
    line.setAttribute("stroke-width", "2");
    layer.appendChild(line);
}

function toggleStaff() {
    const show = document.getElementById('showStaff').value === 'true';
    document.getElementById('staff-container').style.display = show ? 'block' : 'none';
    saveSettings();
}

document.getElementById('showStaff').addEventListener('change', toggleStaff);