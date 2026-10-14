import { isChord, transposeSymbol } from './chords.js';

// Prefixos que podem vir antes dos acordes na mesma linha: "[Intro]", "Tom:"
const PREFIX_RE = /^\s*(\[[^\]]*\]|tom:)/i;
// Linha de tablatura: "E|---3---|", "e|-0-2-"
const TAB_RE = /^\s*[A-Ga-g][#b]?\s*\|.*[-–]/;
// Anotações aceitas no meio de uma linha de acordes: "(2x)", "x2", "|", "%", "N.C."
const ANNOTATION_RE = /^(\(?\d+x\)?|x\d+|[|%\-–()]+|N\.?C\.?)$/i;

// Separa parênteses em volta do acorde: "(G" → { lead: "(", symbol: "G", trail: "" }.
// O ")" final só é separado se estiver sobrando, para não quebrar "D7(4)".
function splitToken(text) {
    const lead = text.startsWith('(') ? '(' : '';
    let symbol = text.slice(lead.length);
    const count = (ch) => symbol.split(ch).length - 1;
    const trail = symbol.endsWith(')') && count(')') > count('(') ? ')' : '';
    if (trail) symbol = symbol.slice(0, -1);
    return { lead, symbol, trail };
}

function tokenize(text, offset) {
    return [...text.matchAll(/\S+/g)].map(m => {
        const { lead, symbol, trail } = splitToken(m[0]);
        const chord = symbol && isChord(symbol);
        return { col: m.index + offset, text: m[0], chord, lead, symbol, trail };
    });
}

function isChordLine(tokens) {
    return tokens.some(t => t.chord) && tokens.every(t => t.chord || ANNOTATION_RE.test(t.text));
}

// Classifica cada linha da cifra colada
export function parseCifra(text) {
    return text.replace(/\r/g, '').split('\n').map(raw => {
        const line = raw.replace(/\t/g, '    ').replace(/\s+$/, '');
        if (!line.trim()) return { type: 'blank' };
        if (TAB_RE.test(line)) return { type: 'text', text: line };

        const prefixMatch = line.match(PREFIX_RE);
        const prefix = prefixMatch ? prefixMatch[0] : '';
        const tokens = tokenize(line.slice(prefix.length), prefix.length);

        if (prefix && tokens.length === 0) return { type: 'section', text: line };
        if (isChordLine(tokens)) return { type: 'chords', prefix, tokens };
        return { type: 'text', text: line };
    });
}

// Tokens com o acorde transposto e a coluna ajustada para não encostarem uns nos outros
export function layoutChordLine(line, semitones) {
    let end = line.prefix.length;
    return line.tokens.map(t => {
        const text = t.chord ? t.lead + transposeSymbol(t.symbol, semitones) + t.trail : t.text;
        const col = Math.max(t.col, end === 0 ? 0 : end + 1);
        end = col + text.length;
        return { ...t, col, text, symbol: t.chord ? transposeSymbol(t.symbol, semitones) : null };
    });
}

// Acordes distintos na ordem em que aparecem
export function uniqueChords(lines, semitones) {
    const seen = new Set();
    lines.filter(l => l.type === 'chords').forEach(l => {
        layoutChordLine(l, semitones).forEach(t => { if (t.chord) seen.add(t.symbol); });
    });
    return [...seen];
}
