// Cor por função da nota no acorde, nas mesmas famílias de cor da página da rabeca
export const DEGREE_FUNCTIONS = [
    { key: 'root', label: 'Tônica (1)', color: '#27ae60', text: 'white' },
    { key: 'third', label: '3ª (3, b3)', color: '#3498db', text: 'white' },
    { key: 'sus', label: 'Suspensão (2, 4)', color: '#9b59b6', text: 'white' },
    { key: 'fifth', label: '5ª (5, b5, #5)', color: '#f1c40f', text: '#2c3e50' },
    { key: 'sixth', label: '6ª (6)', color: '#d35400', text: 'white' },
    { key: 'seventh', label: '7ª (7, b7, bb7)', color: '#e74c3c', text: 'white' },
    { key: 'extension', label: 'Extensão (9, 11, 13)', color: '#e67e22', text: 'white' },
    { key: 'other', label: 'Fora do acorde (baixo)', color: '#95a5a6', text: 'white' }
];

const BY_KEY = Object.fromEntries(DEGREE_FUNCTIONS.map(f => [f.key, f]));

// "b7" → função "seventh"; o número sem acidentes define a função
function functionKey(degree, inChord) {
    if (!inChord) return 'other';
    const number = parseInt(degree.replace(/[b#]/g, ''));
    if (number === 1) return 'root';
    if (number === 3) return 'third';
    if (number === 2 || number === 4) return 'sus';
    if (number === 5) return 'fifth';
    if (number === 6) return 'sixth';
    if (number === 7) return 'seventh';
    return 'extension';
}

export function degreeStyle(degree, inChord = true) {
    return BY_KEY[functionKey(degree, inChord)];
}
