const STORAGE_KEY = 'violinAppSettings';

const DEFAULTS = {
    stringCount: '4',
    tuningSelect: 'cavalo',
    rootNote: 'G',
    analysisMode: 'interval',
    typeSelect: undefined,
    showStaff: 'true'
};

const FIELDS = Object.keys(DEFAULTS);

const $ = (id) => document.getElementById(id);

// Lê os controles da página já convertidos para os tipos usados no app
export function readControls() {
    return {
        stringCount: parseInt($('stringCount').value),
        tuningKey: $('tuningSelect').value,
        rootNote: $('rootNote').value,
        mode: $('analysisMode').value,
        typeIdx: parseInt($('typeSelect').value),
        showStaff: $('showStaff').value === 'true'
    };
}

export function saveSettings() {
    const settings = {};
    FIELDS.forEach(id => { settings[id] = $(id).value; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// Aplica as configurações salvas aos controles. Retorna o typeSelect salvo,
// que só pode ser aplicado depois que as opções do modo forem geradas.
export function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return undefined;

    try {
        const settings = { ...DEFAULTS, ...JSON.parse(saved) };
        FIELDS.filter(id => id !== 'typeSelect').forEach(id => {
            $(id).value = settings[id] || DEFAULTS[id];
        });
        return settings.typeSelect;
    } catch (e) {
        console.warn("Erro ao carregar configurações:", e);
        return undefined;
    }
}
