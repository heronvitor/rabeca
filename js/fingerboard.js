import { POSITIONS, MAX_SEMITONE, X_COORDS, STRING_WIDTHS, BOARD_OFFSET } from './constants.js';
import { noteAt } from './music.js';
import { createSvgElement } from './svg.js';

const $ = (id) => document.getElementById(id);

const BOARD_LEFT = 25;
const BOARD_TOP = 20;
const BOARD_BOTTOM = 540;
const LIVE_MARKER_ID = 'live-marker-group';

function clearLayers() {
    ['markers-layer', 'strings-layer', 'labels-layer', 'frets-layer']
        .forEach(id => { $(id).innerHTML = ''; });
}

function drawBoard(stringCount) {
    const boardWidth = (stringCount === 4) ? 120 : 150;
    $('fingerboard').setAttribute("width", boardWidth);
    $('nut').setAttribute("x2", BOARD_LEFT + boardWidth);

    Object.values(POSITIONS).forEach(y => {
        if (y === BOARD_TOP) return;
        $('frets-layer').appendChild(createSvgElement('line', {
            x1: BOARD_LEFT, y1: y, x2: BOARD_LEFT + boardWidth, y2: y,
            stroke: "rgba(255,255,255,0.2)"
        }));
    });
}

function drawString(index, conf) {
    const x = X_COORDS[index];
    $('strings-layer').appendChild(createSvgElement('line', {
        x1: x, y1: BOARD_TOP, x2: x, y2: BOARD_BOTTOM,
        stroke: "#ced6e0", "stroke-width": STRING_WIDTHS[index]
    }));

    const label = createSvgElement('text', { x, y: 10, class: "string-label" });
    label.textContent = conf.name;
    $('labels-layer').appendChild(label);
}

function drawMarker(x, y, label, color) {
    const g = createSvgElement('g');
    const c = createSvgElement('circle', { cx: x, cy: y, r: 12, fill: color, stroke: "white" });
    c.style.cursor = "pointer";

    const t = createSvgElement('text', { x, y: y + 4, class: "label-note" });
    t.textContent = label;

    g.append(c, t);
    $('markers-layer').appendChild(g);
}

// Primeira ocorrência da tônica, varrendo da corda mais grave para a mais aguda
function findFirstTonic(tuning, rootNote) {
    for (let i = 0; i < tuning.length; i++) {
        for (let s = 0; s <= MAX_SEMITONE; s++) {
            if (noteAt(tuning[i].idx + s) === rootNote) return { string: i, semitone: s };
        }
    }
    return null;
}

export function renderFingerboard(tuning, rootNote, targetNotes) {
    clearLayers();
    drawBoard(tuning.length);

    const tonic = findFirstTonic(tuning, rootNote);
    const isBeforeTonic = (i, s) =>
        tonic !== null && (i < tonic.string || (i === tonic.string && s < tonic.semitone));

    for (let i = tuning.length - 1; i >= 0; i--) {
        const conf = tuning[i];
        drawString(i, conf);

        for (let s = 6; s >= 0; s--) {
            if (isBeforeTonic(i, s)) continue;

            const noteName = noteAt(conf.idx + s);
            const match = targetNotes.find(tn => tn.name === noteName);
            if (match) drawMarker(X_COORDS[i], POSITIONS[s], noteName, match.color);
        }
    }
}

// Converte um clique na tela em { string, semitone }, ou null se fora de uma posição
export function hitTest(svg, clientX, clientY, stringCount) {
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
    const x = svgPoint.x - BOARD_OFFSET.x;
    const y = svgPoint.y - BOARD_OFFSET.y;

    let string = -1;
    let minDistX = 15;
    X_COORDS.slice(0, stringCount).forEach((cx, i) => {
        if (Math.abs(cx - x) < minDistX) {
            minDistX = Math.abs(cx - x);
            string = i;
        }
    });

    let semitone = -1;
    let minDistY = 22;
    Object.entries(POSITIONS).forEach(([s, cy]) => {
        if (Math.abs(cy - y) < minDistY) {
            minDistY = Math.abs(cy - y);
            semitone = parseInt(s);
        }
    });

    return (string !== -1 && semitone !== -1) ? { string, semitone } : null;
}

// Localiza a frequência no braço; a última corda que a alcança vence
function locateFrequency(freq, tuning) {
    let found = null;
    tuning.forEach((st, i) => {
        const semi = 12 * Math.log2(freq / st.f);
        if (semi >= -0.5 && semi <= MAX_SEMITONE + 0.5) {
            const base = Math.floor(semi), frac = semi - base;
            const y1 = POSITIONS[Math.max(0, base)];
            const y2 = POSITIONS[Math.min(MAX_SEMITONE, base + 1)];
            found = {
                x: X_COORDS[i],
                y: y1 + (y2 - y1) * frac,
                noteName: noteAt(st.idx + Math.round(semi))
            };
        }
    });
    return found;
}

function getOrCreateLiveMarker() {
    let group = $(LIVE_MARKER_ID);
    if (group) return group;

    group = createSvgElement('g', { id: LIVE_MARKER_ID });
    const circle = createSvgElement('circle', {
        r: 15, fill: "none", stroke: "cyan", "stroke-width": 3, "stroke-dasharray": 4
    });
    const text = createSvgElement('text', { class: "live-note-label" });
    group.append(circle, text);
    $('markers-layer').appendChild(group);
    return group;
}

export function drawLiveMarker(freq, tuning) {
    const pos = locateFrequency(freq, tuning);
    if (!pos) {
        $(LIVE_MARKER_ID)?.remove();
        return;
    }

    const group = getOrCreateLiveMarker();
    const [circle, text] = group.children;
    circle.setAttribute("cx", pos.x); circle.setAttribute("cy", pos.y);
    text.setAttribute("x", pos.x); text.setAttribute("y", pos.y);
    text.textContent = pos.noteName;
}
