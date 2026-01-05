/**
 * Lógica de Mapeamento de Notas e Intervalos para Violino/Rabeca
 */

const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Configurações de Afinação
const TUNINGS = {
    standard: [
        { name: 'C', rootIndex: 0 }, { name: 'G', rootIndex: 7 },
        { name: 'D', rootIndex: 2 }, { name: 'A', rootIndex: 9 }, { name: 'E', rootIndex: 4 }
    ],
    cavalo: [
        { name: 'D', rootIndex: 2 }, { name: 'A', rootIndex: 9 },
        { name: 'E', rootIndex: 4 }, { name: 'B', rootIndex: 11 }, { name: 'F#', rootIndex: 6 }
    ]
};

// Coordenadas Y (Posições dos dedos/semitons)
const POSITIONS = { 0: 20, 1: 65, 2: 110, 3: 155, 4: 200, 5: 255, 6: 305, 7: 355 };

// Coordenadas X das cordas e espessuras
const X_COORDS = [40, 70, 100, 130, 160];
const STRING_WIDTHS = [4.5, 3.5, 2.5, 1.8, 1.0];

/**
 * Atualiza todo o diagrama baseado nos seletores
 */
function updateDiagram() {
    const count = parseInt(document.getElementById('stringCount').value);
    const tuningKey = document.getElementById('tuningSelect').value;
    const rootNote = document.getElementById('rootNote').value;
    const intervalStep = parseInt(document.getElementById('intervalType').value);
    
    // Filtra as cordas baseada na quantidade selecionada (omite as mais agudas se 4)
    const currentTuning = TUNINGS[tuningKey].slice(0, count);

    // Referências aos elementos do SVG
    const markersLayer = document.getElementById('markers-layer');
    const stringsLayer = document.getElementById('strings-layer');
    const labelsLayer = document.getElementById('labels-layer');
    const fretLayer = document.getElementById('frets-layer');
    const fingerboard = document.getElementById('fingerboard');
    const nut = document.getElementById('nut');
    
    // Limpeza das camadas
    markersLayer.innerHTML = '';
    stringsLayer.innerHTML = '';
    labelsLayer.innerHTML = '';
    fretLayer.innerHTML = '';

    // Ajuste dinâmico da largura do braço
    const boardWidth = (count === 4) ? 120 : 150;
    fingerboard.setAttribute("width", boardWidth);
    nut.setAttribute("x2", 25 + boardWidth);

    // Desenha as linhas de posição (trastes falsos)
    Object.values(POSITIONS).forEach(y => {
        if (y === 20) return; // Pula a pestana
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", "25"); line.setAttribute("y1", y);
        line.setAttribute("x2", 25 + boardWidth); line.setAttribute("y2", y);
        line.setAttribute("class", "fret-line");
        fretLayer.appendChild(line);
    });

    const rootIdx = CHROMATIC_SCALE.indexOf(rootNote);
    const intervalNote = CHROMATIC_SCALE[(rootIdx + intervalStep) % 12];

    // Renderiza cada corda e suas notas correspondentes
    currentTuning.forEach((conf, i) => {
        const x = X_COORDS[i];
        
        // 1. Desenha a linha da corda
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x); line.setAttribute("y1", 20);
        line.setAttribute("x2", x); line.setAttribute("y2", 540);
        line.setAttribute("stroke", "#ced6e0");
        line.setAttribute("stroke-width", STRING_WIDTHS[i]);
        stringsLayer.appendChild(line);

        // 2. Desenha o rótulo da corda (C, G, D, etc)
        const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
        txt.setAttribute("x", x); txt.setAttribute("y", 10);
        txt.setAttribute("class", "string-label");
        txt.textContent = conf.name;
        labelsLayer.appendChild(txt);

        // 3. Verifica presença das notas da diade nesta corda
        for (let s = 0; s <= 7; s++) {
            let noteIdx = (conf.rootIndex + s) % 12;
            let noteName = CHROMATIC_SCALE[noteIdx];

            if (noteName === rootNote) {
                drawMarker(x, POSITIONS[s], rootNote, 'marker-root');
                
                // Tenta achar o intervalo na corda adjacente à direita
                if (i < currentTuning.length - 1) {
                    const nextConf = currentTuning[i+1];
                    for (let ns = 0; ns <= 7; ns++) {
                        let nextNoteIdx = (nextConf.rootIndex + ns) % 12;
                        if (CHROMATIC_SCALE[nextNoteIdx] === intervalNote) {
                            drawMarker(X_COORDS[i+1], POSITIONS[ns], intervalNote, 'marker-interval');
                        }
                    }
                }
            }
        }
    });
}

/**
 * Cria um marcador visual no SVG
 */
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

// Inicialização e Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('select').forEach(s => {
        s.addEventListener('change', updateDiagram);
    });
    updateDiagram();
});