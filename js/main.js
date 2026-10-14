import { MODES_DATA } from './constants.js';
import { getTuning, getModeItem, buildTargetNotes, frequencyAt } from './music.js';
import { getAudioContext, playNote } from './audio.js';
import { startPitchDetection } from './pitch.js';
import { readControls, saveSettings, loadSettings } from './settings.js';
import { renderFingerboard, hitTest, drawLiveMarker } from './fingerboard.js';
import { renderStaffNote } from './staff.js';
import { renderLegend } from './legend.js';
import { initSidebar } from './sidebar.js';

const $ = (id) => document.getElementById(id);

let isListening = false;

function updateDiagram() {
    const { stringCount, tuningKey, rootNote, mode, typeIdx } = readControls();
    const tuning = getTuning(tuningKey, stringCount);
    const targetNotes = buildTargetNotes(rootNote, getModeItem(mode, typeIdx).steps);

    renderLegend($('legend'), targetNotes);
    renderFingerboard(tuning, rootNote, targetNotes);
    saveSettings();
}

function updateTypeOptions(selectedType) {
    const { mode } = readControls();
    const typeSelect = $('typeSelect');
    typeSelect.innerHTML = '';

    MODES_DATA[mode].forEach((item, index) => {
        typeSelect.appendChild(new Option(item.name, index));
    });
    if (selectedType !== undefined) typeSelect.value = selectedType;

    updateDiagram();
}

function applyStaffVisibility() {
    $('staff-container').hidden = !readControls().showStaff;
}

function handleBoardPointer(event) {
    event.preventDefault();
    getAudioContext();

    const { stringCount, tuningKey } = readControls();
    const hit = hitTest($('violin-svg'), event.clientX, event.clientY, stringCount);
    if (!hit) return;

    const freq = frequencyAt(getTuning(tuningKey, stringCount)[hit.string].f, hit.semitone);
    playNote(freq);
    renderStaffNote(freq);
}

function handlePitch(freq) {
    const { stringCount, tuningKey } = readControls();
    drawLiveMarker(freq, getTuning(tuningKey, stringCount));
    renderStaffNote(freq);
}

async function toggleMic() {
    if (isListening) {
        location.reload();
        return;
    }
    try {
        await startPitchDetection(handlePitch);
        isListening = true;
        const btn = $('micBtn');
        btn.textContent = "Parar";
        btn.style.background = "#2ecc71";
    } catch (e) {
        alert("Microfone não disponível.");
    }
}

function init() {
    const savedType = loadSettings();
    applyStaffVisibility();
    updateTypeOptions(savedType);

    const svg = $('violin-svg');
    svg.addEventListener('pointerdown', handleBoardPointer);
    svg.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

    $('analysisMode').addEventListener('change', () => updateTypeOptions());
    ['stringCount', 'tuningSelect', 'rootNote', 'typeSelect'].forEach(id => {
        $(id).addEventListener('change', updateDiagram);
    });
    $('showStaff').addEventListener('change', () => {
        applyStaffVisibility();
        saveSettings();
    });
    $('micBtn').addEventListener('click', toggleMic);
    initSidebar();
}

init();
