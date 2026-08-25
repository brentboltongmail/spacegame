import re

with open('index.html', 'r') as f:
    content = f.read()

# Add initial sync
init_sync = """
        // Observer to update minimized title for Objective window
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
            
            // Sync initially after a brief delay to ensure drag handle is created
            setTimeout(syncObjectiveTitle, 50);
        }
"""
content = re.sub(r'\s*// Observer to update minimized title.*?(?=\s*const dragStart = \(e\))', init_sync, content, flags=re.DOTALL)

with open('index.html', 'w') as f:
    f.write(content)
