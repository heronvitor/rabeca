import { createSvgElement } from './svg.js';

const FRETS_SHOWN = 5;
const STRING_GAP = 18;
const FRET_GAP = 20;
const LEFT = 22;
const TOP = 20;
const ROOT_COLOR = '#27ae60';
const NOTE_COLOR = '#2c3e50';

// Primeira casa exibida: 1 se a digitação cabe perto da pestana, senão a menor casa pressionada
function firstFret(frets) {
    const fretted = frets.filter(f => f !== null && f > 0);
    if (!fretted.length || Math.max(...fretted) <= FRETS_SHOWN) return 1;
    return Math.min(...fretted);
}

// Diagrama vertical: cordas da mais grave (esquerda) para a mais aguda, pestana em cima
export function renderChordDiagram(frets, strings, rootPc) {
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
            x: LEFT - 6, y: TOP + FRET_GAP / 2 + 4, class: 'diagram-fret-label'
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
        if (fret === null || fret === 0) {
            const mark = createSvgElement('text', { x, y: TOP - 6, class: 'diagram-open-label' });
            mark.textContent = fret === null ? '×' : '○';
            svg.appendChild(mark);
            return;
        }

        const isRoot = (st.idx + fret) % 12 === rootPc;
        svg.appendChild(createSvgElement('circle', {
            cx: x, cy: TOP + (fret - start + 0.5) * FRET_GAP, r: 7,
            fill: isRoot ? ROOT_COLOR : NOTE_COLOR
        }));
    });

    return svg;
}
