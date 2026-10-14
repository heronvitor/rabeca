import { CHROMATIC_SCALE } from './constants.js';

const FLAT_SCALE = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// tônica, sufixo e baixo opcional ("/E"); "/9" não é baixo, é extensão
const CHORD_RE = /^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/;

// Prioridade de cada nota ao montar digitações com poucas cordas:
// 1 = essencial, 2 = extensão (desejável), 3 = pode ser omitida (5ª justa)
const ESSENTIAL = 1, EXTENSION = 2, OPTIONAL = 3;

const DEGREES = {
    'b9': 13, '9': 14, '#9': 15, '11': 17, '#11': 18, 'b13': 20, '13': 21
};

// Nome do grau conforme o papel da nota no acorde (o mesmo semitom pode ser 6, 13 ou bb7)
const THIRD_NAMES = { 2: '2', 3: 'b3', 4: '3', 5: '4' };
const FIFTH_NAMES = { 6: 'b5', 7: '5', 8: '#5' };
const SEVENTH_NAMES = { 9: 'bb7', 10: 'b7', 11: '7' };
const EXTENSION_NAMES = Object.fromEntries(Object.entries(DEGREES).map(([name, semi]) => [semi, name]));
// Para notas fora do acorde (ex.: baixo de "C/B")
const GENERIC_NAMES = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];

export function noteIndex(name) {
    const base = CHROMATIC_SCALE.indexOf(name[0]);
    const accidental = name[1] === '#' ? 1 : name[1] === 'b' ? -1 : 0;
    return (base + accidental + 12) % 12;
}

export function noteName(idx, useFlats) {
    return (useFlats ? FLAT_SCALE : CHROMATIC_SCALE)[((idx % 12) + 12) % 12];
}

// Aplica um grau numérico como "7", "b5", "#11", "(9)" ao acorde em construção
function applyDegree(chord, degree, bare) {
    const d = degree.replace('+', '#');
    if (d === '7' && bare) chord.seventh = chord.dim ? 9 : 10;
    else if (d === '6') chord.sixth = 9;
    else if (d === 'b5') chord.fifth = 6;
    else if (d === '#5') chord.fifth = 8;
    else if (d === '5' && bare) chord.third = null;
    else if (d === '4') chord.third = 5;
    else if (d === '2') chord.ext.add(14);   // "C2" = C com 9ª adicionada
    else if (d in DEGREES) chord.ext.add(DEGREES[d]);
    else return false;
    return true;
}

// Cada regra tenta consumir o início do sufixo; a ordem importa ("7M" antes de "7", "maj" antes de "m")
const SUFFIX_RULES = [
    [/^(maj7|7M|7\+)/, c => { c.seventh = 11; }],
    [/^ø/, c => { c.third = 3; c.fifth = 6; c.seventh = 10; }],
    [/^(dim|°|º|o)/, c => { c.third = 3; c.fifth = 6; c.dim = true; }],
    [/^(aug|\+)/, c => { c.fifth = 8; }],
    [/^sus2/, c => { c.third = 2; }],
    [/^sus4?/, c => { c.third = 5; }],
    [/^add(b9|#9|9|#11|11|b13|13|2|4)/, (c, m) => applyDegree(c, m[1], false)],
    [/^(maj|M)/, () => {}],
    [/^(min|m|-)/, c => { c.third = 3; }],
    [/^\(([^)]*)\)/, (c, m) => m[1].split(/[,\/\s]+/).filter(Boolean)
        .every(d => applyDegree(c, d.replace(/^add/, ''), false))],
    [/^\/([b#+]?\d+)/, (c, m) => applyDegree(c, m[1], false)],
    [/^([b#]?(13|11|9|7|6|5|4|2))/, (c, m) => applyDegree(c, m[1], true)]
];

function parseSuffix(suffix) {
    const chord = { third: 4, fifth: 7, seventh: null, sixth: null, dim: false, ext: new Set() };
    let rest = suffix;
    while (rest.length) {
        const rule = SUFFIX_RULES.find(([re]) => re.test(rest));
        if (!rule) return null;
        const match = rest.match(rule[0]);
        if (rule[1](chord, match) === false) return null;
        rest = rest.slice(match[0].length);
    }
    return chord;
}

// "F#m7(b5)/A" → { symbol, root, bass, intervals: [{ semi, priority, degree }], pitchClasses }
export function parseChord(symbol) {
    const match = symbol.match(CHORD_RE);
    if (!match) return null;
    const [, rootName, suffix, bassName] = match;
    const c = parseSuffix(suffix);
    if (!c) return null;

    const intervals = [{ semi: 0, priority: ESSENTIAL, degree: '1' }];
    if (c.third !== null) intervals.push({ semi: c.third, priority: ESSENTIAL, degree: THIRD_NAMES[c.third] });
    const hasSeventhOrSixth = c.seventh !== null || c.sixth !== null;
    intervals.push({
        semi: c.fifth,
        priority: c.fifth === 7 && hasSeventhOrSixth ? OPTIONAL : ESSENTIAL,
        degree: FIFTH_NAMES[c.fifth]
    });
    if (c.seventh !== null) intervals.push({ semi: c.seventh, priority: ESSENTIAL, degree: SEVENTH_NAMES[c.seventh] });
    if (c.sixth !== null) intervals.push({ semi: c.sixth, priority: ESSENTIAL, degree: '6' });
    c.ext.forEach(semi => intervals.push({ semi, priority: EXTENSION, degree: EXTENSION_NAMES[semi] }));

    const root = noteIndex(rootName);
    return {
        symbol,
        root,
        bass: bassName ? noteIndex(bassName) : null,
        intervals,
        pitchClasses: [...new Set(intervals.map(i => (root + i.semi) % 12))]
    };
}

// Grau de uma nota (classe de altura) no acorde: { degree: "b7", inChord: true }
export function degreeOf(chord, pc) {
    const semi = (pc - chord.root + 12) % 12;
    const interval = chord.intervals.find(i => i.semi % 12 === semi);
    return interval
        ? { degree: interval.degree, inChord: true }
        : { degree: GENERIC_NAMES[semi], inChord: false };
}

export function isChord(token) {
    return parseChord(token) !== null;
}

// Notas que uma digitação precisa conter, dado o número de cordas disponíveis
export function requiredPitchClasses(chord, stringCount) {
    const sorted = [...chord.intervals].sort((a, b) => a.priority - b.priority);
    const required = [];
    for (const { semi, priority } of sorted) {
        if (priority === OPTIONAL) break;
        if (priority === EXTENSION && required.length >= stringCount) break;
        const pc = (chord.root + semi) % 12;
        if (!required.includes(pc)) required.push(pc);
    }
    return required.slice(0, stringCount);
}

export function transposeSymbol(symbol, semitones) {
    const match = symbol.match(CHORD_RE);
    if (!match || !semitones) return symbol;
    const [, rootName, suffix, bassName] = match;
    const useFlats = rootName.includes('b');
    const shift = (name) => noteName(noteIndex(name) + semitones, useFlats);
    return shift(rootName) + suffix + (bassName ? '/' + shift(bassName) : '');
}
