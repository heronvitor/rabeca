export const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const COLOR_MAP = {
    0: { color: '#27ae60', label: 'Tônica (1)' },
    1: { color: '#e67e22', label: '2ª menor' },
    2: { color: '#e74c3c', label: '2ª maior' },
    3: { color: '#3498db', label: '3ª menor' },
    4: { color: '#3498db', label: '3ª maior' },
    5: { color: '#9b59b6', label: '4ª justa' },
    6: { color: '#95a5a6', label: 'Tritono' },
    7: { color: '#f1c40f', label: '5ª justa' },
    8: { color: '#d35400', label: '6ª menor' },
    9: { color: '#d35400', label: '6ª maior' },
    10: { color: '#e74c3c', label: '7ª menor' },
    11: { color: '#e74c3c', label: '7ª maior' },
    12: { color: '#2ecc71', label: 'Oitava' }
};

export const MODES_DATA = {
    interval: [
        { name: "2ª Menor", steps: [0, 1] },
        { name: "2ª Maior", steps: [0, 2] },
        { name: "3ª Menor", steps: [0, 3] },
        { name: "3ª Maior", steps: [0, 4] },
        { name: "4ª Justa", steps: [0, 5] },
        { name: "5ª Justa", steps: [0, 7] },
        { name: "6ª Maior", steps: [0, 9] },
        { name: "7ª Menor", steps: [0, 10] },
        { name: "7ª Maior", steps: [0, 11] },
        { name: "Oitava", steps: [0, 12] }
    ],
    chord: [
        { name: "Maior (M)", steps: [0, 4, 7] },
        { name: "Menor (m)", steps: [0, 3, 7] },
        { name: "Aumentado (aug)", steps: [0, 4, 8] },
        { name: "Diminuto (dim)", steps: [0, 3, 6] },
        { name: "Sétima Dominante (7)", steps: [0, 4, 7, 10] },
        { name: "Sétima Maior (7M)", steps: [0, 4, 7, 11] },
        { name: "Menor com 7ª (m7)", steps: [0, 3, 7, 10] }
    ],
    scale: [
        { name: "Maior", steps: [0, 2, 4, 5, 7, 9, 11] },
        { name: "Menor Natural", steps: [0, 2, 3, 5, 7, 8, 10] },
        { name: "Menor Melódica", steps: [0, 2, 3, 5, 7, 9, 11] },
        { name: "Mixolídio", steps: [0, 2, 4, 5, 7, 9, 10] },
        { name: "Lídio b7", steps: [0, 2, 4, 6, 7, 9, 10] },
        { name: "Dórico", steps: [0, 2, 3, 5, 7, 9, 10] },
        { name: "Pentatônica Maior", steps: [0, 2, 4, 7, 9] },
        { name: "Pentatônica Menor", steps: [0, 3, 5, 7, 10] },
    ]
};

export const TUNINGS = {
    standard: [{name:'C',idx:0,f:130.8},{name:'G',idx:7,f:196.0},{name:'D',idx:2,f:293.6},{name:'A',idx:9,f:440.0},{name:'E',idx:4,f:659.2}],
    cavalo: [{name:'D',idx:2,f:146.8},{name:'A',idx:9,f:220.0},{name:'E',idx:4,f:329.6},{name:'B',idx:11,f:493.8},{name:'F#',idx:6,f:739.9}]
};

// Posição vertical (y) de cada semitom no braço; 0 = corda solta (pestana)
export const POSITIONS = { 0:20, 1:65, 2:110, 3:155, 4:200, 5:255, 6:305, 7:355 };
export const MAX_SEMITONE = 7;
export const X_COORDS = [40, 70, 100, 130, 160];
export const STRING_WIDTHS = [4, 3, 2, 1.5, 1];

// Deslocamento do <g transform="translate(30, 40)"> do braço
export const BOARD_OFFSET = { x: 30, y: 40 };
