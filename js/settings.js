const STORAGE_KEY = 'violinAppSettings';

// Campos <select>, salvos pelo value
const SELECT_DEFAULTS = {
    stringCount: '4',
    tuningSelect: 'cavalo',
    rootNote: 'G',
    analysisMode: 'interval'
};

// A pauta é salva como 'staffVisible' (booleano); o antigo 'showStaff' ('true'/'false')
// é ignorado para que o novo padrão (oculta) valha também para quem já usava o app.
const STAFF_VISIBLE_DEFAULT = false;

const $ = (id) => document.getElementById(id);

// Lê os controles da página já convertidos para os tipos usados no app
export function readControls() {
    return {
        stringCount: parseInt($('stringCount').value),
        tuningKey: $('tuningSelect').value,
        rootNote: $('rootNote').value,
        mode: $('analysisMode').value,
        typeIdx: parseInt($('typeSelect').value),
        showStaff: $('showStaff').checked
    };
}

export function saveSettings() {
    const settings = {};
    Object.keys(SELECT_DEFAULTS).forEach(id => { settings[id] = $(id).value; });
    settings.typeSelect = $('typeSelect').value;
    settings.staffVisible = $('showStaff').checked;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// Aplica as configurações salvas aos controles. Retorna o typeSelect salvo,
// que só pode ser aplicado depois que as opções do modo forem geradas.
export function loadSettings() {
    $('showStaff').checked = STAFF_VISIBLE_DEFAULT;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return undefined;

    try {
        const settings = JSON.parse(saved);
        Object.entries(SELECT_DEFAULTS).forEach(([id, fallback]) => {
            $(id).value = settings[id] || fallback;
        });
        if (typeof settings.staffVisible === 'boolean') {
            $('showStaff').checked = settings.staffVisible;
        }
        return settings.typeSelect;
    } catch (e) {
        console.warn("Erro ao carregar configurações:", e);
        return undefined;
    }
}
