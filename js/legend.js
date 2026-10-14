export function renderLegend(container, targets) {
    container.innerHTML = '';
    const uniqueTargets = Array.from(new Set(targets.map(t => t.label)))
        .map(label => targets.find(t => t.label === label));

    uniqueTargets.forEach(t => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `<span class="dot" style="background:${t.color}"></span> ${t.label}`;
        container.appendChild(item);
    });
}
