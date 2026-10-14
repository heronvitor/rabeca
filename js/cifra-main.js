import { parseChord } from './chords.js';
import { parseCifra, layoutChordLine, uniqueChords } from './cifra.js';
import { findVoicings } from './voicings.js';
import { renderChordDiagram } from './chordDiagram.js';
import { MANDOLIN } from './instruments.js';
import { getAudioContext, playNote } from './audio.js';
import { frequencyAt } from './music.js';

const STORAGE_KEY = 'cifraAppState';
const STRUM_DELAY_MS = 60;

const $ = (id) => document.getElementById(id);

const state = {
    text: '',
    transpose: 0,
    lines: [],
    voicingIndex: new Map()   // símbolo → digitação exibida
};

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ text: state.text, transpose: state.transpose }));
    } catch (e) { /* armazenamento indisponível: só não lembra a cifra */ }
}

function loadState() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
        return {};
    }
}

function strum(frets) {
    getAudioContext();
    frets.forEach((fret, i) => {
        if (fret === null) return;
        setTimeout(() => playNote(frequencyAt(MANDOLIN.strings[i].f, fret)), i * STRUM_DELAY_MS);
    });
}

function renderChordCard(symbol) {
    const card = document.createElement('div');
    card.className = 'chord-card';
    card.dataset.symbol = symbol;

    const name = document.createElement('div');
    name.className = 'chord-name';
    name.textContent = symbol;
    card.appendChild(name);

    const chord = parseChord(symbol);
    const voicings = findVoicings(chord, MANDOLIN);
    if (!voicings.length) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'sem digitação';
        card.appendChild(empty);
        return card;
    }

    const body = document.createElement('div');
    const nav = document.createElement('div');
    nav.className = 'voicing-nav';
    const prev = document.createElement('button');
    const next = document.createElement('button');
    const counter = document.createElement('span');
    prev.textContent = '‹';
    next.textContent = '›';
    prev.setAttribute('aria-label', `Digitação anterior de ${symbol}`);
    next.setAttribute('aria-label', `Próxima digitação de ${symbol}`);
    nav.append(prev, counter, next);
    card.append(body, nav);

    const show = (index) => {
        const i = (index + voicings.length) % voicings.length;
        state.voicingIndex.set(symbol, i);
        const diagram = renderChordDiagram(voicings[i], MANDOLIN.strings, chord.root);
        diagram.setAttribute('role', 'button');
        diagram.setAttribute('aria-label', `Tocar ${symbol}`);
        diagram.addEventListener('click', () => strum(voicings[i]));
        body.replaceChildren(diagram);
        counter.textContent = `${i + 1}/${voicings.length}`;
        return voicings[i];
    };

    prev.addEventListener('click', () => strum(show(state.voicingIndex.get(symbol) - 1)));
    next.addEventListener('click', () => strum(show(state.voicingIndex.get(symbol) + 1)));
    show(state.voicingIndex.get(symbol) ?? 0);
    return card;
}

function renderStrip() {
    const strip = $('chordStrip');
    strip.replaceChildren(...uniqueChords(state.lines, state.transpose).map(renderChordCard));
}

function renderChordLine(line) {
    const fragment = document.createDocumentFragment();
    fragment.append(line.prefix);
    let end = line.prefix.length;

    layoutChordLine(line, state.transpose).forEach(t => {
        fragment.append(' '.repeat(t.col - end));
        end = t.col + t.text.length;
        if (!t.chord) {
            fragment.append(t.text);
            return;
        }
        const btn = document.createElement('button');
        btn.className = 'chord';
        btn.dataset.symbol = t.symbol;
        btn.textContent = t.symbol;
        fragment.append(t.lead, btn, t.trail);
    });
    return fragment;
}

function renderCifra() {
    const view = $('cifraView');
    view.replaceChildren();
    state.lines.forEach(line => {
        if (line.type === 'chords') {
            view.append(renderChordLine(line));
        } else if (line.type === 'section') {
            const span = document.createElement('span');
            span.className = 'section';
            span.textContent = line.text;
            view.append(span);
        } else if (line.type === 'text') {
            view.append(line.text);
        }
        view.append('\n');
    });
}

function renderTransposeLabel() {
    const n = state.transpose;
    $('transposeValue').textContent = n === 0 ? 'Tom original' : `${n > 0 ? '+' : ''}${String(n / 2).replace('.', ',')} tom`;
}

function render() {
    renderTransposeLabel();
    renderStrip();
    renderCifra();
}

function selectChord(symbol) {
    document.querySelectorAll('.chord.active, .chord-card.active')
        .forEach(el => el.classList.remove('active'));
    document.querySelectorAll(`[data-symbol="${CSS.escape(symbol)}"]`)
        .forEach(el => el.classList.add('active'));

    const card = $('chordStrip').querySelector(`.chord-card[data-symbol="${CSS.escape(symbol)}"]`);
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    const index = state.voicingIndex.get(symbol) ?? 0;
    const voicings = findVoicings(parseChord(symbol), MANDOLIN);
    if (voicings[index]) strum(voicings[index]);
}

function showResult() {
    state.text = $('cifraInput').value;
    state.lines = parseCifra(state.text);
    state.voicingIndex.clear();
    saveState();
    render();
    $('inputSection').hidden = true;
    $('resultSection').hidden = false;
}

function transpose(delta) {
    state.transpose = (state.transpose + delta + 18) % 12 - 6 || 0;
    state.voicingIndex.clear();
    saveState();
    render();
}

function init() {
    const saved = loadState();
    $('cifraInput').value = saved.text || '';
    state.transpose = saved.transpose || 0;

    $('showBtn').addEventListener('click', showResult);
    $('editBtn').addEventListener('click', () => {
        $('resultSection').hidden = true;
        $('inputSection').hidden = false;
        $('cifraInput').focus();
    });
    $('transposeDown').addEventListener('click', () => transpose(-1));
    $('transposeUp').addEventListener('click', () => transpose(1));
    $('cifraView').addEventListener('click', (e) => {
        const btn = e.target.closest('.chord');
        if (btn) selectChord(btn.dataset.symbol);
    });

    if (saved.text) showResult();
}

init();
