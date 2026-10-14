const $ = (id) => document.getElementById(id);

export function initSidebar() {
    const sidebar = $('sidebar');
    const overlay = $('sidebar-overlay');
    const openBtn = $('settingsBtn');
    const closeBtn = $('closeSidebarBtn');

    const setOpen = (open) => {
        sidebar.classList.toggle('open', open);
        sidebar.setAttribute('aria-hidden', String(!open));
        openBtn.setAttribute('aria-expanded', String(open));
        overlay.hidden = !open;
        document.body.classList.toggle('sidebar-open', open);
        (open ? closeBtn : openBtn).focus();
    };

    openBtn.addEventListener('click', () => setOpen(true));
    closeBtn.addEventListener('click', () => setOpen(false));
    overlay.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) setOpen(false);
    });
}
