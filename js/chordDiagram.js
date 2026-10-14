import { createSvgElement } from './svg.js';

const FRETS_SHOWN = 5;
const STRING_GAP = 22;
const FRET_GAP = 22;
const LEFT = 24;
const TOP = 28;
const DOT_RADIUS = 9;
const OPEN_Y = TOP - 13;

// Primeira casa exibida: 1 se a digitação cabe perto da pestana, senão a menor casa pressionada
function firstFret(frets) {
    const fretted = frets.filter(f => f !== null && f > 0);
    if (!fretted.length || Math.max(...fretted) <= FRETS_SHOWN) return 1;
    return Math.min(...fretted);
}

// Bolinha com o rótulo dentro; corda solta = só contorno, acima da pestana
function drawNote(svg, x, y, { label, color, textColor }, open) {
    svg.appendChild(createSvgElement('circle', {
        cx: x, cy: y, r: open ? DOT_RADIUS - 1 : DOT_RADIUS,
        fill: open ? 'white' : color,
        stroke: color, 'stroke-width': open ? 2 : 0
    }));
    const text = createSvgElement('text', {
        x, y: y + 0.5,
        class: 'diagram-note-label',
        fill: open ? '#2c3e50' : textColor,
        'font-size': label.length > 2 ? 7 : 9
    });
    text.textContent = label;
    svg.appendChild(text);
}

// Diagrama vertical: cordas da mais grave (esquerda) para a mais aguda, pestana em cima.
// describe(stringIndex, fret) → { label, color, textColor } para cada nota tocada.
export function renderChordDiagram(frets, strings, describe) {
    const width = LEFT + STRING_GAP * (strings.length - 1) + 14;
    const height = TOP + FRET_GAP * FRETS_SHOWN + 18;
    const svg = createSvgElement('svg', {
        viewBox: `0 0 ${width} ${height}`, width, height, class: 'chord-diagram'
    });
    const right = LEFT + STRING_GAP * (strings.length - 1);
    const bottom = TOP + FRET_GAP * FRETS_SHOWN;
    const start = firstFret(frets);

    for (let i = 0; i <= FRETS_SHOWN; i++) {
        const y = TOP + i * FRET_GAP;
        const isNut = i === 0 && start === 1;
        svg.appendChild(createSvgElement('line', {
            x1: LEFT, y1: y, x2: right, y2: y,
            stroke: '#555', 'stroke-width': isNut ? 4 : 1
        }));
    }
    if (start > 1) {
        const label = createSvgElement('text', {
            x: LEFT - 11, y: TOP + FRET_GAP / 2 + 4, class: 'diagram-fret-label'
        });
        label.textContent = `${start}ª`;
        svg.appendChild(label);
    }

    strings.forEach((st, i) => {
        const x = LEFT + i * STRING_GAP;
        svg.appendChild(createSvgElement('line', {
            x1: x, y1: TOP, x2: x, y2: bottom, stroke: '#555', 'stroke-width': 1
        }));

        const name = createSvgElement('text', { x, y: bottom + 14, class: 'diagram-string-label' });
        name.textContent = st.name;
        svg.appendChild(name);

        const fret = frets[i];
        if (fret === null) {
            const mark = createSvgElement('text', { x, y: OPEN_Y + 4, class: 'diagram-open-label' });
            mark.textContent = '×';
            svg.appendChild(mark);
        } else if (fret === 0) {
            drawNote(svg, x, OPEN_Y, describe(i, fret), true);
        } else {
            drawNote(svg, x, TOP + (fret - start + 0.5) * FRET_GAP, describe(i, fret), false);
        }
    });

    return svg;
}
