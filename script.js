/**
 * RABECA PRO - JAVASCRIPT COMPLETO (FIX: CLIQUE NOS MARCADORES)
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

const MODES_DATA = {
    interval: [
        { name: "2ª Menor", steps: [0, 1] }, { name: "2ª Maior", steps: [0, 2] },
        { name: "3ª Menor", steps: [0, 3] }, { name: "3ª Maior", steps: [0, 4] },
        { name: "4ª Justa", steps: [0, 5] }, { name: "5ª Justa", steps: [0, 7] },
        { name: "6ª Maior", steps: [0, 9] }, { name: "7ª Menor", steps: [0, 10] },
        { name: "7ª Maior", steps: [0, 11] }, { name: "Oitava", steps: [0, 12] }
    ],
    chord: [
        { name: "Maior (T 3 5)", steps: [0, 4, 7] },
        { name: "Menor (T b3 5)", steps: [0, 3, 7] },
        { name: "Aumentado (T 3 #5)", steps: [0, 4, 8] },
        { name: "Diminuto (T b3 b5)", steps: [0, 3, 6] },
        { name: "Sétima Dominante (7)", steps: [0, 4, 7, 10] },
        { name: "Sétima Maior (7M)", steps: [0, 4, 7, 11] },
        { name: "Menor com 7ª (m7)", steps: [0, 3, 7, 10] }
    ]
};

const TUNINGS = {
    standard: [{name:'C',idx:0,f:130.81}, {name:'G',idx:7,f:196.00}, {name:'D',idx:2,f:293.66}, {name:'A',idx:9,f:440.00}, {name:'E',idx:4,f:659.25}],
    cavalo: [{name:'D',idx:2,f:146.83}, {name:'A',idx:9,f:220.00}, {name:'E',idx:4,f:329.63}, {name:'B',idx:11,f:493.88}, {name:'F#',idx:6,f:739.99}]
};

const POSITIONS = { 0:20, 1:65, 2:110, 3:155, 4:200, 5:255, 6:305, 7:355 };
const X_COORDS = [40, 70, 100, 130, 160];

let audioCtx, analyser, isListening = false, smoothedFreq = 0;

// 1. FUNÇÃO DE REPRODUÇÃO
function playNote(frequency) {
    if (!frequency) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    filter.type = "lowpass";
    filter.frequency.value = 2000;

    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
}

// 2. DESENHO E INTERAÇÃO
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
        
        // Corda Visual
        const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
        l.setAttribute("x1", x); l.setAttribute("y1", 20); l.setAttribute("x2", x); l.setAttribute("y2", 540);
        l.setAttribute("stroke", "#ced6e0"); l.setAttribute("stroke-width", [4,3,2.5,1.5,1][i]);
        document.getElementById('strings-layer').appendChild(l);

        // Área de clique da corda (fundo)
        const hitArea = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        hitArea.setAttribute("x", x - 15); hitArea.setAttribute("y", 20);
        hitArea.setAttribute("width", 30); hitArea.setAttribute("height", 520);
        hitArea.setAttribute("fill", "transparent");
        hitArea.style.cursor = "pointer";
        
        hitArea.addEventListener('mousedown', (e) => {
            const relY = getSVGRelativeY(e);
            const s = getClosestSemitone(relY);
            playNote(conf.f * Math.pow(2, s / 12));
            highlightFretTemporarily(x, POSITIONS[s]);
        });
        document.getElementById('strings-layer').appendChild(hitArea);

        // Nome da Corda
        const stLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        stLabel.setAttribute("x", x); stLabel.setAttribute("y", 10);
        stLabel.setAttribute("class", "string-label");
        stLabel.textContent = conf.name;
        document.getElementById('labels-layer').appendChild(stLabel);

        // Marcadores (Notas do Acorde/Intervalo)
        for (let s = 0; s <= 7; s++) {
            const noteName = CHROMATIC_SCALE[(conf.idx + s) % 12];
            const match = targetNotes.find(tn => tn.name === noteName);
            if (match) {
                // Frequência específica para esta nota no braço
                const freq = conf.f * Math.pow(2, s / 12);
                drawMarker(x, POSITIONS[s], noteName, match.color, freq);
            }
        }
    });
}

// 3. AUXILIARES DE CLIQUE
function getSVGRelativeY(e) {
    const svg = document.getElementById('violin-svg');
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const cursor = pt.matrixTransform(svg.getScreenCTM().inverse());
    return cursor.y - 40; // Desconto do translate
}

function getClosestSemitone(relY) {
    let closest = 0, minDist = Infinity;
    for (let s = 0; s <= 7; s++) {
        const d = Math.abs(relY - POSITIONS[s]);
        if (d < minDist) { minDist = d; closest = s; }
    }
    return closest;
}

function drawMarker(x, y, label, color, freq) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.style.cursor = "pointer";
    
    // CORREÇÃO: O marcador agora tem seu próprio listener de som
    g.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // Evita disparar o clique da corda embaixo
        playNote(freq);
        highlightFretTemporarily(x, y);
    });

    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", "12");
    c.setAttribute("fill", color); c.setAttribute("stroke", "white");
    
    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("x", x); t.setAttribute("y", y + 4); t.setAttribute("class", "label-note");
    t.style.pointerEvents = "none"; // Texto não interfere no clique
    t.textContent = label;

    g.appendChild(c); g.appendChild(t);
    document.getElementById('markers-layer').appendChild(g);
}

function highlightFretTemporarily(x, y) {
    const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    ring.setAttribute("cx", x); ring.setAttribute("cy", y); ring.setAttribute("r", "16");
    ring.setAttribute("fill", "none"); ring.setAttribute("stroke", "white");
    ring.setAttribute("stroke-width", "2");
    document.getElementById('markers-layer').appendChild(ring);
    setTimeout(() => ring.remove(), 150);
}

// 4. LEGENDA E AFINADOR (MANTIDOS)
function updateLegend(targets) {
    const container = document.getElementById('legend');
    container.innerHTML = '';
    const unique = Array.from(new Set(targets.map(t => t.label))).map(l => targets.find(t => t.label === l));
    unique.forEach(t => {
        const div = document.createElement('div');
        div.className = 'legend-item';
        div.innerHTML = `<span class="dot" style="background:${t.color}"></span> ${t.label}`;
        container.appendChild(div);
    });
}

async function toggleMic() {
    const btn = document.getElementById('micBtn');
    if (!isListening) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioCtx = new AudioContext();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 2048;
            audioCtx.createMediaStreamSource(stream).connect(analyser);
            isListening = true;
            btn.textContent = "Parar Escuta";
            btn.style.background = "#27ae60";
            runDetection();
        } catch (e) { alert("Microfone inacessível."); }
    } else { location.reload(); }
}

function runDetection() {
    if (!isListening) return;
    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);
    const freq = autoCorrelate(buffer, audioCtx.sampleRate);
    if (freq !== -1 && freq < 1200) {
        smoothedFreq = 0.15 * freq + 0.85 * smoothedFreq;
        drawLiveMarker(smoothedFreq);
    }
    requestAnimationFrame(runDetection);
}

function autoCorrelate(buf, sr) {
    let rms = 0; for(let i=0;i<buf.length;i++) rms += buf[i]*buf[i];
    if (Math.sqrt(rms/buf.length) < 0.01) return -1;
    let r1=0, r2=buf.length-1, thres=0.2;
    for(let i=0;i<buf.length/2;i++) if(Math.abs(buf[i])<thres){r1=i;break;}
    for(let i=1;i<buf.length/2;i++) if(Math.abs(buf[buf.length-i])<thres){r2=buf.length-i;break;}
    let b=buf.slice(r1,r2), c=new Array(b.length).fill(0);
    for(let i=0;i<b.length;i++) for(let j=0;j<b.length-i;j++) c[i]+=b[j]*b[j+i];
    let d=0; while(c[d]>c[d+1]) d++;
    let mv=-1, mp=-1; for(let i=d;i<b.length;i++) if(c[i]>mv){mv=c[i];mp=i;}
    return sr/mp;
}

function drawLiveMarker(freq) {
    const tuningKey = document.getElementById('tuningSelect').value;
    const count = parseInt(document.getElementById('stringCount').value);
    const tuning = TUNINGS[tuningKey].slice(0, count);
    let bStr = -1, bY = -1, noteName = "";

    tuning.forEach((st, i) => {
        const semi = 12 * Math.log2(freq / st.f);
        if (semi >= -0.5 && semi <= 7.5) {
            bStr = i;
            const base = Math.floor(semi), frac = semi - base;
            bY = POSITIONS[Math.max(0,base)] + (POSITIONS[Math.min(7,base+1)] - POSITIONS[Math.max(0,base)]) * frac;
            noteName = CHROMATIC_SCALE[(st.idx + Math.round(semi)) % 12];
        }
    });

    let group = document.getElementById('live-marker-group');
    if (bStr !== -1) {
        if (!group) {
            group = document.createElementNS("http://www.w3.org/2000/svg", "g");
            group.id = 'live-marker-group';
            group.innerHTML = `<circle id="live-c" r="15" fill="none" stroke="cyan" stroke-width="3" stroke-dasharray="4"/>
                               <text id="live-t" class="live-note-label"></text>`;
            document.getElementById('markers-layer').appendChild(group);
        }
        document.getElementById('live-c').setAttribute("cx", X_COORDS[bStr]);
        document.getElementById('live-c').setAttribute("cy", bY);
        const txt = document.getElementById('live-t');
        txt.setAttribute("x", X_COORDS[bStr]); txt.setAttribute("y", bY);
        txt.textContent = noteName;
    } else if (group) group.remove();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('analysisMode').addEventListener('change', updateTypeOptions);
    document.querySelectorAll('select').forEach(s => s.addEventListener('change', updateDiagram));
    document.getElementById('micBtn').addEventListener('click', toggleMic);
    updateTypeOptions();
});