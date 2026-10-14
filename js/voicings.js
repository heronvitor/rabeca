import { requiredPitchClasses } from './chords.js';

const MAX_RESULTS = 12;
const MAX_MUTED = 1;

// Todas as combinações de casas (null = corda abafada) que só tocam notas permitidas
function combinations(options, index = 0, current = [], out = []) {
    if (index === options.length) {
        out.push([...current]);
        return out;
    }
    for (const fret of options[index]) {
        current.push(fret);
        combinations(options, index + 1, current, out);
        current.pop();
    }
    return out;
}

function score(frets) {
    const fretted = frets.filter(f => f !== null && f > 0);
    const minFret = fretted.length ? Math.min(...fretted) : 0;
    const span = fretted.length ? Math.max(...fretted) - minFret : 0;
    const muted = frets.filter(f => f === null).length;
    return minFret + span * 1.5 + muted * 4 + fretted.length * 0.3;
}

function bassPitchClass(frets, strings) {
    const i = frets.findIndex(f => f !== null);
    return (strings[i].idx + frets[i]) % 12;
}

// Digitações tocáveis do acorde no instrumento, da mais fácil para a mais difícil
export function findVoicings(chord, instrument) {
    const { strings, maxFret, maxSpan } = instrument;
    const allowed = new Set(chord.pitchClasses);
    if (chord.bass !== null) allowed.add(chord.bass);
    const required = requiredPitchClasses(chord, strings.length);

    const options = strings.map(st => {
        const frets = [null];
        for (let f = 0; f <= maxFret; f++) {
            if (allowed.has((st.idx + f) % 12)) frets.push(f);
        }
        return frets;
    });

    const valid = combinations(options).filter(frets => {
        if (frets.filter(f => f === null).length > MAX_MUTED) return false;

        const fretted = frets.filter(f => f !== null && f > 0);
        if (fretted.length && Math.max(...fretted) - Math.min(...fretted) > maxSpan) return false;

        const sounding = new Set(frets
            .map((f, i) => f === null ? null : (strings[i].idx + f) % 12)
            .filter(pc => pc !== null));
        if (!required.every(pc => sounding.has(pc))) return false;

        const bass = bassPitchClass(frets, strings);
        return chord.bass !== null ? bass === chord.bass : true;
    });

    return valid
        .map(frets => ({
            frets,
            score: score(frets) + (chord.bass === null && bassPitchClass(frets, strings) !== chord.root ? 2 : 0)
        }))
        .sort((a, b) => a.score - b.score)
        .slice(0, MAX_RESULTS)
        .map(v => v.frets);
}
