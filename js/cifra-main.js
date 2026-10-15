import { parseChord, degreeOf, noteName } from './chords.js';
import { parseCifra, layoutChordLine, uniqueChords, cleanPastedText } from './cifra.js';
import { findVoicings } from './voicings.js';
import { renderChordDiagram } from './chordDiagram.js';
import { MANDOLIN } from './instruments.js';
import { getAudioContext, playNote } from './audio.js';
import { frequencyAt } from './music.js';
import { degreeStyle, DEGREE_FUNCTIONS } from './degreeStyle.js';
import { initSidebar } from './sidebar.js';

const STORAGE_KEY = 'cifraAppState';
const STRUM_DELAY_MS = 60;

const $ = (id) => document.getElementById(id);

const state = {
    cifras: [],               // cifras salvas: { text, transpose }
    current: 0,               // índice da cifra aberta
    lines: [],
    labelMode: 'degree',      // 'degree' = graus, 'note' = nomes das notas
    voicingIndex: new Map()   // símbolo → digitação exibida
};

const emptyCifra = () => ({ text: '', transpose: 0 });
const cifra = () => state.cifras[state.current];

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            cifras: state.cifras, current: state.current, labelMode: state.labelMode
        }));
    } catch (e) { /* armazenamento indisponível: só não lembra as cifras */ }
}

function loadState() {
    let saved;
    try {
        saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
        saved = {};
    }
    // Formato antigo guardava uma única cifra em { text, transpose }
    if (!Array.isArray(saved.cifras)) {
        saved.cifras = saved.text ? [{ text: saved.text, transpose: saved.transpose || 0 }] : [];
    }
    if (!saved.cifras.length) saved.cifras.push(emptyCifra());
    saved.current = Math.min(Math.max(saved.current | 0, 0), saved.cifras.length - 1);
    return saved;
}

// Nome da cifra no seletor: primeira linha de texto (no Cifra Club, o título da música)
function cifraTitle(c, i) {
    const line = parseCifra(c.text).find(l => l.type === 'text' && l.text.trim());
    const title = line ? line.text.trim() : '';
    return title.length > 40 ? title.slice(0, 40) + '…' : title || `Cifra ${i + 1}`;
}

function renderCifraSelect() {
    $('cifraSelect').replaceChildren(...state.cifras.map((c, i) => {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = cifraTitle(c, i);
        return option;
    }));
    $('cifraSelect').value = state.current;
}

function strum(frets) {
    getAudioContext();
    frets.forEach((fret, i) => {
        if (fret === null) return;
        setTimeout(() => playNote(frequencyAt(MANDOLIN.strings[i].f, fret)), i * STRUM_DELAY_MS);
    });
}

// Rótulo e cor da nota tocada na corda i, casa fret
function noteDescriber(chord) {
    const useFlats = chord.symbol.match(/^[A-G]b/) !== null;
    return (i, fret) => {
        const pc = (MANDOLIN.strings[i].idx + fret) % 12;
        const { degree, inChord } = degreeOf(chord, pc);
        const style = degreeStyle(degree, inChord);
        return {
            label: state.labelMode === 'note' ? noteName(pc, useFlats) : degree,
            color: style.color,
            textColor: style.text
        };
    };
}

function renderLegend() {
    $('degreeLegend').replaceChildren(...DEGREE_FUNCTIONS.map(f => {
        const item = document.createElement('li');
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.style.background = f.color;
        item.append(dot, f.label);
        return item;
    }));
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
        const diagram = renderChordDiagram(voicings[i], MANDOLIN.strings, noteDescriber(chord));
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
    strip.replaceChildren(...uniqueChords(state.lines, cifra().transpose).map(renderChordCard));
}

function renderChordLine(line) {
    const fragment = document.createDocumentFragment();
    fragment.append(line.prefix);
    let end = line.prefix.length;

    layoutChordLine(line, cifra().transpose).forEach(t => {
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
    const n = cifra().transpose;
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
    cifra().text = cleanPastedText($('cifraInput').value);
    $('cifraInput').value = cifra().text;
    state.lines = parseCifra(cifra().text);
    state.voicingIndex.clear();
    saveState();
    renderCifraSelect();
    render();
    $('inputSection').hidden = true;
    $('resultSection').hidden = false;
}

function showInput(focus = true) {
    $('resultSection').hidden = true;
    $('inputSection').hidden = false;
    if (focus) $('cifraInput').focus();
}

function openCifra(index, focus = true) {
    state.current = index;
    $('cifraInput').value = cifra().text;
    renderCifraSelect();
    if (cifra().text) {
        showResult();
    } else {
        saveState();
        showInput(focus);
    }
}

function newCifra() {
    if (cifra().text) {
        state.cifras.push(emptyCifra());
        openCifra(state.cifras.length - 1);
    } else {
        openCifra(state.current);
    }
}

function deleteCifra() {
    if (!confirm(`Apagar "${cifraTitle(cifra(), state.current)}"?`)) return;
    state.cifras.splice(state.current, 1);
    if (!state.cifras.length) state.cifras.push(emptyCifra());
    openCifra(Math.min(state.current, state.cifras.length - 1));
}

function transpose(delta) {
    cifra().transpose = (cifra().transpose + delta + 18) % 12 - 6 || 0;
    state.voicingIndex.clear();
    saveState();
    render();
}

function init() {
    const saved = loadState();
    state.cifras = saved.cifras;
    state.labelMode = saved.labelMode === 'note' ? 'note' : 'degree';
    $('labelMode').value = state.labelMode;
    renderLegend();
    initSidebar();

    $('showBtn').addEventListener('click', showResult);
    $('cifraSelect').addEventListener('change', (e) => openCifra(Number(e.target.value)));
    $('newBtn').addEventListener('click', newCifra);
    $('deleteBtn').addEventListener('click', deleteCifra);
    // Guarda o rascunho enquanto edita, para não perder ao trocar de cifra
    $('cifraInput').addEventListener('input', () => {
        cifra().text = $('cifraInput').value;
        saveState();
        renderCifraSelect();
    });
    $('cifraInput').addEventListener('paste', () => setTimeout(() => {
        const input = $('cifraInput');
        const cleaned = cleanPastedText(input.value);
        if (cleaned !== input.value) input.value = cleaned;
    }));
    $('labelMode').addEventListener('change', (e) => {
        state.labelMode = e.target.value;
        saveState();
        renderStrip();
    });
    $('editBtn').addEventListener('click', () => showInput());
    $('transposeDown').addEventListener('click', () => transpose(-1));
    $('transposeUp').addEventListener('click', () => transpose(1));
    $('cifraView').addEventListener('click', (e) => {
        const btn = e.target.closest('.chord');
        if (btn) selectChord(btn.dataset.symbol);
    });

    openCifra(saved.current, false);
}

init();
