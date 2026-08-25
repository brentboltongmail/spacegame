import re

with open('index.html', 'r') as f:
    content = f.read()

# Remove the previously injected observer script
bad_script = """
        // Observer to update minimized title for Objective window
        const sectorEl = document.getElementById('hud-sector');
        if (sectorEl) {
            const observer = new MutationObserver((mutations) => {
                const box = document.getElementById('drag-sector-objective');
                if (box) {
                    const label = box.querySelector('.drag-handle-label');
                    if (label) {
                        label.innerText = sectorEl.innerText;
                    }
                }
            });
            observer.observe(sectorEl, { childList: true, characterData: true, subtree: true });
        }
"""
content = content.replace(bad_script, '')

# Inject it after the boxes.forEach loop (e.g. before "function dragStart(e)")
good_script = bad_script + "\n            const dragStart = (e) => {"

content = content.replace("const dragStart = (e) => {", good_script)

with open('index.html', 'w') as f:
    f.write(content)
