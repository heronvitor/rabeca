import { createSvgElement } from './svg.js';
import { noteAt } from './music.js';

// Grau diatônico (0 = C) de cada nota cromática
const STAFF_POS = { 'C': 0, 'C#': 0, 'D': 1, 'D#': 1, 'E': 2, 'F': 3, 'F#': 3, 'G': 4, 'G#': 4, 'A': 5, 'A#': 5, 'B': 6 };

const MIN_FREQ = 130;
const NOTE_X = 300;
const C4_Y = 160;          // y do C4 (dó central, 1ª linha suplementar inferior)
const STEP_Y = 10;         // distância vertical entre graus
const STAFF_MIDDLE_Y = 100;
const LOWER_LEDGER_Y = 160;
const UPPER_LEDGER_Y = 40;

function frequencyToNote(freq) {
    const midi = Math.round(12 * Math.log2(freq / 440) + 69);
    return { name: noteAt(midi), octave: Math.floor(midi / 12) - 1 };
}

function drawLedgerLines(layer, y) {
    const line = (ly) => layer.appendChild(createSvgElement('line', {
        x1: 280, x2: 330, y1: ly, y2: ly, stroke: "black", "stroke-width": 2
    }));
    if (y >= LOWER_LEDGER_Y) for (let ly = LOWER_LEDGER_Y; ly <= y; ly += 20) line(ly);
    if (y <= UPPER_LEDGER_Y) for (let ly = UPPER_LEDGER_Y; ly >= y; ly -= 20) line(ly);
}

function drawNote(layer, y, sharp) {
    layer.appendChild(createSvgElement('ellipse', {
        cx: NOTE_X, cy: y, rx: 9, ry: 7,
        fill: "black", stroke: "black", "stroke-width": 2,
        transform: `rotate(-20, ${NOTE_X}, ${y})`
    }));

    // Haste para baixo na metade superior da pauta, para cima na inferior
    const stemUp = y > STAFF_MIDDLE_Y;
    const stemX = stemUp ? NOTE_X + 7.5 : NOTE_X - 7.5;
    layer.appendChild(createSvgElement('line', {
        x1: stemX, y1: stemUp ? y - 2 : y + 2,
        x2: stemX, y2: stemUp ? y - 55 : y + 55,
        stroke: "black", "stroke-width": 2
    }));

    if (sharp) {
        const text = createSvgElement('text', {
            x: NOTE_X - 25, y: y + 8,
            style: "font-size: 30px; font-family: sans-serif; font-weight: bold;"
        });
        text.textContent = "#";
        layer.appendChild(text);
    }
}

export function renderStaffNote(freq) {
    const layer = document.getElementById('note-layer');
    if (!layer) return;
    layer.innerHTML = '';
    if (freq < MIN_FREQ) return;

    const { name, octave } = frequencyToNote(freq);
    const y = C4_Y - ((octave - 4) * 7 + STAFF_POS[name]) * STEP_Y;

    drawLedgerLines(layer, y);
    drawNote(layer, y, name.includes('#'));
}
