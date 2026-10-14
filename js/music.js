import { CHROMATIC_SCALE, COLOR_MAP, MODES_DATA, TUNINGS } from './constants.js';

export function noteAt(chromaticIdx) {
    return CHROMATIC_SCALE[((chromaticIdx % 12) + 12) % 12];
}

export function getTuning(tuningKey, stringCount) {
    return TUNINGS[tuningKey].slice(0, stringCount);
}

export function getModeItem(mode, typeIdx) {
    return MODES_DATA[mode][typeIdx] || MODES_DATA[mode][0];
}

export function buildTargetNotes(rootNote, steps) {
    const rootIdx = CHROMATIC_SCALE.indexOf(rootNote);
    return steps.map(step => ({
        name: noteAt(rootIdx + step),
        color: COLOR_MAP[step % 12].color,
        label: COLOR_MAP[step % 12].label
    }));
}

export function frequencyAt(openFreq, semitones) {
    return openFreq * Math.pow(2, semitones / 12);
}
