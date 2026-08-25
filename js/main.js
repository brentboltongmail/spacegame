document.addEventListener('DOMContentLoaded', () => {
    const sectorEl = document.getElementById('hud-sector');
    if (sectorEl) {
        const syncObjectiveTitle = () => {
            const box = document.getElementById('drag-sector-objective');
            if (box) {
                const label = box.querySelector('.drag-handle-label');
                if (label) {
                    label.innerText = sectorEl.innerText;
                }
            }
        };
        const observer = new MutationObserver(syncObjectiveTitle);
        observer.observe(sectorEl, { childList: true, characterData: true, subtree: true });
        
        // Sync after a brief delay to ensure drag handle is created
        setTimeout(syncObjectiveTitle, 500);
    }
});
